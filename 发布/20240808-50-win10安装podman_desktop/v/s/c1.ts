// 剪切 1
import { 批量剪切参数 } from "../../src/api/mod.ts";

// 录屏视频 1
export const 切a: 批量剪切参数 = {
  时间: {
    p1开始: "00:06",
    p2重启: "02:41",
    p3重启后: "04:41",
    p4下一步: "05:32",
  },
  片段: {
    s1安装: ["p1开始", "p2重启"],
    s2安装: ["p3重启后", "p4下一步"],
  },
};

// 录屏视频 2
export const 切b: 批量剪切参数 = {
  时间: {
    //p1开始: "00:21",
    p1开始: "01:01",
    p2结束: "03:26",
  },
  片段: {
    s3安装: ["p1开始", "p2结束"],
  },
};
