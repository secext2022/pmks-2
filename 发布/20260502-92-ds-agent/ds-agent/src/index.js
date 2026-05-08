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
