// svt/api: 接口层 (声明式)

export type { 字幕, 帧, 批量剪切参数, 源文件, 片段, 音频 } from "./t.ts";
export {
  帧_空,
  片段_空,
  片段类型_剪切,
  片段类型_图片,
  片段类型_拼接,
  片段类型_空,
  音频_空,
} from "./t.ts";

export { 加载器 } from "./load.ts";

export {
  减速,
  剪切,
  加速,
  叠加,
  图层,
  图片,
  应用,
  批量剪切,
  拼接,
  暂停,
  音频_剪切,
  音频_叠加,
  音频_拼接,
  音频_音量,
} from "./f/mod.ts";

export { 时间至帧数, 时间至秒, 秒至时间 } from "./util.ts";
