# 修复 blender 中文输入 BUG (linux/wayland/GNOME/ibus)

blender 是一个很好的 **开源** 3D 建模/动画/渲染 软件, 功能很强大,
跨平台 (GNU/Linux, Windows 等系统都支持).

然而, 窝突然发现, blender 居然不支持中文输入 (linux) ! 这怎么能忍 ?
再一查, 不得了, 这居然是个 3 年前一直未解决的陈年老 BUG.
不行, 这绝对忍不了, 这个 BUG 必须干掉 !

恰好, 窝对于 Linux 桌面 (GNOME), 输入法框架 (ibus), wayland 窗口协议,
等等都有一点点经验, 那么就来尝试修复 BUG 吧 ~

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 61 号作品. )

----

相关文章:

+ 《ibus 源代码阅读 (1)》

  TODO

+ 《自制: 7 天手搓一个拼音输入法》

  TODO

+ 《GNOME 如何关闭显示输出 ? (wayland / mutter / KMS / DRI) (源代码阅读)》

  TODO

+ 《rust GTK4 窗口创建与 wayland Subsurface (vulkan 渲染窗口初始化 (Linux) 上篇)》

  TODO

参考资料:

+ <https://www.blender.org/>
+ <https://projects.blender.org/blender/blender/issues/87578>
+ <https://projects.blender.org/blender/blender/commit/a38a49b073f582a0f6ddcca392f2760afdc4d5ed>
+ <https://github.com/ibus/ibus>
+ <https://wayland.freedesktop.org/>
+ <https://wayland.app/protocols/text-input-unstable-v3>
+ <https://developer.blender.org/docs/handbook/building_blender/linux/>
+ <https://developer.blender.org/docs/handbook/contributing/>
+ <https://projects.blender.org/blender/blender/pulls/127824>


## 目录

+ 1 发现问题

  - 1.1 blender 无法输入中文 (linux)
  - 1.2 网上搜索相关问题
  - 1.3 wayland 输入协议 (`zwp_text_input_v3`)
  - 1.4 奇怪的 BUG: 切换输入法
  - 1.5 对比测试 gedit 和 blender

+ 2 修复陈年老 BUG

  - 2.1 编译 blender
  - 2.2 修改 C++ 代码

+ 3 提交 PR (合并请求)

+ 4 总结与展望


## 1 发现问题

俗话说, 发现问题比解决问题更重要.
只有发现了产生问题的原因, 才能想办法去解决问题.

### 1.1 blender 无法输入中文 (linux)

众所周知, 作为一个根正苗红的穷人, 窝平时使用 ArchLinux 操作系统,
GNOME (wayland) 图形桌面软件环境,
以及自己写的基于 ibus 输入法框架的开源拼音输入法 (胖喵拼音).

![blender 界面](./图/11-blender-1.png)

然而, 最近在使用 blender 时突然发现, 这个小可爱居然不支持输入中文 !
啊 ? 这怎么回事 ? 窝使用的可是 ibus 啊, Linux 桌面最普及的输入法框架.
怎么会出问题 !

并且, ibus 一直是很稳的, 使用多年基本上很少出现大问题.
ibus 对 GTK (2, 3, 4), QT, x11, wayland 等各种类型的软件应用都提供了输入支持.
GTK 和 QT 是方便编写窗口图形界面的工具包, Linux 桌面的大部分应用都使用 GTK 或 QT.

然而, 巧了, blender 既不用 GTK, 也不用 QT !
因为 blender 的界面是自己用 OpenGL 绘制的, 所以 blender 是个特殊的例外.
然后就杯摧啦 ~

### 1.2 网上搜索相关问题

遇事不决, 搜索引擎. 然后:

![BUG 页面](./图/12-i-1.png)

这 .. . 这居然是一个 3 年前就报出来, 一直没解决的陈年老 BUG !

没办法, 只能自己动手了. 顺藤摸瓜, 阅读相关资料, 然后发现了一个神奇的提交:
`a38a49b073f582a0f6ddcca392f2760afdc4d5ed`, 标题和说明引用如下:

> GHOST/Wayland: IME support using the text-input protocol
>
> Tested with IBUS on GNOME 45.
> Added a capabilities flag to GHOST since support for IME works on
> Wayland but not on X11, so runtime detection is needed.

一看提交时间: 2023 年 10 月 (一年前), 一看版本: `v4.0.0`.

然后默默看了下自己使用的 blender 版本:

```sh
> blender --version
Blender 4.2.1 LTS
	build date: 2024-09-01
	build time: 08:21:56
	build commit date: 2024-08-19
	build commit time: 11:21
	build hash: 396f546c9d82
	build branch: makepkg (modified)
	build platform: Linux
	build type: Release
```

然后看看自己使用的 GNOME 版本:

```sh
> gnome-shell --version
GNOME Shell 46.5
```

什么情况 ? 没道理啊 !
按理说, 这边使用的软件已经包含了相应的功能, 但是为啥不能正常工作, 输入不了中文 ?

明明上面 (提交说明) 已经写了, 在 GNOME wayland IBUS 测试过了呀.
为什么到窝这里就不行了 ? 难道是因为脸黑 ??

### 1.3 wayland 输入协议 (`zwp_text_input_v3`)

要想干掉 BUG, 就必须先深入其老窝, 从其内部消灭它.
blender 在 Linux 桌面 (GNOME) 使用 wayland 输入协议, 那么就要先搞清楚,
wayland 输入协议是什么.

wayland 是 Linux 桌面新的窗口协议, 用来替代老旧的 x11.
在 wayland 中, 主要有两种软件: wayland 合成器 (compositor),
也就是系统的窗口管理器. 以及普通应用 (wayland client), 需要显示窗口.
wayland 由许多具体的协议 (protocol, 可以理解为 服务) 构成,
合成器作为一个大管家, 通过这些协议给普通应用提供服务.
合成器控制着应用的输入/输出, 比如鼠标/键盘的输入, 通过合成器分发给具体的应用,
应用绘制的窗口画面, 通过合成器显示到屏幕上.

wayland 输入协议是 wayland 对输入法 (IME) 的实现方式.
输入服务 (输入法) 由合成器提供, 应用可以请求合成器来使用输入服务.
在 GNOME 桌面中, wayland 合成器是 gnome-shell (mutter),
当然 mutter 只是一个代理, mutter 转手就把输入请求发送给 ibus 输入法框架,
由 ibus 处理实际的输入法.

目前 wayland 最新的输入协议版本是: `zwp_text_input_v3`.
在 ArchLinux 操作系统, 如果安装了软件包:

```sh
sudo pacman -S wayland-protocols
```

那么可以从这个文件看到 wayland 输入协议接口的详细定义和说明:

```
/usr/share/wayland-protocols/unstable/text-input/text-input-unstable-v3.xml
```

也可以看这个链接: <https://wayland.app/protocols/text-input-unstable-v3>

协议中定义了一些 **请求** (`request`, 从应用发送给合成器) 和 **事件**
(`event`, 从合成器发送给应用).

其中重要的请求有:

+ `enable()`: 启用输入, 在文本输入框激活 (获得焦点) 后发送.
+ `disable()`: 禁用输入, 在文本框失去焦点后发送.
+ `commit()`: 同步, 使设置生效.

重要的事件有:

+ `enter(surface: object<wl_surface>)`: 表示窗口获得焦点, 可以开始输入.
+ `leave(surface: object<wl_surface>)`: 表示窗口失去焦点.
+ `commit_string(text: string)`: 这个是从输入法传过来的, 具体输入的文本.
+ `done(serial: uint)`: 同步, 使输入生效.

当应用开始输入 (需要输入) 时, 一般发送 `enable` 以及 `commit` 请求,
结束输入时, 则发送 `disable` 以及 `commit` 请求.

当输入法需要向应用发送输入的内容 (比如输入法转换之后的汉字) 时,
合成器发送 `commit_string` 以及 `done` 事件.

### 1.4 奇怪的 BUG: 切换输入法

百思不得姐, 这是为什么呢 ? 一切看起来都很正常啊, 但是怎么就是不能工作呢 ?

直到一个偶然的操作, 窝发现了这个 BUG 更离谱之处:
输入中文不是完全不行, 而是有时候行, 有时候不行 !

经过继续尝试, 发现了这个 BUG 的关键之处: **切换输入法** !

如果, 在文本框获得焦点 (点击文本框) 之前, ibus 是中文输入法,
那么可以正常输入中文.
但是, 如果在文本框获得焦点之后, 再把 ibus 从英文切换到中文, 这时候就不行了,
只能输入英文, 不能输入中文了 !

也就是说, 这个 BUG 实际上是切换输入法有 BUG,
blender 不支持在输入过程中切换输入法.

这种情况吧 .. . 也不是完全不能用, 但是用起来就很难受.
因为别的正常的软件, 全都是支持在输入过程中切换输入法的.
对, 窝也是第一次遇见这种类型的奇怪 BUG.

### 1.5 对比测试 gedit 和 blender

那么, 问题到底是什么 ? 我们来找个正常的软件, 对比一下吧.

恰好 `gedit` 在 GNOME wayland 也是使用 wayland 输入协议, 并且工作正常.
gedit 是一个简单的文本编辑器, 所以也方便测试分析.

上面已经找到了, 问题出现在切换输入法, 那么就进行相同的操作 (反复切换输入法),
然后观察应用的具体行为吧.

测试命令:

```sh
env WAYLAND_DEBUG=1 gedit
```

然后获得 gedit 的调试日志 (输出):

```sh
[3529354.672] {Default Queue} wl_registry#2.global(26, "zwp_text_input_manager_v3", 1)
[3529969.414] {Default Queue} wl_registry#30.global(26, "zwp_text_input_manager_v3", 1)
[3529969.434] {Default Queue}  -> wl_registry#30.bind(26, "zwp_text_input_manager_v3", 1, new id [unknown]#42)
[3529969.447] {Default Queue}  -> zwp_text_input_manager_v3#42.get_text_input(new id zwp_text_input_v3#43, wl_seat#21)
[3529993.843] {Default Queue}  -> wl_surface#31.set_input_region(wl_region#47)

[3530009.162] {Default Queue} zwp_text_input_v3#43.enter(wl_surface#31)
[3530009.376] {Default Queue}  -> zwp_text_input_v3#43.enable()
[3530009.412] {Default Queue}  -> zwp_text_input_v3#43.set_surrounding_text("", 0, 0)
[3530009.427] {Default Queue}  -> zwp_text_input_v3#43.set_text_change_cause(1)
[3530009.442] {Default Queue}  -> zwp_text_input_v3#43.set_surrounding_text("", 0, 0)
[3530009.455] {Default Queue}  -> zwp_text_input_v3#43.set_text_change_cause(1)
[3530009.470] {Default Queue}  -> zwp_text_input_v3#43.set_content_type(1, 0)
[3530009.482] {Default Queue}  -> zwp_text_input_v3#43.set_cursor_rectangle(89, 100, 0, 63)
[3530009.493] {Default Queue}  -> zwp_text_input_v3#43.commit()
[3530017.529] {Default Queue} zwp_text_input_v3#43.done(1)

[3531340.639] {Default Queue} zwp_text_input_v3#43.leave(wl_surface#31)
[3531340.657] {Default Queue}  -> zwp_text_input_v3#43.disable()
[3531340.672] {Default Queue}  -> zwp_text_input_v3#43.commit()

[3532434.555] {Default Queue} zwp_text_input_v3#43.enter(wl_surface#31)
[3532434.744] {Default Queue}  -> zwp_text_input_v3#43.enable()
[3532434.812] {Default Queue}  -> zwp_text_input_v3#43.set_surrounding_text("", 0, 0)
[3532434.836] {Default Queue}  -> zwp_text_input_v3#43.set_text_change_cause(1)
[3532434.853] {Default Queue}  -> zwp_text_input_v3#43.set_content_type(1, 0)
[3532434.866] {Default Queue}  -> zwp_text_input_v3#43.set_cursor_rectangle(89, 100, 0, 63)
[3532434.880] {Default Queue}  -> zwp_text_input_v3#43.commit()
[3532439.292] {Default Queue} zwp_text_input_v3#43.done(3)

[3532844.852] {Default Queue} zwp_text_input_v3#43.leave(wl_surface#31)
[3532844.878] {Default Queue}  -> zwp_text_input_v3#43.disable()
[3532844.901] {Default Queue}  -> zwp_text_input_v3#43.commit()

[3533797.049] {Default Queue} zwp_text_input_v3#43.enter(wl_surface#31)
[3533797.186] {Default Queue}  -> zwp_text_input_v3#43.enable()
[3533797.232] {Default Queue}  -> zwp_text_input_v3#43.set_surrounding_text("", 0, 0)
[3533797.250] {Default Queue}  -> zwp_text_input_v3#43.set_text_change_cause(1)
[3533797.269] {Default Queue}  -> zwp_text_input_v3#43.set_content_type(1, 0)
[3533797.286] {Default Queue}  -> zwp_text_input_v3#43.set_cursor_rectangle(89, 100, 0, 63)
[3533797.300] {Default Queue}  -> zwp_text_input_v3#43.commit()
[3533802.135] {Default Queue} zwp_text_input_v3#43.done(5)

[3534172.006] {Default Queue} zwp_text_input_v3#43.leave(wl_surface#31)
[3534172.056] {Default Queue}  -> zwp_text_input_v3#43.disable()
[3534172.124] {Default Queue}  -> zwp_text_input_v3#43.commit()
```

----

测试命令:

```sh
env WAYLAND_DEBUG=1 blender --log-level -1 --log "ghost.*"
```

blender 调试日志:

```sh
[3547531.276] {Default Queue} wl_registry#2.global(26, "zwp_text_input_manager_v3", 1)
[3547531.283] {Default Queue}  -> wl_registry#2.bind(26, "zwp_text_input_manager_v3", 1, new id [unknown]#18)
INFO (ghost.wl.handle.registry): /usr/src/debug/blender/blender/intern/ghost/intern/GHOST_SystemWayland.cc:7044 global_handle_add: add (interface=zwp_text_input_manager_v3, version=1, name=26)
[3547531.895] {Default Queue}  -> zwp_text_input_manager_v3#18.get_text_input(new id zwp_text_input_v3#28, wl_seat#15)
[3547562.769] {Default Queue} wl_registry#30.global(26, "zwp_text_input_manager_v3", 1)
[3547563.043] {Default Queue} wl_registry#32.global(26, "zwp_text_input_manager_v3", 1)
[3547570.089] {Default Queue} wl_registry#2.global(26, "zwp_text_input_manager_v3", 1)
[3547748.370] {mesa egl display queue} wl_registry#42.global(26, "zwp_text_input_manager_v3", 1)

[3547901.864] {Default Queue} zwp_text_input_v3#28.enter(wl_surface#34)
INFO (ghost.wl.handle.text_input): /usr/src/debug/blender/blender/intern/ghost/intern/GHOST_SystemWayland.cc:5556 text_input_handle_enter: enter
[3550150.409] {Default Queue}  -> zwp_text_input_v3#28.enable()
[3550150.439] {Default Queue}  -> zwp_text_input_v3#28.commit()
[3550150.464] {Default Queue}  -> zwp_text_input_v3#28.enable()
[3550150.489] {Default Queue}  -> zwp_text_input_v3#28.commit()
[3550150.519] {Default Queue}  -> zwp_text_input_v3#28.set_content_type(0, 0)
[3550150.569] {Default Queue}  -> zwp_text_input_v3#28.set_cursor_rectangle(2243, 130, 1, 1)
[3550150.620] {Default Queue}  -> zwp_text_input_v3#28.commit()
[3550150.892] {Default Queue}  -> zwp_text_input_v3#28.set_cursor_rectangle(2210, 139, 1, 1)
[3550151.170] {Default Queue}  -> zwp_text_input_v3#28.commit()
[3550159.516] {Default Queue} zwp_text_input_v3#28.done(4)
INFO (ghost.wl.handle.text_input): /usr/src/debug/blender/blender/intern/ghost/intern/GHOST_SystemWayland.cc:5655 text_input_handle_done: done

[3551462.551] {Default Queue} zwp_text_input_v3#28.leave(wl_surface#34)
INFO (ghost.wl.handle.text_input): /usr/src/debug/blender/blender/intern/ghost/intern/GHOST_SystemWayland.cc:5569 text_input_handle_leave: leave

[3552311.934] {Default Queue} zwp_text_input_v3#28.enter(wl_surface#34)
INFO (ghost.wl.handle.text_input): /usr/src/debug/blender/blender/intern/ghost/intern/GHOST_SystemWayland.cc:5556 text_input_handle_enter: enter

[3552662.643] {Default Queue} zwp_text_input_v3#28.leave(wl_surface#34)
INFO (ghost.wl.handle.text_input): /usr/src/debug/blender/blender/intern/ghost/intern/GHOST_SystemWayland.cc:5569 text_input_handle_leave: leave

[3553500.323] {Default Queue} zwp_text_input_v3#28.enter(wl_surface#34)
INFO (ghost.wl.handle.text_input): /usr/src/debug/blender/blender/intern/ghost/intern/GHOST_SystemWayland.cc:5556 text_input_handle_enter: enter

[3553815.091] {Default Queue} zwp_text_input_v3#28.leave(wl_surface#34)
INFO (ghost.wl.handle.text_input): /usr/src/debug/blender/blender/intern/ghost/intern/GHOST_SystemWayland.cc:5569 text_input_handle_leave: leave
```

----

上面的调试日志主要记录了应用软件和 wayland 合成器互相发送的消息.
可以很明显的看出来 gedit 和 blender 的行为差异:

gedit 在每次收到 `leave` 之后, 都会发送 `disable`.
在每次收到 `enter` 之后, 都会发送 `enable`.

而 blender 这边, 只会在第一次时这么做, 后面就没动静了.

这, 就是 blender 切换输入法 BUG 的关键 !


## 2 修复陈年老 BUG

既然发现了问题的关键所在, 接下来就可以尝试修复这个 BUG 了.

### 2.1 编译 blender

第一步, 当然是下载 blender 的源代码, 并在本地编译.

官方指导文档: <https://developer.blender.org/docs/handbook/building_blender/linux/>

对于 C++ 项目 (make/cmake) 来说, blender 的源代码下载和编译过程,
都是相对比较容易和顺利的. 代码下载速度很快 (占用硬盘空间 9.3GB), 编译用时也不长,
这边用 9 年前的老旧小破弱鸡 CPU (i5-6200U) 只用了不到一个小时就编译好了.
(回想起了当年编译 Android AOSP 用时一整天, 硬盘占用 200GB 的可怕时光 .. . )

不过需要注意一下内存占用, 这边 16GB (DDR3-1600) 内存, 差点内存不够编译失败.
最后关闭所有别的应用, 只跑一个编译, 才勉强成功.

本地编译的 blender:

```sh
> ./build_linux/bin/blender --version
Blender 4.3.0 Alpha
	build date: 2024-09-19
	build time: 01:23:36
	build commit date: 2024-09-18
	build commit time: 21:36
	build hash: 3ca97f8c5c75
	build branch: main (modified)
	build platform: Linux
	build type: Release
```

![本地编译的 blender](./图/21-blender-1.png)

### 2.2 修改 C++ 代码

很不幸, blender 的代码是用 C++ 写的, 而 C++ 是非常困难的超级怪兽 !
(窝熟悉的编程语言只有 js (TypeScript), rust, python) 所以 .. .
那只好硬着头皮强行上手了 ! 只要思想不滑坡, 办法总比困难多嘛.

需要修改的文件, 上面的神奇提交已经指出了: `blender/intern/ghost/intern/GHOST_SystemWayland.cc`

修改的思路, 上面已经分析过了, 就是改成和 gedit 一样的行为.

经过一番努力, 对 blender 源代码的修改如下:

```patch
diff --git a/intern/ghost/intern/GHOST_SystemWayland.cc b/intern/ghost/intern/GHOST_SystemWayland.cc
index f9a04ca2882..633444b4197 100644
--- a/intern/ghost/intern/GHOST_SystemWayland.cc
+++ b/intern/ghost/intern/GHOST_SystemWayland.cc
@@ -5725,6 +5725,12 @@ static void text_input_handle_enter(void *data,
   CLOG_INFO(LOG, 2, "enter");
   GWL_Seat *seat = static_cast<GWL_Seat *>(data);
   seat->ime.surface_window = surface;
+  /* If text input is enabled, should call `enable` after receive `enter` event.
+   * This support switch input method during input, otherwise input method will not work. */
+  if (seat->ime.is_enabled) {
+    zwp_text_input_v3_enable(seat->wp.text_input);
+    zwp_text_input_v3_commit(seat->wp.text_input);
+  }
 }
 
 static void text_input_handle_leave(void *data,
@@ -5740,6 +5746,9 @@ static void text_input_handle_leave(void *data,
   if (seat->ime.surface_window == surface) {
     seat->ime.surface_window = nullptr;
   }
+  /* Always call `disable` after receive `leave` event. */
+  zwp_text_input_v3_disable(seat->wp.text_input);
+  zwp_text_input_v3_commit(seat->wp.text_input);
 }
 
 static void text_input_handle_preedit_string(void *data,
@@ -8911,10 +8920,8 @@ void GHOST_SystemWayland::ime_begin(const GHOST_WindowWayland *win,
     seat->ime.has_preedit = false;
     seat->ime.is_enabled = true;
 
-    /* NOTE(@flibit): For some reason this has to be done twice,
-     * it appears to be a bug in mutter? Maybe? */
-    zwp_text_input_v3_enable(seat->wp.text_input);
-    zwp_text_input_v3_commit(seat->wp.text_input);
+    /* No more enable twice, should call enable after `enter` event.
+     * see `text_input_handle_enter` function. */
     zwp_text_input_v3_enable(seat->wp.text_input);
     zwp_text_input_v3_commit(seat->wp.text_input);
```

很简单吧, 也就没改几行代码.
主要就是添加发送 `disable` 和 `enable` 给 wayland 合成器.

然后重新编译, 测试 .. . 再次编译是增量编译, 所以很快, 几分钟就编译好了.

结果 .. . 大成功 ! 现在 blender 的中文输入工作良好, 切换输入法正常.
奇怪的离谱 3 岁陈年老 BUG 就这么被修复啦 ~


## 3 提交 PR (合并请求)

BUG 修复了, 那么接下来的操作就是提交 PR, 请求上游 (upstream, blender) 合并代码.

官方指导文档: <https://developer.blender.org/docs/handbook/contributing/>

![PR](./图/3-pr-1.png)

如图, 这个 PR 正在被处理, 暂时还没有被合并.

现在, 窝已经成为了 **准**·blender 开发者.
等到 PR 被合并之后, 窝就能成为 **真**·blender 开发者啦 ~ 撒花 ~~


## 4 总结与展望

可能是在 Linux 桌面 (1) 使用 blender (2) 的中国人 (3) 太少了吧
(3 个小概率连续相乘), 这个 BUG 挂了 3 年也没人管.

于是, 饥不择食的窝只能自己动手了, 用 2 天时间, 修改了大约 10 行 blender 源代码,
从而修复了在 linux 上切换输入法的 BUG, 现在输入中文已经正常了.

以后, 窝就可以骄傲的对别人说, 窝也是 blender 开发者啦 ~

----

本文使用 CC-BY-SA 4.0 许可发布.
