// api/t: 核心数据结构定义

/**
 * `帧`: 视频的一帧, 一张图片.
 */
export interface 帧 {
  /**
   * 帧的类型
   */
  类型: string;
  /**
   * 描述帧的来源, 用来获取帧.
   */
  位置: string;

  /**
   * 用于引用源文件.
   */
  _源?: 源文件;
}

/**
 * 空帧: 全黑/全透明.
 */
export function 帧_空(): 帧 {
  return {
    类型: "",
    位置: "",
  };
}

/**
 * `片段`: 视频片段, 若干帧的列表.
 */
export interface 片段 {
  类型: string;

  /**
   * 自己的参数
   */
  _a?: Array<string | number>;
  /**
   * 自己的参数 2
   */
  _r?: Record<string, string | number>;

  /**
   * 引用 片段
   */
  _1?: Array<片段>;
  /**
   * 引用 2
   */
  _2?: Record<string, 片段>;

  /**
   * 引用 源文件
   */
  _源?: 源文件;
}

/**
 * 空片段
 */
export const 片段类型_空 = "";
/**
 * 由剪切产生的片段.
 */
export const 片段类型_剪切 = "剪切";
/**
 * 由拼接产生的片段.
 */
export const 片段类型_拼接 = "拼接";
/**
 * 静态图片
 */
export const 片段类型_图片 = "图片";

/**
 * 空视频片段.
 */
export function 片段_空(): 片段 {
  return {
    类型: 片段类型_空,
  };
}

/**
 * `音频`: 声音片段.
 */
export interface 音频 {
  类型: string;
  值: string;
}

/**
 * 空音频片段.
 */
export function 音频_空(): 音频 {
  return {
    类型: "",
    值: "",
  };
}

/**
 * 加载的源文件.
 */
export interface 源文件 {
  类型: string;
  位置: string;

  /**
   * 定义帧率 (FPS)
   */
  帧率: number;
}

/**
 * 用于剪切多个片段.
 */
export interface 批量剪切参数 {
  /**
   * 时间点.
   */
  时间: Record<string, string | number>;

  /**
   * 一个片段由 2 个时间点 [开始, 结束) 构成.
   */
  片段: Record<string, [string, string]>;

  /**
   * 定义帧率 (FPS)
   */
  帧率?: number;
}

/**
 * 一条字幕
 */
export interface 字幕 {
  /**
   * 开始时间 (秒)
   */
  开始: number;
  /**
   * 持续时长 (秒)
   */
  长度: number;
  /**
   * 字幕内容
   */
  文本: string;
}
