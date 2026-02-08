# Linux 内核 BUG: Android 手机 USB 网络共享 故障

众所周知, 窝日常使用 ArchLinux 操作系统, 而 ArchLinux 是一个滚动发行版本, 也就是各个软件包更新很快.

然而, 突然发现, Android 手机的 USB 网络共享功能 BUG 了.

经过一通排查, 发现是 Linux 内核造成的 BUG.
哎, 没办法, 只能自己动手修改内核代码, 修复 BUG 了.

本文就来介绍这还算新鲜热乎的 Linux 内核 BUG !

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 69 号作品. )

----

相关文章:

+ 《流浪 Linux: 外置 USB SSD 安装 ArchLinux》

  TODO

+ 《流浪 ArchLinux 后续: 修复 fstrim USB SSD》

  TODO

+ 《低功耗低成本 PC (可更换内存条) 推荐 (笔记本, 小主机)》

  TODO

参考资料:

+ <https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/drivers/net/usb/rndis_host.c?h=v6.12.23>
+ <https://patchwork.kernel.org/project/netdevbpf/patch/20250311091035.2523903-1-lkundrak@v3.sk/>
+ <https://bbs.archlinux.org/viewtopic.php?id=304892>
+ <https://wiki.archlinux.org/title/Kernel/Arch_build_system>


## 目录

+ 1 BUG 分析 (故障描述)

  - 1.1 Android udev 规则
  - 1.2 内核 rndis_host 模块

+ 2 解决方案: 自己编译 Linux 内核 (ArchLinux)

+ 3 测试结果

+ 4 总结与展望


## 1 BUG 分析 (故障描述)

使用 USB 数据线连接 Android 手机和 PC 主机, 然后在手机上启用
**USB 网络共享** 功能:

![手机界面](./图/1-usb-1.jpg)

然后 PC 主机上就会出现一个 USB 网卡:

```sh
> ip link

省略

6: wwp5s0f3u2: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN mode DEFAULT group default qlen 1000
    link/ether f2:a2:ef:01:02:03 brd ff:ff:ff:ff:ff:ff
    altname wwxf2a2ef010203
```

嗯 ? 这什么情况 ?? `wwp` 开头的网卡是啥 ?

以前正常的时候, 出现的网卡是 `enp` 开头的, 就像:

```sh
2: enp1s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
    link/ether 84:47:09:01:02:03 brd ff:ff:ff:ff:ff:ff
    altname enx844709010203
```

----

内核版本:

```sh
> uname -a
Linux SC202501C7LA 6.14.2-zen1-1-zen #1 ZEN SMP PREEMPT_DYNAMIC Thu, 10 Apr 2025 18:43:47 +0000 x86_64 GNU/Linux
```

### 1.1 Android udev 规则

在 Linux 系统中, `udev` 用于处理硬件的热插拔.
会不会是这里出了问题 ?

```sh
> pacman -Ss android-udev
extra/android-udev 20250314-1 [已安装]
    Udev rules to connect Android devices to your linux box
> pacman -Ql android-udev
android-udev /usr/
android-udev /usr/lib/
android-udev /usr/lib/sysusers.d/
android-udev /usr/lib/sysusers.d/android-udev.conf
android-udev /usr/lib/udev/
android-udev /usr/lib/udev/rules.d/
android-udev /usr/lib/udev/rules.d/51-android.rules
```

其中 `android-udev` 软件包是关于 Android 设备的处理规则.
我们来看看 `/usr/lib/udev/rules.d/51-android.rules` 文件:

```sh
> cat /usr/lib/udev/rules.d/51-android.rules

省略

# XiaoMi
ATTR{idVendor}!="2717", GOTO="not_XiaoMi"

省略

#   Redmi Note 3 (ff08=adb)
#   Mi/Redmi (ff10=ptp ff18=ptp,adb ff40=mtp ff48=mtp,adb ff80=rndis ff88=rndis,adb)
#   Mi Mix / A1 (ff18=ptp,adb ff28=storage,adb ff48=mtp,adb ff88=rndis,adb)
ATTR{idProduct}=="ff08", GOTO="adb"
ATTR{idProduct}=="ff18", GOTO="adbptp"
ATTR{idProduct}=="ff28", GOTO="adbmass"
ATTR{idProduct}=="ff40", GOTO="mtp"
ATTR{idProduct}=="ff48", GOTO="adbmtp"
ATTR{idProduct}=="ff88", GOTO="adbrndis"

省略

# ADB Debug and Tether mode
LABEL="adbrndis", ENV{adb_adb}="yes"
LABEL="rndis", ENV{adb_user}="yes", GOTO="android_usb_rule_match"

省略

# Symlink common code to reduce steps above
LABEL="android_usb_rule_match"
ENV{adb_adbcdc}=="yes", ENV{adb_adb}="yes", SYMLINK+="android_cdc", SYMLINK+="android_cdc%n"
ENV{adb_adbfast}=="yes", ENV{adb_adb}="yes", ENV{adb_fast}="yes"
ENV{adb_adbmass}=="yes", ENV{adb_mass}="yes"
ENV{adb_adbmtp}=="yes", ENV{adb_adb}="yes", ENV{adb_mtp}="yes"
ENV{adb_adbptp}=="yes", ENV{adb_adb}="yes", ENV{adb_ptp}="yes"
ENV{adb_adbmidi}=="yes", ENV{adb_adb}="yes", SYMLINK+="android_midi", SYMLINK+="android_midi0%n"
ENV{adb_adbuvc}=="yes", ENV{adb_adb}="yes", ENV{adb_uvc}="yes"
ENV{adb_adb}=="yes", ENV{adb_user}="yes", SYMLINK+="android_adb"
ENV{adb_fast}=="yes", SYMLINK+="android_fastboot"
ENV{adb_mass}=="yes", ENV{adb_mtp}="yes"
ENV{adb_ptp}=="yes", ENV{adb_user}="yes", ATTR{bDeviceClass}=="00|02|06|ef|ff", ENV{adb_mtp}="yes"
ENV{adb_mtp}=="yes", ENV{adb_user}="yes", SYMLINK+="libmtp-%k", ENV{ID_MTP_DEVICE}="1", ENV{ID_MEDIA_PLAYER}="1"
```

可以看到, 处理 USB 网络共享的功能叫 `rndis`.

----

监听 udev 事件, 同时在手机上操作开启 USB 网络共享功能:

```sh
> udevadm monitor --udev
monitor will print the received events for:
UDEV - the event which udev sends out after rule processing

UDEV  [18943.738720] unbind   /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb1/1-2/1-2:1.0 (usb)
UDEV  [18943.739269] remove   /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb1/1-2/1-2:1.0 (usb)
UDEV  [18943.859917] unbind   /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb1/1-2 (usb)
UDEV  [18943.860471] remove   /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb1/1-2 (usb)
UDEV  [18944.383830] add      /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb1/1-2 (usb)
UDEV  [18944.384734] add      /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb1/1-2/1-2:1.0 (usb)
UDEV  [18944.385587] add      /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb1/1-2/1-2:1.1 (usb)
UDEV  [18944.386854] bind     /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb1/1-2/1-2:1.1 (usb)
UDEV  [18944.391621] add      /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb1/1-2/1-2:1.0/net/wwp5s0f3u2 (net)
UDEV  [18944.392288] add      /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb1/1-2/1-2:1.0/net/wwan0/queues/rx-0 (queues)
UDEV  [18944.392434] add      /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb1/1-2/1-2:1.0/net/wwan0/queues/tx-0 (queues)
UDEV  [18944.393351] bind     /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb1/1-2/1-2:1.0 (usb)
UDEV  [18944.396446] bind     /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb1/1-2 (usb)
UDEV  [18944.398125] move     /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb1/1-2/1-2:1.0/net/wwp5s0f3u2 (net)
```

其中关键事件:

```sh
add      /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb1/1-2/1-2:1.0/net/wwp5s0f3u2 (net)
```

也就是内核通知添加了新设备 `wwp5s0f3u2`.

### 1.2 内核 rndis_host 模块

udev 看起来好像没问题, 那问题可能在内核里面.

```sh
> lsmod | grep rndis
rndis_host             24576  0
cdc_ether              28672  1 rndis_host
usbnet                 61440  2 rndis_host,cdc_ether
> modinfo rndis_host
filename:       /lib/modules/6.14.2-zen1-1-zen/kernel/drivers/net/usb/rndis_host.ko.zst
license:        GPL
description:    USB Host side RNDIS driver
author:         David Brownell
srcversion:     4DE15943675DBCB96800C5E
alias:          usb:v*p*d*dc*dsc*dp*icEFisc04ip01in*
alias:          usb:v*p*d*dc*dsc*dp*icE0isc01ip03in*
alias:          usb:v*p*d*dc*dsc*dp*icEFisc01ip01in*
alias:          usb:v*p*d*dc*dsc*dp*ic02isc02ipFFin*
alias:          usb:v19D2p*d*dc*dsc*dp*ic02isc02ipFFin*
alias:          usb:v19D2p*d*dc*dsc*dp*icE0isc01ip03in*
alias:          usb:v238Bp*d*dc*dsc*dp*ic02isc02ipFFin*
alias:          usb:v1630p0042d*dc*dsc*dp*ic02isc02ipFFin*
depends:        cdc_ether,usbnet
intree:         Y
name:           rndis_host
retpoline:      Y
vermagic:       6.14.2-zen1-1-zen SMP preempt mod_unload 
sig_id:         PKCS#7
signer:         Build time autogenerated kernel key
sig_key:        09:05:FF:B2:1C:68:6D:FC:6A:6A:6E:E5:3E:B3:9E:4D:F3:4F:07:32
sig_hashalgo:   sha512
signature:      30:65:02:31:00:D4:F7:6C:DD:03:F0:33:8C:82:39:BC:BD:FB:95:A8:
		8A:3B:71:1D:CB:06:97:34:5C:22:54:76:13:2C:04:49:0C:1D:11:F6:
		8B:C6:F5:81:3E:76:1E:F0:E1:AF:84:F8:2C:02:30:5E:28:6A:A4:90:
		18:65:24:7E:74:C4:70:C8:FA:25:1C:79:0A:8F:8E:69:17:CA:2A:EB:
		D7:08:23:DA:14:63:56:90:43:B3:03:3E:00:15:22:69:36:EF:58:F7:
		6B:95:3D
```

内核模块 `rndis_host.ko` 是对应的驱动程序.

再看看相应的 `dmesg` 日志:

```sh
> sudo dmesg

省略

[   57.742480] usb 1-2: new high-speed USB device number 4 using xhci_hcd
[   57.871721] usb 1-2: New USB device found, idVendor=2717, idProduct=ff80, bcdDevice= 4.19
[   57.871727] usb 1-2: New USB device strings: Mfr=1, Product=2, SerialNumber=3
[   57.871730] usb 1-2: Product: Redmi Note 9 Pro
[   57.871732] usb 1-2: Manufacturer: Xiaomi
[   57.871734] usb 1-2: SerialNumber: 87420001
[   57.933653] usbcore: registered new interface driver cdc_ether
[   57.941628] rndis_host 1-2:1.0 wwan0: register 'rndis_host' at usb-0000:05:00.3-2, Mobile Broadband RNDIS device, 16:f0:8c:01:02:03
[   57.941663] usbcore: registered new interface driver rndis_host
[   57.947399] rndis_host 1-2:1.0 wwp5s0f3u2: renamed from wwan0
```

嗯, 看起来, 在内核里面就直接把设备识别成了 `wwan0`, 从而导致了后续的一系列故障.

----

在网上搜索相关资料, 也有不错的发现:

+ <https://patchwork.kernel.org/project/netdevbpf/patch/20250311091035.2523903-1-lkundrak@v3.sk/>

  > rndis_host: Flag RNDIS modems as WWAN devices

  这是上个月的内核代码变更, 所以还新鲜热乎着呢.

+ <https://bbs.archlinux.org/viewtopic.php?id=304892>

  > USB tethering not working after updating to latest kernel

  ArchLinux 用户论坛上也有人提出了相同的问题.

----

所以, 去看内核源代码吧: <https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/drivers/net/usb/rndis_host.c?h=v6.12.23>

内核代码文件 `drivers/net/usb/rndis_host.c`: (节选)

```c
static const struct usb_device_id	products [] = {
{
	/* 2Wire HomePortal 1000SW */
	USB_DEVICE_AND_INTERFACE_INFO(0x1630, 0x0042,
				      USB_CLASS_COMM, 2 /* ACM */, 0x0ff),
	.driver_info = (unsigned long) &rndis_poll_status_info,
}, {
	/* Hytera Communications DMR radios' "Radio to PC Network" */
	USB_VENDOR_AND_INTERFACE_INFO(0x238b,
				      USB_CLASS_COMM, 2 /* ACM */, 0x0ff),
	.driver_info = (unsigned long)&rndis_info,
}, {
	/* ZTE WWAN modules */
	USB_VENDOR_AND_INTERFACE_INFO(0x19d2,
				      USB_CLASS_WIRELESS_CONTROLLER, 1, 3),
	.driver_info = (unsigned long)&zte_rndis_info,
}, {
	/* ZTE WWAN modules, ACM flavour */
	USB_VENDOR_AND_INTERFACE_INFO(0x19d2,
				      USB_CLASS_COMM, 2 /* ACM */, 0x0ff),
	.driver_info = (unsigned long)&zte_rndis_info,
}, {
	/* RNDIS is MSFT's un-official variant of CDC ACM */
	USB_INTERFACE_INFO(USB_CLASS_COMM, 2 /* ACM */, 0x0ff),
	.driver_info = (unsigned long) &rndis_info,
}, {
	/* "ActiveSync" is an undocumented variant of RNDIS, used in WM5 */
	USB_INTERFACE_INFO(USB_CLASS_MISC, 1, 1),
	.driver_info = (unsigned long) &rndis_poll_status_info,
}, {
	/* RNDIS for tethering */
	USB_INTERFACE_INFO(USB_CLASS_WIRELESS_CONTROLLER, 1, 3),
	.driver_info = (unsigned long) &rndis_info,
}, {
	/* Mobile Broadband Modem, seen in Novatel Verizon USB730L and
	 * Telit FN990A (RNDIS)
	 */
	USB_INTERFACE_INFO(USB_CLASS_MISC, 4, 1),
	.driver_info = (unsigned long)&wwan_rndis_info,
},
	{ },		// END
};
MODULE_DEVICE_TABLE(usb, products);
```

这一段中的关键代码是:

```c
	USB_INTERFACE_INFO(USB_CLASS_MISC, 4, 1),
	.driver_info = (unsigned long)&wwan_rndis_info,
```

然后我们来对比:

```c
static const struct driver_info	rndis_info = {
	.description =	"RNDIS device",
	.flags =	FLAG_ETHER | FLAG_POINTTOPOINT | FLAG_FRAMING_RN | FLAG_NO_SETINT,
	.bind =		rndis_bind,
	.unbind =	rndis_unbind,
	.status =	rndis_status,
	.rx_fixup =	rndis_rx_fixup,
	.tx_fixup =	rndis_tx_fixup,
};

// 省略

static const struct driver_info	wwan_rndis_info = {
	.description =	"Mobile Broadband RNDIS device",
	.flags =	FLAG_WWAN | FLAG_POINTTOPOINT | FLAG_FRAMING_RN | FLAG_NO_SETINT,
	.bind =		rndis_bind,
	.unbind =	rndis_unbind,
	.status =	rndis_status,
	.rx_fixup =	rndis_rx_fixup,
	.tx_fixup =	rndis_tx_fixup,
};
```

正常情况下, Android USB 网络共享的设备应该被识别为 `rndis_info`.
而在上述内核驱动代码中, **错误** 的被设置为 `wwan_rndis_info`, 从而导致了后续的一系列故障.

比较这两个结构数据, 标志 (`.flags`) 一个是 `FLAG_ETHER`, 另一个是 `FLAG_WWAN`.

正确的标志应该使用 `FLAG_ETHER`, 才能使 USB 网络共享正常工作.


## 2 解决方案: 自己编译 Linux 内核 (ArchLinux)

好了, BUG 分析完了, 由于上游的一个 **错误** 的内核代码变更, 导致了后续的一系列故障.

如果等待 Linux 内核开发那边, 各种扯皮修复, 不知道要等到猴年马月.
所以, 只能自己手动修改内核代码, 并编译安装自定义内核了.

ArchLinux 编译内核的参考文档: <https://wiki.archlinux.org/title/Kernel/Arch_build_system>

+ (1) 安装编译内核所需的软件包:

  ```sh
  sudo pacman -S devtools base-devel
  ```

+ (2) 创建一个目录, 并下载内核软件包相关代码:

  ```sh
  > mkdir build
  > cd build
  > pkgctl repo clone --protocol=https linux-zen
  ```

+ (3) 下载完毕后, 对 `PKGBUILD` 文件进行这样的修改 (仅供参考):

```patch
> git diff -- PKGBUILD
diff --git a/PKGBUILD b/PKGBUILD
index 8e53813..a3ae8ed 100644
--- a/PKGBUILD
+++ b/PKGBUILD
@@ -1,9 +1,9 @@
 # Maintainer: Jan Alexander Steffens (heftig) <heftig@archlinux.org>
 
-pkgbase=linux-zen
+pkgbase=linux-s2
 pkgver=6.14.2.zen1
 pkgrel=1
-pkgdesc='Linux ZEN'
+pkgdesc='Linux ZEN (s2)'
 url='https://github.com/zen-kernel/zen-kernel'
 arch=(x86_64)
 license=(GPL-2.0-only)
@@ -35,26 +35,20 @@ options=(
 _srcname=linux-${pkgver%.*}
 _srctag=v${pkgver%.*}-${pkgver##*.}
 source=(
-  https://cdn.kernel.org/pub/linux/kernel/v${pkgver%%.*}.x/${_srcname}.tar.{xz,sign}
-  $url/releases/download/$_srctag/linux-$_srctag.patch.zst{,.sig}
+  https://cdn.kernel.org/pub/linux/kernel/v${pkgver%%.*}.x/${_srcname}.tar.xz
+  $url/releases/download/$_srctag/linux-$_srctag.patch.zst
   config  # the main kernel config file
-)
-validpgpkeys=(
-  ABAF11C65A2970B130ABE3C479BE3E4300411886  # Linus Torvalds
-  647F28654894E3BD457199BE38DBBDC86092693E  # Greg Kroah-Hartman
-  83BC8889351B5DEBBB68416EB8AC08600F108CDF  # Jan Alexander Steffens (heftig)
+  fix_rndis_host_1.patch
 )
 # https://www.kernel.org/pub/linux/kernel/v6.x/sha256sums.asc
 sha256sums=('c5c682a354ea3190139357a57d34a79e5c37221ace823a938e10116b577a2e1b'
-            'SKIP'
             '433091be5e04cb49a1c1a8d8b6a3220413fea3b897d998fe10973c14933abd27'
-            'SKIP'
-            'f33a574662f1d4f266a2faa96404240e71e84438dba05528a66449db1e23ec85')
+            'f33a574662f1d4f266a2faa96404240e71e84438dba05528a66449db1e23ec85'
+            'SKIP')
 b2sums=('ebba8a341d180887bbe125b23a3ac54ca7439eded877930f7b7df9a5ed3378701523e0cde972b520eaedf7f24d70d4d8db62db103e21943abeb35f9c1c91e4a7'
-        'SKIP'
         '0420f497ba3c577b212ebb3b70b416033c252b37704cc19252672ca0b58b5ec0d994736dab3f652dfc283740b49f877164559c3697e2b6f14db0a49fcbaa25a0'
-        'SKIP'
-        '7cd00b32197dfc9a98356c2c913ce85f0e3adebd2aeba95af7e5cf2815b02890652494eb946f307ebde48df99b8a4e0dd47fe11c9d3a2aea1ec92e8e64c1233b')
+        '7cd00b32197dfc9a98356c2c913ce85f0e3adebd2aeba95af7e5cf2815b02890652494eb946f307ebde48df99b8a4e0dd47fe11c9d3a2aea1ec92e8e64c1233b'
+        'SKIP')
 
 export KBUILD_BUILD_HOST=archlinux
 export KBUILD_BUILD_USER=$pkgbase
@@ -90,7 +84,6 @@ build() {
   cd $_srcname
   make all
   make -C tools/bpf/bpftool vmlinux.h feature-clang-bpf-co-re=1
-  make htmldocs
 }
 
 _package() {
@@ -248,7 +241,6 @@ _package-docs() {
 pkgname=(
   "$pkgbase"
   "$pkgbase-headers"
-  "$pkgbase-docs"
 )
 for _p in "${pkgname[@]}"; do
   eval "package_$_p() {
```

  嗯, 把新的内核命名为 `linux-s2`.

+ (4) 添加一个 patch 文件 `build/linux-zen/fix_rndis_host_1.patch`:

```patch
diff --git a/drivers/net/usb/rndis_host.c b/drivers/net/usb/rndis_host.c
index bb0bf14..dbbab3d 100644
--- a/drivers/net/usb/rndis_host.c
+++ b/drivers/net/usb/rndis_host.c
@@ -680,7 +680,7 @@ static const struct usb_device_id	products [] = {
 	 * Telit FN990A (RNDIS)
 	 */
 	USB_INTERFACE_INFO(USB_CLASS_MISC, 4, 1),
-	.driver_info = (unsigned long)&wwan_rndis_info,
+	.driver_info = (unsigned long) &rndis_info,
 },
 	{ },		// END
 };
```

  没错, 只需修改一行代码 !

+ (5) 编译内核:

  ```sh
  makepkg -s
  ```

----

编译完成后获得 2 个新的软件包:

```sh
> ls -l
总计 360736
-rw-r--r-- 1 s2 s2    282735  4月13日 09:31 config
-rw-r--r-- 1 s2 s2       438  4月13日 15:07 fix_rndis_host_1.patch
-rw-r--r-- 1 s2 s2 149412128  4月13日 09:44 linux-6.14.2.tar.xz
-rw-r--r-- 1 s2 s2 151359465  4月13日 16:10 linux-s2-6.14.2.zen1-1-x86_64.pkg.tar.zst
-rw-r--r-- 1 s2 s2  68156035  4月13日 16:10 linux-s2-headers-6.14.2.zen1-1-x86_64.pkg.tar.zst
-rw-r--r-- 1 s2 s2    157702  4月13日 10:21 linux-v6.14.2-zen1.patch.zst
drwxr-xr-x 1 s2 s2        48  4月13日 16:10 pkg/
-rw-r--r-- 1 s2 s2      7500  4月13日 15:13 PKGBUILD
drwxr-xr-x 1 s2 s2       222  4月13日 15:19 src/
```

安装软件包:

```sh
sudo pacman -U linux-s2-6.14.2.zen1-1-x86_64.pkg.tar.zst linux-s2-headers-6.14.2.zen1-1-x86_64.pkg.tar.zst 
```

更新 GRUB 启动菜单:

```sh
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

**重启**, 选择新内核.


## 3 测试结果

重启完毕:

```sh
> uname -a
Linux SC202501C7LA 6.14.2-zen1-1-s2 #1 ZEN SMP PREEMPT_DYNAMIC Sun, 13 Apr 2025 07:18:48 +0000 x86_64 GNU/Linux
```

好, 已经用上了新内核.

```sh
> ip link

省略

5: enp5s0f3u2: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UNKNOWN mode DEFAULT group default qlen 1000
    link/ether ee:81:70:01:02:03 brd ff:ff:ff:ff:ff:ff
    altname enxee8170010203
```

好 ! 成功识别手机 USB 共享的网卡.

----

再看看 `dmesg`:

```sh
> sudo dmesg

省略

[ 6782.970347] usb 1-2: new high-speed USB device number 4 using xhci_hcd
[ 6783.101881] usb 1-2: New USB device found, idVendor=2717, idProduct=ff80, bcdDevice= 4.19
[ 6783.101891] usb 1-2: New USB device strings: Mfr=1, Product=2, SerialNumber=3
[ 6783.101894] usb 1-2: Product: Redmi Note 9 Pro
[ 6783.101897] usb 1-2: Manufacturer: Xiaomi
[ 6783.101899] usb 1-2: SerialNumber: 87420001
[ 6783.177283] usbcore: registered new interface driver cdc_ether
[ 6783.184703] rndis_host 1-2:1.0 usb0: register 'rndis_host' at usb-0000:05:00.3-2, RNDIS device, ee:81:70:01:02:03
[ 6783.184738] usbcore: registered new interface driver rndis_host
[ 6783.191161] rndis_host 1-2:1.0 enp5s0f3u2: renamed from usb0
```

好, 一切工作正常.

![网络设置](./图/3-n-1.png)

NetworkManager 也可以正常识别并配置网络.

BUG 修复成功.


## 4 总结与展望

Linux 系统虽然可能 BUG 比较多, 但是因为有源代码,
随便来个人 (比如 穷人小水滴) 就可以随时随地修 BUG.

这就是开源的好处 !

----

本文使用 CC-BY-SA 4.0 许可发布.
