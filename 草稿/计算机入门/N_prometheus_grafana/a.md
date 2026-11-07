# 配置 prometheus (grafana) 远程监测系统

随着 物理机 / 虚拟机 等设备越来越多, 想要方便的查看各设备的运行状态.
**prometheus** (grafana) 就是一套很好的开源监测系统, 其 `node_exporter` 组件, 可以收集 物理机 / 虚拟机 等节点的系统状态.

TODO

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 107 号作品. )


## 目录

+ 1 整体技术方案

  - 1.1 主机名/用户名/端口号

+ 2 安装 node_exporter

  - 2.1 ArchLinux (x86_64, 物理机, 虚拟机)
  - 2.2 Fedora CoreOS (x86_64, 物理机, 虚拟机)
  - 2.3 Ubuntu (x86_64, 虚拟机)
  - 2.4 windows_exporter (x86_64, 物理机)

+ 3 安装 prometheus (server) 并配置

  - 3.1 `prom1` (云虚拟机, Ubuntu)
  - 3.2 SSH 安全加固
  - 3.3 `prom2` (家里 虚拟机, Fedora CoreOS)
  - 3.4 SSH 端口转发 配置

+ 4 安装 grafana 并配置

  - 4.1 家里 虚拟机 (`prom2`)
  - 4.2 手机 (Termux/Android)

+ 5 测试运行

+ 6 总结与展望

----

相关文章:

+ 《通过 云服务器 (虚拟机) 中继的 SSH 远程连接 (ArchLinux, Ubuntu, Termux/Android, openssh)》

  TODO

+ 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》

  TODO

+ 《防误删 (实时) 文件备份系统 (btrfs 快照 + rsync)》

  TODO

+ 《在 虚拟机 中运行 Kimi Code CLI (AI agent) 写代码》

  TODO

+ 《安装 gitea 代码平台 (Fedora CoreOS)》

  TODO

+ 《使用 SSH 安装 ArchLinux (cloud-init)》

  TODO

+ 《低功耗低成本 PC (可更换内存条) 推荐 (笔记本, 小主机)》

  TODO

+ 《使用 Apollo (Windows) Artemis (Android) 进行局域网屏幕串流》

  TODO

+ 《光盘 RAID: 允许丢失损坏的备份数据》

  TODO

+ 《手中有机, 心中不慌 (5 只 二手 Android 手机)》

  TODO

参考资料:

+ <https://prometheus.io/docs/introduction/overview/>
+ <https://grafana.com/>
+ <https://wiki.archlinux.org/title/Prometheus>
+ <https://wiki.archlinux.org/title/Grafana>
+ <https://prometheus.io/docs/guides/node-exporter/>
+ <https://prometheus.io/download/>
+ <https://prometheus.io/docs/concepts/data_model/>
+ <https://prometheus.io/docs/concepts/jobs_instances/>
+ <https://prometheus.io/docs/operating/security/>
+ <https://prometheus.io/docs/guides/file-sd/>
+ <https://github.com/prometheus/prometheus>
+ <https://github.com/prometheus/node_exporter>
+ <https://github.com/prometheus-community/windows_exporter>
+ <https://github.com/prometheus-community/windows_exporter/blob/main/docs/example_config.yml>
+ <https://github.com/prometheus/blackbox_exporter>
+ <https://man.archlinux.org/man/core/openssh/sshd.8.en>
+ <https://man.archlinux.org/man/core/openssh/sshd_config.5.en>


## 1 整体技术方案

TODO

### 1.1 主机名/用户名/端口号

由于在 远程监测系统 的配置过程中, 涉及到的 设备 (物理机/虚拟机) 比较多, 为了避免混乱 (头晕晕的), 本章节列出相关的完整清单.

当然, 这些都是窝的设备, 仅供参考.

----

**端口号 分配规则**: 这些是在 prom1 / prom2 主机上, 预留给 node_exporter 做 SSH 端口转发 的端口号, 按规则进行统一分配.

端口号 格式: `19abc`

其中:

+ `19` (前 2 位): 固定前缀.

+ `a` 大分类:
  - `1`: 重要基础设施 (监测系统, 局域网 DNS 服务器, 等).
  - `2`: Linux 系统.
  - `3`: Windows 系统.
  - `4`: AI agent 专用.
  - `5` (保留).
  - `6`: 数据备份 (胖喵必快 pmbs, gitea, 等).
  - `7` (保留): Android 系统 (手机, 平板, 等).
  - `9` (保留): 专用 隔离区域.

+ `b` 小分类/保留 (0).

+ `c` (最后 1 位): 奇数 虚拟机, 偶数 物理机.

----

**主机名** (hostname, 物理机 5, (本地) 虚拟机 4, 云虚拟机 1): 用于明确区分不同的主机.

+ `vm_prom1` (保留, 目前实际为 `ali_vm1`): 运行 prom1 实例.

+ `ali_vm1` (端口号 `19101`, Ubuntu): 云虚拟机.

  虚拟机配置: 2 vCPU, 2G 内存. (最低配置, 约 100 元/年)

+ `vm_prom2` (端口号 `19103`, Fedora CoreOS): 运行 prom2 实例.

  虚拟机配置: 4 vCPU, 4G 内存.

+ `vm_vfc4` (端口号 `19111`, Fedora CoreOS): 局域网 DNS 服务器.

  虚拟机配置: 4 vCPU, 4G 内存.

+ `pc_s2l` (端口号 `19202`, ArchLinux/GNOME): 主力桌面.

  硬件配置: GMK M5 小主机, CPU r7-5825u (8 核 16 线程), 64GB DDR4-3200 (双通道, 32GB x2).

+ `pc_win11` (端口号 `19302`, Windows 11): 白主机, 游戏 (原神 等) 专用.

  硬件配置: CPU i5-12600 (6 核 12 线程), 32GB DDR4-3200 (双通道, 16GB x2), A770 (16GB).

+ `pc_win10` (端口号 `19304`, Windows 10): 黑主机 (被 老公 霸占了).

  硬件配置: CPU r5-5600g (6 核 12 线程), 128GB DDR4-3200 (双通道, 32GB x4), rx9060xt (16GB).

+ `vm_arch_ai_agent` (端口号 `19401`, ArchLinux): 专用运行 AI agent (kimi code).

  虚拟机配置: 8 vCPU, 32G 内存, 200G 虚拟硬盘.

+ `pc_arch_ai_agent2` (端口号 `19402`, ArchLinux): 笔记本, 专用运行 AI agent (物理隔离).

  硬件配置: CPU r5-5625u (6 核 12 线程), 16GB DDR4-3200 (8GB x2).

<!--
+ `pc_w5` (端口号 `19502`, Windows): 笔记本.
-->

+ `vm_vfc1` (端口号 `19601`, Fedora CoreOS): (保留) 另一个 胖喵必快 文件备份服务器.

+ `vm_vfc2` (端口号 `19603`, Fedora CoreOS): 胖喵必快 (pmbs + rsync) 文件备份, gitea 服务器.

  虚拟机配置: 4 vCPU, 8G 内存.

+ `pc_bfc3` (端口号 `19610`, Fedora CoreOS): 冷备份 主机 (胖喵必快), 平时不开机.

  硬件配置: 3U 机架式 机箱, CPU i5-7500 (4 核 4 线程), 32GB DDR4-3200 (双通道, 16GB x2), 机械硬盘 (数据盘) 若干 + 光驱 (刻录机, 光盘备份).

----

**用户名** (普通 Linux 用户): 主要用于权限隔离, 减少互相影响, 提高系统稳定性.

+ `prom1` (在 vm_prom1 上): (保留) 用于运行 prom1 实例.

+ `prom2` (在 vm_prom2 上): 用于运行 prom2 实例.

+ `grafana` (在 vm_prom2 上): 用于运行 grafana 实例.

+ `client_exporter` (在 vm_prom1 / vm_prom2 上): 用于 node_exporter 的 SSH 端口转发.

+ `client_exporter_win` (在 vm_prom1 / vm_prom2 上): 用于 windows_exporter 的 SSH 端口转发.

+ `client_prom` (在 vm_prom1 / vm_prom2 上): 用于 访问 prometheus 实例 / grafana 的 SSH 端口转发.

+ `node_exporter_ssh` (在 被监测 主机上): 用于 SSH 端口转发 (连接 vm_prom1 / vm_prom2).

----

**SSH key (注释) 命名规则**: 由于涉及大量的 SSH 端口转发 配置, 会用到数十个 SSH key, 如果命名不清晰, 很容易混乱.

格式为: `目标主机-(目标用户)-{源主机-(源用户)}-日期`

比如:

```
vm_prom2-(client_exporter)-{vm_vfc4-(node_exporter_ssh)}-20261024
```

本文 (配置过程中) 用到的 SSH key (名称) 列表 (部分):

```sh
ali_vm1-(core)-{pc_s2l-(s2)}-20261025
pc_bfc3-(core)-{pc_s2l-(s2)}-20261025
vm_arch_ai_agent-(core)-{pc_s2l-(s2)}-20261025
vm_prom2-(core)-{pc_s2l-(s2)}-20261025
vm_vfc2-(core)-{pc_s2l-(s2)}-20261025
vm_vfc4-(core)-{pc_s2l-(s2)}-20261025

vm_arch_ai_agent-(kc1)-{pc_s2l-(s2)}-20261025
vm_prom2-(grafana)-{pc_s2l-(s2)}-20261025
vm_prom2-(prom2)-{pc_s2l-(s2)}-20261025

ali_vm1-(client_exporter)-{vm_prom2-(node_exporter_ssh)}-20261025
ali_vm1-(node_exporter_ssh)-{vm_prom2-(node_exporter_ssh)}-20261025

ali_vm1-(client_exporter)-{pc_bfc3-(node_exporter_ssh)}-20261025
ali_vm1-(client_exporter)-{pc_s2l-(node_exporter_ssh)}-20261025
ali_vm1-(client_exporter)-{vm_arch_ai_agent-(node_exporter_ssh)}-20261025
ali_vm1-(client_exporter)-{vm_vfc2-(node_exporter_ssh)}-20261025
ali_vm1-(client_exporter)-{vm_vfc4-(node_exporter_ssh)}-20261025

vm_prom2-(client_exporter)-{pc_bfc3-(node_exporter_ssh)}-20261025
vm_prom2-(client_exporter)-{pc_s2l-(node_exporter_ssh)}-20261025
vm_prom2-(client_exporter)-{vm_arch_ai_agent-(node_exporter_ssh)}-20261025
vm_prom2-(client_exporter)-{vm_vfc2-(node_exporter_ssh)}-20261025
vm_prom2-(client_exporter)-{vm_vfc4-(node_exporter_ssh)}-20261025
```


## 2 安装 node_exporter

node_exporter 对整机 (操作系统) 进行监测, 比如 CPU / 内存 / 磁盘 / 网络 等资源的使用情况.

### 2.1 ArchLinux (x86_64, 物理机, 虚拟机)

安装软件包:

```sh
sudo pacman -S prometheus-node-exporter
```

启动服务:

```sh
> sudo systemctl enable --now prometheus-node-exporter
Created symlink '/etc/systemd/system/multi-user.target.wants/prometheus-node-exporter.service' → '/usr/lib/systemd/system/prometheus-node-exporter.service'.
```

检查运行是否正常 (默认端口 9100):

```sh
curl -v http://localhost:9100/metrics
```

----

(可选, 推荐) 给 node_exporter 配置 CPU / 内存 使用限制:

```sh
> cat /etc/systemd/system/prometheus-node-exporter.service.d/10-cpu-mem-limit.conf
[Service]
CPUQuota=200%
MemoryMax=2G
```

使配置生效:

```sh
sudo systemctl daemon-reload
sudo systemctl restart prometheus-node-exporter
```

----

创建普通 Linux 用户:

```sh
sudo useradd -m node_exporter_ssh
```

启用 linger 并切换到新用户:

```sh
core@arch-ai-agent-202610 ~> id node_exporter_ssh
uid=1003(node_exporter_ssh) gid=1003(node_exporter_ssh) groups=1003(node_exporter_ssh)
core@arch-ai-agent-202610 ~> sudo loginctl enable-linger node_exporter_ssh
core@arch-ai-agent-202610 ~> sudo systemd-run --system --scope su -l node_exporter_ssh
Running as unit: run-p36554-i49598.scope; invocation ID: ab98fb38387b4caa9c5b9eb6a1288959
[node_exporter_ssh@arch-ai-agent-202610 ~]$ export XDG_RUNTIME_DIR=/run/user/1003
[node_exporter_ssh@arch-ai-agent-202610 ~]$ pwd
/home/node_exporter_ssh
```

### 2.2 Fedora CoreOS (x86_64, 物理机, 虚拟机)

虽然 CoreOS 推荐以 容器 方式运行软件, 但是 node_exporter 对整机进行监测, 所以直接作为系统软件安装, 是比较合适的位置.
另外, 这样也方便随系统 自动更新, 如果使用容器的话, 更新就会更麻烦.

安装软件包:

```sh
core@vfc4-202610:~$ sudo rpm-ostree install node-exporter
```

重启系统:

```sh
sudo systemctl reboot
```

重启之后:

```sh
core@vfc4-202610:~$ rpm-ostree status
State: idle
AutomaticUpdatesDriver: Zincati
  DriverState: active; periodically polling for updates (last checked Thu 2026-10-22 13:12:10 UTC)
Deployments:
● ostree-image-signed:docker://quay.io/fedora/fedora-coreos:stable
                   Digest: sha256:e9d2be2eaf3934e164fbc59d1baee15473795f5e39290ec85f78a16e98fe51b5
                  Version: 44.20260928.3.1 (2026-10-13T17:19:28Z)
          LayeredPackages: node-exporter systemd-networkd

  ostree-image-signed:docker://quay.io/fedora/fedora-coreos:stable
                   Digest: sha256:e9d2be2eaf3934e164fbc59d1baee15473795f5e39290ec85f78a16e98fe51b5
                  Version: 44.20260928.3.1 (2026-10-13T17:19:28Z)
          LayeredPackages: systemd-networkd
```

启动服务:

```sh
core@vfc4-202610:~$ sudo systemctl enable --now prometheus-node-exporter
Created symlink '/etc/systemd/system/multi-user.target.wants/prometheus-node-exporter.service' → '/usr/lib/systemd/system/prometheus-node-exporter.service'.
```

----

创建普通 Linux 用户:

```sh
sudo useradd -m node_exporter_ssh
```

切换到新用户并启用 linger:

```sh
core@vfc4-202610:~$ sudo systemd-run --system --scope su -l node_exporter_ssh
Running as unit: run-p2738-i8906.scope; invocation ID: d90d66e0e7cd47bca54ca1bc24057cd3
node_exporter_ssh@vfc4-202610:~$ id
uid=1002(node_exporter_ssh) gid=1002(node_exporter_ssh) groups=1002(node_exporter_ssh) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
node_exporter_ssh@vfc4-202610:~$ pwd
/var/home/node_exporter_ssh
node_exporter_ssh@vfc4-202610:~$ loginctl enable-linger
node_exporter_ssh@vfc4-202610:~$ loginctl list-users
 UID USER              LINGER STATE    
1000 core              no     active
1001 aghdns            yes    lingering
1002 node_exporter_ssh yes    active

3 users listed.
```

### 2.3 Ubuntu (x86_64, 虚拟机)

安装软件包:

```sh
sudo apt install prometheus-node-exporter
```

查看服务运行状态:

```sh
sudo systemctl status prometheus-node-exporter
```

----

由于 云虚拟机 只有 2 vCPU, 2G 内存, 所以给更严格的限制:

```sh
# cat /etc/systemd/system/prometheus-node-exporter.service.d/10-cpu-mem-limit.conf
[Service]
CPUQuota=50%
MemoryMax=200M
```

### 2.4 windows_exporter (x86_64, 物理机)

从此处下载:

<https://github.com/prometheus-community/windows_exporter/releases>

安装软件包, 比如: `windows_exporter-0.32.0-amd64.msi`

----

(可选, 推荐) windows_exporter 默认监听 `0.0.0.0` 地址, 所以局域网内的设备, 都可以直接抓取 windows_exporter 的监测数据.
为了增强安全, 建议进行如下配置:

文件 `C:\Program Files\windows_exporter\config.yaml`:

```yml
web:
  listen-address: "127.0.0.1:9182"
```

这样就会只监听 本机环回 地址, 就只有 本机 运行的程序, 能够抓取数据了.


## 3 安装 prometheus (server) 并配置

本章节 安装和配置 2 个 prometheus 实例.

### 3.1 `prom1` (云虚拟机, Ubuntu)

由于 云虚拟机 只有 2G 内存, 为了节省内存, 就不用 容器 (podman) 运行了, 直接安装软件包:

```sh
sudo apt install prometheus
```

查看服务运行状态:

```sh
systemctl status prometheus
```

CPU / 内存 使用限制 (避免卡死 云虚拟机):

```sh
# cat /etc/systemd/system/prometheus.service.d/10-cpu-mem-limit.conf
[Service]
CPUQuota=100%
MemoryMax=800M
```

----

创建普通 Linux 用户: `client_exporter`, `client_exporter_win`, `client_prom`, `node_exporter_ssh`, 比如:

```sh
useradd -m client_exporter
```

禁止 SSH 端口转发 专用 用户 登录:

```sh
chsh -s /usr/sbin/nologin client_exporter
chsh -s /usr/sbin/nologin client_exporter_win
```

----

TODO

### 3.2 SSH 安全加固

因为 云虚拟机 直接暴露在 公网, 所以在安全方面需要格外小心.

```sh
# cat /etc/passwd

省略

client_exporter:x:1001:1001::/home/client_exporter:/usr/sbin/nologin
client_exporter_win:x:1002:1002::/home/client_exporter_win:/usr/sbin/nologin
```

此处 `/usr/sbin/nologin` 禁止登录 (shell), 禁止通过 SSH 执行任意命令.

```sh
# cat /home/client_exporter/.ssh/authorized_keys
restrict,port-forwarding,permitopen="127.0.0.1:8080",permitlisten="127.0.0.1:19103" ssh-ed25519 AAA省略 ali_vm1-(client_exporter)-{vm_prom2-(node_exporter_ssh)}-20261025
restrict,port-forwarding,permitopen="127.0.0.1:8080",permitlisten="127.0.0.1:19111" ssh-ed25519 AAA省略 ali_vm1-(client_exporter)-{vm_vfc4-(node_exporter_ssh)}-20261025
restrict,port-forwarding,permitopen="127.0.0.1:8080",permitlisten="127.0.0.1:19202" ssh-ed25519 AAA省略 ali_vm1-(client_exporter)-{pc_s2l-(node_exporter_ssh)}-20261025
restrict,port-forwarding,permitopen="127.0.0.1:8080",permitlisten="127.0.0.1:19401" ssh-ed25519 AAA省略 ali_vm1-(client_exporter)-{vm_arch_ai_agent-(node_exporter_ssh)}-20261025
restrict,port-forwarding,permitopen="127.0.0.1:8080",permitlisten="127.0.0.1:19603" ssh-ed25519 AAA省略 ali_vm1-(client_exporter)-{vm_vfc2-(node_exporter_ssh)}-20261025
restrict,port-forwarding,permitopen="127.0.0.1:8080",permitlisten="127.0.0.1:19610" ssh-ed25519 AAA省略 ali_vm1-(client_exporter)-{pc_bfc3-(node_exporter_ssh)}-20261025
restrict,port-forwarding,permitopen="127.0.0.1:8080",permitlisten="127.0.0.1:19503" ssh-ed25519 AAA省略 ali_vm1-(client_exporter)-{vm_vfc2602w-(node_exporter_ssh)}-20261026
```

其中 `restrict,port-forwarding,permitopen="127.0.0.1:8080",permitlisten="127.0.0.1:19111"` 就限制了只能做 指定端口号 的 端口转发, 别的什么都干不了.

```sh
# cat /etc/ssh/sshd_config.d/10-client_exporter.conf
Match User client_exporter
	AllowTcpForwarding yes
	AllowAgentForwarding no
	AllowStreamLocalForwarding no
	PermitTTY no
	PermitTunnel no
	X11Forwarding no
#	ForceCommand /usr/sbin/nologin

Match User client_exporter_win
	AllowTcpForwarding yes
	AllowAgentForwarding no
	AllowStreamLocalForwarding no
	PermitTTY no
	PermitTunnel no
	X11Forwarding no
	ForceCommand /usr/sbin/nologin
```

测试配置:

```sh
sshd -t
```

使配置生效:

```sh
systemctl restart sshd
```

----

此外, 云防火墙 (不是 云虚拟机 内部的防火墙) 默认只开放 22 端口, 且只允许 SSH 公钥 登录.
所以这套配置, 默认状态下就是足够安全的.

此外, 由于最近 AI 找 安全漏洞 越来越厉害, 建议经常更新系统软件包 (`apt update && apt upgrade`), 避免使用不安全的旧版本.

----

对 安全加固 相关配置的实际测试:

```sh
node_exporter_ssh@vfc4-202610:~$ ssh ali_vm1-client_exporter
PTY allocation request failed on channel 0
Welcome to Ubuntu 26.04.1 LTS (GNU/Linux 7.0.0-31-generic x86_64)

省略

Welcome to Alibaba Cloud Elastic Compute Service !

This account is currently not available.
Connection to ali-vm1.test closed.
node_exporter_ssh@vfc4-202610:~$ 
```

尝试直接登录失败.

```sh
node_exporter_ssh@vfc4-202610:~$ ssh ali_vm1-client_exporter id
This account is currently not available.
node_exporter_ssh@vfc4-202610:~$ 
```

尝试执行任意命令失败.

```sh
node_exporter_ssh@vfc4-202610:~$ ssh -NT -L 8080:127.0.0.1:8080 ali_vm1-client_exporter

node_exporter_ssh@vfc4-202610:~$ ssh -NT -R 127.0.0.1:19111:127.0.0.1:9100 ali_vm1-client_exporter
```

转发允许的端口, 成功.

```sh
node_exporter_ssh@vfc4-202610:~$ ssh -NT -L 8080:127.0.0.1:5555 ali_vm1-client_exporter
channel 2: open failed: administratively prohibited: open failed

node_exporter_ssh@vfc4-202610:~$ ssh -NT -R 127.0.0.1:5555:127.0.0.1:9100 ali_vm1-client_exporter
Warning: remote port forwarding failed for listen port 5555
```

转发别的端口, 失败.

### 3.3 `prom2` (家里 虚拟机, Fedora CoreOS)

详见文章: 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》

安装配置文件 `prom2.bu`:

```yaml
# prom2.bu 20261025
#
# $ butane --version
# Butane 2.27.0
#
variant: fcos
version: 1.7.0
passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - ssh-ed25519 AAA省略 vm_prom2-(core)-{pc_s2l-(s2)}-20261025
    - name: prom2
      ssh_authorized_keys:
        - ssh-ed25519 AAA省略 vm_prom2-(prom2)-{pc_s2l-(s2)}-20261025
    - name: grafana
      ssh_authorized_keys:
        - ssh-ed25519 AAA省略 vm_prom2-(grafana)-{pc_s2l-(s2)}-20261025
    - name: client_exporter
    - name: client_exporter_win
    - name: client_prom
    - name: node_exporter_ssh

storage:
  filesystems:
    - device: /dev/disk/by-partlabel/root
      wipe_filesystem: true
      label: root
      format: btrfs
      mount_options:
        - compress=zstd
  files:
    - path: /etc/zincati/config.d/55-updates-strategy.toml
      contents:
        inline: |
          [updates]
          strategy = "periodic"
          [[updates.periodic.window]]
          days = [ "Tue", "Thu", "Sun" ]
          start_time = "03:00"
          length_minutes = 120

    # ip: enp0s3
    - path: /etc/systemd/network/10-enp0s3.network
      contents:
        inline: |
          [Match]
          Name=enp0s3

          [Network]
          DHCP=yes

          [Address]
          Address=192.168.31.250/24
```

启用 linger:

```sh
core@prom2:~$ loginctl list-users
 UID USER              LINGER STATE    
1000 core              no     active
1001 prom2             yes    lingering
1002 grafana           yes    lingering
1006 node_exporter_ssh yes    lingering

4 users listed.
```

----

TODO

### 3.4 SSH 端口转发 配置

特殊机器 `vm_prom2` 相关配置.

生成 SSH key:

```sh
node_exporter_ssh@prom2:~$ ssh-keygen -t ed25519 -C "ali_vm1-(client_exporter)-{vm_prom2-(node_exporter_ssh)}-20261025" -f ~/".ssh/id_ed25519-ali_vm1-(client_exporter)-{vm_prom2-(node_exporter_ssh)}-20261025"

node_exporter_ssh@prom2:~$ ssh-keygen -t ed25519 -C "ali_vm1-(node_exporter_ssh)-{vm_prom2-(node_exporter_ssh)}-20261025" -f ~/".ssh/id_ed25519-ali_vm1-(node_exporter_ssh)-{vm_prom2-(node_exporter_ssh)}-20261025"
```

特殊的 端口转发:

```sh
node_exporter_ssh@prom2:~$ cat ~/.config/systemd/user/ssh-to-ali-vm1.service
[Unit]
Description=SSH to ali_vm1

[Service]
ExecStart=/usr/bin/ssh -NT -L 19101:127.0.0.1:9100 ali_vm1-node_exporter_ssh

Restart=always
RestartSec=5

[Install]
WantedBy=default.target
node_exporter_ssh@prom2:~$ cat ~/.config/systemd/user/ssh-to-ali-vm1-9091.service
[Unit]
Description=SSH to ali_vm1 (9091)

[Service]
ExecStart=/usr/bin/ssh -NT -L 9091:127.0.0.1:9090 ali_vm1-node_exporter_ssh

Restart=always
RestartSec=5

[Install]
WantedBy=default.target
node_exporter_ssh@prom2:~$ cat ~/.config/systemd/user/ssh-from-ali-vm1-9092.service
[Unit]
Description=SSH from ali_vm1 (9092)

[Service]
ExecStart=/usr/bin/ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes \
                       -NT -R 9092:127.0.0.1:9090 ali_vm1-node_exporter_ssh

Restart=always
RestartSec=5

[Install]
```

其中 `19101` 端口转发, 是为了让 prom2 能够抓取 `ali_vm1` 的 node_exporter.
`9091` 端口转发, 是为了让 prom2 能够抓取 prom1.
`9092` 端口转发, 是为了让 prom1 能够抓取 prom2.

----

以 `vm_vfc4` 举栗, 别的机器配置类似.

生成 SSH key:

```sh
node_exporter_ssh@vfc4-202610:~$ ssh-keygen -t ed25519 -C "ali_vm1-(client_exporter)-{vm_vfc4-(node_exporter_ssh)}-20261025" -f ~/".ssh/id_ed25519-ali_vm1-(client_exporter)-{vm_vfc4-(node_exporter_ssh)}-20261025"

node_exporter_ssh@vfc4-202610:~$ ssh-keygen -t ed25519 -C "vm_prom2-(client_exporter)-{vm_vfc4-(node_exporter_ssh)}-20261025" -f ~/".ssh/id_ed25519-vm_prom2-(client_exporter)-{vm_vfc4-(node_exporter_ssh)}-20261025"
```

本地 SSH 配置:

```sh
node_exporter_ssh@vfc4-202610:~$ cat ~/.ssh/config
Host ali_vm1-client_exporter
    HostName ali-vm1.test
    User client_exporter
    IdentityFile ~/.ssh/"id_ed25519-ali_vm1-(client_exporter)-{vm_vfc4-(node_exporter_ssh)}-20261025"

Host vm_prom2-client_exporter
    HostName prom2.test
    User client_exporter
    IdentityFile ~/.ssh/"id_ed25519-vm_prom2-(client_exporter)-{vm_vfc4-(node_exporter_ssh)}-20261025"
```

systemd 服务配置:

```sh
node_exporter_ssh@vfc4-202610:~$ cat ~/.config/systemd/user/ssh-from-ali-vm1.service
[Unit]
Description=SSH from ali_vm1

[Service]
ExecStart=/usr/bin/ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes \
                       -NT -R 127.0.0.1:19111:127.0.0.1:9100 ali_vm1-client_exporter

Restart=always
RestartSec=5

[Install]
WantedBy=default.target
node_exporter_ssh@vfc4-202610:~$ cat ~/.config/systemd/user/ssh-from-prom2.service
[Unit]
Description=SSH from vm_prom2

[Service]
ExecStart=/usr/bin/ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes \
                       -NT -R 127.0.0.1:19111:127.0.0.1:9100 vm_prom2-client_exporter

Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

启动服务:

```sh
node_exporter_ssh@vfc4-202610:~$ systemctl --user daemon-reload
node_exporter_ssh@vfc4-202610:~$ systemctl --user enable --now ssh-from-ali-vm1
Created symlink '/var/home/node_exporter_ssh/.config/systemd/user/default.target.wants/ssh-from-ali-vm1.service' → '/var/home/node_exporter_ssh/.config/systemd/user/ssh-from-ali-vm1.service'.
node_exporter_ssh@vfc4-202610:~$ systemctl --user enable --now ssh-from-prom2
Created symlink '/var/home/node_exporter_ssh/.config/systemd/user/default.target.wants/ssh-from-prom2.service' → '/var/home/node_exporter_ssh/.config/systemd/user/ssh-from-prom2.service'.
```


## 4 安装 grafana 并配置

TODO

### 4.1 家里 虚拟机 (`prom2`)

TODO

### 4.2 手机 (Termux/Android)

TODO


## 5 测试运行

TODO


## 6 总结与展望

TODO
