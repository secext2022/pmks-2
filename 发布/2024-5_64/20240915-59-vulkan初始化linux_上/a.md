# rust GTK4 窗口创建与 wayland Subsurface (vulkan 渲染窗口初始化 (Linux) 上篇)

rust 有封装好的 GTK4 库 (gtk4-rs), 有封装好的 wayland 库 (wayland-rs),
有封装好的 vulkan 库 (vulkano), 单独使用其中的每一个, 都很简单.
但是, 把这些一起使用, 崩 !! 大坑出现了 !

这个问题的难度超出了事先的预计 (所以原计划一篇文章分成了两篇),
而类似的事情在编程领域经常发生 (不出意外的就要出意外了).

GTK4 (目前) 并不直接支持使用 vulkan 进行绘制,
所以想要同时使用 GTK4 和 vulkan (在同一个窗口中), 就要采取一些曲线救国的方法:
wayland Subsurface.
然而巧合的是, GTK4 同时又不支持 wayland Subsurface !
所以, 此时就要绕过 GTK4 (GDK4), 直接使用底层的 wayland 协议,
来创建和使用 Subsurface.
然而, `wayland-rs` 库设计是单独使用的, 如果要配合 GTK4 同时使用, 又有了新的麻烦.
总之, 一环套一环, 大坑之中又有深坑, 从这一堆坑中爬出来, 可真不容易啊 ~

----

本内容太长, 分为上下两篇文章:

+ (本文) 《rust GTK4 窗口创建与 wayland Subsurface (vulkan 渲染窗口初始化 (Linux) 上篇)》
+ 《vulkano (rust) 画一个三角形 (vulkan 渲染窗口初始化 (Linux) 下篇)》

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 59 号作品. )

----

相关文章:

+ 《GNOME 如何关闭显示输出 ? (wayland / mutter / KMS / DRI) (源代码阅读)》

  TODO

+ 《香橙派: 在容器 (podman) 中运行 x11 图形界面》

  TODO

参考资料:

+ <https://gtk-rs.org/gtk4-rs/>
+ <https://github.com/smithay/wayland-rs>
+ <https://github.com/Smithay/wayland-rs/pull/572>
+ <https://wayland-book.com/>
+ <https://crates.io/crates/gtk4>
+ <https://crates.io/crates/wayland-client>
+ <https://crates.io/crates/wayland-backend>
+ <https://crates.io/crates/gdk4>
+ <https://crates.io/crates/gdk4-wayland>
+ <https://crates.io/crates/raw-window-handle>


## 目录

+ 1 FAQ

  - 1.1 为什么要使用 wayland ?
  - 1.2 为什么要使用 GTK4 ?
  - 1.3 为什么要使用 vulkan ?

+ 2 GTK4 创建窗口

+ 3 在 GDK4 中初始化 wayland

  - 3.1 获取 wayland 连接
  - 3.2 创建 wayland 事件队列

+ 4 创建 wayland Subsurface

  - 4.1 枚举 wayland 服务
  - 4.2 初始化 Subsurface
  - 4.3 窗口原始指针
  - 4.4 运行测试

+ 5 总结与展望


## 1 FAQ

问答环节 (FAQ):

### 1.1 为什么要使用 wayland ?

GNU/Linux 桌面有两种窗口协议: 古老的 (几十年前的) `x11`, 和新的 `wayland`.
x11 毕竟年龄大了, 很多方面跟不上新时代了.
wayland 一般情况下性能更高, 更安全, 历史遗留问题更少.
所以新的软件, 能支持 wayland 尽量优先支持 wayland, x11 只是为了兼容老旧软件.

另外, Linux 桌面用户本来就少 (市场占有率只有 2% ~ 4%), 所以支持一套协议就够了,
没必要 wayland 和 x11 都支持, 同时维护两套东西太麻烦, 负担太重.

什么 ? 有人非要使用 x11 ? 那 .. . 也不是不可以.
要知道, wayland 和 x11 的一大特点 (优点), 就是支持疯狂套娃:
在 wayland 里面嵌套运行 wayland (合成器),
在 x11 里面嵌套 (nest) 运行 x11 (server), 这些本来就是支持的.
在 wayland 里面运行 x11, 有 `Xwayland`.
在 x11 里面运行 wayland, 也可以, 比如使用 `weston`.
所以, 只支持 wayland 的软件, 非要在 x11 里面运行, 可以, 只不过麻烦一点而已.

### 1.2 为什么要使用 GTK4 ?

GTK (GIMP Tool Kit) 是一个创建图形用户界面 (GUI 窗口) 的工具包,
GTK4 是 GTK 的最新版本. (顺便吐槽, 虽然 GTK 来自 GIMP, 但是 GTK 都到版本 4 了,
GIMP 自己却仍然在使用 GTK2, 移植到 GTK3 的工作今年好像刚刚完成 ?)

与 x11 不同, wayland 窗口是没有 "装饰" 的, 也就是窗口的边框, 标题栏, 关闭按钮,
等等, 需要自己画 (绘制), 自己实现 (x11 的窗口可以由 X server 来进行装饰).
所以, 如果直接基于 wayland 协议来做窗口, 是比较麻烦的, 甚至 "关闭窗口"
都需要自己实现, 没有几百行甚至上千行代码, 弄不好.

而使用 GTK4 就可以简单方便的创建好看的窗口, 由 GTK4 实现窗口关闭, 移动,
改变大小, 最大化最小化等基本功能.

### 1.3 为什么要使用 vulkan ?

vulkan 是一种 GPU 的编程接口 (API) 标准, 可以用于 3D 渲染, GPU 计算等.
也就是说, 通过 vulkan 可以让 GPU (图形处理器) 干活.

vulkan 是 OpenGL (ES) 的升级替代, OpenGL 就很古老了 (也是几十年前的).
OpenGL 经过几十年的发展, 有很多历史遗留问题, 但是为了保持兼容旧的软件, 一直保留.
vulkan 就是一次新的 "干净的重新开始", 没有历史包袱.

与 OpenGL 相比, vulkan 更加贴近硬件底层, 使用 vulkan 的软件具有更强的控制能力,
很多东西需要手动管理, 所以灵活度更高, 性能更高.
应用软件 (而不是显卡驱动) 有更多的优化空间, 可以做更多的事情.
OpenGL 是单线程运行的 (状态机), 而 vulkan 支持多线程 (提交命令缓冲区,
多个命令队列), 所以 vulkan 更适合现代的多核 CPU.
vulkan 对新技术 (比如 光线追踪) 的支持也更好.

vulkan 具有很好的 **跨平台** 能力, Linux, Android (手机), Windows (PC)
等系统都支持, N 卡, A 卡, I 卡等显卡也都支持.
所以基于 vulkan 的软件可以实现 "一次编写, 到处运行". (Java: 抄我台词是吧 ?)


## 2 GTK4 创建窗口

使用 GTK4 创建一个空白窗口是很简单的, 比如:

```sh
> cargo new --bin gtk4_test
    Creating binary (application) `gtk4_test` package
```

文件 `gtk4_test/Cargo.toml`:

```toml
[package]
name = "gtk4_test"
version = "0.1.0"
edition = "2021"

[dependencies]
adw = { version = "^0.7.0", package = "libadwaita", features = ["v1_1"] }
gtk4 = { version = "^0.9.1", features = ["v4_6"] }
```

文件 `gtk4_test/src/main.rs`:

```rust
use adw::Application;
use gtk4::{glib::ExitCode, prelude::*, ApplicationWindow};

fn main() -> ExitCode {
    let app = Application::builder().application_id("test1").build();

    app.connect_activate(move |app| {
        // 创建窗口
        let w = ApplicationWindow::builder()
            .application(app)
            .default_width(1280)
            .default_height(720)
            .title("测试 GTK4 窗口 (穷人小水滴)")
            .build();
        // 显示窗口
        w.present();
    });

    app.run()
}
```

编译:

```sh
cargo build
```

运行:

```sh
./target/debug/gtk4_test
```

![GTK4 窗口](./图/2-w-1.png)


## 3 在 GDK4 中初始化 wayland

`GDK4` 是 GTK4 对于窗口协议 (wayland 和 x11) 的抽象封装 (注意是 GDK 不是 GTK,
名称容易弄错), 也就是使得 GTK 无需关心底层的实现细节, 可以支持 wayland 和 x11.

所以, 要想在 GTK4 中使用 wayland 协议, 就要从 GDK4 入手.

文件 `pmse-gtk/Cargo.toml`:

```toml
[package]
name = "pmse-gtk"
version = "0.1.0-a1"
edition = "2021"
license = "LGPL-3.0-or-later"

[dependencies]
adw = { version = "^0.7.0", package = "libadwaita", features = ["v1_1"] }
gtk4 = { version = "^0.9.1", features = ["v4_6"] }
gdk4 = { version = "^0.9.0", features = ["v4_6"] }
gdk4-wayland = { version = "^0.9.1", features = ["wayland_crate"] }
wayland-backend = { version = "^0.3.7", features = ["client_system", "raw-window-handle"] }

# vulkano version
raw-window-handle = "0.5"
```

此处主要指定一些依赖软件包.
`libadwaita` 和 `gtk4` 上面已经见过了, 主要用来创建窗口.
`gdk4`, `gdk4-wayland`, `wayland-backend` 这几个是使用 wayland 的关键.
`raw-window-handle` 用于获取窗口的原始指针, 在后面初始化 vulkan 要用到.

### 3.1 获取 wayland 连接

文件 `pmse-gtk/src/wayland_conn.rs` (节选):

```rust
//! wayland connection: 从 gtk4 window 获取连接
#![allow(unsafe_code)]

use std::error::Error;

use gdk4::prelude::DisplayExtManual;
use gdk4_wayland::{
    prelude::WaylandSurfaceExtManual,
    wayland_client::{protocol::wl_surface::WlSurface, Connection},
    WaylandDisplay, WaylandSurface,
};
use gtk4::{
    glib::{object::Cast, translate::ToGlibPtr},
    prelude::{NativeExt, RootExt},
    ApplicationWindow,
};

use crate::{VulkanSurface, E};

/// wayland connection
#[derive(Debug, Clone)]
pub struct WaylandConn {
    // raw
    w: ApplicationWindow,
    // wayland 连接
    c: Connection,
}

impl WaylandConn {
    /// 从 gtk4 window 获取连接
    pub fn new(w: &ApplicationWindow) -> Result<Self, Box<dyn Error>> {
        let wd = 获取wd(w)?;
        let c = 获取连接(&wd);
        // debug
        println!("  {:?}", c);

        Ok(Self { w: w.clone(), c })
    }

    /// 创建 VulkanSurface
    ///
    /// 注意: 必须在窗口显示之后调用
    pub fn surface(&self) -> Result<VulkanSurface, Box<dyn Error>> {
        let ws = 获取窗口表面(&self.w)?;
        Ok(VulkanSurface::new(self.c.clone(), ws))
    }
}
```

这个模块用于在创建窗口之后, 获取 wayland 连接.
wayland 连接就是应用软件 (本程序) 与 wayland 合成器 (窗口管理器) 之间的通信连接
(UNIX socket), 因为窗口是 GTK4 创建的, 所以 GDK4 已经创建好了一个 wayland 连接,
所以我们不应该再自己创建新的连接, 而应该使用 GDK4 的连接.

```rust
/// 获取 WaylandDisplay
fn 获取wd(w: &ApplicationWindow) -> Result<WaylandDisplay, Box<dyn Error>> {
    let gdk_d = w.display();
    let 后端 = gdk_d.backend();
    // debug
    println!("gtk4 backend = {:?}", 后端);

    let wd = gdk_d
        .downcast::<WaylandDisplay>()
        .ok()
        .ok_or(E("ERROR wayland cast display".into()))?;
    println!("  {:?}", wd);

    Ok(wd)
}
```

这个函数从 GTK4 的窗口获取 WaylandDisplay, 这一部分使用了 GDK4 的函数.
其中 `downcast` 是 `glib` (GObject) 的函数.
GObject 是一套 C 语言的 "面向对象编程" 框架, 因为 GTK 是用 C 语言编写的,
所以有这个东西.

```rust
/// 获取 wayland connection
///
/// 注意: 只能调用一次
///
/// https://gtk-rs.org/gtk4-rs/stable/latest/docs/src/gdk4_wayland/wayland_display.rs.html#91
fn 获取连接(wd: &WaylandDisplay) -> Connection {
    use gdk4_wayland::ffi;
    unsafe {
        let display_ptr = ffi::gdk_wayland_display_get_wl_display(wd.to_glib_none().0);
        let backend =
            wayland_backend::sys::client::Backend::from_foreign_display(display_ptr as *mut _);
        Connection::from_backend(backend)
    }
}
```

在获得了 GDK4 的 WaylandDisplay 之后, 就能获取 wayland 连接了.
此处使用了 `unsafe` (不安全) rust, 这是因为 GDK 是 C 语言编写的,
rust 与 C 语言的底层交互是不安全的.
使用 `unsafe` 需要特别注意, 因为这部分代码是绕过 rust 编译器 (rustc)
的安全检查的, 可能会有 BUG 导致程序崩溃等 **未定义行为** (UB).
未定义行为的意思就是, 程序会做什么, 我们根本不知道.

需要注意, "未定义行为" 并不是 "不确定行为", 这个概念需要搞清楚.
比如, 如果程序使用随机数 (比如 `/dev/urandom`),
那么程序的行为是 "不确定" (随机) 的, 但是这个随机行为是 **定义** 的,
也就是人类明确的告诉程序要随机.
而 `UB` 的意思是未定义的行为, 这种情况下程序很可能会出现 BUG.

rust 的安全承诺是, 如果不使用 unsafe, 那么不会有 UB.
所以 rust 代码应该尽量不使用 unsafe, 这样代码质量更高, BUG 更少.
但是 C 语言本身是达不到这个安全标准的, 所以 rust 与 C 语言交互时,
不得不使用 unsafe. 使用 unsafe 也就意味着, 编译器不负责了,
代码的安全性由 **程序员** (写代码的人) 全部负责, 所以写 unsafe 代码需要特别小心 !

```rust
/// 获取窗口的顶层表面 WlSurface
fn 获取窗口表面(w: &ApplicationWindow) -> Result<WlSurface, Box<dyn Error>> {
    let gdk_s = w.surface().ok_or("ERROR wayland no surface")?;
    let ws = gdk_s
        .downcast::<WaylandSurface>()
        .ok()
        .ok_or(E("ERROR wayland cast surface".into()))?;
    println!("  {:?}", ws);

    let s = ws
        .wl_surface()
        .ok_or(E("ERROR wayland wl_surface".into()))?;
    Ok(s)
}
```

这个函数是获取窗口的 wayland 表面 (WlSurface), 以及一些错误处理代码.
wayland 表面就是一块绘制区域, 一张画布, 比如一个窗口就可以是一个 wayland 表面.
这个在后面要用到.

### 3.2 创建 wayland 事件队列

这一步是难度最大的, 也是决定本次行动 (爬出深坑) 成败的关键.

应用软件 (本程序) 通过 wayland 连接和 wayland
合成器之间互相发送消息, 这是 wayland 协议的工作方式.
从 wayland 合成器接收到的消息, 会被放入一个 **事件队列**
(EventQueue) 之中, 供程序后续处理.

窗口是 GTK4 创建的, 所以 GDK4 已经创建了事件队列,
供 GDK4 自己使用. 我们想要正常使用 wayland 协议, 就要创建 (初始化)
自己的事件队列.

如果说, GDK4 的 wayland 事件队列是一根已经接好的水管,
那我们就要把这根水管切开一个小口, 接上去一根我们自己的新的水管,
才能喝到水.

文件 `pmse-gtk/src/wayland_subsurface.rs` (节选):

```rust
//! wayland subsurface
//!
//! https://github.com/Smithay/wayland-rs/pull/572
use std::error::Error;
use std::future::poll_fn;
use std::os::unix::io::AsRawFd;
use std::sync::Arc;

use gdk4_wayland::wayland_client::{
    protocol::{wl_compositor, wl_registry, wl_subcompositor, wl_subsurface, wl_surface},
    Connection, Dispatch, EventQueue, QueueHandle,
};
use gtk4::glib::{self, ControlFlow};

use crate::{Cb, HandleBox, E};

/// wayland subsurface (vulkan)
#[derive(Debug, Clone)]
pub struct VulkanSurface {
    c: Connection,
    // toplevel window surface
    ws: wl_surface::WlSurface,
}

impl VulkanSurface {
    pub(crate) fn new(c: Connection, ws: wl_surface::WlSurface) -> Self {
        Self { c, ws }
    }

    /// 运行新的 wayland queue
    pub fn run(self, offset: (i32, i32), cb: Arc<Box<dyn Cb>>) {
        运行(&self.c, self.ws.clone(), offset, cb).unwrap();
    }
}

// 创建 subsurface
struct AppData {
    ws: wl_surface::WlSurface,
    偏移: (i32, i32),
    回调: Arc<Box<dyn Cb>>,
    wc: Option<wl_compositor::WlCompositor>,
    sc: Option<wl_subcompositor::WlSubcompositor>,
    s: Option<wl_surface::WlSurface>,
    ss: Option<wl_subsurface::WlSubsurface>,
}

impl Dispatch<wl_registry::WlRegistry, ()> for AppData {
    fn event(
        state: &mut Self,
        r: &wl_registry::WlRegistry,
        event: wl_registry::Event,
        _: &(),
        c: &Connection,
        h: &QueueHandle<AppData>,
    ) {
// 省略
    }
}

// 省略

/// gtk4 运行 wayland queue
fn 运行队列1(c: &Connection) -> Result<EventQueue<AppData>, Box<dyn Error>> {
    let q = c.new_event_queue();
    let h = q.handle();

    let _r = c.display().get_registry(&h, ());
    // debug
    println!("wayland gtk4 read");
    let 连接 = c.clone();
    let fd = 连接
        .prepare_read()
        .ok_or(E("ERROR wayland prepare_read".into()))?
        .connection_fd()
        .as_raw_fd();
    glib::source::unix_fd_add_local(fd, glib::IOCondition::IN, move |_, _| {
        match 连接.prepare_read() {
            Some(g) => {
                g.read().unwrap();
            }
            None => {
                连接.backend().dispatch_inner_queue().unwrap();
            }
        }
        // TODO
        ControlFlow::Continue
    });

    Ok(q)
}

fn 运行队列2(mut q: EventQueue<AppData>, mut a: AppData) {
    glib::MainContext::default().spawn_local(async move {
        poll_fn(|cx| q.poll_dispatch_pending(cx, &mut a))
            .await
            .unwrap();
    });
}

/// 运行 wayland queue (subcompositor)
fn 运行(
    c: &Connection,
    ws: wl_surface::WlSurface,
    偏移: (i32, i32),
    回调: Arc<Box<dyn Cb>>,
) -> Result<(), Box<dyn Error>> {
    println!("wayland queue run");
    let q = 运行队列1(c)?;

    let a = AppData {
        ws,
        偏移,
        回调,
        wc: None,
        sc: None,
        s: None,
        ss: None,
    };
    println!("wayland registry global:");

    运行队列2(q, a);
    Ok(())
}
```

抱歉, 这段代码确实有点长, 你忍一下, 很快就好了 ~

首先, 按照 `wayland-rs` 的用法, 我们需要创建一个数据结构:

```rust
struct AppData {
    ws: wl_surface::WlSurface,
    偏移: (i32, i32),
    回调: Arc<Box<dyn Cb>>,
    wc: Option<wl_compositor::WlCompositor>,
    sc: Option<wl_subcompositor::WlSubcompositor>,
    s: Option<wl_surface::WlSurface>,
    ss: Option<wl_subsurface::WlSubsurface>,
}
```

里面存放运行过程中需要的状态数据, 并实现所需接口:

```rust
impl Dispatch<wl_registry::WlRegistry, ()> for AppData {
    fn event(
        state: &mut Self,
        r: &wl_registry::WlRegistry,
        event: wl_registry::Event,
        _: &(),
        c: &Connection,
        h: &QueueHandle<AppData>,
    ) {
```

事件队列运行过程中, 接收到相应的消息, `wayland-rs` 就会回调相应的接口,
我们的代码就可以处理对应的消息了.

----

运行事件队列的两个重要初始化函数 `运行队列1`, `运行队列2`:

```rust
/// gtk4 运行 wayland queue
fn 运行队列1(c: &Connection) -> Result<EventQueue<AppData>, Box<dyn Error>> {
    let q = c.new_event_queue();
    let h = q.handle();

    let _r = c.display().get_registry(&h, ());
    // debug
    println!("wayland gtk4 read");
    let 连接 = c.clone();
    let fd = 连接
        .prepare_read()
        .ok_or(E("ERROR wayland prepare_read".into()))?
        .connection_fd()
        .as_raw_fd();
    glib::source::unix_fd_add_local(fd, glib::IOCondition::IN, move |_, _| {
        match 连接.prepare_read() {
            Some(g) => {
                g.read().unwrap();
            }
            None => {
                连接.backend().dispatch_inner_queue().unwrap();
            }
        }
        // TODO
        ControlFlow::Continue
    });

    Ok(q)
}
```

这段神奇的代码来自: <https://github.com/Smithay/wayland-rs/pull/572>

嗯, 窝也不知道为什么, 但是能用 ~ (面向 github 编程)
在此感谢写出这段代码的大神 !

这段代码的大致意思是, 使用 `glib` 对连接的 **文件描述符** (Linux fd)
添加一个回调函数, 有数据到达的时候进行读取, 并放入我们自己的事件队列中.
(差不多就是从 GDK4 的 "大水管" 里面抢水喝这个意思 ~ )

```rust
fn 运行队列2(mut q: EventQueue<AppData>, mut a: AppData) {
    glib::MainContext::default().spawn_local(async move {
        poll_fn(|cx| q.poll_dispatch_pending(cx, &mut a))
            .await
            .unwrap();
    });
}
```

此处使用了 `glib` 的异步功能, 在主线程里面塞进去一个函数,
这个函数会不断检查 (poll) 我们自己的事件队列, 并分发消息 (进行回调).

好了, 至此, 我们自己的 wayland 事件队列终于跑起来了, 撒花 ~


## 4 创建 wayland Subsurface

wayland 窗口是一个 wayland 表面 (surface), GTK4 创建的窗口,
这个表面由 GTK4 负责绘制, 我们无法使用 vulkan 进行绘制.
vulkan 也可以实现对 wayland 表面进行绘制.
那么, 如果想要使用 vulkan 进行绘制, 怎么办呢 ?
此时 wayland Subsurface 就出来救场了 !

Subsurface 是一种特殊的 wayland 表面, 可以附加到窗口, 作为窗口的一部分显示,
同时 Subsurface 自己又可以进行绘制.

那么目标就明确了: 创建一个 Subsurface 并添加到窗口, 就可以使用 vulkan 绘制了.

### 4.1 枚举 wayland 服务

上面我们拿到了 wayland 连接, 也成功跑起来了一个自己的事件队列,
接下来是不是万事大吉了呢 ? 并不 ! 因为 GTK4 不支持 wayland Subsurface,
所以我们无法直接通过 GDK4 获取 wayland Subsurface 服务 (管理器),
也就无法直接用来创建 wayland Subsurface.

首先我们必须枚举 wayland 服务, 也就是 wayland 合成器提供的各种功能 (协议),
这称为 `registry`.

```rust
fn 运行队列1(c: &Connection) -> Result<EventQueue<AppData>, Box<dyn Error>> {
    let q = c.new_event_queue();
    let h = q.handle();

    let _r = c.display().get_registry(&h, ());
```

在初始化事件队列时, 我们调用 `get_registry` 函数, 请求 wayland 合成器枚举服务.

```rust
impl Dispatch<wl_registry::WlRegistry, ()> for AppData {
    fn event(
        state: &mut Self,
        r: &wl_registry::WlRegistry,
        event: wl_registry::Event,
        _: &(),
        c: &Connection,
        h: &QueueHandle<AppData>,
    ) {
        if let wl_registry::Event::Global {
            name,
            interface,
            version,
        } = event
        {
            //println!("    [{}] {} (v{})", name, interface, version);
            // 绑定感兴趣的接口
            match interface.as_str() {
                "wl_compositor" => {
                    let wc = r.bind::<wl_compositor::WlCompositor, _, _>(name, version, h, ());
                    // debug
                    println!("  {:?}", wc);
                    state.wc.replace(wc);
                }
                "wl_subcompositor" => {
                    let sc =
                        r.bind::<wl_subcompositor::WlSubcompositor, _, _>(name, version, h, ());
                    // debug
                    println!("  {:?}", sc);
                    state.sc.replace(sc);
                }
                _ => {}
            }

            // 检查绑定完成
            state.检查绑定(c, h);
        }
    }
}
```

这是对应的事件回调处理代码, 在此处保存需要的 wayland 服务.
`wl_compositor` 用来创建 wayland 表面, `wl_subcompositor` 用来创建 Subsurface.

### 4.2 初始化 Subsurface

终于, 我们做好了一切准备工作:

```rust
impl AppData {
    pub fn 检查绑定(&mut self, c: &Connection, h: &QueueHandle<Self>) {
        // 注意: 只能调用一次, 不能重复创建
        if self.wc.is_some() && self.sc.is_some() && self.ss.is_none() {
            self.创建表面(c, h);
        }
    }

    /// 创建 subsurface
    fn 创建表面(&mut self, c: &Connection, h: &QueueHandle<Self>) {
        // debug
        println!("create subsurface {:?}", self.偏移);
        // 创建新的表面
        let s = self.wc.as_ref().unwrap().create_surface(h, ());
        // 创建下级表面 (设置上级表面)
        let ss = self
            .sc
            .as_ref()
            .unwrap()
            .get_subsurface(&s, &self.ws, h, ());

        // TODO 设置下级表面 偏移
        ss.set_position(self.偏移.0, self.偏移.1);
        // 下级表面显示在上级表面前面 (上方)
        ss.place_above(&self.ws);

        // 分离下级表面 (不再等待上级表面提交)
        ss.set_desync();
        // 同步设置 (提交)
        s.commit();
        self.ws.commit(); // 上级表面也提交, 使设置生效

        // 回调
        let hb = HandleBox::new(&c.backend(), &s);
        self.回调.cb(hb);

        // 初始化完成, 保存结果
        self.s.replace(s);
        self.ss.replace(ss);
    }
}
```

在获取所需的 wayland 服务之后, 开始创建表面.

首先调用 `WlCompositor` 的 `create_surface` 函数, 创建 `WlSurface`.
然后调用 `WlSubcompositor` 的 `get_subsurface` 函数,
给刚刚创建的 `WlSurface` 指定 "角色" (role), 也就是成为 Subsurface.
(所以说 Subsurface 是一种特殊的 surface. )

接下来是一些初始化设置.
调用 `set_position` 设置相对于窗口 (上级表面) 的偏移 (x, y 坐标).
调用 `place_above` 设置在窗口原来的表面上方 (前方) 显示 (也就是表面的层叠顺序).
调用 `set_desync` 分离下级表面, 分离之后下级表面可以自己更新 (绘制),
无需等待上级表面更新.
最后两次调用 `commit` 提交表面设置, 注意一定要提交, 才能使设置生效,
并且需要下级表面和上级表面都提交.

至此, 创建 Subsurface 并初始化完成.

### 4.3 窗口原始指针

vulkan 初始化的时候需要窗口的原始指针, 此处说明获取方式.

文件 `pmse-gtk/src/raw_handle.rs`:

```rust
//! (wayland) RawWindowHandle, RawDisplayHandle
#![allow(unsafe_code)]

use gdk4_wayland::wayland_client::{protocol::wl_surface::WlSurface, Proxy};
use raw_window_handle::{
    HasRawDisplayHandle, HasRawWindowHandle, RawDisplayHandle, RawWindowHandle, WaylandWindowHandle,
};
use wayland_backend::sys::client::Backend;

/// 提供 RawWindowHandle, RawDisplayHandle (wayland)
#[derive(Debug, Clone)]
pub struct HandleBox {
    rd: RawDisplayHandle,
    rw: RawWindowHandle,
}

impl HandleBox {
    pub fn new(b: &Backend, s: &WlSurface) -> Self {
        let rd = b.raw_display_handle();

        // https://docs.rs/winit-gtk/0.29.1/src/winit/platform_impl/linux/window.rs.html
        let mut wh = WaylandWindowHandle::empty();
        wh.surface = s.id().as_ptr() as *mut _;
        let rw = RawWindowHandle::Wayland(wh);

        Self { rd, rw }
    }
}

unsafe impl HasRawDisplayHandle for HandleBox {
    fn raw_display_handle(&self) -> RawDisplayHandle {
        self.rd
    }
}

unsafe impl HasRawWindowHandle for HandleBox {
    fn raw_window_handle(&self) -> RawWindowHandle {
        self.rw
    }
}

// TODO
unsafe impl Send for HandleBox {}
unsafe impl Sync for HandleBox {}
```

此处 `RawDisplayHandle` 表示 wayland 连接, `RawWindowHandle` 表示窗口
(前面创建的 wayland Subsurface). 此处再次用到了 `unsafe`.

### 4.4 运行测试

文件 `pmse-gtk/src/gtk_main.rs`:

```rust
use std::sync::Arc;

use adw::Application;
use gtk4::{prelude::*, ApplicationWindow};

use crate::{ExitCode, HandleBox, WaylandConn};

/// 窗口回调
pub trait Cb {
    fn cb(&self, h: HandleBox);
}

/// 创建窗口
///
/// rect 矩形: (x宽, y高, x偏移, y偏移)
/// margin 边距: (上, 右, 下, 左)
pub fn pmse_gtk_main(
    app_id: String,
    title: String,
    rect: (i32, i32, i32, i32),
    margin: (i32, i32, i32, i32),
    cb: Arc<Box<dyn Cb>>,
) -> ExitCode {
    let app = Application::builder().application_id(&app_id).build();
    // 计算窗口长宽
    let x = rect.0 + margin.1 + margin.3;
    let y = rect.1 + margin.0 + margin.2;
    let 偏移 = (margin.3 + rect.2, margin.0 + rect.3);
    // debug
    println!(
        "pmse_gtk_main: {:?} {:?} x = {}, y = {} {:?}",
        rect, margin, x, y, 偏移
    );

    app.connect_activate(move |app| {
        let w = ApplicationWindow::builder()
            .application(app)
            .default_width(x)
            .default_height(y)
            .title(&title)
            // TODO
            .resizable(false)
            .build();
        // 窗口显示前的初始化
        let c = WaylandConn::new(&w).unwrap();
        // 显示窗口
        w.present();
        // 注意: 必须在显示窗口后调用, 否则没有 wayland surface
        let vs = c.surface().unwrap();

        vs.run(偏移, cb.clone());
    });

    app.run()
}
```

这是执行入口, 调用 GTK4 创建窗口, 并创建和初始化 Subsurface, 然后回调.

文件 `pmse/src/main.rs`:

```rust
//! pmse-bin
#![deny(unsafe_code)]

use std::sync::Arc;

use pmse_gtk::{pmse_gtk_main, Cb, ExitCode, HandleBox};

#[derive(Debug, Clone)]
struct 回调 {
}

impl Cb for 回调 {
    fn cb(&self, _h: HandleBox) {
    }
}

fn main() -> ExitCode {
    let 回调: Arc<Box<dyn Cb>> = Arc::new(Box::new(回调 {}));

    pmse_gtk_main(
        "io.github.fm_elpac.pmse_bin".into(),
        "测试 (wayland)".into(),
        (1280, 720, 62, 56),
        (44, 8, 8, 8),
        回调,
    )
}
```

这是测试代码.

----

使用 cargo 编译项目, 然后运行:

```sh
> ./pmse
pmse_gtk_main: (1280, 720, 62, 56) (44, 8, 8, 8) x = 1296, y = 772 (70, 100)
gtk4 backend = Wayland
  WaylandDisplay { inner: TypedObjectRef { inner: 0x60c47222d320, type: GdkWaylandDisplay } }
  Connection { backend: Backend { backend: InnerBackend { inner: Inner { state: Mutex { data: ConnectionState { display: 0x60c472226780, owns_display: false, evq: 0x60c47232d8a0, display_id: ObjectId(wl_display@1), last_error: None, known_proxies: {} }, poisoned: false, .. }, dispatch_lock: Mutex { data: Dispatcher, poisoned: false, .. }, debug: false } } } }
  WaylandSurface { inner: TypedObjectRef { inner: 0x60c472359520, type: GdkWaylandToplevel } }
wayland queue run
wayland gtk4 read
wayland registry global:
  WlCompositor { id: ObjectId(wl_compositor@52), version: 6, data: Some(ObjectData { .. }), backend: WeakBackend { inner: WeakInnerBackend { inner: (Weak) } } }
  WlSubcompositor { id: ObjectId(wl_subcompositor@47), version: 1, data: Some(ObjectData { .. }), backend: WeakBackend { inner: WeakInnerBackend { inner: (Weak) } } }
create subsurface (70, 100)
```

代码执行成功, 窗口正常显示.


## 5 总结与展望

本文介绍了 GTK4 窗口的创建, 获取 GDK4 wayland 连接, 创建 wayland 事件队列,
枚举 wayland 服务, 创建 Subsurface 并初始化, 获取窗口原始指针,
从而为 vulkan 的初始化做好了准备.

本文使用的系统软件环境: ArchLinux (GNOME).
本文相关的完整源代码请见: <https://crates.io/crates/pmse-gtk>

下篇将使用 vulkan 对 Subsurface 进行绘制.

----

本文使用 CC-BY-SA 4.0 许可发布.
