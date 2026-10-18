# 在 虚拟机 中运行 Kimi Code CLI (AI agent) 写代码

在这个飞速狂飙的时代, 人工 (手工) 写代码, 早已被称作 **"古法" 编程**.
所以, 这个 `计算机编程入门` 专栏, 也不能再继续讲怎么人工写代码了.
那必然要使用 **AI agent** (LLM) 来写代码呀 !

但是啊, AI 的可靠程度, 至今尚不能很好的解决, AI 输出的东西, 仍然属于 **不可信**, **不靠谱** 的类别.
AI agent 几乎能够 **执行任意代码**, 所以直接在 **物理机** 上安装运行, 这个 **风险** 窝不能接受 !

所以, 必须得在 **虚拟机** 中运行 AI agent, 甚至, 有条件的话, 在专用于 AI agent 的 物理机 (物理隔离) 上的 虚拟机 中.
一定要有一个更安全的方案.

经过 深度思考 .. . (???? s) (狗头) 之后, 窝发现这实际上是打造一个专门给 AI agent 使用的 **开发环境**, 然后稳稳的接住你 (狗头)

当然这个 开发环境 主要按照窝自己的习惯, 以及目标任务 (具体要做什么), 计划用于 **重型** 开发任务 (中/大型项目), 所以仅供参考.

----

主要设计:

+ (1) 安全性:

  - 隔离与权限控制: AI agent 运行在一个 **虚拟机** (比如 VirtualBox) 之中 (强隔离), 且只有 **普通用户** (非 root, 无权 sudo) 权限.
    这样 AI agent 就自然的被 虚拟机/普通用户 双重限制了.

  - 防误删与文件备份: 使用 胖喵必快 (pmbs + rsync) 方案, 在本机 (AI agent 所在的 虚拟机) 自动 创建 btrfs **快照**, 且根据配置的策略保留一段时间 (比如 7 天, 甚至 30 天), 专门防止 AI "手快" 删除/破坏 文件, 给 "慢吞吞" 的人类留下反应时间.

    btrfs 快照 由 root 持有, 所以 AI agent 的 普通用户 权限无法删除快照.

    同时使用 rsync 定期把 (通过 SSH 公钥认证) 文件复制到另一台机器 (另一台 **物理机**, 防止硬件单点故障), 进行 **备份**.
    rsync 复制使用 普通用户 权限进行, 备份服务器 (另一台 物理机) 也配置 pmbs 快照, 普通用户 无权限删除快照.
    这个方案还可以扩展, 比如使用多台备份服务器, 多重备份.

  - 最后, 你的 **额度** 会拯救你: 简单来说, 经过适当的配置, 你的那点 "额度", AI agent 在耗尽全部 "API 偷啃" 之前, 不太可能攻破这套系统 (比如 系统提权, 虚拟机逃逸 之类的) ("月薪" 只有几十块, 拼什么命啊不是 ~~ ) (狗头)

+ (2) 工具与虚拟化: 虚拟机只是限制 AI agent 的 **边界**, 却不应限制 AI agent 的 能力.

  - 虚拟机内预装丰富的开发工具: tmux, git, rust, deno, node.js/npm, pnpm, python, wasmer

  - **容器** (可安装运行别的发行版的软件包): podman (alpine, ubuntu), toolbox (fedora)

  - QEMU 虚拟机

  - 外部 gitea 代码仓库: AI agent 可以定期提交代码 (产物) 到 gitea 服务器

  虽然 AI agent 只是虚拟机里的普通用户, 但借助 容器/虚拟化, AI 可以做到很多.

+ (3) 网络加速: 不要被垃圾网络坑掉太多时间.

  - 提前下载重要的软件数据: 比如 容器镜像 (alpine), 操作系统镜像 (Fedora CoreOS), 相关 (大型) 项目的完整源代码, 等

  - 预先配置好的 国内镜像: alpine, ubuntu, rust, npm

----

注: 因为 VirtualBox 的 嵌套虚拟化 有 BUG (虚拟机 卡死), 所以下列 无法使用:

- QEMU/KVM 虚拟机 (**嵌套虚拟化**)

- 轻量 KVM 虚拟机: firecracker, cloud-hypervisor

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 104 号作品. )


## 目录

+ 1 环境配置

  - 1.1 创建 VirtualBox 虚拟机并安装 ArchLinux 操作系统
  - 1.2 安装系统软件包 (pacman)
  - 1.3 安装 AUR 软件包 (pmbs, code-server, cloud-hypervisor)
  - 1.4 创建普通用户 (kc1) 并安装所需软件 (rustup, podman, toolbox)
  - 1.5 (可选) 配置 胖喵必快 (pmbs + rsync) 文件备份
  - 1.6 (可选) 配置 code-server (web 编辑器)
  - 1.7 创建 gitea 普通用户 (kc1) 以及测试代码仓库
  - 1.8 安装 Kimi Code CLI
  - 1.9 编写环境说明文档 (给 AI 看的)

+ 2 测试运行

  - 2.1 登录 Kimi Code CLI
  - 2.2 运行 kimi web (网页界面)
  - 2.3 测试 AI agent 功能

+ 3 总结与展望

+ 附录 1 只读数据 (`/home/@u/ro/`) 相关文件

----

相关文章:

+ 《使用 SSH 安装 ArchLinux (cloud-init)》

  TODO

+ 《安装 gitea 代码平台 (Fedora CoreOS)》

  TODO

+ 《防误删 (实时) 文件备份系统 (btrfs 快照 + rsync)》

  TODO

+ 《用容器编译 VirtualBox 虚拟机软件 (ArchLinux, podman)》

  TODO

+ 《低功耗低成本 PC (可更换内存条) 推荐 (笔记本, 小主机)》

  TODO

+ 《(AI) 编写简单 AI 助手 (ds-agent)》

  TODO

+ 《(AI) 编写简单 MCP 工具 (mcp-run)》

  TODO

+ 《制造一只电子喵 (qwen2.5:0.5b 微调 LoRA 使用 llama-factory)》

  TODO

参考资料:

+ <https://github.com/MoonshotAI/kimi-code>
+ <https://www.npmjs.com/package/@moonshot-ai/kimi-code>
+ <https://wiki.archlinux.org/title/Tmux>
+ <https://wiki.archlinux.org/title/Users_and_groups>
+ <https://coder.com/docs/code-server/guide>
+ <https://coder.com/docs/code-server/install>
+ <https://mirrors.tuna.tsinghua.edu.cn/help/alpine/>
+ <https://rust-lang.org/learn/get-started/>
+ <https://docs.fedoraproject.org/en-US/fedora-coreos/provisioning-qemu/>
+ <https://wiki.archlinux.org/title/QEMU>
+ <https://containertoolbx.org/>
+ <https://podman.io/>


## 1 环境配置

本章节详细记录制作目标环境的完整过程.

### 1.1 创建 VirtualBox 虚拟机并安装 ArchLinux 操作系统

详见文章: 《使用 SSH 安装 ArchLinux (cloud-init)》

好了, 现在你已经有了一个 VirtualBox 虚拟机, 名称为 `arch-ai-agent-202610`, 配置为 32GB 内存, 8 核 CPU, 200GB 磁盘.

并且安装好了 ArchLinux 操作系统, 文件系统为 `btrfs`.
能够 SSH (公钥) 连接到虚拟机, 并以 `core` 用户 免密 sudo:

```sh
> ssh core-arch-ai-agent-202610
[core@arch-ai-agent-202610 ~]$ id
uid=1000(core) gid=1000(core) groups=1000(core),998(wheel)
[core@arch-ai-agent-202610 ~]$ pwd
/home/core
[core@arch-ai-agent-202610 ~]$ uname -a
Linux arch-ai-agent-202610 7.2.10-arch1-1 #1 SMP PREEMPT_DYNAMIC Mon, 12 Oct 2026 06:58:10 +0000 x86_64 GNU/Linux
[core@arch-ai-agent-202610 ~]$ free -h
               total        used        free      shared  buff/cache   available
Mem:            31Gi       568Mi        30Gi       696Ki       201Mi        30Gi
Swap:          4.0Gi          0B       4.0Gi
[core@arch-ai-agent-202610 ~]$ df -h
Filesystem      Size  Used Avail Use% Mounted on
dev              16G     0   16G   0% /dev
run              16G  688K   16G   1% /run
/dev/sda2       199G  1.7G  196G   1% /
tmpfs            16G     0   16G   0% /dev/shm
none            1.0M     0  1.0M   0% /run/credentials/systemd-journald.service
tmpfs            16G     0   16G   0% /tmp
/dev/sda2       199G  1.7G  196G   1% /home
/dev/sda2       199G  1.7G  196G   1% /var/cache/pacman/pkg
/dev/sda2       199G  1.7G  196G   1% /var/log
/dev/sda1      1022M   44M  979M   5% /boot
none            1.0M     0  1.0M   0% /run/credentials/getty@tty1.service
tmpfs           3.2G  4.0K  3.2G   1% /run/user/1000
[core@arch-ai-agent-202610 ~]$ sudo id
uid=0(root) gid=0(root) groups=0(root)
[core@arch-ai-agent-202610 ~]$ 
```

### 1.2 安装系统软件包 (pacman)

安装所需的系统软件包 (仅供参考):

```sh
sudo pacman -S tmux base-devel rsync \
  podman toolbox runc krun firecracker \
  qemu-base qemu-tools qemu-docs qemu-user-static qemu-user-static-binfmt \
  git deno nodejs npm pnpm python uv wasmer lld lldb \
  nushell libisoburn ffmpeg less 7zip zip unzip man \
  virtualbox-guest-utils-nox \
  noto-fonts noto-fonts-cjk noto-fonts-emoji noto-fonts-extra \
  electron chromium \
  vulkan-mesa-layers vulkan-swrast vulkan-virtio vulkan-gfxstream
```

### 1.3 安装 AUR 软件包 (pmbs, code-server, cloud-hypervisor)

安装以下 AUR 软件包: (需要自行打包, 具体可参考文档 <https://wiki.archlinux.org/title/Arch_User_Repository> )

+ <https://aur.archlinux.org/packages/pmbs-bin>
+ <https://aur.archlinux.org/packages/code-server>
+ <https://aur.archlinux.org/packages/cloud-hypervisor-bin>

验证结果:

```sh
core@arch-ai-agent-202610 ~> pmbs --version
pmbs version 0.1.1 (x86_64-unknown-linux-gnu, default)
core@arch-ai-agent-202610 ~> type code-server
code-server is /usr/bin/code-server
core@arch-ai-agent-202610 ~> cloud-hypervisor-static --version
cloud-hypervisor v53.0
Migration Protocol Versions: 0
```

### 1.4 创建普通用户 (kc1) 并安装所需软件 (rustup, podman, toolbox)

首先, 创建 btrfs subvol `/home/@u/` 用于 快照/备份:

```sh
core@arch-ai-agent-202610 ~> sudo btrfs subvol create /home/@u
Create subvolume '/home/@u'
```

然后创建新用户 `kc1`:

```sh
core@arch-ai-agent-202610 ~> sudo useradd -d /home/@u/kc1 -m kc1
```

配置新用户 SSH (公钥) 登录, 记得把其中的 公钥 换成自己的:

```sh
core@arch-ai-agent-202610 ~> sudo su kc1
[kc1@arch-ai-agent-202610 core]$ cd
[kc1@arch-ai-agent-202610 ~]$ pwd
/home/@u/kc1
[kc1@arch-ai-agent-202610 ~]$ mkdir ~/.ssh
[kc1@arch-ai-agent-202610 ~]$ chmod 700 ~/.ssh
[kc1@arch-ai-agent-202610 ~]$ echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMNR2MmC+gi0YK5hssOdW2Awjb5Z8TscZP9w9EaNAMko kc1-arch-ai-agent-20261017" >> ~/.ssh/authorized_keys
```

创建 只读数据 目录 (详见 附录 1):

```sh
core@arch-ai-agent-202610 ~> sudo mkdir /home/@u/ro
core@arch-ai-agent-202610 ~> sudo chown core:core /home/@u/ro
core@arch-ai-agent-202610 ~> ls -al /home/@u
total 0
drwxr-xr-x 1 root root 10 Oct 17 07:44 ./
drwxr-xr-x 1 root root 12 Oct 17 07:36 ../
drwx------ 1 kc1  kc1  64 Oct 17 07:41 kc1/
drwxr-xr-x 1 core core  0 Oct 17 07:44 ro/
```

----

以 `kc1` 用户登录:

```sh
> ssh kc1-arch-ai-agent-202610
[kc1@arch-ai-agent-202610 ~]$ id
uid=1001(kc1) gid=1001(kc1) groups=1001(kc1)
[kc1@arch-ai-agent-202610 ~]$ pwd
/home/@u/kc1
[kc1@arch-ai-agent-202610 ~]$ 
```

安装 rustup 并配置 国内镜像: <https://rsproxy.cn/>

```sh
[kc1@arch-ai-agent-202610 ~]$ rustup update

  stable-x86_64-unknown-linux-gnu unchanged - rustc 1.99.1 (58cf8f9c3 2026-10-13)

info: checking for self-update (current version: 1.29.1)
info: cleaning up downloads & tmp directories
```

安装 pnpm 并配置 国内镜像: <https://pnpm.io/>

```sh
[kc1@arch-ai-agent-202610 ~]$ type pnpm
pnpm is /home/@u/kc1/.local/share/pnpm/bin/pnpm
[kc1@arch-ai-agent-202610 ~]$ pnpm --version
12.14.0
```

----

并进行 podman 容器镜像, toolbox 容器, npm 国内镜像, 等 环境配置, 详见 章节 1.9.

从这些地方下载所需文件:

+ <https://www.alpinelinux.org/downloads/>
+ <https://www.alpinelinux.org/cloud/>
+ <https://fedoraproject.org/coreos/download/>

### 1.5 (可选) 配置 胖喵必快 (pmbs + rsync) 文件备份

详见文章: 《防误删 (实时) 文件备份系统 (btrfs 快照 + rsync)》

此处只给出关键配置文件:

```sh
core@arch-ai-agent-202610 ~> cat /etc/pmbs/u.toml
# u.toml
pmbs = 1

subvol = "/home/@u"  # 目标 btrfs subvol 路径 (对这个 subvol 进行快照)

# 快照保留规则 (用于自动清理)
[[keep]]
time = "1m"  # 间隔 1 分钟 (60 秒)
n = 30  # 保留 30 个 (共 30 分钟)

[[keep]]
time = "5m"  # 间隔 5 分钟 (300 秒)
n = 12  # 保留 12 个 (共 1 小时)

[[keep]]
time = "20m"  # 间隔 20 分钟 (1200 秒)
n = 9  # 保留 9 个 (共 3 小时)

[[keep]]
time = "1h"  # 间隔 1 小时 (3600 秒)
n = 48  # 保留 48 个 (共 2 天)

[[keep]]
time = "1d"  # 间隔 1 天 (86400 秒)
n = 7  # 保留 7 个 (共 7 天)
core@arch-ai-agent-202610 ~> pmbs ls /home/@u
/home/@u/.pmbs/2026/1792233210	2026-10-17T10:33:30+00:00	*latest
/home/@u/.pmbs/2026/1792233146	2026-10-17T10:32:26+00:00
/home/@u/.pmbs/2026/1792233065	2026-10-17T10:31:05+00:00
```

### 1.6 (可选) 配置 code-server (web 编辑器)

推荐使用 code-server, 方便查看 AI 写的代码.
同时, 因为 编辑器 (vscode) 完全在 浏览器 (页面) 中运行, 影响本机安全的可能很低 (相比直接在本机安装 编辑器 查看文件).

```sh
[kc1@arch-ai-agent-202610 ~]$ code-server --version
[2026-10-17T10:35:18.509Z] info  Wrote default config file to /home/@u/kc1/.config/code-server/config.yaml
4.141.0 8b41915d25547e2edd553bab03ea4cbd621f98c5 with Code 1.141.0
```

首次运行会自动生成配置文件, 以及随机密码.

```sh
[kc1@arch-ai-agent-202610 ~]$ cat ~/.config/code-server/config.yaml
bind-addr: 0.0.0.0:10020
auth: password
password: 359f1703aed0a83da7821daf
cert: false
```

需要把 `bind-addr` (监听地址) 从 `127.0.0.1` 改成 `0.0.0.0`, 以便 局域网 内访问.
其中 `password` 就是随机生成的密码了, 也可以改一下.

```sh
[kc1@arch-ai-agent-202610 ~]$ systemctl --user enable --now code-server
Created symlink '/home/@u/kc1/.config/systemd/user/default.target.wants/code-server.service' → '/usr/lib/systemd/user/code-server.service'.
```

启动服务.

![code-server (1)](./图/16-c-1.png)

输入密码.

![code-server (2)](./图/16-c-2.png)

然后就能方便的查看 虚拟机 中的文件啦 ~

### 1.7 创建 gitea 普通用户 (kc1) 以及测试代码仓库

详见文章: 《安装 gitea 代码平台 (Fedora CoreOS)》

![gitea 配置 (1)](./图/17-g-1.png)

创建新用户 `kc1`.

![gitea 配置 (2)](./图/17-g-2.png)

创建测试代码仓库 `test-2`.

![gitea 配置 (3)](./图/17-g-3.png)

添加 `kc1` 为仓库 协作者.

![gitea 配置 (4)](./图/17-g-4.png)

设置 分支保护: `main` 分支禁止 强制推送.

![gitea 配置 (5)](./图/17-g-5.png)

添加 `kc1` 的 SSH 公钥.

----

虚拟机 中 `kc1` 的 SSH 配置:

```sh
[kc1@arch-ai-agent-202610 ~]$ cat ~/.ssh/config
Host local_gitea
    HostName vfc2.test
    User git
    IdentityFile ~/.ssh/id_ed25519-kc1-local-gitea-20261017
```

测试连接:

```sh
[kc1@arch-ai-agent-202610 ~]$ ssh -T git@local_gitea
Hi there, kc1! You've successfully authenticated with the SSH key named kc1-local-gitea-20261017.
Gitea does not provide shell access. If this is unexpected, please setup Gitea under another SSH user or use container to deploy.
```

成功 !

### 1.8 安装 Kimi Code CLI

按照此处的说明进行安装: <https://www.kimi.com/code/docs/kimi-code-cli/guides/getting-started.html>

验证安装:

```sh
[kc1@arch-ai-agent-202610 ~]$ type kimi
kimi is /home/@u/kc1/.kimi-code/bin/kimi
[kc1@arch-ai-agent-202610 ~]$ kimi --version
2.2.0
```

### 1.9 编写环境说明文档 (给 AI 看的)

(本章节的内容仅供参考)

编写给 AI 看的 开发环境 说明文档, 比如:

+ 文件 `/home/@u/ro/README.md`:

``````md
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
``````

+ 文件 `/home/@u/kc1/dev-vm/README.md`:

``````md
# 开发环境 (虚拟机) 说明

AI agent 可以按需修改本文件.

每次 AI agent 开始工作时, 都会优先读取此文件 (在给 AI agent
的提示词里面会这样写), 所以此文件也可以写一些重要且简短的注意事项, 以方便 AI
agent 工作.

此目录 (`~/dev-vm/`) 只存放关于 开发环境 的文档.

当前用户 主目录 位于:

```sh
[kc1@arch-ai-agent-202610 ~]$ id
uid=1001(kc1) gid=1001(kc1) groups=1001(kc1)
[kc1@arch-ai-agent-202610 ~]$ pwd
/home/@u/kc1
[kc1@arch-ai-agent-202610 ~]$ echo $HOME
/home/@u/kc1
```

## 专用虚拟机

本虚拟机 (VirtualBox) 是专门为 AI agent 准备的, 用来让 AI agent 干活的 (只用于
AI agent). 由于 虚拟机 已经进行了很强的安全隔离, 所以 AI agent 请放心操作,
除非发生 虚拟机逃逸 等特殊情况, 应该不会造成太大危害.

AI agent 只作为 普通 Linux 用户 运行, 所以权限受限. root 权限只有 (人类) 管理员
有, 用来维护系统.

所以 AI agent 不能安装新的系统软件包. 关于已经安装的软件包,
以及预先提供的只读数据, 详见: **只读数据 (开发环境) 说明**
`/home/@u/ro/README.md`

## 外部 git 服务器

在本地 局域网 有一台 gitea 服务器 (另一台机器), 开发环境 (AI agent 运行的 Linux
用户) 已经配置好了 SSH 连接, 可以直接推送 git 提交.

```sh
[kc1@arch-ai-agent-202610 ~]$ ssh -T git@local_gitea
Hi there, kc1! You've successfully authenticated with the SSH key named kc1-local-gitea-20261017.
Gitea does not provide shell access. If this is unexpected, please setup Gitea under another SSH user or use container to deploy.
```

TODO AI agent 可按需补充更多内容

---

`2026-10-17`
``````


## 2 测试运行

好, 一切准备完毕, 可以开始实际测试了.

### 2.1 登录 Kimi Code CLI

启动 Kimi Code, 并登录自己的账号:

```sh
kimi
```

### 2.2 运行 kimi web (网页界面)

```sh
kimi web --host
```

![kimi web (1)](./图/22-k-1.png)

会显示 局域网 访问需要的 token (令牌).

使用以下命令 重新生成 认证令牌:

```sh
kimi web rotate-token
```

如果 令牌 不小心 泄露 了, 记得重新生成哦 ~

----

在 浏览器 中打开链接:

![kimi web (2)](./图/22-k-2.png)

经过简单的初始设置.

![kimi web (3)](./图/22-k-3.png)

就能愉快的在 局域网 设备上使用 网页版 Kimi Code 啦 ~

### 2.3 测试 AI agent 功能

接下来运行一个实际的测试任务, 提示词为:

```
对 开发环境 进行检查/测试, 重要 说明文档 位于 `/home/@u/kc1/dev-vm/README.md` (优先阅读)

测试 git 仓库 位于: `/home/@u/kc1/test-2`

本次测试重点:

(1) rust 编译工具 能否正常工作

(2) podman 容器 能否正常工作

(3) 测试仓库提交代码并 push 是否正常

(4) QEMU 虚拟机 能否正常工作, 特别是在 后台 运行虚拟机, 然后 交互式 操作.
```

![测试 (1)](./图/23-k-1.png)

![测试 (2)](./图/23-k-2.png)

结果如下 (kimi 输出):

----

检查完成，**4 项重点测试全部通过**，未发现遗留故障。

1. **Rust 编译工具：通过**
   - `rustc 1.99.1`、`cargo 1.99.1`，stable 工具链。
   - 临时 Cargo 项目编译、链接及运行成功，输出 `Hello, world!`。
   - `cargo test`、rustfmt、Clippy（警告视为错误）均通过。

2. **Podman 容器：通过**
   - Podman `6.1.4`。
   - 使用本地 Alpine `3.24.2` 镜像成功启动容器。
   - 容器内命令执行、系统信息读取和文件写入均正常。

3. **Git 提交与 push：通过**
   - SSH fetch、commit、push 均成功。
   - 在 `/home/@u/kc1/test-2/README.md` 添加了测试记录。
   - 提交：`ec10aefb8231b27fa2e29383fb5c527e54146914`
   - 提交信息：`Test development environment git push`
   - 已推送至 `origin/main`，重新 fetch 后确认本地与远端哈希一致，工作区干净。

4. **QEMU 后台运行与交互：通过**
   - QEMU `11.1.2`，使用文档推荐的 Alpine ISO。
   - 通过 tmux 会话 `qemu-env-check` 在后台启动。
   - 成功等待串口登录提示，以 root 登录并交互执行 `id`、`uname`、系统信息读取和文件写入。
   - 最后通过虚拟机内 `poweroff` 正常退出，后台会话已清理。

临时 Rust 项目、Podman 测试容器和 QEMU 会话均已清理；测试仓库保留上述已推送的验证提交。QEMU 当前采用软件模拟，速度相对较慢，但后台运行和交互功能正常。


## 3 总结与展望

本文展示了 隔离虚拟机 (给 AI agent 使用的 开发环境) 的完整制作过程.
当然这些都 仅供参考, 因为这里面有很多窝自己的个人喜好.

AI agent 在虚拟机中以 普通用户 权限运行, 所以想要破坏 物理机, 难度很大: (1) 在虚拟机中从 普通用户 (通过 安全漏洞) 提权到 root. (2) 通过 漏洞 实现 虚拟机逃逸.
所以这是一套很强的隔离技术.

开发环境 预先安装了丰富的开发工具, 并提前下载了所需的软件数据, 避免网络问题.
通过 胖喵必快 (pmbs + rsync) 系统, 不仅在 虚拟机本机 创建 防误删 btrfs 快照, 还通过 rsync 备份文件到 局域网 的另一台机器上, 从而避免硬件的单点故障.
局域网 同时还有 gitea 服务器, 方便 AI agent 提交代码.

通过 code-server 和 kimi web, 能够在局域网内, 方便的通过 浏览器 (网页界面) 查看 虚拟机 内的文件, 以及操作 Kimi Code.

在实际的测试任务中, AI agent 能够使用多种开发工具, 完成许多开发任务, 比如 编译代码, 运行容器, 提交代码 等.
特别的, AI agent 通过使用 `tmux` 软件, 可以进行 交互式 操作, 比如 登录 QEMU 虚拟机 里的 Linux 系统, 并运行命令.

----

本次测试还有以下明显问题, 留待以后解决:

(1) VirtualBox 的 嵌套虚拟化 有 BUG, 功能开启后无法正常使用, 虚拟机 尝试使用时, 会卡死, 所以最后只能关闭.

考虑尝试 QEMU/KVM 的 嵌套虚拟化, 或者尝试别的硬件.

(2) 虽然 AI agent 的 运行环境 使用 虚拟机 进行了隔离, 但 网络 没有被隔离, 目前 AI agent 能够直接访问 本地 局域网, 存在一定的安全风险.

考虑使用 防火墙 等技术, 对 AI agent 的 网络 也进行隔离, 从而更安全.

(3) 虚拟机 虽然是强隔离, 但仍然有局限性 (安全程度有限).

考虑在 专用 物理机 上运行 AI agent (物理隔离).

(4) 本文中的 开发环境 是 手工 搭建的, 比较耗时/麻烦.

考虑编写 自动化脚本, 实现 "一键" 搭建 开发环境.
或者使用 虚拟机 的 快照/导出 功能, 如果环境弄坏了, 可以一键恢复.


## 附录 1 只读数据 (`/home/@u/ro/`) 相关文件

+ 文件列表:

```sh
[kc1@arch-ai-agent-202610 ro]$ pwd
/home/@u/ro
[kc1@arch-ai-agent-202610 ro]$ find .
.
./.git

省略

./.git/index
./.gitignore
./deno.json
./qemu-alpine
./qemu-alpine/Dockerfile
./randmac-ubuntu
./randmac-ubuntu/Dockerfile
./randmac-ubuntu/ubuntu.sources
./README.md
./vm-sys-img
./vm-sys-img/alpine-3.24.2-x86_64-cloudinit-r2.qcow2
./vm-sys-img/alpine-3.24.2-x86_64-cloudinit-r2.qcow2.sha512
./vm-sys-img/alpine-virt-3.24.2-x86_64.iso
./vm-sys-img/alpine-virt-3.24.2-x86_64.iso.sha256
./vm-sys-img/fedora-coreos-44.20260928.3.1-qemu.x86_64.qcow2.xz
./podman-image
./podman-image/ubuntu-20261017.tar.zst
./podman-image/archlinux-20261017.tar.zst
./podman-image/alpine-20261017.tar.zst
```

+ 文件 `.gitignore`:

```
*.zst
*.xz
*.gz

*.iso
*.qcow2
```

+ 文件 `qemu-alpine/Dockerfile`:

```Dockerfile
# qemu-alpine
FROM alpine:latest

# 国内镜像
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

RUN apk update && apk upgrade && \
    apk add qemu-img qemu-tools qemu-system-x86_64 socat && \
    apk cache clean

#CMD /usr/bin/qemu-system-x86_64
CMD /bin/ash
```

+ 文件 `randmac-ubuntu/Dockerfile`:

```Dockerfile
# randmac-ubuntu
FROM ubuntu:latest

# mirror
COPY ubuntu.sources /etc/apt/sources.list.d/ubuntu.sources
# fix https ERROR
RUN echo 'Acquire::https::mirrors.tuna.tsinghua.edu.cn::Verify-Peer "false";' > /etc/apt/apt.conf.d/99-fix-https-err

RUN apt update && apt upgrade -y && apt install -y randmac

CMD randmac -q
```

+ 文件 `randmac-ubuntu/ubuntu.sources`:

```sh
# https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu/

Types: deb
URIs: https://mirrors.tuna.tsinghua.edu.cn/ubuntu
Suites: resolute resolute-updates resolute-backports
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

# 默认注释了源码镜像以提高 apt update 速度，如有需要可自行取消注释
# Types: deb-src
# URIs: https://mirrors.tuna.tsinghua.edu.cn/ubuntu
# Suites: resolute resolute-updates resolute-backports
# Components: main restricted universe multiverse
# Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

# 以下安全更新软件源为镜像站配置
Types: deb
URIs: https://mirrors.tuna.tsinghua.edu.cn/ubuntu
Suites: resolute-security
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

# Types: deb-src
# URIs: https://mirrors.tuna.tsinghua.edu.cn/ubuntu
# Suites: resolute-security
# Components: main restricted universe multiverse
# Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

# 预发布软件源，不建议启用

# Types: deb
# URIs: https://mirrors.tuna.tsinghua.edu.cn/ubuntu
# Suites: resolute-proposed
# Components: main restricted universe multiverse
# Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

# # Types: deb-src
# # URIs: https://mirrors.tuna.tsinghua.edu.cn/ubuntu
# # Suites: resolute-proposed
# # Components: main restricted universe multiverse
# # Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
```

----

本文使用 CC-BY-SA 4.0 许可发布.
