# 本地 HTTP 文件服务器的简单搭建 (deno/std)

在本地局域网搭建一个文件服务器, 有很多种方式.
本文介绍的是窝觉得比较简单的一种.

文件直接存储在 btrfs 文件系统之中, 底层使用 LVM 管理磁盘, 方便扩容.
使用 btrfs RAID 1 进行镜像备份 (一个文件在 2 块硬盘分别存储一份),
防止一块硬盘突然损坏造成的数据丢失.
使用 btrfs 的 subvol 和快照等功能, 方便存储管理.

HTTP 服务器使用 deno 标准库 (jsr/std) 之中自带的简单文件服务器,
对局域网提供只读的文件访问.
deno 在容器中运行, 使用 systemd --user 和 podman 管理运行容器.

注意: 本文中的文件服务器, 并没有访问权限控制, 只要在局域网之中,
就能够访问 (只读) 下载文件.
不要把秘密放上去哦 !

----

相关文章:

+ 《使用多用户增强服务器的安全性》

  TODO

+ 《逻辑卷管理器 (LVM) 简介》

  TODO

+ 《构建 deno/fresh 的 docker 镜像》

  TODO


## 目录

+ 1 文件系统准备与格式化 (LVM / btrfs RAID subvol)

  - 2.1 创建 LVM 逻辑卷 (LV)
  - 2.2 格式化 (btrfs) 并使用 RAID 0/1
  - 2.3 目录权限配置 (subvol)
  - 2.4 (可选) 自动检查文件数据 (btrfs scrub)
  - 2.5 (可选) 配置自动快照 (snapper)

+ 2 安装文件服务器

  - 2.1 容器镜像的制作 (deno)
  - 2.2 部署容器并运行 (systemd --user / podman)

+ 3 测试

  - 3.1 上传文件 (sftp)
  - 3.2 访问下载文件 (浏览器 / HTTP)

+ 4 总结与展望


## 1 文件系统准备与格式化 (LVM / btrfs RAID subvol)

相关文章: 《逻辑卷管理器 (LVM) 简介》

窝的 Fedora CoreOS 服务器一共有 2 块硬盘: `/dev/sda`, `/dev/sdb`

窝希望建立 2 个存储区域:

+ 存储 1 (使用 RAID 0): 存储 **允许丢失** 的数据.

  这里的文件只存储一份, 节省空间.
  如果一块硬盘损坏, 可能造成数据丢失.

+ 存储 2 (使用 RAID 1): 存储重要数据 (不允许丢失).

  这里的每个文件, 在 2 块硬盘分别存储一份 (总共存储 2 份).
  只有 2 块硬盘全部损坏, 才会造成数据丢失.

实际使用过程中, 根据具体情况, 把不同的文件分别丢进不同的存储区域.
从而在避免数据丢失和节省存储空间之间达到平衡.

实际上, 大部分数据都是不太重要, 允许丢失的, 比如 原神安装包, 如果丢失大不了重新下载即可.
只有少量数据是非常重要, 绝对不可忍受丢失的.
所以上述存储方案在实际使用中是可行的.

### 2.1 创建 LVM 逻辑卷 (LV)

为了在一块硬盘损坏时, 不影响另一块硬盘, 每块硬盘都有自己的 VG.
在 LVM 层次主要使用存储空间动态分配 (在线扩容) 的功能, 不使用 RAID.

创建之前的情况:

```sh
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

创建 LV:

```sh
core@MiWiFi-RA74-srv:~$ sudo lvcreate -L 100g d202406a -n bf1s202406_1
  Logical volume "bf1s202406_1" created.
core@MiWiFi-RA74-srv:~$ sudo lvcreate -L 100g d202406b -n bf1s202406_2
  Logical volume "bf1s202406_2" created.
core@MiWiFi-RA74-srv:~$ sudo lvcreate -L 100g d202406a -n bf2s202406_1
  Logical volume "bf2s202406_1" created.
core@MiWiFi-RA74-srv:~$ sudo lvcreate -L 100g d202406b -n bf2s202406_2
  Logical volume "bf2s202406_2" created.
core@MiWiFi-RA74-srv:~$ 
```

创建之后:

```sh
core@MiWiFi-RA74-srv:~$ sudo pvs
  PV         VG       Fmt  Attr PSize  PFree 
  /dev/sda1  d202406a lvm2 a--  <3.64t <2.47t
  /dev/sdb1  d202406b lvm2 a--  <3.64t <2.47t
core@MiWiFi-RA74-srv:~$ sudo vgs
  VG       #PV #LV #SN Attr   VSize  VFree 
  d202406a   1   3   0 wz--n- <3.64t <2.47t
  d202406b   1   3   0 wz--n- <3.64t <2.47t
core@MiWiFi-RA74-srv:~$ sudo lvs
  LV           VG       Attr       LSize    Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  bf1s202406_1 d202406a -wi-a-----  100.00g                                                    
  bf2s202406_1 d202406a -wi-a-----  100.00g                                                    
  d202406a1    d202406a -wi-ao---- 1000.00g                                                    
  bf1s202406_2 d202406b -wi-a-----  100.00g                                                    
  bf2s202406_2 d202406b -wi-a-----  100.00g                                                    
  d202406b1    d202406b -wi-ao---- 1000.00g                                                    
core@MiWiFi-RA74-srv:~$ 
```

此处一共创建了 4 个 LV, 其中:

+ 准备用于 RAID 0 (允许丢失数据): `bf1s202406_1`, `bf1s202406_2`

+ 准备用于 RAID 1 (镜像备份): `bf2s202406_1`, `bf2s202406_2`

分别对应于不同的 VG, 也就是分别位于不同的硬盘上.

### 2.2 格式化 (btrfs) 并使用 RAID 0/1

参考资料: <https://wiki.archlinux.org/title/Btrfs>

btrfs 文件系统本身支持 RAID, 可以直接使用多个存储设备.

+ (1) 创建 RAID 0:

  ```sh
  core@MiWiFi-RA74-srv:~$ sudo mkfs.btrfs -L bf1s202406 -d single -m raid1 /dev/d202406a/bf1s202406_1 /dev/d202406b/bf1s202406_2
  btrfs-progs v6.8.1
  See https://btrfs.readthedocs.io for more information.

  NOTE: several default settings have changed in version 5.15, please make sure
        this does not affect your deployments:
        - DUP for metadata (-m dup)
        - enabled no-holes (-O no-holes)
        - enabled free-space-tree (-R free-space-tree)

  Label:              bf1s202406
  UUID:               81cc0dee-6463-4266-b660-9a5237888521
  Node size:          16384
  Sector size:        4096	(CPU page size: 4096)
  Filesystem size:    200.00GiB
  Block group profiles:
    Data:             single            8.00MiB
    Metadata:         RAID1             1.00GiB
    System:           RAID1             8.00MiB
  SSD detected:       no
  Zoned device:       no
  Features:           extref, skinny-metadata, no-holes, free-space-tree
  Checksum:           crc32c
  Number of devices:  2
  Devices:
    ID        SIZE  PATH                      
      1   100.00GiB  /dev/d202406a/bf1s202406_1
      2   100.00GiB  /dev/d202406b/bf1s202406_2

  core@MiWiFi-RA74-srv:~$ 
  ```

+ (2) 创建 RAID 1:

  ```sh
  core@MiWiFi-RA74-srv:~$ sudo mkfs.btrfs -L bf2s202406 -d raid1 -m raid1 /dev/d202406a/bf2s202406_1 /dev/d202406b/bf2s202406_2
  btrfs-progs v6.8.1
  See https://btrfs.readthedocs.io for more information.

  NOTE: several default settings have changed in version 5.15, please make sure
        this does not affect your deployments:
        - DUP for metadata (-m dup)
        - enabled no-holes (-O no-holes)
        - enabled free-space-tree (-R free-space-tree)

  Label:              bf2s202406
  UUID:               d2aed318-553b-4611-a135-a1e0b83aad2c
  Node size:          16384
  Sector size:        4096	(CPU page size: 4096)
  Filesystem size:    200.00GiB
  Block group profiles:
    Data:             RAID1             1.00GiB
    Metadata:         RAID1             1.00GiB
    System:           RAID1             8.00MiB
  SSD detected:       no
  Zoned device:       no
  Features:           extref, skinny-metadata, no-holes, free-space-tree
  Checksum:           crc32c
  Number of devices:  2
  Devices:
    ID        SIZE  PATH                      
      1   100.00GiB  /dev/d202406a/bf2s202406_1
      2   100.00GiB  /dev/d202406b/bf2s202406_2

  core@MiWiFi-RA74-srv:~$ 
  ```

+ (3) 扫描设备:

  ```sh
  core@MiWiFi-RA74-srv:~$ sudo btrfs device scan
  Scanning for Btrfs filesystems
  registered: /dev/mapper/d202406b-d202406b1
  registered: /dev/nvme0n1p4
  registered: /dev/mapper/d202406a-d202406a1
  registered: /dev/mapper/d202406a-bf2s202406_1
  registered: /dev/mapper/d202406a-bf1s202406_1
  registered: /dev/mapper/d202406b-bf2s202406_2
  registered: /dev/mapper/d202406b-bf1s202406_2
  core@MiWiFi-RA74-srv:~$ 
  ```

  创建挂载点:

  ```sh
  core@MiWiFi-RA74-srv:~$ sudo mkdir -p /mnt/data/bf1s
  core@MiWiFi-RA74-srv:~$ sudo mkdir -p /mnt/data/bf2s
  core@MiWiFi-RA74-srv:~$ ls -al /mnt/data
  total 32
  drwxr-xr-x. 1 root root 24 Jun 30 09:16 .
  drwxr-xr-x. 1 root root  8 Jun 20 02:26 ..
  drwxr-xr-x. 1 root root  0 Jun 30 09:16 bf1s
  drwxr-xr-x. 1 root root  0 Jun 30 09:16 bf2s
  drwxr-xr-x. 1 root root 50 Jun 23 13:33 d1
  drwxr-xr-x. 1 root root 50 Jun 23 13:39 d2
  core@MiWiFi-RA74-srv:~$ 
  ```

+ (4) 自动挂载的配置文件:

  ```sh
  core@MiWiFi-RA74-srv:~$ cat /etc/systemd/system/var-mnt-data-bf1s.mount
  [Mount]
  What=/dev/d202406a/bf1s202406_1
  Where=/var/mnt/data/bf1s
  Type=btrfs
  Options=compress=zstd,nosuid,nodev
  core@MiWiFi-RA74-srv:~$ cat /etc/systemd/system/var-mnt-data-bf1s.automount
  [Automount]
  Where=/var/mnt/data/bf1s
  TimeoutIdleSec=1h

  [Install]
  WantedBy=local-fs.target
  core@MiWiFi-RA74-srv:~$ cat /etc/systemd/system/var-mnt-data-bf2s.mount
  [Mount]
  What=/dev/d202406a/bf2s202406_1
  Where=/var/mnt/data/bf2s
  Type=btrfs
  Options=compress=zstd,nosuid,nodev
  core@MiWiFi-RA74-srv:~$ cat /etc/systemd/system/var-mnt-data-bf2s.automount
  [Automount]
  Where=/var/mnt/data/bf2s
  TimeoutIdleSec=1h

  [Install]
  WantedBy=local-fs.target
  core@MiWiFi-RA74-srv:~$ 
  ```

+ (5) 重新载入配置文件:

  ```sh
  core@MiWiFi-RA74-srv:~$ sudo systemctl daemon-reload
  ```

  挂载:

  ```sh
  core@MiWiFi-RA74-srv:~$ sudo systemctl start var-mnt-data-bf1s.mount
  core@MiWiFi-RA74-srv:~$ sudo systemctl start var-mnt-data-bf2s.mount
  ```

  查看挂载状态 (省略部分结果):

  ```sh
  core@MiWiFi-RA74-srv:~$ mount

  /dev/mapper/d202406a-bf1s202406_1 on /var/mnt/data/bf1s type btrfs (rw,nosuid,nodev,relatime,seclabel,compress=zstd:3,space_cache=v2,subvolid=5,subvol=/)
  /dev/mapper/d202406a-bf2s202406_1 on /var/mnt/data/bf2s type btrfs (rw,nosuid,nodev,relatime,seclabel,compress=zstd:3,space_cache=v2,subvolid=5,subvol=/)

  core@MiWiFi-RA74-srv:~$ df -h
  Filesystem                         Size  Used Avail Use% Mounted on

  /dev/mapper/d202406a-bf1s202406_1  200G  5.8M  198G   1% /var/mnt/data/bf1s
  /dev/mapper/d202406a-bf2s202406_1  100G  5.7M   99G   1% /var/mnt/data/bf2s
  ```

  可以看到, `bf1s` 因为使用 RAID 0 (文件只存储一份), 可用空间为 198GB.
  而 `bf2s` 因为使用 RAID 1 (镜像备份), 可用空间只有 99GB.

+ (6) 启用开机自动挂载:

  ```sh
  core@MiWiFi-RA74-srv:~$ sudo systemctl enable var-mnt-data-bf1s.automount
  Created symlink /etc/systemd/system/local-fs.target.wants/var-mnt-data-bf1s.automount → /etc/systemd/system/var-mnt-data-bf1s.automount.
  core@MiWiFi-RA74-srv:~$ sudo systemctl enable var-mnt-data-bf2s.automount
  Created symlink /etc/systemd/system/local-fs.target.wants/var-mnt-data-bf2s.automount → /etc/systemd/system/var-mnt-data-bf2s.automount.
  core@MiWiFi-RA74-srv:~$ 
  ```

### 2.3 目录权限配置 (subvol)

创建 btrfs subvol, 为了方便快照:

```sh
core@MiWiFi-RA74-srv:~$ sudo btrfs subvolume create /mnt/data/bf1s/@fct
Create subvolume '/mnt/data/bf1s/@fct'
core@MiWiFi-RA74-srv:~$ sudo btrfs subvolume create /mnt/data/bf2s/@fct
Create subvolume '/mnt/data/bf2s/@fct'
core@MiWiFi-RA74-srv:~$ sudo btrfs subvolume list -p /mnt/data/bf1s
ID 256 gen 10 parent 5 top level 5 path @fct
core@MiWiFi-RA74-srv:~$ sudo btrfs subvolume list -p /mnt/data/bf2s
ID 256 gen 11 parent 5 top level 5 path @fct
core@MiWiFi-RA74-srv:~$ 
```

设置目录权限 (为了让 `fc-test` 用户能够访问):

```sh
core@MiWiFi-RA74-srv:~$ sudo chown fc-test:fc-test /mnt/data/bf1s/@fct
core@MiWiFi-RA74-srv:~$ sudo chown fc-test:fc-test /mnt/data/bf2s/@fct
core@MiWiFi-RA74-srv:~$ ls -al /mnt/data/bf1s
total 16
drwxr-xr-x. 1 root    root    32 Jun 30 09:38 .
drwxr-xr-x. 1 root    root    24 Jun 30 09:16 ..
drwxr-xr-x. 1 fc-test fc-test  0 Jun 30 09:38 @fct
-rw-r--r--. 1 root    root     0 Jun 30 09:31 bf1s20240630
core@MiWiFi-RA74-srv:~$ ls -al /mnt/data/bf2s
total 16
drwxr-xr-x. 1 root    root    32 Jun 30 09:38 .
drwxr-xr-x. 1 root    root    24 Jun 30 09:16 ..
drwxr-xr-x. 1 fc-test fc-test  0 Jun 30 09:38 @fct
-rw-r--r--. 1 root    root     0 Jun 30 09:31 bf2s20240630
core@MiWiFi-RA74-srv:~$ 
```

### 2.4 (可选) 自动检查文件数据 (btrfs scrub)

这部分配置是可选的, 读者可以跳过本章节.

相关配置文件 (从 ArchLinux 复制过去):

```sh
core@MiWiFi-RA74-srv:~$ cat /etc/systemd/system/btrfs-scrub@.service
[Unit]
Description=Btrfs scrub on %f
ConditionPathIsMountPoint=%f
RequiresMountsFor=%f

[Service]
Nice=19
IOSchedulingClass=idle
KillSignal=SIGINT
ExecStart=/usr/sbin/btrfs scrub start -B %f
core@MiWiFi-RA74-srv:~$ cat /etc/systemd/system/btrfs-scrub@.timer
[Unit]
Description=Monthly Btrfs scrub on %f

[Timer]
OnCalendar=monthly
AccuracySec=1d
RandomizedDelaySec=1w
Persistent=true

[Install]
WantedBy=timers.target
core@MiWiFi-RA74-srv:~$ 
```

启用:

```sh
core@MiWiFi-RA74-srv:~$ sudo systemctl daemon-reload
core@MiWiFi-RA74-srv:~$ systemd-escape -p /var/mnt/data/bf1s
var-mnt-data-bf1s
core@MiWiFi-RA74-srv:~$ systemd-escape -p /var/mnt/data/bf2s
var-mnt-data-bf2s
core@MiWiFi-RA74-srv:~$ sudo systemctl enable --now btrfs-scrub@var-mnt-data-bf1s.timer
Created symlink /etc/systemd/system/timers.target.wants/btrfs-scrub@var-mnt-data-bf1s.timer → /etc/systemd/system/btrfs-scrub@.timer.
core@MiWiFi-RA74-srv:~$ sudo systemctl enable --now btrfs-scrub@var-mnt-data-bf2s.timer
Created symlink /etc/systemd/system/timers.target.wants/btrfs-scrub@var-mnt-data-bf2s.timer → /etc/systemd/system/btrfs-scrub@.timer.
core@MiWiFi-RA74-srv:~$ 
```

每月会检查一次磁盘上的文件数据, 如果损坏能及时发现 (并尝试自动修复).

### 2.5 (可选) 配置自动快照 (snapper)

参考资料: <https://wiki.archlinux.org/title/Snapper>
<http://snapper.io/>

这部分配置是可选的, 读者可以跳过本章节.

首先安装软件包:

```sh
core@MiWiFi-RA74-srv:~$ sudo rpm-ostree install snapper
```

**重启**, 然后创建配置:

```sh
core@MiWiFi-RA74-srv:~$ sudo snapper -c bf2s_fct create-config /mnt/data/bf2s/@fct
```

编辑配置文件:

```sh
core@MiWiFi-RA74-srv:~$ sudo cat /etc/snapper/configs/bf2s_fct
SUBVOLUME="/var/mnt/data/bf2s/@fct"
FSTYPE="btrfs"

QGROUP=""
SPACE_LIMIT="0.5"
FREE_LIMIT="0.2"

ALLOW_USERS=""
ALLOW_GROUPS=""

TIMELINE_CREATE="yes"
TIMELINE_CLEANUP="yes"
TIMELINE_LIMIT_HOURLY="48"
TIMELINE_LIMIT_DAILY="14"
TIMELINE_LIMIT_WEEKLY="8"
TIMELINE_LIMIT_MONTHLY="6"
TIMELINE_LIMIT_YEARLY="0"

EMPTY_PRE_POST_CLEANUP="yes"
EMPTY_PRE_POST_MIN_AGE="1800"
core@MiWiFi-RA74-srv:~$ 
```

这个配置表示: 保留最近 48 个每小时快照, 14 个每天快照,
8 个每周快照, 6 个每月快照, 0 个每年快照.

启用自动快照:

```sh
core@MiWiFi-RA74-srv:~$ sudo systemctl enable --now snapper-timeline.timer
Created symlink /etc/systemd/system/timers.target.wants/snapper-timeline.timer → /usr/lib/systemd/system/snapper-timeline.timer.
core@MiWiFi-RA74-srv:~$ sudo systemctl enable --now snapper-cleanup.timer
Created symlink /etc/systemd/system/timers.target.wants/snapper-cleanup.timer → /usr/lib/systemd/system/snapper-cleanup.timer.
core@MiWiFi-RA74-srv:~$ 
```

每小时自动创建一个快照, 旧的快照会自动清理.

----

文件系统快照, 主要用于防止 **误操作** (误删除) 造成的数据丢失.
如果不小心删除了重要文件, 可以从之前的快照之中恢复.
btrfs 文件系统基于写时复制 (CoW), 所以快照是低成本的,
只有变动 (新增/修改) 的文件才会占用额外的存储空间, 效率很高.

上面对 `bf2s` (重要数据, RAID 1) 配置了自动快照.
`bf1s` (RAID 0) 中的数据因为本来就允许丢失, 就没必要使用快照了.


## 2 安装文件服务器

参考资料: <https://jsr.io/@std/http>

### 2.1 容器镜像的制作 (deno)

相关文章: 《构建 deno/fresh 的 docker 镜像》

```sh
> cat Dockerfile
FROM quay.io/jitesoft/alpine:latest

RUN sed -i 's/ftp.halifax.rwth-aachen.de/mirrors.sjtug.sjtu.edu.cn/g' /etc/apk/repositories
RUN apk update && apk upgrade && apk add curl zstd deno icu-data-full && apk cache clean

WORKDIR /srv

RUN deno install -g --allow-net --allow-read --allow-sys jsr:@std/http/file-server

EXPOSE 4507

CMD ["/root/.deno/bin/file-server", "."]
```

构建命令:

```sh
docker build -t dhfs .
```

制作好的容器镜像:

```sh
> docker images
REPOSITORY                                TAG             IMAGE ID       CREATED         SIZE
dhfs                                      latest          eec1e8290b01   7 seconds ago   153MB
quay.io/jitesoft/alpine                   latest          1bd690c0f25c   10 days ago     7.82MB
```

导出镜像:

```sh
docker save dhfs | zstd > dhfs.tar.zst
```

### 2.2 部署容器并运行 (systemd --user / podman)

相关文章: 《使用多用户增强服务器的安全性》

参考资料: <https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html>
<https://docs.podman.io/en/latest/markdown/podman-run.1.html>

+ (1) 加载容器镜像:

  ```sh
  fc-test@MiWiFi-RA74-srv:~$ ls -lh
  -rw-r--r--. 1 fc-test fc-test 62M Jun 30 11:53 dhfs.tar.zst

  fc-test@MiWiFi-RA74-srv:~$ podman load < dhfs.tar.zst
  Getting image source signatures
  Copying blob 9aa2e4323f1d skipped: already exists  
  Copying blob feed612d9b64 skipped: already exists  
  Copying blob 299020072df1 skipped: already exists  
  Copying blob 233fd68103b4 done   | 
  Copying blob 3952a1adf654 done   | 
  Copying config eec1e8290b done   | 
  Writing manifest to image destination
  Loaded image: docker.io/library/dhfs:latest
  fc-test@MiWiFi-RA74-srv:~$ podman images
  REPOSITORY                                 TAG         IMAGE ID      CREATED      SIZE
  docker.io/library/dhfs                     latest      eec1e8290b01  6 hours ago  154 MB
  ```

+ (2) 创建数据存储目录:

  ```sh
  fc-test@MiWiFi-RA74-srv:~$ mkdir /mnt/data/bf1s/@fct/srv1
  fc-test@MiWiFi-RA74-srv:~$ mkdir /mnt/data/bf2s/@fct/srv2
  fc-test@MiWiFi-RA74-srv:~$ ls -al /mnt/data/bf1s/@fct
  total 16
  drwxr-xr-x. 1 fc-test fc-test  8 Jun 30 11:57 .
  drwxr-xr-x. 1 root    root    32 Jun 30 09:38 ..
  drwxr-xr-x. 1 fc-test fc-test  0 Jun 30 11:57 srv1
  fc-test@MiWiFi-RA74-srv:~$ ls -al /mnt/data/bf2s/@fct
  total 16
  drwxr-xr-x. 1 fc-test fc-test 28 Jun 30 11:57 .
  drwxr-xr-x. 1 root    root    32 Jun 30 09:38 ..
  drwxr-x---. 1 root    root     2 Jun 30 11:13 .snapshots
  drwxr-xr-x. 1 fc-test fc-test  0 Jun 30 11:57 srv2
  fc-test@MiWiFi-RA74-srv:~$ 
  ```

  为了方便访问, 创建符号链接:

  ```sh
  fc-test@MiWiFi-RA74-srv:~$ ln -s /mnt/data/bf1s/@fct/srv1 srv1
  fc-test@MiWiFi-RA74-srv:~$ ln -s /mnt/data/bf2s/@fct/srv2 srv2
  fc-test@MiWiFi-RA74-srv:~$ ls -al

  lrwxrwxrwx. 1 fc-test fc-test       24 Jun 30 11:59 srv1 -> /mnt/data/bf1s/@fct/srv1
  lrwxrwxrwx. 1 fc-test fc-test       24 Jun 30 11:59 srv2 -> /mnt/data/bf2s/@fct/srv2
  ```

+ (3) 运行容器的配置文件:

  ```sh
  fc-test@MiWiFi-RA74-srv:~$ cat ~/.config/containers/systemd/dhfs.container
  [Unit]
  Description=deno http file server
  Wants=network-online.target
  After=network-online.target

  StartLimitIntervalSec=5s
  StartLimitBurst=1

  [Container]
  Image=dhfs
  PublishPort=2406:4507
  Pull=never

  Volume=/mnt/data/bf1s/@fct/srv1:/srv/1:z,ro
  Volume=/mnt/data/bf2s/@fct/srv2:/srv/2:z,ro

  [Service]
  Restart=always

  [Install]
  WantedBy=default.target
  fc-test@MiWiFi-RA74-srv:~$ 
  ```

  其中 `Volume=` 的 `ro` 选项, 表示容器内的程序对文件 **只读**.
  这是一种安全措施:
  假如容器内的程序, 因为存在安全漏洞, 被黑客入侵了, 那么黑客仍然无法修改文件.

+ (4) 启动运行:

  ```sh
  fc-test@MiWiFi-RA74-srv:~$ systemctl --user daemon-reload
  fc-test@MiWiFi-RA74-srv:~$ systemctl --user status dhfs
  ○ dhfs.service - deno http file server
      Loaded: loaded (/var/home/fc-test/.config/containers/systemd/dhfs.container; generated)
      Drop-In: /usr/lib/systemd/user/service.d
              └─10-timeout-abort.conf
      Active: inactive (dead)
  fc-test@MiWiFi-RA74-srv:~$ systemctl --user start dhfs
  ```


## 3 测试

文件服务器的安装配置已经全部完成了, 现在试用一下.

### 3.1 上传文件 (sftp)

使用 `sftp` 连接服务器并上传文件:

```sh
> sftp fc-server
Connected to fc-server.
sftp> cd srv2
sftp> mkdir apk
sftp> cd apk
sftp> put fdroid-1.20.0.apk
Uploading fdroid-1.20.0.apk to /var/mnt/data/bf2s/@fct/srv2/apk/fdroid-1.20.0.apk
fdroid-1.20.0.apk                             100%   11MB  10.8MB/s   00:01
sftp> 
```

### 3.2 访问下载文件 (浏览器 / HTTP)

在浏览器中打开页面:

![测试 (1)](./图/3-t-1.png)

重复上述操作, 上传多个文件:

![测试 (2)](./图/3-t-2.png)


## 4 总结与展望

本文安装配置了一个在局域网内部使用的本地 **文件存储服务器**,
使用 sftp 上传文件, HTTP 下载文件.
存储的文件分为 2 类: 重要数据 (不允许丢失, RAID 1), 以及允许丢失的数据 (RAID 0), 分别使用不同的存储策略.
对于重要数据配置了每小时的自动快照 (snapper), 防止误操作造成的数据丢失.
每个月自动检查 (读取) 一次全盘数据 (btrfs scrub), 可以发现底层的静默数据错误.

在 LVM 和 btrfs 的加持之下, 虽然只有 2 块硬盘,
却可以将其一部分作为 RAID 0 使用, 另一部分作为 RAID 1 使用,
并且支持存储空间的动态分配 (在线扩容), 后续添加新的硬盘也很方便.
这种软件层面的高度灵活, 是硬件 RAID 难以实现的,
也就更适合没几块硬盘的窝等穷人.

sftp 使用 SSH 公钥认证登录, 不使用密码, 提高了服务器的安全性.
HTTP 服务器使用 deno 标准库自带的轻量程序, 安装方便.
deno 运行在容器之中, 对数据目录 **只读** 访问, 提高了安全性.

本文的存储方案, 没有访问权限控制, 只要在局域网内部, 都可以访问下载文件.
上传文件也不太方便.
本文为了安装配置的简单方便, 牺牲了功能的丰富程度,
这些方面后续可以考虑改进.

----

本文使用 CC-BY-SA 4.0 许可发布.
