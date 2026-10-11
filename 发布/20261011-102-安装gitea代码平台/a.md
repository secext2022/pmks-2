# 安装 gitea 代码平台 (Fedora CoreOS)

`git` 是非常强大好用的 **版本控制系统**, 但是如果只在单机 (本机) 使用, 有时候就不太方便了.

**gitea** 是一个代码平台 (开源软件), 可以把 git 仓库放上去, 方便使用.
与功能类似的软件相比, gitea 比较轻量, 安装配置都很简单, 这是其重要优点.

本文在局域网中安装配置一个 gitea 服务器, 可以把 git 仓库集中起来, 方便管理.
如果 gitea 服务器 和 工作机 (桌面 PC) 是不同的物理机器, 那么还可以顺便对 git 仓库进行备份
(比如, 工作机 故障了, 但是 gitea 服务器上还有仓库 (镜像), 数据不会丢失).

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 102 号作品. )


## 目录

+ 1 安装配置

  - 1.1 创建专用 用户 (git) 并配置数据目录
  - 1.2 下载 gitea 并配置用户服务
  - 1.3 首次运行 (初始化配置)
  - 1.4 配置 胖喵必快 (pmbs) btrfs 快照 (可选)

+ 2 测试运行

+ 3 总结与展望

----

相关文章:

+ 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》

  TODO

+ 《防误删 (实时) 文件备份系统 (btrfs 快照 + rsync)》

  TODO

+ 《git 开源平台网站推荐 (2025-06 更新)》

  TODO

参考资料:

+ <https://docs.gitea.com/installation/install-from-binary/>
+ <https://docs.gitea.com/installation/linux-service/>
+ <https://dl.gitea.com/gitea/28.1.0/>
+ <https://github.com/go-gitea/gitea>
+ <https://github.com/go-gitea/gitea/blob/main/contrib/service/systemd/gitea.service>
+ <https://git-scm.com/>


## 1 安装配置

首先, 需要有一个安装好的 Fedora CoreOS 系统:
(详见 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》 等文章)

```sh
> ssh vfc2-core
Fedora CoreOS 44.20260913.3.2
Tracker: https://github.com/coreos/fedora-coreos-tracker
Discuss: https://discussion.fedoraproject.org/tag/coreos

Last login: Sun Oct 11 05:05:02 2026 from 192.168.31.2
core@vfc2-202609:~$ id
uid=1000(core) gid=1000(core) groups=1000(core),4(adm),10(wheel),16(sudo),190(systemd-journal) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
core@vfc2-202609:~$ rpm-ostree status
State: idle
AutomaticUpdatesDriver: Zincati
  DriverState: active; periodically polling for updates (last checked Sun 2026-10-11 05:47:48 UTC)
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
core@vfc2-202609:~$ free -h
               total        used        free      shared  buff/cache   available
Mem:           7.7Gi       698Mi       4.2Gi       780Ki       3.1Gi       7.1Gi
Swap:             0B          0B          0B
core@vfc2-202609:~$ 
```

且 数据盘 使用 `btrfs` 文件系统 (推荐):

```sh
core@vfc2-202609:~$ mount

省略

/dev/sdb1 on /var/mnt/data/b2 type btrfs (rw,nosuid,nodev,relatime,seclabel,compress=zstd:3,ssd,space_cache=v2,subvolid=5,subvol=/)
```

### 1.1 创建专用 用户 (git) 并配置数据目录

创建新用户:

```sh
core@vfc2-202609:~$ sudo useradd -m git
```

创建数据目录:

```sh
core@vfc2-202609:~$ cd /var/mnt/data/b2/
core@vfc2-202609:/var/mnt/data/b2$ sudo btrfs subvol create @gitea
Create subvolume './@gitea'
core@vfc2-202609:/var/mnt/data/b2$ ls -l
total 0
drwxr-xr-x 1 root root 16 Sep 13 06:08 @b2
drwxr-xr-x 1 root root  0 Oct 11 06:36 @gitea
```

此处创建专用的 `btrfs subvol`, 方便快照和数据备份. (如果你不使用 btrfs, 此处可以用 `mkdir` 替代. )

```sh
core@vfc2-202609:/var/mnt/data/b2$ sudo mkdir -p @gitea/git_u
core@vfc2-202609:/var/mnt/data/b2$ sudo chmod 700 @gitea/git_u
core@vfc2-202609:/var/mnt/data/b2$ sudo chown git:git @gitea/git_u
core@vfc2-202609:/var/mnt/data/b2$ ls -l @gitea
total 0
drwx------. 1 git git 0 Oct 11 06:38 git_u
```

创建目录并设置权限.

### 1.2 下载 gitea 并配置用户服务

首先, 切换到 git 用户:

```sh
core@vfc2-202609:~$ sudo systemd-run --system --scope su git
Running as unit: run-p12827-i11465.scope; invocation ID: ba67e1d0e4f74abf862d2e935101b189
git@vfc2-202609:/var/home/core$ cd
git@vfc2-202609:~$ id
uid=1002(git) gid=1002(git) groups=1002(git) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
git@vfc2-202609:~$ pwd
/var/home/git
```

因为 `git` 用户不能直接登录, 所以只能通过 `systemd-run --system --scope su git` 的方式切换过去.

----

从这里下载 gitea 二进制: <https://dl.gitea.com/gitea/28.1.0/>

并解压:

```sh
git@vfc2-202609:~/gitea$ pwd
/var/home/git/gitea
git@vfc2-202609:~/gitea$ sha256sum gitea-28.1.0-linux-amd64.xz
d998643be28c10bbc94a3ab5a5705230fcb54e92f04b9aef3f694dd6d20cb97d  gitea-28.1.0-linux-amd64.xz
git@vfc2-202609:~/gitea$ chmod +x gitea
git@vfc2-202609:~/gitea$ ls -al
total 157504
drwxr-xr-x. 1 git git        64 Oct 11 07:09 .
drwx------. 1 git git        74 Oct 11 07:08 ..
-rwxr-xr-x. 1 git git 119423136 Oct 11 07:09 gitea
-rw-r--r--. 1 git git  41936156 Oct 11 07:09 gitea-28.1.0-linux-amd64.xz
```

注意解压后应该重命名为 `gitea` 不要带版本号.

创建数据目录:

```sh
git@vfc2-202609:~$ cd /var/mnt/data/b2/@gitea/git_u/
git@vfc2-202609:/var/mnt/data/b2/@gitea/git_u$ mkdir -p gitea_data/{custom,data,log}
git@vfc2-202609:/var/mnt/data/b2/@gitea/git_u$ ls -l gitea_data
total 0
drwxr-xr-x. 1 git git 0 Oct 11 07:14 custom
drwxr-xr-x. 1 git git 0 Oct 11 07:14 data
drwxr-xr-x. 1 git git 0 Oct 11 07:14 log
```

----

创建用户服务配置文件:

```sh
git@vfc2-202609:~$ cat ~/.config/systemd/user/gitea.service
[Unit]
Description=Gitea (Git with a cup of tea)
After=network-online.target

[Service]
# Uncomment the next line if you have repos with lots of files and get a HTTP 500 error because of that
# LimitNOFILE=524288:524288
RestartSec=2s
Type=simple

ExecStart=%h/gitea/gitea web --config %h/gitea/app.ini
Restart=always

WorkingDirectory=/var/mnt/data/b2/@gitea/git_u/gitea_data
Environment=USER=git HOME=/home/git GITEA_WORK_DIR=/var/mnt/data/b2/@gitea/git_u/gitea_data

[Install]
WantedBy=default.target
```

加载配置:

```sh
git@vfc2-202609:~$ systemctl --user daemon-reload
```

### 1.3 首次运行 (初始化配置)

启动服务:

```sh
git@vfc2-202609:~$ systemctl --user start gitea
```

打开初始化配置页面:

![初始化配置页面](./图/13-g-1.png)

为了配置简单, 数据库选择 `SQLite3`, 并填写管理员用户名/密码.
最后点击 **立即安装** 按钮.

![安装成功](./图/13-g-2.png)

稍等, 成功 !

----

配置服务自动启动:

```sh
git@vfc2-202609:~$ systemctl --user enable gitea
Created symlink '/var/home/git/.config/systemd/user/default.target.wants/gitea.service' → '/var/home/git/.config/systemd/user/gitea.service'.
```

启用 linger:

```sh
git@vfc2-202609:~$ loginctl enable-linger
git@vfc2-202609:~$ loginctl list-users
 UID USER LINGER STATE 
1000 core no     active
1002 git  yes    active

2 users listed.
```

至此, gitea 安装完成.

### 1.4 配置 胖喵必快 (pmbs) btrfs 快照 (可选)

详见文章: 《防误删 (实时) 文件备份系统 (btrfs 快照 + rsync)》

给 gitea 的数据目录 `/var/mnt/data/b2/@gitea/` 配置 pmbs 快照, 配置文件:

```sh
core@vfc2-202609:~$ cat /etc/pmbs/gitea.toml
# vfc2-202609:gitea.toml
pmbs = 1

subvol = "/var/mnt/data/b2/@gitea"

# 快照保留规则 (用于自动清理)
[[keep]]
time = "1m"  # 间隔 1 分钟 (60 秒)
n = 60  # 保留 60 个 (共 60 分钟)

[[keep]]
time = "5m"
n = 12

[[keep]]
time = "20m"
n = 9

[[keep]]
time = "1h"
n = 48

[[keep]]
time = "1d"
n = 7
core@vfc2-202609:~$ 
```

这样就会自动创建 (并清理旧) btrfs 快照了, 根据配置大约保留最近 7 天.

```sh
core@vfc2-202609:~$ pmbs ls /var/mnt/data/b2/@gitea
/var/mnt/data/b2/@gitea/.pmbs/2026/1791701261	2026-10-11T06:47:41+00:00	*latest
/var/mnt/data/b2/@gitea/.pmbs/2026/1791701200	2026-10-11T06:46:40+00:00
/var/mnt/data/b2/@gitea/.pmbs/2026/1791701136	2026-10-11T06:45:36+00:00
```


## 2 测试运行

重启系统:

```sh
core@vfc2-202609:~$ sudo systemctl reboot

Broadcast message from root@vfc2-202609 on pts/1 (Sun 2026-10-11 07:45:09 UTC):

The system will reboot now!
```

系统重启之后, 看看 gitea 能够正常登录使用.
也就是之前配置的用户服务能否自动启动.

![管理界面](./图/2-t-1.png)

成功 !


## 3 总结与展望

在 CoreOS 上安装配置 gitea 还是比较简单的, 配合 胖喵必快 自动创建 btrfs 快照, 给数据多加一层防护.

如此, 便有了一个在局域网内的 git 代码平台, 可以把 git 仓库放上去啦 ~

虽然 gitea 轻量方便, 但功能还是很丰富的, 还有很多玩法等着你去发现哦 ~

----

本文使用 CC-BY-SA 4.0 许可发布.
