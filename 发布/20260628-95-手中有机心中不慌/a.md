# 手中有机, 心中不慌 (5 只 二手 Android 手机)

**声明: 仅为个人体验, 仅供参考.**

最近, 各种东西疯狂涨价, 作为 普通消费者 的体验越来越差了.
但是, 窝要说: 手中有机, 心中不慌 !

在这波涨价之前, 窝早已购买多只 (二手) 手机 (狗头

为什么只买 二手 ? 当然是因为 **穷** 啊.

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 95 号作品. )

----

相关文章:

+ Android 禁止侧载将正式实施，需要等待 24 小时冷静期

  TODO

+ 《在 Android 设备上写代码 (Termux, code-server)》

  TODO

+ 《低功耗低成本 PC (可更换内存条) 推荐 (笔记本, 小主机)》

  TODO

+ 《离线安装 ArchLinux 操作系统 (DVD 光盘)》

  TODO

+ 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》

  TODO

+ 《在 Termux 中签名 apk 文件》

  TODO

+ 《使用 epub 在手机快乐阅读》

  TODO

+ 《Android 输入法框架简介》

  TODO

参考资料:

+ <https://wiki.lineageos.org/devices/violet/>
+ <https://wiki.lineageos.org/devices/gauguin/variant3/>
+ <https://evolution-x.org/devices/raphael>
+ <https://wiki.lineageos.org/devices/kebab/variant1/>


## 目录

+ 1 手机列表

+ 2 使用 adb 解决 lineageos 连网检测问题

+ 3 总结与展望


## 1 手机列表

这些是最近 7 年, 窝陆续购买的 (淘宝) 二手 手机, 很少翻车:

![手机后盖](./图/1-p-1.png)

+ (1) 型号: 红米 note 7 pro (, 设备代码: `violet`)

  硬件配置: 骁龙 675, 6G+128G.

  软件系统: Android 16, Linux 4.14

  内存占用: 2.2GB

+ (2) 型号: 红米 note 9 pro (M2007J17C, 设备代码: `gauguin`)

  硬件配置: 骁龙 750, 8G+256G.

  软件系统: Android 16, Linux 4.19

  内存占用: 2.3GB

+ (3) 型号: 红米 k20 pro (设备代码: `raphael`)

  硬件配置: 骁龙 855, 12G+512G.

  软件系统: Android 16, Linux 4.14

  内存占用: 3.2GB

+ (4) 型号: 一加 8t (KB2000, 设备代码: `kebab`)

  硬件配置: 骁龙 865, 12G+256G.

  软件系统: Android 16, Linux 4.19

  内存占用: 2.6GB

+ (5) 型号: 一加 ace 2 pro (PJA110, kalama)

  硬件配置: 骁龙 8 gen2, 24G+1T.

  软件系统: Android 16, Linux 5.15

![系统版本](./图/1-p-2.png)

----

这是重启手机后, 不运行任何应用, 查看的内存占用:

![内存占用](./图/1-p-3.png)

可以看到, 更换 lineageos 系统之后, 无论内存 (6G/8G/12G) 多大, 系统本身只占用约 2GB ~ 3GB 内存, 剩余可用空间很大.

与之相比, 手机出厂系统会占用更多内存 (通常占用 50% 内存, 内存越大占用越多).


## 2 使用 adb 解决 lineageos 连网检测问题

因为 众所周知 的原因, 原版 lineageos 系统在连网检测上有问题:

![网络连接受限](./图/2-n-1.png)

如图, 显示 `网络连接受限`. 这可以通过几条 adb 命令来解决:

```sh
adb shell "settings put global captive_portal_http_url http://connect.rom.miui.com/generate_204"

adb shell "settings put global captive_portal_https_url https://connect.rom.miui.com/generate_204"

adb shell "settings put global ntp_server ntp1.aliyun.com"
```

重启手机:

![连网正常](./图/2-n-2.png)

正常了, 撒花 ~~


## 3 总结与展望

因为已经有了 **24G+1T** 的手机, 所以下次计划更换手机时, 必须等 32G+2T 的手机发布 ! (狗头

但是吧, 看目前的这种超级畸形的行情, 立这个 flag 等效于 至少 3 ~ 5 年 不买新手机 (笑

顺便, 窝的 PC 主机是 128GB 内存 + 4T 存储 + 16GB 显存 (DDR4-3200 双通道 32GB 单条 x4, Ti 7100 M.2 NVMe SSD, 9060xt) (被 老公 霸占了, 悲), 还有 64GB 内存 小主机 (GMK, CPU 5825u) 和 64GB 内存 笔记本 (hp 战 66, CPU 5625u), 共 **256GB** DDR4 内存.
还有 2 台 备用 主机 (各 32GB 内存) (狗头

所以, 手中有机, 心中不慌 !

----

本文使用 CC-BY-SA 4.0 许可发布.
