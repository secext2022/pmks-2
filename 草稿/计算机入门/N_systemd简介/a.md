# systemd 简介

Linux 是一个内核, 负责内核空间 (kernel space) 的一切事情.
那么 systemd 就是用户空间的老大 (PID 1),
负责整个用户空间 (user space) 的运行, (几乎) 管理用户空间的一切事情.
对于现代 GNU/Linux 操作系统的系统管理来说, systemd 是一个非常重要的核心组件.
了解 systemd, 基本上就了解了系统管理的各个方面.

TODO


## 目录

+ 1 systemd 是什么

  <https://systemd.io/>
  <https://www.man7.org/linux/man-pages/man1/systemd.1.html>
  <https://www.freedesktop.org/software/systemd/man/latest/>

+ 2 systemd 核心概念

  - 2.1 单元 (unit, service, socket, timer, device)

    <https://www.man7.org/linux/man-pages/man5/systemd.unit.5.html>

    服务 (service)
    <https://www.man7.org/linux/man-pages/man5/systemd.service.5.html>

    插座 (socket)
    <https://www.man7.org/linux/man-pages/man5/systemd.socket.5.html>

    定时器 (timer)
    <https://www.man7.org/linux/man-pages/man5/systemd.timer.5.html>

    挂载 (mount, automount, swap)
    <https://www.man7.org/linux/man-pages/man5/systemd.mount.5.html>
    <https://www.man7.org/linux/man-pages/man5/systemd.automount.5.html>
    <https://www.man7.org/linux/man-pages/man5/systemd.swap.5.html>

    路径 (path)
    <https://www.man7.org/linux/man-pages/man5/systemd.path.5.html>

    设备 (device)
    <https://www.man7.org/linux/man-pages/man5/systemd.device.5.html>

  - 2.2 目标 (target)

    <https://www.man7.org/linux/man-pages/man5/systemd.target.5.html>
    <https://www.man7.org/linux/man-pages/man7/systemd.special.7.html>

  - 2.3 切片 (slice), 范围 (scope)

    <https://www.man7.org/linux/man-pages/man5/systemd.slice.5.html>
    <https://www.man7.org/linux/man-pages/man5/systemd.scope.5.html>

+ 3 计算机启动过程

  - 3.1 用户空间之前 (UEFI, GRUB, Linux)

  - 3.2 用户空间的启动过程 (systemd)

    <https://www.man7.org/linux/man-pages/man7/bootup.7.html>

+ 4 systemd 提供的主要功能

  - 4.1 服务管理 (systemctl, serivce, socket, timer, systemd PID 1)

    <https://www.man7.org/linux/man-pages/man1/systemctl.1.html>

  - 4.2 日志管理 (journalctl, systemd-journald)

    <https://www.man7.org/linux/man-pages/man1/journalctl.1.html>

  - 4.3 时间管理 (timedatectl, systemd-timesyncd)

  - 4.4 网络管理 (networkctl, resolvectl, systemd-networkd, systemd-resolved)

  - 4.5 用户登录管理 (loginctl, userdbctl, homectl, systemd-logind)

  - 4.6 挂载管理 (mount, automount, swap)

  - 4.7 主机名管理 (hostnamectl)

  - 4.8 语言区域管理 (localectl)

  - 4.9 资源限制 (cgroup, slice, scope)

  - 4.10 消息总线 (busctl, D-Bus)

  - 4.11 设备管理 (device, systemd-udevd)

  - 4.12 引导启动 (bootctl, systemd-boot)

  - 4.13 虚拟机和容器管理 (machinectl, systemd-machined)

  - 4.14 分析工具 (systemd-analyze)

    <https://www.man7.org/linux/man-pages/man1/systemd-analyze.1.html>

    ```sh
    core@MiWiFi-RA74-srv:~$ systemd-analyze time
    Startup finished in 2.070s (kernel) + 2.698s (initrd) + 8.015s (userspace) = 12.784s 
    multi-user.target reached after 7.584s in userspace.
    core@MiWiFi-RA74-srv:~$ 
    ```

+ 5 用户实例 (systemd --user)

+ 6 编写 systemd 单元文件

  - 6.1 unit 文件格式

  - 6.2 实例: 系统配置

  - 6.3 实例: 用户配置


TODO
