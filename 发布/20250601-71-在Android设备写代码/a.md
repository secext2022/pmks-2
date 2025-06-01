# 在 Android 设备上写代码 (Termux, code-server)

通常来说, Android 设备 (手机/平板/电视盒子 等) 是 **不适合**
用来做开发 (写 **代码** / 编程) 的, 开发最好使用 PC (台式机/笔记本/小主机 等).
但是, 经过一顿努力, 一些轻量级, 比较简单的写代码, 还是可以在 Android 设备上完成的.

比如 node.js (JavaScript), python, 前端 (HTML/CSS/vue) 等项目, 甚至 rust.
本文对具体如何做, 给出示例.

(最近老公确诊糖尿病, 忙着给他治病. )

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 71 号作品. )

----

相关文章:

+ 《高版本 Android 如何访问 sdcard/Android/data 目录中的文件 (翻译)》

  TODO

+ 《在 Android 运行 deno (aarch64) 的新方法 (glibc-runner)》

  TODO

+ 《Android 输入法框架简介》

  TODO

+ 《低功耗低成本 PC (可更换内存条) 推荐 (笔记本, 小主机)》

  TODO

+ 《Linux 内核 BUG: Android 手机 USB 网络共享 故障》

  TODO

参考资料:

+ <https://gitlab.com/fdroid/fdroidclient>
+ <https://termux.dev/en/>
+ <https://coder.com/docs/code-server/termux>
+ <https://mirrors.tuna.tsinghua.edu.cn/help/fdroid/>
+ <https://github.com/brave/brave-browser>


## 目录

+ 1 安装所需软件

  - 1.1 安装 fdroid 并配置镜像
  - 1.2 安装 Termux 并配置镜像
  - 1.3 安装 code-server
  - 1.4 (可选) 安装 brave 浏览器 (推荐)
  - 1.5 (可选) 安装 git, openssh, nodejs, python

+ 2 写代码举栗 (python)

+ 3 总结与展望


## 1 安装所需软件

首先需要安装所需的各种软件.

### 1.1 安装 fdroid 并配置镜像

安装 fdroid 是为了安装 Termux.

从清华大学的镜像网站上下载并安装 fdroid (apk):
<https://mirrors.tuna.tsinghua.edu.cn/help/fdroid/>

![镜像网站](./图/11-a-1.png)

安装之后:

![fdroid (1)](./图/11-f-1.png)

![fdroid (2)](./图/11-f-2.png)

----

配置镜像:

![镜像 (1)](./图/11-m-1.png)

根据上面清华大学的说明文档, 在此处添加清华大学的镜像.

![镜像 (2)](./图/11-m-2.png)

注意把上面的 **官方镜像** 全部停用, 只保留下面的一个刚才添加的 **用户镜像**.
否则更新和下载的时候会很慢.

配置完成后, 在 **更新** 界面下拉更新一次, 下载所有应用的信息.

### 1.2 安装 Termux 并配置镜像

安装 Termux 是为了安装 code-server 等重要软件.

在 fdroid 里面搜索 termux:

![termux (1)](./图/12-t-1.png)

安装 **Termux**, 同时推荐安装 **Termux:Styling** (用于设置颜色和字体).

![termux (2)](./图/12-t-2.png)

![termux (3)](./图/12-t-3.png)

----

安装后打开 Termux, 首次启动会自动安装初始包, 然后显示如下界面:

![样式 (1)](./图/12-s-1.png)

默认字体不好看, 我们换一个字体 (上面已经安装了 `Termux:Styling`).
长按屏幕空白 (空黑) 处, 在菜单中选择 **Style**:

![样式 (2)](./图/12-s-2.png)

点击 **CHOOSE FONT**:

![样式 (3)](./图/12-s-3.png)

然后选择一个自己喜欢的字体. 好了, 现在看起来舒服多啦 !

![样式 (4)](./图/12-s-4.png)

----

然后配置软件源 (镜像), 用来下载/更新软件包. 输入命令:

```sh
termux-change-repo
```

按回车 (Enter/换行) 键执行:

![配置 (1)](./图/12-m-1.png)

选择 **Mirror group** (使用一组镜像, 自动选择可用镜像, 而不是使用单个镜像),
点击 **OK**:

![配置 (2)](./图/12-m-2.png)

选择 **Mirrors in Chinese Mainland** (使用国内镜像, 速度快), OK:

![配置 (3)](./图/12-m-3.png)

然后 termux 会自动更新一次镜像. 更新完毕后, 输入命令:

```sh
pkg upgrade
```

并执行, 升级所有软件包到最新版本:

![配置 (4)](./图/12-m-4.png)

![配置 (5)](./图/12-m-5.png)

更新完毕. 以后如果要更新软件包, 也使用这个命令.

----

(可选) 如果不喜欢默认的 `bash` shell, 可以安装 `fish`:

```sh
pkg install fish
```

然后使用 `chsh` 命令切换默认 shell:

![chsh](./图/12-chsh.png)

### 1.3 安装 code-server

终于到了重要软件 **code-server** !

写代码需要一个文本编辑器, vscode 是一个好用的开源的编辑器.
而 code-server 是 vscode 的网页版, 也就是可以直接在浏览器中运行的:
<https://coder.com/docs/code-server/termux>

安装命令:

```sh
pkg install tur-repo
```

![安装 (1)](./图/13-i-1.png)

然后:

```sh
pkg install code-server
```

![安装 (2)](./图/13-i-2.png)

这是比较简单的安装方式.

----

安装完成后, 使用命令:

```sh
code-server
```

即可启动运行 code-server:

![启动](./图/13-r-1.png)

### 1.4 (可选) 安装 brave 浏览器 (推荐)

code-server 的界面需要在浏览器中显示, 所以需要一个浏览器.

为什么此处推荐 brave 呢 ? 因为最好的浏览器 kiwi browser 今年年初停止更新维护了 !! 悲 ~
所以只能退而求其次选择 brave 了.

从这里下载 brave: <https://github.com/brave/brave-browser>

![下载 (1)](./图/14-b-1.png)

去 **Releases** 页面下载, 注意选择 **Latest** (最新) 版本:

![下载 (2)](./图/14-b-2.png)

下载对应的文件, 注意选择 `BraveMonoarm64.apk` 文件:

![下载 (3)](./图/14-b-3.png)

如果网络问题, 可以等几分钟后再试, 多试几次就好了.
这是国内特有的网络不稳定 (笑

----

安装之后:

![浏览器信息 (1)](./图/14-i-1.png)

![浏览器信息 (2)](./图/14-i-2.png)

![浏览器信息 (3)](./图/14-i-3.png)

![浏览器信息 (4)](./图/14-i-4.png)

![浏览器信息 (5)](./图/14-i-5.png)

![浏览器信息 (6)](./图/14-i-6.png)

![浏览器信息 (7)](./图/14-i-7.png)

![浏览器信息 (8)](./图/14-i-8.png)

![浏览器信息 (9)](./图/14-i-9.png)

![浏览器信息 (10)](./图/14-i-10.png)

### 1.5 (可选) 安装 git, openssh, nodejs, python

推荐安装, 特别 `git` 是常用的开发工具.

```sh
pkg install git openssh nodejs python
```

![安装](./图/15-i-1.png)


## 2 写代码举栗 (python)

软件安装完毕, 接下来实际举栗一下.

在 Termux 中使用命令:

```sh
code-server
```

启动 code-server (详见 1.3 章节).

然后在浏览器中打开:

```
http://localhost:8080
```

显示登录页面, 需要输入密码:

![code (1)](./图/20-c-1.png)

在 Termux 左侧点击 **NEW SESSION** 创建新的会话:

![code (2)](./图/20-c-2.png)

使用命令:

```sh
cat .config/code-server/config.yaml
```

查看初始密码 (`password: ` 后面的就是):

![code (3)](./图/20-c-3.png)

复制粘贴密码过来, 点击 **SUBMIT**:

![code (4)](./图/20-c-4.png)

然后登录进来了, 界面和 vscode 基本上一样的, 这是初始设置界面:

![code (5)](./图/20-c-5.png)

点击左侧的 **Open Folder** 打开目录:

![code (6)](./图/20-c-6.png)

默认打开 Termux 的 `home` 目录, 点击 **OK** 打开:

![code (7)](./图/20-c-7.png)

然后我们新建一个文件 `test.py` 并写入内容:

```py
print(666)
```

![code (8)](./图/20-c-8.png)

回到 Termux, 可以看到 `test.py` 文件, 然后使用命令:

```sh
python test.py
```

运行刚才写的代码:

![code (9)](./图/20-c-9.png)

好, 运行成功 !!  撒花 ~

----

上面是竖屏使用, 其实 横屏 (并 全屏) 使用也是很舒服的:

![code (10)](./图/20-c-10.png)

![code (11)](./图/20-c-11.png)

----

在安装上述软件之后, Termux 占用的存储空间不到 2GB:

![Termux (1)](./图/21-t-1.png)

![Termux (2)](./图/21-t-2.png)

----

本文使用的设备: 平板 小新 pad pro 12.7 (二代)

![设备 (1)](./图/22-t-1.png)

![设备 (2)](./图/22-t-2.png)


## 3 总结与展望

通过使用 Termux, code-server 等软件, 可以在 Android 设备 (平板) 上进行轻量级的写代码.

理论上来说, 手机也可以运行上述软件, 但是因为手机屏幕太小了, 用起来并不方便.
此时平板的大屏幕就发挥出显著优势了 !

本文只是作为写代码方式的一种补充, 如果有条件的话,
还是更推荐使用 **PC** (比如 笔记本) 来写代码, 毕竟 PC 是全能开发工具.
平板有很多事情做不了 (至少现在是这样), 性能比 PC 差, 价格也不见得比 PC 便宜.
但是如果已经有了 Android 平板, 顺便拿来写写代码, 那也是极好哒 ~

另外, Android 平板更加轻便, 使用难度也可能比 PC 低
(听说现在的年轻人, 有好多只会使用手机, 不会使用 PC 了, 本上世纪残留下来的老古董表示震惊 !),
所以在 Android 设备写代码的方法应该也是有意义的, 或许新的年轻人更喜欢这样写代码呢 ?

----

本文使用 CC-BY-SA 4.0 许可发布.
