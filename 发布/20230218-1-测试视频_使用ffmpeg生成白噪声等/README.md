# 20230218-1

标题:
**测试视频: 使用 ffmpeg 生成白噪声/粉噪声/棕噪声/蓝噪声/紫噪声/丝绒噪声**

索引: `计算机入门`


## 视频

简介:

> (测试视频)
>
> 命令: `ffmpeg -f lavfi -i anoisesrc=c=0 -t 2s 0.wav`
>
> 视频编辑软件: kdenlive
>
> ----
>
> LICENSE: CC BY-SA 4.0
>
> 许可: 创意共享-署名-相同方式共享
>
> 2023-02-18

已发布: (6)
+ <https://www.bilibili.com/video/BV1jM411A7LG/>
+ <https://www.xiaohongshu.com/user/profile/63ee9978000000001001ead2/63f094a90000000012030909>
+ <https://www.zhihu.com/zvideo/1610326997099520000>
+ <https://www.ixigua.com/7201427114049045029>
+ <https://live.csdn.net/v/276841>
+ <https://www.acfun.cn/v/ac40694742>

视频文件信息:

```
> mediainfo 2.mp4
General
Complete name                            : 2.mp4
Format                                   : MPEG-4
Format profile                           : Base Media
Codec ID                                 : isom (isom/iso2/avc1/mp41)
File size                                : 693 KiB
Duration                                 : 12 s 11 ms
Overall bit rate                         : 473 kb/s
Writing application                      : Lavf58.76.100

Video
ID                                       : 1
Format                                   : AVC
Format/Info                              : Advanced Video Codec
Format profile                           : High@L4
Format settings                          : CABAC / 4 Ref Frames
Format settings, CABAC                   : Yes
Format settings, Reference frames        : 4 frames
Format settings, GOP                     : M=4, N=15
Codec ID                                 : avc1
Codec ID/Info                            : Advanced Video Coding
Duration                                 : 12 s 0 ms
Bit rate                                 : 305 kb/s
Width                                    : 1 920 pixels
Height                                   : 1 080 pixels
Display aspect ratio                     : 16:9
Frame rate mode                          : Constant
Frame rate                               : 25.000 FPS
Color space                              : YUV
Chroma subsampling                       : 4:2:0
Bit depth                                : 8 bits
Scan type                                : Progressive
Bits/(Pixel*Frame)                       : 0.006
Stream size                              : 447 KiB (64%)
Writing library                          : x264 core 163
Encoding settings                        : cabac=1 / ref=1 / deblock=1:0:0 / analyse=0x3:0x113 / me=hex / subme=2 / psy=1 / psy_rd=1.00:0.00 / mixed_ref=0 / me_range=16 / chroma_me=1 / trellis=0 / 8x8dct=1 / cqm=0 / deadzone=21,11 / fast_pskip=1 / chroma_qp_offset=0 / threads=6 / lookahead_threads=2 / sliced_threads=0 / nr=0 / decimate=1 / interlaced=0 / bluray_compat=0 / constrained_intra=0 / bframes=3 / b_pyramid=2 / b_adapt=1 / b_bias=0 / direct=1 / weightb=1 / open_gop=0 / weightp=1 / keyint=15 / keyint_min=1 / scenecut=40 / intra_refresh=0 / rc_lookahead=10 / rc=crf / mbtree=1 / crf=23.0 / qcomp=0.60 / qpmin=0 / qpmax=69 / qpstep=4 / ip_ratio=1.40 / aq=1:1.00
Color range                              : Limited
Color primaries                          : BT.709
Transfer characteristics                 : BT.709
Matrix coefficients                      : BT.709
Codec configuration box                  : avcC

Audio
ID                                       : 2
Format                                   : AAC LC
Format/Info                              : Advanced Audio Codec Low Complexity
Codec ID                                 : mp4a-40-2
Duration                                 : 12 s 11 ms
Source duration                          : 12 s 32 ms
Bit rate mode                            : Constant
Bit rate                                 : 161 kb/s
Channel(s)                               : 2 channels
Channel layout                           : L R
Sampling rate                            : 48.0 kHz
Frame rate                               : 46.875 FPS (1024 SPF)
Compression mode                         : Lossy
Stream size                              : 236 KiB (34%)
Source stream size                       : 236 KiB (34%)
Default                                  : Yes
Alternate group                          : 1
mdhd_Duration                            : 12011
```


## 图文版

[已发布](./a.md): (5)

+ <https://www.bilibili.com/opus/763947155985530901>
+ <https://www.jianshu.com/p/f8083d3c22b9>
+ <https://zhuanlan.zhihu.com/p/607450382>
+ <https://blog.csdn.net/secext2022/article/details/129103000>
+ <https://juejin.cn/post/7343902139821359140>

## 补充

+ 用 "真" 随机数据生成 白噪声:

  `ffmpeg -f u16le -ar 44100 -ac 1 -t 10s -i /dev/urandom 2.wav`

----

同步: 最近刚来掘金平台, 计划将自己之前在别的地方发的文章搬运 (同步) 过来.

首发日期 `2023-02-18`, 以下为原文内容.

----
