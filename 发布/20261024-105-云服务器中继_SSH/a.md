# 通过 云服务器 (虚拟机) 中继的 SSH 远程连接 (ArchLinux, Ubuntu, Termux/Android, openssh)

今天的日期是特殊的 `1024`, 是时候来点小小的 AI 震撼了 (狗头

故事是这样的, 窝作为一枚小小的 日结临时工, 租住在偏远的 北京 六环, 每天上班路上 (单程) 就要 大约 2 小时 (公交/地铁).
那一天可是 大约 4 小时 啊 !

上文说到, 窝在 虚拟机 中安装了 kimi code, 可以在 **局域网** 控制 AI 写代码.
为了让路上的时间 更有意义, 窝决定 **远程** 操作 AI !

于是, 经过一顿简单的配置, 窝可以在下班路上用 kimi code 来编写 Linux 内核模块 了 (狗头

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 105 号作品. )


## 目录

+ 1 SSH 配置

  - 1.1 目标 虚拟机 (家里 arch-ai-agent-202610) 配置
  - 1.2 云服务器 (虚拟机 Ubuntu) 配置
  - 1.3 操作的设备 (Termux/Android 手机) 配置

+ 2 连接测试

  - 2.1 SSH 连接
  - 2.2 远程操作 Kimi Code

+ 3 总结与展望

----

相关文章:

+ 《在 虚拟机 中运行 Kimi Code CLI (AI agent) 写代码》

  TODO

+ 《使用 SSH 安装 ArchLinux (cloud-init)》

  TODO

参考资料:

+ <https://wiki.archlinux.org/title/OpenSSH>
+ <https://man.archlinux.org/man/core/openssh/ssh.1.en>
+ <https://man.archlinux.org/man/core/openssh/ssh_config.5.en>
+ <https://man.archlinux.org/man/core/openssh/sshd_config.5.en>
+ <https://man.archlinux.org/man/core/openssh/sshd.8.en>
+ <https://www.kimi.com/code/docs/kimi-code-cli/guides/remote-control.html>


## 1 SSH 配置

虽然不使用 云服务器, 直接网络打洞实现连接, 技术上也是可能的.
但是为了更稳定, 窝还是选择了通过一个 固定 IPv4 地址的 云服务器 (虚拟机) 进行中转.

于是购买了一台便宜的 阿里云 虚拟机 (约 100 元/年), 就当是买了个小玩具.

### 1.1 目标 虚拟机 (家里 arch-ai-agent-202610) 配置

详见文章: 《在 虚拟机 中运行 Kimi Code CLI (AI agent) 写代码》

最终目标是, 在外面通过 SSH 连接到这台虚拟机.

首先, 创建一个专用的 普通用户, 比如 `remote-ssh`:

```sh
core@arch-ai-agent-202610 ~> sudo useradd -m remote-ssh
```

启用 linger:

```sh
core@arch-ai-agent-202610 ~> sudo loginctl enable-linger remote-ssh
core@arch-ai-agent-202610 ~> loginctl list-users
 UID USER       LINGER STATE    
1000 core       no     active
1001 kc1        yes    lingering
1002 remote-ssh yes    lingering

3 users listed.
```

切换到新用户:

```sh
core@arch-ai-agent-202610 ~> sudo systemd-run --system --scope su -l remote-ssh
Running as unit: run-p59379-i47524.scope; invocation ID: 085b7776d98a47c6aefb15980ef5f02e
[remote-ssh@arch-ai-agent-202610 ~]$ id
uid=1002(remote-ssh) gid=1002(remote-ssh) groups=1002(remote-ssh)
[remote-ssh@arch-ai-agent-202610 ~]$ pwd
/home/remote-ssh
[remote-ssh@arch-ai-agent-202610 ~]$ export XDG_RUNTIME_DIR=/run/user/1002
[remote-ssh@arch-ai-agent-202610 ~]$ 
```

然后, 用 `ssh-keygen` 生成 SSH 密钥, 并将公钥添加到 云服务器 (在 云服务器 上执行):

```sh
echo "公钥" >> ~/.ssh/authorized_keys
```

目标 虚拟机 自己的 SSH 配置:

```sh
[remote-ssh@arch-ai-agent-202610 ~]$ cat ~/.ssh/config

Host ali-vm1-b
    HostName IP_OF_ALI_VM1
    User b
    IdentityFile ~/.ssh/id_ed25519-remote-ssh-arch-ai-agent-202610-ali-vm1-b-20261019
```

测试连接:

```sh
[remote-ssh@arch-ai-agent-202610 ~]$ ssh ali-vm1-b
Welcome to Ubuntu 26.04.1 LTS (GNU/Linux 7.0.0-31-generic x86_64)

 * Documentation:  https://docs.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Mon Oct 19 08:12:03 PM CST 2026

  System load:  0.12              Processes:             121
  Usage of /:   7.3% of 39.01GB   Users logged in:       0
  Memory usage: 18%               IPv4 address for eth0: 172.16.5.4
  Swap usage:   0%

 * Canonical Workshop gives developers fast, composable, reproducible, and
   secure developer environments that are perfect for agentic workflows.

   https://ubuntu.com/workshop

Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

1 additional security update can be applied with ESM Apps.
Learn more about enabling ESM Apps service at https://ubuntu.com/esm



Welcome to Alibaba Cloud Elastic Compute Service !

Last login: Mon Oct 19 20:12:04 2026 from 10.9.8.7
b@iZ2ze4chpunlbujzf4og27Z:~$ id
uid=1000(b) gid=1000(b) groups=1000(b),999(systemd-journal)
b@iZ2ze4chpunlbujzf4og27Z:~$ pwd
/home/b
b@iZ2ze4chpunlbujzf4og27Z:~$ free -h
               total        used        free      shared  buff/cache   available
Mem:           1.7Gi       422Mi       357Mi       1.9Mi       1.1Gi       1.3Gi
Swap:             0B          0B          0B
b@iZ2ze4chpunlbujzf4og27Z:~$ cat /etc/os-release
PRETTY_NAME="Ubuntu 26.04.1 LTS"
NAME="Ubuntu"
VERSION_ID="26.04"
VERSION="26.04.1 LTS (Resolute Raccoon)"
VERSION_CODENAME=resolute
ID=ubuntu
ID_LIKE=debian
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"
UBUNTU_CODENAME=resolute
LOGO=ubuntu-logo
b@iZ2ze4chpunlbujzf4og27Z:~$ 
```

----

配置 SSH 反向隧道:

```sh
[remote-ssh@arch-ai-agent-202610 ~]$ cat ~/.config/systemd/user/ssh-from-ali-vm1.service
[Unit]
Description=SSH from ali-vm1

[Service]
ExecStart=/usr/bin/ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes \
                       -NT -R 2022:127.0.0.1:22 ali-vm1-b

Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

启动服务:

```sh
[remote-ssh@arch-ai-agent-202610 ~]$ systemctl --user daemon-reload
[remote-ssh@arch-ai-agent-202610 ~]$ systemctl --user enable --now ssh-from-ali-vm1
Created symlink '/home/remote-ssh/.config/systemd/user/default.target.wants/ssh-from-ali-vm1.service' → '/home/remote-ssh/.config/systemd/user/ssh-from-ali-vm1.service'.
```

### 1.2 云服务器 (虚拟机 Ubuntu) 配置

啊, 好像不需要什么特别的配置.

创建一个 普通用户, 然后让 目标 虚拟机 和 操作的设备 两边都能 SSH (公钥) 登录即可.

### 1.3 操作的设备 (Termux/Android 手机) 配置

SSH 配置:

```sh
> cat ~/.ssh/config

Host ali-vm1-b
    HostName IP_OF_ALI_VM1
    User b
    IdentityFile ~/.ssh/id_ed25519-ali-vm1-b

Host kc1-arch-ai-agent-202610
    ProxyJump ali-vm1-b
    HostName 127.0.0.1
    Port 2022
    User kc1
    IdentityFile ~/.ssh/id_ed25519-kc1-termux-20261018
```


## 2 连接测试

### 2.1 SSH 连接

在 手机 (Termux) 上:

```sh
ssh kc1-arch-ai-agent-202610
```

![termux 测试 (1)](./图/21-t-1.jpg)

连接成功 !

### 2.2 远程操作 Kimi Code

kimi code 自带 远程控制 功能: <https://www.kimi.com/code/docs/kimi-code-cli/guides/remote-control.html>

可以使用 tmux 在后台运行 kimi code:

```sh
kc1@arch-ai-agent-202610 ~> tmux new -s kimi-rc -d kimi rc
kc1@arch-ai-agent-202610 ~> tmux ls
default: 1 windows (created Sun Oct 18 12:05:36 2026)
kimi-rc: 1 windows (created Mon Oct 19 12:59:55 2026)
```

查看输出:

```sh
kc1@arch-ai-agent-202610 ~> tmux capture-pane -t kimi-rc -p

省略

  QR code PNG: /home/@u/kc1/.kimi-code/rc-qrcode.png (open this if the QR above
does not scan)
  Local UI: http://127.0.0.1:58627/#token=省略 (LAN: --host)

  docs · feedback
  Logs: off (--log-level info) · Stop: Ctrl+C
  ✓ Connected to relay, waiting for remote devices…
```

扫描二维码 (打开其中的链接), 登录 kimi 账号, 就可以愉快的远程控制 kimi code 啦 ~

![kimi code](./图/22-t-2.jpg)

----

(可选, 推荐) 配置 code-server 的 CPU / 内存 限制:

```sh
[kc1@arch-ai-agent-202610 ~]$ cat ~/.config/systemd/user/code-server.service.d/10-cpu-mem-limit.conf
[Service]
CPUQuota=200%
MemoryMax=8G
```

在 操作的设备 (手机) 上运行 (10020 是 code-server 的端口号, 可配置):

```sh
ssh -NT -L 10020:127.0.0.1:10020 kc1-arch-ai-agent-202610
```

然后, 在 `localhost:10020` 就可以打开 code-server 页面, 查看代码文件啦 ~


## 3 总结与展望

虽然 kimi code 自带 远程控制, 但是如果只使用 kimi code, 是无法好好写代码的, 所以才有了本文的 SSH 远程连接.

通过 SSH 端口转发, 可以方便的在外面 (手机) 通过 code-server 查看 开发环境 (虚拟机) 中的代码文件.
同时如果 开发环境 出了什么问题, 可以方便的 SSH 连接上去, 通过命令进行处理 (比如 `kimi rc` 奔溃了, 可以用 `tmux` 重启).

最近几天使用 kimi code (远程) 编写的第一个 Linux 内核模块 (`pm-block-linux-driver`), 初版基本完成了, 功能也在虚拟机中测试通过.
在经过 人工 检查/微调 所有 代码/文档 之后, 就会发出来哦 (狗头

----

本文使用 CC-BY-SA 4.0 许可发布.
