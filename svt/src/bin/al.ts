// svt/src/bin/al.ts: 获取音频文件长度
import { join } from "@std/path";

import { 获取时长 } from "../util/ffmpeg.ts";

export async function al(目录: string, 输出: string) {
  // 获取的时长数据
  const d: Map<number, [number, string]> = new Map();
  // 最大文件序号
  let M = 0;

  // 处理目录中的每个文件
  for await (const i of Deno.readDir(目录)) {
    const n = i.name;
    // TODO 检查文件名

    // 文件序号, 比如: 1_1.wav
    const 序号 = Number.parseInt(n);
    if (序号 > M) {
      M = 序号;
    }

    const 路径 = join(目录, n);
    console.log(路径);
    const 时长 = await 获取时长(路径);
    d.set(序号, [时长, n]);
  }

  // 结果排序输出
  const o: Array<string> = [];
  for (let i = 1; i <= M; i += 1) {
    const a = d.get(i);
    if (null == a) {
      o.push("");
    } else {
      o.push("" + a[0] + "  " + a[1]);
    }
  }
  // 写结果文件
  const t = o.join("\n") + "\n";
  await Deno.writeTextFile(输出, t);
}

if (import.meta.main) {
  const a = Deno.args;
  await al(a[0], a[1]);
}
