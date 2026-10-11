# 使用 VDE 配置 虚拟机 桥接网络 (QEMU/KVM, Fedora CoreOS 44, TAP, podman, systemd-networkd)

(本文使用 AI 辅助创作)

**桥接网络** (bridge network) 是 **虚拟机** (virtual machine) 的一种网络模式, 就好像这个 虚拟机 (guest) 直接连接到其 **宿主机** (host, 物理机) 的局域网一样.
与别的网络模式 (比如 网络地址转换 NAT, 端口转发 等) 相比, 因为桥接网络直接把虚拟机 **整个** 暴露在局域网里面, 所以可以方便局域网内别的设备通过网络访问虚拟机.

如果使用 VirtualBox 虚拟机软件, 那么桥接网络的配置非常简单, 只需在虚拟机设置里面选一下即可.
但是如果使用 QEMU 虚拟机软件, 桥接网络的配置就麻烦多了.

本文在 podman 容器中运行 QEMU/KVM 虚拟机, 并通过 **VDE** (Virtual Distributed Ethernet) 和 TAP 技术, 使得普通用户 (非 root) 也能方便的使用虚拟机桥接网络.

本文涉及下列机器:

+ (1) 桌面 PC (操作系统 ArchLinux/GNOME):
  直接操作的小主机 (GMK M5, 有显示器/键盘/鼠标), 在这里通过 SSH 连接别的机器.

+ (2) 目标 物理机 (下文简称 **物理机**, 操作系统 Fedora CoreOS 44):
  PC 服务器, 无显示器 (headless).
  在此使用一个普通用户 (非 root), 在 podman 容器中运行 QEMU/KVM 虚拟机.

+ (3) 虚拟机 (Fedora CoreOS 44): 使用 桥接网络 接入局域网.

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 101 号作品. )


## 目录

+ 1 物理机 桥接网络 配置 (Fedora CoreOS 44, systemd-networkd, TAP)

+ 2 物理机 VDE 配置

+ 3 制作 QEMU 容器镜像 (podman)

+ 4 虚拟机 系统安装与网络配置 (Fedora CoreOS 44, systemd-networkd)

  - 4.1 测试运行 虚拟机
  - 4.2 系统安装与网络配置

+ 5 重启测试

+ 6 总结与展望

+ 附录 1 Fedora CoreOS 安装 DNS 服务器 (adguardhome)

+ 附录 2 物理机 Fedora CoreOS 安装配置 (butane 供参考)

+ 附录 3 主要软件版本

(图)

----

相关文章:

+ 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》

  TODO

+ 《在容器 (podman) 中运行虚拟机 (QEMU/KVM, libvirt)》

  TODO

+ 《香橙派安装 adguardhome (docker)》

  TODO

+ 《香橙派配置 VLAN (802.1q)》

  TODO

+ 《安装 Fedora CoreOS 操作系统》

  TODO

+ 《使用多用户增强服务器的安全性》

  TODO

+ 《低功耗低成本 PC (可更换内存条) 推荐 (笔记本, 小主机)》

  TODO

+ 《防误删 (实时) 文件备份系统 (btrfs 快照 + rsync)》

  TODO

参考资料:

+ <https://wiki.virtualsquare.org/#/tutorials/vdebasics>
+ <https://wiki.virtualsquare.org/#/tutorials/vde_vm>
+ <https://wiki.virtualsquare.org/#/man/man1/vde_switch.1.html>
+ <https://wiki.archlinux.org/title/Systemd-networkd>
+ <https://www.freedesktop.org/software/systemd/man/latest/systemd-networkd.html#>
+ <https://docs.fedoraproject.org/en-US/fedora-coreos/producing-ign/>
+ <https://docs.fedoraproject.org/en-US/fedora-coreos/bare-metal/>
+ <https://docs.fedoraproject.org/en-US/fedora-coreos/provisioning-qemu/>
+ <https://docs.fedoraproject.org/en-US/fedora-coreos/provisioning-virtualbox/>
+ <https://www.kernel.org/doc/html/latest/networking/tuntap.html>
+ <https://wiki.virtualsquare.org/#/>
+ <https://www.qemu.org/>
+ <https://fedoraproject.org/coreos/>
+ <https://containertoolbx.org/>
+ <https://www.virtualbox.org/>
+ <https://www.alpinelinux.org/>
+ <https://pkgs.alpinelinux.org/package/edge/community/x86_64/vde2>
+ <https://wiki.archlinux.org/title/Network_bridge>
+ <https://www.freedesktop.org/software/systemd/man/latest/systemd.netdev.html>
+ <https://www.freedesktop.org/software/systemd/man/latest/systemd.network.html>
+ <https://www.freedesktop.org/software/systemd/man/latest/systemd.unit.html>
+ <https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html>
+ <https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html>
+ <https://github.com/virtualsquare/vde-2>
+ <https://docs.podman.io/en/latest/markdown/podman-container.unit.5.html>


## 1 物理机 桥接网络 配置 (Fedora CoreOS 44, systemd-networkd, TAP)

首先, 需要有一个已经安装好 Fedora CoreOS 44 的物理机.
安装方式详见文章: 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》 (新版), 以及 《安装 Fedora CoreOS 操作系统》 《使用多用户增强服务器的安全性》 (旧版, 供参考).
也可以参考 附录 2 物理机 Fedora CoreOS 安装配置 (butane).

系统使用 `systemd-networkd` 配置网络 (`NetworkManager` 已禁用, 避免冲突), 配置文件如下:

```sh
core@bfc3-202609:~$ cd /etc/systemd/network
core@bfc3-202609:/etc/systemd/network$ ls -l

-rw-r--r--. 1 root root  30 Oct  7 00:29 20-br0.netdev
-rw-r--r--. 1 root root 121 Oct  7 01:12 20-br0.network
-rw-r--r--. 1 root root  42 Oct  7 00:34 21-enp2s0.network
-rw-r--r--. 1 root root  69 Oct  7 00:58 30-tap0.network
core@bfc3-202609:/etc/systemd/network$ cat 20-br0.netdev
[NetDev]
Name=br0
Kind=bridge
core@bfc3-202609:/etc/systemd/network$ cat 20-br0.network
[Match]
Name=br0

[Link]
RequiredForOnline=yes

[Network]
DHCP=yes
DNS=180.76.76.76

[Address]
Address=192.168.31.42/24
core@bfc3-202609:/etc/systemd/network$ cat 21-enp2s0.network 
[Match]
Name=enp2s0

[Network]
Bridge=br0
core@bfc3-202609:/etc/systemd/network$ cat 30-tap0.network
[Match]
Name=tap0

[Link]
RequiredForOnline=no

[Network]
Bridge=br0
core@bfc3-202609:/etc/systemd/network$ 
```

上述配置创建一个虚拟 交换机 (`br0`), 然后把 物理网口 (`enp2s0`) 和 TAP 设备 (`tap0`), 都连接到这个交换机.

----

应用新的网络配置:

```sh
core@bfc3-202609:~$ sudo networkctl reload
```

查看结果:

```sh
core@bfc3-202609:~$ ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host noprefixroute 
       valid_lft forever preferred_lft forever
2: enp2s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel master br0 state UP group default qlen 1000
    link/ether e0:d5:5e:fa:34:0c brd ff:ff:ff:ff:ff:ff
    altname enxe0d55efa340c
3: br0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether b2:7c:e3:43:4a:73 brd ff:ff:ff:ff:ff:ff
    inet 192.168.31.42/24 brd 192.168.31.255 scope global br0
       valid_lft forever preferred_lft forever
    inet 192.168.31.96/24 metric 1024 brd 192.168.31.255 scope global secondary dynamic br0
       valid_lft 172677sec preferred_lft 172677sec
    inet6 fe80::b07c:e3ff:fe43:4a73/64 scope link proto kernel_ll 
       valid_lft forever preferred_lft forever
```


## 2 物理机 VDE 配置

由于在 Fedora 系统上安装 `vde2` (rpm) 软件很困难, 此处选择在 podman 容器 (root 用户) 中运行 VDE.

首先, 通过 某种方式 拉取 `alpine` 基础容器镜像:

```sh
> podman images
REPOSITORY                                 TAG         IMAGE ID      CREATED        SIZE
localhost/alpine                           latest      320994c3b997  2 weeks ago    8.72 MB
```

文件 `vde2-alpine/Dockerfile`:

```Dockerfile
# vde2-alpine
FROM alpine:latest

# 国内镜像
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

RUN apk update && apk upgrade && \
    apk add vde2 && \
    apk cache clean

CMD /usr/bin/vde_switch
```

制作 vde 容器镜像:

```sh
podman build -t vde2-alpine .
```

结果:

```sh
> podman images
REPOSITORY                                 TAG         IMAGE ID      CREATED         SIZE
localhost/vde2-alpine                      latest      90137e88e616  49 seconds ago  19.3 MB
```

测试运行:

```sh
> podman run --rm vde2-alpine /usr/bin/vde_switch --version
VDE 2.3.3
Copyright 2003,...,2011 Renzo Davoli
some code from uml_switch Copyright (C) 2001, 2002 Jeff Dike and others
VDE comes with NO WARRANTY, to the extent permitted by law.
You may redistribute copies of VDE under the terms of the
GNU General Public License v2.
For more information about these matters, see the files
named COPYING.
```

----

把容器镜像复制到 物理机, 首先, 导出容器镜像:

```sh
> podman save vde2-alpine | zstd > vde2-alpine-20261007.tar.zst
> ls -l
-rw-r--r-- 1 s2 s2 9863375 10月 7日 00:01 vde2-alpine-20261007.tar.zst
```

使用 sftp 上传到 物理机:

```sh
> sftp bfc3-core
Connected to bfc3-core.
sftp> put vde2-alpine-20261007.tar.zst 
Uploading vde2-alpine-20261007.tar.zst to /var/home/core/vde2-alpine-20261007.tar.zst
vde2-alpine-20261007.tar.zst                                                       100% 9632KB  71.3MB/s   00:00
```

在 物理机 导入容器镜像:

```sh
> ssh bfc3-core

core@bfc3-202609:~$ sudo podman load < vde2-alpine-20261007.tar.zst 
```

结果:

```sh
core@bfc3-202609:~$ sudo podman images
REPOSITORY             TAG         IMAGE ID      CREATED         SIZE
localhost/vde2-alpine  latest      90137e88e616  13 minutes ago  19.3 MB
```

----

复制配置文件:

```sh
core@bfc3-202609:~$ sudo mkdir -p /etc/vde-vm1
core@bfc3-202609:~$ sudo cp /etc/group /etc/vde-vm1
core@bfc3-202609:~$ ls -alZ /etc/vde-vm1

-rw-r--r--. 1 root root unconfined_u:object_r:passwd_file_t:s0  163 Oct  7 02:56 group
```

这是因为, `vde_switch` 需要读取 `/etc/group` 文件来获取用户组信息 (对应 `-group vm1` 命令行选项), 读不到就会报错.
`vde_switch` 运行在 podman 容器中, 外部文件挂载进去需要 `-v A:B:z` 这样的选项, 其中 `z` 给文件打 SELinux 标签, 允许容器访问.
但是不能直接挂载 `/etc/group` 文件, 因为如果直接给这个文件更换 SELinux 标签, 物理机 别的系统服务就会无权限访问, 导致系统报错.
所以只能先复制一份, 然后打标签挂载进容器.

创建 systemd unit 文件:

```sh
core@bfc3-202609:~$ cat /etc/systemd/system/vde-vm1.service
[Unit]
Description=VDE tap0 bridge for vm1

After=network-online.target

[Service]
Type=exec

ExecStartPre=-podman rm vde-vm1
ExecStart=podman run --rm --name=vde-vm1 --replace --privileged -v=${RUNTIME_DIRECTORY}:/vde-vm1:z -v=/etc/vde-vm1/group:/etc/group:z --device=/dev/net/tun --userns=host --network=host vde2-alpine /usr/bin/vde_switch -nostdin -sock /vde-vm1 -mod 660 -group vm1 -tap tap0

RestartSec=2s
Restart=always

RuntimeDirectory=vde-vm1

[Install]
WantedBy=multi-user.target
```

这是通过 systemd 服务来用 podman 容器运行 `vde_switch`, 创建一个 VDE 虚拟交换机.
容器必需使用 `--privileged` (特权) 选项运行, 否则会报错, 无法打开 `tap0` 设备.

重新加载配置:

```sh
core@bfc3-202609:~$ sudo systemctl daemon-reload
```

启用服务:

```sh
core@bfc3-202609:~$ sudo systemctl enable --now vde-vm1.service
Created symlink '/etc/systemd/system/multi-user.target.wants/vde-vm1.service' → '/etc/systemd/system/vde-vm1.service'.
```

检查结果:

```sh
core@bfc3-202609:~$ bridge link
2: enp2s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 master br0 state forwarding priority 32 cost 5 
4: tap0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 master br0 state forwarding priority 32 cost 2 
core@bfc3-202609:~$ ip addr

省略

4: tap0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel master br0 state UNKNOWN group default qlen 1000
    link/ether a6:27:24:0f:c5:9a brd ff:ff:ff:ff:ff:ff
core@bfc3-202609:~$ networkctl
IDX LINK   TYPE     OPERATIONAL SETUP     
  1 lo     loopback carrier     unmanaged
  2 enp2s0 ether    enslaved    configured
  3 br0    bridge   routable    configured
  4 tap0   ether    enslaved    configured

4 links listed.
```

成功创建了 `tap0` 设备, 并连接到了 `br0` 虚拟交换机.

```sh
vm1@bfc3-202609:~$ id
uid=1002(vm1) gid=1002(vm1) groups=1002(vm1) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
vm1@bfc3-202609:~$ ls -alZ /run/vde-vm1
total 0
drwxrws---.  2 root vm1  system_u:object_r:container_file_t:s0   60 Oct  7 12:16 .
drwxr-xr-x. 46 root root system_u:object_r:var_run_t:s0        1180 Oct  7 12:16 ..
srw-rw----.  1 root vm1  system_u:object_r:container_file_t:s0    0 Oct  7 12:16 ctl
```

VDE 虚拟交换机 创建了 `/run/vde-vm1` 接口文件, 可以由普通用户 (`vm1`) 访问.
而 VDE 虚拟交换机 同时又连接了 `tap0` 设备, 所以最终实现了 桥接网络 连接到局域网.

由于需要访问 TAP 设备, VDE 软件必需以 `root` 权限运行.


## 3 制作 QEMU 容器镜像 (podman)

首先, 在 物理机 创建新用户 `vm1`:

```sh
core@bfc3-202609:~$ sudo useradd -m vm1
```

在 桌面 PC 生成新的 SSH key:

```sh
ssh-keygen -t ed25519 -C bfc3-vm1-20261007 -f ~/.ssh/id_ed25519-bfc3-vm1-20261007
```

生成的公钥:

```sh
> cat ~/.ssh/id_ed25519-bfc3-vm1-20261007.pub
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILQD5VL4gErFcMa3kBJmd+xdDRydJSsczHgNutRpSPHl bfc3-vm1-20261007
```

在 物理机 配置 SSH 公钥登录:

```sh
core@bfc3-202609:~$ sudo su vm1
vm1@bfc3-202609:/var/home/core$ cd
vm1@bfc3-202609:~$ mkdir -p .ssh
vm1@bfc3-202609:~$ echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILQD5VL4gErFcMa3kBJmd+xdDRydJSsczHgNutRpSPHl bfc3-vm1-20261007" >> ~/.ssh/authorized_keys
```

在 桌面 PC 配置 SSH 登录:

```sh
> cat ~/.ssh/config

Host bfc3-vm1
    HostName 192.168.31.42
    User vm1
    IdentityFile ~/.ssh/id_ed25519-bfc3-vm1-20261007
```

测试登录:

```sh
> ssh bfc3-vm1
Fedora CoreOS 44.20260913.3.2
Tracker: https://github.com/coreos/fedora-coreos-tracker
Discuss: https://discussion.fedoraproject.org/tag/coreos

vm1@bfc3-202609:~$ id
uid=1002(vm1) gid=1002(vm1) groups=1002(vm1) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
vm1@bfc3-202609:~$ 
```

----

文件 `qemu-alpine/Dockerfile`:

```Dockerfile
# qemu-alpine
FROM alpine:latest

# 国内镜像
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

RUN apk update && apk upgrade && \
    apk add vde2 qemu-img qemu-tools qemu-system-x86_64 socat && \
    apk cache clean

#CMD /usr/bin/qemu-system-x86_64
CMD /run-vm.sh
```

制作容器镜像并复制到 物理机 (参考章节 2 物理机 VDE 配置):

```sh
vm1@bfc3-202609:~$ podman images
REPOSITORY             TAG         IMAGE ID      CREATED             SIZE
localhost/qemu-alpine  latest      02c3383eaad4  About a minute ago  125 MB
```

测试运行:

```sh
vm1@bfc3-202609:~$ podman run --rm qemu-alpine /usr/bin/qemu-system-x86_64 --version
QEMU emulator version 11.0.3
Copyright (c) 2003-2026 Fabrice Bellard and the QEMU Project developers
```


## 4 虚拟机 系统安装与网络配置 (Fedora CoreOS 44, systemd-networkd)

这一步比较复杂, 坑比较多, 所以分成 2 步, 先测试运行, 再实际安装配置虚拟机.

### 4.1 测试运行 虚拟机

首先, 从这里:

+ <https://fedoraproject.org/coreos/download/?stream=stable>

下载 Fedora CoreOS 系统镜像:

```sh
vm1@bfc3-202609:~$ ls -l coreos-img

-r--r--r--. 1 vm1 vm1 2071724032 Oct  7 10:00 fedora-coreos-44.20260913.3.2-qemu.x86_64.qcow2
vm1@bfc3-202609:~$ sha256sum coreos-img/fedora-coreos-44.20260913.3.2-qemu.x86_64.qcow2
e932898961bde508f84f534b2aebe519e2a1bbb3ca86f21bb6493e0ce687ca7a  coreos-img/fedora-coreos-44.20260913.3.2-qemu.x86_64.qcow2
```

生成一个测试密码:

```sh
> podman run --rm -it quay.io/coreos/mkpasswd --method=yescrypt
Password: 
$y$j9T$SU5xA0.d.AcyujAYDDNaU/$t9tEl9wRW9JUYQZRSe/X3v5DjdlvQZytd5URXYsqQUB
```

写一个测试配置 `vfc-test.bu`:

```yml
# vfc-test.bu
variant: fcos
version: 1.7.0
passwd:
  users:
    - name: core
      password_hash: $y$j9T$SU5xA0.d.AcyujAYDDNaU/$t9tEl9wRW9JUYQZRSe/X3v5DjdlvQZytd5URXYsqQUB
```

使用 butane 工具生成 ign 配置 (详见 附录 3 主要软件版本):

```sh
⬢ [s2@toolbx ~]$ butane --pretty --strict vfc-test.bu > vfc-test.ign
```

复制虚拟磁盘:

```sh
vm1@bfc3-202609:~$ cp coreos-img/fedora-coreos-44.20260913.3.2-qemu.x86_64.qcow2 vm1/vm1.qcow2
vm1@bfc3-202609:~$ ls -l vm1
total 2018156
-rw-r--r--. 1 vm1 vm1        227 Oct  7 09:01 vfc-test.ign
-r--r--r--. 1 vm1 vm1 2071724032 Oct  7 12:39 vm1.qcow2
```

然后尝试运行 QEMU 虚拟机:

```sh
vm1@bfc3-202609:~$ podman run --rm -it --privileged -v=${PWD}/vm1:/vm1:z -v=/run/vde-vm1:/vde-vm1:z --device=/dev/kvm qemu-alpine /usr/bin/qemu-system-x86_64 -enable-kvm -m 2048 -cpu host -smp 2 -nographic -drive "if=virtio,file=/vm1/vm1.qcow2" -fw_cfg name=opt/com.coreos/config,file=/vm1/vfc-test.ign -nic vde,sock=/vde-vm1,mac=52:54:00:d6:46:4f
```

此处 MAC 地址 是手动随机生成 (指定) 的, 否则 QEMU 会给所有虚拟机使用相同的 MAC, 可能造成网络故障.

稍等, 用密码登录:

```sh
Fedora CoreOS 44.20260913.3.2
Kernel 7.2.5-200.fc44.x86_64 on x86_64 (ttyS0)

SSH host key: SHA256:mkt7Io3Irg5T560tLFC89L3uzXG1jCzV4JU3Um9t6FY (ECDSA)
SSH host key: SHA256:mKF1yvTXEf7EIP1ZrSXojuOK9u1vmuUaFKontbrk9gU (ED25519)
SSH host key: SHA256:qTWTFOnN+fr8VwgjtguulZUu8jflfzPJ92JUFYeGoNk (RSA)
ens3: 192.168.31.209 fe80::9610:3a72:96a5:3bf0
Ignition: ran on 2026/10/07 12:42:16 UTC (this boot)
Ignition: user-provided config was applied
No SSH authorized keys provided by Ignition or Afterburn
Ignition: ran on 2026/10/07 12:42:16 UTC (this boot)
Ignition: user-provided config was applied
Try contacting this VM's SSH server via 'ssh vsock%4294967295' from host.

MiWiFi-RA74-srv login: core
Password: 
Fedora CoreOS 44.20260913.3.2
core@MiWiFi-RA74-srv:~$ id
uid=1000(core) gid=1000(core) groups=1000(core),4(adm),10(wheel),16(sudo),190(systemd-journal) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
core@MiWiFi-RA74-srv:~$ ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host noprefixroute 
       valid_lft forever preferred_lft forever
2: ens3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 52:54:00:d6:46:4f brd ff:ff:ff:ff:ff:ff
    altname enp0s3
    altname enx525400d6464f
    inet 192.168.31.209/24 brd 192.168.31.255 scope global dynamic noprefixroute ens3
       valid_lft 172684sec preferred_lft 172684sec
    inet6 fe80::9610:3a72:96a5:3bf0/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
```

可以看到, 虚拟机已经 自动 获得了 IP 地址 (桥接网络).

```sh
> ping 192.168.31.209 -c 5
PING 192.168.31.209 (192.168.31.209) 56(84) 字节的数据。
64 字节，来自 192.168.31.209: icmp_seq=1 ttl=64 时间=1.45 毫秒
64 字节，来自 192.168.31.209: icmp_seq=2 ttl=64 时间=0.945 毫秒
64 字节，来自 192.168.31.209: icmp_seq=3 ttl=64 时间=0.923 毫秒
64 字节，来自 192.168.31.209: icmp_seq=4 ttl=64 时间=0.926 毫秒
64 字节，来自 192.168.31.209: icmp_seq=5 ttl=64 时间=0.869 毫秒

--- 192.168.31.209 ping 统计 ---
已发送 5 个包， 已接收 5 个包, 0% packet loss, time 4067ms
rtt min/avg/max/mdev = 0.869/1.022/1.451/0.215 ms
```

在 桌面 PC 可以直接 ping 通虚拟机.
桥接网络 成功, 撒花 ~~

----

坑 的说明:

(1) `vde_switch` 和 qemu 的容器, 都需要使用 `--privileged` 选项运行, 否则会报错 (没有权限).
这个是 VDE 软件要求的, 单纯运行 QEMU 虚拟机并不需要.

(2) 注意 vde_switch 的启动命令:

```sh
/usr/bin/vde_switch -nostdin -sock /vde-vm1 -mod 660 -group vm1 -tap tap0
```

以及 QEMU 启动命令:

```sh
/usr/bin/qemu-system-x86_64 省略 -nic vde,sock=/vde-vm1,mac=52:54:00:d6:46:4f
```

其中 vde sock 地址都是 `/vde-vm1`

这一点非常重要, 如果两边路径不一致, `vde_switch` 和 `vde_plug` 就会连接不上, 虚拟机就没有网.
这是通过 kimi 阅读 `vde2` 的源代码才知道的.

### 4.2 系统安装与网络配置

配置文件 `vfc4.bu`:

```yml
# vfc4.bu
variant: fcos
version: 1.7.0
passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - ssh-ed25519 TODO vfc4-core
    #- name: aghdns
storage:
  files:
    - path: /etc/zincati/config.d/55-updates-strategy.toml
      contents:
        inline: |
          # vfc4
          [updates]
          strategy = "periodic"
          [[updates.periodic.window]]
          days = [ "Tue", "Thu", "Sun" ]
          start_time = "03:00"
          length_minutes = 120

    # ip: ens3
    - path: /etc/systemd/network/10-ens3.network
      contents:
        inline: |
          [Match]
          Name=ens3

          [Network]
          DHCP=yes
          #DNS=180.76.76.76

          [Address]
          Address=192.168.31.7/24
```

记得把其中的 `TODO` 改成自己的公钥.

生成 ign 文件并复制磁盘镜像:

```sh
vm1@bfc3-202609:~$ cp coreos-img/fedora-coreos-44.20260913.3.2-qemu.x86_64.qcow2 vm1/2.qcow2
vm1@bfc3-202609:~$ ls -l vm1

-r--r--r--. 1 vm1 vm1 2071724032 Oct  7 13:15 2.qcow2
-rw-r--r--. 1 vm1 vm1       1806 Oct  7 13:14 vfc4.ign
```

----

手动启动虚拟机, 进行安装配置:

```sh
vm1@bfc3-202609:~$ podman run --rm -it --privileged -v=${PWD}/vm1:/vm1:z -v=/run/vde-vm1:/vde-vm1:z --device=/dev/kvm qemu-alpine /usr/bin/qemu-system-x86_64 -enable-kvm -m 2048 -cpu host -smp 2 -nographic -drive "if=virtio,file=/vm1/2.qcow2" -fw_cfg name=opt/com.coreos/config,file=/vm1/vfc4.ign -nic vde,sock=/vde-vm1,mac=52:54:00:d6:46:4f
```

可以直接从 桌面 PC 连接:

```sh
> ssh vfc4-core
Fedora CoreOS 44.20260913.3.2
Tracker: https://github.com/coreos/fedora-coreos-tracker
Discuss: https://discussion.fedoraproject.org/tag/coreos

core@MiWiFi-RA74-srv:~$ id
uid=1000(core) gid=1000(core) groups=1000(core),4(adm),10(wheel),16(sudo),190(systemd-journal) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
core@MiWiFi-RA74-srv:~$ rpm-ostree status
State: idle
AutomaticUpdatesDriver: Zincati
  DriverState: active; periodically polling for updates (last checked Wed 2026-10-07 13:18:54 UTC)
Deployments:
● ostree-image-signed:docker://quay.io/fedora/fedora-coreos:stable
                   Digest: sha256:4d4c4eaad27f69a71dc1ac3c8a66ad025704fee6df54403c7a6a28b675d3aa74
                  Version: 44.20260913.3.2 (2026-09-29T03:24:48Z)
core@MiWiFi-RA74-srv:~$ free -h
               total        used        free      shared  buff/cache   available
Mem:           1.9Gi       379Mi       1.3Gi       4.6Mi       340Mi       1.5Gi
Swap:             0B          0B          0B
core@MiWiFi-RA74-srv:~$ 
```

安装 systemd-networkd:

```sh
core@MiWiFi-RA74-srv:~$ sudo rpm-ostree install systemd-networkd
```

设置主机名:

```sh
core@MiWiFi-RA74-srv:~$ sudo hostnamectl hostname vfc4
```

重启:

```sh
core@MiWiFi-RA74-srv:~$ sudo systemctl reboot
```

配置服务:

```sh
core@vfc4:~$ rpm-ostree status
State: idle
AutomaticUpdatesDriver: Zincati
  DriverState: active; periodically polling for updates (last checked Wed 2026-10-07 13:31:50 UTC)
Deployments:
● ostree-image-signed:docker://quay.io/fedora/fedora-coreos:stable
                   Digest: sha256:4d4c4eaad27f69a71dc1ac3c8a66ad025704fee6df54403c7a6a28b675d3aa74
                  Version: 44.20260913.3.2 (2026-09-29T03:24:48Z)
          LayeredPackages: systemd-networkd

  ostree-image-signed:docker://quay.io/fedora/fedora-coreos:stable
                   Digest: sha256:4d4c4eaad27f69a71dc1ac3c8a66ad025704fee6df54403c7a6a28b675d3aa74
                  Version: 44.20260913.3.2 (2026-09-29T03:24:48Z)
core@vfc4:~$ sudo systemctl mask NetworkManager.service
Created symlink '/etc/systemd/system/NetworkManager.service' → '/dev/null'.
core@vfc4:~$ sudo systemctl enable systemd-networkd
Created symlink '/etc/systemd/system/dbus-org.freedesktop.network1.service' → '/usr/lib/systemd/system/systemd-networkd.service'.
Created symlink '/etc/systemd/system/multi-user.target.wants/systemd-networkd.service' → '/usr/lib/systemd/system/systemd-networkd.service'.
Created symlink '/etc/systemd/system/sockets.target.wants/systemd-networkd.socket' → '/usr/lib/systemd/system/systemd-networkd.socket'.
Created symlink '/etc/systemd/system/sockets.target.wants/systemd-networkd-varlink.socket' → '/usr/lib/systemd/system/systemd-networkd-varlink.socket'.
Created symlink '/etc/systemd/system/sockets.target.wants/systemd-networkd-resolve-hook.socket' → '/usr/lib/systemd/system/systemd-networkd-resolve-hook.socket'.
Created symlink '/etc/systemd/system/network-online.target.wants/systemd-networkd-wait-online.service' → '/usr/lib/systemd/system/systemd-networkd-wait-online.service'.
```

再次重启:

```sh
> ssh vfc4-core
Fedora CoreOS 44.20260913.3.2
Tracker: https://github.com/coreos/fedora-coreos-tracker
Discuss: https://discussion.fedoraproject.org/tag/coreos

Last login: Wed Oct  7 13:33:52 2026 from 192.168.31.4
core@vfc4:~$ ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host noprefixroute 
       valid_lft forever preferred_lft forever
2: ens3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 52:54:00:d6:46:4f brd ff:ff:ff:ff:ff:ff
    altname enp0s3
    altname enx525400d6464f
    inet 192.168.31.7/24 brd 192.168.31.255 scope global ens3
       valid_lft forever preferred_lft forever
    inet 192.168.31.210/24 metric 1024 brd 192.168.31.255 scope global secondary dynamic ens3
       valid_lft 172779sec preferred_lft 172779sec
    inet6 fe80::5054:ff:fed6:464f/64 scope link proto kernel_ll 
       valid_lft forever preferred_lft forever
```

固定 IP 配置完毕. 关机:

```sh
core@vfc4:~$ sudo systemctl poweroff
```

----

物理机 配置文件:

```sh
vm1@bfc3-202609:~$ cat vm1/run-vm1.sh
#!/bin/sh
# run-vm1.sh
set -u

# 等待 VDE 初始化
while [ ! -e /vde-vm1/ctl ]; do
  echo Waiting /vde-vm1 .. .
  sleep 1
done

MON=/run/vm1/monitor.sock
mkdir -p /run/vm1

# 启动 QEMU 虚拟机 (后台运行)
qemu-system-x86_64 \
  -enable-kvm -m 2048 -cpu host -smp 2 -nographic \
  -drive "if=virtio,file=/vm1/2.qcow2" \
  -fw_cfg name=opt/com.coreos/config,file=/vm1/vfc4.ign \
  -nic vde,sock=/vde-vm1,mac=52:54:00:d6:46:4f \
  -monitor unix:"${MON}",server,nowait &

QPID=$!

# 虚拟机 优雅关机
on_term() {
  echo system_powerdown | socat - unix-connect:${MON}
  wait ${QPID}
  exit 0
}
trap on_term TERM INT

# 虚拟机 主动关机
wait ${QPID}
exit $?
vm1@bfc3-202609:~$ cat ~/.config/containers/systemd/vm1.container
[Unit]
Description=vm1 QEMU

[Container]
Image=localhost/qemu-alpine:latest

Volume=/run/vde-vm1:/vde-vm1:z
Volume=%h/vm1:/vm1:z
Volume=%h/vm1/run-vm1.sh:/run-vm.sh:z

AddDevice=/dev/kvm

PodmanArgs=--privileged

[Service]
Restart=on-failure
TimeoutStopSec=5min

[Install]
WantedBy=default.target
```

查看生成的 systemd 服务:

```sh
vm1@bfc3-202609:~$ systemctl --user daemon-reload
vm1@bfc3-202609:~$ systemctl --user status vm1.service
```

尝试运行:

```sh
vm1@bfc3-202609:~$ systemctl --user start vm1.service
```


## 5 重启测试

启用 linger:

```sh
vm1@bfc3-202609:~$ loginctl enable-linger
vm1@bfc3-202609:~$ loginctl list-users
 UID USER LINGER STATE 
1002 vm1  yes    active

1 users listed.
```

重启 物理机.

从 桌面 PC 直接 SSH 连接 虚拟机, 成功 !

这说明, 随着 物理机 启动, 虚拟机 自动启动, 并且 桥接网络 正常.
类似的, 物理机 关机前, 虚拟机 也会自动 优雅关机.


## 6 总结与展望

本文将大量技术集成在一起, 最终实现了 QEMU 虚拟机 以 普通用户 (非 root) 权限 使用 桥接网络.
虽然单个技术都比较简单, 但是把这一大堆叠在一起, 复杂度就上去了.

本文虽然用 AI 生成了初版 (网络配置) 方案, 但问题 (坑) 很多, 实际部署测试时, 又手动修改了很多.

本文的配置虽然比较麻烦复杂, 但这是一次性的, 配置好之后, 就可以享受 桥接网络, 以及 Fedora CoreOS 开机自动启动 podman 容器中的 QEMU 虚拟机 的便利啦 ~

啊, 最近刚拔掉第 2 颗智齿, 又肿又好疼 ~


## 附录 1 Fedora CoreOS 安装 DNS 服务器 (adguardhome)

更多细节可参考文章: 《香橙派安装 adguardhome (docker)》

虚拟机通过 桥接网络 连接局域网.

首先, 通过 某种方式 拉取容器镜像:

```sh
aghdns@vfc4-202610:~$ podman images
REPOSITORY             TAG         IMAGE ID      CREATED      SIZE
localhost/adguardhome  latest      a3d077a550b9  7 weeks ago  82.4 MB
```

启用 linger:

```sh
aghdns@vfc4-202610:~$ loginctl list-users
 UID USER   LINGER STATE    
1000 core   no     active
1001 aghdns yes    lingering

2 users listed.
```

---

系统配置文件:

```sh
core@vfc4-202610:~$ cat /etc/sysctl.d/00-ip-port-53.conf
net.ipv4.ip_unprivileged_port_start=53
core@vfc4-202610:~$ cat /etc/systemd/resolved.conf.d/adguardhome.conf
[Resolve]
DNS=127.0.0.1
DNSStubListener=no
```

---

用户配置文件:

```sh
aghdns@vfc4-202610:~$ cat ~/.config/containers/systemd/agh.container
[Unit]
Description=agh DNS

[Container]
Image=localhost/adguardhome:latest

Volume=%h/agh_data/conf:/opt/adguardhome/conf:z
Volume=%h/agh_data/work:/opt/adguardhome/work:z

Network=host

[Service]
Restart=always

[Install]
WantedBy=default.target
```

创建数据目录:

```sh
aghdns@vfc4-202610:~$ mkdir -p agh_data/conf
aghdns@vfc4-202610:~$ mkdir -p agh_data/work
```

重启虚拟机.

好, 此时可以对 DNS 服务器进行配置了 !

测试 (配置之后):

```sh
> dig www.baidu.com @192.168.31.7

; <<>> DiG 9.20.29 <<>> www.baidu.com @192.168.31.7
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 63496
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 1232
;; QUESTION SECTION:
;www.baidu.com.			IN	A

;; ANSWER SECTION:
www.baidu.com.		10	IN	A	127.0.0.1

;; Query time: 1 msec
;; SERVER: 192.168.31.7#53(192.168.31.7) (UDP)
;; WHEN: Thu Oct 08 22:12:31 CST 2026
;; MSG SIZE  rcvd: 58
```

成功.

---

附:

使用 systemd 切换用户并正常启动 user session:

```sh
core@vfc4-202610:~$ sudo systemd-run --system --scope su -l aghdns
```


## 附录 2 物理机 Fedora CoreOS 安装配置 (butane 供参考)

文件 `bfc3-server.bu`:

```yml
# bfc3-server.bu
#
# https://docs.fedoraproject.org/en-US/fedora-coreos/producing-ign/
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
        - ssh-ed25519 TODO bfc3-core
    - name: b202609c
    - name: vm1
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
          # bfc3
          [updates]
          strategy = "periodic"
          [[updates.periodic.window]]
          days = [ "Tue", "Thu", "Sun" ]
          start_time = "03:00"
          length_minutes = 120

    # mount: /mnt/data/b3
    - path: /etc/systemd/system/var-mnt-data-b3.mount
      contents:
        inline: |
          [Mount]
          What=/dev/sdb1
          Where=/var/mnt/data/b3
          Type=btrfs
          Options=compress=zstd,nosuid,nodev
    - path: /etc/systemd/system/var-mnt-data-b3.automount
      contents:
        inline: |
          [Automount]
          Where=/var/mnt/data/b3
          TimeoutIdleSec=2h

          [Install]
          WantedBy=local-fs.target

    # br0
    - path: /etc/systemd/network/20-br0.netdev
      contents:
        inline: |
          [NetDev]
          Name=br0
          Kind=bridge
    - path: /etc/systemd/network/20-br0.network
      contents:
        inline: |
          [Match]
          Name=br0

          [Link]
          RequiredForOnline=yes

          [Network]
          DHCP=yes
          DNS=180.76.76.76

          [Address]
          Address=192.168.31.42/24
    # enp2s0
    - path: /etc/systemd/network/21-enp2s0.network
      contents:
        inline: |
          [Match]
          Name=enp2s0

          [Network]
          Bridge=br0
    # tap0
    - path: /etc/systemd/network/30-tap0.network
      contents:
        inline: |
          [Match]
          Name=tap0

          [Link]
          RequiredForOnline=no

          [Network]
          Bridge=br0

    # vde-vm1.service
    - path: /etc/systemd/system/vde-vm1.service
      contents:
        inline: |
          [Unit]
          Description=VDE tap0 bridge for vm1

          After=network-online.target

          [Service]
          Type=exec

          ExecStartPre=-podman rm vde-vm1
          ExecStart=podman run --rm --name=vde-vm1 --replace --privileged -v=${RUNTIME_DIRECTORY}:/vde-vm1:z -v=/etc/vde-vm1/group:/etc/group:z --device=/dev/net/tun --userns=host --network=host vde2-alpine /usr/bin/vde_switch -nostdin -sock /vde-vm1 -mod 660 -group vm1 -tap tap0

          RestartSec=2s
          Restart=always

          RuntimeDirectory=vde-vm1

          [Install]
          WantedBy=multi-user.target
```

别忘了把其中的 `TODO` 换成自己的公钥.


## 附录 3 主要软件版本

桌面 PC (ArchLinux/GNOME):

```sh
> uname -a
Linux S2LA 7.2.8-zen1-2-zen #1 ZEN SMP PREEMPT_DYNAMIC Thu, 01 Oct 2026 18:14:15 +0000 x86_64 GNU/Linux
> ssh -V
OpenSSH_10.5p1, OpenSSL 3.6.5 29 Sep 2026
> podman --version
podman version 6.1.3
> toolbox --version
toolbox version 0.3
```

创建 toolbox (fedora) 容器:

```sh
toolbox create -d fedora -r 44
```

检查结果:

```sh
> toolbox list
IMAGE ID      IMAGE NAME                                    CREATED
d788bad1c128  registry.fedoraproject.org/fedora-toolbox:44  6 hours ago

CONTAINER ID  CONTAINER NAME     CREATED             STATUS   IMAGE NAME
391094db09e6  fedora-toolbox-44  About a minute ago  created  registry.fedoraproject.org/fedora-toolbox:44
```

安装 butane:

```sh
> toolbox enter fedora-toolbox-44
⬢ [s2@toolbx ~]$ sudo dnf update

⬢ [s2@toolbx ~]$ sudo dnf install butane
```

检查结果:

```sh
⬢ [s2@toolbx ~]$ butane --version
Butane 2.27.0
```

----

目标 物理机 (Fedora CoreOS 44):

```sh
> ssh bfc3-core
Fedora CoreOS 44.20260913.3.2
Tracker: https://github.com/coreos/fedora-coreos-tracker
Discuss: https://discussion.fedoraproject.org/tag/coreos

Last login: Tue Oct  6 12:47:23 2026 from 192.168.31.22
core@bfc3-202609:~$ rpm-ostree status
State: idle
AutomaticUpdatesDriver: Zincati
  DriverState: active; periodically polling for updates (last checked Tue 2026-10-06 12:49:25 UTC)
Deployments:
● ostree-image-signed:docker://quay.io/fedora/fedora-coreos:stable
                   Digest: sha256:4d4c4eaad27f69a71dc1ac3c8a66ad025704fee6df54403c7a6a28b675d3aa74
                  Version: 44.20260913.3.2 (2026-09-29T03:24:48Z)
          LayeredPackages: systemd-networkd
            LocalPackages: pmbs-0.1.1-1.fc44.x86_64

  ostree-image-signed:docker://quay.io/fedora/fedora-coreos:stable
                   Digest: sha256:4222ad36286b40b8233e4ace5756fcdc73e22f498e4c6cc93cfe4a0e640dc27e
                  Version: 44.20260817.3.2 (2026-09-03T01:39:58Z)
          LayeredPackages: systemd-networkd
            LocalPackages: pmbs-0.1.1-1.fc44.x86_64
core@bfc3-202609:~$ uname -a
Linux bfc3-202609 7.2.5-200.fc44.x86_64 #1 SMP PREEMPT_DYNAMIC Fri Sep 11 15:11:05 UTC 2026 x86_64 GNU/Linux
core@bfc3-202609:~$ systemctl --version
systemd 259 (259.8-1.fc44)
+PAM +AUDIT +SELINUX -APPARMOR +IMA +IPE +SMACK +SECCOMP -GCRYPT +GNUTLS +OPENSSL +ACL +BLKID +CURL +ELFUTILS +FIDO2 +IDN2 -IDN +KMOD +LIBCRYPTSETUP +LIBCRYPTSETUP_PLUGINS +LIBFDISK +PCRE2 +PWQUALITY +P11KIT +QRENCODE +TPM2 +BZIP2 +LZ4 +XZ +ZLIB +ZSTD +BPF_FRAMEWORK +BTF +XKBCOMMON +UTMP +SYSVINIT +LIBARCHIVE
core@bfc3-202609:~$ podman --version
podman version 5.8.4
core@bfc3-202609:~$ toolbox --version
toolbox version 0.3
core@bfc3-202609:~$ 
```

----

QEMU 容器:

```sh
vm1@bfc3-202609:~$ podman run --rm -it qemu-alpine /bin/sh
/ # id
uid=0(root) gid=0(root) groups=0(root),1(bin),2(daemon),3(sys),4(adm),6(disk),10(wheel),11(floppy),20(dialout),26(tape),27(video)
/ # qemu-system-x86_64 --version
QEMU emulator version 11.0.3
Copyright (c) 2003-2026 Fabrice Bellard and the QEMU Project developers
/ # vde_switch --version
VDE 2.3.3
Copyright 2003,...,2011 Renzo Davoli
some code from uml_switch Copyright (C) 2001, 2002 Jeff Dike and others
VDE comes with NO WARRANTY, to the extent permitted by law.
You may redistribute copies of VDE under the terms of the
GNU General Public License v2.
For more information about these matters, see the files
named COPYING.
/ # 
```

----

本文使用 CC-BY-SA 4.0 许可发布.
