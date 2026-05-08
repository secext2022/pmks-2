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
