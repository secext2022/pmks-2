# 逻辑卷管理器 (LVM) 简介

古老的 e5 主机目前有这些存储设备 (硬盘):
**系统盘** (M.2 NVMe SSD 480GB),
**数据盘** (3.5 英寸 SATA 硬盘 4TB x2).
窝决定使用 LVM 对数据盘进行管理.

**逻辑卷管理器** (LVM) 可以认为是一种 (单机) **存储虚拟化** 技术.
多个物理存储设备 (**PV**) 组成一个存储池 (**VG**), 然后划分虚拟分区 (**LV**).

窝觉得, 对窝等穷人 (不超过 4 块大容量硬盘) 来说, RAID (磁盘阵列) 的用处不大.
只有很多块硬盘的时候, RAID 才可能有明显优势.

LVM 在管理方面具有很高的灵活度, 功能非常强大.
比如, 可以很方便的随时调整虚拟分区 (LV) 的大小 (扩容/缩容, `lvresize`),
将 LV 从一块硬盘移动到另一块硬盘 (`pvmove`), 一个 LV 横跨多块硬盘.
还有快照 (snapshot), 软件 RAID (`lvmraid`), 动态存储空间分配 (`lvmthin`),
加速缓存 (`lvmcache`), 压缩去重 (`lvmvdo`), 加密等许多功能.
运行虚拟机 (比如 QEMU/KVM) 时, 可以直接将 LV 分配给虚拟机作为虚拟硬盘使用,
提高性能.

----

相关文章: 《安装 Fedora CoreOS 操作系统》

TODO

参考资料:
+ <https://sourceware.org/lvm2/>
+ <https://gitlab.com/lvmteam/lvm2>
+ <https://www.man7.org/linux/man-pages/man8/lvm.8.html>


## 目录

+ 1 LVM 工作原理简介

+ 2 LVM 常用基础命令

  - 2.1 使用 fdisk 对硬盘分区 (可选)
  - 2.2 创建 pv (物理卷)
  - 2.3 创建 vg (卷组)
  - 2.4 创建 lv (逻辑卷)
  - 2.5 显示详细信息

+ 3 格式化分区并挂载

  - 3.1 建立文件系统 (btrfs)
  - 3.2 挂载 (mount)
  - 3.3 systemd 开机挂载

+ 4 LVM 基础管理操作

  - 4.1 在线扩容
  - 4.2 更多高级操作

+ 5 总结与展望

----

操作系统与 LVM 软件的版本信息:

```sh
core@MiWiFi-RA74-srv:~$ rpm-ostree status
State: idle
AutomaticUpdatesDriver: Zincati
  DriverState: active; periodically polling for updates (last checked Sun 2024-06-16 09:20:10 UTC)
Deployments:
● fedora:fedora/x86_64/coreos/stable
                  Version: 40.20240519.3.0 (2024-06-04T23:21:15Z)
                   Commit: 724ce262d4a27f6b7cb1508e8737e2244d69bb78509d2749cebd7972042bf814
             GPGSignature: Valid signature by 115DF9AEF857853EE8445D0A0727707EA15B79CC
core@MiWiFi-RA74-srv:~$ sudo lvm version
  LVM version:     2.03.23(2) (2023-11-21)
  Library version: 1.02.197 (2023-11-21)
  Driver version:  4.48.0
  Configuration:   ./configure --build=x86_64-redhat-linux-gnu --host=x86_64-redhat-linux-gnu --program-prefix= --disable-dependency-tracking --prefix=/usr --exec-prefix=/usr --bindir=/usr/bin --sbindir=/usr/sbin --sysconfdir=/etc --datadir=/usr/share --includedir=/usr/include --libdir=/usr/lib64 --libexecdir=/usr/libexec --localstatedir=/var --runstatedir=/run --sharedstatedir=/var/lib --mandir=/usr/share/man --infodir=/usr/share/info --with-default-dm-run-dir=/run --with-default-run-dir=/run/lvm --with-default-pid-dir=/run --with-default-locking-dir=/run/lock/lvm --with-usrlibdir=/usr/lib64 --enable-fsadm --enable-write_install --with-user= --with-group= --with-device-uid=0 --with-device-gid=6 --with-device-mode=0660 --enable-pkgconfig --enable-cmdlib --enable-dmeventd --enable-blkid_wiping --with-udevdir=/usr/lib/udev/rules.d --enable-udev_sync --with-thin=internal --with-cache=internal --enable-lvmpolld --enable-lvmlockd-dlm --enable-lvmlockd-dlmcontrol --enable-lvmlockd-sanlock --enable-dbus-service --enable-notify-dbus --enable-dmfilemapd --with-writecache=internal --with-vdo=internal --with-vdo-format=/usr/bin/vdoformat --with-integrity=internal --with-default-use-devices-file=1 --disable-silent-rules --enable-app-machineid --enable-editline --disable-readline
core@MiWiFi-RA74-srv:~$ 
```


## 1 LVM 工作原理简介

![LVM 架构示意图](./图/1-lvm-1.png)

LVM 的核心概念有:

+ **物理卷** (PV): 一块物理硬盘, 或者硬盘上的一个分区.
  也就是底层的物理存储设备.

+ **卷组** (VG): 多个 PV 组成的一个存储池, 相当于一块虚拟大硬盘.

+ **逻辑卷** (LV): 从 VG 之中划分, 相当于一个虚拟分区.

LVM 将 PV 划分为许多小的数据存储块 (PE, 默认 4MB),
VG 就是一堆 PE 的集合, 然后把 PE 分配给 LV.
当上层软件 (比如 filesystem 文件系统) 访问 LV 时,
LVM 找出要访问的数据对应哪个 PE, 从而访问对应的 PV.

有了这个虚拟化架构, 许多强大的高级功能就能很容易实现了.
比如动态调整 LV 的大小, 只要重新分配 PE 即可,
比如把未使用的空闲 PE 分配给 LV (扩容), 所以操作很快, 通常在几秒之内即可完成.
比如有 2 块 500GB 的硬盘 (PV), 但是想创建一个 800GB 的 LV, 超过了单块硬盘的容量.
此时只需要将这 2 块硬盘加入同一个 VG, 然后创建 LV 即可.
也就是把不同 PV 的 PE 分配给同一个 LV.


## 2 LVM 常用基础命令

本章节介绍使用 LVM 的常见基础命令, 并给出实际操作进行举栗.

**警告: 对硬盘和 LVM 进行操作可能造成数据丢失或损坏 (特别是误操作), 请提前备份重要数据 !!**
免责声明: 本文不对因此造成的数据丢失或损坏承担任何责任.

**警告: 对硬盘和 LVM 进行操作可能造成数据丢失或损坏 (特别是误操作), 请提前备份重要数据 !!**
免责声明: 本文不对因此造成的数据丢失或损坏承担任何责任.

**警告: 对硬盘和 LVM 进行操作可能造成数据丢失或损坏 (特别是误操作), 请提前备份重要数据 !!**
免责声明: 本文不对因此造成的数据丢失或损坏承担任何责任.

### 2.1 使用 fdisk 对硬盘分区 (可选)

虽然 LVM 可以直接把整块硬盘作为 PV 使用, 但是保险起见, 以及为了更高的灵活度, 窝还是决定对硬盘分区 (建立 GPT 分区表).

如果硬盘接到别的计算机, 能够看到分区 (可能无法识别),
而不是识别为一块未分区的硬盘, 这或许可能减小数据丢失的概率
(一定程度上避免误操作).
另外, 分区之后, 可以只把一块硬盘的一部分 (分区) 分给 LVM,
其余部分还可以作为普通分区使用, 这提高了管理的灵活度.

首先使用 `fdisk -l` 命令查看硬盘分区情况:

```sh
core@MiWiFi-RA74-srv:~$ sudo fdisk -l
Disk /dev/sdb: 3.64 TiB, 4000787030016 bytes, 7814037168 sectors
Disk model: HGST HMS5C4040BL
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 4096 bytes
I/O size (minimum/optimal): 4096 bytes / 4096 bytes


Disk /dev/sda: 3.64 TiB, 4000787030016 bytes, 7814037168 sectors
Disk model: TOSHIBA MG04ACA4
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 4096 bytes
I/O size (minimum/optimal): 4096 bytes / 4096 bytes


Disk /dev/nvme0n1: 476.94 GiB, 512110190592 bytes, 1000215216 sectors
Disk model: KINGBANK KP230                          
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
```

可以看到 2 块数据盘 (`/dev/sda`, `/dev/sdb`), 还没有分区表.
`/dev/nvme0n1` 是系统盘, GPT 分区表 (`Disklabel type: gpt`), 忽略.

关于 fdisk 工具的使用, 请读者自行查阅相关资料.
下面是分区之后的结果:

```sh
core@MiWiFi-RA74-srv:~$ sudo fdisk -l
Disk /dev/sdb: 3.64 TiB, 4000787030016 bytes, 7814037168 sectors
Disk model: HGST HMS5C4040BL
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 4096 bytes
I/O size (minimum/optimal): 4096 bytes / 4096 bytes
Disklabel type: gpt
Disk identifier: 1A08BE7B-ED19-4EF9-AC4D-7F5ECB213941

Device     Start        End    Sectors  Size Type
/dev/sdb1   2048 7814035455 7814033408  3.6T Linux LVM


Disk /dev/sda: 3.64 TiB, 4000787030016 bytes, 7814037168 sectors
Disk model: TOSHIBA MG04ACA4
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 4096 bytes
I/O size (minimum/optimal): 4096 bytes / 4096 bytes
Disklabel type: gpt
Disk identifier: AC9E4B43-C8C9-408E-8B28-16828A83EB83

Device     Start        End    Sectors  Size Type
/dev/sda1   2048 7814035455 7814033408  3.6T Linux LVM
```

目前没有更多需求, 所以将整个硬盘空间分成了一个分区.
一共 2 个分区: `/dev/sda1`, `/dev/sdb1`.

### 2.2 创建 pv (物理卷)

使用 `blkid` 命令查看块设备 (省略部分结果):

```sh
core@MiWiFi-RA74-srv:~$ sudo blkid

/dev/sdb1: UUID="a6mk78-Ns4R-25hg-5ztz-VG1u-w52o-jLbIe6" TYPE="LVM2_member" PARTLABEL="d202406b-pv" PARTUUID="49d0afd3-38b3-4d7b-9bc2-3662068a4c84"
/dev/sda1: UUID="Q7krxa-lvh5-36Qx-Vc0a-YKjs-XCnz-fTOxPd" TYPE="LVM2_member" PARTLABEL="d202406a-pv" PARTUUID="4e9a63b9-7d38-478a-a6e9-bfc7cd339e8e"
```

使用 `pvs` 命令查看 PV 列表, 使用 `pvcreate` 命令创建 PV (相当于格式化分区).
这些命令需要 root 权限, 所以前面加上 `sudo`.
比如:

```sh
core@MiWiFi-RA74-srv:~$ sudo pvs
core@MiWiFi-RA74-srv:~$ sudo pvcreate /dev/sda1
  Physical volume "/dev/sda1" successfully created.
core@MiWiFi-RA74-srv:~$ sudo pvcreate /dev/sdb1
  Physical volume "/dev/sdb1" successfully created.
core@MiWiFi-RA74-srv:~$ sudo pvs
  PV         VG Fmt  Attr PSize  PFree 
  /dev/sda1     lvm2 ---  <3.64t <3.64t
  /dev/sdb1     lvm2 ---  <3.64t <3.64t
core@MiWiFi-RA74-srv:~$ 
```

可以看到, 已经创建了 2 个 PV.

### 2.3 创建 vg (卷组)

使用 `vgs` 命令查看 VG, 使用 `vgcreate` 命令创建 VG.
在创建前后分别查看 PV 和 VG 的状态, 比如:

```sh
core@MiWiFi-RA74-srv:~$ sudo pvs
  PV         VG Fmt  Attr PSize  PFree 
  /dev/sda1     lvm2 ---  <3.64t <3.64t
  /dev/sdb1     lvm2 ---  <3.64t <3.64t
core@MiWiFi-RA74-srv:~$ sudo vgs
core@MiWiFi-RA74-srv:~$ sudo vgcreate d202406a /dev/sda1
  Volume group "d202406a" successfully created
core@MiWiFi-RA74-srv:~$ sudo vgcreate d202406b /dev/sdb1
  Volume group "d202406b" successfully created
core@MiWiFi-RA74-srv:~$ sudo pvs
  PV         VG       Fmt  Attr PSize  PFree 
  /dev/sda1  d202406a lvm2 a--  <3.64t <3.64t
  /dev/sdb1  d202406b lvm2 a--  <3.64t <3.64t
core@MiWiFi-RA74-srv:~$ sudo vgs
  VG       #PV #LV #SN Attr   VSize  VFree 
  d202406a   1   0   0 wz--n- <3.64t <3.64t
  d202406b   1   0   0 wz--n- <3.64t <3.64t
core@MiWiFi-RA74-srv:~$ 
```

创建了 2 个 VG, 名称分别为 `d202406a`, `d202406b`.

因为窝只有 2 块硬盘, 窝希望一块硬盘突然挂掉之后, 另一块完全不受影响,
所以分别对每块硬盘创建一个 VG, 而没有加入同一个 VG.

作为穷人, 预计窝一个月买不了几块硬盘 (很可能一年也买不了几块),
所以使用这种命名方案.
读者随意.

### 2.4 创建 lv (逻辑卷)

使用 `lvs` 命令查看 LV, 使用 `lvcreate` 命令创建 LV.
在创建前后分别查看 PV, VG, LV 的状态, 比如:

```sh
core@MiWiFi-RA74-srv:~$ sudo pvs
  PV         VG       Fmt  Attr PSize  PFree 
  /dev/sda1  d202406a lvm2 a--  <3.64t <3.64t
  /dev/sdb1  d202406b lvm2 a--  <3.64t <3.64t
core@MiWiFi-RA74-srv:~$ sudo vgs
  VG       #PV #LV #SN Attr   VSize  VFree 
  d202406a   1   0   0 wz--n- <3.64t <3.64t
  d202406b   1   0   0 wz--n- <3.64t <3.64t
core@MiWiFi-RA74-srv:~$ sudo lvs
core@MiWiFi-RA74-srv:~$ sudo lvcreate -L 500g d202406a -n d202406a1
  Logical volume "d202406a1" created.
core@MiWiFi-RA74-srv:~$ sudo lvcreate -L 500g d202406b -n d202406b1
  Logical volume "d202406b1" created.
core@MiWiFi-RA74-srv:~$ sudo pvs
  PV         VG       Fmt  Attr PSize  PFree
  /dev/sda1  d202406a lvm2 a--  <3.64t 3.15t
  /dev/sdb1  d202406b lvm2 a--  <3.64t 3.15t
core@MiWiFi-RA74-srv:~$ sudo vgs
  VG       #PV #LV #SN Attr   VSize  VFree
  d202406a   1   1   0 wz--n- <3.64t 3.15t
  d202406b   1   1   0 wz--n- <3.64t 3.15t
core@MiWiFi-RA74-srv:~$ sudo lvs
  LV        VG       Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  d202406a1 d202406a -wi-a----- 500.00g                                                    
  d202406b1 d202406b -wi-a----- 500.00g                                                    
core@MiWiFi-RA74-srv:~$ 
```

在每个 VG 创建了一个 LV, 名称分别为 `d202406a1`, `d202406b1`,
容量为 500GB.
可以看到, 创建 LV 之后, PV 和 VG 的空闲空间 (Free) 相应减少.

由于对 LV 进行扩容是很方便快捷的操作,
刚开始创建 LV 时可以指定较小的容量, 以后再增加.
这可以提高管理灵活度, VG 有空闲空间可以应对更多需求.

### 2.5 显示详细信息

使用 `pvdisplay`, `vgdisplay`, `lvdisplay` 命令分别查看 PV, VG, LV 的详细信息, 比如:

```sh
core@MiWiFi-RA74-srv:~$ sudo pvdisplay
  --- Physical volume ---
  PV Name               /dev/sdb1
  VG Name               d202406b
  PV Size               <3.64 TiB / not usable 2.00 MiB
  Allocatable           yes 
  PE Size               4.00 MiB
  Total PE              953861
  Free PE               825861
  Allocated PE          128000
  PV UUID               a6mk78-Ns4R-25hg-5ztz-VG1u-w52o-jLbIe6
   
  --- Physical volume ---
  PV Name               /dev/sda1
  VG Name               d202406a
  PV Size               <3.64 TiB / not usable 2.00 MiB
  Allocatable           yes 
  PE Size               4.00 MiB
  Total PE              953861
  Free PE               825861
  Allocated PE          128000
  PV UUID               Q7krxa-lvh5-36Qx-Vc0a-YKjs-XCnz-fTOxPd
   
core@MiWiFi-RA74-srv:~$ sudo vgdisplay
  --- Volume group ---
  VG Name               d202406b
  System ID             
  Format                lvm2
  Metadata Areas        1
  Metadata Sequence No  2
  VG Access             read/write
  VG Status             resizable
  MAX LV                0
  Cur LV                1
  Open LV               0
  Max PV                0
  Cur PV                1
  Act PV                1
  VG Size               <3.64 TiB
  PE Size               4.00 MiB
  Total PE              953861
  Alloc PE / Size       128000 / 500.00 GiB
  Free  PE / Size       825861 / 3.15 TiB
  VG UUID               tqpcF9-p02c-J0gU-nfhY-FLRo-tSSk-FiGAU9
   
  --- Volume group ---
  VG Name               d202406a
  System ID             
  Format                lvm2
  Metadata Areas        1
  Metadata Sequence No  2
  VG Access             read/write
  VG Status             resizable
  MAX LV                0
  Cur LV                1
  Open LV               0
  Max PV                0
  Cur PV                1
  Act PV                1
  VG Size               <3.64 TiB
  PE Size               4.00 MiB
  Total PE              953861
  Alloc PE / Size       128000 / 500.00 GiB
  Free  PE / Size       825861 / 3.15 TiB
  VG UUID               PBFQtB-la8e-PyNQ-Dbd0-OMzc-ziMn-0lgzD8
   
core@MiWiFi-RA74-srv:~$ sudo lvdisplay
  --- Logical volume ---
  LV Path                /dev/d202406b/d202406b1
  LV Name                d202406b1
  VG Name                d202406b
  LV UUID                Ddwkdz-E1JX-Hjrh-hl9B-J1bK-k5Ph-eVzmr0
  LV Write Access        read/write
  LV Creation host, time MiWiFi-RA74-srv, 2024-06-16 09:06:46 +0000
  LV Status              available
  # open                 0
  LV Size                500.00 GiB
  Current LE             128000
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     256
  Block device           253:1
   
  --- Logical volume ---
  LV Path                /dev/d202406a/d202406a1
  LV Name                d202406a1
  VG Name                d202406a
  LV UUID                F44xAN-fMq6-LT6d-jeAt-bVyx-vd4a-BwnQ0e
  LV Write Access        read/write
  LV Creation host, time MiWiFi-RA74-srv, 2024-06-16 09:06:21 +0000
  LV Status              available
  # open                 0
  LV Size                500.00 GiB
  Current LE             128000
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     256
  Block device           253:0
   
core@MiWiFi-RA74-srv:~$ 
```


## 3 格式化分区并挂载

上面使用 LVM 命令成功创建了 PV, VG, LV,
也就是相当于给虚拟硬盘划分好了虚拟分区, 关于 LVM 使用的部分已经结束了,
喵呜啦 ~~

但是通常在使用之前, 还要格式化分区, 也就是建立 **文件系统** (filesystem).

### 3.1 建立文件系统 (btrfs)

此处选择使用 `btrfs`, 因为 btrfs 功能丰富, 具有很高的管理灵活度.
btrfs 技术上基于 B-Tree 和写时复制 (CoW), 具有压缩, 子卷 (subvol),
快照, 软件 RAID 等功能.

使用 `mkfs.btrfs` 命令对 LV 进行格式化, 使用 `-L` 参数指定卷标 (名称), 比如:

```sh
core@MiWiFi-RA74-srv:~$ sudo mkfs.btrfs -L d202406a1 /dev/d202406a/d202406a1
btrfs-progs v6.8.1
See https://btrfs.readthedocs.io for more information.

NOTE: several default settings have changed in version 5.15, please make sure
      this does not affect your deployments:
      - DUP for metadata (-m dup)
      - enabled no-holes (-O no-holes)
      - enabled free-space-tree (-R free-space-tree)

Label:              d202406a1
UUID:               11ee8928-3809-4faa-adb1-629def031e35
Node size:          16384
Sector size:        4096	(CPU page size: 4096)
Filesystem size:    500.00GiB
Block group profiles:
  Data:             single            8.00MiB
  Metadata:         DUP               1.00GiB
  System:           DUP               8.00MiB
SSD detected:       no
Zoned device:       no
Features:           extref, skinny-metadata, no-holes, free-space-tree
Checksum:           crc32c
Number of devices:  1
Devices:
   ID        SIZE  PATH                   
    1   500.00GiB  /dev/d202406a/d202406a1

core@MiWiFi-RA74-srv:~$ sudo mkfs.btrfs -L d202406b1 /dev/d202406b/d202406b1
btrfs-progs v6.8.1
See https://btrfs.readthedocs.io for more information.

NOTE: several default settings have changed in version 5.15, please make sure
      this does not affect your deployments:
      - DUP for metadata (-m dup)
      - enabled no-holes (-O no-holes)
      - enabled free-space-tree (-R free-space-tree)

Label:              d202406b1
UUID:               787b22e1-f9ff-4aea-a2fa-b03b6c925ae8
Node size:          16384
Sector size:        4096	(CPU page size: 4096)
Filesystem size:    500.00GiB
Block group profiles:
  Data:             single            8.00MiB
  Metadata:         DUP               1.00GiB
  System:           DUP               8.00MiB
SSD detected:       no
Zoned device:       no
Features:           extref, skinny-metadata, no-holes, free-space-tree
Checksum:           crc32c
Number of devices:  1
Devices:
   ID        SIZE  PATH                   
    1   500.00GiB  /dev/d202406b/d202406b1

core@MiWiFi-RA74-srv:~$ sudo blkid

/dev/mapper/d202406b-d202406b1: LABEL="d202406b1" UUID="787b22e1-f9ff-4aea-a2fa-b03b6c925ae8" UUID_SUB="44d918eb-21b0-4b76-a104-4e5ea9e2838e" BLOCK_SIZE="4096" TYPE="btrfs"

/dev/mapper/d202406a-d202406a1: LABEL="d202406a1" UUID="11ee8928-3809-4faa-adb1-629def031e35" UUID_SUB="e9c7bd1d-8650-4c31-8ab7-5015dea5065a" BLOCK_SIZE="4096" TYPE="btrfs"
```

格式化之后可以使用 `blkid` 命令确认结果.

### 3.2 挂载 (mount)

Linux 的文件系统 (VFS) 整个系统形成一棵完整的树状结构, 从根目录 (`/`) 开始.
**挂载** (mount) 就是把文件系统 (块设备) 安装到这棵树上的操作.
挂载之后才能访问文件系统之中的文件.

**挂载点** (mount point) 类似于这棵树上的某个枝条, 也就是挂载安装的位置 (目录).
与挂载相反的操作是卸载 (umount), 关机之前需要正常卸载文件系统,
防止数据丢失.

首先使用 `mkdir -p` 命令创建想要的挂载点 (目录), 比如:

```sh
core@MiWiFi-RA74-srv:~$ sudo mkdir -p /mnt/data/d1
core@MiWiFi-RA74-srv:~$ sudo mkdir -p /mnt/data/d2
core@MiWiFi-RA74-srv:~$ ls -l /mnt/data
total 0
drwxr-xr-x. 2 root root 6 Jun 16 09:44 d1
drwxr-xr-x. 2 root root 6 Jun 16 09:44 d2
core@MiWiFi-RA74-srv:~$ 
```

此处创建了两个目录 `/mnt/data/d1`, `/mnt/data/d2`.
挂载点最好是空目录, 否则挂载后会 "遮盖" 原来的目录,
导致原来目录中的文件无法访问 (卸载后会恢复原状).

使用 `mount` 命令进行挂载, 指定块设备 (LV) 和挂载点,
使用 `-o` 指定挂载选项, 比如:

```sh
core@MiWiFi-RA74-srv:~$ sudo mount /dev/d202406a/d202406a1 /mnt/data/d1 -o compress=zstd,nosuid,nodev
core@MiWiFi-RA74-srv:~$ sudo mount /dev/d202406b/d202406b1 /mnt/data/d2 -o compress=zstd,nosuid,nodev
```

其中 `compress=zstd` 选项表示启用压缩 (btrfs 文件系统的功能),
压缩算法为 `zstd`.
`nosuid` 表示不允许使用 suid, `nodev` 表示不允许创建设备文件.
因为这个是数据盘, 所以禁止这些特殊文件, 可以提高系统的安全性.

挂载之后, 可以使用 `df`, `mount` 命令查看效果, 比如:

```sh
core@MiWiFi-RA74-srv:~$ df -h
Filesystem                      Size  Used Avail Use% Mounted on

/dev/mapper/d202406a-d202406a1 1000G  5.8M  998G   1% /var/mnt/data/d1
/dev/mapper/d202406b-d202406b1 1000G  5.8M  998G   1% /var/mnt/data/d2
core@MiWiFi-RA74-srv:~$ mount

/dev/mapper/d202406a-d202406a1 on /var/mnt/data/d1 type btrfs (rw,nosuid,nodev,relatime,seclabel,compress=zstd:3,space_cache=v2,subvolid=5,subvol=/)
/dev/mapper/d202406b-d202406b1 on /var/mnt/data/d2 type btrfs (rw,nosuid,nodev,relatime,seclabel,compress=zstd:3,space_cache=v2,subvolid=5,subvol=/)
```

在挂载之后写入文件, 有助于理解挂载的工作方式:

```sh
core@MiWiFi-RA74-srv:~$ sudo touch /mnt/data/d1/20240616-d202406a1
core@MiWiFi-RA74-srv:~$ sudo touch /mnt/data/d2/20240616-d202406b1
core@MiWiFi-RA74-srv:~$ ls -l /mnt/data/d1 /mnt/data/d2
/mnt/data/d1:
total 0
-rw-r--r--. 1 root root 0 Jun 16 09:48 20240616-d202406a1

/mnt/data/d2:
total 0
-rw-r--r--. 1 root root 0 Jun 16 09:48 20240616-d202406b1
core@MiWiFi-RA74-srv:~$ sync
```

挂载之后查看 PV, VG, LV 的状态:

```sh
core@MiWiFi-RA74-srv:~$ sudo pvs
  PV         VG       Fmt  Attr PSize  PFree
  /dev/sda1  d202406a lvm2 a--  <3.64t 3.15t
  /dev/sdb1  d202406b lvm2 a--  <3.64t 3.15t
core@MiWiFi-RA74-srv:~$ sudo vgs
  VG       #PV #LV #SN Attr   VSize  VFree
  d202406a   1   1   0 wz--n- <3.64t 3.15t
  d202406b   1   1   0 wz--n- <3.64t 3.15t
core@MiWiFi-RA74-srv:~$ sudo lvs
  LV        VG       Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  d202406a1 d202406a -wi-ao---- 500.00g                                                    
  d202406b1 d202406b -wi-ao---- 500.00g                                                    
core@MiWiFi-RA74-srv:~$ 
```

注意挂载后 LV 属性会变成 `-wi-ao` (多了 `o`).

### 3.3 systemd 开机挂载

上面使用 `mount` 命令手动挂载, 重启之后就会失效.
如果想要开机挂载, 可以编写 systemd 配置文件, 比如:

```sh
core@MiWiFi-RA74-srv:~$ cat /etc/systemd/system/var-mnt-data-d1.mount
[Mount]
What=/dev/d202406a/d202406a1
Where=/var/mnt/data/d1
Type=btrfs
Options=compress=zstd,nosuid,nodev

[Install]
WantedBy=multi-user.target
core@MiWiFi-RA74-srv:~$ 
```

使用 `systemctl enable` 命令启用:

```sh
core@MiWiFi-RA74-srv:~$ sudo systemctl enable var-mnt-data-d1.mount
Created symlink /etc/systemd/system/multi-user.target.wants/var-mnt-data-d1.mount → /etc/systemd/system/var-mnt-data-d1.mount.
core@MiWiFi-RA74-srv:~$ sudo systemctl enable var-mnt-data-d2.mount
Created symlink /etc/systemd/system/multi-user.target.wants/var-mnt-data-d2.mount → /etc/systemd/system/var-mnt-data-d2.mount.
core@MiWiFi-RA74-srv:~$ 
```

重启, 就能看到开机挂载的效果了.

参考资料: <https://www.freedesktop.org/software/systemd/man/latest/systemd.mount.html>


## 4 LVM 基础管理操作

上面介绍了开始使用 LVM 的完整操作, 包括:
硬盘分区, 创建 PV, VG, LV, 格式化, 挂载, 开机挂载.

在日常使用 LVM 的过程中还需要一些管理操作.

### 4.1 在线扩容

增加 LV 的容量可能是最常用的操作了.

使用 `lvextend` 命令对 LV 进行扩容, 使用 `-L` 参数指定容量,
`+500g` 表示增大 500GB, 如下:

```sh
core@MiWiFi-RA74-srv:~$ sudo lvextend -L +500g d202406a/d202406a1
  Size of logical volume d202406a/d202406a1 changed from 500.00 GiB (128000 extents) to 1000.00 GiB (256000 extents).
  Logical volume d202406a/d202406a1 successfully resized.
core@MiWiFi-RA74-srv:~$ sudo lvextend -L +500g d202406b/d202406b1
  Size of logical volume d202406b/d202406b1 changed from 500.00 GiB (128000 extents) to 1000.00 GiB (256000 extents).
  Logical volume d202406b/d202406b1 successfully resized.
core@MiWiFi-RA74-srv:~$ sudo pvs
  PV         VG       Fmt  Attr PSize  PFree
  /dev/sda1  d202406a lvm2 a--  <3.64t 2.66t
  /dev/sdb1  d202406b lvm2 a--  <3.64t 2.66t
core@MiWiFi-RA74-srv:~$ sudo vgs
  VG       #PV #LV #SN Attr   VSize  VFree
  d202406a   1   1   0 wz--n- <3.64t 2.66t
  d202406b   1   1   0 wz--n- <3.64t 2.66t
core@MiWiFi-RA74-srv:~$ sudo lvs
  LV        VG       Attr       LSize    Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  d202406a1 d202406a -wi-ao---- 1000.00g                                                    
  d202406b1 d202406b -wi-ao---- 1000.00g                                                    
core@MiWiFi-RA74-srv:~$ 
```

可以看到, LV 已经扩容了.
接下来进行文件系统的扩容, 对于 `btrfs` 文件系统可以使用
`btrfs filesystem resize max` 命令, 比如:

```sh
core@MiWiFi-RA74-srv:~$ sudo btrfs filesystem resize max /mnt/data/d1
Resize device id 1 (/dev/mapper/d202406a-d202406a1) from 500.00GiB to max
core@MiWiFi-RA74-srv:~$ sudo btrfs filesystem resize max /mnt/data/d2
Resize device id 1 (/dev/mapper/d202406b-d202406b1) from 500.00GiB to max
core@MiWiFi-RA74-srv:~$ df -h
Filesystem                      Size  Used Avail Use% Mounted on

/dev/mapper/d202406a-d202406a1 1000G  5.8M  998G   1% /var/mnt/data/d1
/dev/mapper/d202406b-d202406b1 1000G  5.8M  998G   1% /var/mnt/data/d2
```

扩容完毕.
注意, 上述操作完全可以在系统正常运行的过程中进行, 无需中断或停机,
也就是 **在线** 扩容.

### 4.2 更多高级操作

这些功能可能不常用, 简单了解一下, 需要使用时再详细查找资料.

+ (1) 将新的 PV 加入 VG. 使用 `vgextend` 命令.

  扩大 VG 的总容量, 比如添加新的硬盘.

  <https://www.man7.org/linux/man-pages/man8/vgextend.8.html>

+ (2) 从 VG 移除 PV. 使用 `vgreduce` 命令.
  移除 PV 之前, 可能需要使用 `pvmove` 命令将其中的数据 (PE) 转移.

  <https://www.man7.org/linux/man-pages/man8/vgreduce.8.html>
  <https://www.man7.org/linux/man-pages/man8/pvmove.8.html>

+ (3) 扫描 PV. 使用 `pvscan` 命令.

  当存储设备变动后 (比如插入新的硬盘), 执行此命令更新系统中的 PV 列表.

  <https://www.man7.org/linux/man-pages/man8/pvscan.8.html>

+ (4) 删除 LV. 使用 `lvremove` 命令.

  删除 LV 会删除其中的数据. 需要先卸载 (umount) 才能删除.

  <https://www.man7.org/linux/man-pages/man8/lvremove.8.html>

+ (5) 创建快照. 使用 `lvcreate -s` 命令.

  快照 (snapshot) 可以保存一个 LV 在创建快照时刻的状态 (数据).
  快照可以用来备份数据, 比如对一个 LV 创建快照, 然后对快照进行备份.
  因为快照中的数据是不变的, 而一个运行中的文件系统, 会不停读写数据,
  对备份造成困难.

  <https://www.man7.org/linux/man-pages/man8/lvcreate.8.html>

+ (6) 软件 RAID (磁盘阵列).

  LVM 支持 raid0, raid1, raid4, raid5, raid6, raid10.
  需要多块硬盘 (PV) 才能创建 RAID.

  和硬件 RAID (阵列卡) 相比, 软件 RAID 会使用更多的 CPU 和内存资源.
  但是软件 RAID 具有更高的灵活度,
  比如可以只把一块硬盘的一部分用于 RAID,
  而硬件 RAID 只能把整块硬盘用于 RAID.

  <https://www.man7.org/linux/man-pages/man7/lvmraid.7.html>

+ (7) 加速缓存.

  LVM 可以构建带缓存的多级存储系统.
  比如使用大容量硬盘存储数据, 前面使用快速的 SSD 作为缓存,
  缓存通过存储热点数据, 可能提高整个系统的存储性能.

  <https://www.man7.org/linux/man-pages/man7/lvmcache.7.html>

+ (8) 压缩去重.

  在块设备 (LV) 层级进行数据压缩和重复数据去除 (相同数据只存储一份).

  <https://www.man7.org/linux/man-pages/man7/lvmvdo.7.html>


## 5 总结与展望

逻辑卷管理器 (LVM) 使用物理卷 (PV), 卷组 (VG), 逻辑卷 (LV) 这 3 层抽象,
提供了很高的灵活度, 功能很强大, 使用起来却简单方便.

文本介绍了使用 LVM 对硬盘进行存储管理的整个过程:
硬盘分区 (fdisk), 创建 PV, VG, LV, 格式化 (btrfs), 挂载 (mount), 开机挂载 (systemd).
另外介绍了一些 LVM 的管理操作与高级功能.

作为穷人, 很难拥有大规模服务器集群 (几十台甚至数百台),
能有两三台廉价二手服务器就已经很不错了, 只有一台那也能凑合.
LVM 作为一种单机的存储虚拟化技术, 应该能发挥很好的作用.
狠狠的使用 LVM 吧 !

----

本文使用 CC-BY-SA 4.0 许可发布.
