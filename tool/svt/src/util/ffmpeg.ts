// 运行 ffmpeg 命令的封装

import { 运行, 运行_结果 } from "./run.ts";

/**
 * 获取媒体文件长度 (秒)
 *
 * 比如: ffprobe -i 1.wav -v quiet -show_entries format=duration -hide_banner
 *
 * [FORMAT]
 * duration=1.800000
 * [/FORMAT]
 */
export async function 获取时长(文件: string): Promise<number> {
  const t = await 运行_结果([
    "ffprobe",
    "-i",
    文件,
    "-v",
    "quiet",
    "-show_entries",
    "format=duration",
    "-hide_banner",
  ]);
  // 解析结果
  let d = -1;
  // 逐行处理
  for (const i of t.split("\n")) {
    const P = "duration=";
    if (i.startsWith(P)) {
      const n = i.slice(P.length);
      d = Number.parseFloat(n);
    }
  }
  return d;
}

/**
 * 文件路径, 已经开始时间.
 * 用于多片段合并.
 */
export interface 文件项 {
  /**
   * 文件路径
   */
  路径: string;
  /**
   * 开始时间 (秒)
   */
  时间: number;
}

/**
 * 合并多个音频片段文件.
 *
 * 参考 ffmpeg 命令: ffmpeg -i 1.wav -i 2.wav -filter_complex "[0]adelay=1s[t0]; [1]adelay=2s[t1]; [t0][t1]amix=inputs=2" out.wav
 */
export async function 合并音频(列表: Array<文件项>, 输出: string) {
  // 输入文件列表
  const 输入文件: Array<string> = [];
  // 生成 filter_complex (过滤器)
  const filter_complex: Array<string> = [];
  const t: Array<string> = [];

  for (let i = 0; i < 列表.length; i += 1) {
    输入文件.push("-i");
    输入文件.push(列表[i].路径);

    // adelay 时长: 毫秒
    filter_complex.push(
      `[${i}]adelay=${(列表[i].时间 * 1e3).toFixed(0)}[t${i}]`,
    );
    t.push(`[t${i}]`);
  }
  // normalize=0 解决合并后音量过小的问题
  filter_complex.push(`${t.join("")}amix=inputs=${列表.length}:normalize=0`);

  // 生成 ffmpeg 命令
  const 命令 = ["ffmpeg"].concat(输入文件).concat([
    "-filter_complex",
    filter_complex.join("; "),
    输出,
  ]);

  await 运行(命令);
}
