// api/f/fs: 片段过滤器.
import {
  批量剪切参数,
  源文件,
  片段,
  片段_空,
  片段类型_剪切,
  片段类型_图片,
  片段类型_拼接,
} from "../t.ts";
import { 时间至帧数 } from "../util.ts";

/**
 * 从视频获取片段.
 */
export function 剪切(): 片段 {
  return 片段_空();
  // TODO
}

/**
 * 拼接多段视频.
 */
export function 拼接(...段: Array<片段>): 片段 {
  return {
    类型: 片段类型_拼接,
    _1: 段,
  };
}

/**
 * 视频加速播放.
 */
export function 加速(): 片段 {
  // TODO
  return 片段_空();
}

/**
 * 视频减速播放
 */
export function 减速(): 片段 {
  // TODO
  return 片段_空();
}

/**
 * 视频暂停播放, 停留在某一帧.
 */
export function 暂停(): 片段 {
  // TODO
  return 片段_空();
}

/**
 * 给每一帧, 应用 帧过滤器.
 */
export function 应用(): 片段 {
  // TODO
  return 片段_空();
}

/**
 * 多个视频流垂直叠加.
 */
export function 图层(): 片段 {
  // TODO
  return 片段_空();
}

/**
 * 一次剪切多个片段.
 */
export function 批量剪切(
  源: 源文件,
  参数: 批量剪切参数,
): Record<string, 片段> {
  function 检查时间(点: string) {
    if (null == 参数.时间[点]) {
      throw new Error("未定义时间 " + 点);
    }
  }

  const o: Record<string, 片段> = {};
  for (const i of Object.keys(参数.片段)) {
    const [开始, 结束] = 参数.片段[i];
    // 检查错误: 时间点未定义
    检查时间(开始);
    检查时间(结束);

    const 开始帧 = 时间至帧数(参数.时间[开始], 源.帧率);
    const 结束帧 = 时间至帧数(参数.时间[结束], 源.帧率);
    o[i] = {
      类型: 片段类型_剪切,
      _a: [开始帧, 结束帧],
      _源: 源,
    };
  }
  return o;
}

/**
 * 静态图片, 持续一段时间
 */
export function 图片(时长: number | string, 源: 源文件): 片段 {
  // 时长转换成帧数
  const 帧数 = 时间至帧数(时长, 源.帧率);

  return {
    类型: 片段类型_图片,
    _a: [帧数],
    _源: 源,
  };
}
