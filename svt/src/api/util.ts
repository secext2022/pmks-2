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
