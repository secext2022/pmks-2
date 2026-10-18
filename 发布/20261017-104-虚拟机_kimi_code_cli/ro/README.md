# 只读数据 (开发环境) 说明

`/home/@u/ro/`

此目录中的数据由 (人类) 管理员 维护, AI agent 作为 普通 Linux 用户 运行,
无权限修改 (由文件系统权限保证).

此处的 只读数据 (文件) 主要用于 **开发环境恢复**, 就是比如 AI agent
不小心把自己的开发环境弄坏了, 可以从这里复制文件, 重新搭建/恢复 开发环境.

## 本机 (VirtualBox 虚拟机) 软件环境说明

操作系统 ArchLinux.

系统已经安装的软件包有:

```sh
sudo pacman -S openssh nano fish \
  tmux base-devel rsync \
  podman toolbox runc krun firecracker \
  qemu-base qemu-tools qemu-docs qemu-user-static qemu-user-static-binfmt \
  git deno nodejs npm pnpm python uv wasmer lld lldb \
  nushell libisoburn ffmpeg less 7zip zip unzip man \
  virtualbox-guest-utils-nox \
  noto-fonts noto-fonts-cjk noto-fonts-emoji noto-fonts-extra \
  electron chromium \
  vulkan-mesa-layers vulkan-swrast vulkan-virtio vulkan-gfxstream
```

软件包 版本 详见 附录 1.

由于 AI agent 只是 普通 Linux 用户, 所以 无权限 在系统上安装新的软件包.
但是可以使用 容器 (podman, toolbox), 虚拟机 (QEMU) 等方式, 安装/运行
自己所需的软件.

本机 没有开启 嵌套虚拟化, 所以 `KVM` 不可用. 虚拟机 只能通过 QEMU
软件方式低速运行, 所以应该优先使用 容器, 必需时才使用 虚拟机.

## podman 容器 相关数据

- 本地镜像包:

```sh
[kc1@arch-ai-agent-202610 ~]$ cd /home/@u/ro/podman-image
[kc1@arch-ai-agent-202610 podman-image]$ ls -l
total 156076
-r--r--r-- 1 core core   3779971 Oct 17 08:25 alpine-20261017.tar.zst
-r--r--r-- 1 core core 120486103 Oct 17 08:26 archlinux-20261017.tar.zst
-r--r--r-- 1 core core  35550994 Oct 17 08:26 ubuntu-20261017.tar.zst
```

可以加载, 比如:

```sh
[kc1@arch-ai-agent-202610 podman-image]$ podman load < alpine-20261017.tar.zst
```

---

- 容器构建脚本 (用于重新构建容器):

```sh
[kc1@arch-ai-agent-202610 ~]$ cd /home/@u/ro
[kc1@arch-ai-agent-202610 ro]$ ls -l

省略

drwxr-xr-x 1 core core  20 Oct 17 08:04 qemu-alpine
drwxr-xr-x 1 core core  48 Oct 17 08:07 randmac-ubuntu

[kc1@arch-ai-agent-202610 ro]$ ls -l qemu-alpine/
total 4
-rw-r--r-- 1 core core 305 Oct 17 08:05 Dockerfile
[kc1@arch-ai-agent-202610 ro]$ ls -l randmac-ubuntu/
total 8
-rw-r--r-- 1 core core  316 Oct 17 08:05 Dockerfile
-rw-r--r-- 1 core core 1513 Oct 17 08:07 ubuntu.sources
```

构建方式, 比如:

```sh
[kc1@arch-ai-agent-202610 ro]$ cd qemu-alpine/
[kc1@arch-ai-agent-202610 qemu-alpine]$ podman build -t qemu-alpine .
```

预先构建的容器镜像 详见 附录 2.

此处的脚本仅用于重新构建.

## 虚拟机 系统镜像

```sh
[kc1@arch-ai-agent-202610 ~]$ ls -l /home/@u/ro/vm-sys-img/
total 1114136
-r--r--r-- 1 core core 157220864 Oct 17 08:25 alpine-3.24.2-x86_64-cloudinit-r2.qcow2
-r--r--r-- 1 core core       129 Oct 17 08:25 alpine-3.24.2-x86_64-cloudinit-r2.qcow2.sha512
-r--r--r-- 1 core core  69206016 Oct 17 08:26 alpine-virt-3.24.2-x86_64.iso
-r--r--r-- 1 core core        96 Oct 17 08:26 alpine-virt-3.24.2-x86_64.iso.sha256
-r--r--r-- 1 core core 914436440 Oct 17 08:26 fedora-coreos-44.20260928.3.1-qemu.x86_64.qcow2.xz
```

可以按需使用. 推荐使用 `alpine-virt-3.24.2-x86_64.iso`, 比较轻量.

---

运行 QEMU 虚拟机, 比如:

```sh
qemu-system-x86_64 -m 256 -cdrom /home/@u/ro/vm-sys-img/alpine-virt-3.24.2-x86_64.iso -nographic
```

结果 (交互式):

```sh
Welcome to Alpine Linux 3.24
Kernel 6.18.52-0-virt on x86_64 (/dev/ttyS0)

localhost login: root
Welcome to Alpine!

The Alpine Wiki contains a large amount of how-to guides and general
information about administrating Alpine systems.
See <https://wiki.alpinelinux.org/>.

You can setup the system with the command: setup-alpine

You may change this message by editing /etc/motd.

localhost:~# id
uid=0(root) gid=0(root) groups=0(root),0(root),1(bin),2(daemon),3(sys),4(adm),6(disk),10(wheel),11(floppy),20(dialout),26(tape),27(video)
localhost:~# free -h
              total        used        free      shared  buff/cache   available
Mem:         216.9M       28.3M      134.8M       15.3M       53.8M      165.2M
Swap:             0           0           0
localhost:~# cat /etc/os-release
NAME="Alpine Linux"
ID=alpine
VERSION_ID=3.24.2
PRETTY_NAME="Alpine Linux v3.24"
HOME_URL="https://alpinelinux.org/"
BUG_REPORT_URL="https://gitlab.alpinelinux.org/alpine/aports/-/issues"
localhost:~# pwd
/root
localhost:~# 
localhost:~# poweroff
```

## 附录 1 系统软件包版本

```sh
[kc1@arch-ai-agent-202610 ~]$ fish --version
fish, version 4.9.3
[kc1@arch-ai-agent-202610 ~]$ tmux -V
tmux 3.8
[kc1@arch-ai-agent-202610 ~]$ podman --version
podman version 6.1.4
[kc1@arch-ai-agent-202610 ~]$ toolbox --version
toolbox version 0.3
[kc1@arch-ai-agent-202610 ~]$ git --version
git version 2.56.0
[kc1@arch-ai-agent-202610 ~]$ deno --version
deno 2.9.7 (stable, release, x86_64-unknown-linux-gnu)
v8 15.0.245.2-rusty
typescript 6.0.3
[kc1@arch-ai-agent-202610 ~]$ node --version
v26.11.1
[kc1@arch-ai-agent-202610 ~]$ npm --version
12.2.1
[kc1@arch-ai-agent-202610 ~]$ pnpm --version
12.14.0
[kc1@arch-ai-agent-202610 ~]$ python --version
Python 3.14.8
[kc1@arch-ai-agent-202610 ~]$ uv --version
uv 0.13.1 (62faed335 2026-10-13 x86_64-unknown-linux-gnu)
[kc1@arch-ai-agent-202610 ~]$ sqlite3 --version
3.54.0 2026-10-09 15:46:58 be8d059e9a49089ab2dce5ed26dd87aaf598fdc5fbe0b107c0dd758464bcalt1 (64-bit)
[kc1@arch-ai-agent-202610 ~]$ nu --version
0.116.1
```

## 附录 2 开发环境 (AI agent 的 普通用户) 初始状态

此处只描述 管理员 配置的 开发环境 初始状态, AI agent 可能修改自己的 开发环境,
所以仅供参考.

### tmux 工具

AI agent 可以使用 tmux 运行需要 交互 的应用, 比如:

- 列出会话:

```sh
[kc1@arch-ai-agent-202610 ~]$ tmux ls
default: 1 windows (created Sat Oct 17 10:01:48 2026)
```

- 创建新的后台会话 (运行 bash):

```sh
[kc1@arch-ai-agent-202610 ~]$ tmux new -s test-bash -d bash
[kc1@arch-ai-agent-202610 ~]$ tmux ls
default: 1 windows (created Sat Oct 17 10:01:48 2026)
test-bash: 1 windows (created Sat Oct 17 10:02:18 2026)
```

- 查看后台会话:

```sh
[kc1@arch-ai-agent-202610 ~]$ tmux capture-pane -t test-bash -p
[kc1@arch-ai-agent-202610 ~]$
```

- 发送按键输入 (还支持 `C-c`, `Up`, `Tab` 等特殊按键):

```sh
[kc1@arch-ai-agent-202610 ~]$ tmux send-keys -t test-bash "pwd" Enter
[kc1@arch-ai-agent-202610 ~]$ tmux capture-pane -t test-bash -p
[kc1@arch-ai-agent-202610 ~]$ pwd
/home/@u/kc1
[kc1@arch-ai-agent-202610 ~]$
```

- 结束会话:

```sh
[kc1@arch-ai-agent-202610 ~]$ tmux kill-session -t test-bash
[kc1@arch-ai-agent-202610 ~]$ tmux ls
default: 1 windows (created Sat Oct 17 10:01:48 2026)
```

---

已经配置了 tmux 在后台运行:

```sh
[kc1@arch-ai-agent-202610 ~]$ cat ~/.config/systemd/user/tmux.service
[Unit]
Description=tmux session
Documentation=man:tmux(1)

[Service]
Type=forking
Restart=always
ExecStart=/usr/bin/tmux new-session -s default -d \; set-option -g destroy-unattached off
ExecStop=/usr/bin/tmux kill-session -t default

[Install]
WantedBy=default.target
[kc1@arch-ai-agent-202610 ~]$ systemctl --user status tmux
● tmux.service - tmux session
     Loaded: loaded (/home/@u/kc1/.config/systemd/user/tmux.service; enabled; preset: enabled)
     Active: active (running) since Sat 2026-10-17 09:45:46 UTC; 1s ago
```

并且启用了 linger:

```sh
[kc1@arch-ai-agent-202610 ~]$ loginctl enable-linger
[kc1@arch-ai-agent-202610 ~]$ loginctl list-users
 UID USER LINGER STATE 
1001 kc1  yes    active

1 users listed.
```

查看 tmux 的文档 (如果需要):

```sh
[kc1@arch-ai-agent-202610 ~]$ man tmux
```

### podman 容器镜像

```sh
[kc1@arch-ai-agent-202610 ~]$ podman images
REPOSITORY                TAG         IMAGE ID      CREATED         SIZE
localhost/randmac-ubuntu  latest      ece20fb83cde  14 minutes ago  157 MB
localhost/qemu-alpine     latest      667269608828  20 minutes ago  124 MB
localhost/archlinux       latest      5a30b4acc83f  4 days ago      410 MB
localhost/ubuntu          latest      b9e485d4a3bc  10 days ago     113 MB
localhost/alpine          latest      320994c3b997  4 weeks ago     8.71 MB
```

- randmac 工具 (用于随机生成 MAC 地址):

```sh
[kc1@arch-ai-agent-202610 ~]$ podman run --rm randmac-ubuntu
52:54:00:e3:3b:4a
```

### toolbox 环境

```sh
[kc1@arch-ai-agent-202610 ~]$ toolbox list
IMAGE ID      IMAGE NAME                                    CREATED
4888bd2b47f9  registry.fedoraproject.org/fedora-toolbox:44  2 hours ago

CONTAINER ID  CONTAINER NAME     CREATED         STATUS   IMAGE NAME
0a25eae8b419  fedora-toolbox-44  10 minutes ago  running  registry.fedoraproject.org/fedora-toolbox:44
```

- butane 工具 (在 toolbox fedora 环境中已安装):

```sh
[kc1@arch-ai-agent-202610 ~]$ toolbox enter fedora-toolbox-44
[kc1@toolbx ~]$ butane --version
Butane 2.27.0
```

### rustup 工具

```sh
[kc1@arch-ai-agent-202610 ~]$ rustup update

  stable-x86_64-unknown-linux-gnu unchanged - rustc 1.99.1 (58cf8f9c3 2026-10-13)

info: checking for self-update (current version: 1.29.1)
info: cleaning up downloads & tmp directories
```

已安装的组件:

```sh
[kc1@arch-ai-agent-202610 ~]$ rustup component list | grep installed
cargo-x86_64-unknown-linux-gnu (installed)
clippy-x86_64-unknown-linux-gnu (installed)
llvm-bitcode-linker-x86_64-unknown-linux-gnu (installed)
llvm-tools-x86_64-unknown-linux-gnu (installed)
rust-analyzer-x86_64-unknown-linux-gnu (installed)
rust-docs-x86_64-unknown-linux-gnu (installed)
rust-src (installed)
rust-std-aarch64-unknown-linux-musl (installed)
rust-std-riscv64gc-unknown-linux-musl (installed)
rust-std-x86_64-unknown-linux-gnu (installed)
rust-std-x86_64-unknown-linux-musl (installed)
rustc-x86_64-unknown-linux-gnu (installed)
rustfmt-x86_64-unknown-linux-gnu (installed)
```

### 国内镜像

- rust (rustup/cargo) 已配置 <https://rsproxy.cn/> 镜像:

```sh
[kc1@arch-ai-agent-202610 ~]$ cat ~/.bashrc

省略

# rsproxy.cn
export RUSTUP_DIST_SERVER="https://rsproxy.cn"
export RUSTUP_UPDATE_ROOT="https://rsproxy.cn/rustup"

[kc1@arch-ai-agent-202610 ~]$ cat ~/.cargo/config.toml
[source.crates-io]
replace-with = 'rsproxy-sparse'

[source.rsproxy]
registry = "https://rsproxy.cn/crates.io-index"

[source.rsproxy-sparse]
registry = "sparse+https://rsproxy.cn/index/"

[registries.rsproxy]
index = "https://rsproxy.cn/crates.io-index"

[net]
git-fetch-with-cli = true
```

- npm/pnpm 已配置 <https://npmmirror.com/> 镜像:

```sh
[kc1@arch-ai-agent-202610 ~]$ npm config set registry https://registry.npmmirror.com
[kc1@arch-ai-agent-202610 ~]$ pnpm config set registry https://registry.npmmirror.com
```

- alpine (podman 容器) 镜像配置详见 `/home/@u/ro/qemu-alpine/Dockerfile` 文件.

- ubuntu (podman 容器) 镜像配置详见 `/home/@u/ro/randmac-ubuntu` 目录.

- podman 容器镜像: 由于网络问题, 请使用 `/home/@u/ro/podman-image/`
  目录中预先准备好的本地镜像. 否则直接通过网络拉取容器镜像, 很可能失败.

---

`2026-10-17`
