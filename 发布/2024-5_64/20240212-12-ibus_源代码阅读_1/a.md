# ibus 源代码阅读 (1)

ibus 是一种 GNU/Linux 操作系统的输入法框架.
GNOME 桌面环境从 3.6 版本开始直接集成了 ibus,
所以在 GNOME 中使用 ibus 比较方便, 整体体验也比较好.

但是 ibus 的文档写的不好 (特别是几乎没有中文文档, 这点必须差评),
很多东西必须通过阅读源代码才能明白.
然而 ibus 使用 C 编程语言, GObject 以及 D-Bus,
这些结合起来使得阅读 ibus 的源代码比较费劲.

本文主要内容是 ibus 架构简介和启动初始化部分.

----

相关链接:

+ <https://github.com/ibus/ibus>
+ <https://www.freedesktop.org/wiki/Software/dbus/>
+ <https://docs.gtk.org/gobject/>
+ <https://help.gnome.org/misc/release-notes/3.6/i18n-ibus.html>
+ <https://github.com/libpinyin/ibus-libpinyin>


## 目录

+ 1 ibus 架构简介

  - 1.1 安装 ibus
  - 1.2 systemd user 服务
  - 1.3 D-Bus 多进程架构
  - 1.4 输入法接口模块

+ 2 ibus 源码分析

  - 2.1 下载 ibus 源代码
  - 2.2 D-Bus 地址
  - 2.3 使用 Bustle 抓包分析
  - 2.4 从 SetGlobalEngine 作为入口分析
  - 2.5 从 ibus-libpinyin 入手进行分析

+ 3 使用 rust 实现 ibus 输入法

  - 3.1 获取 D-Bus 地址
  - 3.2 连接 ibus
  - 3.3 注册 engine factory
  - 3.4 实现 CreateEngine
  - 3.5 简单输入法


## 1 ibus 架构简介

### 1.1 安装 ibus

操作系统: ArchLinux

+ 安装命令:

  ```
  > sudo pacman -S ibus ibus-libpinyin
  ```

  其中 `ibus` 是输入法框架,
  `ibus-libpinyin` 是一个相对比较好用的拼音输入法.

+ 软件包版本:

  ```
  > pacman -Ss ibus

  extra/ibus 1.5.29-3 [已安装]
      Next Generation Input Bus for Linux

  extra/ibus-libpinyin 1.15.3-1 [已安装]
      Intelligent Pinyin engine based on libpinyin for IBus

  extra/libibus 1.5.29-3 [已安装]
      IBus support library
  ```

重启, 然后就可以直接在 GNOME 设置里面设置输入法了:

![GNOME 输入法设置](../图/20240212-12/1-gnome-1.jpg)

### 1.2 systemd user 服务

查看 ibus 软件包有哪些文件 (省略一部分):

```
> pacman -Ql ibus

ibus /usr/
ibus /usr/bin/
ibus /usr/bin/ibus
ibus /usr/bin/ibus-daemon
ibus /usr/bin/ibus-setup

ibus /usr/lib/ibus/
ibus /usr/lib/ibus/ibus-dconf
ibus /usr/lib/ibus/ibus-engine-simple
ibus /usr/lib/ibus/ibus-extension-gtk3
ibus /usr/lib/ibus/ibus-portal
ibus /usr/lib/ibus/ibus-ui-emojier
ibus /usr/lib/ibus/ibus-ui-gtk3
ibus /usr/lib/ibus/ibus-wayland
ibus /usr/lib/ibus/ibus-x11
```

除了 ibus 可执行文件 (比如 `ibus-daemon`) 之外, 重要的是 systemd 配置文件:

```
ibus /usr/lib/systemd/
ibus /usr/lib/systemd/user/
ibus /usr/lib/systemd/user/gnome-session.target.wants/
ibus /usr/lib/systemd/user/gnome-session.target.wants/org.freedesktop.IBus.session.GNOME.service
ibus /usr/lib/systemd/user/org.freedesktop.IBus.session.GNOME.service
```

查看 service 文件:

```
> cat /usr/lib/systemd/user/org.freedesktop.IBus.session.GNOME.service
[Unit]
Description=IBus Daemon for GNOME
CollectMode=inactive-or-failed

# Require GNOME session and specify startup ordering
Requisite=gnome-session-initialized.target
After=gnome-session-initialized.target
PartOf=gnome-session-initialized.target
Before=gnome-session.target

# Needs to run when DISPLAY/WAYLAND_DISPLAY is set
After=gnome-session-initialized.target
PartOf=gnome-session-initialized.target

# Never run in GDM
Conflicts=gnome-session@gnome-login.target

[Service]
Type=dbus
# Only pull --xim in X11 session, it is done via Xwayland-session.d on Wayland
ExecStart=sh -c 'exec /usr/bin/ibus-daemon --panel disable $([ "$XDG_SESSION_TYPE" = "x11" ] && echo "--xim")'
Restart=on-abnormal
BusName=org.freedesktop.IBus
TimeoutStopSec=5
Slice=session.slice

[Install]
WantedBy=gnome-session.target
```

当用户登录进入 GNOME 桌面环境时 (对应 systemd `gnome-session.target`),
ibus 服务 (`org.freedesktop.IBus.session.GNOME.service`)
作为依赖项会被启动, 从而执行 `/usr/bin/ibus-daemon`.

如果同时有多个用户登录, 每个用户都会运行自己的 ibus 服务.

### 1.3 D-Bus 多进程架构

D-Bus 是一种总线型的进程间通信 (IPC) 协议,
已经发展很多年了, 在 Linux 桌面环境广泛使用.

D-Bus 通常有 2 种总线: 系统 (system) 总线和会话 (session) 总线.
系统总线就是整个系统有一个, 用于系统服务.
会话总线是每个登录的用户有一个, 用于用户自己的服务.

那么猜猜看, ibus 用的是哪个 D-Bus 总线 ?

答案是, 都不是 !
ibus 使用一条自己创建的 D-Bus 总线.

每条 D-Bus 总线有一个接口地址, 使用的是 UNIX socket,
就是表现为文件系统中的一个文件.
ibus 将其总线地址写入一个文件:

```
> cat ~/.config/ibus/bus/*-unix-wayland-0
# This file is created by ibus-daemon, please do not modify it.
# This file allows processes on the machine to find the
# ibus session bus with the below address.
# If the IBUS_ADDRESS environment variable is set, it will
# be used rather than this file.
IBUS_ADDRESS=unix:path=/home/s2/.cache/ibus/dbus-9T2iv1UE,guid=a282405d82905fe34f2770cc65c8668f
IBUS_DAEMON_PID=88314
```

这个文件位于 `~/.config/ibus/bus` 目录,
当 `ibus-daemon` 启动时会写这个文件.

其中 `IBUS_ADDRESS=` 后面的一串东西, 就是 D-Bus 总线的地址.
`IBUS_DAEMON_PID=` 写的是 `ibus-daemon` 的进程号.

我们先看一下 D-Bus 总线接口对应的文件:

```
> ls -l ~/.cache/ibus

srwxr-xr-x 1 s2 s2   0  2月11日 14:17 dbus-9T2iv1UE=

srwxr-xr-x 1 s2 s2   0  2月10日 21:11 dbus-HYqDsOMp=
srwxr-xr-x 1 s2 s2   0  2月10日 21:16 dbus-jx9gKPt5=
```

其中 `dbus-9T2iv1UE` 就是 unix socket 文件, 还有一些别的没用的垃圾文件.
因为 `ibus-daemon` 每次启动都会随机生成一个文件名,
启动次数多了就会留下一堆垃圾 (窝觉得这是 ibus 的一个很不好的设计).

我们再来看一下 ibus 相关的进程:

```
> ps -elwwf | grep 88314
0 S s2        88314    1061  0  80   0 - 115614 do_sys 14:17 ?       00:02:45 /usr/bin/ibus-daemon --verbose --panel disable
0 S s2        88321   88314  0  80   0 - 77566 do_sys 14:17 ?        00:00:00 /usr/lib/ibus/ibus-dconf
0 S s2        88322   88314  0  80   0 - 115321 do_sys 14:17 ?       00:00:47 /usr/lib/ibus/ibus-extension-gtk3
0 S s2        88340   88314  0  80   0 - 59169 do_sys 14:17 ?        00:00:27 /usr/lib/ibus/ibus-engine-simple
0 S s2        90835   88314  0  80   0 - 115480 do_sys 14:33 ?       00:00:31 /usr/lib/ibus-libpinyin/ibus-engine-libpinyin --ibus
```

使用 `systemctl` 可以更清晰的看出多进程结构:

```
> systemctl --user status org.freedesktop.IBus.session.GNOME
● org.freedesktop.IBus.session.GNOME.service - IBus Daemon for GNOME
     Loaded: loaded (/home/s2/.config/systemd/user/org.freedesktop.IBus.session.GNOME.service; disabled; preset: enabled)
     Active: active (running) since Sun 2024-02-11 14:17:51 CST; 7h ago
   Main PID: 88314 (ibus-daemon)
      Tasks: 23 (limit: 14200)
     Memory: 163.4M (peak: 172.1M)
        CPU: 4min 37.382s
     CGroup: /user.slice/user-1000.slice/user@1000.service/session.slice/org.freedesktop.IBus.session.GNOME.service
             ├─88314 /usr/bin/ibus-daemon --verbose --panel disable
             ├─88321 /usr/lib/ibus/ibus-dconf
             ├─88322 /usr/lib/ibus/ibus-extension-gtk3
             ├─88340 /usr/lib/ibus/ibus-engine-simple
             └─90835 /usr/lib/ibus-libpinyin/ibus-engine-libpinyin --ibus
```

`ibus-daemon` 是 ibus 的管理进程, 首先启动, 并创建 D-Bus 总线.
ibus 的多个组件, 分别作为一个进程启动.
比如 `ibus-engine-libpinyin` 就是一个拼音输入法.
多个进程之间使用 D-Bus 通信.

![ibus 架构图](../图/20240212-12/1-a-1.jpg)

我们来看一下 `ibus-libpinyin` 软件包有哪些文件:

```
> pacman -Ql ibus-libpinyin
ibus-libpinyin /usr/
ibus-libpinyin /usr/lib/
ibus-libpinyin /usr/lib/ibus-libpinyin/
ibus-libpinyin /usr/lib/ibus-libpinyin/ibus-engine-libpinyin
ibus-libpinyin /usr/lib/ibus-libpinyin/ibus-setup-libpinyin

ibus-libpinyin /usr/share/ibus/
ibus-libpinyin /usr/share/ibus/component/
ibus-libpinyin /usr/share/ibus/component/libpinyin.xml
```

重点是最后这个 xml 文件, 这个输入法将自己注册给 ibus:

```xml
> cat /usr/share/ibus/component/libpinyin.xml
<?xml version="1.0" encoding="utf-8"?>
<!-- filename: pinyin.xml -->
<component>
	<name>org.freedesktop.IBus.Libpinyin</name>
	<description>Libpinyin Component</description>
	<exec>/usr/lib/ibus-libpinyin/ibus-engine-libpinyin --ibus</exec>
	<version>1.15.3</version>
	<author>Peng Wu &lt;alexepico@gmail.com&gt;</author>
	<license>GPL</license>
	<homepage>https://github.com/libpinyin/ibus-libpinyin</homepage>
	<textdomain>ibus-libpinyin</textdomain>

	<engines>
		<engine>
			<name>libpinyin</name>
			<language>zh_CN</language>
			<license>GPL</license>
			<author>
                        Peng Wu &lt;alexepico@gmail.com&gt;
                        Peng Huang &lt;shawn.p.huang@gmail.com&gt;
                        BYVoid &lt;byvoid1@gmail.com&gt;
                        </author>
			<icon>/usr/share/ibus-libpinyin/icons/ibus-pinyin.svg</icon>
			<layout>default</layout>
			<longname>Intelligent Pinyin</longname>
			<description>Intelligent Pinyin input method</description>
			<rank>99</rank>
			<symbol>&#x62FC;</symbol>
			<icon_prop_key>InputMode</icon_prop_key>
			<setup>/usr/lib/ibus-libpinyin/ibus-setup-libpinyin libpinyin</setup>
			<textdomain>ibus-libpinyin</textdomain>
		</engine>
		<engine>
			<name>libbopomofo</name>
			<language>zh_TW</language>
			<license>GPL</license>
			<author>
                        Peng Wu &lt;alexepico@gmail.com&gt;
                        Peng Huang &lt;shawn.p.huang@gmail.com&gt;
                        BYVoid &lt;byvoid1@gmail.com&gt;
                        </author>
			<icon>/usr/share/ibus-libpinyin/icons/ibus-bopomofo.svg</icon>
			<layout>default</layout>
			<longname>Bopomofo</longname>
			<description>Bopomofo input method</description>
			<rank>98</rank>
			<symbol>&#x3109;</symbol>
			<icon_prop_key>InputMode</icon_prop_key>
			<setup>/usr/lib/ibus-libpinyin/ibus-setup-libpinyin libbopomofo</setup>
			<textdomain>ibus-libpinyin</textdomain>
		</engine>
	</engines>
</component>
```

这个文件定义了输入法的一些信息, 比如名称, 语言等, 重要的部分是:

```xml
<component>
  <name>org.freedesktop.IBus.Libpinyin</name>
  <description>Libpinyin Component</description>
  <exec>/usr/lib/ibus-libpinyin/ibus-engine-libpinyin --ibus</exec>
```

这里定义组件 (component) 名称 `org.freedesktop.IBus.Libpinyin` (后面要用到),
以及启动这个组件对应的可执行程序 `/usr/lib/ibus-libpinyin/ibus-engine-libpinyin`.

```xml
<engine>
  <name>libpinyin</name>
  <language>zh_CN</language>
```

这里定义了一个具体的拼音输入法 (engine),
名称为 `libpinyin` (后面要用到), 语言 `zh_CN` (简体中文).

```xml
  <longname>Intelligent Pinyin</longname>
```

这个定义的是用户界面显示的输入法名称 ("智能拼音").

### 1.4 输入法接口模块

ibus 作为一种输入法框架, 最重要的当然是提供输入功能了.
比如, 向某个应用中输入汉字.

然而由于 Linux 系统开源开放的特点, 不同的应用使用不同的输入规范.
输入法框架需要对每种情况分别适配:

```
> ls ibus/client
gtk2/  gtk3/  gtk4/  Makefile  Makefile.am  Makefile.in  wayland/  x11/
```

这是 ibus 源代码的一个目录.
可以看到 ibus 分别对 `x11`, `gtk2`, `gtk3`, `gtk4`, `wayland`
等的支持代码.

```
> pacman -Ql ibus

ibus /usr/lib/
ibus /usr/lib/gtk-2.0/
ibus /usr/lib/gtk-2.0/2.10.0/
ibus /usr/lib/gtk-2.0/2.10.0/immodules/
ibus /usr/lib/gtk-2.0/2.10.0/immodules/im-ibus.so
ibus /usr/lib/gtk-3.0/
ibus /usr/lib/gtk-3.0/3.0.0/
ibus /usr/lib/gtk-3.0/3.0.0/immodules/
ibus /usr/lib/gtk-3.0/3.0.0/immodules/im-ibus.so
ibus /usr/lib/gtk-4.0/
ibus /usr/lib/gtk-4.0/4.0.0/
ibus /usr/lib/gtk-4.0/4.0.0/immodules/
ibus /usr/lib/gtk-4.0/4.0.0/immodules/libim-ibus.so

ibus /usr/lib/ibus/ibus-wayland
ibus /usr/lib/ibus/ibus-x11
```

编译之后就成了这些不同的输入模块.


## 2 ibus 源码分析

注意: 本章节会粘贴一些 ibus 的代码片段, 这些属于合理引用.
本文已经注明出处, 不侵犯版权.

### 2.1 下载 ibus 源代码

使用 git 下载 ibus 的源代码:

```
> git clone https://github.com/ibus/ibus --single-branch --depth=1
```

顺便把 ibus-libpinyin 的源代码也下载了, 后面有用:

```
> git clone https://github.com/libpinyin/ibus-libpinyin --single-branch --depth=1
```

命令行参数 `--single-branch --depth=1` 表示只下载一个分支 (默认分支),
只下载一个提交 (最新提交).
如果不需要 git 提交历史的话, 这样下载可以显著减少需要下载的数据,
特别适合网络状况较差的时候.

然后建议使用 `vscode` 打开目录, 方便阅读源代码.

(如果不想使用 git 的话, 在网页上点击 "下载 zip" 进行代码下载,
效果是一样的. )

### 2.2 D-Bus 地址

+ 源文件: `ibus/src/ibusshare.h`
  函数: `ibus_get_address()`

  `ibusshare.h` 是 C 语言的头文件, 主要是一些定义.
  对应的 `ibusshare.c` 文件是实现代码, 可以对照着一起看.

  ```c
  /**
  * ibus_get_address:
  *
  * Return the D-Bus address of IBus.
  * It will find the address from following source:
  * <orderedlist>
  *    <listitem><para>Environment variable IBUS_ADDRESS</para></listitem>
  *    <listitem><para>Socket file under ~/.config/ibus/bus/</para></listitem>
  * </orderedlist>
  *
  * Returns: D-Bus address of IBus. %NULL for not found.
  *
  * See also: ibus_write_address().
  */
  const gchar     *ibus_get_address       (void);
  ```

  根据此处的注释, 这个函数获取 ibus 的 D-Bus 地址.
  首先尝试从环境变量 `IBUS_ADDRESS` 获取,
  其次从 `~/.config/ibus/bus/` 目录下面的文件中获取.

  关键实现代码:

  ```c
    /* get address from env variable */
    address = g_strdup (g_getenv ("IBUS_ADDRESS"));
    if (address)
        return address;

    /* read address from ~/.config/ibus/bus/soketfile */
    pf = fopen (ibus_get_socket_path (), "r");
  ```

  此处的逻辑和上面注释中的一致, 首先读取环境变量,
  然后读取目录中的文件.

  ```c
        /* skip comment line */
        if (p[0] == '#')
            continue;
        /* parse IBUS_ADDRESS */
        if (strncmp (p, "IBUS_ADDRESS=", sizeof ("IBUS_ADDRESS=") - 1) == 0) {
            gchar *head = p + sizeof ("IBUS_ADDRESS=") - 1;
            for (p = head; *p != '\n' && *p != '\0'; p++);
            if (*p == '\n')
                *p = '\0';
            g_free (address);
            address = g_strdup (head);
            continue;
        }
  ```

  首先忽略注释 (以 `#` 开头的行),
  然后如果找到 `IBUS_ADDRESS=` 那么后面的一堆就是所需地址.

  可以看到, C 语言对字符串进行处理是比较麻烦的.

分析完毕, 可以看到, 代码中对 D-Bus 地址处理的逻辑,
和前面 (章节 1.3) 描述的一致.

### 2.3 使用 Bustle 抓包分析

ibus 使用 D-Bus 这种松散耦合的多进程结构,
有一个额外的好处, 那就是 D-Bus 是可以抓包分析的 !
因为 D-Bus 就像总线一样转发经过的消息.

安装 bustle, 这个软件可以方便对 D-Bus 进行抓包分析:

```
> sudo pacman -S bustle
```

bustle 也有 flatpak 版: <https://flathub.org/zh-Hans/apps/org.freedesktop.Bustle>

启动 bustle, 把 ibus 的 D-Bus 地址填进去, 开始抓包:

![bustle 界面](../图/20240212-12/23-bustle-1.jpg)

### 2.4 从 SetGlobalEngine 作为入口分析

经过多次尝试后发现, 每次切换输入法的时候,
bustle 就会抓到一条 `SetGlobalEngine` 消息.

那么我们就从 `SetGlobalEngine` 开始分析吧.

+ (1) 源文件: `ibus/bus/ibusimpl.c`
  函数: `bus_ibus_impl_service_method_call()`

  ```c
        { "SetGlobalEngine",       _ibus_set_global_engine },
  ```

  也就是 `SetGlobalEngine` 实际调用函数 `_ibus_set_global_engine()`.

  同一个文件找到这个函数, 发现它调用函数 `bus_input_context_set_engine_by_desc()`.

+ (2) 源文件: `ibus/bus/inputcontext.c`
  函数: `bus_input_context_set_engine_by_desc()`

  发现它调用函数 `bus_engine_proxy_new()`.

+ (3) 源文件: `ibus/bus/engineproxy.c`
  函数: `bus_engine_proxy_new()`

  ```c
    data->factory = bus_component_get_factory (data->component);
    if (data->factory == NULL) {
        // 省略
        bus_component_start (data->component, g_verbose);
    } else {
        // 省略
        bus_factory_proxy_create_engine (
                data->factory,
                data->desc,
                timeout,
                cancellable,
                (GAsyncReadyCallback) create_engine_ready_cb,
                data);
    }
  ```

  发现它分情况调用函数: `bus_component_start()`,
  `bus_factory_proxy_create_engine()`.

+ (4) 源文件: `ibus/bus/component.c`
  函数: `bus_component_start()`

  ```c
    if (!g_shell_parse_argv (ibus_component_get_exec (component->component),
                             &argc,
                             &argv,
                             &error)) {
        // 省略
        return FALSE;
    }
    // 省略
    retval = g_spawn_async (NULL, argv, NULL,
                            flags,
                            NULL, NULL,
                            &(component->pid), &error);
  ```

  这个函数获取组件对应的可执行程序路径, 然后启动进程.

+ (5) 源文件: `ibus/bus/factoryproxy.c`
  函数: `bus_factory_proxy_create_engine()`

  ```c
    g_dbus_proxy_call ((GDBusProxy *) factory,
                       "CreateEngine",
                       g_variant_new ("(s)", ibus_engine_desc_get_name (desc)),
                       G_DBUS_CALL_FLAGS_NONE,
                       timeout,
                       cancellable,
                       callback,
                       user_data);
  ```

  这个函数通过 D-Bus 调用 `CreateEngine`.

----

由于 C 语言代码实在太啰嗦了, 不得不跳过和省略了大量代码.

![SetGlobalEngine 调用分析](../图/20240212-12/24-c-1.jpg)

通过上面的一通分析, 可以得到这样的函数调用图.
当 ibus-daemon 收到 `SetGlobalEngine` 请求时, 首先查找对应 engine 的信息.
然后分情况, 如果 engine 还没有启动, 就启动对应进程 (`bus_component_start()`).
如果已经启动了, 就调用 `CreateEngine` 完成初始化.

分析完毕, ibus-daemon 的主要行为已经清楚了.

### 2.5 从 ibus-libpinyin 入手进行分析

上面是从 ibus 的角度分析初始化的, 那么一个输入法要怎么样启动 ?
我们来阅读 `ibus-libpinyin` 的源代码.

+ (1) 源文件: `ibus-libpinyin/src/PYMain.cc`
  函数: `main()`

  这个是整个程序的执行入口.
  文件名后缀 `.cc` 表示编程语言是 C++ (`.c` 表示编程语言是 C).

  调用函数 `start_component()`.
  同一个文件找到这个函数:

  依次调用函数:

  - `ibus_init()`
    ibus 初始化 (不重要).

  - `ibus_bus_new()`
    连接到 ibus-daemon (稍后分析).

  - `ibus_bus_get_config()`
    和配置相关 (不重要).

  - `ibus_factory_new()`
    创建 factory (稍后分析).

  - `ibus_factory_add_engine()`
    添加 engine (不重要).

  - `ibus_bus_request_name()`
    请求名称 (稍后分析).

  - `ibus_main()`
    进入主循环 (不重要).

+ (2) 源文件: `ibus/src/ibusbus.c`
  函数: `ibus_bus_new()`

  ```c
  IBusBus *
  ibus_bus_new (void)
  {
      IBusBus *bus = IBUS_BUS (g_object_new (IBUS_TYPE_BUS,
                                            "connect-async", FALSE,
                                            "client-only", FALSE,
                                            NULL));
      return bus;
  }
  ```

  此处调用 `g_object_new()`, 会间接调用 `ibus_bus_constructor()`.
  (这个是 GObject 的知识点, 如果不清楚就无法继续分析了. )

  同一个文件找到函数 `ibus_bus_constructor()`:
  调用 `ibus_bus_connect()`.

  同一个文件找到函数 `ibus_bus_connect()`:

  - 首先调用 `ibus_get_address()` 获取 ibus-daemon 的 D-Bus 地址
    (详见章节 2.2 的分析).

  - 然后调用 `g_dbus_connection_new_for_address_sync()`
    连接这个 D-Bus 地址.

  - 然后调用 `ibus_bus_connect_completed()`.

  同一个文件找到函数 `ibus_bus_connect_completed()`:
  调用 `ibus_bus_hello()`.

  同一个文件找到函数 `ibus_bus_hello()`:
  调用 `g_dbus_connection_get_unique_name()`.

  这个是获取当前连接在 D-Bus 上的唯一名称.

+ (3) 源文件: `ibus/src/ibusfactory.c`
  函数: `ibus_factory_new()`

  这个函数本身没啥好分析的, 但是同文件的另一个函数
  `ibus_factory_class_init()` 有点意思.
  (这个也是 GObject 的知识点)

  ```c
    class->create_engine = ibus_factory_real_create_engine;

    ibus_service_class_add_interfaces (IBUS_SERVICE_CLASS (class), introspection_xml);
  ```

  这两行是关键代码.

  函数 `ibus_factory_real_create_engine()` 就是实际处理 `CreateEngine` 的.
  还记得上一节分析最后的 `CreateEngine` 嘛 ?
  ibus-daemon 在收到 `SetGlobalEngine` 请求时, 最后调用 `CreateEngine`.
  而实际上后续的事情, 就是在这里完成初始化.

  函数 `ibus_service_class_add_interfaces()` 添加一个 D-Bus 服务接口.
  `introspection_xml` 就是 D-Bus 的接口 xml:

  ```xml
  <node>
    <interface name='org.freedesktop.IBus.Factory'>
      <method name='CreateEngine'>
        <arg direction='in'  type='s' name='name' />
        <arg direction='out' type='o' />
      </method>
    </interface>
  </node>
  ```

  Factory 这个接口有一个方法 `CreateEngine`, 参数有 1 个,
  名称为 `name`, 类型为字符串.
  返回值类型为 object path.
  (此处为 D-Bus 的知识点)

  ----

  同一个文件找到函数 `ibus_factory_real_create_engine()`:
  调用 `ibus_engine_new_with_type()`.

+ (4) 源文件: `ibus/src/ibusengine.c`
  函数: `ibus_engine_new_with_type()`

  这个函数也没啥好分析的, 但是同一个文件的另一个函数
  `ibus_engine_class_init()`:
  调用 `ibus_service_class_add_interfaces()`.

  和上面类似, 此处的 xml 才是最重要的 (部分省略):

  ```xml
  <node>
    <interface name='org.freedesktop.IBus.Engine'>
      <method name='ProcessKeyEvent'>
        <arg direction='in'  type='u' name='keyval' />
        <arg direction='in'  type='u' name='keycode' />
        <arg direction='in'  type='u' name='state' />
        <arg direction='out' type='b' />
      </method>
      <method name='SetCursorLocation'>
        <arg direction='in'  type='i' name='x' />
        <arg direction='in'  type='i' name='y' />
        <arg direction='in'  type='i' name='w' />
        <arg direction='in'  type='i' name='h' />
      </method>
  ```

  此处定义了 Engine 接口, 具有一堆函数 (后面省略了).

+ (5) 源文件: `ibus/src/ibusbus.c`
  函数: `ibus_bus_request_name()`

  ```c
    result = ibus_bus_call_sync (bus,
                                 DBUS_SERVICE_DBUS,
                                 DBUS_PATH_DBUS,
                                 DBUS_INTERFACE_DBUS,
                                 "RequestName",
                                 g_variant_new ("(su)", name, flags),
                                 G_VARIANT_TYPE ("(u)"));
  ```

  此处调用 `RequestName` 是使用 D-Bus 的功能,
  就是给自己在 D-Bus 总线上起一个固定的名字,
  方便别的程序找到自己.

----

(这一部分有点复杂, 还混杂了 GObject 和 D-Bus 的知识点,
窝就偷个懒不画图了哈 ~ )

我们来总结一下, 输入法这边的启动初始化主要做了哪些事情:

+ (1) 获取 ibus 的 D-Bus 地址 (`ibus_get_address()`).

+ (2) 连接到 D-Bus.

+ (3) 获取 D-Bus 唯一名称 (`get_unique_name`).

+ (4) 在 D-Bus 注册接口 `org.freedesktop.IBus.Factory`.

+ (5) 在 D-Bus 请求名称 (`RequestName`).


## 3 使用 rust 实现 ibus 输入法

上面分析了 ibus 的启动初始化过程,
让我们写个简单的输入法来练练手吧 !

ibus 本身使用 C 语言和 python, 也就是说如果用 C/C++ 或 python 来编写,
可以直接使用 ibus 封装好的功能.

但是窝喜欢 rust.
如果用 rust 来写, 并且对 ibus 没有任何的直接依赖 (比如动态链接什么的),
也能进一步验证上面对 ibus 的分析是否正确.

此处使用了 `zbus`: <https://crates.io/crates/zbus>
这是一个完全由 rust 编写的 D-Bus 库.

(此处只贴出了部分关键代码, 并不是完整代码. )

### 3.1 获取 D-Bus 地址

```rust
/// 获取 ibus 的 D-Bus (unix socket) 地址
pub fn get_ibus_addr() -> Result<String, Box<dyn Error>> {
    // 查找配置文件
    // ~/.config/ibus/bus/*-unix-wayland-0
    let home = env::var("HOME")?;
    let wd = env::var("WAYLAND_DISPLAY")?;
    let 目录: PathBuf = [home, ".config/ibus/bus".to_string()].iter().collect();
    let 文件名结束 = format!("-unix-{}", wd);

    let 检查文件名 = |p: &PathBuf| -> bool {
        p.file_name().map_or(false, |n| {
            n.to_str().map_or(false, |s| s.ends_with(&文件名结束))
        })
    };

    let 文件 = fs::read_dir(目录)?
        .filter_map(|i| i.ok())
        .map(|i| i.path())
        .find(检查文件名)
        .ok_or(IBusErr::new("can not find ibus addr".to_string()))?;

    // 读取配置文件, 获取里面的地址
    // 忽略注释 (`#`)
    let 地址 = fs::read_to_string(文件.clone())?
        .lines()
        .filter(|i| !i.starts_with("#"))
        .find_map(|i| i.strip_prefix("IBUS_ADDRESS=").map(|i| i.to_string()))
        .ok_or(IBusErr::new(format!("can not find ibus addr: {:?}", 文件)))?;

    Ok(地址.to_string())
}
```

首先查找相应目录中的文件, 然后读取文件从中获取 D-Bus 地址.

### 3.2 连接 ibus

```rust
pub async fn 连接ibus(addr: String) -> Result<Connection, Box<dyn Error>> {
    let c = ConnectionBuilder::address(addr.as_str())?.build().await?;
    // ibus 初始化: 获取 unique_name
    let n = c
        .unique_name()
        .ok_or(IBusErr::new("can not get dbus unique_name".to_string()))?;
    Ok(c)
}
```

首先连接 D-Bus 的相应地址, 然后获取唯一名称.

### 3.3 注册 engine factory

```rust
const IBUS_PATH_FACTORY: &'static str = "/org/freedesktop/IBus/Factory";

/// ibus 初始化: 注册 engine factory
pub async fn 注册factory<T: IBusEngine + 'static, U: IBusFactory<T> + 'static>(
    c: &Connection,
    f: Factory<T, U>,
) -> Result<(), Box<dyn Error>> {
    c.object_server().at(IBUS_PATH_FACTORY, f).await?;
    Ok(())
}
```

在固定的路径注册 factory 接口.

```rust
/// ibus 初始化: 请求名称
pub async fn 请求名称(c: &Connection, 名称: String) -> Result<(), Box<dyn Error>> {
    let n = WellKnownName::try_from(名称)?;

    c.request_name(n).await?;
    Ok(())
}
```

然后请求名称.

### 3.4 实现 CreateEngine

```rust
#[dbus_interface(name = "org.freedesktop.IBus.Factory")]
impl<T: IBusEngine + 'static, U: IBusFactory<T> + 'static> Factory<T, U> {
    #[dbus_interface(name = "CreateEngine")]
    async fn create_engine(&mut self, name: String) -> fdo::Result<ObjectPath> {
        debug!("CreateEngine");

        let e = self
            .f
            .create_engine(name.clone())
            .map_err(|s| fdo::Error::Failed(s))?;

        let p = Engine::new(&self.c, e)
            .await
            .map_err(|e| fdo::Error::Failed(format!("{:?}", e)))?;
        let o = ObjectPath::try_from(p).map_err(|e| fdo::Error::Failed(format!("{:?}", e)))?;
        Ok(o)
    }
}
```

根据 engine 名称创建实例, 然后返回 object path.

```rust
impl<T: IBusEngine + 'static> Engine<T> {
    /// 创建 engine (包括 ibus 初始化)
    pub async fn new(c: &Connection, e: T) -> Result<String, Box<dyn Error>> {
        let object_path = format!("/org/freedesktop/IBus/Engine/{}", 1);
        let o = Engine {
            e,
            _op: object_path.clone(),
        };

        c.object_server().at(object_path.clone(), o).await?;
        Ok(object_path)
    }
}
```

创建 engine, 并在某路径注册接口.

```rust
#[dbus_interface(name = "org.freedesktop.IBus.Engine")]
impl<T: IBusEngine + 'static> Engine<T> {
    async fn process_key_event(
        &mut self,
        #[zbus(signal_context)] sc: SignalContext<'_>,
        keyval: u32,
        keycode: u32,
        state: u32,
    ) -> fdo::Result<bool> {
        self.e.process_key_event(sc, keyval, keycode, state).await
    }

    // 省略

    #[dbus_interface(signal)]
    pub async fn commit_text(sc: &SignalContext<'_>, text: Value<'_>) -> zbus::Result<()>;
```

这是 D-Bus engine 接口的实现.

### 3.5 简单输入法

```rust
impl IBusEngine for PmimEngine {
    async fn process_key_event(
        &mut self,
        sc: SignalContext<'_>,
        keyval: u32,
        keycode: u32,
        state: u32,
    ) -> fdo::Result<bool> {
        debug!(
            "process_key_event(keyval, keycode, state)  {}, {}, {}",
            keyval, keycode, state
        );

        // 简单输入法
        if is_keydown(state) {
            if keyval == (b'a' as u32) {
                // 输入 `啊`
                let t = make_ibus_text("啊".to_string());
                info!("啊");

                Engine::<PmimEngine>::commit_text(&sc, t).await?;
                return Ok(true);
            } else if keyval == (b'q' as u32) {
                // 输入 `穷`
                let t = make_ibus_text("穷".to_string());

                Engine::<PmimEngine>::commit_text(&sc, t).await?;
                return Ok(true);
            }
        }

        Ok(false)
    }
```

这里实现了一个非常简单的输入法, 只能输入 2 个汉字.
比如按键 `a` 按下的时候, 输入汉字 `啊`.

编译之后启动:

![启动测试](../图/20240212-12/3-t-1.jpg)

输入测试:

![输入测试](../图/20240212-12/3-t-2.jpg)

对应的原始输入: `cbacbacbacbaqaqaqaaaa`

----

本文使用 CC-BY-SA 4.0 许可发布.
