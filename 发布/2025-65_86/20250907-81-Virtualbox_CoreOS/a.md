# 在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统

由于窝 128GB 内存的台式主机被老公霸占了 (窝的小主机和笔记本都只有 64GB 内存),
为了充分利用台式主机, 窝只能弄一个虚拟机了, 在后台跑着.

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 81 号作品. )

----

相关文章:

+ 《小水滴系列文章目录 (整理)》

  TODO

+ 《安装 Fedora CoreOS 操作系统》

  TODO

+ 《使用多用户增强服务器的安全性》

  TODO

+ 《基于 sftp 的 NAS (局域网文件存储服务器)》

  TODO

+ 《在容器 (podman) 中运行虚拟机 (QEMU/KVM, libvirt)》

  TODO

参考资料:

+ <https://www.virtualbox.org/wiki/Downloads>
+ <https://wiki.archlinux.org/title/Btrfs#Disabling_CoW>
+ <https://fedoraproject.org/coreos/download?stream=stable>
+ <https://docs.fedoraproject.org/en-US/fedora-coreos/bare-metal/>
+ <https://docs.fedoraproject.org/en-US/fedora-coreos/producing-ign/>
+ <https://coreos.github.io/butane/specs/>


## 目录

+ 1 下载并安装 VirtualBox

+ 2 安装 Fedora CoreOS 操作系统

  - 2.1 创建虚拟机
  - 2.2 准备安装配置文件
  - 2.3 进行安装

+ 3 导出虚拟机并复制到另一台机器

+ 4 总结与展望


## 1 下载并安装 VirtualBox

从官网下载 VirtualBox 的安装包: <https://www.virtualbox.org/wiki/Downloads>

记得下载扩展增强包 `Oracle_VirtualBox_Extension_Pack-7.2.0.vbox-extpack`.

----

ArchLinux 的安装方式如下:

```sh
sudo pacman -Syu
sudo pacman -S virtualbox virtualbox-ext-vnc virtualbox-guest-iso virtualbox-host-dkms linux-headers linux-zen-headers
sudo gpasswd -a s2 vboxusers
```

其中 `s2` 是自己的用户名.

然后重启系统.

----

安装扩展增强包:

![virtualbox (1)](./图/1-i-1.png)

安装之后:

![virtualbox (2)](./图/1-i-2.png)

----

如果使用 `btrfs`, 创建保存虚拟机 **磁盘镜像** 文件的目录, 并设置 `C` 属性:

```sh
mkdir vdi
chattr +C vdi
```

验证结果:

```sh
> lsattr -d vdi
---------------C------ vdi
```

为了避免 btrfs 快照 (`snapshot`) 包含虚拟机, 建议为虚拟机创建单独的 `subvol`.

参考: <https://wiki.archlinux.org/title/Btrfs#Disabling_CoW>
<https://wiki.archlinux.org/title/Btrfs#Subvolumes>


## 2 安装 Fedora CoreOS 操作系统

下载 Fedora CoreOS 安装 iso 镜像: <https://fedoraproject.org/coreos/download?stream=stable>

验证下载的文件:

```sh
> sha256sum fedora-coreos-42.20250818.3.0-live-iso.x86_64.iso
7e3797c74d93afc369f7114b24bb68d76443e317a662b81b591d75c03f1a7275  fedora-coreos-42.20250818.3.0-live-iso.x86_64.iso
```

### 2.1 创建虚拟机

![创建虚拟机 (1)](./图/21-c-1.png)

点击 **新建**, 选择虚拟机保存目录, 操作系统 `Linux`, 类型 `Fedora (64-bit)`.

![创建虚拟机 (2)](./图/21-c-2.png)

分配内存和 CPU, 这里先给 8GB 内存 8 核 CPU 吧.

![创建虚拟机 (3)](./图/21-c-3.png)

系统磁盘格式选 `vdi`, 大小先给 50GB 吧 (空间动态分配).

![创建虚拟机 (4)](./图/21-c-4.png)

虚拟机创建完毕, 再稍微改一下设置, 比如网卡选 **桥接网络**.
桥接网络就是, 虚拟机和物理机相当于连接到同一个局域网, 方便通过网络访问.

```sh
> lsattr
---------------C------ ./vfc1-202509.vdi
```

验证一下 `vdi` 文件的 `C` 属性.

### 2.2 准备安装配置文件

详见文章 《安装 Fedora CoreOS 操作系统》 《使用多用户增强服务器的安全性》

配置文件 `vfc1.bu`:

```yaml
variant: fcos
version: 1.6.0
passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICHaotVMdOfQrHe4bEYtjAuzQr3LdIqYlDu0sgcKLXHD vfc1-202509
    - name: test1
    - name: b202509a
      ssh_authorized_keys:
        - ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHCyRg9UBu1C3OH37Lke5xwSpiTPWKlUIg+wj3S6h1MR vfc1-b202509a
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

    # mount: /mnt/data/b1
    - path: /etc/systemd/system/var-mnt-data-b1.mount
      contents:
        inline: |
          [Mount]
          What=/dev/sdb1
          Where=/var/mnt/data/b1
          Type=btrfs
          Options=compress=zstd,nosuid,nodev
    - path: /etc/systemd/system/var-mnt-data-b1.automount
      contents:
        inline: |
          [Automount]
          Where=/var/mnt/data/b1
          TimeoutIdleSec=2h

          [Install]
          WantedBy=local-fs.target

    # ip: enp0s3
    - path: /etc/systemd/network/10-enp0s3.network
      contents:
        inline: |
          [Match]
          Name=enp0s3

          [Network]
          DHCP=yes

          [Address]
          Address=192.168.31.213/24

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

----

接下来需要编译配置文件. 首先安装 toolbox:

```sh
sudo pacman -S toolbox
toolbox create -d fedora -r 42
```

验证:

```sh
> toolbox list
IMAGE ID      IMAGE NAME                                    CREATED
96c1e85a6909  registry.fedoraproject.org/fedora-toolbox:42  31 minutes ago

CONTAINER ID  CONTAINER NAME       CREATED         STATUS   IMAGE NAME
6cec1a7645fd  fedora-toolbox-42    28 seconds ago  created  registry.fedoraproject.org/fedora-toolbox:42
```

修复 BUG:

```sh
sudo chmod -R o+rx /dev/vboxusb
```

进入 toolbox:

```sh
toolbox enter fedora-toolbox-42
```

安装 butane:

```sh
sudo dnf install -y butane
```

验证:

```sh
> butane --version
Butane 0.24.0
```

然后编译配置文件:

```sh
butane --pretty --strict vfc1.bu > vfc1.ign
```

### 2.3 进行安装

启动虚拟机:

![安装 (1)](./图/23-i-1.png)

在本机提供安装配置文件:

```sh
npx serve
```

----

在虚拟机中, 检查磁盘:

```sh
sudo fdisk -l
```

下载安装配置文件:

```sh
curl -O http://192.168.31.151:3000/vfc1.ign
```

进行安装:

```sh
sudo coreos-installer install /dev/sda -i vfc1.ign
```

![安装 (2)](./图/23-i-2.png)

然后重启:

```sh
reboot
```

![安装 (3)](./图/23-i-3.png)

----

Fedora CoreOS 操作系统安装完成.

编辑本地 SSH 配置文件 `~/.ssh/config`:

```sh
Host vfc1-core
    HostName 192.168.31.66
    User core
    IdentityFile ~/.ssh/id_ed25519-vfc1-core-20250907

Host vfc1-b
    HostName 192.168.31.66
    User b202509a
    IdentityFile ~/.ssh/id_ed25519-vfc1-b202509a-20250907
```

SSH 连接虚拟机:

```sh
ssh vfc1-core
```

连接成功:

```sh
core@MiWiFi-RA74-srv:~$ id
uid=1000(core) gid=1000(core) groups=1000(core),4(adm),10(wheel),16(sudo),190(systemd-journal) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
core@MiWiFi-RA74-srv:~$ uname -a
Linux MiWiFi-RA74-srv 6.15.9-201.fc42.x86_64 #1 SMP PREEMPT_DYNAMIC Sat Aug  2 11:37:34 UTC 2025 x86_64 GNU/Linux
core@MiWiFi-RA74-srv:~$ free -h
               total        used        free      shared  buff/cache   available
Mem:           7.7Gi       481Mi       7.2Gi       756Ki       309Mi       7.3Gi
Swap:             0B          0B          0B
core@MiWiFi-RA74-srv:~$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda4        50G  1.8G   48G   4% /sysroot
composefs       4.8M  4.8M     0 100% /
devtmpfs        3.9G     0  3.9G   0% /dev
tmpfs           3.9G     0  3.9G   0% /dev/shm
tmpfs           1.6G  748K  1.6G   1% /run
tmpfs           3.9G     0  3.9G   0% /tmp
tmpfs           1.0M     0  1.0M   0% /run/credentials/systemd-journald.service
/dev/sda3       350M  142M  186M  44% /boot
tmpfs           1.0M     0  1.0M   0% /run/credentials/systemd-resolved.service
tmpfs           1.0M     0  1.0M   0% /run/credentials/getty@tty1.service
tmpfs           793M  4.0K  793M   1% /run/user/1000
core@MiWiFi-RA74-srv:~$ rpm-ostree status
State: idle
AutomaticUpdatesDriver: Zincati
  DriverState: active; periodically polling for updates (last checked Sun 2025-09-07 08:07:35 UTC)
Deployments:
● ostree-remote-image:fedora:docker://quay.io/fedora/fedora-coreos:stable
                   Digest: sha256:a636ee2280cfba2fff80df0f68641f61212e2e9b9b96d23178353e28df0d6238
                  Version: 42.20250818.3.0 (2025-09-03T02:26:27Z)
core@MiWiFi-RA74-srv:~$ 
```

可以看到, 这个系统占用的内存和磁盘空间都是挺少的.

----

配置网络, 安装 `systemd-networkd`:

```sh
sudo rpm-ostree install systemd-networkd
```

重启:

```sh
sudo systemctl reboot
```

SSH 到虚拟机:

```sh
sudo systemctl enable systemd-networkd
sudo systemctl mask NetworkManager
```

再次重启.

```sh
core@MiWiFi-RA74-srv:~$ ip addr

2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 08:00:27:ba:ee:1f brd ff:ff:ff:ff:ff:ff
    altname enx080027baee1f
    inet 192.168.31.213/24 brd 192.168.31.255 scope global enp0s3
       valid_lft forever preferred_lft forever
    inet 192.168.31.67/24 metric 1024 brd 192.168.31.255 scope global secondary dynamic enp0s3
       valid_lft 172699sec preferred_lft 172699sec
```

网络配置成功, 可以看到, 网卡有 1 个固定 IP 地址, 以及通过 DHCP 动态分配的 IP 地址.


## 3 导出虚拟机并复制到另一台机器

关闭虚拟机, 然后导出:

![导出 (1)](./图/3-p-1.png)

导出的 `.ova` 文件:

```sh
> ls -lh vfc1.ova
-rw------- 1 s2 s2 1.5G  9月 7日 17:14 vfc1.ova
```

把这个文件 **复制** 到被老公霸占的那个主机上, **导入**, 启动.

然后在这边 SSH 连接, 成功 !

----

然后那边关机, 添加一个数据盘 (也是虚拟机 `.vdi` 磁盘), 启动:

```sh
core@MiWiFi-RA74-srv:~$ sudo fdisk -l
Disk /dev/sda: 50 GiB, 53687091200 bytes, 104857600 sectors
Disk model: VBOX HARDDISK   
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
Disk identifier: C3336767-2CA9-41E2-8F7F-C088FC9FA0FC

Device       Start       End   Sectors  Size Type
/dev/sda1     2048      4095      2048    1M BIOS boot
/dev/sda2     4096    264191    260096  127M EFI System
/dev/sda3   264192   1050623    786432  384M Linux filesystem
/dev/sda4  1050624 104857566 103806943 49.5G Linux filesystem


Disk /dev/sdb: 1000 GiB, 1073741824000 bytes, 2097152000 sectors
Disk model: VBOX HARDDISK   
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
```

可以看到, 出现了 `/dev/sdb` 作为数据盘.
对这个盘进行分区:

```sh
core@MiWiFi-RA74-srv:~$ sudo fdisk -l
Disk /dev/sda: 50 GiB, 53687091200 bytes, 104857600 sectors
Disk model: VBOX HARDDISK   
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
Disk identifier: C3336767-2CA9-41E2-8F7F-C088FC9FA0FC

Device       Start       End   Sectors  Size Type
/dev/sda1     2048      4095      2048    1M BIOS boot
/dev/sda2     4096    264191    260096  127M EFI System
/dev/sda3   264192   1050623    786432  384M Linux filesystem
/dev/sda4  1050624 104857566 103806943 49.5G Linux filesystem


Disk /dev/sdb: 1000 GiB, 1073741824000 bytes, 2097152000 sectors
Disk model: VBOX HARDDISK   
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: dos
Disk identifier: 0xea0371f0

Device     Boot Start        End    Sectors  Size Id Type
/dev/sdb1        2048 2097151999 2097149952 1000G 83 Linux
```

分区完成, 有了 `/dev/sdb1`, 然后格式化:

```sh
sudo mkfs.btrfs -L "vfc1b1-202509" /dev/sdb1
```

启用自动挂载:

```sh
sudo mkdir -p /var/mnt/data/b1
sudo systemctl enable --now var-mnt-data-b1.automount
```

查看挂载 (部分省略):

```sh
core@MiWiFi-RA74-srv:~$ mount

/dev/sdb1 on /var/mnt/data/b1 type btrfs (rw,nosuid,nodev,relatime,seclabel,compress=zstd:3,space_cache=v2,subvolid=5,subvol=/)
core@MiWiFi-RA74-srv:~$ df -h
Filesystem      Size  Used Avail Use% Mounted on

/dev/sdb1      1000G  5.8M  998G   1% /var/mnt/data/b1
```

成功, 撒花 ~


## 4 总结与展望

本文在 VirtualBox 虚拟机软件中安装了 Fedora CoreOS 操作系统 (具体细节的解释请看之前的几篇相关文章),
并导出为 `.ova` 文件, 复制到另一台机器, 并导入运行.
并对虚拟机的网络和存储 (数据盘) 进行了配置.
可以看到, 虚拟机的使用还是很方便的, 可以直接整个 "打包带走".

嘻嘻, 这下老公就不能霸占整个台式主机了, 窝在后台运行一个虚拟机,
也可以同时利用一部分 CPU, 内存, 磁盘存储, 等资源.

----

本文使用 CC-BY-SA 4.0 许可发布.
