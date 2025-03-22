# 流浪 Linux: 外置 USB SSD 安装 ArchLinux

**注: ArchLinux 系统为滚动更新, 变化很快,
所以本文中的安装方法可能很快就过时了, 仅供参考.**
实际安装时建议去阅读官方文档.

最近, 突然 (也没有那么突然) 有了一大堆 PC:
4 个笔记本, 2 个台式主机 (M-ATX 主板), 1 个小主机 (迷你主机).
嗯, 多到用不过来.
但是, 窝又不能固定使用其中一个, 可能今天用这个, 明天又用那个.

如果在每个上面都安装 ArchLinux, 太麻烦了, 并且数据不互通, 实际使用就更加麻烦.
恰好, 有一个空闲的 1TB SSD (2.5 英寸 SATA), 就用这个来实现 **流浪 Linux** 吧:
插到哪里都能用 !

主机 (台式机, 笔记本, 小主机) 就像恒星, SSD 就像行星, 那条 USB 数据线,
嗯, 就像引力 (狗头)

8 万亿比特, 从母系统出发, 跨越 3000 亿 CPU 时钟周期的时空,
到达另一颗邻居 "恒星", 史称流浪 Linux 计划.

----

等下, 为什么要安装 ArchLinux ? 嗯, 因为加法比减法容易.

在软件包已经编译好的 GNU/Linux 操作系统中, ArchLinux 基本上算是安装最复杂,
同时也是可定制程度最高的发行版.
如果想获得更高的修改/定制能力,
那么基本上只能用 Gentoo, LFS 这种直接从源代码编译的了,
当然从源代码编译会比 ArchLinux 更麻烦很多倍.

ArchLinux 的基础系统 (base) 很小, 大约只有一百多个软件包 (目前约 143 个).
其余软件包都是需要哪个再安装哪个, 所以多余的软件包很少.
像 Debian/Fedora/Ubuntu 这种发行版, 其基础系统就有好几千个软件包,
如果遇到不想要的软件, 还要一个一个去卸载, 很麻烦 (加法比减法容易).

另外, 窝使用 ArchLinux 好多年了, 习惯了
(比如窝的 胖喵拼音 就优先适配 ArchLinux GNOME).
老了, 不想再换系统了, 所以继续使用 ArchLinux (狗头)

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 65 号作品. )

----

相关文章:

+ 《安装 Fedora CoreOS 操作系统》

  TODO

+ 《胖喵拼音输入法 (pmim-ibus) 安装说明》

  TODO

参考资料:

+ <https://archlinux.org/>
+ <https://www.gentoo.org/>
+ <https://archlinux.org/download/>
+ <https://wiki.archlinux.org/title/Installation_guide>
+ <https://wiki.archlinux.org/title/GRUB>
+ <https://wiki.archlinux.org/title/Users_and_groups>
+ <https://wiki.archlinux.org/title/Sudo>


## 目录

+ 1 硬件设备

+ 2 安装准备

  - 2.1 下载 ArchLinux 安装 iso 镜像
  - 2.2 制作安装 U 盘
  - 2.3 分区准备

+ 3 安装过程

  - 3.1 从安装 U 盘启动
  - 3.2 主要安装命令
  - 3.3 进入 GNOME 桌面环境
  - 3.4 安装中文字体和 ibus 输入法
  - 3.5 安装胖喵拼音 (可选)
  - 3.6 安装别的应用软件 (可选)

+ 4 流浪测试

  - 4.1 小主机 (7 号) CPU r7-5825u
  - 4.2 笔记本 (4 号) CPU i5-6200u
  - 4.3 笔记本 (9 号) CPU r5-5625u
  - 4.4 台式机 (6 号) CPU r5-5600g

+ 5 总结与展望

+ 附录 1 pacman 安装软件包日志


## 1 硬件设备

安装 ArchLinux 在小主机 (GMK M5 plus) 上进行, 具体硬件配置为:
CPU AMD r7-5825u (8 核 16 线程), 内存 64GB DDR4-3200 (32GB x2).

安装目标: 1TB SSD (2.5 寸 SATA), 使用 USB 3.0 (type-C) 硬盘盒.

安装 U 盘: 普通 16GB 老旧 U 盘.

![小主机](./图/1-h-1.png)


## 2 安装准备

在实际开始安装前, 需要做一些准备工作.

### 2.1 下载 ArchLinux 安装 iso 镜像

首先从官网下载安装 iso 镜像文件: <https://archlinux.org/download/>

这个安装 iso 每个月都会更新, 下载最新的即可.

推荐使用国内镜像, 比如: <https://mirrors.tuna.tsinghua.edu.cn/archlinux/iso/2025.01.01/>

下载后检查文件是否损坏: <https://mirrors.tuna.tsinghua.edu.cn/archlinux/iso/2025.01.01/sha256sums.txt>

```
74b109b4b36d20bef8f4203e30b8d223e0ab297a09d1a1213a02894472aa530a  archlinux-2025.01.01-x86_64.iso
74b109b4b36d20bef8f4203e30b8d223e0ab297a09d1a1213a02894472aa530a  archlinux-x86_64.iso
6e1cc58adf2afcfa1884a3d452704a63b5e2c7cd38622d32a9a20ac285dd7ffd  archlinux-bootstrap-2025.01.01-x86_64.tar.zst
6e1cc58adf2afcfa1884a3d452704a63b5e2c7cd38622d32a9a20ac285dd7ffd  archlinux-bootstrap-x86_64.tar.zst
```

执行命令:

``` sh
> ls -l archlinux-2025.01.01-x86_64.iso
-rw-r--r-- 1 s2 s2 1231060992  1月25日 13:56 archlinux-2025.01.01-x86_64.iso
> sha256sum archlinux-2025.01.01-x86_64.iso
74b109b4b36d20bef8f4203e30b8d223e0ab297a09d1a1213a02894472aa530a  archlinux-2025.01.01-x86_64.iso
```

很好, 文件数据完整.

### 2.2 制作安装 U 盘

需要使用下载的 iso 镜像文件, 制作一个可以启动的安装 U 盘.

**警告: 此过程会删除 U 盘上的所有数据文件, 如果有重要数据请提前备份 !!**

推荐使用图形界面软件 Fedora Media Writer, 可以从 flathub 安装:
<https://flathub.org/zh-Hans/apps/org.fedoraproject.MediaWriter>

![制作安装 U 盘 (1)](./图/22-p-1.png)

选择 U 盘以及刚才下载的 iso 文件, 点击 "写入" 开始制作.

![制作安装 U 盘 (2)](./图/22-p-2.png)

正在写入中.

![制作安装 U 盘 (3)](./图/22-p-3.png)

制作完成.

----

使用命令行也可以制作安装 U 盘, 比如:

**警告: 请确保命令输入正确, 特别是选择了正确的目标设备 (`of=`) !
误操作可能造成很严重的数据丢失 !!**

```sh
sudo dd if=archlinux-2025.01.01-x86_64.iso of=/dev/sdb status=progress
```

注意此处 `/dev/sdb` 是目标设备 (U 盘), **请根据具体情况修改 !!**
如果输入错误, 可能造成整个分区表都没了, 丢失所有数据 !

为了避免这个风险, 建议使用上面的图形界面软件.

----

在 Windows 推荐使用 Rufus 制作安装 U 盘: <https://rufus.ie/>

### 2.3 分区准备

**警告: 此过程可能会丢失 SSD 上的全部数据, 请提前备份重要数据 !!**

提前对目标 SSD 进行分区格式化. 窝这里使用 gparted 分区好了:

![分区](./图/23-p-1.png)

这个分区方案仅供参考 ! Linux 在分区方面是非常灵活的, 有各种五花八门的玩法.

分区表: `GPT` (用于 UEFI 启动) (必需)

+ 分区 1 (必需): EFI 系统分区 (ESP)

  容量几十 MB 即可, 格式化为 FAT32, 并设置好标识 (esp, boot).
  这个分区是 UEFI 启动所必需的, 如果没有, 系统就无法启动.

+ 分区 2 (可选): `/boot` 分区 (启动分区)

  容量 1GB ~ 2GB 即可, 不需要太大. 格式化为 `ext4` (推荐).
  这个分区存放 grub 引导程序 (以及配置), Linux 内核镜像,
  initcpio (initrd) 等系统启动所必需的文件.

  这个分区不是必需的, 可以和前面的 esp 分区合并,
  也可以和后面的 btrfs 数据分区合并,
  但是窝还是喜欢把 /boot 单独拿出来.

+ 分区 3 (必需): 主要数据分区 (btrfs)

  剩余的容量全部分给这个分区, 格式化为 `btrfs` (推荐), 并使用 subvol.

  窝觉得 btrfs 功能强大, 很好用, 并且已经使用好几年了.
  这里窝提前创建两个 subvol, 计划分别挂载到 `/` (根分区) 和 `/home`.
  subvol 使用上和分区差不多, 但是不同 subvol 占用的存储空间是统一分配的,
  这样就不会遇到多个分区容量分的太大或太小的麻烦.
  其中 `/` 用来装系统, 自己的文件数据都放在 `/home`,
  这样如果万一系统坏了, 方便修复 (虽然最近几年窝都没遇到系统损坏).

----

最后多说一句, **不要创建 swap 分区**.
swap 用于内存不够的时候, 充当虚拟内存, 这个基本用不到.
但是, swap 会缩短 SSD 的寿命 (因为有大量写入) !!
如果以后真的需要使用 swap, 在 btrfs 里面创建 **swap 文件** 是更好的选择.


## 3 安装过程

准备完毕, 可以开始安装了.

为了方便, 可以在手机上打开官方安装指导文档: <https://wiki.archlinux.org/title/Installation_guide>

![指导文档](./图/3-g-1.jpg)

### 3.1 从安装 U 盘启动

关机, 将上面制作好的安装 U 盘插到小主机, 开机, 按 ESC 键进入 BIOS 设置.
(在开机时, 需要快速连续多次按 ESC 键)

![BIOS 设置 (1)](./图/31-b-1.png)

设置从 U 盘启动:

![BIOS 设置 (2)](./图/31-b-2.png)

保存并重启:

![BIOS 设置 (3)](./图/31-b-3.png)

如果无法启动, 需要在 BIOS 设置中关闭 **安全启动** (secure boot).

----

![ArchLinux 安装 (1)](./图/31-i-1.png)

ArchLinux 安装启动界面.

![ArchLinux 安装 (2)](./图/31-i-2.png)
![ArchLinux 安装 (3)](./图/31-i-3.png)

启动中.

![ArchLinux 安装 (4)](./图/31-i-4.png)

启动完毕, 好了, 我们来到了 root 命令行.

### 3.2 主要安装命令

+ (1) 验证从 UEFI 正常启动:

  ```sh
  # cat /sys/firmware/efi/fw_platform_size
  64
  ```

  这里显示 64, 很好, 说明是 64 位 UEFI 平台.

+ (2) 检查网络连接是否正常, 比如:

  ```sh
  ping www.baidu.com
  ```

  ![网络正常](./图/32-i-1.png)

  这边用的有线以太网, 启动后直接就连网好了.

+ (3) 查看系统时间是否正常:

  ```sh
  timedatectl
  ```

+ (4) 挂载分区 (这部分命令仅供参考, 请根据具体分区情况修改).

  使用 `fdisk -l` 以及 `blkid` 查看磁盘分区情况.
  然后挂载 (根目录 `/`):

  ```sh
  mount /dev/sda3 /mnt -o subvol=@root_arch202501c7,compress=zstd
  ```

  按照 ArchLinux 的安装方法,
  安装之后系统的 `/` 在安装时应该挂载到 `/mnt`.
  `-o subvol=` 指定 subvol 的名称,
  `compress=zstd` 选项启用文件系统压缩.
  btrfs 对 SSD 有专门优化, 启用压缩可以减少写入, 延长 SSD 寿命.

  继续挂载 (`/home`):

  ```sh
  # mkdir /mnt/boot
  # mkdir /mnt/home
  # mount /dev/sda3 /mnt/home -o subvol=@home202501c7,compress=zstd,nosuid,nodev
  ```

  挂载指定 subvol 到 `/home`.
  `nosuid,nodev` 可以使系统更安全.

  继续挂载 (`/boot`, `/boot/efi`):

  ```sh
  # mount /dev/sda2 /mnt/boot -o nosuid,nodev,noatime
  # mkdir /mnt/boot/efi
  # mount /dev/sda1 /mnt/boot/efi -o nosuid,nodev,noatime
  ```

  将之前准备好的 ext4 分区挂载到 `/boot`,
  ESP 分区挂载到 `/boot/efi`.

  挂载完毕, 使用 `mount` 命令查看当前挂载状态:

  ![挂载详情](./图/32-i-2.png)

+ (5) 设置软件源 (软件包仓库地址):

  ```sh
  # reflector --verbose --country "China" -l 20 -p https --sort rate --save /etc/pacman.d/mirrorlist
  [2025-01-31 20:44:53] INFO: rating 9 mirror(s) by download speed
  [2025-01-31 20:44:53] INFO: Server                                                     Rate       Time
  [2025-01-31 20:44:53] INFO: https://mirrors.tuna.tsinghua.edu.cn/archlinux/  84558.85 KiB/s     0.09 s
  [2025-01-31 20:44:54] INFO: https://mirrors.aliyun.com/archlinux/             8444.93 KiB/s     0.91 s
  [2025-01-31 20:44:55] INFO: https://mirrors.jlu.edu.cn/archlinux/             6694.63 KiB/s     1.15 s
  [2025-01-31 20:44:56] INFO: https://mirrors.nju.edu.cn/archlinux/             6682.76 KiB/s     1.16 s
  [2025-01-31 20:44:57] INFO: https://mirrors.xjtu.edu.cn/archlinux/            6943.86 KiB/s     1.11 s
  [2025-01-31 20:44:59] INFO: https://mirrors.hust.edu.cn/archlinux/            6544.83 KiB/s     1.18 s
  [2025-01-31 20:45:00] INFO: https://mirrors.shanghaitech.edu.cn/archlinux/    6090.84 KiB/s     1.27 s
  [2025-01-31 20:45:02] INFO: https://mirrors.qlu.edu.cn/archlinux/            17097.03 KiB/s     0.45 s
  [2025-01-31 20:45:03] INFO: https://mirrors.jxust.edu.cn/archlinux/           7713.46 KiB/s     1.00 s
  # cat /etc/pacman.d/mirrorlist
  ################################################################################
  ################# Arch Linux mirrorlist generated by Reflector #################
  ################################################################################

  # With:       reflector --verbose --country China -l 20 -p https --sort rate --save /etc/pacman.d/mirrorlist
  # When:       2025-01-31 12:45:03 UTC
  # From:       https://archlinux.org/mirrors/status/json/
  # Retrieved:  2025-01-31 12:44:53 UTC
  # Last Check: 2025-01-31 12:26:38 UTC

  Server = https://mirrors.tuna.tsinghua.edu.cn/archlinux/$repo/os/$arch
  Server = https://mirrors.qlu.edu.cn/archlinux/$repo/os/$arch
  Server = https://mirrors.aliyun.com/archlinux/$repo/os/$arch
  Server = https://mirrors.jxust.edu.cn/archlinux/$repo/os/$arch
  Server = https://mirrors.xjtu.edu.cn/archlinux/$repo/os/$arch
  Server = https://mirrors.jlu.edu.cn/archlinux/$repo/os/$arch
  Server = https://mirrors.nju.edu.cn/archlinux/$repo/os/$arch
  Server = https://mirrors.hust.edu.cn/archlinux/$repo/os/$arch
  Server = https://mirrors.shanghaitech.edu.cn/archlinux/$repo/os/$arch
  ```

  此处我们使用 `reflector` 工具, 自动选择最快的国内镜像.

  这个方法来自文章: TODO

+ (6) 安装初始软件包:

  ```sh
  pacstrap -K /mnt base linux linux-firmware linux-zen grub amd-ucode intel-ucode iptables-nft efibootmgr man-db man-pages
  ```

  其中 `base` 是系统的基础软件包 (最小系统), `linux` 是标准内核,
  `linux-firmware` 是固件包 (让硬件正常工作), `linux-zen` 是一种优化内核 (目前窝用这个),
  `grub` 是引导程序 (用于系统启动), `amd-ucode` 是 AMD CPU 的微码更新包,
  `intel-ucode` 是 Intel CPU 的微码更新包, `efibootmgr` 用于管理 UEFI 启动菜单 (grub 依赖这个).

  执行完这条命令, 系统的软件包基本上就装好了 !

+ (7) 生成挂载配置 (fstab):

  ```sh
  genfstab -U /mnt >> /mnt/etc/fstab
  ```

  查看生成结果:

  ```sh
  cat /mnt/etc/fstab
  ```

+ (8) 进入新系统 (arch-chroot):

  ```sh
  arch-chroot /mnt
  ```

  然后就进入了新安装的系统 !

+ (9) 补充安装软件包:

  ```sh
  pacman -S nano sudo btrfs-progs fish reflector
  ```

  `nano` 是一个文本编辑器, `sudo` 用于管理 root 权限,
  `btrfs-progs` 用于管理 btrfs 文件系统, `fish` 是一个 shell.

+ (10) 配置系统:

  ```sh
  ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
  ```

  设置时区.

  ```sh
  hwclock --systohc
  ```

  同步硬件时钟.

  ----

  ```sh
  nano /etc/locale.gen
  ```

  ![编辑 locale.gen](./图/32-i-3.png)

  取消注释 `en_US.UTF-8` 和 `zh_CN.UTF-8`, 保存 (Ctrl+O, Ctrl+X).
  然后执行:

  ```sh
  locale-gen
  ```

  ![生成 locale](./图/32-i-4.png)

  ```sh
  nano /etc/locale.conf
  ```

  编辑文件, 输入:

  ```sh
  LANG=en_US.UTF-8
  ```

  ----

  ```sh
  nano /etc/hostname
  ```

  编辑文件, 输入主机名.

+ (11) 生成 initcpio:

  ```sh
  mkinitcpio -P
  ```

+ (12) 安装 GRUB:

  ```sh
  grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=GRUB --removable
  ```

  ![安装 GRUB](./图/32-i-5.png)

  将 GRUB 安装到 UEFI.
  `--removable` 的作用是, 插到别的系统, 直接可以启动, 无需修复 UEFI 启动菜单.

  ```sh
  grub-mkconfig -o /boot/grub/grub.cfg
  ```

  ![生成 GRUB 配置文件](./图/32-i-6.png)

  生成 GRUB 配置文件.

+ (13) 创建新用户:

  ```sh
  useradd -m s202501c7l
  ```

  此处 `s202501c7l` 是用户名.

  ```sh
  passwd s202501c7l
  ```

  为新用户设置登录密码.

  ```sh
  chsh -s /usr/bin/fish s202501c7l
  ```

  为新用户设置 shell.

  ```sh
  gpasswd -a s202501c7l wheel
  ```

  将新用户加入 `wheel` 组 (管理员权限).

+ (14) 配置 sudo:

  ```sh
  EDITOR=nano visudo
  ```

  ![配置 sudo](./图/32-i-7.png)

  取消注释 `%wheel` 这一行, 也就是允许 wheel 组执行任意命令.

  ```sh
  passwd -l root
  ```

  禁止 root 登录.

----

至此, 新系统就安装配置完成了, 撒花 ~

### 3.3 进入 GNOME 桌面环境

慢着, 不安装图形桌面环境, 不好用呀 ?

GNU/Linux 有许多种桌面可选, 比如 GNOME, KDE.
窝使用 GNOME 好多年了, 所以继续使用 GNOME.

+ (1) 安装 GNOME 桌面:

  ```sh
  pacman -S gnome networkmanager pipewire
  ```

  然后执行:

  ```sh
  # systemctl enable gdm
  # systemctl enable NetworkManager
  ```

  这两句很重要, 否则桌面环境开机不会自动启动.

+ (2) 退出 chroot 环境:

  ```sh
  exit
  ```

  然后卸载 `/mnt`:

  ```sh
  umount -R /mnt
  ```

  关机:

  ```sh
  poweroff
  ```

+ (3) 拔掉安装 U 盘, 开机, 按 ESC 进入 BIOS 设置.

  设置从 USB SSD 启动, 保存退出.

+ (4) 启动中:

  ![GRUB 启动界面](./图/33-i-1.png)
  ![启动中](./图/33-i-2.png)

  GNOME 登录界面:

  ![GNOME 登录界面](./图/33-i-3.png)
  ![GNOME 界面](./图/33-i-4.png)

  成功进入桌面, 撒花 ~

### 3.4 安装中文字体和 ibus 输入法

打开终端, 然后:

```sh
sudo pacman -S noto-fonts noto-fonts-cjk noto-fonts-extra ibus ibus-libpinyin
```

![终端窗口](./图/34-i-1.png)

----

![存储占用](./图/34-i-2.png)

刚装好系统, 只占用了大约 7GB 存储空间.

![设置语言](./图/34-i-3.png)

把系统设置为中文, 重启.

![设置输入法](./图/34-i-4.png)

在这里设置中文输入法.

至此, 系统就可以正常使用了, 撒花 ~

### 3.5 安装胖喵拼音 (可选)

本章节为可选内容, 读者可以跳过.

+ (1) 配置 flathub 国内镜像: <https://mirror.sjtu.edu.cn/docs/flathub>

  并安装软件: <https://flathub.org/zh-Hans/apps/io.github.fm_elpac.pmim_ibus>

  ```sh
  flatpak install io.github.fm_elpac.pmim_ibus
  ```

+ (2) 安装基础开发工具:

  ```sh
  sudo pacman -S base-devel
  ```

  从 AUR 下载并解压: <https://aur.archlinux.org/packages/librush-bin>

  打包:

  ```sh
  makepkg
  ```

  安装:

  ```sh
  sudo pacman -U librush-bin-0.1.0-1-x86_64.pkg.tar.zst
  ```

+ (3) 下载词库并安装 (文件复制过去):

  ```sh
  > ls -l ~/.var/app/io.github.fm_elpac.pmim_ibus/config/pmim/pmim_sys.db
  -r--r--r-- 1 s2 s2 17551360  1月28日 20:07 /home/s2/.var/app/io.github.fm_elpac.pmim_ibus/config/pmim/pmim_sys.db
  ```

----

![胖喵拼音](./图/35-p-1.png)

换了新的硬件之后, 输入法快了很多, 平均响应时间只有 3 毫秒 (狗头)

### 3.6 安装别的应用软件 (可选)

本章节为可选内容, 读者可以跳过.

比如:

```sh
sudo pacman -S chromium gnome-tweaks git podman code gimp inkscape blender ffmpeg mediainfo mpv ddcutil read-edid kicad freecad krita elementary-icon-theme elementary-wallpapers gtk-theme-elementary sound-theme-elementary android-tools scrcpy nodejs deno wasmer ttf-droid electron intel-compute-runtime hip-runtime-amd hiprt fuse-overlayfs slirp4netns kicad-library kicad-library-3d krita-plugin-gmic intel-gpu-tools radeontop htop lsof strace iotop libva-utils vdpauinfo sndio vulkan-driver
```

chromium (浏览器), gnome-tweaks (GNOME 高级设置), git (版本控制系统),
podman (运行容器), code (文本编辑器), gimp (图片编辑器), inkscape (矢量图 svg 编辑器),
blender (3D 建模/动画), ffmpeg (多媒体文件处理), mpv (视频播放器),
ddcutil (控制显示器亮度), kicad (PCB 绘制), freecad (工程 3D 建模), krita (绘图),
android-tools (Android 工具), scrcpy (控制手机).


## 4 流浪测试

系统装好了, 接下来进行实际的流浪测试.

### 4.1 小主机 (7 号) CPU r7-5825u

额 .. . 系统就是在这个小主机上安装的, 不需要流浪. 但是, 还有流浪回来 ?

![系统信息](./图/41-i-1.png)

这是正常工作 (使用) 状态的系统负载:

![工作状态系统负载](./图/41-i-2.png)

用命令行查看系统信息:

```sh
> uname -a
Linux SC202501C7LA 6.12.10-zen1-1-zen #1 ZEN SMP PREEMPT_DYNAMIC Sat, 18 Jan 2025 02:26:52 +0000 x86_64 GNU/Linux
> lscpu
架构：                    x86_64
  CPU 运行模式：          32-bit, 64-bit
  Address sizes:          48 bits physical, 48 bits virtual
  字节序：                Little Endian
CPU:                      16
  在线 CPU 列表：         0-15
厂商 ID：                 AuthenticAMD
  型号名称：              AMD Ryzen 7 5825U with Radeon Graphics
    CPU 系列：            25
    型号：                80
    每个核的线程数：      2
    每个座的核数：        8
    座：                  1
    步进：                0
    Frequency boost:      启用
    CPU(s) scaling MHz:   43%
    CPU 最大 MHz：        4546.0000
    CPU 最小 MHz：        400.0000
    BogoMIPS：            3992.42
    标记：                fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ht syscall nx mmxext f
                          xsr_opt pdpe1gb rdtscp lm constant_tsc rep_good nopl xtopology nonstop_tsc cpuid extd_apicid aperfmperf rapl pni pclmulq
                          dq monitor ssse3 fma cx16 sse4_1 sse4_2 movbe popcnt aes xsave avx f16c rdrand lahf_lm cmp_legacy svm extapic cr8_legacy
                           abm sse4a misalignsse 3dnowprefetch osvw ibs skinit wdt tce topoext perfctr_core perfctr_nb bpext perfctr_llc mwaitx cp
                          b cat_l3 cdp_l3 hw_pstate ssbd mba ibrs ibpb stibp vmmcall fsgsbase bmi1 avx2 smep bmi2 erms invpcid cqm rdt_a rdseed ad
                          x smap clflushopt clwb sha_ni xsaveopt xsavec xgetbv1 xsaves cqm_llc cqm_occup_llc cqm_mbm_total cqm_mbm_local user_shst
                          k clzero irperf xsaveerptr rdpru wbnoinvd cppc arat npt lbrv svm_lock nrip_save tsc_scale vmcb_clean flushbyasid decodea
                          ssists pausefilter pfthreshold avic v_vmsave_vmload vgif v_spec_ctrl umip pku ospke vaes vpclmulqdq rdpid overflow_recov
                           succor smca fsrm debug_swap
Virtualization features:  
  虚拟化：                AMD-V
Caches (sum of all):      
  L1d:                    256 KiB (8 instances)
  L1i:                    256 KiB (8 instances)
  L2:                     4 MiB (8 instances)
  L3:                     16 MiB (1 instance)
NUMA:                     
  NUMA 节点：             1
  NUMA 节点0 CPU：        0-15
Vulnerabilities:          
  Gather data sampling:   Not affected
  Itlb multihit:          Not affected
  L1tf:                   Not affected
  Mds:                    Not affected
  Meltdown:               Not affected
  Mmio stale data:        Not affected
  Reg file data sampling: Not affected
  Retbleed:               Not affected
  Spec rstack overflow:   Mitigation; Safe RET
  Spec store bypass:      Mitigation; Speculative Store Bypass disabled via prctl
  Spectre v1:             Mitigation; usercopy/swapgs barriers and __user pointer sanitization
  Spectre v2:             Mitigation; Retpolines; IBPB conditional; IBRS_FW; STIBP always-on; RSB filling; PBRSB-eIBRS Not affected; BHI Not affec
                          ted
  Srbds:                  Not affected
  Tsx async abort:        Not affected
> free -h
                总计        已用        空闲        共享   缓冲/缓存        可用
内存：          62Gi       4.0Gi        55Gi        78Mi       3.7Gi        58Gi
交换：            0B          0B          0B
> df -h
文件系统        大小  已用  可用 已用% 挂载点
dev              32G     0   32G    0% /dev
run              32G  1.5M   32G    1% /run
efivarfs        128K   34K   90K   28% /sys/firmware/efi/efivars
/dev/sda3       946G   69G  876G    8% /
tmpfs            32G   18M   32G    1% /dev/shm
tmpfs            32G  4.2M   32G    1% /tmp
tmpfs           1.0M     0  1.0M    0% /run/credentials/systemd-journald.service
/dev/sda3       946G   69G  876G    8% /home
/dev/sda3       946G   69G  876G    8% /home/s202501c7l_r
/dev/sda2       7.8G  411M  7.0G    6% /boot
/dev/sda1       511M  288K  511M    1% /boot/efi
tmpfs           6.3G  3.5M  6.3G    1% /run/user/1000
```

### 4.2 笔记本 (4 号) CPU i5-6200u

这个是 10 年前的老旧笔记本, 准备淘汰.

![系统信息](./图/42-i-1.png)

![工作状态系统负载](./图/42-i-2.png)

```sh
> lscpu
架构：                    x86_64
  CPU 运行模式：          32-bit, 64-bit
  Address sizes:          39 bits physical, 48 bits virtual
  字节序：                Little Endian
CPU:                      4
  在线 CPU 列表：         0-3
厂商 ID：                 GenuineIntel
  型号名称：              Intel(R) Core(TM) i5-6200U CPU @ 2.30GHz
    CPU 系列：            6
    型号：                78
    每个核的线程数：      2
    每个座的核数：        2
    座：                  1
    步进：                3
    CPU(s) scaling MHz:   49%
    CPU 最大 MHz：        2800.0000
    CPU 最小 MHz：        400.0000
    BogoMIPS：            4800.00
    标记：                fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush dts acpi mmx fxsr sse sse2 ss ht tm pbe 
                          syscall nx pdpe1gb rdtscp lm constant_tsc art arch_perfmon pebs bts rep_good nopl xtopology nonstop_tsc cpuid aperfmperf
                           pni pclmulqdq dtes64 monitor ds_cpl vmx est tm2 ssse3 sdbg fma cx16 xtpr pdcm pcid sse4_1 sse4_2 x2apic movbe popcnt ts
                          c_deadline_timer aes xsave avx f16c rdrand lahf_lm abm 3dnowprefetch cpuid_fault epb pti ssbd ibrs ibpb stibp tpr_shadow
                           flexpriority ept vpid ept_ad fsgsbase tsc_adjust bmi1 avx2 smep bmi2 erms invpcid mpx rdseed adx smap clflushopt intel_
                          pt xsaveopt xsavec xgetbv1 xsaves dtherm ida arat pln pts hwp hwp_notify hwp_act_window hwp_epp vnmi md_clear flush_l1d 
                          arch_capabilities
Virtualization features:  
  虚拟化：                VT-x
Caches (sum of all):      
  L1d:                    64 KiB (2 instances)
  L1i:                    64 KiB (2 instances)
  L2:                     512 KiB (2 instances)
  L3:                     3 MiB (1 instance)
NUMA:                     
  NUMA 节点：             1
  NUMA 节点0 CPU：        0-3
Vulnerabilities:          
  Gather data sampling:   Vulnerable: No microcode
  Itlb multihit:          KVM: Mitigation: Split huge pages
  L1tf:                   Mitigation; PTE Inversion; VMX conditional cache flushes, SMT vulnerable
  Mds:                    Mitigation; Clear CPU buffers; SMT vulnerable
  Meltdown:               Mitigation; PTI
  Mmio stale data:        Mitigation; Clear CPU buffers; SMT vulnerable
  Reg file data sampling: Not affected
  Retbleed:               Mitigation; IBRS
  Spec rstack overflow:   Not affected
  Spec store bypass:      Mitigation; Speculative Store Bypass disabled via prctl
  Spectre v1:             Mitigation; usercopy/swapgs barriers and __user pointer sanitization
  Spectre v2:             Mitigation; IBRS; IBPB conditional; STIBP conditional; RSB filling; PBRSB-eIBRS Not affected; BHI Not affected
  Srbds:                  Mitigation; Microcode
  Tsx async abort:        Not affected
> free -h
                总计        已用        空闲        共享   缓冲/缓存        可用
内存：          15Gi       1.4Gi        13Gi       326Mi       1.3Gi        14Gi
交换：            0B          0B          0B
```

### 4.3 笔记本 (9 号) CPU r5-5625u

![系统信息](./图/43-i-1.png)

![工作状态系统负载](./图/43-i-2.png)

```sh
> lscpu
架构：                    x86_64
  CPU 运行模式：          32-bit, 64-bit
  Address sizes:          48 bits physical, 48 bits virtual
  字节序：                Little Endian
CPU:                      12
  在线 CPU 列表：         0-11
厂商 ID：                 AuthenticAMD
  型号名称：              AMD Ryzen 5 5625U with Radeon Graphics
    CPU 系列：            25
    型号：                80
    每个核的线程数：      2
    每个座的核数：        6
    座：                  1
    步进：                0
    Frequency boost:      启用
    CPU(s) scaling MHz:   46%
    CPU 最大 MHz：        4388.0000
    CPU 最小 MHz：        400.0000
    BogoMIPS：            4591.79
    标记：                fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ht syscall nx mmxext f
                          xsr_opt pdpe1gb rdtscp lm constant_tsc rep_good nopl xtopology nonstop_tsc cpuid extd_apicid aperfmperf rapl pni pclmulq
                          dq monitor ssse3 fma cx16 sse4_1 sse4_2 movbe popcnt aes xsave avx f16c rdrand lahf_lm cmp_legacy svm extapic cr8_legacy
                           abm sse4a misalignsse 3dnowprefetch osvw ibs skinit wdt tce topoext perfctr_core perfctr_nb bpext perfctr_llc mwaitx cp
                          b cat_l3 cdp_l3 hw_pstate ssbd mba ibrs ibpb stibp vmmcall fsgsbase bmi1 avx2 smep bmi2 erms invpcid cqm rdt_a rdseed ad
                          x smap clflushopt clwb sha_ni xsaveopt xsavec xgetbv1 xsaves cqm_llc cqm_occup_llc cqm_mbm_total cqm_mbm_local user_shst
                          k clzero irperf xsaveerptr rdpru wbnoinvd cppc arat npt lbrv svm_lock nrip_save tsc_scale vmcb_clean flushbyasid decodea
                          ssists pausefilter pfthreshold avic v_vmsave_vmload vgif v_spec_ctrl umip pku ospke vaes vpclmulqdq rdpid overflow_recov
                           succor smca fsrm debug_swap
Virtualization features:  
  虚拟化：                AMD-V
Caches (sum of all):      
  L1d:                    192 KiB (6 instances)
  L1i:                    192 KiB (6 instances)
  L2:                     3 MiB (6 instances)
  L3:                     16 MiB (1 instance)
NUMA:                     
  NUMA 节点：             1
  NUMA 节点0 CPU：        0-11
Vulnerabilities:          
  Gather data sampling:   Not affected
  Itlb multihit:          Not affected
  L1tf:                   Not affected
  Mds:                    Not affected
  Meltdown:               Not affected
  Mmio stale data:        Not affected
  Reg file data sampling: Not affected
  Retbleed:               Not affected
  Spec rstack overflow:   Mitigation; Safe RET
  Spec store bypass:      Mitigation; Speculative Store Bypass disabled via prctl
  Spectre v1:             Mitigation; usercopy/swapgs barriers and __user pointer sanitization
  Spectre v2:             Mitigation; Retpolines; IBPB conditional; IBRS_FW; STIBP always-on; RSB filling; PBRSB-eIBRS Not affected; BHI Not affec
                          ted
  Srbds:                  Not affected
  Tsx async abort:        Not affected
> free -h
                总计        已用        空闲        共享   缓冲/缓存        可用
内存：          62Gi       1.7Gi        60Gi        19Mi       934Mi        60Gi
交换：            0B          0B          0B
```

### 4.4 台式机 (6 号) CPU r5-5600g

![系统信息](./图/44-i-1.png)

![工作状态系统负载](./图/44-i-2.png)

```sh
> lscpu
架构：                    x86_64
  CPU 运行模式：          32-bit, 64-bit
  Address sizes:          48 bits physical, 48 bits virtual
  字节序：                Little Endian
CPU:                      12
  在线 CPU 列表：         0-11
厂商 ID：                 AuthenticAMD
  型号名称：              AMD Ryzen 5 5600G with Radeon Graphics
    CPU 系列：            25
    型号：                80
    每个核的线程数：      2
    每个座的核数：        6
    座：                  1
    步进：                0
    Frequency boost:      启用
    CPU(s) scaling MHz:   66%
    CPU 最大 MHz：        4464.0000
    CPU 最小 MHz：        400.0000
    BogoMIPS：            7785.54
    标记：                fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ht syscall nx mmxext fxsr_opt pdpe1gb rdtscp lm constant_tsc rep_good no
                          pl xtopology nonstop_tsc cpuid extd_apicid aperfmperf rapl pni pclmulqdq monitor ssse3 fma cx16 sse4_1 sse4_2 x2apic movbe popcnt aes xsave avx f16c rdrand lahf_lm cmp_le
                          gacy svm extapic cr8_legacy abm sse4a misalignsse 3dnowprefetch osvw ibs skinit wdt tce topoext perfctr_core perfctr_nb bpext perfctr_llc mwaitx cpb cat_l3 cdp_l3 hw_psta
                          te ssbd mba ibrs ibpb stibp vmmcall fsgsbase bmi1 avx2 smep bmi2 erms invpcid cqm rdt_a rdseed adx smap clflushopt clwb sha_ni xsaveopt xsavec xgetbv1 xsaves cqm_llc cqm_
                          occup_llc cqm_mbm_total cqm_mbm_local user_shstk clzero irperf xsaveerptr rdpru wbnoinvd cppc arat npt lbrv svm_lock nrip_save tsc_scale vmcb_clean flushbyasid decodeassi
                          sts pausefilter pfthreshold avic v_vmsave_vmload vgif v_spec_ctrl umip pku ospke vaes vpclmulqdq rdpid overflow_recov succor smca fsrm debug_swap
Virtualization features:  
  虚拟化：                AMD-V
Caches (sum of all):      
  L1d:                    192 KiB (6 instances)
  L1i:                    192 KiB (6 instances)
  L2:                     3 MiB (6 instances)
  L3:                     16 MiB (1 instance)
NUMA:                     
  NUMA 节点：             1
  NUMA 节点0 CPU：        0-11
Vulnerabilities:          
  Gather data sampling:   Not affected
  Itlb multihit:          Not affected
  L1tf:                   Not affected
  Mds:                    Not affected
  Meltdown:               Not affected
  Mmio stale data:        Not affected
  Reg file data sampling: Not affected
  Retbleed:               Not affected
  Spec rstack overflow:   Mitigation; Safe RET
  Spec store bypass:      Mitigation; Speculative Store Bypass disabled via prctl
  Spectre v1:             Mitigation; usercopy/swapgs barriers and __user pointer sanitization
  Spectre v2:             Mitigation; Retpolines; IBPB conditional; IBRS_FW; STIBP always-on; RSB filling; PBRSB-eIBRS Not affected; BHI Not affected
  Srbds:                  Not affected
  Tsx async abort:        Not affected
> free -h
                总计        已用        空闲        共享   缓冲/缓存        可用
内存：          27Gi       1.5Gi        24Gi        20Mi       1.3Gi        25Gi
交换：            0B          0B          0B
```


## 5 总结与展望

嗯, 流浪了一圈, 又回来了. 流浪 Linux 计划, 大成功 !!
确实可以方便的做到, 插到哪里都能启动使用.

ArchLinux 使用命令行安装比较麻烦, 但是这种麻烦基本上是一次性的,
装好系统之后, 好几年都不用重装系统.
ArchLinux 从最小系统开始, 需要什么装什么, 做加法而不是减法,
所以可以获得更精简, 更干净, 更小的系统, 有更强的定制能力.
同样功能的组件 (比如内核, 引导程序, 编辑器, 桌面) 有好多种可供选择.

Linux 高度灵活, 可定制, 所以可以很容易的安装到外置 USB SSD 上, 到处流浪.
Linux 系统对资源的消耗较少, 不需要很高的硬件性能, 在老旧的硬件上也能流畅运行,
降低了成本, 对穷人友好.

安装到内置 (SATA / M.2 NVMe) SSD 上的过程, 和这个差不多,
只是流浪不太方便.


## 附录 1 pacman 安装软件包日志

这是新安装的 ArchLinux 系统使用 pacman 安装软件包的日志, 仅供参考.

```sh
> cat /var/log/pacman.log | grep "PACMAN\] Running"

省略部分结果

 [PACMAN] Running 'pacman -r /mnt -Sy --config=/tmp/pacman.conf.nSDu --disable-sandbox --cachedir=/mnt/var/cache/pacman/pkg --noconfirm base linux linux-firmware linux-zen grub nano sudo fish btrfs-progs amd-ucode intel-ucode man-db man-pages'
 [PACMAN] Running 'pacman -S iptables-nft'
 [PACMAN] Running 'pacman -S efibootmgr'
 [PACMAN] Running 'pacman -S pacman-mirrorlist'
 [PACMAN] Running 'pacman -S gnome'
 [PACMAN] Running 'pacman -S networkmanager'
 [PACMAN] Running 'pacman -S flatpak chromium electron nodejs deno code git'
 [PACMAN] Running 'pacman -S noto-fonts noto-fonts-cjk noto-fonts-extra'
 [PACMAN] Running 'pacman -S gimp inkscape blender ffmpeg mediainfo mpv podman kicad freecad'
 [PACMAN] Running 'pacman -S intel-compute-runtime hip-runtime-amd hiprt fuse-overlayfs slirp4netns kicad-library kicad-library-3d'
 [PACMAN] Running 'pacman -S ibus ibus-libpinyin'
 [PACMAN] Running 'pacman -S gnome-tweaks'
 [PACMAN] Running 'pacman -S ddcutil'
 [PACMAN] Running 'pacman -S read-edid'
 [PACMAN] Running 'pacman -S elementary-icon-theme elementary-wallpapers gtk-theme-elementary sound-theme-elementary'
 [PACMAN] Running 'pacman -S krita krita-plugin-gmic'
 [PACMAN] Running 'pacman -S android-tools scrcpy ttf-droid'
 [PACMAN] Running 'pacman -S wasmer'
 [PACMAN] Running 'pacman -S reflector'
 [PACMAN] Running 'pacman -S base-devel'
 [PACMAN] Running 'pacman -S intel-gpu-tools'
 [PACMAN] Running 'pacman -S radeontop'
 [PACMAN] Running 'pacman -S htop'
 [PACMAN] Running 'pacman -S lsof strace'
 [PACMAN] Running 'pacman -S iotop'
 [PACMAN] Running 'pacman -S libva-utils'
 [PACMAN] Running 'pacman -S vdpauinfo'
 [PACMAN] Running 'pacman -S sndio vulkan-driver'

 [PACMAN] Running '/usr/bin/pacman -U /home/s2/aur/librush-bin/librush-bin-0.1.0-1-x86_64.pkg.tar.zst'
```

目前一共安装了 1018 个软件包:

```sh
> pacman -Q | wc -l
1018
```

----

本文使用 CC-BY-SA 4.0 许可发布.
