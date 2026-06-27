# 离线安装 ArchLinux 操作系统 (DVD 光盘)

一般情况下, 安装 ArchLinux 需要连网.
ArchLinux 安装光盘镜像 (iso) 只用来启动, 安装过程中, 所有的软件包, 都需要从网络下载.

那么, 如果完全没网, 还能安装 ArchLinux 嘛 ? **可以 !**
并且, 这对于应急故障恢复等场景, 还是挺有用的.

本文就来展示在只有几张 DVD 光盘的情况下, 安装 ArchLinux 的具体过程.
光盘虽然容量小, 速度慢, 几乎被淘汰.
但仍然是现在最好的低成本 **只读** 存储介质, 数据不易丢失损坏, 具有很高的可靠程度.

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 94 号作品. )

----

相关文章:

+ 《流浪 Linux: 外置 USB SSD 安装 ArchLinux》

  TODO

+ 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》

  TODO

+ 《笔记本 光驱 的内部结构及用法: 应急系统启动 (恢复) 光盘 (DVD+R/RW)》

  TODO

+ 《穷人如何备份数据 ? 常见存储设备简单总结》

  TODO

+ 《胖喵贪吃: 备份数据文件的小工具》

  TODO

+ 《低功耗低成本 PC (可更换内存条) 推荐 (笔记本, 小主机)》

  TODO

+ 《光驱的内部结构及日常使用》

  TODO

+ 《光盘文件系统 (iso9660) 格式解析》

  TODO

+ 《小水滴系列文章目录 (整理)》

  TODO

+ 《防误删 (实时) 文件备份系统 (btrfs 快照 + rsync)》

  TODO

参考资料:

+ <https://fedoraproject.org/coreos/download/?stream=stable>
+ <https://archlinux.org/download/>
+ <https://wiki.archlinux.org/title/Archinstall>
+ <https://wiki.archlinux.org/title/Offline_installation>
+ <https://wiki.archlinux.org/title/Help:Browsing#Offline_viewing>
+ <https://mirrors.tuna.tsinghua.edu.cn/help/archlinux/>
+ <https://mirrors.tuna.tsinghua.edu.cn/archlinux/core/os/x86_64/>
+ <https://mirrors.cernet.edu.cn/>


## 目录

+ 1 准备数据光盘 (iso)

  - 1.1 下载安装光盘镜像
  - 1.2 系统准备
  - 1.3 制作软件包数据光盘

+ 2 虚拟机安装测试 (详细步骤, archinstall)

  - 2.1 展开软件包数据
  - 2.2 配置 archinstall
  - 2.3 进行安装

+ 3 物理机安装验证

  - 3.1 刻录 DVD+R DL 光盘
  - 3.2 制作 ArchLinux 安装 U 盘 (可选)
  - 3.3 离线安装 ArchLinux

+ 4 总结与展望


## 1 准备数据光盘 (iso)

本文设定的具体场景, 是从几张 DVD 光盘开始, 安装 ArchLinux 操作系统, 以及各种软件包.

为什么是 **光盘** 呢 ? 因为光盘可以是 **只读** 的 (比如 DVD+R), 是数据备份的很好的存储器.
别的存储器, 比如 U 盘, SSD, 磁盘, SD 卡 等, 因为数据可以修改, 更容易丢失损坏.

所以这个场景更接近 "应急故障恢复", 并且是在完全没网的情况下.

### 1.1 下载安装光盘镜像

首先下载 Fedora CoreOS 44 和 ArchLinux 的安装光盘镜像 (iso):

+ <https://fedoraproject.org/coreos/download/?stream=stable>
+ <https://archlinux.org/download/>

下载之后:

```sh
> ls -l archlinux-2026.06.01-x86_64.iso
-r--r--r-- 1 s2 s2 1566638080  6月12日 22:14 archlinux-2026.06.01-x86_64.iso
> sha256sum archlinux-2026.06.01-x86_64.iso
ec7a9c89aed7a59a76266ccf723c5e88480e47d7088c4482436f882fa37c3989  archlinux-2026.06.01-x86_64.iso
> ls -l fedora-coreos-44.20260523.3.1-live-iso.x86_64.iso
-r--r--r-- 1 s2 s2 1068498944  6月12日 22:18 fedora-coreos-44.20260523.3.1-live-iso.x86_64.iso
> sha256sum fedora-coreos-44.20260523.3.1-live-iso.x86_64.iso
1b231a04c6ade01eec35d48ec78b337be6b2552969a2ec3460a3599cfc18f6e3  fedora-coreos-44.20260523.3.1-live-iso.x86_64.iso
```

### 1.2 系统准备

需要一个已经安装好的 ArchLinux 系统.

如果还没有, 那么安装 ArchLinux 的简单方法是:

+ (1) 创建一个新的 虚拟机 (参考文章 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》)

+ (2) 在 虚拟机 中启动 ArchLinux 的安装 iso.

+ (3) 输入 `archinstall` 并运行, 只需选择几个简单的选项, 即可完成安装.

----

好了, 现在你已经有了一个日常使用的 ArchLinux 系统, 可能安装了很多软件包.
离线安装的目标是, 重新安装的系统要和目前使用的系统几乎一样, 包含所有的已经安装的软件包.

首先, 更新所有软件包:

```sh
> sudo pacman -Syu
:: 正在同步软件包数据库...
 core 已经是最新版本
 extra 已经是最新版本
:: 正在进行全面系统更新...
 今日无事可做
```

安装需要的软件包:

```sh
sudo pacman -S base-devel libisoburn miniserve podman arch-wiki-docs
```

----

检查不需要的软件包:

```sh
> pacman -Qdtq
electron41
```

可以卸载这些软件包释放空间:

```sh
sudo pacman -R electron41
```

----

清理软件包缓存 (下载的旧版软件包安装包):

```sh
> sudo pacman -Sc
要保留的软件包：
  所有本地安装的软件包

缓存目录：/var/cache/pacman/pkg/
:: 您想从缓存中删除所有其他的软件包吗？ [Y/n] 
正在从缓存中删除旧软件包...

数据库目录：/var/lib/pacman/
:: 打算删除无用的软件库？ [Y/n] 
正在删除未用的同步仓库...
```

----

检查不在仓库里的软件包 (比如从 AUR 安装的软件包):

```sh
> pacman -Qm
ddcutil-service 1.0.14-1
librush-bin 0.2.2-1
pmbs-bin 0.1.0-1
sunshine 2026.423.21833-1
yay-bin 12.5.7-1
```

### 1.3 制作软件包数据光盘

创建一个空目录, 然后编写一些脚本文件:

+ `Makefile`

```makefile
# local-arch-repo_20260614.iso

iso:
	mkdir -p repo
	- rm -r repo/sync
	- rm -r repo/pkg

	cp -r /var/lib/pacman/sync repo/sync
	cp -r /var/cache/pacman/pkg repo/pkg

	mkdir -p repo/bin
	cp /usr/bin/miniserve repo/bin

	du -ab repo > du.txt
	mv du.txt repo

	- rm repo/sha256.txt
	find repo -type f -print0 | xargs -0 sha256sum > sha256.txt
	mv sha256.txt repo

	mkdir -p tar-20260614
	- rm tar-20260614/*.tar.*
	tar -cvf - repo | split --bytes=4095MiB - tar-20260614/local-arch-repo.tar.

	cp extract.sh tar-20260614

	- rm local-arch-repo_20260614.iso
	xorrisofs -V "LOCAL_ARCH_REPO_20260614_1" -J -o local-arch-repo_20260614.iso tar-20260614

.PHONY: iso
```

+ `extract.sh`

```sh
#!/usr/bin/env bash
cat local-arch-repo.tar.* | tar -C /tmp/repo -xvf -

cd /tmp/repo/repo && cp sync/* pkg
```

----

生成数据光盘:

```sh
make
```

结果:

```sh
> ls -l
总计 9305316
-r--r--r-- 1 s2 s2 1566638080  6月12日 22:14 archlinux-2026.06.01-x86_64.iso
-rwxr-xr-x 1 s2 s2        108  6月13日 23:49 extract.sh*
-rw-r--r-- 1 s2 s2 7961997312  6月14日 18:00 local-arch-repo_20260614.iso
-rw-r--r-- 1 s2 s2        636  6月14日 17:44 Makefile
drwxr-xr-x 1 s2 s2         58  6月14日 18:00 repo/
drwxr-xr-x 1 s2 s2        108  6月14日 18:00 tar-20260614/
```

也就是打包了 `/var/cache/pacman/pkg` 缓存目录, 包含当前系统安装的所有软件包 (不含 AUR 之类).

----

对于 AUR 之类的软件包, 需要自己手动复制, 比如:

```sh
> find repo/aur
repo/aur
repo/aur/yay-bin-12.5.7-1-x86_64.pkg.tar.zst
repo/aur/ddcutil-service-1.0.14-1-x86_64.pkg.tar.zst
repo/aur/sunshine-beta-bin-2026.423.21833-1-x86_64.pkg.tar.zst
repo/aur/librush-bin-0.2.2-1-x86_64.pkg.tar.zst
repo/aur/pmbs-bin-0.1.0-1-x86_64.pkg.tar.zst
```


## 2 虚拟机安装测试 (详细步骤, archinstall)

创建一个新的 虚拟机 (比如 VirtualBox):

![新虚拟机](./图/2-v-1.png)

注意这个虚拟机有 2 个光驱, 分别放 ArchLinux 系统安装光盘 (`/dev/sr0`) 和上面制作的软件包数据光盘 (`/dev/sr1`).

有 2 个硬盘, 其中一个用来安装 ArchLinux (`/dev/sda`), 另一个用于临时存放数据 (`/dev/sdb`).

同时注意断开网络 (不要接入虚拟机的网线).

### 2.1 展开软件包数据

启动虚拟机:

![启动 (1)](./图/21-b-1.png)

![启动 (2)](./图/21-b-2.png)

对临时硬盘进行分区, 格式化:

```sh
fdisk /dev/sdb

mkfs.ext4 -L repo1 /dev/sdb1
```

挂载:

```sh
mkdir /tmp/iso1
mkdir /tmp/repo
mount /dev/sr1 /tmp/iso1 -o ro
mount /dev/sdb1 /tmp/repo
```

![挂载](./图/21-m-3.png)

展开软件包数据:

```sh
cd /tmp/iso1
bash extract.sh
```

检查结果:

```sh
ls -la /tmp/repo/repo
```

![展开结果](./图/21-x-4.png)

----

(可选) 检查数据完整性:

```sh
cd /tmp/repo
sha256sum -c repo/sha256.txt
```

### 2.2 配置 archinstall

启动本地 http 服务器:

```sh
/tmp/repo/repo/bin/miniserve /tmp/repo/repo &
```

注意最后的 `&` 表示在后台运行. 测试:

```sh
curl -v -O http://127.0.0.1:8080/pkg/core.db
```

----

手动初始化 pacman key (**重要**):

```sh
pacman-key --init
pacman-key --populate
```

然后就可以开始安装了:

```sh
archinstall --offline --skip-ntp --skip-wkd
```

----

(可选) 可以在 archinstall 里面保存当前配置, 这样下次启动 archinstall 可以直接加载现有的配置, 不用再重新一个一个选了.

启动命令类似:

```sh
archinstall --offline --skip-ntp --skip-wkd --config /tmp/repo/user_configuration.json --creds /tmp/repo/user_credentials.json
```

![保存配置](./图/22-c-1.png)

### 2.3 进行安装

然后就是 archinstall 的常规配置, 选择几个选项即可:

安装到 `/dev/sda` 自动分区.

注意 镜像 要添加自定义的本地服务器: `http://127.0.0.1:8080/pkg`

![配置镜像](./图/23-m-1.png)

----

配置完毕, 开始安装:

![开始安装](./图/23-i-2.png)

很快, 安装完成:

![安装完成 (1)](./图/23-i-3.png)

重启.

![安装完成 (2)](./图/23-i-4.png)

----

重启之后, 登录系统:

![重启](./图/23-b-5.png)

成功 ! 撒花 ~


## 3 物理机安装验证

好, 接下来进行 物理机 的测试, 使用的 硬件 (设备) 如下:

![所需设备](./图/3-d-1.png)

+ 笔记本 HP 战 66 (CPU 5625u, 内存 64GB DDR4-3200 双通道 32GB x2) (注: 内存 在涨价前购买)

+ (可选) U 盘 32GB

+ SSD 240GB (SATA 2.5 英寸): ArchLinux 安装到这里

+ 1TB 机械硬盘 (SATA 2.5 英寸): 存放临时数据

+ DVD 刻录机 (笔记本 光驱)

+ DVD+R DL (8GB 空白) 光盘 (3 张):

  - Fedora CoreOS 44 安装光盘
  - ArchLinux 2026.06.01 安装光盘
  - 软件包数据光盘

### 3.1 刻录 DVD+R DL 光盘

虽然现在系统还有 "安装光盘镜像" (iso) 文件, 但已经很少使用 物理光驱 了.
所以, 这些系统并未针对 物理光驱 进行优化, 存在大量 随机读写, 对 光驱 很坑.

不过 CoreOS 有一个内核参数 `coreos.liveiso.fromram` 可以在系统启动时, 把整个启动光盘的数据载入内存, 后续就不需要光盘了.
这个参数可以显著缓解 光驱随机读写 的情况.

添加内核参数:

```sh
podman run --rm -v .:/data -w /data quay.io/coreos/coreos-installer:release iso customize --live-karg-append=coreos.liveiso.fromram -o fedora-coreos-44.20260523.3.1-live-fromram-iso.x86_64.iso fedora-coreos-44.20260523.3.1-live-iso.x86_64.iso
```

然后刻录修改后的 iso 镜像:

```sh
cdrskin dev=/dev/sr0 -v fedora-coreos-44.20260523.3.1-live-fromram-iso.x86_64.iso
```

----

类似的, 刻录另外 2 张 DVD 光盘.

### 3.2 制作 ArchLinux 安装 U 盘 (可选)

**警告: 请提前备份重要数据, 接下来的操作会删除 U 盘, SSD 上的所有数据 !!**

虽然可以直接用 ArchLinux DVD 光盘启动, 但是由于上述 随机读取 问题, 体验很差.
所以仍然建议制作安装 U 盘.

首先, 我们假设只有上述 3 张刻录好的 DVD 光盘.
U 盘, SATA SSD, SATA 机械硬盘上, 都没有数据.

----

首先, 我们从 Fedora CoreOS 44 DVD 光盘启动.
因为这个有 顺序读取 优化, 体验会好一点.

![CoreOS 启动光盘](./图/32-b-1.png)

启动之后, 就可以取出 Fedora CoreOS 44 DVD 光盘, 不再需要了.

![CoreOS 已启动](./图/32-b-2.png)

然后放入 ArchLinux DVD 光盘, 以及 U 盘.

![ArchLinux 启动光盘](./图/32-b-3.png)

执行命令 (复制 DVD 光盘到 U 盘):

```sh
sudo dd if=/dev/sr0 of=/dev/sda status=progress
```

![制作 U 盘](./图/32-b-4.png)

好了, 安装 U 盘 制作完成.

----

此时可以顺便展开 软件包数据光盘 到 临时数据硬盘.
拔掉 U 盘, 接入 临时硬盘, 同时更换光盘为 软件包数据光盘.

挂载硬盘, 比如 (仅供参考):

```sh
sudo mkdir /tmp/repo
sudo mount /dev/sda1 /tmp/repo
```

挂载光盘:

```sh
sudo mkdir /tmp/iso1
sudo mount /dev/sr0 /tmp/iso1 -o ro
```

展开数据:

```sh
cd /tmp/iso1
sudo bash extract.sh
```

![展开完毕](./图/32-b-5.png)

好了, 光盘的任务完成了, 可以拔出 光驱 了.

### 3.3 离线安装 ArchLinux

**警告: 请提前备份重要数据, 接下来的操作会删除 SSD 上的所有数据 !!**

重启, 从 U 盘启动:

![启动 ArchLinux 安装](./图/33-b-1.png)

依次接入 目标 SSD (240GB), 临时数据硬盘 (1TB).

使用类似章节 2.2, 2.3 的方法进行安装.

很快, 安装完成.

![安装完成](./图/33-b-2.png)

重启.

![进入 ArchLinux](./图/33-b-3.png)

撒花 ~


## 4 总结与展望

只需 3 张 DVD 光盘, 即可做到在完全 离线 (没网) 的情况下, 安装完整的 ArchLinux 操作系统.

本文中方案的好处是, 对当前安装的所有软件包进行 "快照" (备份), 所以所有你喜欢的软件安装包都在, 无需重新下载, 可以直接本地安装.
本次所有安装包的总大小恰好可以放在一张 DVD+R DL (容量约 8GB) 光盘中.
如果有更多的软件包, 只需稍做修改, 使用多张光盘即可.

如果定期进行类似的 备份, 对于 应急故障恢复 场景是很好的.

本文中手动操作的细节较多, 未来可以考虑增加自动化程度, 做成一个专用的小工具 (软件).
未来也可以考虑打包一个 本地运行的 (LLM) 小模型 (32B q4 以内), 用 llama.cpp 或 ollama 运行.
打包相关文档 (比如 arch wiki), 做成一个 AI 安装助手, 同样刻成 (只读) 光盘.
这样如果安装过程中遇到问题, 可以问 AI 辅助, 同时一切都 离线 运行.

----

本文使用 CC-BY-SA 4.0 许可发布.
