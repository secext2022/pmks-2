# 香橙派: 在容器 (podman) 中运行 x11 图形界面

本文介绍如何在 Orange pi Zero3 (内存 1GB, arm64) 单板机,
使用容器 (podman) 运行 x11 图形界面应用, 并启用 OpenGL 3D 硬件加速.

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术.

----

相关文章:

+ 《GNOME 如何关闭显示输出 ? (wayland / mutter / KMS / DRI) (源代码阅读)》

  TODO

+ 《自制神之嘴: fish-speech 容器镜像 (文本转语音 AI 大模型)》

  TODO

+ 《发布 flatpak 应用 (flathub)》

  TODO

+ 《香橙派 HDMI 显示器 DDC/CI 踩坑记录》

  TODO

+ 《香橙派安装 adguardhome (docker)》

  TODO


## 目录

+ 1 问题背景

+ 2 host (x86_64) 运行 x11 应用程序

  - 2.1 运行环境
  - 2.2 制作容器镜像
  - 2.3 运行容器

+ 3 香橙派 (arm64) 运行 x11 服务器

  - 3.1 通过 QEMU 运行 arm64 容器
  - 3.2 制作基础镜像
  - 3.3 制作 x11 服务器容器镜像
  - 3.4 加载容器镜像至香橙派
  - 3.5 运行容器

+ 4 运行调试信息

  - 4.1 x11 服务器运行日志 (节选)
  - 4.2 glxinfo (节选)
  - 4.3 libinput 调试信息 (节选)

+ 5 总结与展望


## 1 问题背景

上文说到 (详见文章 《GNOME 如何关闭显示输出 ? (wayland / mutter / KMS / DRI) (源代码阅读)》),
GNU/Linux 有两种窗口管理技术 (窗口系统/协议):
古老的几十年前的 x11, 和新的更高性能更安全的 wayland.
目前 GNOME 桌面环境默认使用 wayland, x11 正在被淘汰.

但是 wayland 并不是任何情况下都是更好的, 比如 "关闭显示输出" 这个小小的功能,
GNOME wayland 要绕一大圈 (gnome-session -> gnome-shell -> gnome-settings-daemon -> gnome-desktop -> mutter -> libdrm) 才能实现.
而在 x11 相同的功能只需要一条简单的命令即可.

wayland 就像吃预制菜, 只能点菜单上有的项目和规格.
如果遇到一个没有预先实现的需求, 那不好意思, 没有就是不行 !
(您得去自己建造一个 "食品加工厂", 费好大力气才能造出自定义的 "预制菜",
或者说 wayland 禁止 "自己做饭". )
x11 就像散装的自己做饭, 虽然更慢, 但是灵活程度更高, 想怎么吃就怎么吃.

----

容器 (docker) 作为一种轻量级虚拟化技术,
非常便于部署 (安装) 和运行应用, 因为容器打包了所有依赖,
通常安装/运行一个应用只需一条简单的命令, 还能保持主系统很干净.
但是一般来说容器是用于运行服务器应用的, 也就是没有图形界面.

与容器类似的, 专用于运行桌面图形界面应用的技术, 有 flatpak
(详见文章 《发布 flatpak 应用 (flathub)》).
但是 **flatpak 打包应用太麻烦了**, 远远比不上容器 (docker/podman) 简单方便.

香橙派 (zero3 内存 1GB) 硬件资源较少, 所以不想运行完整的桌面环境,
只运行一个图形界面应用, 所以需要把 x11 服务器 (xorg-server) 也放到容器中运行.
同时最好能够使用 GPU 的硬件加速.

容器也能运行 x11 图形界面应用 ? 是的, 并且有一个现成的项目
`x11docker`: <https://github.com/mviereck/x11docker>

但是 x11docker 本身的安装使用就是比较麻烦的, 还是自己动手比较好.


## 2 host (x86_64) 运行 x11 应用程序

事情要从简单的开始做.
只运行一个 x11 应用程序, 比运行 x11 服务器要简单很多.
所以首先尝试在 x86_64 PC (操作系统 ArchLinux) 使用容器 (podman)
运行一个 x11 应用.

### 2.1 运行环境

相关软件版本:

```sh
> uname -a
Linux S2L 6.10.5-zen1-1-zen #1 ZEN SMP PREEMPT_DYNAMIC Thu, 15 Aug 2024 00:25:05 +0000 x86_64 GNU/Linux
> gnome-shell --version
GNOME Shell 46.4
> podman --version
podman version 5.2.1
```

GNOME 桌面使用 wayland (mutter), 但是为了兼容旧的 x11 应用,
有个东西叫做 `Xwayland`, 也就是在 wayland 环境运行 x11 服务器:

```sh
> ps -elwwf | grep Xwayland
0 S s2         1721    1301  2  80   0 - 213786 ep_pol 05:28 ?       00:02:31 /usr/bin/Xwayland :0 -rootless -noreset -accessx -core -auth /run/user/1000/.mutter-Xwaylandauth.25RSS2 -listenfd 4 -listenfd 5 -displayfd 6 -initfd 7 -byteswappedclients -enable-ei-portal
0 S s2        10570   10546  0  80   0 -  2376 pipe_r 07:02 pts/1    00:00:00 grep --color=auto Xwayland
```

比如这个就是正在运行的 Xwayland 进程,
同时有几个 x11 相关的重要环境变量, 比如 (省略部分结果):

```sh
> env

XAUTHORITY=/run/user/1000/.mutter-Xwaylandauth.25RSS2
DISPLAY=:0
```

比如此处 `DISPLAY` 环境变量指定 x11 服务器的接口名称,
`:0` 对应 `/tmp/.X11-unix/X0` 文件 (UNIX socket):

```sh
> ls -l /tmp/.X11-unix
总计 0
srwxr-xr-x 1 s2 s2 0  8月18日 05:28 X0=
srwxr-xr-x 1 s2 s2 0  8月18日 05:28 X1=
srwxr-xr-x 1 gdm gdm 0  8月18日 05:28 X1024=
srwxr-xr-x 1 gdm gdm 0  8月18日 05:28 X1025=
```

环境变量 `XAUTHORITY` 指定一个认证文件, 这是为了提高安全性,
只有能够读取这个文件的, 才能访问 x11 服务器.

----

GPU 3D 硬件加速 (比如 OpenGL) 需要使用 `/dev/dri` 里面的设备文件, 比如:

```sh
> ls -l /dev/dri
总计 0
drwxr-xr-x  2 root root         80  8月18日 05:28 by-path/
crw-rw----+ 1 root video  226,   1  8月18日 05:28 card1
crw-rw-rw-  1 root render 226, 128  8月18日 05:28 renderD128
```

应用程序使用这些文件调用显卡的功能.

### 2.2 制作容器镜像

首先拉取基础镜像 (debian 12):

```sh
> podman pull quay.io/jitesoft/debian:latest-slim

> podman images
REPOSITORY                 TAG            IMAGE ID      CREATED        SIZE

quay.io/jitesoft/debian    latest-slim    437e15117c4a  6 weeks ago    77.8 MB
```

使用的 `Dockerfile` 文件如下:

```sh
FROM quay.io/jitesoft/debian:latest-slim

# 修复 W: Failed to fetch **  Certificate verification failed: The certificate is NOT trusted. The certificate issuer is unknown.  Could not handshake: Error in the certificate verification.
RUN touch /etc/apt/apt.conf.d/99-verify-peer.conf && echo >>/etc/apt/apt.conf.d/99-verify-peer.conf "Acquire { https::Verify-Peer false }"

COPY debian.sources /etc/apt/sources.list.d

RUN apt update && apt upgrade -y && apt install -y ca-certificates fonts-noto mesa-utils chromium && apt clean

CMD /usr/bin/chromium
```

其中 `debian.sources` 用于配置国内镜像, 加快下载, 文档请见:
<https://mirror.nju.edu.cn/mirrorz-help/debian/?mirror=NJU>

使用 `apt install` 安装的软件包有:

+ `fonts-noto`: 字体文件, 如果不安装就无法正常显示中文.

+ `mesa-utils`: 显卡驱动 (mesa), 如果不安装就无法使用 GPU 3D 硬件加速.

+ `chromium`: 大名鼎鼎的浏览器 ! 这个就是要运行的图形界面应用了.

构建命令:

```sh
podman build -t debian-chromium .
```

制作好的容器镜像:

```sh
> podman images
REPOSITORY                   TAG       IMAGE ID      CREATED        SIZE
localhost/debian-chromium    latest    019930157b45  7 seconds ago  1.73 GB
```

### 2.3 运行容器

首先创建临时目录:

```sh
mkdir -p me/run
```

然后运行容器:

```sh
podman run --rm --userns keep-id --group-add keep-groups --device /dev/dri -e DISPLAY=$DISPLAY -e XAUTHORITY=/tmp/Xauth -e HOME=/home/me -e XDG_RUNTIME_DIR=/home/me/run -v /tmp/.X11-unix:/tmp/.X11-unix -v $XAUTHORITY:/tmp/Xauth -v ./me:/home/me debian-chromium
```

命令行解释:

+ `podman run debian-chromium`: 使用 podman 运行容器镜像.

+ `--rm`: 运行结束后删除容器.

+ `--userns keep-id --group-add keep-groups`:
  使容器中的进程具有与当前用户 (自己) 相同的权限 (uid/gid).
  如果没有这个, 会遇到没有权限的错误.

+ `--device /dev/dri`: 允许容器内的进程访问 `/dev/dri` 设备文件.
  需要这个才能使用 GPU 3D 硬件加速.

+ `-e DISPLAY=$DISPLAY -e XAUTHORITY=/tmp/Xauth -v /tmp/.X11-unix:/tmp/.X11-unix -v $XAUTHORITY:/tmp/Xauth`:
  使用 `-e` 设置 x11 相关的环境变量 `DISPLAY` 和 `XAUTHORITY`.
  使用 `-v` 允许访问 `/tmp/.X11-unix` 和 `XAUTHORITY` 里面的文件.

  需要这个才能让容器内的应用正常访问 x11 服务器 (此处是 Xwayland).

+ `-e HOME=/home/me -e XDG_RUNTIME_DIR=/home/me/run -v ./me:/home/me`:
  这个是为了让 chromium 能够正常运行, chromium 浏览器需要在 home 目录写一些文件.
  如果没有这个, 那么 chromium 无法正常启动.

----

执行上述命令后, 浏览器窗口就会显示出来了:

![about gpu](./图/23-w-1.png)

可以看到, GPU 硬件加速 (OpenGL) 是正常启用的.

![网页](./图/23-w-2.png)

打开一个网页, 中文能够正常显示.

至此, 在容器中运行 x11 应用大成功 !


## 3 香橙派 (arm64) 运行 x11 服务器

此处使用的硬件 (单板机) 是 **香橙派 zero3** (内存 1GB),
处理器为全志 H618 (arm64), 官网链接:
<http://www.orangepi.cn/html/hardWare/computerAndMicrocontrollers/service-and-support/Orange-Pi-Zero-3.html>

这个香橙派很便宜的, 主板只要不到 100 元, 对穷人很友好.
支持 4K 60fps (HDMI) 显示输出, 千兆以太网, 还有 wifi 功能.

### 3.1 通过 QEMU 运行 arm64 容器

构建容器镜像在 x86_64 PC (ArchLinux) 上进行, 但是香橙派是另一种 CPU (arm64),
此时就需要虚拟机软件 QEMU 出手了.
安装所需软件包:

```sh
sudo pacman -S qemu-user-static qemu-user-static-binfmt
```

参考文档: <https://wiki.archlinux.org/title/QEMU>

验证安装成功:

```sh
> ls /proc/sys/fs/binfmt_misc/
qemu-aarch64      qemu-microblaze    qemu-ppc      qemu-sparc32plus
qemu-aarch64_be   qemu-microblazeel  qemu-ppc64    qemu-sparc64
qemu-alpha        qemu-mips          qemu-ppc64le  qemu-xtensa
qemu-arm          qemu-mips64        qemu-riscv32  qemu-xtensaeb
qemu-armeb        qemu-mips64el      qemu-riscv64  register
qemu-hexagon      qemu-mipsel        qemu-s390x    status
qemu-hppa         qemu-mipsn32       qemu-sh4
qemu-loongarch64  qemu-mipsn32el     qemu-sh4eb
qemu-m68k         qemu-or1k          qemu-sparc
```

注意此处 `qemu-aarch64` 表示可以运行 arm64 的程序.

### 3.2 制作基础镜像

首先拉取 arm64 debian 镜像:

```sh
> podman pull --arch arm64 quay.io/jitesoft/debian:latest-slim

> podman images
REPOSITORY                 TAG            IMAGE ID      CREATED        SIZE

quay.io/jitesoft/debian    latest-slim    46ba2fa86094  6 weeks ago    100 MB
```

注意此处的 `--arch arm64` 参数. 然后 `Dockerfile` 文件:

```sh
FROM quay.io/jitesoft/debian:latest-slim

# 修复 W: Failed to fetch **  Certificate verification failed: The certificate is NOT trusted. The certificate issuer is unknown.  Could not handshake: Error in the certificate verification.
RUN touch /etc/apt/apt.conf.d/99-verify-peer.conf && echo >>/etc/apt/apt.conf.d/99-verify-peer.conf "Acquire { https::Verify-Peer false }"

COPY debian.sources /etc/apt/sources.list.d

RUN apt update && apt upgrade -y && apt install -y ca-certificates mesa-utils

CMD /usr/bin/bash
```

此处只是安装 `mesa-utils` 软件包 (显卡驱动). 构建命令:

```sh
podman build --arch arm64 -t debian-arm64-base .
```

这就制作好了基础镜像 `debian-arm64-base`.

### 3.3 制作 x11 服务器容器镜像

`Dockerfile` 文件:

```sh
FROM debian-arm64-base

RUN apt install -y xorg xserver-xorg xserver-xorg-video-vesa xserver-xorg-input-libinput chromium libinput-tools xdotool

#RUN sed -i 's/allowed_users=console/allowed_users=anybody/g' /etc/X11/Xwrapper.config

ENV XDG_VTNR=1
ENV DISPLAY=:0

CMD /usr/bin/xinit /usr/bin/chromium --no-sandbox -- $DISPLAY vt$XDG_VTNR
```

此处安装的软件包有:

+ `xorg`: 这个就是 x11 服务器.

+ `xserver-xorg-input-libinput`: 输入驱动 (libinput),
  需要这个才能正常使用鼠标/键盘进行输入.

+ `libinput-tools` `xdotool`: 调试工具 (可选).

容器运行时执行的命令 (CMD) 是, 使用 `xinit` 启动 x11 服务器并初始化环境,
然后运行 chromium 浏览器, `--no-sandbox` 是为了以 root 运行 chromium
(如果不加会启动失败).

`XDG_VTNR` 是使用的虚拟终端编号, 此处为 1, 对应 `/dev/tty1`.

CMD 这一行相当于到时候会执行命令:

```sh
xinit /usr/bin/chromium --no-sandbox -- :0 vt1
```

----

构建命令:

```sh
podman build -t debian-arm64-xorg-chromium .
```

保存容器镜像:

```sh
podman save debian-arm64-xorg-chromium > debian-arm64-xorg-chromium-20240817.tar
```

### 3.4 加载容器镜像至香橙派

接下来的操作在香橙派上进行, 系统信息如下:

```sh
> ssh orangepi

orangepi@orangepizero3 ~> id
uid=1000(orangepi) gid=1000(orangepi) groups=1000(orangepi),5(tty),6(disk),20(dialout),27(sudo),29(audio),44(video),46(plugdev),60(games),100(users),102(input),107(netdev),108(i2c),996(docker),999(systemd-journal)
orangepi@orangepizero3 ~> uname -a
Linux orangepizero3 6.1.31-sun50iw9 #1.0.0 SMP Mon Jul  3 13:44:03 CST 2023 aarch64 GNU/Linux
orangepi@orangepizero3 ~> cat /etc/os-release
PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"
NAME="Debian GNU/Linux"
VERSION_ID="12"
VERSION="12 (bookworm)"
VERSION_CODENAME=bookworm
ID=debian
HOME_URL="https://www.debian.org/"
SUPPORT_URL="https://www.debian.org/support"
BUG_REPORT_URL="https://bugs.debian.org/"
orangepi@orangepizero3 ~> free -h
               total        used        free      shared  buff/cache   available
Mem:           981Mi       349Mi       539Mi       268Ki       176Mi       632Mi
Swap:          490Mi       110Mi       380Mi
orangepi@orangepizero3 ~> podman --version
podman version 4.3.1
```

为了以普通用户 (而不是 root) 运行容器, 需要安装 podman:

```sh
orangepi@orangepizero3 ~> sudo apt install podman slirp4netns
```

将上面制作好的容器镜像文件复制到香橙派 (比如通过 `sftp`), 然后:

```sh
orangepi@orangepizero3 ~> podman load < debian-arm64-xorg-chromium-20240817.tar
```

如果 SD 存储卡的读写速度慢, 这一步可能需要较长时间 (几分钟).
加载的容器镜像:

```sh
orangepi@orangepizero3 ~> podman images
REPOSITORY                            TAG       IMAGE ID      CREATED      SIZE
localhost/debian-arm64-xorg-chromium  latest    1dc32d617d1e  2 hours ago  972 MB
```

### 3.5 运行容器

万事具备, 容器启动:

```sh
orangepi@orangepizero3 ~> podman run --rm --name chromium --group-add keep-groups --device /dev/tty1 --device /dev/input --device /dev/dri -v /run/udev/data:/run/udev/data debian-arm64-xorg-chromium
```

命令行解释 (上文已经解释过的不再重复):

+ `--name chromium`: 指定容器的名称, 方便后续操作.

+ `--device /dev/tty1 --device /dev/input -v /run/udev/data:/run/udev/data`:
  允许访问 `/dev/tty1`, `/dev/input`, 以及 `/run/udev/data`.
  这些是 x11 服务器需要的, 有了这些才可以正常使用鼠标/键盘
  (否则可能无法输入).

如果 SD 存储卡的读写速度慢, 这一步可能需要较长时间.

然后在香橙派通过 HDMI 外接的显示器上会出现:

![屏幕照片](./图/35-s-1.png)

可以看到, GPU 硬件加速 (OpenGL) 是正常启用的, 大成功 !!


## 4 运行调试信息

下面是一些运行过程中的调试信息, 供参考.

### 4.1 x11 服务器运行日志 (节选)

```sh
# cat /var/log/Xorg.0.log
[  1567.956] 
X.Org X Server 1.21.1.7
X Protocol Version 11, Revision 0
[  1567.956] Current Operating System: Linux 5ca7f27e7a83 6.1.31-sun50iw9 #1.0.0 SMP Mon Jul  3 13:44:03 CST 2023 aarch64
[  1567.956] Kernel command line: root=UUID=8cee1ac9-24e3-4544-8597-652cdfab3478 rootwait rootfstype=ext4 splash=verbose console=ttyS0,115200 console=tty1 consoleblank=0 loglevel=1 ubootpart=adcbdb39-01 usb-storage.quirks=0x2537:0x1066:u,0x2537:0x1068:u fbcon=rotate:1  cgroup_enable=memory swapaccount=1
[  1567.957] xorg-server 2:21.1.7-3+deb12u7 (https://www.debian.org/support) 
[  1567.957] Current version of pixman: 0.42.2
[  1567.957] 	Before reporting problems, check http://wiki.x.org
	to make sure that you have the latest version.
[  1567.957] Markers: (--) probed, (**) from config file, (==) default setting,
	(++) from command line, (!!) notice, (II) informational,
	(WW) warning, (EE) error, (NI) not implemented, (??) unknown.
[  1567.958] (==) Log file: "/var/log/Xorg.0.log", Time: Sat Aug 17 07:45:10 2024
[  1567.958] (==) Using system config directory "/usr/share/X11/xorg.conf.d"
[  1567.959] (==) No Layout section.  Using the first Screen section.
[  1567.959] (==) No screen section available. Using defaults.
[  1567.959] (**) |-->Screen "Default Screen Section" (0)
[  1567.959] (**) |   |-->Monitor "<default monitor>"
[  1567.960] (==) No monitor specified for screen "Default Screen Section".
	Using a default monitor configuration.
[  1567.960] (==) Automatically adding devices
[  1567.960] (==) Automatically enabling devices
[  1567.960] (==) Automatically adding GPU devices
[  1567.960] (==) Automatically binding GPU devices
[  1567.960] (==) Max clients allowed: 256, resource mask: 0x1fffff
[  1567.960] (WW) The directory "/usr/share/fonts/X11/cyrillic" does not exist.
[  1567.960] 	Entry deleted from font path.
[  1567.960] (==) FontPath set to:
	/usr/share/fonts/X11/misc,
	/usr/share/fonts/X11/100dpi/:unscaled,
	/usr/share/fonts/X11/75dpi/:unscaled,
	/usr/share/fonts/X11/Type1,
	/usr/share/fonts/X11/100dpi,
	/usr/share/fonts/X11/75dpi,
	built-ins
[  1567.960] (==) ModulePath set to "/usr/lib/xorg/modules"
[  1567.960] (II) The server relies on udev to provide the list of input devices.
	If no devices become available, reconfigure udev or disable AutoAddDevices.
[  1567.960] (II) Loader magic: 0xaaaaccab0f00
[  1567.960] (II) Module ABI versions:
[  1567.960] 	X.Org ANSI C Emulation: 0.4
[  1567.960] 	X.Org Video Driver: 25.2
[  1567.960] 	X.Org XInput driver : 24.4
[  1567.960] 	X.Org Server Extension : 10.0
[  1567.967] (EE) dbus-core: error connecting to system bus: org.freedesktop.DBus.Error.FileNotFound (Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory)
[  1567.970] (II) xfree86: Adding drm device (/dev/dri/card0)
[  1567.970] (II) Platform probe for /sys/devices/platform/display-engine/drm/card0
[  1567.985] (II) xfree86: Adding drm device (/dev/dri/card1)
[  1567.985] (II) Platform probe for /sys/devices/platform/soc/1800000.gpu/drm/card1
[  1567.985] (II) no primary bus or device found
[  1567.985] 	falling back to /sys/devices/platform/display-engine/drm/card0
[  1567.985] (II) LoadModule: "glx"
[  1567.986] (II) Loading /usr/lib/xorg/modules/extensions/libglx.so
[  1568.055] (II) Module glx: vendor="X.Org Foundation"
[  1568.055] 	compiled for 1.21.1.7, module version = 1.0.0
[  1568.055] 	ABI class: X.Org Server Extension, version 10.0
[  1568.055] (==) Matched modesetting as autoconfigured driver 0
[  1568.055] (==) Matched fbdev as autoconfigured driver 1
[  1568.055] (==) Assigned the driver to the xf86ConfigLayout
[  1568.055] (II) LoadModule: "modesetting"
[  1568.055] (II) Loading /usr/lib/xorg/modules/drivers/modesetting_drv.so
[  1568.056] (II) Module modesetting: vendor="X.Org Foundation"
[  1568.056] 	compiled for 1.21.1.7, module version = 1.21.1
[  1568.056] 	Module class: X.Org Video Driver
[  1568.056] 	ABI class: X.Org Video Driver, version 25.2
[  1568.056] (II) LoadModule: "fbdev"
[  1568.056] (WW) Warning, couldn't open module fbdev
[  1568.056] (EE) Failed to load module "fbdev" (module does not exist, 0)
[  1568.056] (II) modesetting: Driver for Modesetting Kernel Drivers: kms
[  1568.067] (II) modeset(0): using drv /dev/dri/card0
[  1568.068] (WW) VGA arbiter: cannot open kernel arbiter, no multi-card support
[  1568.068] (II) modeset(0): Creating default Display subsection in Screen section
	"Default Screen Section" for depth/fbbpp 24/32
[  1568.068] (==) modeset(0): Depth 24, (==) framebuffer bpp 32
[  1568.068] (==) modeset(0): RGB weight 888
[  1568.068] (==) modeset(0): Default visual is TrueColor
[  1568.068] (II) Loading sub module "glamoregl"
[  1568.068] (II) LoadModule: "glamoregl"
[  1568.068] (II) Loading /usr/lib/xorg/modules/libglamoregl.so
[  1568.136] (II) Module glamoregl: vendor="X.Org Foundation"
[  1568.136] 	compiled for 1.21.1.7, module version = 1.0.1
[  1568.136] 	ABI class: X.Org ANSI C Emulation, version 0.4
[  1571.675] (II) modeset(0): glamor X acceleration enabled on Mali-G31 (Panfrost)
[  1571.675] (II) modeset(0): glamor initialized
[  1571.675] (==) modeset(0): VariableRefresh: disabled
[  1571.675] (==) modeset(0): AsyncFlipSecondaries: disabled
[  1571.782] (II) modeset(0): Output HDMI-1 has no monitor section
[  1571.890] (II) modeset(0): EDID for output HDMI-1
```

注意这一行:

```sh
[  1571.675] (II) modeset(0): glamor X acceleration enabled on Mali-G31 (Panfrost)
```

说明成功启用了 GPU 硬件加速.

### 4.2 glxinfo (节选)

首先进入容器:

```sh
orangepi@orangepizero3 ~> podman exec -it chromium /usr/bin/bash
```

然后:

```sh
# glxinfo
name of display: :0
display: :0  screen: 0
direct rendering: Yes
server glx vendor string: SGI
server glx version string: 1.4
server glx extensions:
    GLX_ARB_context_flush_control, GLX_ARB_create_context, 
    GLX_ARB_create_context_no_error, GLX_ARB_create_context_profile, 
    GLX_ARB_fbconfig_float, GLX_ARB_framebuffer_sRGB, GLX_ARB_multisample, 
    GLX_EXT_create_context_es2_profile, GLX_EXT_create_context_es_profile, 
    GLX_EXT_fbconfig_packed_float, GLX_EXT_framebuffer_sRGB, 
    GLX_EXT_get_drawable_type, GLX_EXT_libglvnd, GLX_EXT_no_config_context, 
    GLX_EXT_texture_from_pixmap, GLX_EXT_visual_info, GLX_EXT_visual_rating, 
    GLX_INTEL_swap_event, GLX_MESA_copy_sub_buffer, GLX_OML_swap_method, 
    GLX_SGIS_multisample, GLX_SGIX_fbconfig, GLX_SGIX_pbuffer, 
    GLX_SGIX_visual_select_group, GLX_SGI_make_current_read, 
    GLX_SGI_swap_control
client glx vendor string: Mesa Project and SGI
client glx version string: 1.4
client glx extensions:
    GLX_ARB_context_flush_control, GLX_ARB_create_context, 
    GLX_ARB_create_context_no_error, GLX_ARB_create_context_profile, 
    GLX_ARB_create_context_robustness, GLX_ARB_fbconfig_float, 
    GLX_ARB_framebuffer_sRGB, GLX_ARB_get_proc_address, GLX_ARB_multisample, 
    GLX_ATI_pixel_format_float, GLX_EXT_buffer_age, 
    GLX_EXT_create_context_es2_profile, GLX_EXT_create_context_es_profile, 
    GLX_EXT_fbconfig_packed_float, GLX_EXT_framebuffer_sRGB, 
    GLX_EXT_import_context, GLX_EXT_no_config_context, GLX_EXT_swap_control, 
    GLX_EXT_swap_control_tear, GLX_EXT_texture_from_pixmap, 
    GLX_EXT_visual_info, GLX_EXT_visual_rating, GLX_INTEL_swap_event, 
    GLX_MESA_copy_sub_buffer, GLX_MESA_query_renderer, GLX_MESA_swap_control, 
    GLX_NV_float_buffer, GLX_OML_swap_method, GLX_OML_sync_control, 
    GLX_SGIS_multisample, GLX_SGIX_fbconfig, GLX_SGIX_pbuffer, 
    GLX_SGIX_visual_select_group, GLX_SGI_make_current_read, 
    GLX_SGI_swap_control, GLX_SGI_video_sync
GLX version: 1.4
GLX extensions:
    GLX_ARB_context_flush_control, GLX_ARB_create_context, 
    GLX_ARB_create_context_no_error, GLX_ARB_create_context_profile, 
    GLX_ARB_fbconfig_float, GLX_ARB_framebuffer_sRGB, 
    GLX_ARB_get_proc_address, GLX_ARB_multisample, GLX_EXT_buffer_age, 
    GLX_EXT_create_context_es2_profile, GLX_EXT_create_context_es_profile, 
    GLX_EXT_fbconfig_packed_float, GLX_EXT_framebuffer_sRGB, 
    GLX_EXT_no_config_context, GLX_EXT_swap_control, 
    GLX_EXT_swap_control_tear, GLX_EXT_texture_from_pixmap, 
    GLX_EXT_visual_info, GLX_EXT_visual_rating, GLX_INTEL_swap_event, 
    GLX_MESA_copy_sub_buffer, GLX_MESA_query_renderer, GLX_MESA_swap_control, 
    GLX_OML_swap_method, GLX_OML_sync_control, GLX_SGIS_multisample, 
    GLX_SGIX_fbconfig, GLX_SGIX_pbuffer, GLX_SGIX_visual_select_group, 
    GLX_SGI_make_current_read, GLX_SGI_swap_control, GLX_SGI_video_sync
Extended renderer info (GLX_MESA_query_renderer):
    Vendor: Panfrost (0xffffffff)
    Device: Mali-G31 (Panfrost) (0xffffffff)
    Version: 22.3.6
    Accelerated: yes
    Video memory: 981MB
    Unified memory: yes
    Preferred profile: core (0x1)
    Max core profile version: 3.1
    Max compat profile version: 3.1
    Max GLES1 profile version: 1.1
    Max GLES[23] profile version: 3.1
OpenGL vendor string: Panfrost
OpenGL renderer string: Mali-G31 (Panfrost)
OpenGL core profile version string: 3.1 Mesa 22.3.6
OpenGL core profile shading language version string: 1.40
OpenGL core profile context flags: (none)
OpenGL core profile extensions:
    GL_AMD_conservative_depth, GL_AMD_depth_clamp_separate, 
    GL_AMD_draw_buffers_blend, GL_AMD_multi_draw_indirect, 
    GL_AMD_seamless_cubemap_per_texture, GL_AMD_shader_stencil_export, 
    GL_AMD_shader_trinary_minmax, GL_AMD_texture_texture4, 
    GL_ANGLE_texture_compression_dxt3, GL_ANGLE_texture_compression_dxt5, 
    GL_APPLE_packed_pixels, GL_ARB_ES2_compatibility, 
    GL_ARB_ES3_compatibility, GL_ARB_arrays_of_arrays, GL_ARB_base_instance, 
    GL_ARB_blend_func_extended, GL_ARB_buffer_storage, 
```

注意此处:

```sh
Extended renderer info (GLX_MESA_query_renderer):
    Vendor: Panfrost (0xffffffff)
    Device: Mali-G31 (Panfrost) (0xffffffff)
    Version: 22.3.6
    Accelerated: yes
    Video memory: 981MB
    Unified memory: yes
    Preferred profile: core (0x1)
    Max core profile version: 3.1
    Max compat profile version: 3.1
    Max GLES1 profile version: 1.1
    Max GLES[23] profile version: 3.1
OpenGL vendor string: Panfrost
OpenGL renderer string: Mali-G31 (Panfrost)
```

说明成功启用了 GPU 硬件加速.

### 4.3 libinput 调试信息 (节选)

```sh
root@5ca7f27e7a83:/# id
uid=0(root) gid=0(root) groups=0(root),65534(nogroup)
root@5ca7f27e7a83:/# ls -al /dev/input
total 0
drwxr-xr-x 2 root   root       160 Aug 17 07:43 .
drwxr-xr-x 7 root   root       420 Aug 17 07:43 ..
crw-rw---- 1 nobody nogroup 13, 64 Aug 17 07:19 event0
crw-rw---- 1 nobody nogroup 13, 65 Aug 17 07:19 event1
crw-rw---- 1 nobody nogroup 13, 66 Aug 17 07:19 event2
crw-rw---- 1 nobody nogroup 13, 67 Aug 17 07:19 event3
crw-rw---- 1 nobody nogroup 13, 68 Aug 17 07:19 event4
crw-rw---- 1 nobody nogroup 13, 63 Aug 17 07:19 mice
root@5ca7f27e7a83:/# type libinput
libinput is /usr/bin/libinput
root@5ca7f27e7a83:/# libinput list-devices
Device:           CASUE USB KB
Kernel:           /dev/input/event0
Group:            1
Seat:             seat0, default
Capabilities:     keyboard 
Tap-to-click:     n/a
Tap-and-drag:     n/a
Tap drag lock:    n/a
Left-handed:      n/a
Nat.scrolling:    n/a
Middle emulation: n/a
Calibration:      n/a
Scroll methods:   none
Click methods:    none
Disable-w-typing: n/a
Disable-w-trackpointing: n/a
Accel profiles:   n/a
Rotation:         n/a
```

使用 `libinput list-devices` 命令列出了输入设备的信息, 此处是一个键盘.
如果鼠标/键盘的输入不正常, 可以考虑使用这个命令.


## 5 总结与展望

本文验证了在香橙派 zero3 (内存 1GB) 上可以使用容器 (podman)
运行 x11 服务器以及图形界面应用, 并启用 GPU 硬件加速 (OpenGL).

容器可以让主系统保持干净, 部署和运行应用都很方便.
与 wayland 相比, x11 更容易进行个性化定制.
香橙派 zero3 具有 4K 60fps (HDMI) 输出能力, 可以外接大屏显示器使用.

"最小基本系统 + 容器应用" 的模式, 与 Fedora CoreOS (rpm-ostree) 的思路很像.
从服务器, 到 PC, 再到嵌入式 (单板机), 从服务器程序, 到命令行程序,
再到图形界面程序, 容器技术使用广泛, 真是个非常好的技术, 应该多多使用 !

香橙派除了 Debian 等系统镜像, 还有 Android 系统镜像,
并且 Android 系统有额外优点 (比如支持视频编解码硬件加速, Linux 不支持).
可以考虑尝试在容器中运行 Android 系统, 从而实现某种 Debian/Android 混合系统.
类似于 `redroid` 项目: <https://github.com/remote-android/redroid-doc>

----

本文使用 CC-BY-SA 4.0 许可发布.
