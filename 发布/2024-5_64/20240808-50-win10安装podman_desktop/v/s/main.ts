// 视频编号: 50 (未发布)
import { 加载器, 图片, 批量剪切, 拼接 } from "../../src/api/mod.ts";
import { 渲染 } from "../../src/mod.ts";

import { 切a, 切b } from "./c1.ts";

// 30 FPS
const 源 = new 加载器(".").目录("tmp").帧率(30);

const a = 源.文件("a", "img/a%.png");
const b = 源.文件("b", "img/b%.png");

const 段a = 批量剪切(a, 切a);
const 段b = 批量剪切(b, 切b);

const 结果 = 拼接(
  // 开头封面
  图片("9", 源.文件("p/c1.png")),
  图片("14", 源.文件("p/c2.png")),
  // 视频主要内容
  段a.s1安装,
  段a.s2安装,
  段b.s3安装,
  // 结尾暂停
  图片("5", 源.文件("p/end.png")),
);

// 开始渲染
渲染(结果, 源.文件("50_3.sh"), 源.目录("tmp1"));

// ffmpeg -framerate 30 -i t2/%d.png -c:v libx264 -pix_fmt yuv420p 50.mp4
