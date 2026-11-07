# 禁止 GDM 51 自动休眠 (GNOME 51 大坑坑坑)

上文说到, 窝在 虚拟机 中安装了 AI agent, 又配置了 开机自动启动 VirtualBox 虚拟机 (无需 用户登录), 并通过 云服务器 SSH 远程访问,
实现了在下班路上 (公交/地铁) 在 手机 上用 AI 写代码.
最近用 AI 写的一个几千行 rust 代码的小软件 (`pm-tc`) 已经发布 crates.io.

然而, 转头就被 啪啪 打脸了 !

众所周知, 窝平时使用 GNOME 桌面, 所以登录界面也是 `GDM`.
在没有用户登录的情况下, 之前配置的那些 虚拟机 确实运行良好.
然而, GDM 却会在一段时间后, 让 整机 **休眠** (sleep) !

于是, 物理机 休眠了, 虚拟机 就全连不上了.
没想到, 最后被 GDM 给大坑了一顿.

于是, 连夜爬起来, 禁用 GDM 自动休眠 ! (狗头

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 107 号作品. )


## 目录

+ 1 配置过程

  - 1.1 验证 GDM 51 新版配置 (鼠标指针)
  - 1.2 验证 GDM 51 电源配置 (20 秒 自动休眠)
  - 1.3 最终配置 (不休眠)

+ 2 总结与展望

----

相关文章:

+ 《在 虚拟机 中运行 Kimi Code CLI (AI agent) 写代码》

  TODO

+ 《开机自动启动 VirtualBox 虚拟机 (systemd/ArchLinux)》

  TODO

+ 《通过 云服务器 (虚拟机) 中继的 SSH 远程连接 (ArchLinux, Ubuntu, Termux/Android, openssh)》

  TODO

+ 《GNOME 如何关闭显示输出 ? (wayland / mutter / KMS / DRI) (源代码阅读)》

  TODO

参考资料:

+ <https://help.gnome.org/system-admin-guide/login-logo.html>
+ <https://archlinux.org/packages/extra/x86_64/gdm/>
+ <https://gitlab.gnome.org/GNOME/gdm>
+ <https://github.com/GNOME/gdm>
+ <https://github.com/GNOME/gdm/commit/c3747f1c14b777e1a42b9e5d903214c39e2c0462>
+ <https://github.com/GNOME/gdm/commit/8e79f8105570416acacea3025e08c518608732a8>
+ <https://gitlab.gnome.org/GNOME/gdm/-/merge_requests/289>
+ <https://github.com/GNOME/gdm/blob/main/data/org.gnome.login-screen.gschema.xml>
+ <https://man.archlinux.org/man/dconf.1>
+ <https://wiki.archlinux.org/title/GDM>
+ <https://crates.io/crates/pm-tc>


## 1 配置过程

窝已经在 GNOME 设置的电源选项中, 禁用了 自动挂起:

![GNOME 电源设置](./图/1-g-1.png)

但是这个只对 当前用户有效, 也就是 登录后 才有效.

如果是 未登录 状态 (GDM 登录界面), 还是会 自动休眠.

----

查看当前用户的相关配置:

```sh
> gsettings get org.gnome.settings-daemon.plugins.power sleep-inactive-ac-timeout
7200
> gsettings get org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type
'nothing'
> gsettings get org.gnome.settings-daemon.plugins.power power-button-action
'suspend'
```

由于新版 GDM (GNOME) 修改了底层机制, 旧资料里面关于使用 `gsettings` 配置 GDM 的方法, 已经 **全部失效**.

新版需要使用类似这里的方法: <https://help.gnome.org/system-admin-guide/login-logo.html>

### 1.1 验证 GDM 51 新版配置 (鼠标指针)

首先, 要验证一下, 这样的配置方式对 GDM 有效.

创建文件 `/etc/dconf/profile/gdm`:

```sh
user-db:user
system-db:gdm
file-db:/usr/share/gdm/greeter-dconf-defaults
```

然后查看一下 当前用户 的一些配置:

```sh
> gsettings get org.gnome.desktop.interface cursor-theme
'elementary'
> gsettings get org.gnome.desktop.interface cursor-size
48
```

这是关于 鼠标指针 样式和大小的配置.

创建文件 `/etc/dconf/db/gdm.d/01-cursor`:

```sh
[org/gnome/desktop/interface]
  cursor-theme='elementary'
  cursor-size=48
```

更新配置数据:

```sh
sudo dconf update
```

然后, 重启 GDM 查看 鼠标指针 是否变化.

**!! 警告 !! 此命令会使 当前用户 退出登录, 请提前保存重要数据 !!**

```sh
sudo systemctl restart gdm
```

----

好, 鼠标指针 显示新样式了 ! 说明配置有效.

### 1.2 验证 GDM 51 电源配置 (20 秒 自动休眠)

接下来测试 电源 配置.

创建文件 `/etc/dconf/db/gdm.d/02-power`:

```sh
[org/gnome/settings-daemon/plugins/power]
  sleep-inactive-ac-timeout=20
  sleep-inactive-ac-type='suspend'
  power-button-action='suspend'
```

设置 20 秒 自动休眠.

然后按刚才的方式 更新配置, 重启 GDM.

**稍等**.

好, 没过多久, 机器 自动休眠 了 !
这说明配置有效.

### 1.3 最终配置 (不休眠)

然后把上面文件修改成:

```sh
[org/gnome/settings-daemon/plugins/power]
  sleep-inactive-ac-timeout=20
  sleep-inactive-ac-type='nothing'
  power-button-action='suspend'
```

再次 更新配置, 重启 GDM.

不要动, 多等几分钟.

好, 没有 休眠. 大成功 !!

----

相关软件版本:

```sh
> gnome-shell --version
GNOME Shell 51.1
> gdm --version
GDM 51.1.1
> uname -a
Linux S2L 7.2.14-zen1-1-zen #1 ZEN SMP PREEMPT_DYNAMIC Fri, 30 Oct 2026 14:32:44 +0000 x86_64 GNU/Linux
```


## 2 总结与展望

首先, 被 GDM 的 自动休眠 大坑了一顿 (虚拟机 连不上).
然后, 在查资料 禁止 GDM 自动休眠 的过程中, 又被 GDM 新版本 大坑了一顿 !
旧资料 (教程) 几乎全部失效, 因为新版 GDM 修改了底层机制.
再然后, 在 gitlab.gnome.org 上查看 GDM 源代码的时候, 第 3 次 被坑了 !!
不知道为什么, 今天 `gitlab.gnome.org` 出 BUG 了, 页面只能显示一半.

这就是为什么 本文标题 要带 版本号. 因为只适用于 新版 GNOME !

好在, 被一连串不断大坑之后, 最后还是配置成功了 ! GDM 自动休眠 终于被禁用了.
撒花 ~~

----

本文使用 CC-BY-SA 4.0 许可发布.
