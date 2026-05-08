# (AI) 编写简单 MCP 工具 (mcp-run)

![题图](./图/0.png)

劳动节 一定要 **劳动** !! (狗头)

现在是 AI 时代, 所以 AI 也要 "劳动". (笑)
让 AI 劳动的第一步: 给 AI 提供 "劳动工具".

MCP (模型上下文协议) 就是方便 AI 调用工具的一种通用标准.

本文就来编写一个简单的 MCP 工具, 给 AI 使用.

**警告 (免责声明): 本文中的代码仅用于帮助 人类 理解 MCP 的工作原理, 请勿实际使用 !!**
本文中的代码有明显的安全问题 (缺少权限控制), 建议只在 **虚拟机** 中进行测试.

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 91 号作品. )

----

相关文章:

+ Android 禁止侧载将正式实施，需要等待 24 小时冷静期

  TODO

+ 《制造一只电子喵 (qwen2.5:0.5b 微调 LoRA 使用 llama-factory)》

  TODO

+ 《LLVM IR 入门: 使用 LLVM 编译到 WebAssembly》

  TODO

+ 《高画质投屏: Sunshine / Moonlight 局域网串流 (高帧率, 高码率, 低延迟)》

  TODO

+ 《在 Android 设备上写代码 (Termux, code-server)》

  TODO

参考资料:

+ <https://modelcontextprotocol.io/docs/learn/architecture>
+ <https://www.npmjs.com/package/@modelcontextprotocol/sdk>
+ <https://nodejs.org/zh-cn>
+ <https://pnpm.io/installation>
+ <https://nodejs.org/docs/latest/api/child_process.html>
+ <https://www.jsonrpc.org/specification>


## 目录

+ 1 编写代码 (node.js)

  - 1.1 MCP 处理
  - 1.2 工具实现

+ 2 测试运行

+ 3 总结与展望

+ 附录 1 完整源代码

+ 附录 2 测试日志


## 1 编写代码 (node.js)

我们使用 npm 上的 `@modelcontextprotocol/sdk` 工具包来方便开发.

### 1.1 MCP 处理

这是 MCP (协议) 相关的处理代码.

```js
function 创建MCP服务器() {
  const server = new McpServer({
    name: "stool_mcp_run",
    version: "0.1.0",
  });

  // 注册工具
  server.registerTool("stool_run", {
    // 给 AI 看的工具说明
    description: `在本地执行命令并返回输出结果.

注意: (1) 本工具不使用 shell, 而是直接执行命令中指定的二进制程序, 所以不支持 shell 语法.
(2) 本工具会等待所执行的命令退出之后, 才返回.

调用示例:

\`\`\`json
{
  "command": ["node", "--version"],
  "cwd": "/home/user",
  "env": {
    "NODE_ENV": "production"
  }
}
\`\`\`

返回结果格式:

\`\`\`
==== STDOUT ====

==== STDERR ====

==== EXIT CODE 0 ====
\`\`\`

----
当前工作目录: ${process.cwd()}
`,
    // 工具输入参数 (数据格式)
    inputSchema: z.object({
      command: z.array(z.string()).min(1, "命令数组不能为空").describe(
        `命令及其参数. 比如: ["/usr/bin/node", "--verison"], ["ls", "-l", "/home"]`,
      ),
      cwd: z.string().optional().describe(
        "指定执行命令的工作目录. 默认为当前工作目录.",
      ),
      env: z.record(z.string(), z.string()).optional().describe(
        "额外的环境变量, 会与已有的环境变量合并 (覆盖). 默认继承当前进程的环境变量.",
      ),
    }),
  }, async ({ command, cwd, env }) => {
    // 实际执行
    const text = await stool_run(command, cwd, env);

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
```

首先创建一个 MCP 服务器 (实例), 指定名称/版本号.

然后添加一个工具 `stool_run`. 一个 MCP 服务器可以同时提供多个工具, 此处作为示例只有一个工具.

+ (1) 工具名称 (`stool_run`): AI 使用工具名称来调用对应的工具.

+ (2) 工具描述 (`description`): 这是给 AI 看的, 就是一个工具的说明文档.
  现在的 AI 越来越强, 基本上随便写写, AI (大模型) 都能很好的理解了 (笑).

+ (3) 输入参数 (`inputSchema`): 严格定义调用工具的输入参数, 及其数据格式.
  在调用工具之前, MCP 服务器首先会根据这个定义检查 AI 传过来的数据对不对.
  如果格式完全正确, 才会调用工具. 否则直接给 AI 返回错误.

  通常使用 npm 包 `zod` 定义数据格式.

----

然后把 MCP 服务器和传输方式 (IO) 连接起来:

```js
// 程序执行入口
async function main() {
  const 服务器 = 创建MCP服务器();

  // 使用 STDIO 传输方式
  const 传输 = new StdioServerTransport();

  await 服务器.connect(传输);
}
```

MCP 有 2 种传输方式: STDIO (进程的标准输入/输出) 用于本地运行的 MCP 工具, HTTP 用于连接远程服务器.

此处选择 STDIO 方式.

### 1.2 工具实现

然后我们实现工具的具体功能:

```js
import { spawn } from "node:child_process";

// async
function 执行命令(command, cwd, env) {
  return new Promise((resolve) => {
    const p = spawn(command[0], command.slice(1), {
      cwd,
      env: { ...process.env, ...env },
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    p.stdout.on("data", (c) => {
      stdout += c;
    });
    p.stderr.on("data", (c) => {
      stderr += c;
    });

    p.on("close", (code) => {
      resolve({
        stdout,
        stderr,
        code,
      });
    });

    p.on("error", (r) => {
      resolve({
        stdout,
        stderr,
        code: -1,
        error: r.message,
      });
    });
  });
}
```

很简单, 调用 node.js API 执行本地命令 (程序), 传递命令行参数, 设置工作目录, 以及环境变量.

收集命令 (进程) 的 stdout (标准输出), stderr (标准错误输出), 退出码等数据.

----

最后进行格式化, 给这些数据一个良好的固定格式, 返回给 AI:

```js
// 运行本地命令
export async function stool_run(command, cwd, env) {
  const { stdout, stderr, code, error } = await 执行命令(command, cwd, env);

  // 格式化输出结果
  const o = [`==== STDOUT ====
${stdout}
==== STDERR ====
${stderr}
==== EXIT CODE ${code} ====
`];

  if (error) {
    o.push(`==== ERROR ====
${error}`);
  }
  return o.join("\n");
}
```


## 2 测试运行

暂时没有 AI, 我们先手动模拟 MCP 的工作方式, 对这个 MCP 工具进行测试.

首先确保正确安装了 node.js 和 pnpm:

```sh
> node --version
v25.9.0
> pnpm --version
10.33.2
```

然后安装依赖:

```sh
> pnpm install
Lockfile is up to date, resolution step is skipped
Packages: +91
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 91, reused 91, downloaded 0, added 91, done

dependencies:
+ @modelcontextprotocol/sdk 1.29.0
+ zod 4.4.1

Done in 526ms using pnpm v10.33.2
```

好 ! 现在可以开始测试啦 ~

----

在终端运行命令:

```sh
node index.js
```

按下回车, 没有任何输出, 很好 !

MCP 的 `STDIO` 传输方式使用 **单行 JSON**, 每次的输入/输出都只是一行. 注意不要一次输入多行数据.

----

MCP 服务器 (server, 提供 MCP 工具) 和 MCP 客户端 (client, 比如 agent) 之间, 首先要进行协议参数的协商.

复制粘贴这一行文本到终端:

```json
{"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{"tools":{}},"clientInfo":{"name":"ds-agent","version":"0.1.0"}},"jsonrpc":"2.0","id":0}
```

这是客户端发出的初始化请求, 包括协议版本, 能力, 客户端的名称/版本号等. MCP 基于 **JSON-RPC** 协议.

然后会看到 MCP 服务器的返回结果:

```json
{"result":{"protocolVersion":"2025-11-25","capabilities":{"tools":{"listChanged":true}},"serverInfo":{"name":"stool_mcp_run","version":"0.1.0"}},"jsonrpc":"2.0","id":0}
```

好, 这说明服务器初始化成功了 !

----

接着客户端会列出服务器提供的工具:

```json
{"method":"tools/list","jsonrpc":"2.0","id":1}
```

返回结果:

```json
{"result":{"tools":[{"name":"stool_run","description":"在本地执行命令并返回输出结果.\n\n注意: (1) 本工具不使用 shell, 而是直接执行命令中指定的二进制程序, 所以不支持 shell 语法.\n(2) 本工具会等待所执行的命令退出之后, 才返回.\n\n调用示例:\n\n```json\n{\n  \"command\": [\"node\", \"--version\"],\n  \"cwd\": \"/home/user\",\n  \"env\": {\n    \"NODE_ENV\": \"production\"\n  }\n}\n```\n\n返回结果格式:\n\n```\n==== STDOUT ====\n\n==== STDERR ====\n\n==== EXIT CODE 0 ====\n```\n\n----\n当前工作目录: /home/s2/pmks-2/草稿/计算机编程入门/N_mcp-run/mcp-run\n","inputSchema":{"$schema":"http://json-schema.org/draft-07/schema#","type":"object","properties":{"command":{"minItems":1,"type":"array","items":{"type":"string"},"description":"命令及其参数. 比如: [\"/usr/bin/node\", \"--verison\"], [\"ls\", \"-l\", \"/home\"]"},"cwd":{"description":"指定执行命令的工作目录. 默认为当前工作目录.","type":"string"},"env":{"description":"额外的环境变量, 会与已有的环境变量合并 (覆盖). 默认继承当前进程的环境变量.","type":"object","propertyNames":{"type":"string"},"additionalProperties":{"type":"string"}}},"required":["command"]},"execution":{"taskSupport":"forbidden"}}]},"jsonrpc":"2.0","id":1}
```

数据较多, 主要是包含了工具的说明文档和参数格式定义.
这个到时候会给 AI 看.

----

尝试调用工具:

```json
{"method":"tools/call","params":{"name":"stool_run","arguments":{"command":["node","--version"]}},"jsonrpc":"2.0","id":2}
```

这是客户端请求服务器执行 `node --version` 命令.

```json
{"result":{"content":[{"type":"text","text":"==== STDOUT ====\nv25.9.0\n\n==== STDERR ====\n\n==== EXIT CODE 0 ====\n"}]},"jsonrpc":"2.0","id":2}
```

好, 大成功 ! 撒花 ~

这个工具调用相当于执行命令:

```sh
> node --version
v25.9.0
```


## 3 总结与展望

MCP 工具调用就是这么简单.

以前的 AI 聊天, 就像 AI 只有 **嘴**, 只能做 嘴强王者.
现在的 agent, 相当于给 AI 装上了 **手脚**, 让 AI 可以调用工具, 执行操作, 所以能力边界一下就扩展了.

展望未来, 当 AI + **机器人** 成熟之后, AI 就可以从屏幕中走出来了 (狗头).

本文中实现的 MCP 工具非常简陋, 只是一个粗糙的原型.
如果要用于实际用途, 还需要大量的完善优化.
主要是需要添加充分的权限控制, 因为能够执行任意命令, 是一种非常强大的能力.

有了 MCP 工具, 下一步就可以写一个 agent, 来让 AI 实际干活了.


## 附录 1 完整源代码

+ 文件 `package.json`:

```json
{
  "name": "stool-mcp-run",
  "version": "0.1.0",
  "description": "MCP tool to run local command (CLI)",
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

+ 文件 `index.js`:

```js
// MCP 工具: stool_mcp_run
import { z } from "zod/v4";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { stool_run } from "./tool.js";

function 创建MCP服务器() {
  const server = new McpServer({
    name: "stool_mcp_run",
    version: "0.1.0",
  });

  // 注册工具
  server.registerTool("stool_run", {
    // 给 AI 看的工具说明
    description: `在本地执行命令并返回输出结果.

注意: (1) 本工具不使用 shell, 而是直接执行命令中指定的二进制程序, 所以不支持 shell 语法.
(2) 本工具会等待所执行的命令退出之后, 才返回.

调用示例:

\`\`\`json
{
  "command": ["node", "--version"],
  "cwd": "/home/user",
  "env": {
    "NODE_ENV": "production"
  }
}
\`\`\`

返回结果格式:

\`\`\`
==== STDOUT ====

==== STDERR ====

==== EXIT CODE 0 ====
\`\`\`

----
当前工作目录: ${process.cwd()}
`,
    // 工具输入参数 (数据格式)
    inputSchema: z.object({
      command: z.array(z.string()).min(1, "命令数组不能为空").describe(
        `命令及其参数. 比如: ["/usr/bin/node", "--verison"], ["ls", "-l", "/home"]`,
      ),
      cwd: z.string().optional().describe(
        "指定执行命令的工作目录. 默认为当前工作目录.",
      ),
      env: z.record(z.string(), z.string()).optional().describe(
        "额外的环境变量, 会与已有的环境变量合并 (覆盖). 默认继承当前进程的环境变量.",
      ),
    }),
  }, async ({ command, cwd, env }) => {
    // 实际执行
    const text = await stool_run(command, cwd, env);

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

+ 文件 `tool.js`:

```js
// MCP 工具的具体实现 (stool_run)
import { spawn } from "node:child_process";

// async
function 执行命令(command, cwd, env) {
  return new Promise((resolve) => {
    const p = spawn(command[0], command.slice(1), {
      cwd,
      env: { ...process.env, ...env },
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    p.stdout.on("data", (c) => {
      stdout += c;
    });
    p.stderr.on("data", (c) => {
      stderr += c;
    });

    p.on("close", (code) => {
      resolve({
        stdout,
        stderr,
        code,
      });
    });

    p.on("error", (r) => {
      resolve({
        stdout,
        stderr,
        code: -1,
        error: r.message,
      });
    });
  });
}

// 运行本地命令
export async function stool_run(command, cwd, env) {
  const { stdout, stderr, code, error } = await 执行命令(command, cwd, env);

  // 格式化输出结果
  const o = [`==== STDOUT ====
${stdout}
==== STDERR ====
${stderr}
==== EXIT CODE ${code} ====
`];

  if (error) {
    o.push(`==== ERROR ====
${error}`);
  }
  return o.join("\n");
}
```


## 附录 2 测试日志

```json
> node index.js
{"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{"tools":{}},"clientInfo":{"name":"ds-agent","version":"0.1.0"}},"jsonrpc":"2.0","id":0}
{"result":{"protocolVersion":"2025-11-25","capabilities":{"tools":{"listChanged":true}},"serverInfo":{"name":"stool_mcp_run","version":"0.1.0"}},"jsonrpc":"2.0","id":0}
{"method":"tools/list","jsonrpc":"2.0","id":1}
{"result":{"tools":[{"name":"stool_run","description":"在本地执行命令并返回输出结果.\n\n注意: (1) 本工具不使用 shell, 而是直接执行命令中指定的二进制程序, 所以不支持 shell 语法.\n(2) 本工具会等待所执行的命令退出之后, 才返回.\n\n调用示例:\n\n```json\n{\n  \"command\": [\"node\", \"--version\"],\n  \"cwd\": \"/home/user\",\n  \"env\": {\n    \"NODE_ENV\": \"production\"\n  }\n}\n```\n\n返回结果格式:\n\n```\n==== STDOUT ====\n\n==== STDERR ====\n\n==== EXIT CODE 0 ====\n```\n\n----\n当前工作目录: /home/s2/pmks-2/草稿/计算机编程入门/N_mcp-run/mcp-run\n","inputSchema":{"$schema":"http://json-schema.org/draft-07/schema#","type":"object","properties":{"command":{"minItems":1,"type":"array","items":{"type":"string"},"description":"命令及其参数. 比如: [\"/usr/bin/node\", \"--verison\"], [\"ls\", \"-l\", \"/home\"]"},"cwd":{"description":"指定执行命令的工作目录. 默认为当前工作目录.","type":"string"},"env":{"description":"额外的环境变量, 会与已有的环境变量合并 (覆盖). 默认继承当前进程的环境变量.","type":"object","propertyNames":{"type":"string"},"additionalProperties":{"type":"string"}}},"required":["command"]},"execution":{"taskSupport":"forbidden"}}]},"jsonrpc":"2.0","id":1}
{"method":"tools/call","params":{"name":"stool_run","arguments":{"command":["node","--version"]}},"jsonrpc":"2.0","id":2}
{"result":{"content":[{"type":"text","text":"==== STDOUT ====\nv25.9.0\n\n==== STDERR ====\n\n==== EXIT CODE 0 ====\n"}]},"jsonrpc":"2.0","id":2}
{"method":"tools/call","params":{"name":"stool_run","arguments":{"command":["ls","/usr"]}},"jsonrpc":"2.0","id":3}
{"result":{"content":[{"type":"text","text":"==== STDOUT ====\naarch64-linux-gnu\nbin\ninclude\nlib\nlib32\nlib64\nlocal\nriscv64-linux-gnu\nsbin\nshare\nsrc\n\n==== STDERR ====\n\n==== EXIT CODE 0 ====\n"}]},"jsonrpc":"2.0","id":3}
```

----

本文使用 CC-BY-SA 4.0 许可发布.
