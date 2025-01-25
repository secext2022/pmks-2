// 片段过滤器: 具体实现

import {
  加载器,
  帧,
  片段,
  片段类型_剪切,
  片段类型_图片,
  片段类型_拼接,
  片段类型_空,
} from "../api/mod.ts";
import { 加载缓存 } from "./load.ts";

export type 过滤器 = AsyncIterable<帧>;

async function* 过滤器_剪切(
  视频: 片段,
  _临时: 加载器,
  缓存: 加载缓存,
): 过滤器 {
  const 源 = 视频._源!;
  const 开始 = 视频._a![0] as number;
  const 结束 = 视频._a![1] as number;

  const 帧 = await 缓存.加载(源);
  for (const i of 帧.slice(开始, 结束)) {
    yield i;
  }
}

async function* 过滤器_拼接(
  视频: 片段,
  临时: 加载器,
  缓存: 加载缓存,
): 过滤器 {
  const 段 = 视频._1 as Array<片段>;
  for (const i of 段) {
    const 下级 = 创建过滤器(i, 临时, 缓存);
    for await (const j of 下级) {
      yield j;
    }
  }
}

async function* 过滤器_空(
  _视频: 片段,
  _临时: 加载器,
  _缓存: 加载缓存,
): 过滤器 {
  // TODO
}

async function* 过滤器_图片(
  视频: 片段,
  _临时: 加载器,
  缓存: 加载缓存,
): 过滤器 {
  const 帧 = {
    类型: "img",
    位置: 缓存.文件(视频._源!),
  };
  const 帧数 = 视频._a![0] as number;
  for (let i = 0; i < 帧数; i += 1) {
    yield 帧;
  }
}

export function 创建过滤器(视频: 片段, 临时: 加载器, 缓存: 加载缓存): 过滤器 {
  switch (视频.类型) {
    case 片段类型_剪切:
      return 过滤器_剪切(视频, 临时, 缓存);
    case 片段类型_拼接:
      return 过滤器_拼接(视频, 临时, 缓存);
    case 片段类型_图片:
      return 过滤器_图片(视频, 临时, 缓存);
    case 片段类型_空:
      return 过滤器_空(视频, 临时, 缓存);
  }

  throw new Error("位置过滤器 " + 视频.类型);
}
