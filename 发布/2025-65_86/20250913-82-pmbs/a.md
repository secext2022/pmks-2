# 胖喵必快 (pmbs): btrfs 自动快照工具 (每分钟快照)

窝, 狡兔 8 窟: 每篇文章至少发到 4 个国内平台网站, 同时上传 8 个 git 存储平台.
窝, 小心谨慎进行多重数据备份: SSD, 机械硬盘, 光盘 (DVD/BD), 网盘 .. .
窝, 使用强大的 git (版本控制系统) 多年, 重要文件全部提交保存.
然而, 然而, 还是防不住手欠 **误删** !
是的, 不久前, 窝 **因为误删除文件**, 导致了严重的 **数据丢失** !!
然后恢复数据用了好几个小时, 大半夜 0 点 (北京时间) 以后都没睡觉.

所以, 窝要弄一个防误删的文件备份系统.
**胖喵必快** 是一个自动创建 btrfs 快照的小工具,
默认 **每分钟** (以 root) 创建一个 **只读** 快照.
普通用户只能读取快照, 无权限删除快照, 从而有效避免误删除.
同时能够 (根据配置) 定期清理旧的快照, 释放存储空间.

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 82 号作品. )

```
胖喵必快 (pmbs)

正式名称: 紫腹巨蚊 (Toxorhynchites gravelyi) 系列
  澳大利亚海神草 (Posidonia australis) 软件
```

**免责声明: 这是开源软件, 没有任何担保, 用户应该承担使用本软件造成的一切后果.**
如果不能接受, 请勿使用本软件 !

----

相关文章:

+ 《小水滴系列文章目录 (整理)》

  TODO

+ 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》

  TODO

+ 《发布 rust 源码包 (crates.io)》

  TODO

+ 《发布 AUR 软件包 (ArchLinux)》

  TODO

+ 《制作一个 rpm 软件包》

  TODO

+ 《胖喵贪吃: 备份数据文件的小工具》

  TODO

+ 《光盘 RAID: 允许丢失损坏的备份数据》

  TODO

+ 《流浪 Linux: 外置 USB SSD 安装 ArchLinux》

  TODO

+ 《git 开源平台网站推荐 (2025-06 更新)》

  TODO

参考资料:

+ <https://wiki.archlinux.org/title/Btrfs#Deleting_a_subvolume>
+ <https://www.suse.com/support/kb/doc/?id=000020696>
+ <https://forums.gentoo.org/viewtopic-t-1164227-start-0.html>
+ <http://snapper.io/>
+ <https://www.rust-lang.org/>
+ <https://wiki.archlinux.org/title/Systemd>
+ <https://wiki.archlinux.org/title/Arch_User_Repository>
+ <https://wiki.archlinux.org/title/AUR_submission_guidelines>
+ <https://users.rust-lang.org/t/easiest-way-to-manually-download-a-crate-from-crates-io/67338>
+ <https://crates.io/crates/pmbs>
+ <https://aur.archlinux.org/packages/pmbs>


## 目录

+ 1 问题描述

+ 2 pmbs 安装与使用

  - 2.1 安装 pmbs
  - 2.2 安装后配置
  - 2.3 日常使用

+ 3 主要设计与实现

  - 3.1 定期执行 (systemd timer)
  - 3.2 配置文件
  - 3.3 创建快照
  - 3.4 自动清理

+ 4 总结与展望

+ 附录 1 编译 ArchLinux 软件包 (AUR, x86_64)

+ 附录 2 编译 Fedora CoreOS 软件包 (RPM)

+ 附录 3 编译 Ubuntu 软件包 (DEB) (初步支持)

+ 附录 4 交叉编译 (aarch64, rv64gc)


## 1 问题描述

为了有效 **防误删**, 也就是自己不小心 (误操作) 删除文件, 导致重要数据丢失,
传统的 **定期备份** (backup) 是不够的 !
因为定期备份的间隔时间通常较长, 比如每天甚至每周备份一次.
在这种情况下, 如果发生误删, 很可能丢失最近很多小时的数据 (修改), 后果比较严重.

**文件同步** (比如 `rsync`), 就是给一个目录设置镜像, 把一个目录复制到另一个地方,
这也是不够的 !!
因为当源目录误删之后, 镜像目录的相应文件也会对应删除 (因为是镜像嘛).
类似的, 像 `RAID 1` 这种也不能防误删.

git 版本控制系统, 已经提交的文件不容易丢失 (但是也存在误删整个 `.git` 目录的情况),
但是未提交的文件, 仍然有很高的被误删的风险, 并且因为没有提交, 误删之后难以恢复.
并且, 频繁提交可能导致 git 历史很脏.
此时陷入两难: 提交吧, 污染 git 历史记录, 不提交吧, 又可能被误删 (捂脸)

已经完成的文章, 同时发布在多个平台网站上, 可以显著降低数据丢失的风险.
但是一篇文章可能要写很久, 在文章完成和发布之前, 这很多天的时间, 仍然可能被误删.

所以, 怎么办 ??

----

**快照** (snapshot) 是一个比较好的解决方案.
通过定期创建只读快照, 可以把之前的文件状态整个保留下来.
如果发生误删, 可以从之前的快照恢复 (把文件从快照中复制出来), 只要快照不被误删就好.

特别是 **btrfs** 快照, 因为 btrfs 文件系统的 **CoW** (写时复制) 特性,
快照是轻量级和快速的. 创建快照可以秒级完成, 快照后只有修改的文件才会占用额外的存储空间.

`snapper` 是一个现有的开源的 btrfs 自动快照工具, 本来准备直接使用 snapper 的.
然而, 窝发现 snapper 只支持 **每小时** 创建一个快照, 这个间隔时间太长了 !
如果被误删后, 要丢失整整一个小时的数据, 窝会很心痛的 !!

所以窝只好又写了一个 btrfs 自动快照工具 pmbs, 可以 **每分钟** 创建一个快照.
如果发生误删, 数据丢失只会是分钟级的, 这就舒服多了 !

创建快照只是问题的一半, 如果只是创建快照然后不管了, 那么大量的快照很快就会占满存储空间,
这是不可接受的.
因此还需要 **自动清理** 功能, 根据配置 (比如保留几个快照) 定期删除旧的快照, 释放存储空间.
实际上, 自动清理正是 pmbs 最复杂的部分.


## 2 pmbs 安装与使用

首先, pmbs 基于 btrfs 快照, 所以只能用于 btrfs 文件系统.
参考: <https://wiki.archlinux.org/title/Btrfs>

可以直接下载编译好的安装包: <https://github.com/fm-elpac/pmbs/releases>

也可以从源码编译, 详见:
附录 1 编译 ArchLinux 软件包 (AUR, x86_64), 附录 2 编译 Fedora CoreOS 软件包 (RPM),
附录 3 编译 Ubuntu 软件包 (DEB), 附录 4 交叉编译 (aarch64, rv64gc).

好了, 现在你已经有编译好的软件包了, 我们继续吧 ~ (狗头)

### 2.1 安装 pmbs

ArchLinux 系统: <https://archlinux.org/>

```sh
sudo pacman -U pmbs-bin-0.1.0a4-1-x86_64.pkg.tar.zst
```

验证安装:

```sh
> pmbs --version
pmbs version 0.1.0-a4 (x86_64-unknown-linux-gnu, default)
```

----

Fedora CoreOS 系统: <https://fedoraproject.org/coreos/>

```sh
sudo rpm-ostree install pmbs-0.1.0a4-1.fc42.x86_64.rpm
```

重启系统:

```sh
sudo systemctl reboot
```

验证安装:

```sh
core@MiWiFi-RA74-srv:~$ rpm-ostree status
State: idle
AutomaticUpdatesDriver: Zincati
  DriverState: active; periodically polling for updates (last checked Sat 2025-09-13 07:04:33 UTC)
Deployments:
● ostree-remote-image:fedora:docker://quay.io/fedora/fedora-coreos:stable
                   Digest: sha256:a636ee2280cfba2fff80df0f68641f61212e2e9b9b96d23178353e28df0d6238
                  Version: 42.20250818.3.0 (2025-09-03T02:26:27Z)
          LayeredPackages: systemd-networkd
            LocalPackages: pmbs-0.1.0a4-1.fc42.x86_64
```

注意此处 `LocalPackages` 说明安装成功.

----

别的系统, 没有测试过, 可以尝试自行编译安装哦, 加油 ~

### 2.2 安装后配置

(1) 编写配置文件, 比如:

```sh
cd /etc/pmbs
sudo cp home.toml.zh.example home.toml
env EDITOR=nano sudo -e home.toml
```

配置文件长这样:

```toml
# home.toml.zh.example
# 胖喵必快 (pmbs) 示例配置文件

pmbs = 1  # 配置文件格式版本

subvol = "/home"  # 目标 btrfs subvol 路径 (对这个 subvol 进行快照)

# 快照保留规则 (用于自动清理)
[[keep]]
time = "1m"  # 间隔 1 分钟 (60 秒)
n = 30  # 保留 30 个 (共 30 分钟)

[[keep]]
time = "5m"  # 间隔 5 分钟 (300 秒)
n = 12  # 保留 12 个 (共 1 小时)

[[keep]]
time = "20m"  # 间隔 20 分钟 (1200 秒)
n = 9  # 保留 9 个 (共 3 小时)

[[keep]]
time = "1h"  # 间隔 1 小时 (3600 秒)
n = 24  # 保留 24 个 (共 1 天)

[[keep]]
time = "2h"  # 间隔 1 小时 (7200 秒)
n = 12  # 保留 12 个 (共 1 天)

[[keep]]
time = "1d"  # 间隔 1 天 (86400 秒)
n = 7  # 保留 7 个 (共 7 天)
```

指定目标 btrfs subvol 的路径, 以及快照保留规则 (间隔时间及保留个数).
如果要对多个 subvol 创建快照, 可以创建多个配置文件,
`/etc/pmbs` 目录中文件名以 `.toml` 结尾的文件都是生效的配置文件.

检查配置文件错误:

```sh
> pmbs config test
[2025-09-13T07:32:07Z INFO  pmbs::cli] check /etc/pmbs/home.toml
[2025-09-13T07:32:07Z INFO  pmbs::cli] check /etc/pmbs/home_r.toml
```

这样说明没有错误, 检查通过.

----

(2) 检查 btrfs `quota` 是否禁用, 比如:

```sh
> sudo btrfs qgroup show /home
ERROR: can't list qgroups: quotas not enabled
```

类似这样说明已禁用, 很好. 如果启用了, 请关闭:

```sh
sudo btrfs quota disable /home
```

因为 pmbs 会创建 **大量** 快照 (根据不同配置, 几十个甚至数百个),
此时如果启用 btrfs quota, **系统会非常慢**, 甚至经常卡死 !
所以必需禁用.

----

(3) 启用 systemd timer:

```sh
sudo systemctl enable --now pmbs-snapshot.timer
sudo systemctl enable --now pmbs-clean.timer
```

好了, 这样 pmbs 就会在后台自动创建 btrfs 快照 (每分钟), 并自动清理旧快照 (根据配置) 了.

至此, pmbs 安装配置完毕.

### 2.3 日常使用

查看快照列表, 比如:

```sh
> pmbs ls /home
/home/.pmbs/2025/1757749996	2025-09-13T15:53:16+08:00	*latest
/home/.pmbs/2025/1757749935	2025-09-13T15:52:15+08:00
/home/.pmbs/2025/1757749874	2025-09-13T15:51:14+08:00
/home/.pmbs/2025/1757749813	2025-09-13T15:50:13+08:00
/home/.pmbs/2025/1757749752	2025-09-13T15:49:12+08:00
/home/.pmbs/2025/1757749691	2025-09-13T15:48:11+08:00
/home/.pmbs/2025/1757749630	2025-09-13T15:47:10+08:00
/home/.pmbs/2025/1757749569	2025-09-13T15:46:09+08:00
/home/.pmbs/2025/1757749508	2025-09-13T15:45:08+08:00
```

![pmbs](./图/23-ls-1.png)

会显示快照路径及创建时间.

----

进入快照目录查看对应的文件:

```sh
> ls -ali /home/.pmbs
总计 4
 929570 drwxr-xr-x 1 root root   20  9月13日 15:54 ./
    256 drwxr-xr-x 1 root root   54  8月28日 23:32 ../
 929571 drwxr-xr-x 1 root root 2000  9月13日 15:54 2025/
1178012 lrwxrwxrwx 1 root root   15  9月13日 15:54 latest -> 2025/1757750057/
> ls -ali /home/.pmbs/2025
总计 0
929571 drwxr-xr-x 1 root root 2020  9月13日 15:55 ./
929570 drwxr-xr-x 1 root root   20  9月13日 15:55 ../
   256 drwxr-xr-x 1 root root   54  8月28日 23:32 1757749508/
   256 drwxr-xr-x 1 root root   54  8月28日 23:32 1757749569/
   256 drwxr-xr-x 1 root root   54  8月28日 23:32 1757749630/
   256 drwxr-xr-x 1 root root   54  8月28日 23:32 1757749691/
   256 drwxr-xr-x 1 root root   54  8月28日 23:32 1757749752/
   256 drwxr-xr-x 1 root root   54  8月28日 23:32 1757749813/
   256 drwxr-xr-x 1 root root   54  8月28日 23:32 1757749874/
   256 drwxr-xr-x 1 root root   54  8月28日 23:32 1757749935/
   256 drwxr-xr-x 1 root root   54  8月28日 23:32 1757749996/
```

类似 `1757749996` 这种就是一个快照.

因为 pmbs 以 `root` 创建 **只读** 快照, 普通用户无权限删除或修改快照,
只能读取快照中的文件, 所以可以有效避免快照被误删, 并且从快照中恢复文件也无需 root.

```sh
> rm -r 1757749996
rm: 无法删除 '1757749996': 只读文件系统
```

根据配置, pmbs 会自动删除旧的快照.
如果要手动删除快照, 请使用 `btrfs` 命令 (需要 root): <https://wiki.archlinux.org/title/Btrfs#Deleting_a_subvolume>

此外, pmbs **不会检查剩余储存空间**, 只要被启动就会无脑创建快照.
所以请关注剩余存储空间, 经常查看, 在存储占满之前采取措施 (比如修改配置, 手动删除快照等).

----

完整的命令行参数说明:

```sh
> pmbs --帮助
胖喵必快 (pmbs): (每分钟) 创建 btrfs 快照, 并自动清理.
用法: pmbs 命令 参数..

pmbs snapshot SUBVOL
    创建指定 btrfs subvol 的快照.

pmbs ls SUBVOL
    列出对应 subvol 的所有快照.

----
批量执行命令:

pmbs config snapshot
    读取所有配置文件, 并创建相应快照 (通常在 systemd timer 中定期执行).

pmbs config snapshot PATH
    读取指定配置文件, 并创建快照.

pmbs config clean
    读取所有配置文件, 并执行自动清理 (通常在 systemd timer 中定期执行).

pmbs config clean PATH
    读取指定配置文件, 并清理对应快照.

----
测试命令:

pmbs config test
    测试读取配置文件 (检查配置文件错误).

pmbs config test-clean PATH
    读取指定配置文件, 测试清理快照 (并不实际执行).

----
pmbs --版本
    显示版本信息.

pmbs --帮助
    显示此帮助信息.

pmbs --version
    显示版本信息.

pmbs --help
    显示帮助信息 (英文).

更多信息: <https://github.com/fm-elpac/pmbs> <https://crates.io/crates/pmbs>
```


## 3 主要设计与实现

pmbs 的主要设计用途是 **防误删**, 通过每分钟自动创建 btrfs **快照** (snapshot) 来实现.
这样, 如果发生误删, 可以从之前的快照里把文件复制回来.

然而, 快照本身也可能被误删. 为了 **防止快照被误删**, pmbs 以 `root` 创建 **只读** 快照.
这样, 普通用户就无法删除或修改快照, 降低了快照被误删的可能.
读取快照无需 root, 所以如果发生了误删, 恢复文件无需 root, 普通用户即可进行.

当然, 如果你使用 root (比如 `sudo`) 快照依然可以被删除.
但是, 你都使用 root 了是吧, 那发生什么都不奇怪了 (狗头)

所以, pmbs 本身需要以 **root** 运行 !
root 是 Linux 系统的超级用户, 权限很高, 如果出问题, 后果很严重.
为了减少使用 root 的风险, pmbs 具有以下设计:

+ (1) **程序代码本身尽量可靠**. 所以 pmbs 选择使用 **rust** 来编写, 并避免使用 `unsafe`:
  <https://www.rust-lang.org/>

  据窝所知, rust 是最 **严格** 的编译器, 虽然写代码比较麻烦 (经常编译报错),
  但是一旦编译通过, 程序是比较可靠的, 很少出 BUG.

+ (2) **设计和功能尽量简单**. 因为简单的东西更容易被理解, 更不容易出 BUG.

  同时 pmbs 的程序代码尽量保持简单.
  避免一段代码出问题的最好方法, 就是根本不把这段代码写进程序里 ! (狗头)

  pmbs 主要有 2 个功能: **创建快照**, **自动清理**.
  在功能方面是十分克制的 !

+ (3) **二次检查和容错设计**. 在关键位置进行二次检查, 避免出错.
  比如 pmbs 在删除一个快照之前, 使用正则表达式对 subvol 的路径进行检查,
  避免删除不是由 pmbs 创建的快照 (也就是路径格式必需符合).

  有多个配置文件 (对多个 subvol 创建快照) 时, pmbs 通过为每个配置文件启动一个进程,
  进行错误隔离: 如果一个配置文件出错, 或者 pmbs 程序崩溃, 不会影响其余配置文件.

通过这些设计, pmbs 希望能够尽量降低风险, 提高可靠程度.

----

防误删, 或者说避免数据丢失, 是 pmbs 的高优先目标. 为了实现这个目标, 在别的方面有所妥协.

比如 pmbs 不会检查剩余存储空间, 只会不停的创建新的快照, 所以存在占满存储空间的风险.

比如 pmbs 使得彻底删除一个文件变的十分麻烦. 即使文件删除了, 快照里面还有.
根据配置, 一个快照可能要经过几天, 甚至数月时间, 才会最终被自动删除.
这可能会增加数据被泄露的风险.

pmbs 使用宽松的 `MIT` 许可 (而不是 GPL), 因为防误删是更重要的嘛 (狗头)

### 3.1 定期执行 (systemd timer)

pmbs 本身只是一个命令行程序, 为了定期执行, 使用 systemd 定时器驱动: <https://wiki.archlinux.org/title/Systemd/Timers>

文件 `/usr/lib/systemd/system/pmbs-snapshot.service`:

```sh
[Unit]
Description=Create btrfs snapshot (every minute) for pmbs

[Service]
ExecStart=/usr/bin/pmbs config snapshot
```

文件 `/usr/lib/systemd/system/pmbs-snapshot.timer`:

```sh
[Unit]
Description=Create btrfs snapshot (every minute) for pmbs

[Timer]
OnStartupSec=120
OnUnitInactiveSec=60
AccuracySec=1
RandomizedDelaySec=1

[Install]
WantedBy=timers.target
```

`pmbs-snapshot.service` 是一个 systemd 服务, 启动后会执行 `pmbs config snapshot` 命令.

`pmbs-snapshot.timer` 是一个定时器, 触发后会启动 `pmbs-snapshot.service`.
此处配置每 60 秒 (1 分钟) 执行一次, 从而每分钟创建 btrfs 快照.

类似的, `pmbs-clean.service` (`pmbs-clean.timer`) 会定期执行 `pmbs config clean` 命令,
10 分钟执行一次自动清理.

### 3.2 配置文件

pmbs 启动后, 首先读取 **环境变量** (env):

+ `PMBS_DIR_ETC` (默认值 `/etc/pmbs`): 从这个目录读取配置文件 (`*.toml`).

+ `PMBS_DIR_LOG` (默认值 `/var/log/pmbs`): 日志文件目录.

+ `PMBS_BIN_BTRFS` (默认值 `btrfs`): btrfs 命令.

+ `RUST_LOG` (默认值 `info`): 输出日志级别, 详见 `env_logger`: <https://crates.io/crates/env_logger>

----

pmbs 从配置文件目录读取配置文件, 文件名以 `.toml` 结尾的都是配置文件,
每个配置文件对应一个 btrfs subvol.

除了指定 subvol 路径, 配置文件更重要的是快照保留规则, 比如:

```toml
[[keep]]
time = "1m"  # 间隔 1 分钟 (60 秒)
n = 30  # 保留 30 个 (共 30 分钟)
```

`time` 指定间隔时间, 允许的单位有 `m` (分钟), `h` (小时), `d` (天).
pmbs 使用正则表达式对时间格式进行检查, 不符合就会报错.
在内部, pmbs 会把时间转换成 **秒** (s), 比如 `5m` 对应 `300`.

`n` 指定本条规则对应保留的快照个数.

快照保留规则可以有多个, 从而可以灵活配置.

### 3.3 创建快照

`pmbs config snapshot` 命令执行时, pmbs 会读取所有配置文件, 并为每个配置文件启动一个进程.
比如存在配置文件 `/etc/pmbs/home.toml`, 那么会执行 `pmbs config snapshot /etc/pmbs/home.toml` 命令.
这样可以实现 **错误隔离**, 如果一个配置文件对应的执行出错 (程序崩溃), 其余配置文件不受影响.

pmbs 读取配置文件获取对应的 btrfs subvol 路径, 比如:

```toml
subvol = "/home"
```

那么 pmbs 会对 `/home` 创建快照.

pmbs 创建的快照保存在 `.pmbs` 目录中, 格式为 `年/时间戳`, 比如 `/home/.pmbs/2025/1757749996`.
其中时间戳是 `UNIX_EPOCH` 开始的秒数.

pmbs 执行 btrfs 命令来创建只读快照, 比如:

```sh
btrfs subvol snapshot -r /home /home/.pmbs/2025/1757749996
```

符号链接 `.pmbs/latest` 指向最新的快照.

----

为了创建快照, pmbs 只需要 2 个数据: btrfs subvol 路径, 以及当前时间,
所以这是一个简单直接的过程.

可以使用 `pmbs snapshot` 命令手动创建快照.

### 3.4 自动清理

`pmbs config clean` 命令执行时, pmbs 会读取所有配置文件, 并为每个配置文件启动一个进程.

pmbs 读取配置文件获取 btrfs subvol 路径, 以及快照保留规则.
然后通过遍历目录获取全部快照的列表, 工作方式与 `pmbs ls` 命令相同.

好了, pmbs 现在有了 **快照列表** 和 **保留规则列表**, 可以开始执行自动清理了.

----

自动清理的过程为: (1) 决定每个快照是保留, 还是清理. (2) 执行清理.

一旦决定了快照的保留/清理 (**快照命运决定**), pmbs 就可以调用 btrfs 命令来删除被标记为清理的快照了.

----

**快照命运决定** 是 pmbs 中最复杂的部分.

为了简化对时间的处理, 使用 **秒** (`u64` 整数) 来表示所有时间:
快照的创建时间 (时间戳) 使用秒, 快照保留规则的间隔时间也转换为秒.

快照命运决定过程使用以下列表:

+ 剩余快照列表: 存放还未被决定的快照, 初始状态包含全部快照.
  按照时间降序排序, 最晚的快照放在最前面.

+ 保留列表: 存放已经决定保留的快照, 用于调试. 初始状态为空.

+ 清理列表: 存放已经决定清理的列表, 稍后将被删除. 初始状态为空.

+ 临时列表: 存放暂时还未决定的一批快照. 初始状态为空.

+ 剩余规则列表: 存放没有被消耗 (使用) 的快照保留规则. 初始状态存放展开后的快照保留规则.

----

快照保留规则的展开, 比如:

```toml
[[keep]]
time = "1m"
n = 3

[[keep]]
time = "5m"
n = 2

[[keep]]
time = "1h"
n = 1
```

展开之后是 `[ 60, 60, 60, 300, 300, 3600 ]`, 一共 6 条规则.

----

快照命运决定过程:

(1) 以 **最后** 一个快照为时间基准. pmbs (在自动清理时) **"不知道"** 现在的时间,
如果没有新的快照被创建, 无论执行自动清理多少次, 结果都一样.

这种设计是为了避免这种情况: 假设配置了保留最近 3 天的快照, 然后关机, 3 天后再开机.
如果根据现在的时间, 那么一启动, 所有的快照都被删除了 !

**最近 5 分钟** 的快照, 全部 **保留**. 这个规则是 **硬编码** 写进 pmbs 代码的, 无条件强制执行.
所以无论如何配置, pmbs 都不会删除最近 5 分钟的快照.

(2) **遮盖区间**: 从剩余规则列表取出第一条规则, 指定时间长度.
以剩余快照列表的第一个快照的时间, 指定时间基准.
剩余快照列表中, 所有落在这个遮盖区间 (时间基准, 时间长度) 时间范围内的快照,
全部取出放入临时列表.

(3) 清空 (处理) 临时列表: 临时列表中, 最后一个快照 (时间最早) **保留**, 其余快照 **清理**.
同时消耗一条规则.

(4) 如果规则消耗完, 那么剩余快照全部 **清理**.

(5) 按照上述方式清空剩余快照列表后, 检查快照数量: 保留列表 + 清理列表 是否等于快照总数.
如果不符, 报错退出.

这样的设计, pmbs 倾向于 **保留更多快照**, 即使发生各种不可预知的情况.
比如不定时的开机/关机, 快照在时间上分布不均匀等.
比如, 如果配置了共计 10 条规则, 那么 pmbs 会尽量保留 10 个快照,
从而尽量避免误删除快照.

----

可以使用 `pmbs config test-clean` 命令测试快照命运决定 (无需 root), 比如:

```sh
> env RUST_LOG=debug pmbs config test-clean /etc/pmbs/home.toml
[2025-09-13T14:06:37Z DEBUG pmbs::config] read config  /etc/pmbs/home.toml
[2025-09-13T14:06:37Z DEBUG pmbs::config] time 1m = 60s
[2025-09-13T14:06:37Z DEBUG pmbs::config] time 5m = 300s
[2025-09-13T14:06:37Z DEBUG pmbs::config] time 20m = 1200s
[2025-09-13T14:06:37Z DEBUG pmbs::config] time 1h = 3600s
[2025-09-13T14:06:37Z DEBUG pmbs::config] time 2h = 7200s
[2025-09-13T14:06:37Z DEBUG pmbs::config] time 1d = 86400s
[2025-09-13T14:06:37Z DEBUG pmbs::config] sum_n = 94
[2025-09-13T14:06:37Z DEBUG pmbs::cli] config  {"path":"home.toml","config":{"pmbs":1,"subvol":"/home","keep":[{"time":"1m","n":30},{"time":"5m","n":12},{"time":"20m","n":9},{"time":"1h","n":24},{"time":"2h","n":12},{"time":"1d","n":7}]}}
[2025-09-13T14:06:37Z DEBUG pmbs::clean] rule  [PmbsConfigKeep { time: "1m", n: 30, s: 60 }, PmbsConfigKeep { time: "5m", n: 12, s: 300 }, PmbsConfigKeep { time: "20m", n: 9, s: 1200 }, PmbsConfigKeep { time: "1h", n: 24, s: 3600 }, PmbsConfigKeep { time: "2h", n: 12, s: 7200 }, PmbsConfigKeep { time: "1d", n: 7, s: 86400 }]
[2025-09-13T14:06:37Z DEBUG pmbs::clean] snapshot  [1757772365, 1757772304, 1757772243, 1757772182, 1757772121, 1757772060, 1757771998, 1757771937, 1757771875, 1757771814, 1757771753, 1757771692, 1757771631, 1757771569, 1757771508, 1757771447, 1757771386, 1757771325, 1757771264, 1757771202, 1757771141, 1757771080, 1757771018, 1757770957, 1757770896, 1757770835, 1757770774, 1757770713, 1757770652, 1757770591, 1757770530, 1757770469, 1757770408, 1757770347, 1757770286, 1757770224, 1757770163, 1757770102, 1757770040, 1757769979, 1757769918, 1757769857, 1757769549, 1757769241, 1757768936, 1757768569, 1757768264, 1757767956, 1757767649, 1757767280, 1757766971, 1757766603, 1757766296, 1757765989, 1757764763, 1757762801, 1757761577, 1757760230, 1757758023, 1757756737, 1757755078, 1757753792, 1757751527, 1757747672, 1757743445, 1757739277, 1757734688, 1757730525, 1757725323, 1757720795, 1757715287, 1757709784, 1757705929, 1757701521, 1757696990, 1757692826, 1757687878, 1757675395, 1757662602, 1757657763, 1757653352, 1757648270, 1757644658, 1757639273, 1757634807, 1757630333, 1757624821, 1757619985, 1757612032, 1757603267, 1757595127, 1757585827, 1757578368, 1757569061, 1757560127, 1757550026, 1757539494, 1757530545, 1757521729, 1757494545, 1757402496, 1757313672, 1757226163, 1757131290, 1756969381, 1756756617]
[2025-09-13T14:06:37Z DEBUG pmbs::clean] keep  [1757772365, 1757772304, 1757772243, 1757772182, 1757772121, 1757772060, 1757771998, 1757771937, 1757771875, 1757771814, 1757771753, 1757771692, 1757771631, 1757771569, 1757771508, 1757771447, 1757771386, 1757771325, 1757771264, 1757771202, 1757771141, 1757771080, 1757771018, 1757770957, 1757770896, 1757770835, 1757770774, 1757770713, 1757770652, 1757770591, 1757770530, 1757770469, 1757770408, 1757770347, 1757770286, 1757769979, 1757769857, 1757769549, 1757769241, 1757768936, 1757768569, 1757768264, 1757767956, 1757767649, 1757767280, 1757766971, 1757766603, 1757765989, 1757764763, 1757762801, 1757761577, 1757760230, 1757758023, 1757756737, 1757755078, 1757753792, 1757751527, 1757747672, 1757743445, 1757739277, 1757734688, 1757730525, 1757725323, 1757720795, 1757715287, 1757709784, 1757705929, 1757701521, 1757696990, 1757692826, 1757687878, 1757675395, 1757662602, 1757657763, 1757653352, 1757648270, 1757644658, 1757639273, 1757634807, 1757630333, 1757619985, 1757612032, 1757603267, 1757595127, 1757585827, 1757578368, 1757569061, 1757560127, 1757550026, 1757539494, 1757530545, 1757521729, 1757494545, 1757402496, 1757313672, 1757226163, 1757131290, 1756969381, 1756756617]
[2025-09-13T14:06:37Z DEBUG pmbs::clean] clean  [1757624821, 1757766296, 1757769918, 1757770040, 1757770102, 1757770163, 1757770224]
[2025-09-13T14:06:37Z DEBUG pmbs::cli] total = 106, keep = 99, clean = 7
keep 2025/1757772365  2025-09-13T22:06:05+08:00
keep 2025/1757772304  2025-09-13T22:05:04+08:00
keep 2025/1757772243  2025-09-13T22:04:03+08:00
keep 2025/1757772182  2025-09-13T22:03:02+08:00

省略

clean 2025/1757624821  2025-09-12T05:07:01+08:00
clean 2025/1757766296  2025-09-13T20:24:56+08:00
clean 2025/1757769918  2025-09-13T21:25:18+08:00
clean 2025/1757770040  2025-09-13T21:27:20+08:00
clean 2025/1757770102  2025-09-13T21:28:22+08:00
clean 2025/1757770163  2025-09-13T21:29:23+08:00
clean 2025/1757770224  2025-09-13T21:30:24+08:00
```

这个命令只会给出决定结果, 而不会实际删除快照.


## 4 总结与展望

pmbs 通过每分钟创建只读 btrfs 快照来实现防误删, 如果误删, 可以从快照恢复.
systemd timer 驱动定期执行 pmbs 的创建快照/自动清理.
使用配置文件指定 subvol 路径和快照保留规则.
快照命运决定过程使用遮盖区间来尽量保留更多快照.
为了防误删的高优先目标, pmbs 在别的一些方面有妥协.

为了防止快照本身被误删, pmbs 需要以 root 运行.
为了降低风险, 使用 rust 编程语言编写, 并在设计功能和代码上尽量保持简单.

btrfs 快照在单台机器上运行, 存在单点故障.
如果发生硬件损坏等情况, 仍然会造成数据丢失.
为了避免单点故障, 需要通过网络扩展至多台机器.


## 附录 1 编译 ArchLinux 软件包 (AUR, x86_64)

可以从 AUR 编译: <https://aur.archlinux.org/packages/pmbs> <https://aur.archlinux.org/packages/pmbs-bin>

```sh
makepkg
```

参考: <https://wiki.archlinux.org/title/Arch_User_Repository>

----

也可以从源码手动编译, 首先 **下载源码包** (并解压):

```sh
curl -o pmbs.tar.gz -L https://crates.io/api/v1/crates/pmbs/0.1.0-a4/download
tar -xvf pmbs.tar.gz
```

如果直接在 ArchLinux 系统上编译, 可以不安装 toolbox, 否则建议使用 toolbox.

**安装 `toolbox`**: <https://containertoolbx.org/>

```sh
sudo pacman -S toolbox
```

验证安装:

```sh
> toolbox --version
toolbox version 0.2
```

创建 toolbox 运行容器:

```sh
toolbox create -d arch
```

验证:

```sh
> toolbox list
IMAGE ID      IMAGE NAME                                    CREATED
98d4add5d03c  quay.io/toolbx/arch-toolbox:latest            3 days ago

CONTAINER ID  CONTAINER NAME       CREATED        STATUS   IMAGE NAME
7fde8a55ffe2  arch-toolbox-latest  9 seconds ago  created  quay.io/toolbx/arch-toolbox:latest
```

进入 toolbox 容器:

```sh
toolbox enter arch-toolbox-latest
```

----

安装依赖软件包:

```sh
sudo pacman -Syu
sudo pacman -S btrfs-progs rust
```

编译 pmbs (二进制):

```sh
cd pmbs-0.1.0-a4
cargo build --release
```

打包:

```sh
make pmbs-src
cp target/release/pmbs build-aur/
cp pmbs-src.tar build-aur/

cd build-aur
makepkg
```

获得软件包: `pmbs-bin-0.1.0a4-1-x86_64.pkg.tar.zst`


## 附录 2 编译 Fedora CoreOS 软件包 (RPM)

下载源码包, 安装 toolbox, 编译 pmbs (二进制) 等, 请见 附录 1. 此处仅说明打包过程.

如果直接在 Fedora 42 系统上编译, 可以不安装 toolbox, 否则建议使用 toolbox.

创建 toolbox 运行容器:

```sh
toolbox create -d fedora -r 42
```

进入 toolbox 容器:

```sh
toolbox enter fedora-toolbox-42
```

----

安装依赖软件包:

```sh
sudo dnf install rpm-build rpm-devel rpmdevtools make btrfs-progs
```

打包:

```sh
make pmbs-src

rpmdev-setuptree

cp build-rpm/pmbs.spec ~/rpmbuild/SPECS/
cp target/release/pmbs ~/rpmbuild/SOURCES/
cp pmbs-src.tar ~/rpmbuild/SOURCES/

rpmbuild -bb ~/rpmbuild/SPECS/pmbs.spec
```

获得软件包: `pmbs-0.1.0a4-1.fc42.x86_64.rpm` (目录 `~/rpmbuild/RPMS/x86_64/`)


## 附录 3 编译 Ubuntu 软件包 (DEB) (初步支持)

下载源码包, 安装 toolbox, 编译 pmbs (二进制) 等, 请见 附录 1. 此处仅说明打包过程.

如果直接在 Ubuntu 系统上编译, 可以不安装 toolbox, 否则建议使用 toolbox.

创建 toolbox 运行容器:

```sh
toolbox create -d ubuntu -r 25.04
```

进入 toolbox 容器:

```sh
toolbox enter ubuntu-toolbox-25.04
```

----

安装依赖软件包:

```sh
sudo apt update
sudo apt install make
```

打包:

```sh
cd build-deb
make
```

获得软件包: `pmbs.deb`

吐槽: 没想到老牌 Debian 的包 (DEB) 打包反而是最麻烦的 (笑哭)


## 附录 4 交叉编译 (aarch64, rv64gc)

除了 `x86_64` CPU, 本软件还支持编译到 `aarch64` 和 `rv64gc` (感谢 rust !)
此处仅说明编译 pmbs (二进制) 的过程 (假设在 ArchLinux 系统上编译).

首先安装 `rustup`: <https://www.rust-lang.org/learn/get-started>

----

编译 `aarch64`, 首先安装依赖软件包:

```sh
sudo pacman -S aarch64-linux-gnu-gcc
```

安装 rust 编译工具:

```sh
rustup target add aarch64-unknown-linux-gnu
```

编译:

```sh
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc
export CC_aarch64_unknown_linux_gnu=aarch64-linux-gnu-gcc
export CXX_aarch64_unknown_linux_gnu=aarch64-linux-gnu-g++
cargo build --release --target aarch64-unknown-linux-gnu
```

获得文件: `target/aarch64-unknown-linux-gnu/release/pmbs`

----

编译 `rv64gc`, 首先安装依赖软件包:

```sh
sudo pacman -S riscv64-linux-gnu-gcc
```

安装 rust 编译工具:

```sh
rustup target add riscv64gc-unknown-linux-gnu
```

编译:

```sh
export CARGO_TARGET_RISCV64GC_UNKNOWN_LINUX_GNU_LINKER=riscv64-linux-gnu-gcc
export CC_riscv64gc_unknown_linux_gnu=riscv64-linux-gnu-gcc
export CXX_riscv64gc_unknown_linux_gnu=riscv64-linux-gnu-g++
cargo build --release --target riscv64gc-unknown-linux-gnu
```

获得文件: `target/riscv64gc-unknown-linux-gnu/release/pmbs`

----

本文使用 CC-BY-SA 4.0 许可发布.
