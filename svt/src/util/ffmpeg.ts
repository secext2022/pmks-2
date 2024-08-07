// 运行 ffmpeg 命令的封装

import { 运行_结果 } from "./run.ts";

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
