// 源文件加载器: 具体实现
import { join } from "@std/path";

import { 帧, 源文件 } from "../api/mod.ts";

// 加载图片类型: img/*.png
async function 加载img(类型: string, 位置: string): Promise<Array<帧>> {
  console.debug("  加载img: " + 位置);

  const 文件名 = 类型.split("/")[1];
  const p = 文件名.split("%");
  const 后缀 = 文件名.split(".").at(-1);

  const o: Array<[number, 帧]> = [];
  // 列出目标目录
  for await (const i of Deno.readDir(位置)) {
    const n = i.name;
    // 检查文件名
    if (n.startsWith(p[0]) && n.endsWith(p[1])) {
      const 序号 = Number.parseInt(
        n.slice(p[0].length, n.length - p[1].length),
      );
      o.push([
        序号,
        {
          类型: 后缀 as string,
          位置: join(位置, n),
        },
      ]);
    }
  }
  // 排序: 升序
  o.sort((a, b) => a[0] - b[0]);

  return o.map((x) => x[1]);
}

export async function 加载源文件(
  { 类型, 位置 }: 源文件,
  根目录: string,
): Promise<Array<帧>> {
  if (类型.startsWith("img/")) {
    return await 加载img(类型, join(根目录, 位置));
  }

  throw new Error("未知源类型 " + 类型);
}

/**
 * 按照 类型, 位置 缓存源文件, 避免重复加载
 */
export class 加载缓存 {
  _c: Map<string, Map<string, Array<帧>>>;
  _r: string;

  constructor(根目录: string) {
    this._c = new Map();
    this._r = 根目录;
  }

  // 直接返回拼接路径
  文件(源: 源文件): string {
    return join(this._r, 源.位置);
  }

  async 加载(源: 源文件): Promise<Array<帧>> {
    const c1 = this._c.get(源.类型);
    if (null != c1) {
      const c2 = c1.get(源.位置);
      if (null != c2) {
        return c2;
      }
      // 加载 (c2)
      const o = await 加载源文件(源, this._r);
      c1.set(源.位置, o);
      return o;
    }
    // 加载 (c1)
    const c = new Map();
    const o = await 加载源文件(源, this._r);
    c.set(源.位置, o);
    this._c.set(源.类型, c);
    return o;
  }
}
