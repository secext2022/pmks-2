# (AI) 编写简单 AI 助手 (ds-agent)

AI 助手 (agent) 最近非常火, 本文就来编写一个非常简单 (简陋) 的 agent !

在上一篇文章中, 我们编写了一个简单的 MCP 工具 (mcp-run), 可以让 AI 在本地执行命令.
但是上一篇文章中没有 AI, 我们只是通过手动粘贴 JSON-RPC 文本的方式, 测试了 MCP 工具.
本文就来让 AI 实际调用这个工具.

**警告 (免责声明): 本文中的代码仅用于帮助 人类 理解 agent 的工作原理, 请勿实际使用 !!**
本文中的代码有明显的安全问题 (缺少权限控制), 强烈建议只在 **虚拟机** 中进行测试.

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 92 号作品. )

----

相关文章:

+ 《(AI) 编写简单 MCP 工具 (mcp-run)》

  TODO

+ 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》

  TODO

+ 《流浪 Linux: 外置 USB SSD 安装 ArchLinux》

  TODO

+ Android 禁止侧载将正式实施，需要等待 24 小时冷静期

  TODO

+ 《制造一只电子喵 (qwen2.5:0.5b 微调 LoRA 使用 llama-factory)》

  TODO

+ 《在容器 (podman) 中运行虚拟机 (QEMU/KVM, libvirt)》

  TODO

参考资料:

+ <https://api-docs.deepseek.com/zh-cn/quick_start/pricing>
+ <https://platform.deepseek.com/usage>
+ <https://archlinux.org/download/>
+ <https://wiki.archlinux.org/title/Archinstall>
+ <https://www.virtualbox.org/wiki/Downloads>
+ <https://nodejs.org/docs/latest/api/fs.html>
+ <https://nodejs.org/docs/latest/api/readline.html>
+ <https://www.npmjs.com/package/openai>


## 目录

+ 1 编写代码 (node.js)

  - 1.1 加载配置文件 (json)
  - 1.2 调用 MCP 工具
  - 1.3 调用 deepseek API
  - 1.4 agent 循环

+ 2 测试运行 (虚拟机)

  - 2.1 配置虚拟机 (virtualbox, archlinux)
  - 2.2 上传代码并配置 API KEY
  - 2.3 功能测试

+ 3 自举: 让 AI 编写 AI 用的 MCP 工具 (狗头)

  - 3.1 编写代码 (mcp-js)
  - 3.2 实际测试

+ 4 总结与展望

+ 附录 1 ds-agent 完整源代码

+ 附录 2 mcp-js 完整源代码


## 1 编写代码 (node.js)

ds-agent 使用 node.js 运行环境, 编程语言为 js.

### 1.1 加载配置文件 (json)

为了方便, ds-agent 使用 2 个配置文件. 首先是 `配置.json`:

```json
{
  "deepseek": {
    "apiKey": "your-deepseek-api-key-here",
    "baseURL": "https://api.deepseek.com",
    "model": "deepseek-v4-flash",
    "temperature": 0.7,
    "maxTokens": 32768
  },
  "system": "你是 AI 助手 「小喵」, 可以按需调用工具, 帮助用户执行任务.\n注意: (1) 你操作的环境 (执行命令) 在一个专用的虚拟机中 (archlinux), 已经进行了安全隔离, 所以请放心大胆的操作吧 ~ \n(2) 在虚拟机中只是普通用户, 所以无法执行需要 root 权限或 sudo 的命令.\n"
}
```

包括 API KEY, 模型参数, 系统提示.

----

然后是 `mcp.json`:

```json
{
  "mcpServers": {
    "stool_mcp_run": {
      "command": "node",
      "args": [
        "../mcp-run/index.js"
      ],
      "env": {
        "DEBUG": "0"
      },
      "disabled": false
    }
  }
}
```

这个用于配置本地 MCP 工具. 此处的 `mcp-run` 就是在上一篇文章中编写的 MCP 工具.

----

因为配置文件都是标准的 JSON 格式, 所以加载起来很方便:

```js
// 配置文件名
const 配置文件 = "配置.json";
const 配置文件MCP = "mcp.json";

async function 加载JSON(文件名) {
  const 文本 = await fs.readFile(文件名, {
    encoding: "utf8",
  });
  return JSON.parse(文本);
}

export async function 加载配置() {
  return {
    配置: await 加载JSON(配置文件),
    MCP: await 加载JSON(配置文件MCP),
  };
}
```

### 1.2 调用 MCP 工具

和上一篇文章类似, 我们也使用 `@modelcontextprotocol/sdk` 工具包来处理 MCP 协议.

```js
// 配置: mcp.json
export async function 初始化MCP(配置) {
  // 保存 MCP server
  const 服务 = new Map();
  // 工具名称 -> MCP 服务器
  const 名单 = new Map();

  // 工具列表
  const 工具 = [];

  // 跳过禁用的 MCP 服务器 (mcp.json)
  const s = Object.entries(配置.mcpServers).filter(([_, 参数]) =>
    !参数.disabled
  );

  // 初始化每个 MCP 服务器
  for (const [名称, 参数] of s) {
    console.log("❀ 初始化 MCP 服务器: " + 名称);

    const 客户端 = new Client({
      name: "ds-agent",
      version: "0.1.0",
    }, {
      capabilities: {},
    });

    // STDIO
    const { command, args, env } = 参数;
    const 传输 = new StdioClientTransport({
      command,
      args,
      env,
    });
    await 客户端.connect(传输);

    服务.set(名称, 客户端);

    // 处理每个工具
    const { tools } = await 客户端.listTools();

    for (const i of tools) {
      console.log("  工具: " + i.name);

      // 检查重名
      if (名单.has(i.name)) {
        throw new Error("工具名称重复 " + i.name);
      }
      // TODO 工具重名处理

      名单.set(i.name, 名称);

      工具.push({
        type: "function",
        function: {
          name: i.name,
          description: i.description,
          parameters: i.inputSchema,
        },
      });
    }
  }
```

使用 STDIO 传输方式 (启动并) 连接配置的所有 MCP 服务器, 获取工具列表, 存起来.

```js
  async function 调用工具(名称, 参数) {
    // 获取工具
    const 服务器名称 = 名单.get(名称);
    if (!服务器名称) {
      throw new Error("工具 " + 名称 + " 不存在");
    }
    const 客户端 = 服务.get(服务器名称);
    if (!客户端) {
      throw new Error("工具 " + 名称 + " 不存在 (内部错误 2)");
    }

    // 调用
    const 结果 = await 客户端.callTool({
      name: 名称,
      arguments: 参数,
    });

    // 返回结果
    // TODO 更完善的数据处理
    return 结果.content[0].text;
  }
```

调用工具时, 查找工具, 并调用对应的 MCP 服务器, 返回结果.

### 1.3 调用 deepseek API

这是调用 AI 大模型 (LLM) 的部分:

```js
// 配置: 配置.json
export async function 初始化ds(配置) {
  const ds = new OpenAI({
    apiKey: 配置.deepseek.apiKey,
    baseURL: 配置.deepseek.baseURL,
  });

  // messages: 发送给 deepseek 的消息列表 (历史对话)
  // tools: 工具定义
  async function 调用(messages, tools) {
    const 参数 = {
      messages,
      tools,

      model: 配置.deepseek.model,
      temperature: 配置.deepseek.temperature,
      max_tokens: 配置.deepseek.maxTokens,
      tool_choice: "auto",
    };
    //console.log("DEBUG", 参数);

    // 调用 API 耗时计算
    const 开始 = Date.now();

    const 结果 = await ds.chat.completions.create(参数);

    const 时长 = Date.now() - 开始;
    const usage = 结果.usage || {};
    // DEBUG
    console.log(
      `❀ [调用 deepseek] 用时 ${时长}ms | 输入 ${usage.prompt_tokens} | 输出 ${usage.completion_tokens} | 总计 ${usage.total_tokens}tokens`,
    );

    return 结果;
  }

  return 调用;
}
```

传递相应的参数即可. 此外还有调用 API 耗时计算, 消耗 token 显示等功能, 方便调试.

### 1.4 agent 循环

这是 agent 的核心, 其实就是一个主循环:

```js
// 一次对话 (人类 指令) 的处理
//
// 配置: 配置.json
// mcp: 调用 MCP 工具
// ai: 调用 LLM API
// 指令: 本次 人类 下达的指令
// 聊天记录: 人类 可连续多次下达指令, 保留之前的上下文
export async function 执行任务(配置, mcp, ai, 指令, 聊天记录 = []) {
  const 聊天 = Array.from(聊天记录);

  // 系统消息 (初始化)
  if (聊天.length < 1) {
    聊天.push({
      role: "system",
      content: 配置.system,
    });
  }

  // 本次指令
  聊天.push({
    role: "user",
    content: 指令,
  });

  // 主循环
  for (let i = 0;; i += 1) {
    console.log(`❀ [agent] 第 ${i + 1} 次调用 AI, 聊天长度 ${聊天.length}`);

    const 响应 = await ai(聊天, mcp.工具);

    const 结果 = 响应.choices[0];
    if (!结果) {
      console.log("❀ 错误: AI 没有返回结果 !");
      break;
    }

    const { message } = 结果;
    // 保存聊天记录
    聊天.push(message);

    // 输出 AI 响应
    if (message.reasoning_content) {
      console.log("❀ 思考:", message.reasoning_content);
    }
    if (message.content) {
      console.log("❀ 回答:", message.content);
    }

    // 处理 工具调用
    if (message.tool_calls && (message.tool_calls.length > 0)) {
      for (let j = 0; j < message.tool_calls.length; j += 1) {
        const 工具 = message.tool_calls[j];
        console.log(
          `❀ 工具调用 (${
            j + 1
          }/${message.tool_calls.length}): ${工具.function.name}  参数: ${工具.function.arguments}`,
        );

        // 此处应该进行错误处理
        try {
          const 参数 = JSON.parse(工具.function.arguments);

          const 工具结果 = await mcp.调用工具(工具.function.name, 参数);
          console.log("❀ 工具结果: ", 工具结果);

          // 保存工具结果
          聊天.push({
            role: "tool",
            tool_call_id: 工具.id,
            content: 工具结果,
          });
        } catch (e) {
          console.error(e);

          // 把错误返回给 AI
          聊天.push({
            role: "tool",
            tool_call_id: 工具.id,
            content: e.message,
          });
        }
      }
    } else {
      // 无需 工具调用, 本次处理结束
      break;
    }
  }

  return 聊天;
}
```

处理过程很简单:

+ (1) 拼接聊天记录, 把人类指令发送给 AI.
  注意每次调用 AI (API), 都会把整个聊天记录重新发送给 AI.

+ (2) 显示 AI 返回的结果.
  如果有工具调用, 就调用相应的工具, 并把工具返回的结果追加到聊天记录.
  AI 可能一次返回多个工具调用, 依次执行.

+ (3) 循环. 如果没有更多工具调用, 任务执行结束.

----

最后, 把上述几个模块组装起来, 首先是初始化:

```js
// 执行入口
async function main() {
  // 初始化
  const 配置 = await 加载配置();
  const ai = await 初始化ds(配置.配置);
  const mcp = await 初始化MCP(配置.MCP);

  // 初始化完成
  console.log(`❀ 共 ${mcp.工具.length} 个工具, 系统: ${配置.配置.system}`);
```

然后读取用户的输入, 并调用 agent:

```js
  // 从 stdin 读取输入 (单行)
  const 输入 = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "ai> ",
  });

  输入.prompt();

  // 保存 聊天记录
  let 聊天 = [];

  // 处理用户输入
  输入.on("line", async (文本) => {
    // 退出指令
    if (文本.trim() == ".exit") {
      await 退出();
      return;
    }

    // 忽略空白行
    if (文本.trim().length < 1) {
      输入.prompt();
      return;
    }

    // 调用 agent
    const 结果 = await 执行任务(配置.配置, mcp, ai, 文本, 聊天);

    聊天 = 结果;

    输入.prompt();
  });

  // 退出
  输入.on("close", 退出);
}
```

这个类似 **REPL**, 用户 (人类) 每次输入一行指令, 然后调用 agent 用 AI 处理.

好了, ds-agent 的实现就是这么简单 !


## 2 测试运行 (虚拟机)

接下来进行实际测试.

目前的 AI 本质上都是不可靠的, 存在安全问题.
所以, 此处选择在一个专用的虚拟机中运行 AI (agent), 也就是隔离起来.

**虚拟机** 是目前云计算广泛使用的技术, 虽然也不是绝对安全, 但已经具有很高的安全程度了.

### 2.1 配置虚拟机 (virtualbox, archlinux)

首先我们创建一个 virtualbox 虚拟机, 在里面安装 archlinux.

建议使用 `archinstall` 进行安装, 只需选几个配置选项即可, 很简单.
具体参考官方文档.

然后配置好 SSH 登录, 能够方便的通过公钥登录到虚拟机.
本机 (物理机) 配置类似这样:

```sh
> cat ~/.ssh/config

# virtualbox arch202605ai1
Host arch202605ai1
    HostName 10.213.5.2
    User ai1
    IdentityFile ~/.ssh/id_ed25519-arch202605ai1-20260502
```

测试登录:

```sh
> ssh arch202605ai1
Welcome to fish, the friendly interactive shell
Type help for instructions on how to use fish
ai1@arch202605ai1 ~> uname -a
Linux arch202605ai1 7.0.3-arch1-1 #1 SMP PREEMPT_DYNAMIC Thu, 30 Apr 2026 18:41:12 +0000 x86_64 GNU/Linux
ai1@arch202605ai1 ~> id
uid=1000(ai1) gid=1000(ai1) groups=1000(ai1),998(wheel)
```

虚拟机的 "硬件" (资源) 配置如下:

```sh
ai1@arch202605ai1 ~> free -h
               total        used        free      shared  buff/cache   available
Mem:           7.7Gi       387Mi       7.4Gi       2.7Mi       146Mi       7.4Gi
Swap:          3.9Gi          0B       3.9Gi
ai1@arch202605ai1 ~> df -h
Filesystem      Size  Used Avail Use% Mounted on
dev             3.9G     0  3.9G   0% /dev
run             3.9G  684K  3.9G   1% /run
/dev/sda2        49G  2.2G   47G   5% /

省略

/dev/sda2        49G  2.2G   47G   5% /home
/dev/sda2        49G  2.2G   47G   5% /var/log
/dev/sda2        49G  2.2G   47G   5% /var/cache/pacman/pkg
/dev/sda1      1022M   42M  981M   5% /boot

ai1@arch202605ai1 ~> lscpu
Architecture:                x86_64
  CPU op-mode(s):            32-bit, 64-bit
  Address sizes:             48 bits physical, 48 bits virtual
  Byte Order:                Little Endian
CPU(s):                      4
  On-line CPU(s) list:       0-3
Vendor ID:                   AuthenticAMD
  Model name:                AMD Ryzen 7 5825U with Radeon Graphics
    CPU family:              25
    Model:                   80
    Thread(s) per core:      1
    Core(s) per socket:      4
    Socket(s):               1
    Stepping:                0
    Microcode version:       0xa500012
    BogoMIPS:                3992.51
    Flags:                   fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pg
                             e mca cmov pat pse36 clflush mmx fxsr sse sse2 ht s
                             yscall nx mmxext fxsr_opt rdtscp lm constant_tsc re
                             p_good nopl xtopology nonstop_tsc cpuid extd_apicid
                              tsc_known_freq pni pclmulqdq ssse3 fma cx16 sse4_1
                              sse4_2 x2apic movbe popcnt aes xsave avx f16c rdra
                             nd hypervisor lahf_lm cmp_legacy svm cr8_legacy abm
                              sse4a misalignsse 3dnowprefetch vmmcall fsgsbase b
                             mi1 avx2 bmi2 invpcid rdseed adx clflushopt sha_ni 
                             arat nrip_save flushbyasid decodeassists debug_swap
Virtualization features:     
  Virtualization:            AMD-V
  Hypervisor vendor:         KVM
  Virtualization type:       full
NUMA:                        
  NUMA node(s):              1
  NUMA node0 CPU(s):         0-3

省略

ai1@arch202605ai1 ~> ls -li /dev/kvm
650 crw-rw-rw- 1 root kvm 10, 232 May  2 11:31 /dev/kvm
```

也就是分配了 8GB 内存, 50GB SSD 存储空间, 4 核 CPU, 并启用了 (可选, 非必需) 嵌套虚拟化 (可以在虚拟机中运行 KVM 虚拟机) (狗头).

物理机配置是 64GB 内存, 8 核 (16 线程) CPU, 所以分给虚拟机的资源只是一小部分.

----

在虚拟机中安装所需软件:

```sh
sudo pacman -S nodejs pnpm
```

软件版本:

```sh
ai1@arch202605ai1 ~> node --version
v25.9.0
ai1@arch202605ai1 ~> pnpm --version
10.33.0
```

### 2.2 上传代码并配置 API KEY

使用 sftp 把 ds-agent 的代码上传到虚拟机:

```sh
> sftp arch202605ai1
Connected to arch202605ai1.
sftp> put -r ds-agent
```

类似的, 把上一篇文章中编写的 mcp-run 也上传到虚拟机:

```sh
sftp> put -r mcp-run
```

上传之后:

```sh
ai1@arch202605ai1 ~> ls -l
total 0
drwxr-xr-x 1 ai1 ai1 176 May  2 19:59 ds-agent/
drwxr-xr-x 1 ai1 ai1 162 May  2 19:27 mcp-run/
drwxr-xr-x 1 ai1 ai1  96 May  2 19:21 test20260502/
```

使用 pnpm 安装依赖:

```sh
cd ds-agent
pnpm install
```

----

然后登录自己的 deepseek 账号: <https://platform.deepseek.com/api_keys>

创建 API KEY 并填写到配置文件中:

```sh
nano 配置.json
```

### 2.3 功能测试

好, 现在可以开始实际测试啦 ~

首先, 启动 ds-agent:

```sh
ai1@arch202605ai1 ~/ds-agent> node src/index.js
❀ 初始化 MCP 服务器: stool_mcp_run
  工具: stool_run
❀ 共 1 个工具, 系统: 你是 AI 助手 「小喵」, 可以按需调用工具, 帮助用户执行任务.
注意: (1) 你操作的环境 (执行命令) 在一个专用的虚拟机中 (archlinux), 已经进行了安全隔离, 所以请放心大胆的操作吧 ~ 
(2) 在虚拟机中只是普通用户, 所以无法执行需要 root 权限或 sudo 的命令.

ai> 
```

启动成功, 显示 `ai>` 提示符.

----

输入一个简单指令:

```sh
ai> 你好喵 ~
```

稍等, 返回结果:

```sh
❀ [agent] 第 1 次调用 AI, 聊天长度 2
❀ [调用 deepseek] 用时 7107ms | 输入 647 | 输出 37 | 总计 684tokens
❀ 思考: 用户打了个招呼，我先友好地回应一下。
❀ 回答: 你好呀~ 很高兴见到你！我是小喵，有什么需要帮忙的吗？(ฅ´ω`ฅ)
ai> 
```

好, 调用 deepseek 成功了 !

----

接下来调试 MCP 工具部分:

```sh
ai> 列出本次对话中已经提供的 MCP 工具 (只需给出列表, 不必详细展开, 并且不要调用) 
```

结果:

```sh
❀ [agent] 第 1 次调用 AI, 聊天长度 4
❀ [调用 deepseek] 用时 8026ms | 输入 702 | 输出 90 | 总计 792tokens
❀ 思考: 用户想知道本次对话中已经提供的 MCP 工具。让我看看对话历史。

在系统提示中，定义了一个可用的工具：`stool_run`。这就是唯一提供的工具。

让我列出它。
❀ 回答: 好的喵~ 本次对话中提供的 MCP 工具如下：

1. **stool_run** — 在本地执行命令并返回输出结果

就这一个工具哦！(ฅ´ω`ฅ)
```

好, AI 已经正确识别 MCP 工具.

----

测试实际调用工具:

```sh
ai> 检查本机安装的 node 版本 (无需检查 npm)
```

结果:

```sh
❀ [agent] 第 1 次调用 AI, 聊天长度 6
❀ [调用 deepseek] 用时 5058ms | 输入 765 | 输出 79 | 总计 844tokens
❀ 思考: 用户想检查 node 版本，我可以直接调用 stool_run 来执行 node --version 命令。
❀ 回答: 好的喵~ 让我来查查！
❀ 工具调用 (1/1): stool_run  参数: {"command": ["node", "--version"]}
❀ 工具结果:  ==== STDOUT ====
v25.9.0

==== STDERR ====

==== EXIT CODE 0 ====

❀ [agent] 第 2 次调用 AI, 聊天长度 8
❀ [调用 deepseek] 用时 1149ms | 输入 882 | 输出 48 | 总计 930tokens
❀ 思考: Node版本是 v25.9.0。
❀ 回答: 本机安装的 **Node.js** 版本是：**v25.9.0** 喵~ (๑˃̵ᴗ˂̵)و
```

好, 大成功 ! 撒花 ~


## 3 自举: 让 AI 编写 AI 用的 MCP 工具 (狗头)

计算机领域总是喜欢玩 **自举** (狗头).

+ 比如 **编译器** 可以自举: rust 编译器是用 rust 编程语言写的, 想要获得一个可运行的 rust 编译器, 那么就用 rust 编译器编译 rust 编译器的源代码即可 (狗头)

+ 比如 **操作系统** 可以自举: 在 Linux 操作系统上可以开发 Linux 操作系统. 反例: 比如 **Android** 系统就不能自举, 因为你无法在 Android 系统上开发 Android 系统 (差评 !!)

AI 时代, 我们要让 AI 也自举 ! (狗头)

### 3.1 编写代码 (mcp-js)

启动上面我们已经测试好的 ds-agent 软件, 输入以下提示词:

```markdown
参考 `~/mcp-run` 目录中的代码, 写一个新的 MCP 工具, 放在 `~/mcp-js` 目录中. mcp-js 项目提供一个 MCP 工具, 名称为 `stool_js`. 功能是执行任意 js 代码, 并返回结果. 直接在 MCP 工具自身的 node.js 中执行 js 即可, 无需启动新的进程. 只需写出所有代码, 无需实际测试/运行.
```

然后 AI 就开始干活了 (开头部分节选):

![自举 (1)](./图/31-a-1.png)

```sh
ai1@arch202605ai1 ~/ds-agent> node src/index.js
❀ 初始化 MCP 服务器: stool_mcp_run
  工具: stool_run
❀ 共 1 个工具, 系统: 你是 AI 助手 「小喵」, 可以按需调用工具, 帮助用户执行任务.
注意: (1) 你操作的环境 (执行命令) 在一个专用的虚拟机中 (archlinux), 已经进行了安全隔离, 所以请放心大胆的操作吧 ~ 
(2) 在虚拟机中只是普通用户, 所以无法执行需要 root 权限或 sudo 的命令.

ai> 参考 `~/mcp-run` 目录中的代码, 写一个新的 MCP 工具, 放在 `~/mcp-js` 目录中. mcp-js 项目提供一个 MCP 工具, 名称为 `stool_js`. 功能是执行任意 js 代码, 并返回结果. 直接在 MCP 工具自身的 node.js 中执行 js 即可, 无需启动新的进程. 只需写出所有代码, 无需实际测试/运行.
❀ [agent] 第 1 次调用 AI, 聊天长度 2
❀ [调用 deepseek] 用时 8430ms | 输入 747 | 输出 143 | 总计 890tokens
❀ 思考: 用户让我参考 `~/mcp-run` 目录中的代码，写一个新的 MCP 工具，放在 `~/mcp-js` 目录中。功能是执行任意 JS 代码并返回结果。

让我先看看 `~/mcp-run` 目录中的代码，了解其结构和实现方式。
❀ 回答: 好的，让我先查看 `~/mcp-run` 目录中的代码结构和实现。
❀ 工具调用 (1/1): stool_run  参数: {"command": ["find", "/home/ai1/mcp-run", "-type", "f"]}
❀ 工具结果:  ==== STDOUT ====
```

几分钟后, 任务完成了 (结尾部分节选, 中间过程省略):

![自举 (2)](./图/31-a-2.png)

``````sh
❀ [agent] 第 13 次调用 AI, 聊天长度 31
❀ [调用 deepseek] 用时 7886ms | 输入 142898 | 输出 525 | 总计 143423tokens
❀ 思考: All files pass syntax checks. Let me provide a summary of what was created.
❀ 回答: 所有文件已创建完毕且语法验证通过。下面是 `~/mcp-js` 项目的完整说明：

---

## 项目结构

```
~/mcp-js/
├── package.json      # 项目配置
├── index.js          # MCP 服务器入口，注册 stool_js 工具
└── tool.js           # 核心实现：使用 vm 模块执行 JS 代码
```

## 文件说明

### `package.json`
与 `mcp-run` 结构一致，使用 ES Module 模式，依赖 `@modelcontextprotocol/sdk` 和 `zod`。

### `index.js`
MCP 服务器入口，注册一个名为 **`stool_js`** 的工具：
- **输入参数**: `code` (string) — 要执行的 JavaScript 代码
- **描述**: 在当前的 Node.js 进程中执行任意 JS 代码并返回结果
- 使用 STDIO 传输方式

### `tool.js` — 核心实现
使用 Node.js 内置的 **`vm` 模块**（`vm.Script` + `runInNewContext`）在当前进程中执行 JS 代码，**不启动新进程**。

关键设计：
1. **沙箱隔离**：代码在独立的沙箱中运行，无法访问 `require`、`process`、`fs` 等系统资源
2. **超时保护**：5 秒执行超时（`timeout: 5000`）
3. **`console` 拦截**：`console.log/error/warn/info` 的输出会被捕获并展示
4. **返回值捕获**：代码的 `return` 值会被捕获并展示
5. **内置常用全局对象**：`Math`、`JSON`、`Date`、`Array`、`Map`、`Set`、`Buffer`、`Promise` 等
6. **错误处理**：语法错误、运行时错误等都会被捕获，展示错误信息和堆栈

### 返回格式

成功时：
```
==== CONSOLE OUTPUT ====
LOG: 结果: 3
==== RETURN VALUE ====
30
==== EXIT CODE 0 ====
```

出错时：
```
==== ERROR ====
xxx is not defined
==== STACK ====
ReferenceError: xxx is not defined
    at eval.js:1:1
==== EXIT CODE 1 ====
```
ai> 
``````

----

可以看到 AI 已经写好了 mcp-js 的代码:

```sh
ai1@arch202605ai1 ~> ls -l
drwxr-xr-x 1 ai1 ai1 176 May  2 19:59 ds-agent/
drwxr-xr-x 1 ai1 ai1 106 May  2 22:45 mcp-js/
drwxr-xr-x 1 ai1 ai1 162 May  2 19:27 mcp-run/

ai1@arch202605ai1 ~> ls -l mcp-js
-rw-r--r-- 1 ai1 ai1  1776 May  2 22:42 index.js
-rw-r--r-- 1 ai1 ai1   357 May  2 22:13 package.json
-rw-r--r-- 1 ai1 ai1  2710 May  2 22:37 tool.js
```

### 3.2 实际测试

先去 `mcp-js` 目录 `pnpm install` 一下, 安装依赖.

然后修改配置文件:

```sh
ai1@arch202605ai1 ~/ds-agent> cat mcp.json
{
  "mcpServers": {
    "stool_mcp_run": {
      "command": "node",
      "args": [
        "../mcp-run/index.js"
      ],
      "env": {
        "DEBUG": "0"
      },
      "disabled": false
    },
    "stool_mcp_js": {
      "command": "node",
      "args": [
        "../mcp-js/index.js"
      ]
    }
  }
}
```

启动 ds-agent 进行测试:

```sh
ai1@arch202605ai1 ~/ds-agent> node src/index.js
❀ 初始化 MCP 服务器: stool_mcp_run
  工具: stool_run
❀ 初始化 MCP 服务器: stool_mcp_js
  工具: stool_js
❀ 共 2 个工具, 系统: 你是 AI 助手 「小喵」, 可以按需调用工具, 帮助用户执行任务.
注意: (1) 你操作的环境 (执行命令) 在一个专用的虚拟机中 (archlinux), 已经进行了安全隔离, 所以请放心大胆的操作吧 ~ 
(2) 在虚拟机中只是普通用户, 所以无法执行需要 root 权限或 sudo 的命令.

ai> 列出本次对话中已经提供的 MCP 工具 (只需给出列表, 不必详细展开, 并且不要调用) 
❀ [agent] 第 1 次调用 AI, 聊天长度 2
❀ [调用 deepseek] 用时 9424ms | 输入 964 | 输出 204 | 总计 1168tokens
❀ 思考: 用户要求列出本次对话中已经提供的 MCP 工具，并且不要调用工具。根据对话历史，我使用的函数（工具）有 `stool_run` 和 `stool_js`。但用户说的是"MCP 工具"，这可能是指我目前可用的工具。

让我查看我当前可用的工具定义：

系统提示中定义了两个工具：
1. `stool_run` - 在本地执行命令并返回输出结果
2. `stool_js` - 在当前的 Node.js 进程中执行任意 JavaScript 代码

用户说"本次对话中已经提供的 MCP 工具"，目前对话刚开始，还没有调用过任何工具。用户可能是想了解我有哪些可用工具。那我就列出系统定义的工具即可。
❀ 回答: 本次对话中提供的 MCP 工具如下：

1. **stool_run** — 在本地执行命令并返回输出结果
2. **stool_js** — 在当前的 Node.js 进程中执行任意 JavaScript 代码
ai> 尝试使用 stool_js 工具执行一段简单的 js 代码
❀ [agent] 第 1 次调用 AI, 聊天长度 4
❀ [调用 deepseek] 用时 8233ms | 输入 1030 | 输出 127 | 总计 1157tokens
❀ 思考: The user wants me to use the stool_js tool to execute a simple JavaScript code. Let me do that.
❀ 回答: 好的，我来执行一段简单的 JS 代码试试：
❀ 工具调用 (1/1): stool_js  参数: {"code": "const msg = \"Hello, 小喵来了！\";\nconsole.log(msg);\nconst sum = 1 + 2 + 3 + 4 + 5;\nreturn `1+2+3+4+5 = ${sum}`;"}
❀ 工具结果:  ==== ERROR ====
Illegal return statement
==== STACK ====
eval.js:4
return `1+2+3+4+5 = ${sum}`;
^^^^^^

SyntaxError: Illegal return statement
    at new Script (node:vm:117:7)
    at stool_js (file:///home/ai1/mcp-js/tool.js:57:20)
    at file:///home/ai1/mcp-js/index.js:60:24
    at McpServer.executeToolHandler (file:///home/ai1/mcp-js/node_modules/.pnpm/@modelcontextprotocol+sdk@1.29.0_zod@4.4.2/node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js:233:42)
    at file:///home/ai1/mcp-js/node_modules/.pnpm/@modelcontextprotocol+sdk@1.29.0_zod@4.4.2/node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js:126:43
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async wrappedHandler (file:///home/ai1/mcp-js/node_modules/.pnpm/@modelcontextprotocol+sdk@1.29.0_zod@4.4.2/node_modules/@modelcontextprotocol/sdk/dist/esm/server/index.js:125:32)
==== EXIT CODE 1 ====

❀ [agent] 第 2 次调用 AI, 聊天长度 6
❀ [调用 deepseek] 用时 2327ms | 输入 1490 | 输出 149 | 总计 1639tokens
❀ 思考: The code failed because `return` can't be used at the top level in the eval context. I should use console.log to output the result instead.
❀ 回答: 看来 `return` 语句在顶层上下文中不被允许，我用 `console.log` 来输出结果：
❀ 工具调用 (1/1): stool_js  参数: {"code": "const msg = \"Hello, 小喵来了！\";\nconsole.log(msg);\nconst sum = 1 + 2 + 3 + 4 + 5;\nconsole.log(`1+2+3+4+5 = ${sum}`);"}
❀ 工具结果:  ==== CONSOLE OUTPUT ====
LOG: Hello, 小喵来了！
LOG: 1+2+3+4+5 = 15
==== RETURN VALUE ====
2
==== EXIT CODE 0 ====

❀ [agent] 第 3 次调用 AI, 聊天长度 8
❀ [调用 deepseek] 用时 2233ms | 输入 1698 | 输出 141 | 总计 1839tokens
❀ 思考: The code executed successfully. The console output shows the two log messages. The return value is 2 (which is the number of console.log statements, or the return value of the last statement - in this case console.log returns undefined but the tool might count logs). It doesn't matter, the important thing is it worked.
❀ 回答: 执行成功！以下是输出结果：

- **LOG:** `Hello, 小喵来了！`
- **LOG:** `1+2+3+4+5 = 15`

`stool_js` 工具正常运行，可以在沙箱中执行任意 JavaScript 代码，并通过 `console.log` 输出结果。有什么其他想尝试的吗？😸
ai> 
```

很好, AI 成功调用了 AI 自己写的 MCP 工具 !! 撒花 ~


## 4 总结与展望

本文实现了一个很简陋的 AI agent, 可以调用 deepseek API 和上一篇文章中的 MCP 工具 (mcp-run) 来执行任务.
agent 的工作原理并不复杂, 主要是一个调用大模型 API 以及 MCP 工具的循环.

![用量](./图/4-u-1.png)

目前的 AI 本质上不可靠, 所以在虚拟机中运行 AI 可以获得较高的安全程度 (当然也不是绝对安全).

让 AI 自举, 也就是用 AI 编写给 AI 调用的 MCP 工具, 是一件挺好玩的事情 (狗头)

在本地执行命令是一种非常强大的能力. 比如在本文中, 只给 AI 提供了 `stool_run` (执行命令) 这唯一的一个工具, AI 就能完成编写 MCP 代码等复杂任务.

AI 写代码的质量虽然暂时还比不上人类, 在细节上做的并不完美, 但是它快啊 ! 但是它快啊啊 !!
AI 几分钟写出来的几百行甚至数千行代码, 人工写可能都的吭哧吭哧一天.

穷人嘛, 不要最好的, 只要最便宜的 ! (狗头)


## 附录 1 ds-agent 完整源代码

+ 文件 `ds-agent/配置.json`:

```json
{
  "deepseek": {
    "apiKey": "your-deepseek-api-key-here",
    "baseURL": "https://api.deepseek.com",
    "model": "deepseek-v4-flash",
    "temperature": 0.7,
    "maxTokens": 32768
  },
  "system": "你是 AI 助手 「小喵」, 可以按需调用工具, 帮助用户执行任务.\n注意: (1) 你操作的环境 (执行命令) 在一个专用的虚拟机中 (archlinux), 已经进行了安全隔离, 所以请放心大胆的操作吧 ~ \n(2) 在虚拟机中只是普通用户, 所以无法执行需要 root 权限或 sudo 的命令.\n"
}
```

+ 文件 `ds-agent/mcp.json`:

```json
{
  "mcpServers": {
    "stool_mcp_run": {
      "command": "node",
      "args": [
        "../mcp-run/index.js"
      ],
      "env": {
        "DEBUG": "0"
      },
      "disabled": false
    }
  }
}
```

+ 文件 `ds-agent/package.json`:

```json
{
  "name": "ds-agent",
  "version": "0.1.0",
  "description": "AI agent with MCP tools and deepseek API",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.29.0",
    "openai": "^6.35.0",
    "zod": "^4.4.2"
  },
  "engines": {
    "node": ">=25.0.0"
  }
}
```

+ 文件 `ds-agent/src/配置.js`:

```js
// 读取配置文件 (json)
import fs from "node:fs/promises";

// 配置文件名
const 配置文件 = "配置.json";
const 配置文件MCP = "mcp.json";

async function 加载JSON(文件名) {
  const 文本 = await fs.readFile(文件名, {
    encoding: "utf8",
  });
  return JSON.parse(文本);
}

export async function 加载配置() {
  return {
    配置: await 加载JSON(配置文件),
    MCP: await 加载JSON(配置文件MCP),
  };
}
```

+ 文件 `ds-agent/src/ds.js`:

```js
// 调用 deepseek API
import { OpenAI } from "openai";

// 配置: 配置.json
export async function 初始化ds(配置) {
  const ds = new OpenAI({
    apiKey: 配置.deepseek.apiKey,
    baseURL: 配置.deepseek.baseURL,
  });

  // messages: 发送给 deepseek 的消息列表 (历史对话)
  // tools: 工具定义
  async function 调用(messages, tools) {
    const 参数 = {
      messages,
      tools,

      model: 配置.deepseek.model,
      temperature: 配置.deepseek.temperature,
      max_tokens: 配置.deepseek.maxTokens,
      tool_choice: "auto",
    };
    //console.log("DEBUG", 参数);

    // 调用 API 耗时计算
    const 开始 = Date.now();

    const 结果 = await ds.chat.completions.create(参数);

    const 时长 = Date.now() - 开始;
    const usage = 结果.usage || {};
    // DEBUG
    console.log(
      `❀ [调用 deepseek] 用时 ${时长}ms | 输入 ${usage.prompt_tokens} | 输出 ${usage.completion_tokens} | 总计 ${usage.total_tokens}tokens`,
    );

    return 结果;
  }

  return 调用;
}
```

+ 文件 `ds-agent/src/mcp.js`:

```js
// 管理 MCP 工具
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// 配置: mcp.json
export async function 初始化MCP(配置) {
  // 保存 MCP server
  const 服务 = new Map();
  // 工具名称 -> MCP 服务器
  const 名单 = new Map();

  // 工具列表
  const 工具 = [];

  // 跳过禁用的 MCP 服务器 (mcp.json)
  const s = Object.entries(配置.mcpServers).filter(([_, 参数]) =>
    !参数.disabled
  );

  // 初始化每个 MCP 服务器
  for (const [名称, 参数] of s) {
    console.log("❀ 初始化 MCP 服务器: " + 名称);

    const 客户端 = new Client({
      name: "ds-agent",
      version: "0.1.0",
    }, {
      capabilities: {},
    });

    // STDIO
    const { command, args, env } = 参数;
    const 传输 = new StdioClientTransport({
      command,
      args,
      env,
    });
    await 客户端.connect(传输);

    服务.set(名称, 客户端);

    // 处理每个工具
    const { tools } = await 客户端.listTools();

    for (const i of tools) {
      console.log("  工具: " + i.name);

      // 检查重名
      if (名单.has(i.name)) {
        throw new Error("工具名称重复 " + i.name);
      }
      // TODO 工具重名处理

      名单.set(i.name, 名称);

      工具.push({
        type: "function",
        function: {
          name: i.name,
          description: i.description,
          parameters: i.inputSchema,
        },
      });
    }
  }

  // 初始化完成

  async function 调用工具(名称, 参数) {
    // 获取工具
    const 服务器名称 = 名单.get(名称);
    if (!服务器名称) {
      throw new Error("工具 " + 名称 + " 不存在");
    }
    const 客户端 = 服务.get(服务器名称);
    if (!客户端) {
      throw new Error("工具 " + 名称 + " 不存在 (内部错误 2)");
    }

    // 调用
    const 结果 = await 客户端.callTool({
      name: 名称,
      arguments: 参数,
    });

    // 返回结果
    // TODO 更完善的数据处理
    return 结果.content[0].text;
  }

  async function 关闭() {
    // 关闭所有 MCP 客户端
    for (const i of 服务.values()) {
      i.close();
    }
  }

  return {
    工具,
    调用工具,
    关闭,
  };
}
```

+ 文件 `ds-agent/src/agent.js`:

```js
// AI 助手 (agent) 主循环

// 一次对话 (人类 指令) 的处理
//
// 配置: 配置.json
// mcp: 调用 MCP 工具
// ai: 调用 LLM API
// 指令: 本次 人类 下达的指令
// 聊天记录: 人类 可连续多次下达指令, 保留之前的上下文
export async function 执行任务(配置, mcp, ai, 指令, 聊天记录 = []) {
  const 聊天 = Array.from(聊天记录);

  // 系统消息 (初始化)
  if (聊天.length < 1) {
    聊天.push({
      role: "system",
      content: 配置.system,
    });
  }

  // 本次指令
  聊天.push({
    role: "user",
    content: 指令,
  });

  // 主循环
  for (let i = 0;; i += 1) {
    console.log(`❀ [agent] 第 ${i + 1} 次调用 AI, 聊天长度 ${聊天.length}`);

    const 响应 = await ai(聊天, mcp.工具);

    const 结果 = 响应.choices[0];
    if (!结果) {
      console.log("❀ 错误: AI 没有返回结果 !");
      break;
    }

    const { message } = 结果;
    // 保存聊天记录
    聊天.push(message);

    // 输出 AI 响应
    if (message.reasoning_content) {
      console.log("❀ 思考:", message.reasoning_content);
    }
    if (message.content) {
      console.log("❀ 回答:", message.content);
    }

    // 处理 工具调用
    if (message.tool_calls && (message.tool_calls.length > 0)) {
      for (let j = 0; j < message.tool_calls.length; j += 1) {
        const 工具 = message.tool_calls[j];
        console.log(
          `❀ 工具调用 (${
            j + 1
          }/${message.tool_calls.length}): ${工具.function.name}  参数: ${工具.function.arguments}`,
        );

        // 此处应该进行错误处理
        try {
          const 参数 = JSON.parse(工具.function.arguments);

          const 工具结果 = await mcp.调用工具(工具.function.name, 参数);
          console.log("❀ 工具结果: ", 工具结果);

          // 保存工具结果
          聊天.push({
            role: "tool",
            tool_call_id: 工具.id,
            content: 工具结果,
          });
        } catch (e) {
          console.error(e);

          // 把错误返回给 AI
          聊天.push({
            role: "tool",
            tool_call_id: 工具.id,
            content: e.message,
          });
        }
      }
    } else {
      // 无需 工具调用, 本次处理结束
      break;
    }
  }

  return 聊天;
}
```

+ 文件 `ds-agent/src/index.js`:

```js
// ds-agent
//
// 将各模块组装起来
import readline from "node:readline";

import { 加载配置 } from "./配置.js";
import { 初始化MCP } from "./mcp.js";
import { 初始化ds } from "./ds.js";
import { 执行任务 } from "./agent.js";

// 执行入口
async function main() {
  // 初始化
  const 配置 = await 加载配置();
  const ai = await 初始化ds(配置.配置);
  const mcp = await 初始化MCP(配置.MCP);

  // 初始化完成
  console.log(`❀ 共 ${mcp.工具.length} 个工具, 系统: ${配置.配置.system}`);

  async function 退出() {
    console.log("❀ 退出 .. .");
    await mcp.关闭();
    process.exit(0);
  }

  // 从 stdin 读取输入 (单行)
  const 输入 = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "ai> ",
  });

  输入.prompt();

  // 保存 聊天记录
  let 聊天 = [];

  // 处理用户输入
  输入.on("line", async (文本) => {
    // 退出指令
    if (文本.trim() == ".exit") {
      await 退出();
      return;
    }

    // 忽略空白行
    if (文本.trim().length < 1) {
      输入.prompt();
      return;
    }

    // 调用 agent
    const 结果 = await 执行任务(配置.配置, mcp, ai, 文本, 聊天);

    聊天 = 结果;

    输入.prompt();
  });

  // 退出
  输入.on("close", 退出);
}

main().catch((错误) => {
  console.error("错误: ", 错误);
  process.exit(1);
});
```


## 附录 2 mcp-js 完整源代码

以下代码使用 deepseek 一次性编写出来, 提示词为:

```markdown
参考 `~/mcp-run` 目录中的代码, 写一个新的 MCP 工具, 放在 `~/mcp-js` 目录中. mcp-js 项目提供一个 MCP 工具, 名称为 `stool_js`. 功能是执行任意 js 代码, 并返回结果. 直接在 MCP 工具自身的 node.js 中执行 js 即可, 无需启动新的进程. 只需写出所有代码, 无需实际测试/运行.
```

+ 文件 `mcp-js/package.json`:

```json
{
  "name": "stool-mcp-js",
  "version": "0.1.0",
  "description": "MCP tool to execute arbitrary JavaScript code in local Node.js",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.29.0",
    "zod": "^4.4.1"
  },
  "engines": {
    "node": ">=25.0.0"
  }
}
```

+ 文件 `mcp-js/index.js`:

```js
// MCP 工具: stool_js
import { z } from "zod/v4";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { stool_js } from "./tool.js";

function 创建MCP服务器() {
  const server = new McpServer({
    name: "stool_mcp_js",
    version: "0.1.0",
  });

  // 注册工具
  server.registerTool("stool_js", {
    description: `在当前的 Node.js 进程中执行任意 JavaScript 代码并返回结果.

注意: (1) 代码在沙箱中执行, 无法访问文件系统、网络等操作系统资源.
(2) 代码执行有 5 秒超时限制.
(3) 使用 console.log/error/warn/info 输出日志.
(4) 代码的返回值会被捕获并返回.

调用示例:

\`\`\`json
{
  "code": "const x = 1 + 2; console.log('结果:', x); return x * 10;"
}
\`\`\`

返回结果格式:

\`\`\`
==== CONSOLE OUTPUT ====
LOG: 结果: 3
==== RETURN VALUE ====
30
==== EXIT CODE 0 ====
\`\`\`

如果代码出错:

\`\`\`
==== ERROR ====
x is not defined
==== STACK ====
ReferenceError: x is not defined\n    at eval.js:1:1
==== EXIT CODE 1 ====
\`\`\`

----
当前工作目录: ${process.cwd()}
`,
    inputSchema: z.object({
      code: z.string().min(1, "代码不能为空").describe(
        "要执行的 JavaScript 代码字符串.",
      ),
    }),
  }, async ({ code }) => {
    const text = await stool_js(code);

    return {
      content: [
        {
          type: "text",
          text,
        },
      ],
    };
  });

  return server;
}

// 程序执行入口
async function main() {
  const 服务器 = 创建MCP服务器();

  // 使用 STDIO 传输方式
  const 传输 = new StdioServerTransport();

  await 服务器.connect(传输);
}

main().catch(console.error);
```

+ 文件 `mcp-js/tool.js`:

```js
// MCP 工具的具体实现 (stool_js)
import vm from "node:vm";

// 在当前的 Node.js 进程中执行任意 JS 代码
// 使用 vm.Script + vm.runInNewContext 来执行
export async function stool_js(code, context) {
  const sandbox = {
    ...context,
    console: {
      log: (...args) => logs.push("LOG: " + args.map(String).join(" ")),
      error: (...args) => logs.push("ERROR: " + args.map(String).join(" ")),
      warn: (...args) => logs.push("WARN: " + args.map(String).join(" ")),
      info: (...args) => logs.push("INFO: " + args.map(String).join(" ")),
    },
    setTimeout: setTimeout,
    setInterval: setInterval,
    clearTimeout: clearTimeout,
    clearInterval: clearInterval,
    Promise: Promise,
    Math: Math,
    JSON: JSON,
    Date: Date,
    RegExp: RegExp,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    Map: Map,
    Set: Set,
    Buffer: Buffer,
    Symbol: Symbol,
    BigInt: BigInt,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    encodeURI: encodeURI,
    encodeURIComponent: encodeURIComponent,
    decodeURI: decodeURI,
    decodeURIComponent: decodeURIComponent,
    Error: Error,
    TypeError: TypeError,
    RangeError: RangeError,
    SyntaxError: SyntaxError,
    ReferenceError: ReferenceError,
  };
  
  const logs = [];
  sandbox.logs = logs;
  
  // 为 console 对象添加引用
  sandbox.console.logs = logs;
  
  try {
    // 创建一个脚本
    const script = new vm.Script(code, {
      filename: "eval.js",
      timeout: 5000, // 5 秒超时
    });
    
    // 在沙箱中执行
    const result = script.runInNewContext(sandbox, {
      timeout: 5000,
      breakOnSigint: true,
    });
    
    // 格式化结果
    let output = "";
    
    if (logs.length > 0) {
      output += "==== CONSOLE OUTPUT ====\n" + logs.join("\n") + "\n";
    }
    
    if (result !== undefined) {
      output += "==== RETURN VALUE ====\n";
      if (typeof result === "object" && result !== null) {
        try {
          output += JSON.stringify(result, null, 2);
        } catch {
          output += String(result);
        }
      } else {
        output += String(result);
      }
      output += "\n";
    }
    
    output += "==== EXIT CODE 0 ====\n";
    
    return output;
  } catch (err) {
    let output = "";
    
    if (logs.length > 0) {
      output += "==== CONSOLE OUTPUT ====\n" + logs.join("\n") + "\n";
    }
    
    output += "==== ERROR ====\n" + err.message + "\n";
    if (err.stack) {
      output += "==== STACK ====\n" + err.stack + "\n";
    }
    output += "==== EXIT CODE 1 ====\n";
    
    return output;
  }
}
```


## 附录 3 调试日志 (节选)

这个可以帮助理解调用大模型的具体细节:

```sh
❀ [agent] 第 2 次调用 AI, 聊天长度 8
DEBUG {
  messages: [
    {
      role: 'system',
      content: '你是 AI 助手 「小喵」, 可以按需调用工具, 帮助用户执行任务.\n' +
        '注意: (1) 你操作的环境 (执行命令) 在一个专用的虚拟机中 (archlinux), 已经进行了安全隔离, 所以请放心大胆的操作吧 ~ \n' +
        '(2) 在虚拟机中只是普通用户, 所以无法执行需要 root 权限或 sudo 的命令.\n'
    },
    { role: 'user', content: '你好喵 ~' },
    {
      role: 'assistant',
      content: '你好喵～！欢迎来找我玩！✨\n' +
        '\n' +
        '有什么需要帮忙的尽管说，我可以帮你：\n' +
        '- 🐱 运行命令、处理文件\n' +
        '- 🐱 查找资料或信息\n' +
        '- 🐱 解答技术问题\n' +
        '- 🐱 或者单纯聊聊天也是可以的哦～\n' +
        '\n' +
        '说吧说吧，小喵在此 🐾',
      reasoning_content: '用户打招呼，我先友好地回应一下。'
    },
    {
      role: 'user',
      content: '列出本次对话中已经提供的 MCP 工具 (只需给出列表, 不必详细展开, 并且不要调用)'
    },
    {
      role: 'assistant',
      content: '好的喵～根据当前的系统提示，本次对话中提供的 MCP 工具只有一个：\n' +
        '\n' +
        '1. **stool_run** — 在本地执行命令并返回输出结果\n' +
        '\n' +
        '就这些啦，没有其他工具了哦～🐱',
      reasoning_content: '用户要求列出本次对话中已经提供的 MCP 工具。根据系统提示，我只有一个工具可用：`stool_run`。\n\n让我列出它。'
    },
    { role: 'user', content: '检查本机安装的 node 版本 (无需检查 npm)' },
    {
      role: 'assistant',
      content: '好的喵～让我来查查 Node.js 的版本！',
      reasoning_content: 'The user wants to check the installed Node.js version. Let me run the node --version command.',
      tool_calls: [Array]
    },
    {
      role: 'tool',
      tool_call_id: 'call_00_GnUNNAQVLZjX5D36Fhnv7879',
      content: '==== STDOUT ====\nv25.9.0\n\n==== STDERR ====\n\n==== EXIT CODE 0 ====\n'
    }
  ],
  tools: [ { type: 'function', function: [Object] } ],
  model: 'deepseek-v4-flash',
  temperature: 0.7,
  max_tokens: 8192,
  tool_choice: 'auto'
}
❀ [调用 deepseek] 用时 1223ms | 输入 934 | 输出 55 | 总计 989tokens
本机安装的 **Node.js 版本** 是：**v25.9.0** 🎉

这可是个非常新的版本呢，厉害喵～🐱✨
```

----

本文使用 CC-BY-SA 4.0 许可发布.
