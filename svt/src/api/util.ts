// 工具函数

/**
 * 解析时间字符串, 转换成帧数
 */
export function 时间至帧数(时间: string | number, 帧率: number): number {
  if (typeof 时间 == "number") {
    // 数字直接表示帧数, 无需转换
    return 时间;
  }

  // 支持格式: `02:16.235`
  const p = 时间.split(":");
  p.reverse();
  // 时间字符串转换为秒数
  let 秒 = Number.parseFloat(p[0]);
  if (p.length > 1) {
    // 分钟
    秒 += Number.parseInt(p[1]) * 60;
  }

  // 根据帧率, 转换为帧数
  return Math.floor(秒 * 帧率);
}

/**
 * 解析时间字符串, 转换成秒
 */
export function 时间至秒(时间: string | number): number {
  if (typeof 时间 == "number") {
    // 数字直接表示秒, 无需转换
    return 时间;
  }

  // 支持格式: `02:16.235`
  const p = 时间.split(":");
  p.reverse();
  let 秒 = Number.parseFloat(p[0]);
  if (p.length > 1) {
    秒 += Number.parseInt(p[1]) * 60;
  }
  return 秒;
}

/**
 * 秒格式化为时间字符串
 *
 * 输出格式: `00:00:01.233`
 */
export function 秒至时间(秒: number): string {
  const 分1 = Math.floor(秒 / 60);
  const 秒2 = 秒 - 分1 * 60;

  const 时 = Math.floor(分1 / 60);
  const 分 = 分1 - 时 * 60;

  // 前补 0
  function z(a: string | number, len: number = 2): string {
    const i = "" + a;
    if (i.length < len) {
      return "0" + i;
    }
    return i;
  }

  return [z(时), z(分), z(秒2.toFixed(3), 6)].join(":");
}
