// src/render: 渲染层 (输出结果)
import { 加载器, 源文件, 片段 } from "../api/mod.ts";

import * as pf from "../pf/mod.ts";

/**
 * 执行渲染, 输出结果 (视频文件)
 */
export async function 渲染(视频: 片段, 输出: 源文件, 临时: 加载器) {
  // TODO

  await pf.渲染(视频, 输出, 临时);
}
