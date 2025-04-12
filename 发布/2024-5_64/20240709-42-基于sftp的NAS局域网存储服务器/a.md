# 基于 sftp 的 NAS (局域网文件存储服务器)

局域网 NAS (文件存储服务器) 的基本功能有:
能够存储文件, 同时能够通过多个设备访问 (上传/下载) 文件.
这些功能通过 sftp 可以实现.
sftp 是基于 SSH 的文件传输协议, SSH 全程加密传输,
使用 **公钥** 认证 (不使用密码/口令), 能够提供很高的安全性.

上文说到, 在 LVM 和 btrfs 的加持之下, 可以获得很高的存储灵活度.
即使只有 2 块硬盘, 也可以同时使用 RAID 0 (文件存储一份) 和
RAID 1 (文件存储 2 份).
并且, **RAID 0 和 RAID 1 占用的存储空间还可以做到动态分配**
(在线扩容).
硬盘数量方面也很灵活, 2 块硬盘, 3 块硬盘, 4 块硬盘,
都可以使用这种存储方案, 添加新的硬盘也很方便.
每小时一次 **快照**, 每月一次 **全盘数据检查** (读取),
提高了文件存储的安全性.
这就是使用老旧 e5 主机和廉价二手硬盘手搓的存储服务器. (狗头)

----

相关文章:

+ 《本地 HTTP 文件服务器的简单搭建 (deno/std)》

  TODO

+ 《使用多用户增强服务器的安全性》

  TODO

+ 《局域网聊天软件 matrix》

  TODO

参考资料: <https://www.openssh.com/portable.html>


## 目录

+ 1 目录权限设置

+ 2 GNOME (ArchLinux) PC

  - 2.1 配置 SSH 登录服务器
  - 2.2 使用文件管理器访问服务器的文件

+ 3 Android 手机

  - 3.1 使用 termux 生成 SSH 密钥
  - 3.2 授权 质感文件 app 访问 termux 里面的文件
  - 3.3 配置 SSH 连接服务器

+ 4 总结与展望


## 1 目录权限设置

对不同的文件分类存放, 计划按照 2 个维度分成 4 类:

+ `srv2`: 重要数据 (不允许丢失), 可以公开.
  比如 本文.

+ `srv1`: 允许丢失的数据, 可以公开.
  比如软件安装包, 很容易下载的电影等视频, 学习资料等.

+ `sd2`: 重要数据 (不允许丢失), 不能公开.
  比如自己的照片.

+ `sd1`: 允许丢失的数据, 不能公开.

其中是否允许数据丢失, 是一个维度.
是否可以公开, 是另一个维度.
分别创建目录存放.

----

相关命令:

```sh
fc-test@MiWiFi-RA74-srv:/mnt/data/bf1s/@fct$ pwd
/mnt/data/bf1s/@fct
fc-test@MiWiFi-RA74-srv:/mnt/data/bf1s/@fct$ ls -al
total 16
drwxr-xr-x. 1 fc-test fc-test  8 Jun 30 11:57 .
drwxr-xr-x. 1 root    root    32 Jun 30 09:38 ..
drwxr-xr-x. 1 fc-test fc-test 24 Jun 30 12:55 srv1
fc-test@MiWiFi-RA74-srv:/mnt/data/bf1s/@fct$ mkdir sd1
fc-test@MiWiFi-RA74-srv:/mnt/data/bf1s/@fct$ chmod 700 sd1
fc-test@MiWiFi-RA74-srv:/mnt/data/bf1s/@fct$ ls -al
total 16
drwxr-xr-x. 1 fc-test fc-test 14 Jul  1 06:11 .
drwxr-xr-x. 1 root    root    32 Jun 30 09:38 ..
drwx------. 1 fc-test fc-test  0 Jul  1 06:11 sd1
drwxr-xr-x. 1 fc-test fc-test 24 Jun 30 12:55 srv1
fc-test@MiWiFi-RA74-srv:/mnt/data/bf1s/@fct$ 
```

其中 `mkdir` 命令创建新的目录, `chmod` 命令更改权限,
`700` 表示只有自己可以访问.

```sh
fc-test@MiWiFi-RA74-srv:/mnt/data/bf2s/@fct$ pwd
/mnt/data/bf2s/@fct
fc-test@MiWiFi-RA74-srv:/mnt/data/bf2s/@fct$ ls -al
total 16
drwxr-xr-x. 1 fc-test fc-test 28 Jun 30 11:57 .
drwxr-xr-x. 1 root    root    32 Jun 30 09:38 ..
drwxr-x---. 1 root    root    62 Jul  1 06:00 .snapshots
drwxr-xr-x. 1 fc-test fc-test 58 Jun 30 13:04 srv2
fc-test@MiWiFi-RA74-srv:/mnt/data/bf2s/@fct$ mkdir sd2
fc-test@MiWiFi-RA74-srv:/mnt/data/bf2s/@fct$ chmod 700 sd2
fc-test@MiWiFi-RA74-srv:/mnt/data/bf2s/@fct$ ls -al
total 16
drwxr-xr-x. 1 fc-test fc-test 34 Jul  1 06:11 .
drwxr-xr-x. 1 root    root    32 Jun 30 09:38 ..
drwxr-x---. 1 root    root    62 Jul  1 06:00 .snapshots
drwx------. 1 fc-test fc-test  0 Jul  1 06:11 sd2
drwxr-xr-x. 1 fc-test fc-test 58 Jun 30 13:04 srv2
fc-test@MiWiFi-RA74-srv:/mnt/data/bf2s/@fct$ sync
```

在 RAID 1 上进行类似的操作.

```sh
fc-test@MiWiFi-RA74-srv:~$ ls -al /mnt/data/bf1s/@fct
total 16
drwxr-xr-x. 1 fc-test fc-test 14 Jul  1 06:11 .
drwxr-xr-x. 1 root    root    32 Jun 30 09:38 ..
drwx------. 1 fc-test fc-test  0 Jul  1 06:11 sd1
drwxr-xr-x. 1 fc-test fc-test 24 Jun 30 12:55 srv1
fc-test@MiWiFi-RA74-srv:~$ ls -al /mnt/data/bf2s/@fct
total 16
drwxr-xr-x. 1 fc-test fc-test 34 Jul  1 06:11 .
drwxr-xr-x. 1 root    root    32 Jun 30 09:38 ..
drwxr-x---. 1 root    root    62 Jul  1 06:00 .snapshots
drwx------. 1 fc-test fc-test  0 Jul  1 06:11 sd2
drwxr-xr-x. 1 fc-test fc-test 58 Jun 30 13:04 srv2
fc-test@MiWiFi-RA74-srv:~$ 
```

这就是最终的结果了, 一共 4 个目录, 分别存放不同的文件:
`sd1` 和 `srv1` 目录位于 RAID 0 上 (文件只存储一份),
存储允许丢失的数据.
`sd2` 和 `srv2` 位于 RAID 1 上 (在两块硬盘上分别存放一份, 互为镜像),
存储重要数据 (不允许丢失).
由于 RAID 0 (btrfs) 没有开启条带 (也就是单个文件连续存储,
而不是打散成数据块分散存储), 所以如果损坏一块硬盘,
RAID 0 大约丢失一半数量的文件 (另一半文件基本完好),
而 RAID 1 不会丢失文件.

其中 `sd1` 和 `sd2` 存放不能公开的数据,
只有通过 SSH 登录 (公钥认证) 之后才能访问 (读写).
`srv1` 和 `srv2` 存放可以公开的数据,
并通过 HTTP 服务器对整个局域网提供下载 (只读), 方便访问.

这种分类存储方案,
在数据安全 (SSH) 和方便访问 (HTTP) 之间取得了平衡,
在防止数据丢失 (RAID 1) 和节省存储空间 (RAID 0) 之间也取得了平衡.

```sh
fc-test@MiWiFi-RA74-srv:~$ ln -s /mnt/data/bf1s/@fct/sd1 sd1
fc-test@MiWiFi-RA74-srv:~$ ln -s /mnt/data/bf2s/@fct/sd2 sd2
fc-test@MiWiFi-RA74-srv:~$ ls -al

lrwxrwxrwx. 1 fc-test fc-test       23 Jul  1 06:13 sd1 -> /mnt/data/bf1s/@fct/sd1
lrwxrwxrwx. 1 fc-test fc-test       23 Jul  1 06:13 sd2 -> /mnt/data/bf2s/@fct/sd2
lrwxrwxrwx. 1 fc-test fc-test       24 Jun 30 11:59 srv1 -> /mnt/data/bf1s/@fct/srv1
lrwxrwxrwx. 1 fc-test fc-test       24 Jun 30 11:59 srv2 -> /mnt/data/bf2s/@fct/srv2
```

为了方便访问, 可以使用 `ln -s` 命令创建符号链接.


## 2 GNOME (ArchLinux) PC

本章节适用于 PC (台式机/笔记本), 以 ArchLinux 操作系统举栗.
别的操作系统也是类似的.

### 2.1 配置 SSH 登录服务器

+ (1) 生成 SSH 密钥, 比如:

  ```sh
  ssh-keygen -t ed25519 -C fc-server-202406 -f ~/.ssh/id_ed25519-fc-server-202406
  ```

  详见文章: 《安装 Fedora CoreOS 操作系统》

  TODO

+ (2) 将 **公钥** 写入服务器的配置文件, 比如:

  ```sh
  fc-test@MiWiFi-RA74-srv:~$ cat ~/.ssh/authorized_keys.d/sftp
  ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILPbf/zBsqQw86+uqA9PoL1IlquO04KKrOTpzhRTbvCR fcst-p9-20240701
  ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIk8koHw0tEFA+frh+uSqijJOv2aRtKodITqgAibaNXE fcst-c6-20240701
  ```

  每个公钥一行, 如果有多个设备需要登录, 每个设备都有自己的公钥, 就多写几行.

+ (3) 修改本机的 SSH 配置文件, 比如:

  ```sh
  > cat ~/.ssh/config

  Host fc-server
      HostName fc-server.test
      User fc-test
      IdentityFile ~/.ssh/id_ed25519-fc-server-test-202406
  ```

  然后使用 `ssh fc-server` 命令测试登录是否成功.

### 2.2 使用文件管理器访问服务器的文件

GNOME 桌面环境自带的文件管理器, 对 sftp 有很好的支持, 直接就可以使用.
(别的桌面环境, 比如 KDE, 应该也可以, 只是窝用的 GNOME, 所以就以 GNOME 举栗. )

相关链接: <https://apps.gnome.org/zh-CN/Nautilus/>

![文件 (1)](./图/2-n-1.png)

点击 `其它位置`.

![文件 (2)](./图/2-n-2.png)

输入服务器地址.

![文件 (3)](./图/2-n-3.png)

输入 `ssh://fc-server`, 点击 `连接`.

![文件 (4)](./图/2-n-4.png)

然后就能看到服务器上的文件了.

![文件 (5)](./图/2-n-5.png)

可以按键盘快捷键 `Ctrl+D` 把位置添加到收藏夹, 方便快速访问.

然后就和访问本地文件基本一样了, 比如视频文件可以直接打开播放.
这边是千兆以太网局域网, 上传/下载速度可达 110MB/s, 跑满带宽了.
窝感觉挺好用哒 ~  赞 !


## 3 Android 手机

在手机上可以使用 **质感文件** (MaterialFiles) app:
<https://github.com/zhanghai/MaterialFiles>

### 3.1 使用 termux 生成 SSH 密钥

安装 termux: <https://termux.dev/en/>

在 termux 中安装 `openssh` 的命令:

```sh
pkg install openssh
```

然后使用 `ssh-keygen` 命令生成 SSH 密钥:

![termux (1)](./图/31-t-1.jpg)

![termux (2)](./图/31-t-2.jpg)

使用 `cat` 命令查看 **公钥**:

![termux (3)](./图/31-t-3.jpg)

然后将公钥写入服务器的配置文件 (详见上文).

### 3.2 授权 质感文件 app 访问 termux 里面的文件

![app (1)](./图/32-m-1.jpg)

打开质感文件 app.

![app (2)](./图/32-m-2.jpg)

点击左上角 "三条横线" 按钮, 打开侧边栏.

![app (3)](./图/32-m-3.jpg)

点击 `添加存储空间`.

![app (4)](./图/32-m-4.jpg)

点击 `外部存储空间`.

![app (5)](./图/32-m-5.jpg)

点击左上角 "三条横线" 按钮, 打开侧边栏.

![app (6)](./图/32-m-6.jpg)

点击 `Termux`.

![app (7)](./图/32-m-7.jpg)

点击 `使用此文件夹`.

![app (8)](./图/32-m-8.jpg)

点击 `允许`.

![app (9)](./图/32-m-9.jpg)

然后 质感文件 app 侧边栏就会多出一个 `home`,
这个就是 termux 的文件.

### 3.3 配置 SSH 连接服务器

![SSH (1)](./图/33-m-1.jpg)

回到这个界面, 点击 `SFTP 服务器`.
注意不要选错类型了 ! 这几个名称有点像.

![SSH (2)](./图/33-m-2.jpg)

输入服务器信息.

![SSH (3)](./图/33-m-3.jpg)

`主机名` 填写服务器的 IP 地址.
`路径` 就是对应的服务器上的文件 (目录) 路径.
`名称` 就是显示的名称, 只是为了方便显示, 随意填写.
`验证` 选择 `公钥`.
`用户名` 就是通过 SSH 登录服务器使用的用户名.

然后点击 `私钥` 右边的图标, 来读取私钥文件:

![SSH (4)](./图/33-m-4.jpg)

打开侧边栏.

![SSH (5)](./图/33-m-5.jpg)

点击 `home`.

![SSH (6)](./图/33-m-6.jpg)

点击右上角 "三个点".

![SSH (7)](./图/33-m-7.jpg)

点击 `显示隐藏文件`.

![SSH (8)](./图/33-m-8.jpg)

点击进入 `.ssh` 目录.

![SSH (9)](./图/33-m-9.jpg)

选择 **私钥** 文件 (以 `.pub` 结尾的是 **公钥**, 选择另一个文件).

选择后会自动返回这个界面:

![SSH (3)](./图/33-m-3.jpg)

点击 `连接并添加`.

![SSH (10)](./图/33-m-10.jpg)

然后侧边栏出现 `fc-server` 就是服务器上的文件.

![SSH (11)](./图/33-m-11.jpg)

点击即可访问.

![SSH (12)](./图/33-m-12.jpg)

喵呜 ~~ !


## 4 总结与展望

基于 sftp 搭建局域网文件存储服务器 (NAS) 还是很简单的,
只需要安装好 Fedora CoreOS 操作系统, 配置好存储 (比如 LVM/btrfs) 即可.
SSH 是服务器系统自带的, 只要能通过 SSH 登录服务器,
就自动的获得了一只 NAS, 妙 !

PC 和手机都能通过 sftp 协议来访问服务器上的文件, 使用很方便.
这下 3 只手机和 2 个 PC 的文件就能集中整理存放了.
全部使用 SSH **公钥** 加密认证 (登录), 不使用密码 (口令),
显著提高了安全性.
如果需要多人共享使用, 可以在服务器上创建多个用户
(详见文章 《使用多用户增强服务器的安全性》),
通过适当设置文件的 Linux 访问权限, 可以做到互不影响,
保持很高的灵活度与安全性.
btrfs 的 RAID 1 和快照等功能, 从多个方面保护了存储的数据
(详见文章 《本地 HTTP 文件服务器的简单搭建 (deno/std)》),
比如一块硬盘突然损坏, 误操作删除文件, 或者遭遇加密勒索恶意软件.
LVM 使得添加/更换硬盘十分方便.
作为低成本的文件存储服务器, 挺适合窝等穷人使用的.

此处只实现了 NAS 服务器的基础功能 (文件存储, 多设备访问),
还可以在存储的基础上, 添加一些扩展功能, 这些以后再慢慢完善.
除了文件存储, 服务器还可以方便的通过容器/虚拟机等部署更多应用,
成为多功能的综合服务器.

只使用 RAID 1 和快照来保护存储的数据文件是不够的,
比如无法应对整个服务器损坏/丢失, 火灾/地震/洪水等自然灾害.
还需要有额外的数据备份计划, 比如传说中的 "3-2-1" 备份, 网盘备份,
高可用异地灾备等, 都是可以考虑的发展方向.
加油, 年轻人 !

----

Windows ?

虽然窝基本不用, 但是在此顺便说一句: sftp 支持 Windows.
至少有 2 种使用方式:

+ (1) <https://winscp.net/eng/docs/lang:chs>

  winscp 是一个独立的 sftp 客户端软件, 可以用来上传/下载文件.

+ (2) <https://github.com/winfsp/sshfs-win>

  sshfs-win 的安装更复杂一些, 可以将 sftp 服务器作为网络硬盘使用.

----

本文使用 CC-BY-SA 4.0 许可发布.
