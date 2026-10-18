# 使用 SSH 安装 ArchLinux (cloud-init)

最近又发现一种有趣的安装 ArchLinux 的方式:
通过 `cloud-init` 在启动时直接注入 SSH 公钥, 然后 SSH 连接到目标机器, 再进行 ArchLinux 安装.

cloud-init 在启动时自动初始化系统配置的方式, 有点类似 Fedora CoreOS 的 Ignition.

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 103 号作品. )


## 目录

+ 1 安装过程

  - 1.1 准备 cloud-init 配置文件 (iso 光盘镜像)
  - 1.2 创建并启动 VirtualBox 虚拟机
  - 1.3 安装 ArchLinux 到磁盘 (archinstall)
  - 1.4 安装后的系统配置

+ 2 重启测试

+ 3 总结与展望

+ 附录 1 user_configuration.json (仅供参考)

----

相关文章:

+ 《离线安装 ArchLinux 操作系统 (DVD 光盘)》

  TODO

+ 《流浪 Linux: 外置 USB SSD 安装 ArchLinux》

  TODO

+ 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》

  TODO

+ 《流浪 ArchLinux 后续: 修复 fstrim USB SSD》

  TODO

+ 《低功耗低成本 PC (可更换内存条) 推荐 (笔记本, 小主机)》

  TODO

+ 《安装 gitea 代码平台 (Fedora CoreOS)》

  TODO

+ 《用容器编译 VirtualBox 虚拟机软件 (ArchLinux, podman)》

  TODO

参考资料:

+ <https://wiki.archlinux.org/title/Install_Arch_Linux_via_SSH>
+ <https://wiki.archlinux.org/title/Archinstall>
+ <https://wiki.archlinux.org/title/Cloud-init>
+ <https://wiki.archlinux.org/title/VirtualBox/Install_Arch_Linux_as_a_guest>
+ <https://cloud-init.io/>
+ <https://archlinux.org/download/>
+ <https://mirrors.tuna.tsinghua.edu.cn/archlinux/iso/2026.10.01/>
+ <https://mirrors.tuna.tsinghua.edu.cn/help/archlinux/>
+ <https://www.virtualbox.org/>
+ <https://coreos.github.io/ignition/>
+ <https://wiki.archlinux.org/title/OpenSSH>
+ <https://man.archlinux.org/man/ssh_config.5>


## 1 安装过程

为了方便演示, 此处使用 VirtualBox 虚拟机.
本文的安装方法也可以用于 物理机, 并且, 物理机只需插个 网线, 无需 显示器.

### 1.1 准备 cloud-init 配置文件 (iso 光盘镜像)

首先, 创建新的 SSH 密钥, 比如:

```sh
ssh-keygen -t ed25519 -C arch-test-20261013 -f ~/.ssh/id_ed25519-arch-test-20261013
```

生成的公钥 (举栗):

```sh
> cat ~/.ssh/id_ed25519-arch-test-20261013.pub
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMNR2MmC+gi0YK5hssOdW2Awjb5Z8TscZP9w9EaNAMko arch-test-20261013
```

----

然后, 编写配置文件:

+ 文件 `user-data`:

```yml
#cloud-config
users:
  - name: root
    ssh_authorized_keys:
      - ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMNR2MmC+gi0YK5hssOdW2Awjb5Z8TscZP9w9EaNAMko arch-test-20261013
```

注意此处的 `#cloud-config` 不可缺少, 必需原样照着写.
记得把 公钥 换成自己生成的.

+ 文件 `network-config`:

```yml
version: 2
config: disabled
```

+ 文件 `user_configuration.json` (可选, 内容详见 附录 1)

完整的文件列表:

```sh
> ls -l

-rw-r--r-- 1 s2 s2      0 10月13日 21:06 meta-data
-rw-r--r-- 1 s2 s2     28 10月13日 21:07 network-config
-rw-r----- 1 s2 s2   6571 10月13日 22:50 user_configuration.json
-rw-r--r-- 1 s2 s2    169 10月13日 21:11 user-data
```

注意 `meta-data` (空), `user-data`, `network-config` 这 3 个文件是 必需 的.

----

安装软件包 (光盘镜像制作工具):

```sh
sudo pacman -S libisoburn
```

然后制作 iso:

```sh
xorrisofs -output cloud-init-arch-test-20261013.iso -volid CIDATA -joliet -rational-rock meta-data user-data network-config user_configuration.json
```

其中 `cloud-init-arch-test-20261013.iso` 可以改成自己喜欢的名称, 别的参数照抄.

```sh
> ls -l

-rw-r--r-- 1 s2 s2 387072 10月13日 23:00 cloud-init-arch-test-20261013.iso
```

此处选择使用 iso 光盘镜像文件, 是因为虚拟机使用起来方便.
如果是 物理机 安装, 也可以制作类似的 FAT32 格式的 U 盘.
具体参考 ArchWiki 上的相关文档.

### 1.2 创建并启动 VirtualBox 虚拟机

创建一个新的 VirtualBox 虚拟机, 比如:

![虚拟机配置 (1)](./图/12-v-1.png)

此处给虚拟机分配了 32GB 内存, 8 核 CPU, 200GB 磁盘空间, 可以按需调整.

![虚拟机配置 (1)](./图/12-v-2.png)

重点是, 这个虚拟机有 2 个 光驱, 对应的光盘镜像文件分别为 `archlinux-2026.10.01-x86_64.iso` (从官网下载的系统安装光盘), `cloud-init-arch-test-20261013.iso` (章节 1.1 制作的).

----

好, 虚拟机, 启动 !!

### 1.3 安装 ArchLinux 到磁盘 (archinstall)

本机 SSH 配置 (举栗):

```sh
> cat ~/.ssh/config

Host arch-test-20261013
    HostName 192.168.31.22
    User root
    IdentityFile ~/.ssh/id_ed25519-arch-test-20261013
```

其中 `192.168.31.22` 是虚拟机的 IP 地址.

```sh
> ssh arch-test-20261013
To install Arch Linux follow the installation guide:
https://wiki.archlinux.org/title/Installation_guide

For Wi-Fi, authenticate to the wireless network using the iwctl utility.
For mobile broadband (WWAN) modems, connect with the mmcli utility.
Ethernet, WLAN and WWAN interfaces using DHCP should work automatically.

After connecting to the internet, the installation guide can be accessed
via the convenience script Installation_guide.

                                          
root@archiso ~ # id
uid=0(root) gid=0(root) groups=0(root)
root@archiso ~ # pwd
/root
root@archiso ~ # uname -a
Linux archiso 7.2.7-arch1-1 #1 SMP PREEMPT_DYNAMIC Mon, 21 Sep 2026 18:51:14 +0000 x86_64 GNU/Linux
root@archiso ~ # free -h
               total        used        free      shared  buff/cache   available
Mem:            31Gi       605Mi        30Gi        15Mi       635Mi        30Gi
Swap:             0B          0B          0B
root@archiso ~ # 
```

SSH 连接成功 !

----

检查磁盘:

```sh
root@archiso ~ # fdisk -l
Disk /dev/sda: 200 GiB, 214748364800 bytes, 419430400 sectors
Disk model: VBOX HARDDISK   
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
```

挂载光盘:

```sh
root@archiso ~ # ls -l /dev/sr*
brw-rw---- 1 root optical 11, 0 Oct 13 15:08 /dev/sr0
brw-rw---- 1 root optical 11, 1 Oct 13 15:08 /dev/sr1
root@archiso ~ # mkdir /tmp/config
root@archiso ~ # mount -o ro /dev/sr1 /tmp/config
root@archiso ~ # ls -al /tmp/config
total 10
dr-xr-xr-x  1 root root 2048 Oct 13 15:00 .
drwxrwxrwt 11 root root  220 Oct 13 15:09 ..
-r--r--r--  1 root root    0 Oct 13 13:06 meta-data
-r--r--r--  1 root root   28 Oct 13 13:07 network-config
-r--r--r--  1 root root  169 Oct 13 13:11 user-data
-r--r--r--  1 root root 6571 Oct 13 14:50 user_configuration.json
```

----

配置 国内 镜像:

```sh
root@archiso ~ # cat /etc/pacman.d/mirrorlist
Server = https://mirrors.tuna.tsinghua.edu.cn/archlinux/$repo/os/$arch
```

开始安装:

```sh
archinstall --config /tmp/config/user_configuration.json
```

注意: 此处加载了 `user_configuration.json` 配置文件, 这个文件可以在 archinstall 界面保存获得.
加载配置之后, 保存时的配置就有了, 可以避免重新配置一堆选项, 减少重复操作.

如果不加载配置文件, 也可以, 直接 `archinstall` 即可.

![配置用户](./图/13-a-1.png)

上述配置文件不包含用户, 所以此处还需要 手动创建一个新用户, 比如 `core`, 配置允许 `sudo` 权限.

配置好后, 就可以选择左侧的 `Install` 开始安装啦 ~

![开始安装](./图/13-a-2.png)

### 1.4 安装后的系统配置

![安装完成](./图/14-a-1.png)

安装完成后, 选择第 3 项 (chroot), 进入系统进行配置.

----

首先, 配置 免密 sudo:

```sh
[root@archiso ~]# EDITOR=nano visudo
```

结果:

```sh
[root@archiso ~]# cat /etc/sudoers

省略

## Uncomment to allow members of group wheel to execute any command
# %wheel ALL=(ALL:ALL) ALL

## Same thing without a password
%wheel ALL=(ALL:ALL) NOPASSWD: ALL
```

注意 `%wheel ALL=(ALL:ALL) NOPASSWD: ALL` 这一行配置.

然后删除不需要的 sudo 配置文件:

```sh
[root@archiso ~]# rm /etc/sudoers.d/00_core
```

----

其次, 配置 SSH 公钥 登录.

```sh
[root@archiso ~]# systemctl enable sshd
Created symlink '/etc/systemd/system/multi-user.target.wants/sshd.service' → '/usr/lib/systemd/system/sshd.service'.
```

切换到 core 用户进行配置:

```sh
[root@archiso ~]# su core
[core@archiso root]$ cd
[core@archiso ~]$ id
uid=1000(core) gid=1000(core) groups=1000(core),998(wheel)
[core@archiso ~]$ pwd
/home/core
```

写入公钥:

```sh
[core@archiso ~]$ cat ~/.ssh/authorized_keys
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMNR2MmC+gi0YK5hssOdW2Awjb5Z8TscZP9w9EaNAMko arch-test-20261013
```

退出 core 用户:

```sh
[core@archiso ~]$ exit
exit
[root@archiso ~]# 
```

退出 chroot:

```sh
[root@archiso ~]# exit
exit
Syncing the system...
Installation completed without any errors.
Log files temporarily available at /var/log/archinstall.
You may reboot when ready.

archinstall --config /tmp/config/user_configuration.json  27.25s user 25.79s system 2% cpu 31:41.34 total
root@archiso ~ # 
```


## 2 重启测试

关机:

```sh
root@archiso ~ # systemctl poweroff
```

然后移除虚拟机的 iso 光盘, 启动.

```sh
> ssh arch-test-20261013
[core@arch-test-20261013 ~]$ id
uid=1000(core) gid=1000(core) groups=1000(core),998(wheel)
[core@arch-test-20261013 ~]$ pwd
/home/core
[core@arch-test-20261013 ~]$ uname -a
Linux arch-test-20261013 7.2.9-arch1-1 #1 SMP PREEMPT_DYNAMIC Sat, 03 Oct 2026 11:43:28 +0000 x86_64 GNU/Linux
[core@arch-test-20261013 ~]$ free -h
               total        used        free      shared  buff/cache   available
Mem:            31Gi       571Mi        30Gi       696Ki       200Mi        30Gi
Swap:          4.0Gi          0B       4.0Gi
[core@arch-test-20261013 ~]$ df -h
Filesystem      Size  Used Avail Use% Mounted on
dev              16G     0   16G   0% /dev
run              16G  688K   16G   1% /run
/dev/sda2       199G  1.7G  196G   1% /
tmpfs            16G     0   16G   0% /dev/shm
none            1.0M     0  1.0M   0% /run/credentials/systemd-journald.service
tmpfs            16G     0   16G   0% /tmp
/dev/sda2       199G  1.7G  196G   1% /var/log
/dev/sda2       199G  1.7G  196G   1% /home
/dev/sda2       199G  1.7G  196G   1% /var/cache/pacman/pkg
/dev/sda1      1022M   44M  979M   5% /boot
none            1.0M     0  1.0M   0% /run/credentials/getty@tty1.service
tmpfs           3.2G  4.0K  3.2G   1% /run/user/1000
[core@arch-test-20261013 ~]$ sudo id
uid=0(root) gid=0(root) groups=0(root)
```

成功 ! 撒花 ~


## 3 总结与展望

这是系列文章中最新的一篇关于安装 ArchLinux 操作系统的, 也是窝认为目前为止最好, 最 优雅 的安装 ArchLinux 的姿势了, 推荐.

全程 SSH 连接, 进行安装, 创建 core 用户.
安装完成后, SSH 公钥 登录, 免密 sudo.
所以, ArchLinux 有了类似 CoreOS 的使用体验 ! (狗头)

本次是最小安装, 可以看到, 安装完成后, 内存 占用不到 600MB, 磁盘占用不到 2GB, 还是很小巧的.
在此基础上, 可以很方便的安装自己所需的软件包, 打造自己个性化的系统.


## 附录 1 user_configuration.json (仅供参考)

```json
{
    "archinstall_language": "English",
    "bootloader_config": {
        "bootloader": "Grub",
        "removable": false,
        "uki": false
    },
    "custom_commands": [],
    "disk_config": {
        "btrfs_options": {
            "snapshot_config": null
        },
        "config_type": "default_layout",
        "device_modifications": [
            {
                "device": "/dev/sda",
                "partitions": [
                    {
                        "btrfs": [],
                        "dev_path": null,
                        "flags": [
                            "boot"
                        ],
                        "fs_type": "fat32",
                        "mount_options": [],
                        "mountpoint": "/boot",
                        "obj_id": "1ce278b6-b6ed-4290-8bc5-383f0ee84c5a",
                        "size": {
                            "sector_size": {
                                "unit": "B",
                                "value": 512
                            },
                            "unit": "GiB",
                            "value": 1
                        },
                        "start": {
                            "sector_size": {
                                "unit": "B",
                                "value": 512
                            },
                            "unit": "MiB",
                            "value": 1
                        },
                        "status": "create",
                        "type": "primary"
                    },
                    {
                        "btrfs": [
                            {
                                "mountpoint": "/",
                                "name": "@"
                            },
                            {
                                "mountpoint": "/home",
                                "name": "@home"
                            },
                            {
                                "mountpoint": "/var/log",
                                "name": "@log"
                            },
                            {
                                "mountpoint": "/var/cache/pacman/pkg",
                                "name": "@pkg"
                            }
                        ],
                        "dev_path": null,
                        "flags": [],
                        "fs_type": "btrfs",
                        "mount_options": [
                            "compress=zstd"
                        ],
                        "mountpoint": null,
                        "obj_id": "5a43546c-447a-4dc0-b0fb-1a0c8f42027a",
                        "size": {
                            "sector_size": {
                                "unit": "B",
                                "value": 512
                            },
                            "unit": "B",
                            "value": 213673574400
                        },
                        "start": {
                            "sector_size": {
                                "unit": "B",
                                "value": 512
                            },
                            "unit": "B",
                            "value": 1074790400
                        },
                        "status": "create",
                        "type": "primary"
                    }
                ],
                "wipe": true
            }
        ]
    },
    "firmware_optdeps": [],
    "hostname": "arch-test-20261013",
    "kernels": [
        "linux"
    ],
    "locale_config": {
        "console_font": "default8x16",
        "kb_layout": "us",
        "sys_enc": "UTF-8",
        "sys_lang": "en_US.UTF-8"
    },
    "mirror_config": {
        "custom_repositories": [],
        "custom_servers": [],
        "mirror_regions": {
            "China": [
                "http://mirrors.163.com/archlinux/$repo/os/$arch",
                "http://mirrors.ustc.edu.cn/archlinux/$repo/os/$arch",
                "https://mirrors.ustc.edu.cn/archlinux/$repo/os/$arch",
                "http://mirrors.tuna.tsinghua.edu.cn/archlinux/$repo/os/$arch",
                "https://mirrors.tuna.tsinghua.edu.cn/archlinux/$repo/os/$arch",
                "http://mirrors.hust.edu.cn/archlinux/$repo/os/$arch",
                "https://mirrors.hust.edu.cn/archlinux/$repo/os/$arch",
                "http://mirrors.zju.edu.cn/archlinux/$repo/os/$arch",
                "http://mirror.lzu.edu.cn/archlinux/$repo/os/$arch",
                "https://mirrors.xjtu.edu.cn/archlinux/$repo/os/$arch",
                "https://mirrors.sjtug.sjtu.edu.cn/archlinux/$repo/os/$arch",
                "http://mirrors.bfsu.edu.cn/archlinux/$repo/os/$arch",
                "https://mirrors.bfsu.edu.cn/archlinux/$repo/os/$arch",
                "http://mirrors.nju.edu.cn/archlinux/$repo/os/$arch",
                "https://mirrors.nju.edu.cn/archlinux/$repo/os/$arch",
                "http://mirrors.hit.edu.cn/archlinux/$repo/os/$arch",
                "https://mirrors.hit.edu.cn/archlinux/$repo/os/$arch",
                "http://mirrors.wsyu.edu.cn/archlinux/$repo/os/$arch",
                "https://mirrors.wsyu.edu.cn/archlinux/$repo/os/$arch",
                "http://mirrors.aliyun.com/archlinux/$repo/os/$arch",
                "https://mirrors.aliyun.com/archlinux/$repo/os/$arch",
                "http://mirrors.shanghaitech.edu.cn/archlinux/$repo/os/$arch",
                "https://mirrors.shanghaitech.edu.cn/archlinux/$repo/os/$arch",
                "http://mirrors.jlu.edu.cn/archlinux/$repo/os/$arch",
                "https://mirrors.jlu.edu.cn/archlinux/$repo/os/$arch",
                "http://mirror.nyist.edu.cn/archlinux/$repo/os/$arch",
                "https://mirror.nyist.edu.cn/archlinux/$repo/os/$arch",
                "https://mirrors.qlu.edu.cn/archlinux/$repo/os/$arch"
            ]
        },
        "optional_repositories": []
    },
    "network_config": {
        "type": "nm"
    },
    "ntp": true,
    "packages": [
        "nano",
        "openssh"
    ],
    "pacman_config": {
        "color": true,
        "parallel_downloads": 5
    },
    "profile_config": {
        "gfx_driver": null,
        "greeter": null,
        "profile": {
            "custom_settings": {},
            "details": [],
            "main": "Minimal"
        }
    },
    "script": null,
    "services": [],
    "swap": {
        "algorithm": "zstd",
        "enabled": true
    },
    "timezone": "UTC",
    "version": "4.5"
}
```

----

本文使用 CC-BY-SA 4.0 许可发布.
