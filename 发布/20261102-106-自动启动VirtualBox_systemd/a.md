# 开机自动启动 VirtualBox 虚拟机 (systemd/ArchLinux)

(本文使用 AI 辅助创作)

如果在 VirtualBox 虚拟机 中运行重要的基础服务 (比如 局域网 DNS 服务器),
那么就希望, 虚拟机 能够在 物理机 开机后, 自动启动.
同时, 希望 物理机 关机时, 虚拟机 也能自动优雅关机.

本文使用 systemd (user unit) 来实现这些功能, 并在 ArchLinux 系统上测试成功.

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 106 号作品. )


## 目录

+ 1 systemd user unit 文件

  - 1.1 用法
  - 1.2 维护 (停止 timer)

+ 2 原理与解释

  - 2.1 为什么 不能直接向 `VBoxHeadless` 发送 `SIGTERM` 信号
  - 2.2 为什么 要用另一个 systemd service 运行 `VBoxSVC`
  - 2.3 为什么 `vbox-headless@.service` 里面要用 `Restart=on-failure` 并用另一个 `vbox-auto-run@.timer` 来重新启动 虚拟机
  - 2.4 为什么 运行 `VBoxHeadless` 要拆成 3 个 systemd service

+ 3 测试运行

  - 3.1 测试 虚拟机 正常启动
  - 3.2 测试 关闭 虚拟机
  - 3.3 测试 物理机 关机 时, 虚拟机 也会正常关闭
  - 3.4 测试 重启 虚拟机 (`systemctl --user restart`)
  - 3.5 测试 虚拟机 自己关机之后, 会被 timer 重新启动
  - 3.6 终极测试: 开机 自动启动

+ 4 总结与展望

----

相关文章:

+ 《用容器编译 VirtualBox 虚拟机软件 (ArchLinux, podman)》

  TODO

+ 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》

  TODO

+ 《在 虚拟机 中运行 Kimi Code CLI (AI agent) 写代码》

  TODO

+ 《使用 SSH 安装 ArchLinux (cloud-init)》

  TODO

参考资料:

+ <https://www.virtualbox.org/>
+ <https://wiki.archlinux.org/title/VirtualBox>
+ <https://www.virtualbox.org/manual/topics/vboxmanage.html>
+ <https://www.freedesktop.org/software/systemd/man/latest/systemd.unit.html>
+ <https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html>
+ <https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html>
+ <https://www.freedesktop.org/software/systemd/man/latest/systemd.kill.html>
+ <https://www.freedesktop.org/software/systemd/man/latest/systemd.timer.html>
+ <https://www.freedesktop.org/software/systemd/man/latest/user@.service.html>


## 1 systemd user unit 文件

如果只想要结果, 就在本章节拿走不谢 (狗头

相关文件都位于 `~/.config/systemd/user` 目录:

```sh
> ls -l ~/.config/systemd/user

省略

-rw-r--r-- 1 s2 s2 251 11月 1日 22:16 'vbox-auto-run@.service'
-rw-r--r-- 1 s2 s2 233 11月 1日 22:17 'vbox-auto-run@.timer'
-rw-r--r-- 1 s2 s2 391 11月 1日 22:16 'vbox-headless@.service'
-rw-r--r-- 1 s2 s2 311 11月 1日 22:17 'vbox-stop@.service'
-rw-r--r-- 1 s2 s2 180 11月 1日 22:16  vbox-svc.service
```

+ 文件 `~/.config/systemd/user/vbox-svc.service`:

```sh
[Unit]
Description=Run /usr/lib/virtualbox/VBoxSVC for VirtualBox VM

[Service]
Type=exec

ExecStart=/usr/lib/virtualbox/VBoxSVC

Restart=always

[Install]
WantedBy=default.target
```

+ 文件 `~/.config/systemd/user/vbox-auto-run@.service`:

```sh
[Unit]
Description=Auto run VirtualBox VM "%I"

Requires=vbox-stop@%i.service
BindsTo=vbox-headless@%i.service
After=vbox-headless@%i.service

[Service]
Type=oneshot
RemainAfterExit=yes

ExecStop=-/usr/bin/echo 666

[Install]
WantedBy=default.target
```

+ 文件 `~/.config/systemd/user/vbox-headless@.service`:

```sh
[Unit]
Description=VBoxHeadless for VirtualBox VM "%I"

Requires=vbox-svc.service
After=vbox-svc.service

PartOf=vbox-auto-run@%i.service

[Service]
Type=exec

ExecStart=/usr/bin/VBoxHeadless --startvm "%I"

Restart=on-failure
RestartSec=10

TimeoutStopSec=60
KillSignal=SIGKILL

ExecStop=-/usr/bin/waitpid -e $MAINPID

ExecStopPost=-/usr/bin/systemctl --user kill -s 9 vbox-stop@%i.service
```

+ 文件 `~/.config/systemd/user/vbox-stop@.service`:

```sh
[Unit]
Description=Stop VirtualBox VM "%I"

PartOf=vbox-auto-run@%i.service

[Service]
Type=oneshot
RemainAfterExit=yes

ExecStop=/usr/bin/VBoxManage controlvm "%I" acpipowerbutton

ExecStop=/usr/bin/sleep 30

ExecStop=-/usr/bin/VBoxManage controlvm "%I" poweroff

ExecStop=/usr/bin/sleep 10

TimeoutStopSec=50
```

+ 文件 `~/.config/systemd/user/vbox-auto-run@.timer`:

```sh
[Unit]
Description=Restart VirtualBox VM "%I" after it exit (prevent VM poweroff, should always run)

[Timer]
Unit=vbox-auto-run@%i.service

OnUnitInactiveSec=30

AccuracySec=1
RandomizedDelaySec=5

[Install]
WantedBy=timers.target
```

### 1.1 用法

首先是一次性系统配置.

加载 systemd 配置文件:

```sh
systemctl --user daemon-reload
```

启用当前用户 linger:

```sh
loginctl enable-linger
```

然后启用 `VBoxSVC` 服务:

```sh
systemctl --user enable vbox-svc.service
```

然后 **重启** 系统 !

这一点非常重要, 因为要确保 `VBoxSVC` 在任何 VirtualBox 虚拟机 启动之前 运行,
否则会有 虚拟机 崩溃 的大坑.

----

重启之后.

列出 VirtualBox 虚拟机, 比如:

```sh
> VBoxManage list vms
"vfc4-202610" {5c3da8f6-a805-457d-a29c-de858977ddbb}
"arch-ai-agent-202610" {92f4512b-96a2-47a9-959b-9ec2a2df77e5}
"prom2-202610" {c98ad434-5a1e-46fe-af0a-39cf8552c11d}
```

对 虚拟机名称 进行 systemd 转义, 比如:

```sh
> systemd-escape "prom2-202610"
prom2\x2d202610
```

然后启动对应的虚拟机, 比如:

```sh
systemctl --user enable --now "vbox-auto-run@prom2\x2d202610.service"
systemctl --user enable --now "vbox-auto-run@prom2\x2d202610.timer"
```

### 1.2 维护 (停止 timer)

因为启动了 `vbox-auto-run@.timer` 所以 虚拟机 是 **不能关机** 的,
如果 虚拟机 关机了, 也会被 timer 再次启动.

如果维护时, 需要 虚拟机 关机, 那么要先停止 timer, 比如:

```sh
systemctl --user stop "vbox-auto-run@prom2\x2d202610.timer"
```

维护完成后, 再启动 timer, 比如:

```sh
systemctl --user start "vbox-auto-run@prom2\x2d202610.timer"
```


## 2 原理与解释

本章节包含踩过的大坑.

### 2.1 为什么 不能直接向 VBoxHeadless 发送 SIGTERM 信号

默认情况下, 如果一个 VirtualBox 虚拟机 正在运行, 然后让 物理机 关机, 那么:

![VirtualBox 异常退出](./图/21-v-1.png)

(异常退出) 或者:

![VirtualBox 已休眠](./图/21-v-2.png)

(已休眠) "休眠" 其实就是把 虚拟机 的内存数据写入 硬盘 (或 SSD), 保存下来.

我们希望避免这些情况, 尤其是避免第 2 种 **已休眠**.
我们希望 虚拟机 能够 正常关机.

但是, "休眠" (保存虚拟机状态) 的动作是 VirtualBox 源代码中写死的, 当 VBoxHeadless 收到 `SIGTERM` 信号时, 就会保存虚拟机状态, 然后退出.
这种行为是无条件的, 没有配置选项, 无法改变, 除非修改 VirtualBox 源代码, 然后重新编译.

因此, 为了克服 VirtualBox 的这个特点, 我们就要做一些特殊处理.

### 2.2 为什么 要用另一个 systemd service 运行 VBoxSVC

`VBoxHeadless` 进程 (以下简称 `H`) 依赖 `VBoxSVC` 进程 (以下简称 `S`).

其中每个 H 进程是一个 虚拟机, 如果同时运行多个虚拟机, 就会有多个 H.
但是 S 进程 只有一个, 被所有 H 进程 共享.

H 启动时, 如果发现没有 S, 就会自己启动一个 S.
然后再启动别的 H 时, 因为 S 已经在运行, 就不会再启动 S.

然而, 这在使用 systemd service 运行 H 时, 会有问题:

比如 H1 启动时, 自己启动了 S, 这个 S 就属于 H1 的 service (cgroup).
此时再启动 H2, 那么 H2 的 service 里面, 就只有 H2.
如果此时关闭 H1, 因为 systemd 会结束 service 里面的所有 进程, 所以 S 也会结束.
那么 H2 因为没有 S, 就会 **崩溃** !

解决方法是, 把 S 放在它自己的 systemd service 中运行,
然后让 H1 和 H2 都依赖 S.
这样, 在 H1 和 H2 都停止之前, systemd 不会结束 S, 就能正常运行了.

这是 大坑 之一.

### 2.3 为什么 vbox-headless@.service 里面要用 Restart=on-failure 并用另一个 vbox-auto-run@.timer 来重新启动 虚拟机

我们希望, 如果 虚拟机 意外崩溃, 会自动重启.
同时希望, 虚拟机 **可以关机** ! (不要笑)

如果 `vbox-headless@.service` 使用了 `Restart=always`, 那么, 如果 虚拟机 (内部系统, guest) 自己关机, VBoxHeadless 进程 就会退出, 然后 systemd 就会 立即重启 虚拟机 !

这样 虚拟机 就会表现为, 无法关机.
也就是说, 我们无法使用 类似在 虚拟机 中运行 `systemctl poweroff` 的方法, 来让 虚拟机 主动关机, 这样维护起来就很不方便.

而使用 `Restart=on-failure` 之后, 只有 虚拟机 意外奔溃, 才会被重启.
如果 虚拟机 正常关机 (正常退出), 就不会再重启.

但是, 对于 无人值守 的情况, 有时候我们希望 虚拟机 不能关机.
比如, 虚拟机 里面运行一个 不可信的 AI agent, 然后这个 agent 可能执行命令, 操作 虚拟机 关机.

此时, 通过额外的一个 timer, 就可以保证 虚拟机 不会长期关机, 即使意外关机, 也很快会被重新启动.

### 2.4 为什么 运行 `VBoxHeadless` 要拆成 3 个 systemd service

这主要是为了在 克服 VirtualBox 特点 (详见 章节 2.1) 的情况下, 让 虚拟机 能够优雅关机.

目前, 几乎所有的 主流 虚拟机 软件 (包括 VirtualBox, QEMU 等), 都没有 "物理机 关机时, 虚拟机 跟着优雅关机" 的功能, 都要自己想办法实现, 还经常很坑.

为了让 VirtualBox 虚拟机 优雅关机, 可以使用 `VBoxManage controlvm "XXX" acpipowerbutton` 命令, 其实就是相当于 (模拟) 按下了 虚拟机 的 "电源按钮".
大部分 Linux 操作系统, 收到相应的 ACPI 信号之后, 默认动作都是关机.

但是, `acpipowerbutton` 命令 **瞬间** 就执行完了, 我们还需要 **等待** 虚拟机 自己关机, 并且, 等待时间还不确定, 可能几秒, 也可能一分钟, 甚至 虚拟机 耍赖, 就一直不关机.

所以, 还需要有 等待 / 超时 处理逻辑.

实现这一套, 也可以写个 shell 脚本, 但是窝觉得 shell 脚本 太复杂了.
希望能够充分利用 systemd 自己的能力, 不用 shell 脚本.

同时, 还希望, 在 等待 期间, 如果 虚拟机 已经关机 (VBoxHeadless 退出了), 那么立即 **结束等待**, 不要再继续 傻等 了 !

如果 运行 VBoxHeadless 和 结束/超时等待 逻辑, 放在同一个 systemd service 里面, 那么必然出现 "傻等" 的情况, 无法在 虚拟机 退出后, 立即结束等待, 所以必需 拆分.

但是, 如果只是拆分成 2 个 service, 之间的 依赖关系 / 状态耦合 就会很麻烦, 于是就有了如今的 3 service 方案.

然后又遇到了 大坑, kimi 给出的 初版 3 service 方案中, `vbox-stop@.service` 是 "按需启动" 的, 也就是在 `vbox-auto-run@.service` 的 `ExecStop=` 中, 执行 `systemctl --user start vbox-stop@%i.service`,
然后 `vbox-stop@.service` 在 `ExecStart=` 里面, 依次执行 `VBoxManage`, `sleep` 等命令.
同时 `vbox-headless@.service` 在 `ExecStopPost=` 里面执行 `systemctl --user stop vbox-stop@%i.service` 来停止 "傻等".

这套 初版 方案, 平时测试起来, 一切正常.
然而, 物理机 关机 时, 就出 BUG 了 !
因为, 关机 时, 无法再通过 `systemctl start` 的方式, 来启动新的 service !
所以, 最关键的使用场景, 物理机 关机时, 虚拟机 反而无法正常关机了 !

所以就改成了现在这版方案:

`vbox-stop@.service` 通过 `RemainAfterExit=yes` 在 虚拟机 启动时, 就提前处于 "启动" (active) 状态.

然后在 `ExecStop=` 里面, 执行 关机/超时等待 逻辑.

但是, 因为这是 `ExecStop`, 就没法在通过 `systemctl stop` 的方式, 来结束 "傻等" 了.
所以使用了 `systemctl --user kill -s 9 vbox-stop@%i.service` 这种方式来 强制停止.

虽然遍地是 坑, 但最终还是成功了, 撒花 ~

这也是 大坑 之一.


## 3 测试运行

下面进行实际测试.

首先, 确保用于测试的 虚拟机 (此处使用 `prom2-202610`) 处于 **关机** 状态.

### 3.1 测试 虚拟机 正常启动

```sh
systemctl --user start "vbox-auto-run@prom2\x2d202610.service"
```

查看相关服务运行状态:

```sh
systemctl --user status "vbox-auto-run@prom2\x2d202610.service"

systemctl --user status "vbox-headless@prom2\x2d202610.service"
```

很好, 虚拟机 正常运行了.

### 3.2 测试 关闭 虚拟机

```sh
systemctl --user stop "vbox-auto-run@prom2\x2d202610.service"
```

查看相关服务日志:

```sh
systemctl --user status "vbox-stop@prom2\x2d202610.service"

systemctl --user status "vbox-headless@prom2\x2d202610.service"
```

很好, 虚拟机 正常关机.

### 3.3 测试 物理机 关机 时, 虚拟机 也会正常关闭

首先, 启动 虚拟机:

```sh
systemctl --user start "vbox-auto-run@prom2\x2d202610.service"
```

然后, 操作 物理机 直接关机.

啊 ~~ 不小心真的关机了 ! (发呆ing) 本来想点 "重启" 的 .. . (捂脸

物理机 再次启动后, 就会看到:

![虚拟机关机测试](./图/33-t-1.png)

如图, 下面的 虚拟机 使用本文的方式运行, 显示 "已关闭".
最上面的 虚拟机 是 手动 启动的, 作为对照, 显示 "异常退出".

测试成功 !

### 3.4 测试 重启 虚拟机 (systemctl --user restart)

首先按照本文的方式启动虚拟机, 然后:

```sh
systemctl --user restart "vbox-auto-run@prom2\x2d202610.service"
```

虚拟机 会 正常关机, 然后 立即再次启动.

测试成功.

### 3.5 测试 虚拟机 自己关机之后, 会被 timer 重新启动

首先, 启动 timer:

```sh
systemctl --user start "vbox-auto-run@prom2\x2d202610.timer"
```

然后, SSH 到 虚拟机, 操作 虚拟机 关机:

```sh
> ssh prom2-core
Fedora CoreOS 44.20261012.3.1
Tracker: https://github.com/coreos/fedora-coreos-tracker
Discuss: https://discussion.fedoraproject.org/tag/coreos

Last login: Sat Oct 31 07:49:42 2026 from 192.168.31.2
core@prom2:~$ sudo systemctl poweroff

Broadcast message from root@prom2 on pts/1 (Sun 2026-11-01 14:43:48 UTC):

The system will power off now!
```

稍等.

虚拟机 重新启动了 !

测试成功.

### 3.6 终极测试: 开机 自动启动

```sh
systemctl --user enable "vbox-auto-run@prom2\x2d202610.service"
systemctl --user enable "vbox-auto-run@prom2\x2d202610.timer"
```

然后 物理机 重启.

在 物理机 不登录用户的情况下, 在局域网从另一个设备, 尝试直接访问 虚拟机.

测试成功 ! 这说明 虚拟机 确实在正常运行.

----

相关软件版本:

```sh
> VBoxManage --version
7.2.22r175245
> systemctl --version
systemd 262 (262.1-1-arch)
+PAM +AUDIT -SELINUX +APPARMOR -IMA +IPE +SMACK +SECCOMP +GNUTLS +OPENSSL +ACL +BLKID +CURL +ELFUTILS +FIDO2 +IDN2 +KMOD +LIBCRYPTSETUP +LIBCRYPTSETUP_PLUGINS +LIBFDISK +PCRE2 +PWQUALITY +P11KIT +QRENCODE +TPM2 +BZIP2 +LZ4 +XZ +ZLIB +ZSTD +BPF_FRAMEWORK +BTF +XKBCOMMON +UTMP +LIBARCHIVE
> uname -a
Linux S2L 7.2.11-zen1-1-zen #1 ZEN SMP PREEMPT_DYNAMIC Fri, 16 Oct 2026 00:28:42 +0000 x86_64 GNU/Linux
```


## 4 总结与展望

本文使用 kimi 生成 systemd user unit 的初版配置方案, 但是 kimi 给的方案有严重 BUG, 踩了很多坑.
然后经过 人工 检查, 实际测试, 和许多调整, 才成功实现目标, 目前尚未发现更多残留的严重 BUG.

虽然一路上被各种 坑 的不要不要的, 但最终实现了理想中的情况:
物理机 开机后, 虚拟机 会自动启动运行.
物理机 关机时, 虚拟机 会优雅关机, 然后 物理机 再关机.

终于, 虚拟机 实现了 "一键启动": 只需按下 物理机 的 电源按钮 即可 (狗头

虽然 VirtualBox 自己就有很多 大坑: 比如 KVM 和 VirtualBox 无法同时使用 (硬件虚拟化 功能冲突), 比如 VirtualBox 的 嵌套虚拟化 功能有严重 BUG (无法正常运行).
但是, 在 跨平台 (支持多种 操作系统 host) 的 开源 虚拟机软件 方面, 目前没有替代品呀.
哎, 希望 VirtualBox 能够越来越好吧.

----

本文使用 CC-BY-SA 4.0 许可发布.
