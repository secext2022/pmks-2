# 香橙派 HDMI 播放声音踩坑记录

本文记录使用香橙派播放声音遇到的一个故障, 及处理过程.


## 目录

+ 1 故障描述

  - 1.1 版本信息

+ 2 ALSA 播放声音正常

  - 2.1 ALSA 声音播放测试
  - 2.2 配置 ALSA 默认设备

+ 3 pipewire (pulseaudio) 播放声音异常

+ 4 解决方法

+ 5 总结与展望


## 1 故障描述

测试设备: 香橙派 Orange pi Zero3 (内存 1GB, 处理器 全志 H618)

操作系统: Debian 12 (官方镜像, Linux 6.1)

使用 HDMI 连接显示器, 显示器有内置喇叭, 通过 HDMI 播放声音.

故障现象:
有声音, 但是播放声音的频率不对, 偏低.
播放声音的时长也不对, 正常 1 秒的音频, 可能实际上播放了 2 秒.
(这个故障不太好描述, 就是播放声音的波形拉长了 )

所以播放出来的声音听起来很奇怪.
实际应用需求是使用 electronjs (chromium) 播放声音.
刚开始没太注意这个问题, 后来在测试音量功能时发现了这个故障.

### 1.1 版本信息

本节列出各软件包的版本, 因为更新版本的软件可能已经解决了这个故障.

系统版本:

```
orangepi@orangepizero3 ~> uname -a
Linux orangepizero3 6.1.31-sun50iw9 #1.0.0 SMP Mon Jul  3 13:44:03 CST 2023 aarch64 GNU/Linux
orangepi@orangepizero3 ~> neofetch
       _,met$$$$$gg.          orangepi@orangepizero3 
    ,g$$$$$$$$$$$$$$$P.       ---------------------- 
  ,g$$P"     """Y$$.".        OS: Debian GNU/Linux 12 (bookworm) aarch64 
 ,$$P'              `$$$.     Host: OrangePi Zero3 
',$$P       ,ggs.     `$$b:   Kernel: 6.1.31-sun50iw9 
`d$$'     ,$P"'   .    $$$    Uptime: 12 hours, 27 mins 
 $$P      d$'     ,    $$P    Packages: 1259 (dpkg) 
 $$:      $$.   -    ,d$$'    Shell: fish 3.6.0 
 $$;      Y$b._   _,d$P'      Resolution: 1920x1080 
 Y$$.    `.`"Y$$$$P"'         Terminal: /dev/pts/0 
 `$$b      "-.__              CPU: (4) @ 1.512GHz 
  `Y$$                        Memory: 554MiB / 981MiB 
   `Y$$.
     `$$b.                                            
       `Y$$b.                                         
          `"Y$b._
              `"""
```

ALSA 版本:

```
orangepi@orangepizero3 ~> apt search alsa | grep installed

alsa-utils/stable,now 1.2.8-1 arm64 [installed]
libasound2/stable,now 1.2.8-1+b1 arm64 [installed,automatic]
libasound2-data/stable,stable,now 1.2.8-1 all [installed,automatic]
libasound2-plugins/stable,now 1.2.7.1-1 arm64 [installed,automatic]
libatopology2/stable,now 1.2.8-1+b1 arm64 [installed,automatic]
```

pipewire 版本:

```
orangepi@orangepizero3 ~> apt search pipewire

libpipewire-0.3-0/stable 0.3.65-3 arm64
  libraries for the PipeWire multimedia server

libpipewire-0.3-common/stable,stable 0.3.65-3 all
  libraries for the PipeWire multimedia server - common files

libpipewire-0.3-dev/stable 0.3.65-3 arm64
  libraries for the PipeWire multimedia server - development

libpipewire-0.3-modules/stable 0.3.65-3 arm64
  libraries for the PipeWire multimedia server - modules

pipewire/stable,now 0.3.65-3 arm64 [residual-config]
  audio and video processing engine multimedia server

pipewire-alsa/stable 0.3.65-3 arm64
  PipeWire ALSA plugin

pipewire-audio/stable,stable 0.3.65-3 all
  recommended set of PipeWire packages for a standard audio desktop use

pipewire-audio-client-libraries/stable,stable 0.3.65-3 all
  transitional package for pipewire-alsa and pipewire-jack

pipewire-bin/stable,now 0.3.65-3 arm64 [residual-config]
  PipeWire multimedia server - programs

pipewire-pulse/stable,now 0.3.65-3 arm64 [residual-config]
  PipeWire PulseAudio daemon

wireplumber/stable,now 0.4.13-1 arm64 [residual-config]
  modular session / policy manager for PipeWire
```

pulseaudio 版本:

```
orangepi@orangepizero3 ~> apt search pulseaudio

libpulse0/stable,now 16.1+dfsg1-2+b1 arm64 [installed,automatic]
  PulseAudio client libraries

pipewire-pulse/stable,now 0.3.65-3 arm64 [residual-config]
  PipeWire PulseAudio daemon

pulseaudio-utils/stable 16.1+dfsg1-2+b1 arm64
  Command line tools for the PulseAudio sound server
```

electronjs 和 chromium 版本:

```
orangepi@orangepizero3 ~> electron --version
v28.1.2
orangepi@orangepizero3 ~> chromium --version
Chromium 119.0.6045.199 built on Debian 12.2, running on Debian 12.4
```


## 2 ALSA 播放声音正常

Linux 的声音系统混乱而复杂,
涉及到 ALSA, OSS, pulseaudio, JACK, pipewire 等.
这其中的每一个又对应一堆工具, 命令, 配置等.

OSS 是很早之前的旧的声音驱动框架, ALSA 替代了 OSS, 所以可以忽略 OSS.
ALSA (高级 Linux 声音架构) 是目前 Linux 内核的声音设备驱动框架.
pulseaudio 是一个声音服务器 (audio server),
可以认为是一个中介, 一个系统级的声音管理器, 一边连接着所有的声音设备,
另一边连接着所有使用声音功能 (播放声音, 录音等) 的应用程序.
JACK 是一个专业用途的声音服务器, 此处没有用到, 忽略.
pipewire 的目标是替代 pulseaudio, 功能类似.

可以认为, Linux 的声音软件分为 3 层:

+ (1) 设备驱动 (内核接口): ALSA, OSS (已淘汰)

  这个是最底层的软件.

+ (2) 声音服务器 (audio server): pulseaudio (正在被淘汰), JACK, pipewire

  这个是中间层.

+ (3) 应用程序: 比如 chromium (播放声音)

  这个是上层.

既然声音播放出了问题, 就一层一层的测试吧, 先从 ALSA 开始.

### 2.1 ALSA 声音播放测试

查看 ALSA 声音播放设备:

```
orangepi@orangepizero3 ~> aplay -l
**** List of PLAYBACK Hardware Devices ****
card 0: audiocodec [audiocodec], device 0: CDC PCM Codec-0 [CDC PCM Codec-0]
  Subdevices: 1/1
  Subdevice #0: subdevice #0
card 2: ahubhdmi [ahubhdmi], device 0: ahub_plat-i2s-hifi i2s-hifi-0 [ahub_plat-i2s-hifi i2s-hifi-0]
  Subdevices: 1/1
  Subdevice #0: subdevice #0
```

此处有 2 个设备, 其中 `card 0 device 0` 是模拟音频输出 (3.5mm 耳机接口),
`card 2 device 0` 是 HDMI 播放声音.

遇到问题, 先看用户手册, 香橙派的官方手册:
《**OrangePi Zero3 H618 用户手册** v1.1 .pdf》
(来源: <http://www.orangepi.cn/html/hardWare/computerAndMicrocontrollers/service-and-support/Orange-Pi-Zero-3.html>)

按照其中 `3.12.1.2. HDMI 音频播放测试` 章节描述的方法:

```
orangepi@orangepizero3 ~> aplay -D hw:2,0 4.wav
Playing WAVE '4.wav' : Signed 16 bit Little Endian, Rate 48000 Hz, Stereo
```

嗯 ?
播放正常 ??
这什么情况 !

```
orangepi@orangepizero3 ~> aplay 4.wav
Playing WAVE '4.wav' : Signed 16 bit Little Endian, Rate 48000 Hz, Stereo
```

嗯, 故障又出现了.
其中 `-D hw:2,0` 表示指定 `card 2 device 0` 作为声音播放设备.
加上这个参数就正常, 不加就准确复现故障.

使用 ffmpeg 测试:

```sh
ffmpeg -i 8.ogg -f alsa hw:2,0
```

这个正常.

```sh
ffmpeg -i 8.ogg -f alsa default
```

这个就又出现故障了.
看来使用 ALSA `hw:2,0` 设备进行播放就是正常的,
使用 ALSA 默认设备就故障了.

使用 ffplay 测试:

```sh
SDL_AUDIODRIVER=alsa ffplay -autoexit -nodisp 8.ogg
```

也能复现故障.

那么, 问题就是 ALSA 默认设备配置不正确 ?

### 2.2 配置 ALSA 默认设备

查找了半天资料, 经过多次尝试, 终于得到了以下有效配置:

```
orangepi@orangepizero3 ~> cat /etc/asound.conf
defaults.pcm.!card 2
defaults.ctl.!card 2
defaults.pcm.!device 0
defaults.ctl.!device 0

pcm.!default {
  type hw
  card 2
}

ctl.!default {
  type hw
  card 2
}
orangepi@orangepizero3 ~>
```

重启, 然后测试:

```sh
ffmpeg -i 8.ogg -f alsa hw:2,0
```

这个

```sh
ffmpeg -i 8.ogg -f alsa default
```

这个

```sh
SDL_AUDIODRIVER=alsa ffplay -autoexit -nodisp 8.ogg
```

还有这个, 这下都播放正常了.


## 3 pipewire (pulseaudio) 播放声音异常

目前 ALSA 播放正常了, 但是 pipewire (pulseaudio) 仍然故障:

```sh
SDL_AUDIODRIVER=pulse ffplay -autoexit -nodisp 8.ogg
```

这个

```sh
ffplay -autoexit -nodisp 8.ogg
```

还有这个, 都播放不正常.

这个故障很奇怪, 但是目前能确定 ALSA 正常了, 问题就在 pipewire 这里.

但是, 这个问题怎么解决 ?
查找了半天资料, 经过多次尝试, 都无效, 无奈只能放弃.


## 4 解决方法

查看了关于 chromium 和 electronjs 的资料,
发现这俩软件只对 ALSA 有依赖, 并没有对 pulseaudio 有依赖.

既然 electronjs 直接使用 ALSA 播放声音, ALSA 目前又正常了,
那么实际使用 electronjs 播放声音, 为啥还是故障 ?
这奇怪的故障 !

没办法了, 把 pipewire (pulseaudio) 都卸载了吧:

```
orangepi@orangepizero3 ~> apt search pipewire | grep installed
```

确认卸载了所有 pipewire 相关的软件包.

```
orangepi@orangepizero3 ~> apt search pulseaudio | grep installed

libpulse0/stable,now 16.1+dfsg1-2+b1 arm64 [installed,automatic]
```

pulseaudio 相关的软件包只保留这一个, 别的全部卸载.

重启, 然后:
播放声音居然正常了 !
故障居然解决了 !!
啊 ~~


## 5 总结与展望

实际需求是使用 electronjs 播放声音, 目前正常了, 问题已经解决了.

使用香橙派 HDMI 播放声音, 声音频率变低, 播放时间变长, 听起来很奇怪.
使用官方用户手册的方法进行测试, 播放声音正常.
使用 ALSA `hw:2,0` 设备播放正常, ALSA 默认设备播放故障.
通过修改 ALSA 配置文件, 使得默认设备也正常了.

但是 pipewire (pulseaudio) 播放声音仍然故障, 并且无法解决, 只能放弃.
卸载 pipewire 和 pulseaudio 相关的软件包之后, 故障消失了.

这个故障其实并没有彻底搞明白, 也就是 pipewire 为何故障, 不知道.
好在目前并不需要使用 pipewire, 凑合着用吧.
以后有时间的话, 再回来仔细研究这个故障吧.

----

本文使用 CC-BY-SA 4.0 许可发布.
