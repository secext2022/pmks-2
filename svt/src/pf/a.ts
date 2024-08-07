// 配音和字幕处理
import { join } from "@std/path";

import { 加载器, 字幕, 时间至秒, 源文件, 秒至时间 } from "../api/mod.ts";
import { 合并音频, 文件项 } from "../util/ffmpeg.ts";
import { 根目录 } from "./mod.ts";

export interface 配音参数 {
  /**
   * 原始字幕输入
   *
   * 格式: 时间  文本
   */
  字幕稿: 源文件;
  /**
   * 配音片段的列表
   */
  音频列表: 源文件;
  /**
   * 音频文件的目录
   */
  音频目录: 加载器;
}

export interface 配音结果 {
  参数: 配音参数;
}

/**
 * 处理配音片段和字幕
 */
export function 配音(参数: 配音参数): 配音结果 {
  return {
    参数,
  };
}

interface 字幕项 {
  /**
   * 开始时间 (秒)
   */
  时间: number;
  /**
   * 字幕内容
   */
  文本: string;
}

async function 加载字幕稿(文件: string): Promise<Array<字幕项>> {
  const o: Array<字幕项> = [];
  const t = await Deno.readTextFile(文件);
  const l = t.split("\n");
  for (let i = 0; i < l.length; i += 1) {
    // 忽略空行
    if (l[i].trim().length < 1) {
      continue;
    }

    const p = l[i].split("  ");
    o.push({
      时间: 时间至秒(p[0]),
      文本: p.slice(1).join("  "),
    });
  }
  return o;
}

interface 音频项 {
  /**
   * 音频文件长度 (秒)
   */
  时长: number;
  /**
   * 文件名
   */
  文件: string;
}

async function 加载音频列表(文件: string): Promise<Array<音频项>> {
  const o: Array<音频项> = [];
  const t = await Deno.readTextFile(文件);
  const l = t.split("\n");
  for (let i = 0; i < l.length; i += 1) {
    // 忽略空行
    if (l[i].trim().length < 1) {
      continue;
    }

    const p = l[i].split("  ");
    o.push({
      时长: Number.parseFloat(p[0]),
      文件: p[1],
    });
  }
  return o;
}

// 处理生成字幕
function 生成字幕(字幕稿: Array<字幕项>, 音频列表: Array<音频项>): Array<字幕> {
  // TODO 更多检测, 字幕时间冲突 ?

  const o: Array<字幕> = [];
  for (let i = 0; i < 字幕稿.length; i += 1) {
    const s = 字幕稿[i];
    const a = 音频列表[i];
    // 计算字幕长度
    let 长度 = a.时长;
    // 规整字幕长度, 精度 0.1 秒, 延长 0.1 秒
    长度 = Math.ceil(长度 * 10 + 1) / 10;
    // 字幕长度至少 1 秒
    if (长度 < 1) {
      长度 = 1;
    }

    const x = {
      开始: s.时间,
      长度,
      文本: s.文本,
    };
    o.push(x);
  }
  return o;
}

// 生成 srt 字幕文件
function 生成srt(s: Array<字幕>): string {
  // srt 时间格式
  function tt(t: string): string {
    return t.split(".").join(",");
  }

  const o = [];
  for (let i = 0; i < s.length; i += 1) {
    const 序号 = i + 1;
    const 开始时间 = 秒至时间(s[i].开始);
    const 结束时间 = 秒至时间(s[i].开始 + s[i].长度);
    // 一条 srt 字幕格式
    o.push("" + 序号);
    o.push(tt(开始时间) + " --> " + tt(结束时间));
    o.push(s[i].文本);
    o.push("");
  }
  return o.join("\n");
}

// 用于获取文件路径
class 缓存 {
  // 根目录
  _r: string;

  constructor() {
    this._r = 根目录();
  }

  路径(原始: string): string {
    return join(this._r, 原始);
  }
}

export interface 渲染参数 {
  采样率: number;
  /**
   * 输出的音频文件
   */
  输出: 源文件;
  /**
   * 输出的字幕文件
   */
  字幕: 源文件;
  /**
   * 临时目录
   */
  临时: 加载器;
}

/**
 * 渲染生成音频和字幕
 */
export async function 渲染音频(输入: 配音结果, 参数: 渲染参数) {
  const c = new 缓存();

  const 字幕稿 = await 加载字幕稿(c.路径(输入.参数.字幕稿.位置));
  const 音频列表 = await 加载音频列表(c.路径(输入.参数.音频列表.位置));

  const 字幕数据 = 生成字幕(字幕稿, 音频列表);
  // 输出 srt 字幕
  const srt = 生成srt(字幕数据);

  const 路径 = c.路径(参数.字幕.位置);
  console.log(路径);
  await Deno.writeTextFile(路径, srt);

  // 输出合成的音频文件
  const 文件列表: Array<文件项> = [];
  const 音频目录 = c.路径(输入.参数.音频目录.路径());
  for (let i = 0; i < 字幕稿.length; i += 1) {
    文件列表.push({
      路径: join(音频目录, 音频列表[i].文件),
      时间: 字幕稿[i].时间,
    });
  }
  await 合并音频(文件列表, c.路径(参数.输出.位置));
}
