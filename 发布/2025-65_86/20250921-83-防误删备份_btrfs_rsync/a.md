# 防误删 (实时) 文件备份系统 (btrfs 快照 + rsync)

**痛 !** 太痛了 !!
窝在北京干日结临时工, 晚上下班回到租住的偏远农村小窝, 已经很晚了.
拼了命的好不容易写一点东西, 然后又被误删丢失了 .. .
悲, 大哭了一顿.

于是, 痛定思痛, 喵的, 窝决定弄一个没有单点故障的 **防误删** (实时) 文件备份系统:

+ 所有组件不出故障时, 误删造成的数据丢失不超过 5 分钟.

+ 系统不存在单点故障: 任意单个组件失效, 不会造成数据彻底丢失.

+ 可扩展: 通过增加机器数量, 系统可容忍更多故障 (比如同时出现 2 个故障).

经过半个月的努力, 这样的系统终于造好了 !

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 83 号作品. )

**免责声明: 这是开源软件, 没有任何担保, 用户应该承担使用本软件造成的一切后果.**
如果不能接受, 请勿使用本软件 !

----

相关文章:

+ 《胖喵必快 (pmbs): btrfs 自动快照工具 (每分钟快照)》

  TODO

+ 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》

  TODO

+ 《小水滴系列文章目录 (整理)》

  TODO

+ 《基于 sftp 的 NAS (局域网文件存储服务器)》

  TODO

+ 《光盘 RAID: 允许丢失损坏的备份数据》

  TODO

参考资料:

+ <https://wiki.archlinux.org/title/Rsync>
+ <https://rsync.samba.org/>
+ <https://download.samba.org/pub/rsync/rsync.1>
+ <https://rsync.samba.org/how-rsync-works.html>


## 目录

+ 1 双端快照 (pmbs 防误删)

+ 2 rsync 同步 (定期自动执行)

  - 2.1 btrfs 替代方案

+ 3 删除与恢复测试 (模拟误删)

+ 4 总结与展望

+ 附录 1 rsync 工作原理简介


## 1 双端快照 (pmbs 防误删)

安装 pmbs 详见文章 《胖喵必快 (pmbs): btrfs 自动快照工具 (每分钟快照)》.

"双端" 是 **桌面端** 和 **备份服务器端**.
其中桌面端就是自己平时操作的机器, 比如编辑文件, 通常有图形界面.
服务器端是另一台机器, 仅用于文件备份, 没有图形界面.
服务器端的机器在本系统中, 仅用于存储备份数据, 但是这台物理机器可以同时还有别的用途,
不必专用于本系统, 但是别的用途和本系统无关, 此处不考虑.

下面举一个具体的栗子:

----

桌面端配置 (操作系统 ArchLinux):

```sh
> pmbs --version
pmbs version 0.1.0-a4 (x86_64-unknown-linux-gnu, default)
```

配置文件 `/etc/pmbs/home.toml`:

```toml
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
time = "2h"  # 间隔 2 小时 (7200 秒)
n = 12  # 保留 12 个 (共 1 天)

[[keep]]
time = "1d"  # 间隔 1 天 (86400 秒)
n = 7  # 保留 7 个 (共 7 天)
```

配置文件 `/etc/pmbs/home_r.toml`:

```toml
pmbs = 1

subvol = "/home/s202501c7l_r"

[[keep]]
time = "1m"
n = 120

[[keep]]
time = "5m"
n = 48

[[keep]]
time = "20m"
n = 48

[[keep]]
time = "1h"
n = 48

[[keep]]
time = "1d"
n = 7
```

此处配置对 2 个 btrfs subvol 进行快照, 并配置了相应的自动清理规则.
注意此处保留 7 天快照.

配置文件 `~/.ssh/config`:

```sh
Host vfc2-b
    HostName 192.168.31.233
    User b202509b
    IdentityFile ~/.ssh/id_ed25519-vfc2-b202509b
```

这是用于连接服务器端的 SSH 配置 (用于 rsync 以及 shell 登录).

```sh
ssh vfc2-b
```

使用这条命令登录服务器.

----

服务器端配置 (操作系统 Fedora CoreOS 42):

```sh
b202509b@vfc2:~$ rpm-ostree status
State: idle
warning: Failed to query journal: couldn't find current boot in journal
AutomaticUpdatesDriver: Zincati
  DriverState: active; periodically polling for updates (last checked Sun 2025-09-21 06:44:22 UTC)
Deployments:
● ostree-remote-image:fedora:docker://quay.io/fedora/fedora-coreos:stable
                   Digest: sha256:d196ab492e7cadab00e26511cdc6b49c6602b399e1b6f8c5fd174329e1ae10c1
                  Version: 42.20250901.3.0 (2025-09-14T22:45:05Z)
          LayeredPackages: systemd-networkd
            LocalPackages: pmbs-0.1.0a4-1.fc42.x86_64

  ostree-remote-image:fedora:docker://quay.io/fedora/fedora-coreos:stable
                   Digest: sha256:a636ee2280cfba2fff80df0f68641f61212e2e9b9b96d23178353e28df0d6238
                  Version: 42.20250818.3.0 (2025-09-03T02:26:27Z)
          LayeredPackages: systemd-networkd
            LocalPackages: pmbs-0.1.0a4-1.fc42.x86_64
```

配置文件 `/etc/pmbs/b2.toml`:

```toml
# b2.toml
pmbs = 1

subvol = "/var/mnt/data/b2/@b2"

[[keep]]
time = "1m"
n = 120

[[keep]]
time = "5m"
n = 48

[[keep]]
time = "20m"
n = 48

[[keep]]
time = "1h"
n = 48

[[keep]]
time = "1d"
n = 28
```

此处配置对专用于文件备份的 subvol 进行快照.
注意此处保留 28 天快照.

关于这个服务器的系统安装详见文章 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》.

----

硬件配置:

+ 桌面端 (PC, ArchLinux): 小主机 GMK, CPU r7-5825u (8 核 16 线程),
  内存 64GB DDR4-3200 (双通道), 存储 2TB NVMe M.2 SSD.

+ 服务器端 (PC, 虚拟机 VirtualBox, Fedora CoreOS):
  CPU i5-7500 (4 核 4 线程), 内存 20GB DDR4-2400 (双通道, 无 ECC).
  系统盘: 240GB SATA SSD, 数据盘: 单块 6TB 企业级 SATA 机械硬盘 (二手).

+ 局域网: 1Gbps 以太网 (有线, 使用交换机连接).


## 2 rsync 同步 (定期自动执行)

rsync 是一个通过网络复制文件 (同步目录) 的开源软件,
通过对比源目录和目标目录中文件的差异, 只传输变动的部分 (增量更新), 所以速度很快.
关于 rsync 详见: <https://rsync.samba.org/>

ArchLinux 安装 rsync:

```sh
sudo pacman -S rsync
```

验证安装:

```sh
> rsync --version
rsync  version 3.4.1  protocol version 32
Copyright (C) 1996-2025 by Andrew Tridgell, Wayne Davison, and others.
Web site: https://rsync.samba.org/
Capabilities:
    64-bit files, 64-bit inums, 64-bit timestamps, 64-bit long ints,
    socketpairs, symlinks, symtimes, hardlinks, hardlink-specials,
    hardlink-symlinks, IPv6, atimes, batchfiles, inplace, append, ACLs,
    xattrs, optional secluded-args, iconv, prealloc, stop-at, no crtimes
Optimizations:
    SIMD-roll, no asm-roll, openssl-crypto, no asm-MD5
Checksum list:
    xxh128 xxh3 xxh64 (xxhash) md5 md4 sha1 none
Compress list:
    zstd lz4 zlibx zlib none
Daemon auth list:
    sha512 sha256 sha1 md5 md4

rsync comes with ABSOLUTELY NO WARRANTY.  This is free software, and you
are welcome to redistribute it under certain conditions.  See the GNU
General Public Licence for details.
```

下面举一个具体的栗子:

----

为了方便, 把 rsync 命令写成一个简单的 shell 脚本, 比如:
`~/.config/pmbs/rsync/rsync_vfc2_home.sh`

```sh
#!/usr/bin/bash
# rsync_vfc2_home.sh
#
# 参考文档:
# https://wiki.archlinux.org/title/Rsync
# https://download.samba.org/pub/rsync/rsync.1

# 本机源目录
# 以 / 结尾, 确保 rsync 复制目录
FROM=$(realpath /home/.pmbs/latest)/s202501c7l/

# 目标目录 (备份服务器)
TO=vfc2-b:/var/mnt/data/b2/@b2/b2u/home/

# 忽略文件列表
EXCLUDE=~/.config/pmbs/rsync/home-exclude.txt

# 方便调试
echo 开始同步 rsync: $FROM "->" $TO

# rsync 命令行参数解释
#
# -r  递归 (复制目录)
# -l  复制符号链接
# -p  复制文件权限
# -t  复制文件修改时间
#
# -H  保留硬链接
# -x  保持在一个文件系统上 (不跨越挂载点)
# --del  如果源删除了文件, 目标也删除文件
# --delete-excluded  源忽略的文件, 在目标也删除
# -z  传输过程启用压缩
#
# --exclude-from=  忽略文件列表
#
# -v  详细输出
# -n  模拟执行 (并不实际执行)
# --stats  输出传输状态
# --progress  输出传输进度
# -h  方便阅读的数字格式
#
#rsync -rlptHxz --del --delete-excluded --exclude-from=$EXCLUDE -vh --stats --progress -n "$FROM" "$TO"

rsync -rlptHxz --del --delete-excluded --exclude-from=$EXCLUDE -vh --stats  "$FROM" "$TO"
```

这个脚本使用一些参数执行 rsync 命令, 把本机的文件同步 (增量复制) 到服务器端.
具体使用的参数和含义在上面的注释中已经说明, 可以根据自己的具体需求对参数进行调整.

首先执行 `realpath /home/.pmbs/latest` 命令, 获取最新的快照路径,
然后从最新的快照进行复制, 这样可以避免文件不一致, 因为快照是只读的,
其中的文件不会变动.
如果不使用快照, 可能 rsync 一边在复制文件, 另一边同时在修改文件, 可能造成数据不一致等特殊情况.
pmbs 使用 `.pmbs/latest` 符号链接指向最新的快照.

文件 `~/.config/pmbs/rsync/home-exclude.txt`:

```sh
.ssh
.cache

.cargo
.rustup
.deno
.npm
.pnpm-store
.android
.gradle
.venv

node_modules
target
build
Android

cache
Cache
CacheStorage
CachedData
GPUCache
DawnWebGPUCache
DawnGraphiteCache
GrShaderCache
GraphiteDawnCache
ShaderCache
WebStorage

.local/share/containers/storage
.local/share/flatpak/.removed
.local/share/flatpak/appstream
.local/share/flatpak/repo
.local/share/pnpm
.local/share/uv
.local/share/gvfs-metadata
```

这个文件指定 **忽略** 列表, 也就是不会被复制到服务器端的文件.
通过合理配置这个文件, 跳过不必要的文件, 可以显著加快 rsync 速度,
同时减少关键数据泄露的风险.

----

注意 rsync 脚本的可执行权限:

```sh
> chmod +x rsync_vfc2_home.sh
> ls -l rsync_vfc2_home.sh
-rwxr-xr-x 1 s2 s2 1228  9月17日 22:16 rsync_vfc2_home.sh*
```

测试运行:

```sh
> time ./rsync_vfc2_home.sh
开始同步 rsync: /home/.pmbs/2025/1758440996/s202501c7l/ -> vfc2-b:/var/mnt/data/b2/@b2/b2u/home/
sending incremental file list

Number of files: 14,024 (reg: 11,682, dir: 2,301, link: 41)
Number of created files: 0
Number of deleted files: 0
Number of regular files transferred: 0
Total file size: 3.85G bytes
Total transferred file size: 0 bytes
Literal data: 0 bytes
Matched data: 0 bytes
File list size: 0
File list generation time: 0.001 seconds
File list transfer time: 0.000 seconds
Total bytes sent: 390.04K
Total bytes received: 2.43K

sent 390.04K bytes  received 2.43K bytes  156.99K bytes/sec
total size is 3.85G  speedup is 9,814.84

________________________________________________________
Executed in    1.92 secs      fish           external
   usr time   42.35 millis  327.00 micros   42.03 millis
   sys time   89.88 millis  560.00 micros   89.32 millis
```

运行成功 ! 可以看到, 只用了不到 2 秒时间, rsync 还是很快的.

然后配置 systemd timer (user) 定期执行, 配置文件: `~/.config/systemd/user/pmbs-rsync-vfc2-home.service`

```sh
[Unit]
Description=pmbs rsync (vfc2) home

[Service]
ExecStart=%h/.config/pmbs/rsync/rsync_vfc2_home.sh
```

文件 `~/.config/systemd/user/pmbs-rsync-vfc2-home.timer`:

```sh
[Unit]
Description=pmbs rsync (vfc2) home

[Timer]
OnStartupSec=10min
OnUnitInactiveSec=5min
AccuracySec=1min
RandomizedDelaySec=1min

[Install]
WantedBy=timers.target
```

多久运行一次 rsync 可以在这里配置.
然后启用:

```sh
systemctl --user daemon-reload
systemctl --user enable --now pmbs-rsync-vfc2-home.timer
```

查看运行日志:

```sh
journalctl --user -xeu pmbs-rsync-vfc2-home.service
```

----

类似的, 还有 2 个 rsync 脚本:

文件 `~/.config/pmbs/rsync/rsync_vfc2_r.sh`:

```sh
#!/usr/bin/bash
# rsync_vfc2_r.sh

# 本机源目录
# 以 / 结尾, 确保 rsync 复制目录
FROM=$(realpath /home/s202501c7l_r/.pmbs/latest)/s202501c7l/

# 目标目录 (备份服务器)
TO=vfc2-b:/var/mnt/data/b2/@b2/b2u/r/

# 忽略文件列表
EXCLUDE=~/.config/pmbs/rsync/r-exclude.txt

# 方便调试
echo 开始同步 rsync: $FROM "->" $TO

# rsync 命令行参数解释
#
# 省略
rsync -rlptHxz --del --delete-excluded --exclude-from=$EXCLUDE -vh --stats  "$FROM" "$TO"
```

文件 `~/.config/pmbs/rsync/rsync_vfc1_r.sh`:

```sh
#!/usr/bin/bash
# rsync_vfc1_r.sh

# 本机源目录
# 以 / 结尾, 确保 rsync 复制目录
FROM=$(realpath /home/s202501c7l_r/.pmbs/latest)/s202501c7l/

# 目标目录 (备份服务器)
TO=vfc1-b:/var/mnt/data/b1/@b1/b1u/r/

# 忽略文件列表
EXCLUDE=~/.config/pmbs/rsync/r-exclude.txt

# 方便调试
echo 开始同步 rsync: $FROM "->" $TO

# rsync 命令行参数解释
#
# 省略
rsync -rlptHxz --del --delete-excluded --exclude-from=$EXCLUDE -vh --stats  "$FROM" "$TO"
```

其中 `rsync_vfc2_r.sh` 把另一个目录同步到备份服务器 `vfc2`.
而 `rsync_vfc1_r.sh` 同步到另一台备份服务器 `vfc1` !
是的, 备份服务器支持使用多台.

多个目录可以各自配置 rsync (参数及忽略列表),
以及 systemd timer 的运行间隔时间 (建议每个 rsync 使用一个 timer 分别运行),
灵活程度很高.

----

性能测试 (仅供参考):

数据量: 30 万个文件 (共 90GB).

+ 首次同步 (上传服务器端): 平均速度约 50MB/s.

+ 增量同步: 约 10 ~ 30 秒完成 (少量文件更新).

rsync 简单易用, 并且传输速度已经足够快了, 没必要继续优化, 或者使用更复杂的方案了.

rsync 为何高效 ?
因为现代操作系统 (比如 Linux) 会充分利用内存, 最近访问的磁盘 (块) 数据,
会被缓存在内存的空闲空间里.
所以 rsync 频繁执行时, 除了第一次 (冷启动) 需要大量读取磁盘,
之后 (热启动) 几乎不需要读取磁盘, 数据基本上都缓存在内存里,
rsync 只是用 CPU 做一些计算 (比较文件列表) 而已, 所以很快.
所以内存大一些可以加快速度哦 ~

### 2.1 btrfs 替代方案

btrfs 快照依赖使用 btrfs 文件系统.
但是, 如果本机不方便或不想使用 btrfs 文件系统, 也可以使用替代方案:

上面的 "标准" 配置中, 本机 (桌面端) 和服务器端都使用 btrfs 快照 (pmbs),
如果本机不使用 btrfs, 只在服务器端进行快照, 也是可以的.
此时建议每分钟执行一次 rsync 同步文件到服务器.

这种替代方案, 桌面端缺少了本地 btrfs 快照, 如果发生误删, 必须从服务器恢复文件,
并且不能很好的避免单点故障.
但是仍然可以享受到本系统的大部分好处.

----

如果服务器端 (物理机) 也不方便使用 btrfs 文件系统, 还有一种替代方案,
就是在虚拟机中运行 Linux 系统, 并配置 btrfs 快照.
详见文章 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》.


## 3 删除与恢复测试 (模拟误删)

上述 **双端 btrfs 快照 + rsync 同步** 架构, 如果发生了误删,
可以首先尝试从本机 (桌面端) 的快照中恢复.
如果本机快照不可用, 还可以从服务器端的快照中恢复, 双端的快照都可以防误删.

系统整体可分为 3 部分: 桌面端, 备份服务器端, 网络 (局域网).
如果桌面端故障, 数据仍然在服务器端完好.
如果服务器端故障, 数据仍然在桌面端完好.
如果网络故障, 虽然无法 rsync 同步数据到服务器端, 但桌面端的数据仍然完好.
所以, 本系统不存在单点故障.

并且, 本系统支持同时使用多台备份服务器, 可以进一步降低数据丢失的风险.
使用多台服务器时, 可以从桌面端 rsync 推送到多个服务器,
也可以桌面端同步到一台服务器, 这台服务器再同步到更多服务器,
这些都可以灵活配置.

----

接下来进行删除与恢复测试, 模拟发生误删的情况.

首先写一个用于测试的 Deno 程序: <https://deno.com/>

文件 `test1.js`:

```js
// 每 10 秒向文件 test202509.txt 写入当前时间, 模拟频繁修改文件

async function 写测试文件() {
  const 当前时间 = new Date().toISOString();
  // 方便调试
  console.log(当前时间);

  // 写入文件
  await Deno.writeTextFile("test202509.txt", 当前时间);
}

// 每 10 秒执行一次
setInterval(写测试文件, 10 * 1000);

// 启动后立即写一次
写测试文件();
```

很简单, 只有 6 行代码. 然后运行:

```sh
deno run --allow-write test1.js
```

然后耐心等待几分钟.

![测试 (1)](./图/3-t-1.png)

然后按 `Ctrl+C` 停止程序, 最后时间为:

```sh
2025-09-21T12:39:07.622Z
```

然后立即删除测试文件 `test202509.txt`.

好, "误删" 发生了 !

----

首先尝试从本机快照恢复:

```sh
> pmbs ls /home/s202501c7l_r
/home/s202501c7l_r/.pmbs/2025/1758458448	2025-09-21T20:40:48+08:00	*latest
/home/s202501c7l_r/.pmbs/2025/1758458386	2025-09-21T20:39:46+08:00
/home/s202501c7l_r/.pmbs/2025/1758458324	2025-09-21T20:38:44+08:00
/home/s202501c7l_r/.pmbs/2025/1758458263	2025-09-21T20:37:43+08:00
/home/s202501c7l_r/.pmbs/2025/1758458202	2025-09-21T20:36:42+08:00
```

去快照里面看看:

```sh
> cd /home/s202501c7l_r/.pmbs/2025/1758458448/s202501c7l/pmks-2/草稿/计算机入门/N_防误删备份_btrfs_rsync/
> ls -l
总计 24
drwxr-xr-x 1 s2 s2    18  9月21日 20:35 图/
-rw-r--r-- 1 s2 s2 17384  9月21日 20:39 a.md
-rw-r--r-- 1 s2 s2     0  9月16日 23:10 README.md
-rw-r--r-- 1 s2 s2   412  9月21日 20:25 test1.js
> cd /home/s202501c7l_r/.pmbs/2025/1758458386/s202501c7l/pmks-2/草稿/计算机入门/N_防误删备份_btrfs_rsync/
> ls -l
总计 28
drwxr-xr-x 1 s2 s2    18  9月21日 20:35 图/
-rw-r--r-- 1 s2 s2 17384  9月21日 20:39 a.md
-rw-r--r-- 1 s2 s2     0  9月16日 23:10 README.md
-rw-r--r-- 1 s2 s2   412  9月21日 20:25 test1.js
-rw-r--r-- 1 s2 s2    24  9月21日 20:39 test202509.txt
> cat test202509.txt 
2025-09-21T12:39:07.622Z
```

很好 ! 我们从第 2 个快照中成功恢复了文件 (别忘了把文件复制出来哦).

----

接下来尝试从服务器端恢复:

```sh
> ssh vfc2-b
Fedora CoreOS 42.20250901.3.0
Tracker: https://github.com/coreos/fedora-coreos-tracker
Discuss: https://discussion.fedoraproject.org/tag/coreos

Last login: Sun Sep 21 11:17:18 2025 from 192.168.31.238
b202509b@vfc2:~$ pmbs ls /var/mnt/data/b2/@b2
/var/mnt/data/b2/@b2/.pmbs/2025/1758458955	2025-09-21T12:49:15+00:00	*latest
/var/mnt/data/b2/@b2/.pmbs/2025/1758458889	2025-09-21T12:48:09+00:00
/var/mnt/data/b2/@b2/.pmbs/2025/1758458822	2025-09-21T12:47:02+00:00
/var/mnt/data/b2/@b2/.pmbs/2025/1758458759	2025-09-21T12:45:59+00:00
/var/mnt/data/b2/@b2/.pmbs/2025/1758458697	2025-09-21T12:44:57+00:00
/var/mnt/data/b2/@b2/.pmbs/2025/1758458635	2025-09-21T12:43:55+00:00
/var/mnt/data/b2/@b2/.pmbs/2025/1758458561	2025-09-21T12:42:41+00:00
/var/mnt/data/b2/@b2/.pmbs/2025/1758458497	2025-09-21T12:41:37+00:00
/var/mnt/data/b2/@b2/.pmbs/2025/1758458427	2025-09-21T12:40:27+00:00
/var/mnt/data/b2/@b2/.pmbs/2025/1758458366	2025-09-21T12:39:26+00:00
/var/mnt/data/b2/@b2/.pmbs/2025/1758458302	2025-09-21T12:38:22+00:00
```

去快照里面看看:

```sh
$ cd /var/mnt/data/b2/@b2/.pmbs/2025/1758458561/b2u/r/pmks-2/草稿/计算机入门/N_防误删备份_btrfs_rsync/
$ ls -l
total 24
-rw-r--r--. 1 b202509b b202509b     0 Sep 16 15:10 README.md
-rw-r--r--. 1 b202509b b202509b 17465 Sep 21 12:41 a.md
-rw-r--r--. 1 b202509b b202509b   412 Sep 21 12:25 test1.js
drwxr-xr-x. 1 b202509b b202509b    18 Sep 21 12:35 图
$ cd /var/mnt/data/b2/@b2/.pmbs/2025/1758458497/b2u/r/pmks-2/草稿/计算机入门/N_防误删备份_btrfs_rsync/
$ ls -l
total 28
-rw-r--r--. 1 b202509b b202509b     0 Sep 16 15:10 README.md
-rw-r--r--. 1 b202509b b202509b 17247 Sep 21 12:35 a.md
-rw-r--r--. 1 b202509b b202509b   412 Sep 21 12:25 test1.js
-rw-r--r--. 1 b202509b b202509b    24 Sep 21 12:38 test202509.txt
drwxr-xr-x. 1 b202509b b202509b    18 Sep 21 12:35 图
$ cat test202509.txt 
2025-09-21T12:38:37.618Z
```

好, 成功从服务器的快照中恢复文件, 但是丢失了大约 1 分钟的修改.

综上, 这个测试验证了, 如果发生误删, 只会丢失最近几分钟的修改.


## 4 总结与展望

本系统采用 **双端 btrfs 快照 + rsync 同步** 架构,
其中 (每分钟) 创建本地只读 btrfs 快照用于 **防误删**,
rsync 多机文件同步 (复制) 用于 **避免单点故障**, 防止数据丢失 (备份).
这个架构类似于分布式数据库的 **主从** 复制 (但是多了快照防误删),
其中桌面端相当于主, 备份服务器端相当于从, 支持一主多从.

btrfs 快照轻量, 秒级创建 (约 1 秒). rsync 同步高效, 秒级完成 (约 10 ~ 30 秒).
普通用户 (无 root) 只能读取快照, 无权限删除快照, 有效避免快照被误删.
每分钟快照将被误删的数据丢失可能缩短到分钟级, 多机主从文件复制避免了单点故障,
进一步减少了数据彻底丢失的可能.
rsync 使用 SSH 传输数据 (使用公钥登录), 增强了数据安全.

本系统的大部分软件组件使用现有的成熟开源软件,
比如 GNU/Linux, btrfs, systemd, rsync, SSH 等.
虽然快照部分依赖 btrfs, 但如果不想在本地使用 btrfs,
也可以选择只在服务器端进行快照的方案.
还可以在虚拟机中运行 Linux 系统作为服务器端, 进一步增加了系统的适用场景.

pmbs 需要以 root 运行, 存在较高安全风险, 也没有方便操作的图形界面.
这些方面未来可以继续完善.


## 附录 1 rsync 工作原理简介

参考: <https://rsync.samba.org/how-rsync-works.html>

rsync 的工作涉及 2 个目录: 本机目录 (client), 远程目录 (server).
rsync 的工作方式有 2 种: 推 (push), 拉 (pull).
推送, 就是把本机目录 (源) 同步到远程目录 (目标).
拉取, 就是把远程目录 (源) 同步到本机目录 (目标).

(1) 通过 SSH 传输时, **本机进程** (client) 首先启动, 然后通过 SSH 启动 **远程进程** (server),
同时传递命令行参数, 建立连接并开始传输.
两边的进程 (process) 通过 SSH 通信, 首先协商 **协议版本号** (两边都支持的最高版本),
然后本机进程发送 **排除列表** (忽略文件).
然后, 对应源目录的进程成为 **发送者** (sender), 目标目录的对应进程成为 **接收者** (receiver).

(2) 发送者开始创建 **文件列表** (file list), 也就是列出源目录的所有文件,
包括文件名, 文件大小 (字节), 最后修改时间等.

(3) 文件列表发送完毕后, 接收者通过 `fork` 创建 **生成者** (generator) 进程.
这会建立工作管线:

```
生成者* -> 发送者 -> 接收者*
```

注意: 此处发送者对应源目录 (创建文件列表), 生成者/接收者 (*) 都对应目标目录 (拿到文件列表).

(4) 生成者对比文件列表, 与其对应的目标目录中的文件.
默认情况下, rsync 通过 **文件大小** 和 **最后修改时间** 来判断文件是否修改.
如果这 2 个一样, 就会跳过这个文件.

如果不跳过, 就要同步 (传输) 这个文件.
此处生成者读取本地文件 (目标目录对应的文件, 如果存在), 并为每个数据块创建校验值 (checksum).
然后生成者把校验值发送给发送者.

(5) 发送者拿到校验值之后, 使用 rsync 专用算法, 计算出源目录文件和目标目录文件的差异,
并仅发送差异的数据块.

(6) 接收者拿到差异数据之后, 重建本地文件 (修改目标目录中的文件), 从而完成同步.

通过上述方式, rsync 实现了快速高效的增量更新文件 (同步), 减少了需要发送的数据量.

----

本文使用 CC-BY-SA 4.0 许可发布.
