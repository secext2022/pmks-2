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
