// pf: 逐帧 处理
import { dirname, join, relative } from "@std/path";

import { 加载器, 帧, 源文件, 片段 } from "../api/mod.ts";
import { 加载缓存 } from "./load.ts";
import { 创建过滤器 } from "./fs.ts";

// 获取根目录
export function 根目录(): string {
  return Deno.env.get("SVT_ROOT") || ".";
}

// 写输出文件
async function 输出结果(根目录: string, 文件: 源文件, 视频: Array<帧>) {
  const 输出 = join(根目录, 文件.位置);
  console.log("输出 " + 输出);

  const 基 = dirname(输出);

  const o = [];
  for (const i of 视频) {
    o.push(relative(基, i.位置));
  }

  // 注意: ffmpeg -f concat -i 1.txt  失败 ! 无法正常使用
  //const 文本 = o.map((x) => `file '${x}'`).join("\n") + "\n";

  // 使用 ffmpeg -f image2 -i %d.png
  const 结果 = [];
  // 计数
  let c = 0;
  for (const i of o) {
    结果.push("ln $1/" + i + " " + c + ".png");
    c += 1;
  }
  const 文本 = 结果.join("\n") + "\n";

  await Deno.writeTextFile(输出, 文本);
}

export async function 渲染(视频: 片段, 输出: 源文件, 临时: 加载器) {
  console.debug("逐帧渲染");

  const r = 根目录();
  const c = new 加载缓存(r);
  const f = 创建过滤器(视频, 临时, c);

  const 帧: Array<帧> = [];
  // 开始生成帧
  for await (const i of f) {
    帧.push(i);
  }
  console.log("帧 " + 帧.length);

  // 输出结果
  await 输出结果(r, 输出, 帧);
}
