# 高画质投屏: Sunshine / Moonlight 局域网串流 (高帧率, 高码率, 低延迟)

上文说到, 使用 WebRTC + 浏览器 实现的 简单 局域网 投屏, 画面糊, 延迟高, 体验很不好.
无法实现 **高帧率**, **高码率**, **低延迟**.

咦, 怎么不试试 **游戏级** 局域网 **串流** (投屏) 呢 ? 好像刚好符合这个需求呀 ~~

本文使用 sunshine + moonlight 开源软件 (组合) 实现 PC (ArchLinux) -> 平板 (Android) 的投屏.

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 90 号作品. )

----

相关文章:

+ Android 禁止侧载将正式实施，需要等待 24 小时冷静期

  TODO

+ 《使用 WebRTC 实现局域网投屏: PC (GNOME ArchLinux) -> 平板 (Android)》

  TODO

+ 《在 Android 设备上写代码 (Termux, code-server)》

  TODO

+ 《低功耗低成本 PC (可更换内存条) 推荐 (笔记本, 小主机)》

  TODO

参考资料:

+ <https://moonlight-stream.org/>
+ <https://app.lizardbyte.dev/Sunshine/?lng=zh-CN>
+ <https://docs.lizardbyte.dev/projects/sunshine/latest/md_docs_2getting__started.html>
+ <https://github.com/moonlight-stream>
+ <https://github.com/LizardByte/Sunshine>
+ <https://github.com/moonlight-stream/moonlight-docs/wiki/Frequently-Asked-Questions>
+ <https://aur.archlinux.org/packages/sunshine-beta-bin>
+ <https://wiki.archlinux.org/title/Arch_User_Repository>


## 目录

+ 1 安装软件

+ 2 连接配置

  - 2.1 Sunshine 配置
  - 2.2 Moonlight 配置

+ 3 串流测试

+ 4 总结与展望

+ 附录 1 软硬件配置

+ 附录 2 推荐 AccuBattery (免费软件): Android 设备电池容量测量


## 1 安装软件

首先在 PC (台式机/笔记本/小主机) 上安装 **Sunshine**, 参考官方文档:
<https://docs.lizardbyte.dev/projects/sunshine/latest/md_docs_2getting__started.html>

ArchLinux 用户建议从 AUR 安装:
<https://aur.archlinux.org/packages/sunshine-beta-bin>

(0) 如果没用过 AUR, 首先安装软件:

```sh
sudo pacman -S base-devel
```

(1) 在 `sunshine-beta-bin` 的 AUR 页面, 点击 **Download snapshot** 下载快照.

(2) 解压快照:

```sh
> tar -xvf sunshine-beta-bin.tar.gz
sunshine-beta-bin/
sunshine-beta-bin/.SRCINFO
sunshine-beta-bin/PKGBUILD
sunshine-beta-bin/sunshine-capabilities.hook
```

(3) 编译软件包:

```sh
cd sunshine-beta-bin
makepkg
```

(4) 安装软件包:

```sh
sudo pacman -U sunshine-beta-bin-2026.423.21833.pkg.tar.zst
```

(可选) 然后根据 GPU 安装所需的硬件编码驱动:

```
sunshine 的可选依赖
    cuda: Nvidia GPU encoding support
    libva-mesa-driver: AMD GPU encoding support [已安装]
    xorg-server-xvfb: Virtual X server for headless testing
```

至此, Sunshine 的安装就完成了.

----

然后在 Android 设备上 (比如 平板) 安装 **Moonlight**.

可以从 fdroid 安装, 详见文章: 《在 Android 设备上写代码 (Termux, code-server)》


## 2 连接配置

### 2.1 Sunshine 配置

(1) 先手动启动 sunshine 进行配置:

```sh
sunshine
```

然后在浏览器打开初始化配置界面: `https://localhost:47990`

![sunshine 设置密码](./图/2-s-1.png)

设置登录密码.

![sunshine 输入密码](./图/2-s-2.png)

登录之后:

![sunshine 登录之后](./图/2-s-3.png)

配置界面:

![sunshine 配置界面](./图/2-s-4.png)

通常默认配置即可.

----

(2) 设置自动启动:

```sh
systemctl --user enable app-dev.lizardbyte.app.Sunshine
```

### 2.2 Moonlight 配置

将平板连接到 wifi (局域网), 然后打开 Moonlight:

![moonlight 连接 (1)](./图/2-m-10.png)

点击右上角的加号:

![moonlight 连接 (2)](./图/2-m-11.png)

输入 PC (sunshine) 的 IP 地址:

![moonlight 连接 (3)](./图/2-m-12.png)

此时会出现一个 带锁 的图标.

----

配置界面:

![moonlight 配置 (1)](./图/2-m-20.png)

设置分辨率 (此处为 1920x1080):

![moonlight 配置 (2)](./图/2-m-21.png)

设置帧率 (此处为 90fps):

![moonlight 配置 (3)](./图/2-m-22.png)

设置码率 (此处为 50Mbps):

![moonlight 配置 (4)](./图/2-m-23.png)

----

点击图标进行连接:

![配对 (1)](./图/2-m-30.png)

需要在 PC 的 sunshine 界面中输入 PIN (配对码):

![配对 (sunshine)](./图/2-s-5.png)

其中 设备名称 就是给这个设备起一个名字 (随便输入).

![配对 (2)](./图/2-m-31.png)

配对成功, 显示的 **DESKTOP** 就可以用来串流整个屏幕了.

![配对 (3)](./图/2-m-32.png)

配对后图标就没有 锁 了.


## 3 串流测试

点击上面 moonlight 中的 DESKTOP 图标, 开始串流:

![测试 (1)](./图/3-t-1.png)

成功 !

从 moonlight 左上角的详情可以看出:
1920x1080 分辨率, 90fps 帧率, HEVC 硬件编码/解码.
网络延迟 2ms, 总延迟约 10ms.

主观感受: 延迟很低, 画面清晰.

撒花 !~~


## 4 总结与展望

如果同时追求 高画质 (高帧率, 高码率), 低延迟, 那么使用 **游戏** 级串流技术, 就是正解 !

俗话说, 好的名称就是成功的一半 (狗头).
Moonlight (月光) / Sunshine (阳光) 软件 (组合) 的名称就很有意境:
PC 主机通常具有 高算力, 就像 太阳 具有大质量.
PC 输出的 显示画面, 就像太阳输出的辐射功率.
平板 算力更低, 就像月亮质量更小.
月光 是月球反射的阳光, 就像 平板 显示 PC 输出的画面.

这也证明了, 局域网投屏同时实现 高帧率, 高码率, 低延迟, 不是硬件的问题 (可以实现), 之前纯粹是软件问题 (WebRTC 协议, 或者 chromium 浏览器实现).

**电子游戏** 是促进人类发展的重要力量, 很多游戏相关的技术, 源于游戏, 但在更多非游戏领域有重要应用.
就说最近几年火的不行的 AI 吧, 没有 GPU 就没有如今的 AI, 而没有游戏就没有 GPU.
做人不能吃饭砸锅.


## 附录 1 软硬件配置

软件版本:

```sh
> uname -a
Linux S2L 6.19.14-zen1-1-zen #1 ZEN SMP PREEMPT_DYNAMIC Thu, 23 Apr 2026 06:56:44 +0000 x86_64 GNU/Linux
> gnome-shell --version
GNOME Shell 50.1
> sunshine --version
[2026-04-26 19:03:58.985]: Info: Sunshine version: 2026.423.21833 commit: 5cf5e8c1ceb0a0d3630851a09b19577a96bbe9b8
[2026-04-26 19:03:58.985]: Info: Package Publisher: LizardByte
[2026-04-26 19:03:58.985]: Info: Publisher Website: https://app.lizardbyte.dev
[2026-04-26 19:03:58.985]: Info: Get support: https://app.lizardbyte.dev/support
```

![Moonlight (1)](./图/a1-a-1.png)

Moonlight (apk) 版本: 12.1

----

硬件配置:

![PC (1)](./图/a1-p-1.png)

PC: 处理器 r7-5825u (8 核 16 线程), 内存 64GB (DDR4-3200 双通道).

![PC (2)](./图/a1-p-2.png)

PC 显示器: LCD 分辨率 1920x1080, 刷新率 100Hz.

![平板 (1)](./图/a1-t-1.png)

平板: 处理器 骁龙 870 (6G+128G), Android 13.

![平板 (2)](./图/a1-t-2.png)

平板屏幕: OLED 刷新率 90Hz.

网络: PC 有线以太网 1Gbps, 平板 wifi 6 (5GHz, 链路速率 1200Mbps, WPA3), 红米路由器 ax5400.


## 附录 2 推荐 AccuBattery (免费软件): Android 设备电池容量测量

可以从这里下载: <https://download.cnet.com/accubattery/3000-20432_4-77379994.html>

![AccuBattery (1)](./图/a2-a-1.png)

安装后界面如图.

![AccuBattery (2)](./图/a2-a-2.png)

窝觉的, 这个软件最重要的功能, 就是通过完整充电来检测设备电池的实际容量.
这个可以看出电池的损耗 (虽然测量精度不一定高), 特别是对于老设备, 方便换电池, 做到心中有数.

----

本文使用 CC-BY-SA 4.0 许可发布.
