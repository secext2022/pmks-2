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
