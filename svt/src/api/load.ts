// 原始文件加载器
import { join } from "@std/path";

import { 源文件 } from "./t.ts";

/**
 * 用于定位文件.
 */
export class 加载器 {
  _根目录: string;
  _帧率: number;

  constructor(根目录: string) {
    this._根目录 = 根目录;
    this._帧率 = 0;
  }

  /**
   * 获取当前路径
   */
  路径(): string {
    return this._根目录;
  }

  /**
   * 设置帧率
   */
  帧率(fps: number): 加载器 {
    this._帧率 = fps;
    return this;
  }

  /**
   * 获取目录 (相对路径).
   */
  目录(路径: string): 加载器 {
    // 保存帧率
    return new 加载器(join(this._根目录, 路径)).帧率(this._帧率);
  }

  /**
   * 获取源文件 (相对路径).
   */
  文件(路径: string, 类型: string = ""): 源文件 {
    return {
      类型,
      位置: join(this._根目录, 路径),
      帧率: this._帧率,
    };
  }
}
