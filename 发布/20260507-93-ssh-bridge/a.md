# ssh-bridge: 在 Linux 虚拟机中转发消息的简单实现 (UNIX socket)

注: 代码是 AI (豆包) 写的 (然后有少量人工修改), 并经过手动功能测试.

如果有 2 个 SSH 连接到同一个 Linux 虚拟机, 那么这 2 个之间, 如何方便的互相发送消息呢 ?

本文就来编写一个简单的小小的程序, 来实现这个功能.

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 93 号作品. )

----

相关文章:

+ 《(AI) 编写简单 AI 助手 (ds-agent)》

  TODO

+ 《(AI) 编写简单 MCP 工具 (mcp-run)》

  TODO

+ Android 禁止侧载将正式实施，需要等待 24 小时冷静期

  TODO

+ 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》

  TODO

+ 《流浪 Linux: 外置 USB SSD 安装 ArchLinux》

  TODO

参考资料:

+ <https://man.archlinux.org/man/ssh.1>
+ <https://developer.mozilla.org/en-US/docs/Web/API/TransformStream>
+ <https://docs.deno.com/api/deno/~/Deno.Conn>
+ <https://docs.deno.com/api/deno/~/Deno.stdin>
+ <https://docs.deno.com/api/deno/~/Deno.mkdir>
+ <https://jsr.io/@std/streams/doc/~/TextLineStream>
+ <https://jsr.io/@std/path>
+ <https://github.com/denoland/deno/discussions/23495>


## 目录

+ 1 主要设计

+ 2 测试运行

+ 3 总结与展望

+ 附录 1 源代码

+ 附录 2 cat-dir.sh


## 1 主要设计

主要设计目标是尽量简单, 轻量.

程序采用 C/S 结构, 也就是分为 **客户端** (client) 和 **服务端** (server) 2 部分.

其中服务端作为 systemd user service 启动运行,
在 UNIX socket `$XDG_RUNTIME_DIR/ssh-bridge/server` 监听, 比如: `/run/user/1000/ssh-bridge/server`

客户端连接到同一个地址.
这个目录有合适的默认权限控制, 只有同一个普通用户 (user) 才能访问.

进程间通信协议是简单的 **单行文本** 协议, 也就是每一行是一条消息 (用换行字符 `\n` 分隔).

每一行的格式为:

```json
channel: { "json": "data" }
```

前面是 **通道** 名, 后面是 JSON 格式的任意数据.

服务端简单的把收到的每一条消息, 都 **广播** 发送给所有连接的客户端.
服务端只做消息格式检查 (JSON 格式是否正确), 此外不做任何处理.

客户端使用命令行参数 `--pub` 指定允许发布的通道, `--sub` 指定接收的通道.
客户端自己做消息过滤处理, 把进程的 stdin 收到的消息发送给服务端, 把来自服务端的消息发送到 stdout.

没错, 这是一个通过简单广播实现的 **发布/订阅** 模型, 喵呜 !~~


## 2 测试运行

首先, 配置好到 Linux 虚拟机的 ssh 连接, 比如:

```sh
> ssh arch202605ai1
Welcome to fish, the friendly interactive shell
Type help for instructions on how to use fish
ai1@arch202605ai1 ~> 
```

并且安装 deno:

```sh
ai1@arch202605ai1 ~> deno --version
deno 2.7.14 (stable, release, x86_64-unknown-linux-gnu)
v8 14.7.173.20-rusty
typescript 5.9.2
```

然后从 npm 下载代码: <https://www.npmjs.com/package/vm-ssh-bridge>

----

好了, 你已经把所需代码下载到虚拟机中了, 下面是安装步骤:

```sh
cd ssh-bridge/
mkdir -p ~/.ssh-bridge/
cp bin/sb-server.js bin/sb-client.js ~/.ssh-bridge/
mkdir -p ~/.config/systemd/user/
cp systemd-user/sb-server.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user start sb-server
```

然后用一下命令查看服务端运行是否正常:

```sh
systemctl --user status sb-server
```

----

好, 接下来在本机 (不是上面连接到的 虚拟机) 进行测试:

```sh
> ssh arch202605ai1 "deno run --allow-env --allow-read --allow-write ~/.ssh-bridge/sb-client.js"
default: {"test":666}
default: {"test":666}
```

其中 `default: {"test":666}` 是手动输入的, 下一行是来自 服务端 的回显.

然后在另一个新的终端中运行:

```sh
> ssh arch202605ai1 "deno run --allow-env --allow-read --allow-write ~/.ssh-bridge/sb-client.js --pub test"
test: {"ok":2333}
test: {"ok":2333}
```

此时前一个终端会看到:

![测试](./图/2-t-1.png)

```sh
> ssh arch202605ai1 "deno run --allow-env --allow-read --allow-write ~/.ssh-bridge/sb-client.js"
default: {"test":666}
default: {"test":666}
test: {"ok":2333}
```

成功通过 ssh 转发了消息, 撒花 ~


## 3 总结与展望

本文使用 AI 写了一个很简单的程序代码, 实现了通过 SSH 在同一个 Linux 虚拟机中转发消息的功能.

这不仅测试了 AI 写代码的能力, 也了解了 订阅/发布 这种常见的模型. 是一次很愉快的玩耍哟 ~


## 附录 1 源代码

可以从 npm 获取完整源代码: <https://www.npmjs.com/package/vm-ssh-bridge>

+ 文件 `ssh-bridge/src/util.ts`:

```ts
import * as path from "@std/path";
import { TextLineStream } from "@std/streams/text-line-stream";

export interface Message {
  channel: string;
  data: unknown;
}

export function parseLine(line: string): Message | undefined {
  try {
    // first `:`
    const i = line.indexOf(":");
    if (i > 0) {
      const channel = line.slice(0, i);
      const jsonStr = line.slice(i + 1);
      return {
        channel,
        data: JSON.parse(jsonStr),
      };
    }
  } catch (e) {
    // ignore
    console.error("bad line", line);
    console.log(e);
  }
}

export function formatMessage(channel: string, data: unknown): string {
  const jsonStr = JSON.stringify(data);
  return `${channel}: ${jsonStr}\n`;
}

// UNIX socket: $XDG_RUNTIME_DIR/ssh-bridge/server
export function getSocketPath(): [string, string] {
  const runtimeDir = Deno.env.get("XDG_RUNTIME_DIR");
  if (!runtimeDir) {
    console.error("XDG_RUNTIME_DIR environment variable is not set");
    Deno.exit(1);
  }

  const dir = path.join(runtimeDir, "ssh-bridge");
  const socketPath = path.join(dir, "server");

  return [socketPath, dir];
}

export async function* readLines(
  readable: ReadableStream<Uint8Array<ArrayBuffer>>,
): AsyncGenerator<string> {
  const s = readable.pipeThrough<string>(new TextDecoderStream()).pipeThrough<
    string
  >(new TextLineStream());
  for await (const i of s) {
    yield i;
  }
}
```

+ 文件 `ssh-bridge/src/sb-server.ts`:

```ts
// sb-server.js
import { formatMessage, getSocketPath, parseLine, readLines } from "./util.ts";

const connections = new Set<Deno.Conn>();

async function handleConnection(conn: Deno.Conn) {
  connections.add(conn);
  const encoder = new TextEncoder();

  try {
    for await (const line of readLines(conn.readable)) {
      const msg = parseLine(line);
      if (!msg) continue;

      const outputLine = formatMessage(msg.channel, msg.data);
      const buf = encoder.encode(outputLine);

      for (const writer of connections) {
        try {
          // NO `await` here, do not block !
          writer.write(buf);
        } catch (e) {
          // ignore
          console.error(e);
        }
      }
    }
  } catch (e) {
    // ignore
    console.error(e);
  }

  // clean up
  connections.delete(conn);
  try {
    conn.close();
  } catch (e) {
    // ignore
    console.error(e);
  }
}

async function main() {
  const [socketPath, dir] = getSocketPath();

  await Deno.mkdir(dir, { recursive: true });
  try {
    await Deno.remove(socketPath);
  } catch (e) {
    // ignore
    console.error(e);
  }

  const listener = Deno.listen({ path: socketPath, transport: "unix" });
  console.log(`Listening on ${socketPath}`);

  for await (const conn of listener) {
    handleConnection(conn);
  }
}

await main();
```

+ 文件 `ssh-bridge/src/sb-client.ts`:

```ts
// sb-client.js
import { formatMessage, getSocketPath, parseLine, readLines } from "./util.ts";

// TODO --version --help
// --pub XXX --sub AAA --sub BBB
function parseArgs() {
  const args = Deno.args;
  const pub = new Set<string>();
  const sub = new Set<string>();
  let i = 0;

  while (i < args.length) {
    const arg = args[i];
    if (("--pub" == arg) && (i + 1 < args.length)) {
      pub.add(args[i + 1]);
      i += 2;
    } else if (("--sub" == arg) && (i + 1 < args.length)) {
      sub.add(args[i + 1]);
      i += 2;
    } else {
      console.error("ERROR: bad CLI arg: " + arg);
      Deno.exit(1);
    }
  }

  if (pub.size < 1) {
    pub.add("default");
  }

  return { pub, sub };
}

async function stdinToServer(conn: Deno.Conn, pub: Set<string>) {
  const encoder = new TextEncoder();

  try {
    for await (const line of readLines(Deno.stdin.readable)) {
      const msg = parseLine(line);
      if (!msg) continue;
      if (!pub.has(msg.channel)) continue;

      await conn.write(encoder.encode(formatMessage(msg.channel, msg.data)));
    }
  } catch (e) {
    // ignore
    console.error(e);
  } finally {
    conn.closeWrite();
  }
}

async function serverToStdout(conn: Deno.Conn, sub: Set<string>) {
  const encoder = new TextEncoder();

  try {
    for await (const line of readLines(conn.readable)) {
      const msg = parseLine(line);
      if (!msg) continue;

      if (sub.size > 0 && !sub.has(msg.channel)) {
        continue;
      }

      await Deno.stdout.write(
        encoder.encode(formatMessage(msg.channel, msg.data)),
      );
    }
  } finally {
    conn.close();
  }
}

async function main() {
  const { pub, sub } = parseArgs();

  const [socketPath] = getSocketPath();

  const conn = await Deno.connect({ path: socketPath, transport: "unix" });

  await Promise.all([
    stdinToServer(conn, pub),
    serverToStdout(conn, sub),
  ]);
}

await main();
```

+ 文件 `ssh-bridge/systemd-user/sb-server.service`:

```
[Unit]
Description=SSH Bridge Server
After=network.target

[Service]
Type=simple
ExecStart=deno run --allow-env --allow-read --allow-write --allow-net %h/.ssh-bridge/sb-server.js
Restart=always

[Install]
WantedBy=default.target
```

+ 文件 `ssh-bridge/deno.json`:

```json
{
  "imports": {
    "@std/path": "jsr:@std/path@^1.1.4",
    "@std/streams": "jsr:@std/streams@^1.1.0"
  }
}
```


## 附录 2 cat-dir.sh

这个小脚本也是 AI 写的代码.
功能是把一个目录中的所有文件, 打包成一个文本文件.

比如:

```sh
> mkdir src
> echo "// TODO" > src/1.js
> echo "console.log(666);" > src/2.js
> ./cat-dir.sh src src.txt
Done! Output written to src.txt
```

然后生成的 `src.txt` 文件内容是:

```
> cat src/1.js
// TODO

> cat src/2.js
console.log(666);
```

因为现在大部分 AI (聊天 app) 不支持直接上传 zip 压缩包 (只支持上传 txt 文件).
所以就可以把这个打包成的 txt 方便的上传给 AI 愉快的开始处理啦 ~

----

+ 文件 `cat-dir.sh`:

```sh
#!/bin/bash

if [ $# -ne 2 ]; then
    echo "Usage: $0 input-dir output.txt"
    exit 1
fi

INPUT_DIR="$1"
OUTPUT_FILE="$2"

rm -f "$OUTPUT_FILE"

while IFS= read -r -d $'\0' file; do
    echo "> cat $file" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo >> "$OUTPUT_FILE"
done < <(find "$INPUT_DIR" -type f -print0)

echo "Done! Output written to $OUTPUT_FILE"
```

----

本文使用 CC-BY-SA 4.0 许可发布.
