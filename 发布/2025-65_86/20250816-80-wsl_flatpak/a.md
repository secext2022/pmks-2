# 在 windows 运行 flatpak 应用 (WSL)

flatpak 是个好东西, 以 flatpak 格式打包的应用,
可以在一大堆 GNU/Linux 发行版上安装运行:

![flatpak](./图/0-flatpak-1.png)

那么, windows 呢 ? flatpak 应用能否在 windows 运行 ? 答案是肯定的 (**WSL**).
不过, 也有一些 "意外惊喜" 哦 ~

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 80 号作品. )

----

相关文章:

+ 《小水滴系列文章目录 (整理)》

  TODO

+ 《自制: 7 天手搓一个拼音输入法》

  TODO

+ 《发布 flatpak 应用 (flathub)》

  TODO

+ 《胖喵拼音输入法 (pmim-ibus) 安装说明》

  TODO

+ 《修复 blender 中文输入 BUG (linux/wayland/GNOME/ibus)》

  TODO

+ 《win10 安装 Podman Desktop (教程)》

  TODO


参考资料:

+ <https://learn.microsoft.com/en-us/windows/wsl/install>
+ <https://flatpak.org/setup/>
+ <https://flatpak.org/setup/Ubuntu>
+ <https://mirrors.sjtug.sjtu.edu.cn/docs/flathub>
+ <https://mirrors.ustc.edu.cn/help/flathub.html>
+ <https://flathub.org/apps/org.gnome.baobab>
+ <https://flathub.org/apps/org.chromium.Chromium>
+ <https://www.rust-lang.org/>
+ <https://rsproxy.cn/>
+ <https://crates.io/crates/librush>


## 目录

+ 1 安装 WSL (ubuntu 系统)

+ 2 安装 flatpak (并配置)

+ 3 测试运行

+ 4 在 WSL 安装 胖喵拼音输入法

  - 4.1 安装 pmim (flatpak)
  - 4.2 安装 ibrus (rust)
  - 4.3 配置 ibus 并测试运行

+ 5 总结与展望


## 1 安装 WSL (ubuntu 系统)

**WSL** 是微软推出的, 把 GNU/Linux 集成到 windows 的方法.
WSL 2 (基于 hyper-v 虚拟机, 以及 Linux namespace 轻量级容器)
含有 Linux 内核 (微软特别调教版), 提供 Linux 环境,
以及 **WSLg** (基于 weston) 用来运行图形界面软件 (wayland/x11).

请按照微软的官方文档来安装 WSL 2: <https://learn.microsoft.com/en-us/windows/wsl/install>

安装之后如下 (此处使用的操作系统为 win11):

![WSL (1)](./图/1-wsl-1.png)

```
> wsl --version
WSL 版本: 2.5.10.0
内核版本: 6.6.87.2-1
WSLg 版本: 1.0.66
MSRDC 版本: 1.2.6074
Direct3D 版本: 1.611.1-81528511
DXCore 版本: 10.0.26100.1-240331-1435.ge-release
Windows: 10.0.26100.4946

> wsl --update
正在检查更新。
已安装最新版本的适用于 Linux 的 Windows 子系统。
```

----

然后, 打开 **Microsoft Store** (微软软件商店), 搜索 **ubuntu** 并点击安装.
安装之后如下:

![ubuntu (2)](./图/1-ubuntu-2.png)

建议打开 **WSL Settings** 进行如下设置:

![wsl settings (3)](./图/1-wsls-3.png)

把 **网络模式** 设置为 **Mirrored** (方便 WSL 和 windows 之间的网络访问):

![wsl settings (4)](./图/1-wsls-4.png)

----

然后, 点击开始菜单中的 **Ubuntu** 来安装 ubuntu.
期间会提示输入 Linux 的用户名和密码, 创建完 Linux 用户就安装好了:

![ubuntu (5)](./图/1-ubuntu-5.png)

![ubuntu (6)](./图/1-ubuntu-6.png)

```sh
> uname -a
Linux DESKTOP-P2HJ7P9 6.6.87.2-microsoft-standard-WSL2 #1 SMP PREEMPT_DYNAMIC Thu Jun  5 18:30:46 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux
> cat /etc/os-release
PRETTY_NAME="Ubuntu 24.04.3 LTS"
NAME="Ubuntu"
VERSION_ID="24.04"
VERSION="24.04.3 LTS (Noble Numbat)"
VERSION_CODENAME=noble
ID=ubuntu
ID_LIKE=debian
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"
UBUNTU_CODENAME=noble
LOGO=ubuntu-logo
```

目前是 **Ubuntu 24.04 LTS** 的系统.
选择在 WSL 中安装 ubuntu 是因为, ubuntu 比较常见,
并且实际体验下来, 各方面综合体验是比较好的.

----

然后对 ubuntu 系统的软件包进行升级 (使用以下命令):

```sh
sudo apt update
sudo apt upgrade
```

也可以顺便安装一个 Linux (GNOME) 应用并测试运行:

```sh
sudo apt install nautilus
```

![gnome (7)](./图/1-gnome-7.png)


## 2 安装 flatpak (并配置)

WSL 2 和 ubuntu 安装好了, 接下来安装 flatpak.
参考文档: <https://flatpak.org/setup/Ubuntu>

```sh
sudo apt install flatpak fonts-noto

sudo flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

安装 `flatpak` 软件包以及中文字体, 并添加 **flathub**.

----

然后配置 flathub 的国内镜像 (用于加快下载安装速度). 可选的镜像有:

- <https://mirrors.sjtug.sjtu.edu.cn/docs/flathub>
- <https://mirrors.ustc.edu.cn/help/flathub.html>

任选一个即可.

```sh
sudo flatpak remote-modify flathub --url=https://mirror.sjtu.edu.cn/flathub
```

或者:

```sh
sudo flatpak remote-modify flathub --url=https://mirrors.ustc.edu.cn/flathub
```


## 3 测试运行

我们来安装一些 flatpak 软件:

```sh
sudo flatpak install flathub org.gnome.baobab

sudo flatpak install flathub org.chromium.Chromium
```

![flatpak install (1)](./图/3-install-1.png)

然后使用如下命令运行:

```sh
flatpak run org.gnome.baobab
```

----

![baobab (2)](./图/3-baobab-2.png)

baobab 是一个 wayland 应用, 可以扫描并显示文件占用的存储空间大小, 方便清理垃圾文件.

![chromium (3)](./图/3-chromium-3.png)

chromium 浏览器是一个 x11 应用, 这样就把 wayland/x11 应用都测试了.

![chromium (4)](./图/3-chromium-4.png)

flatpak 应用运行正常, 撒花 ~


## 4 在 WSL 安装 胖喵拼音输入法

本来, 窝 **天真** 的以为, `WSLg` 应该支持直接使用 windows 的输入法
(比如微软拼音) 进行中文输入.
这是一个很自然的想法.

然而, **不行 !!**

那 .. . 好吧, 只能在 WSL 里面安装 Linux 使用的输入法.
那么, **胖喵拼音** 就突然有用了 !

### 4.1 安装 pmim (flatpak)

安装 ibus 输入法框架:

```sh
sudo apt install ibus ibus-gtk ibus-gtk3 ibus-gtk4
```

安装 pmim (flatpak):

```sh
sudo flatpak install flathub io.github.fm_elpac.pmim_ibus
```

### 4.2 安装 ibrus (rust)

接下来需要安装 **艾刷** (`ibrus`) 模块.
此处使用编译安装的方式, 窝觉得比较简单.

首先需要安装 `rust`, 参考文档: <https://www.rust-lang.org/>

rust 国内镜像: <https://rsproxy.cn/>

```sh
export RUSTUP_DIST_SERVER="https://rsproxy.cn"
export RUSTUP_UPDATE_ROOT="https://rsproxy.cn/rustup"

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

sudo apt install rustc
```

安装之后 (确认安装):

```sh
> type rustup
rustup is /home/s2/.cargo/bin/rustup
> rustup update
info: syncing channel updates for 'stable-x86_64-unknown-linux-gnu'
info: checking for self-update

  stable-x86_64-unknown-linux-gnu unchanged - rustc 1.89.0 (29483883e 2025-08-04)

info: cleaning up downloads & tmp directories
```

配置 rust 国内镜像:

```sh
nano ~/.cargo/config.toml
```

写入如下内容:

```toml
[source.crates-io]
replace-with = 'rsproxy-sparse'
[source.rsproxy]
registry = "https://rsproxy.cn/crates.io-index"
[source.rsproxy-sparse]
registry = "sparse+https://rsproxy.cn/index/"
[registries.rsproxy]
index = "https://rsproxy.cn/crates.io-index"
[net]
git-fetch-with-cli = true
```

----

rust 安装配置完毕, 开始安装 ibrus: <https://crates.io/crates/librush>

```sh
cargo install librush
```

确认安装:

```sh
> ibrus --version
librush version 0.2.1 (x86_64-unknown-linux-gnu, default, pmim, tokio)
```

### 4.3 配置 ibus 并测试运行

获取 `ibrus` 文件路径:

```sh
> type ibrus
ibrus is /home/s2/.cargo/bin/ibrus
```

创建配置文件:

```sh
sudo nano /usr/share/ibus/component/pmim_ibrus.xml
```

写入如下内容 (粘贴之后, 按 `Ctrl+O` 快捷键保存, `Ctrl+X` 快捷键退出):

```xml
<?xml version="1.0" encoding="utf-8" ?>
<!-- /usr/share/ibus/component/pmim_ibrus.xml -->
<component>
  <name>org.fm_elpac.pmim</name>
  <description>PMIM (ibus)</description>
  <exec>/home/s2/.cargo/bin/ibrus --flatpak</exec>
  <version>0.1.0</version>
  <author>secext2022</author>
  <license>GPL</license>
  <homepage>https://github.com/fm-elpac/pmim-ibus</homepage>
  <textdomain>pmim-ibus</textdomain>

  <engines>
    <engine>
      <name>pmim</name>
      <language>zh_CN</language>
      <license>GPL</license>
      <author>secext2022</author>
      <layout>default</layout>
      <longname>胖喵拼音</longname>
      <description>胖喵拼音输入法 (ibus)</description>
      <rank>99</rank>
      <symbol>喵</symbol>
      <icon_prop_key>InputMode</icon_prop_key>
      <textdomain>pmim-ibus</textdomain>
    </engine>
  </engines>
</component>
```

注意其中 `/home/s2/.cargo/bin/ibrus` 是上面获取的文件路径.

----

然后启动 ibus 配置程序:

```sh
ibus-setup
```

![ibus (1)](./图/43-ibus-1.png)

首先会提示是否启动 ibus daemon, 点 **Yes** 确认启动.

![ibus (2)](./图/43-ibus-2.png)

然后会提示在 `~/.bashrc` 中配置环境变量, 点 **OK** 继续.

![ibus (3)](./图/43-ibus-3.png)

在这里配置一个切换输入法的键盘 **快捷键** (重要).

![ibus (4)](./图/43-ibus-4.png)

此处配置的是 <code>Alt+`</code>, 可以换成你喜欢的别的快捷键.
但是需要注意, 不要与系统的快捷键冲突.

----

![ibus (5)](./图/43-ibus-5.png)

然后在这里添加输入法 (胖喵拼音).

![pmim (6)](./图/43-pmim-6.png)

然后就能看到胖喵拼音正常启动了 !

----

配置完毕, 启动应用进行测试:

```sh
export GTK_IM_MODULE=ibus
export QT_IM_MODULE=ibus
export XMODIFIERS=@im=ibus

flatpak run org.chromium.Chromium
```

![chromium (7)](./图/43-chromium-7.png)

![chromium (8)](./图/43-chromium-8.png)

中文输入正常, 撒花 ~


## 5 总结与展望

万万没想到, 胖喵拼音 (pmim) 会以这种奇怪的方式, 实现了 "支持" windows (误) (狗头

虽然 WSLg 目前还有许多缺点 (比如不支持 3D 硬件加速, 各种小 BUG 等),
但是 WSL 支持运行 flatpak 应用, 这点还是挺惊喜的 ~

![惊喜 (1)](./图/5-zhihu-1.gif)

WSLg 不支持直接使用 windows 的输入法进行中文输入, 并且 WSL 不自带中文字体, **差评** !!
希望微软尽快改进.

嗯, 既然 WSL 支持运行 flatpak 应用, 那么以后开发软件的时候, 只做 flatpak 版即可,
然后 windows 就可以直接运行啦 (狗头)

----

本文使用 CC-BY-SA 4.0 许可发布.
