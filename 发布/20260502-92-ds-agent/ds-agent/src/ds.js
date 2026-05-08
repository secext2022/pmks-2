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
