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
