# 使用多用户增强服务器的安全性

Fedora CoreOS 操作系统 (简称 fcos) 的主要设计目标,
是大规模服务器集群 (几十台甚至数百台).
对于窝等穷人这种只有一台主机 (或者两三台) 的情况,
还是需要稍稍改造 (配置) 一下, 才能比较舒服的使用.

比如, 默认 SSH 登录使用 `core` 用户,
这个用户可以无需密码使用 `sudo` (获取 root 权限),
适合用来进行系统管理 (比如添加新的硬盘).
但是如果日常使用的话, 就不太合适了, 风险较大 (无密码 sudo).

所以, 窝决定创建一些普通用户 (无权 sudo), 用于日常使用 (比如运行应用).
如果需要多人共享同一台服务器的情况, 也能使用各自的用户登录, 互不影响.
(注意: Linux 的多用户机制能够提供的安全能力有限,
所以请不要把用户信息告诉不认识的陌生人, 不要轻易让别人使用服务器.
如果对方乱搞, 确保能够线下找到对方, 进行输出. )

----

相关文章:

+ 《安装 Fedora CoreOS 操作系统》

  TODO

+ 《逻辑卷管理器 (LVM) 简介》

  TODO


## 目录

+ 1 安装系统的配置文件

+ 2 额外配置 (可选)

  - 2.1 根分区换成 btrfs 文件系统
  - 2.2 开机自动挂载数据盘 (systemd automount)
  - 2.3 配置固定 IP 地址 (systemd-networkd)

+ 3 测试普通用户

  - 3.1 开机自动运行容器
  - 3.2 修复 systemd --user network-online.target
  - 3.3 配置数据盘用户目录

+ 4 总结与展望


## 1 安装系统的配置文件

按照文章 《安装 Fedora CoreOS 操作系统》 里的方法重新安装系统.
fcos 安装系统非常方便快速, 一条命令, 几分钟, 即可.

这是使用的 `fc-server.bu` 文件的内容:

```yaml
variant: fcos
version: 1.5.0
passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICHaotVMdOfQrHe4bEYtjAuzQr3LdIqYlDu0sgcKLXHD fc-server-202406
    - name: pmlz
    - name: fc-test
      ssh_authorized_keys:
        - ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHCyRg9UBu1C3OH37Lke5xwSpiTPWKlUIg+wj3S6h1MR fc-server-test-202406
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

    # mount: /mnt/data/d1
    - path: /etc/systemd/system/var-mnt-data-d1.mount
      contents:
        inline: |
          [Mount]
          What=/dev/d202406a/d202406a1
          Where=/var/mnt/data/d1
          Type=btrfs
          Options=compress=zstd,nosuid,nodev
    - path: /etc/systemd/system/var-mnt-data-d1.automount
      contents:
        inline: |
          [Automount]
          Where=/var/mnt/data/d1
          TimeoutIdleSec=2h

          [Install]
          WantedBy=local-fs.target
    # mount: /mnt/data/d2
    - path: /etc/systemd/system/var-mnt-data-d2.mount
      contents:
        inline: |
          [Mount]
          What=/dev/d202406b/d202406b1
          Where=/var/mnt/data/d2
          Type=btrfs
          Options=compress=zstd,nosuid,nodev
    - path: /etc/systemd/system/var-mnt-data-d2.automount
      contents:
        inline: |
          [Automount]
          Where=/var/mnt/data/d2
          TimeoutIdleSec=2h

          [Install]
          WantedBy=local-fs.target

    # ip: eno1
    - path: /etc/systemd/network/10-eno1.network
      contents:
        inline: |
          [Match]
          Name=eno1

          [Network]
          DHCP=yes

          [Address]
          Address=192.168.31.2/24

    # network-online.target for systemd --user
    - path: /etc/systemd/user/network-online.target
      contents:
        inline: |
          [Unit]
          Description=Network online for systemd --user
          Documentation=man:systemd.special(7)
          Documentation=https://systemd.io/NETWORK_ONLINE
          #After=network.target
    - path: /etc/systemd/user/systemd-networkd-wait-online.service
      contents:
        inline: |
          [Unit]
          Description=Wait network online for systemd --user
          Documentation=man:systemd-networkd-wait-online.service(8)
          Before=network-online.target

          [Service]
          Type=oneshot
          ExecStart=/usr/lib/systemd/systemd-networkd-wait-online
          RemainAfterExit=yes

          [Install]
          WantedBy=network-online.target
```

下面简单解释一下这个配置文件:

+ (1) 添加用户.

  ```yaml
  passwd:
    users:
      - name: fc-test
        ssh_authorized_keys:
  ```

  此处添加了一个普通用户 `fc-test`, 并使用了新生成的 SSH 公钥.
  为了系统安全, 不同的用户应该使用不同的密钥进行登录.

  参考资料: <https://docs.fedoraproject.org/en-US/fedora-coreos/authentication/>

+ (2) 配置根分区的文件系统.

  ```yaml
  storage:
    filesystems:
      - device: /dev/disk/by-partlabel/root
        wipe_filesystem: true
        label: root
        format: btrfs
        mount_options:
          - compress=zstd
  ```

  此处指定根分区使用 `btrfs` 文件系统进行格式化, 并启用 `zstd` 数据压缩.

  参考资料: <https://docs.fedoraproject.org/en-US/fedora-coreos/storage/> <https://coreos.github.io/butane/config-fcos-v1_5/>

+ (3) 写入配置文件.

  ```yaml
  storage:
    files:
  ```

  此处添加一些配置文件, `path` 指定文件路径, `contents` 指定文件内容.
  后面再详细解释这些配置文件.

  参考资料: <https://docs.fedoraproject.org/en-US/fedora-coreos/managing-files/>

----

安装系统之后, 修改本机的 SSH 配置如下 (用来连接服务器):

```sh
> cat ~/.ssh/config
Host fc-server-core
    HostName fc-server.test
    User core
    IdentityFile ~/.ssh/id_ed25519-fc-server-202406

Host fc-server
    HostName fc-server.test
    User fc-test
    IdentityFile ~/.ssh/id_ed25519-fc-server-test-202406
```

其中 `fc-server.test` 是服务器的 IP 地址,
`IdentityFile` 指定用户对应的私钥文件.


## 2 额外配置 (可选)

此处的配置是可选的, 与本文的主题关系不大.
只是窝顺便想使用一些功能. 读者可以跳过这一部分.

### 2.1 根分区换成 btrfs 文件系统

fcos 在默认情况下, 根分区 (root) 的文件系统是 `xfs`.

窝对使用 `xfs` 没有什么经验, 平时窝都是使用 `btrfs`.
并且数据盘已经使用了 btrfs, 如果系统盘使用 xfs,
那么就会同时使用两种文件系统, 这可能会增加维护过程中的麻烦,
所以直接都使用 btrfs 好了.

使用 SSH 连接服务器, 并查看一些基本的系统信息:

```sh
> ssh fc-server-core
Fedora CoreOS 40.20240602.3.0
Tracker: https://github.com/coreos/fedora-coreos-tracker
Discuss: https://discussion.fedoraproject.org/tag/coreos

core@MiWiFi-RA74-srv:~$ id
uid=1000(core) gid=1000(core) groups=1000(core),4(adm),10(wheel),16(sudo),190(systemd-journal) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
core@MiWiFi-RA74-srv:~$ free -h
               total        used        free      shared  buff/cache   available
Mem:            31Gi       721Mi        30Gi       9.3Mi       286Mi        30Gi
Swap:             0B          0B          0B
core@MiWiFi-RA74-srv:~$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p4  477G  1.4G  475G   1% /sysroot
devtmpfs        4.0M     0  4.0M   0% /dev
tmpfs            16G     0   16G   0% /dev/shm
efivarfs        120K   83K   33K  72% /sys/firmware/efi/efivars
tmpfs           6.3G  9.3M  6.3G   1% /run
tmpfs            16G     0   16G   0% /tmp
/dev/nvme0n1p3  350M  112M  216M  35% /boot
tmpfs           3.2G  4.0K  3.2G   1% /run/user/1000
```

刚刚安装好系统, 根分区只使用了 1.4GB 存储空间.
所以 btrfs 相比 xfs 能够节省一些存储空间, 还是有明显好处的 !

使用 `mount` 命令查看挂载的详细信息 (省略部分结果):

```sh
core@MiWiFi-RA74-srv:~$ mount
/dev/nvme0n1p4 on /sysroot type btrfs (ro,relatime,seclabel,compress=zstd:3,ssd,discard=async,space_cache=v2,subvolid=5,subvol=/)
/dev/nvme0n1p4 on / type btrfs (rw,relatime,seclabel,compress=zstd:3,ssd,discard=async,space_cache=v2,subvolid=5,subvol=/)
/dev/nvme0n1p4 on /etc type btrfs (rw,relatime,seclabel,compress=zstd:3,ssd,discard=async,space_cache=v2,subvolid=5,subvol=/)
/dev/nvme0n1p4 on /usr type btrfs (ro,relatime,seclabel,compress=zstd:3,ssd,discard=async,space_cache=v2,subvolid=5,subvol=/)
/dev/nvme0n1p4 on /sysroot/ostree/deploy/fedora-coreos/var type btrfs (rw,relatime,seclabel,compress=zstd:3,ssd,discard=async,space_cache=v2,subvolid=5,subvol=/)

/dev/nvme0n1p4 on /var type btrfs (rw,relatime,seclabel,compress=zstd:3,ssd,discard=async,space_cache=v2,subvolid=5,subvol=/)
```

此处确认已经开启了文件数据压缩 (`compress=zstd:3`),
并开启了针对 SSD (闪存) 的优化 (`ssd`).

开启文件系统压缩还有一个明显的好处: 可以通过减少写入数据量,
延长 SSD 的使用寿命.
毕竟现在的高多层闪存都挺娇贵的, 写个几百遍就完了.
(除了超贵的企业级存储器, 但是吧, 请看咱的网名 ~~)
所以窝觉得使用 btrfs 还是有明显好处的.

### 2.2 开机自动挂载数据盘 (systemd automount)

详见文章 《逻辑卷管理器 (LVM) 简介》.

配置文件:

```sh
fc-test@MiWiFi-RA74-srv:~$ cat /etc/systemd/system/var-mnt-data-d1.mount
[Mount]
What=/dev/d202406a/d202406a1
Where=/var/mnt/data/d1
Type=btrfs
Options=compress=zstd,nosuid,nodev
fc-test@MiWiFi-RA74-srv:~$ cat /etc/systemd/system/var-mnt-data-d1.automount
[Automount]
Where=/var/mnt/data/d1
TimeoutIdleSec=2h

[Install]
WantedBy=local-fs.target
fc-test@MiWiFi-RA74-srv:~$ 
```

其中 `.mount` 配置实际挂载: `What` 指定块设备, `Where` 指定挂载点,
`Type` 指定文件系统, `Options` 指定挂载选项.

`.automount` 配置自动挂载, 需要与相应的 `.mount` 对应.
`TimeoutIdleSec` 指定空闲多久后自动卸载.

参考资料: <https://www.man7.org/linux/man-pages/man5/systemd.mount.5.html> <https://www.man7.org/linux/man-pages/man5/systemd.automount.5.html>

虽然配置文件在安装系统时已经写好了, 但是默认并未启用:

```sh
core@MiWiFi-RA74-srv:~$ systemctl status var-mnt-data-d1.automount
○ var-mnt-data-d1.automount
     Loaded: loaded (/etc/systemd/system/var-mnt-data-d1.automount; disabled; preset: disabled)
     Active: inactive (dead)
   Triggers: ● var-mnt-data-d1.mount
      Where: /var/mnt/data/d1
core@MiWiFi-RA74-srv:~$ systemctl status var-mnt-data-d1.mount
○ var-mnt-data-d1.mount - /var/mnt/data/d1
     Loaded: loaded (/etc/systemd/system/var-mnt-data-d1.mount; static)
     Active: inactive (dead)
      Where: /var/mnt/data/d1
       What: /dev/d202406a/d202406a1
```

使用 `systemctl enable` 命令启用:

```sh
core@MiWiFi-RA74-srv:~$ sudo systemctl enable var-mnt-data-d1.automount
Created symlink /etc/systemd/system/local-fs.target.wants/var-mnt-data-d1.automount → /etc/systemd/system/var-mnt-data-d1.automount.
core@MiWiFi-RA74-srv:~$ sudo systemctl enable var-mnt-data-d2.automount
Created symlink /etc/systemd/system/local-fs.target.wants/var-mnt-data-d2.automount → /etc/systemd/system/var-mnt-data-d2.automount.
core@MiWiFi-RA74-srv:~$ sync
core@MiWiFi-RA74-srv:~$ sudo reboot

Broadcast message from root@localhost on pts/1 (Thu 2024-06-20 02:27:06 UTC):

The system will reboot now!

core@MiWiFi-RA74-srv:~$ Connection to fc-server.test closed by remote host.
Connection to fc-server.test closed.
```

重启之后查看存储信息:

```sh
core@MiWiFi-RA74-srv:~$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p4  477G  1.5G  475G   1% /sysroot
devtmpfs        4.0M     0  4.0M   0% /dev
tmpfs            16G     0   16G   0% /dev/shm
efivarfs        120K   83K   33K  72% /sys/firmware/efi/efivars
tmpfs           6.3G  9.3M  6.3G   1% /run
tmpfs            16G     0   16G   0% /tmp
/dev/nvme0n1p3  350M  112M  216M  35% /boot
tmpfs           3.2G  4.0K  3.2G   1% /run/user/1000
```

嗯 ? 怎么没有挂载 ??

别急, 先访问一下对应的目录:

```sh
core@MiWiFi-RA74-srv:~$ ls -al /mnt/data/d1
total 16
drwxr-xr-x. 1 root root 36 Jun 16 09:48 .
drwxr-xr-x. 1 root root  8 Jun 20 02:26 ..
-rw-r--r--. 1 root root  0 Jun 16 09:48 20240616-d202406a1
core@MiWiFi-RA74-srv:~$ ls -al /mnt/data/d2
total 16
drwxr-xr-x. 1 root root 36 Jun 16 09:48 .
drwxr-xr-x. 1 root root  8 Jun 20 02:26 ..
-rw-r--r--. 1 root root  0 Jun 16 09:48 20240616-d202406b1
core@MiWiFi-RA74-srv:~$ df -h
Filesystem                      Size  Used Avail Use% Mounted on
/dev/nvme0n1p4                  477G  1.5G  475G   1% /sysroot
devtmpfs                        4.0M     0  4.0M   0% /dev
tmpfs                            16G     0   16G   0% /dev/shm
efivarfs                        120K   83K   33K  72% /sys/firmware/efi/efivars
tmpfs                           6.3G  9.3M  6.3G   1% /run
tmpfs                            16G     0   16G   0% /tmp
/dev/nvme0n1p3                  350M  112M  216M  35% /boot
tmpfs                           3.2G  4.0K  3.2G   1% /run/user/1000
/dev/mapper/d202406a-d202406a1 1000G  5.8M  998G   1% /var/mnt/data/d1
/dev/mapper/d202406b-d202406b1 1000G  5.8M  998G   1% /var/mnt/data/d2
```

然后就挂载了 !
使用 `mount` 命令查看详细挂载信息:

```sh
core@MiWiFi-RA74-srv:~$ mount

systemd-1 on /var/mnt/data/d1 type autofs (rw,relatime,fd=53,pgrp=1,timeout=7200,minproto=5,maxproto=5,direct,pipe_ino=10595)
systemd-1 on /sysroot/ostree/deploy/fedora-coreos/var/mnt/data/d1 type autofs (rw,relatime,fd=53,pgrp=1,timeout=7200,minproto=5,maxproto=5,direct,pipe_ino=10595)
systemd-1 on /var/mnt/data/d2 type autofs (rw,relatime,fd=67,pgrp=1,timeout=7200,minproto=5,maxproto=5,direct,pipe_ino=10597)
systemd-1 on /sysroot/ostree/deploy/fedora-coreos/var/mnt/data/d2 type autofs (rw,relatime,fd=67,pgrp=1,timeout=7200,minproto=5,maxproto=5,direct,pipe_ino=10597)

/dev/mapper/d202406a-d202406a1 on /var/mnt/data/d1 type btrfs (rw,nosuid,nodev,relatime,seclabel,compress=zstd:3,space_cache=v2,subvolid=5,subvol=/)
/dev/mapper/d202406b-d202406b1 on /var/mnt/data/d2 type btrfs (rw,nosuid,nodev,relatime,seclabel,compress=zstd:3,space_cache=v2,subvolid=5,subvol=/)
```

可以看到, systemd 在挂载点挂载了 `autofs`, 当出现实际访问时, 才进行挂载.

从上面可以了解, 使用 systemd 自动挂载有以下优点:

+ (1) **加快系统启动**.
  系统不必等待 automount 磁盘挂载完毕, 就可以继续启动.

+ (2) **挂载失败不会导致系统启动失败** (故障隔离).
  比如, 硬盘掉线, 或者损坏了, 甚至直接没了.
  如果是普通挂载, 系统会因为无法完成磁盘挂载, 无法继续启动.
  而在 automount 情况下, 系统不会等待磁盘挂载, 会继续正常启动.

+ (3) **节省资源** (懒执行).
  完全没有被访问的磁盘不会挂载. 磁盘在出现访问请求时才会挂载.
  空闲一段时间后, 系统会自动卸载磁盘, 释放资源
  (同时一定程度上减少数据丢失损坏).

综上, 数据盘还是很适合使用自动挂载的.

### 2.3 配置固定 IP 地址 (systemd-networkd)

窝希望, 服务器在配置固定 IP 地址的同时, 也从 DHCP 获取动态分配的 IP 地址.
也就是一个网络接口具有 2 个 IP 地址.

fcos 默认使用 `NetworkManager` 进行网络管理,
但是这个需求使用 NetworkManager 实现很麻烦,
而使用 `systemd-networkd` 就很简单方便.
另外, 如果需要配置 VLAN, 更是适合使用 systemd-networkd.

相关文章: 《香橙派配置 VLAN (802.1q)》

TODO

----

fcos 默认并没有安装 systemd-networkd, 所以首先需要安装相应软件包.

```sh
core@MiWiFi-RA74-srv:~$ systemctl status systemd-networkd
Unit systemd-networkd.service could not be found.
```

使用 `rpm-ostree install` 命令进行安装:

```sh
core@MiWiFi-RA74-srv:~$ sudo rpm-ostree install systemd-networkd
Checking out tree a65ed05... done
Enabled rpm-md repositories: fedora-cisco-openh264 updates fedora updates-archive
Updating metadata for 'fedora-cisco-openh264'... done
Updating metadata for 'updates'... done
Updating metadata for 'fedora'... done
Updating metadata for 'updates-archive'... done
Importing rpm-md... done
rpm-md repo 'fedora-cisco-openh264'; generated: 2024-03-12T11:45:42Z solvables: 3
rpm-md repo 'updates'; generated: 2024-06-19T02:00:08Z solvables: 18190
rpm-md repo 'fedora'; generated: 2024-04-14T18:51:11Z solvables: 74881
rpm-md repo 'updates-archive'; generated: 2024-05-22T01:41:39Z solvables: 13161
Resolving dependencies... done
Will download: 1 package (689.8 kB)
Downloading from 'updates'... done
Importing packages... done
Checking out packages... done
Running pre scripts... done
Running post scripts... done
Running posttrans scripts... done
Writing rpmdb... done
Writing OSTree commit... done
Staging deployment... done
Added:
  systemd-networkd-255.7-1.fc40.x86_64
Changes queued for next boot. Run "systemctl reboot" to start a reboot
core@MiWiFi-RA74-srv:~$ sudo systemctl reboot

Broadcast message from root@localhost on pts/1 (Thu 2024-06-20 02:38:07 UTC):

The system will reboot now!

core@MiWiFi-RA74-srv:~$ Connection to fc-server.test closed by remote host.
Connection to fc-server.test closed.
```

软件包本身很小, 但是安装可能会比较慢.
安装之后需要 **重启** 系统, 然后使用 `rpm-ostree status` 命令查看状态:

```sh
core@MiWiFi-RA74-srv:~$ rpm-ostree status
State: idle
AutomaticUpdatesDriver: Zincati
  DriverState: active; periodically polling for updates (last checked Thu 2024-06-20 02:38:49 UTC)
Deployments:
● fedora:fedora/x86_64/coreos/stable
                  Version: 40.20240602.3.0 (2024-06-17T10:36:48Z)
               BaseCommit: a65ed051ae3c7ae658f19bee19ff36be19723070282305382890a793904f6f5e
             GPGSignature: Valid signature by 115DF9AEF857853EE8445D0A0727707EA15B79CC
          LayeredPackages: systemd-networkd

  fedora:fedora/x86_64/coreos/stable
                  Version: 40.20240602.3.0 (2024-06-17T10:36:48Z)
                   Commit: a65ed051ae3c7ae658f19bee19ff36be19723070282305382890a793904f6f5e
             GPGSignature: Valid signature by 115DF9AEF857853EE8445D0A0727707EA15B79CC
core@MiWiFi-RA74-srv:~$ systemctl status NetworkManager
● NetworkManager.service - Network Manager
     Loaded: loaded (/usr/lib/systemd/system/NetworkManager.service; enabled; preset: enabled)
    Drop-In: /usr/lib/systemd/system/service.d
             └─10-timeout-abort.conf
     Active: active (running) since Thu 2024-06-20 02:38:43 UTC; 56s ago
       Docs: man:NetworkManager(8)
   Main PID: 1235 (NetworkManager)
      Tasks: 4 (limit: 38288)
     Memory: 6.8M (peak: 7.2M)
        CPU: 131ms
     CGroup: /system.slice/NetworkManager.service
             └─1235 /usr/sbin/NetworkManager --no-daemon
```

参考资料: <https://coreos.github.io/rpm-ostree/>

----

systemd-networkd 服务默认是禁用的:

```sh
core@MiWiFi-RA74-srv:~$ systemctl status systemd-networkd
○ systemd-networkd.service - Network Configuration
     Loaded: loaded (/usr/lib/systemd/system/systemd-networkd.service; disabled; preset: disabled)
    Drop-In: /usr/lib/systemd/system/service.d
             └─10-timeout-abort.conf
     Active: inactive (dead)
TriggeredBy: ○ systemd-networkd.socket
       Docs: man:systemd-networkd.service(8)
             man:org.freedesktop.network1(5)
   FD Store: 0 (limit: 512)
```

配置文件已经写好了:

```sh
core@MiWiFi-RA74-srv:~$ cat /etc/systemd/network/10-eno1.network
[Match]
Name=eno1

[Network]
DHCP=yes

[Address]
Address=192.168.31.2/24
core@MiWiFi-RA74-srv:~$ 
```

使用 `systemctl enable` 命令启用服务:

```sh
core@MiWiFi-RA74-srv:~$ sudo systemctl enable systemd-networkd
Created symlink /etc/systemd/system/dbus-org.freedesktop.network1.service → /usr/lib/systemd/system/systemd-networkd.service.
Created symlink /etc/systemd/system/multi-user.target.wants/systemd-networkd.service → /usr/lib/systemd/system/systemd-networkd.service.
Created symlink /etc/systemd/system/sockets.target.wants/systemd-networkd.socket → /usr/lib/systemd/system/systemd-networkd.socket.
Created symlink /etc/systemd/system/network-online.target.wants/systemd-networkd-wait-online.service → /usr/lib/systemd/system/systemd-networkd-wait-online.service.
```

同时别忘了禁用 `NetworkManager` 服务:

```sh
core@MiWiFi-RA74-srv:~$ sudo systemctl mask NetworkManager
Created symlink /etc/systemd/system/NetworkManager.service → /dev/null.
```

----

**重启**, 然后可以看到 systemd-networkd 正常运行:

```sh
core@MiWiFi-RA74-srv:~$ systemctl status systemd-networkd
● systemd-networkd.service - Network Configuration
     Loaded: loaded (/usr/lib/systemd/system/systemd-networkd.service; enabled; preset: disabled)
    Drop-In: /usr/lib/systemd/system/service.d
             └─10-timeout-abort.conf
     Active: active (running) since Thu 2024-06-20 02:42:08 UTC; 2min 5s ago
TriggeredBy: ● systemd-networkd.socket
       Docs: man:systemd-networkd.service(8)
             man:org.freedesktop.network1(5)
   Main PID: 1072 (systemd-network)
     Status: "Processing requests..."
      Tasks: 1 (limit: 38288)
   FD Store: 0 (limit: 512)
     Memory: 3.3M (peak: 3.8M)
        CPU: 82ms
     CGroup: /system.slice/systemd-networkd.service
             └─1072 /usr/lib/systemd/systemd-networkd
```

查看 IP 地址:

```sh
core@MiWiFi-RA74-srv:~$ ip addr

2: eno1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether a0:8c:fd:d8:9c:19 brd ff:ff:ff:ff:ff:ff
    altname enp0s25
    inet 192.168.31.2/24 brd 192.168.31.255 scope global eno1
       valid_lft forever preferred_lft forever
    inet 192.168.31.12/24 metric 1024 brd 192.168.31.255 scope global secondary dynamic eno1
       valid_lft 172630sec preferred_lft 172630sec
```

可以看到, 其中 `192.168.31.2/24` 是配置的固定 IP 地址,
`192.168.31.12/24` 是通过 DHCP 动态获取的 IP 地址.


## 3 测试普通用户

使用 SSH 连接服务器, 并查看基本用户信息:

```sh
> ssh fc-server
Fedora CoreOS 40.20240602.3.0
Tracker: https://github.com/coreos/fedora-coreos-tracker
Discuss: https://discussion.fedoraproject.org/tag/coreos

Last login: Thu Jun 20 05:04:48 2024 from 192.168.31.3
fc-test@MiWiFi-RA74-srv:~$ id
uid=1002(fc-test) gid=1002(fc-test) groups=1002(fc-test) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
fc-test@MiWiFi-RA74-srv:~$ pwd
/var/home/fc-test
fc-test@MiWiFi-RA74-srv:~$ w
 08:02:28 up 18:46,  1 user,  load average: 0.03, 0.02, 0.00
USER     TTY        LOGIN@   IDLE   JCPU   PCPU WHAT
fc-test            08:02   18:46m  0.00s  0.05s sshd: fc-test [priv]
fc-test@MiWiFi-RA74-srv:~$ free -h
               total        used        free      shared  buff/cache   available
Mem:            31Gi       716Mi        30Gi       9.3Mi       574Mi        30Gi
Swap:             0B          0B          0B
fc-test@MiWiFi-RA74-srv:~$ loginctl list-users
 UID USER    LINGER STATE 
1002 fc-test no     active

1 users listed.
fc-test@MiWiFi-RA74-srv:~$ 
```

可以看到, 这是一个普通用户, 没有特权 (不能 sudo).

### 3.1 开机自动运行容器

接下来使用 podman 运行一个容器应用.

相关文章: 《构建 deno/fresh 的 docker 镜像》

TODO

```sh
fc-test@MiWiFi-RA74-srv:~$ ls -lh my-app.tar.zst
-rw-r--r--. 1 fc-test fc-test 77M Jun 23 08:16 my-app.tar.zst
fc-test@MiWiFi-RA74-srv:~$ podman load < my-app.tar.zst
Getting image source signatures
Copying blob 90ec6ab34ce0 done   | 
Copying blob a62d4638ad90 done   | 
Copying blob 31e29b5ab918 done   | 
Copying blob c83c49512daf done   | 
Copying blob ff9964444958 done   | 
Copying blob 6389ca351a5d done   | 
Copying blob 2ca6496c9f8b done   | 
Copying config 83173f90cc done   | 
Writing manifest to image destination
Loaded image: docker.io/library/my-app:latest
fc-test@MiWiFi-RA74-srv:~$ podman images
REPOSITORY                TAG         IMAGE ID      CREATED      SIZE
docker.io/library/my-app  latest      83173f90cca5  10 days ago  238 MB
fc-test@MiWiFi-RA74-srv:~$ podman run -d -p 8000:8000 my-app
542ca61c3ae225292543449af5034e2078b53c02bd37a63957ee4514162feb75
fc-test@MiWiFi-RA74-srv:~$ podman ps
CONTAINER ID  IMAGE                            COMMAND               CREATED        STATUS        PORTS                   NAMES
542ca61c3ae2  docker.io/library/my-app:latest  /usr/bin/deno run...  3 seconds ago  Up 4 seconds  0.0.0.0:8000->8000/tcp  magical_engelbart
fc-test@MiWiFi-RA74-srv:~$ 
```

好, 运行成功 ! 接下来配置开机自动运行.

----

首先, 编写一个配置文件, 如下:

```sh
fc-test@MiWiFi-RA74-srv:~$ cat ~/.config/containers/systemd/my-app.container
[Unit]
Description=example deno/fresh app
Wants=network-online.target
After=network-online.target

StartLimitIntervalSec=5s
StartLimitBurst=1

[Container]
Image=my-app
PublishPort=8000:8000
Pull=never

[Service]
Restart=always

[Install]
WantedBy=default.target
fc-test@MiWiFi-RA74-srv:~$ 
```

参考资料: <https://docs.fedoraproject.org/en-US/fedora-coreos/running-containers/>
<https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html>

重新加载 systemd 配置文件:

```sh
fc-test@MiWiFi-RA74-srv:~$ systemctl --user daemon-reload
fc-test@MiWiFi-RA74-srv:~$ systemctl --user status my-app
○ my-app.service - example deno/fresh app
     Loaded: loaded (/var/home/fc-test/.config/containers/systemd/my-app.container; generated)
    Drop-In: /usr/lib/systemd/user/service.d
             └─10-timeout-abort.conf
     Active: inactive (dead)
fc-test@MiWiFi-RA74-srv:~$ 
```

距离开机启动还有重要的一步, 使用 `loginctl enable-linger` 命令:

```sh
fc-test@MiWiFi-RA74-srv:~$ loginctl enable-linger
fc-test@MiWiFi-RA74-srv:~$ loginctl list-users
 UID USER    LINGER STATE 
1002 fc-test yes    active

1 users listed.
fc-test@MiWiFi-RA74-srv:~$ 
```

参考资料: <https://www.man7.org/linux/man-pages/man1/loginctl.1.html>

**重启**, 测试容器正常运行:

![测试截图](./图/3-t-1.png)

### 3.2 修复 systemd --user network-online.target

通过上述方式使用 podman 运行容器, 需要依赖 `network-online.target` (系统 unit).
也就是说, 需要等待网络初始化完毕之后, 才能启动.
但是, 上面的服务以用户实例 (systemd --user) 运行,
而用户 unit 无法依赖系统 unit.
如果不解决这个问题, 将导致启动失败.

添加如下配置文件:

```sh
core@MiWiFi-RA74-srv:~$ cat /etc/systemd/user/network-online.target
[Unit]
Description=Network online for systemd --user
Documentation=man:systemd.special(7)
Documentation=https://systemd.io/NETWORK_ONLINE
#After=network.target
core@MiWiFi-RA74-srv:~$ cat /etc/systemd/user/systemd-networkd-wait-online.service
[Unit]
Description=Wait network online for systemd --user
Documentation=man:systemd-networkd-wait-online.service(8)
Before=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/lib/systemd/systemd-networkd-wait-online
RemainAfterExit=yes

[Install]
WantedBy=network-online.target
core@MiWiFi-RA74-srv:~$ 
```

这些 unit 文件是从系统 unit 文件复制而来, 经过简单修改.
需要使用 `network-online.target` 的用户需要启用相应服务:

```ssh
fc-test@MiWiFi-RA74-srv:~$ systemctl --user enable systemd-networkd-wait-online.service
Created symlink /var/home/fc-test/.config/systemd/user/network-online.target.wants/systemd-networkd-wait-online.service → /etc/systemd/user/systemd-networkd-wait-online.service.
```

否则会报错 (省略部分内容):

```sh
fc-test@MiWiFi-RA74-srv:~$ systemctl --user status my-app
× my-app.service - example deno/fresh app
     Loaded: loaded (/var/home/fc-test/.config/containers/systemd/my-app.container; generated)
    Drop-In: /usr/lib/systemd/user/service.d
             └─10-timeout-abort.conf
     Active: failed (Result: exit-code)
   Main PID: 1600 (code=exited, status=126)
        CPU: 272ms

Jun 23 08:53:46 localhost pasta[1655]: External interface not usable
Jun 23 08:53:46 localhost my-app[1614]: Error: pasta failed with exit code 1:
Jun 23 08:53:46 localhost systemd[1495]: my-app.service: Failed with result 'exit-code'.
Jun 23 08:53:46 localhost systemd[1495]: Failed to start my-app.service - example deno/fresh app.
```

参考资料: <https://systemd.io/NETWORK_ONLINE/>
<https://unix.stackexchange.com/questions/216919/how-can-i-make-my-user-services-wait-till-the-network-is-online>

### 3.3 配置数据盘用户目录

普通用户也想使用数据盘存储数据, 需要进行一些简单的权限设置:

```sh
core@MiWiFi-RA74-srv:~$ cd /mnt/data/d1
core@MiWiFi-RA74-srv:/mnt/data/d1$ pwd
/mnt/data/d1
core@MiWiFi-RA74-srv:/mnt/data/d1$ ls -al
total 16
drwxr-xr-x. 1 root root 36 Jun 16 09:48 .
drwxr-xr-x. 1 root root  8 Jun 20 02:26 ..
-rw-r--r--. 1 root root  0 Jun 16 09:48 20240616-d202406a1
core@MiWiFi-RA74-srv:/mnt/data/d1$ sudo mkdir fc-test
core@MiWiFi-RA74-srv:/mnt/data/d1$ sudo chmod 700 fc-test
core@MiWiFi-RA74-srv:/mnt/data/d1$ sudo chown fc-test:fc-test fc-test
core@MiWiFi-RA74-srv:/mnt/data/d1$ ls -al
total 16
drwxr-xr-x. 1 root    root    50 Jun 23 13:33 .
drwxr-xr-x. 1 root    root     8 Jun 20 02:26 ..
-rw-r--r--. 1 root    root     0 Jun 16 09:48 20240616-d202406a1
drwx------. 1 fc-test fc-test  0 Jun 23 13:33 fc-test
core@MiWiFi-RA74-srv:/mnt/data/d1$ sync
core@MiWiFi-RA74-srv:/mnt/data/d1$ 
```

其中 `cd` 命令用于切换当前目录, `pwd` 命令显示当前目录,
`ls` 命令列出目录中的文件, `mkdir` 命令创建目录,
`chmod` 命令设置权限 (`700` 表示只有文件所有者可以访问),
`chown` 命令设置文件的所有者 (owner) 和群组 (group),
`sync` 命令用于将内存缓冲区的数据写入磁盘.

类似的, 对另一块数据盘进行同样的操作:

```sh
core@MiWiFi-RA74-srv:/mnt/data/d2$ pwd
/mnt/data/d2
core@MiWiFi-RA74-srv:/mnt/data/d2$ ls -al
total 16
drwxr-xr-x. 1 root    root    50 Jun 23 13:39 .
drwxr-xr-x. 1 root    root     8 Jun 20 02:26 ..
-rw-r--r--. 1 root    root     0 Jun 16 09:48 20240616-d202406b1
drwx------. 1 fc-test fc-test  0 Jun 23 13:39 fc-test
```

然后普通用户 `fc-test` 就可以在 2 块数据盘存储数据了.


## 4 总结与展望

Fedora CoreOS 安装还是很简单快速的, 只需一条命令即可.
并且只需一个 `.ign` 安装配置文件, 即可完成大部分系统配置,
无需安装系统之后再配置, 方便了很多.

为了更安全, 创建了一个普通用户 `fc-test` (无权 sudo).
将根分区换成 btrfs 文件系统, 并启用 zstd 数据压缩.
开机自动挂载数据盘 (systemd automount), 并配置了固定 IP 地址 (systemd-networkd).

作为普通用户, 测试了开机自动运行容器 (systemd --user, loginctl enable-linger).
由于 podman (pasta) 和 systemd --user 目前的问题
(user unit 无法依赖 system unit), 需要对 `network-online.target` 进行小小的修复.
最后配置了普通用户在数据盘的存储目录.

本文算是对 fcos 服务器系统管理的小型综合应用, 建立了多用户使用的舒适环境.
以后就可以方便的部署基于服务器的应用啦 ~

----

本文使用 CC-BY-SA 4.0 许可发布.
