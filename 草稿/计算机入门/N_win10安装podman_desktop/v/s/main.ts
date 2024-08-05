// 视频编号: 50 (未发布)
import { 加载器, 批量剪切, 拼接 } from "../../src/api/mod.ts";
import { 渲染 } from "../../src/mod.ts";

import { 切a, 切b } from "./c1.ts";

const 源 = new 加载器(".").目录("tmp");

const a = 源.文件("a", "img/a%.png");
const b = 源.文件("b", "img/b%.png");

const 段a = 批量剪切(a, 切a);
const 段b = 批量剪切(b, 切b);

// TODO
const 结果 = 拼接(段a.s1安装, 段a.s2安装, 段b.s3安装);

// 开始渲染
渲染(结果, 源.文件("2.sh"), 源.目录("tmp1"));

// ffmpeg -framerate 30 -i t2/%d.png -c:v libx264 -pix_fmt yuv420p 2.mp4
