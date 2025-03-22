# Windows (rust) vulkan 画一个三角形: 窗口创建与渲染初始化

在每个平台, 每前进一步, 都会出现许多预料之外的困难 (大坑).

本文介绍在 Windows 操作系统之中, 使用 win32 API 创建窗口,
并使用 vulkano (rust) 初始化 vulkan, 绘制一个三角形.

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 63 号作品. )

----

相关文章:

+ 《rust GTK4 窗口创建与 wayland Subsurface (vulkan 渲染窗口初始化 (Linux) 上篇)》

  TODO

+ 《vulkano (rust) 画一个三角形 (vulkan 渲染窗口初始化 (Linux) 下篇)》

  TODO

+ 《Android (rust) vulkan (JNI) 画一个三角形: VulkanSurfaceView 初始化》

  TODO

参考资料:

+ <https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createwindowexw>
+ <https://crates.io/crates/windows/>
+ <https://crates.io/crates/vulkano/>
+ <https://www.lunarg.com/vulkan-sdk/>
+ <https://crates.io/crates/raw-window-handle/>
+ <https://crates.io/crates/pmse-win>


## 目录

+ 1 窗口代码

  - 1.1 win32 创建窗口
  - 1.2 RawWindowHandle

+ 2 vulkan 渲染测试

+ 3 编译运行

+ 4 总结与展望


## 1 窗口代码

要想在 Windows 系统编写 rust 程序, 我们可以使用 `windows` 库:
<https://crates.io/crates/windows/>

微软对 rust 编程语言的支持力度还是很大的, 这个库就是微软官方做的,
可以用来调用 Windows 系统的 API.

虽然已经有了现成的系统接口库, 但是我们很快就会遇到一个十分巨大的困难:
Windows API 实在太庞大了.
比如 `windows` (rust) 库 0.58.0 版本就有 **691** 个 feature flag (功能开关) !
也就是说, 仅功能模块就有好几百个, 具体的接口函数和数据结构就更多了.
很容易就迷失在这一大堆功能和函数之中 ~ (晕)

### 1.1 win32 创建窗口

Windows 操作系统, 其英文名称的含义就是 **窗口**,
可见窗口在这个操作系统的重要地位.

win32 是 Windows 系统的一套经典 API (编程接口).
大家不要被 `win32` 这个名称迷惑了, 本文中我们实际编写的是一个 **64 位** 的程序
(`x86_64`). win32 只是因为历史原因, 曾经叫 win32 (当时是 32 位程序),
后来习惯了, 就不改了 (所以 64 位程序用的还是 win32, 并没有 "win64" 这种叫法).

Windows 系统的 API 保持了很好的向后兼容性 (这样的设计有好处也有坏处),
所以我们今天创建窗口的方式, 和几十年前的程序差不多, 基本上还是老样子.

文件 `pmse-win/src/w.rs`:

```rust
//! Windows 窗口封装
#![allow(unsafe_code)]

use std::ffi::c_void;

use raw_window_handle::{
    HasRawDisplayHandle, HasRawWindowHandle, RawDisplayHandle, RawWindowHandle, Win32WindowHandle,
    WindowsDisplayHandle,
};
use windows::{
    core::{HSTRING, PCWSTR},
    Win32::{
        Foundation::{HINSTANCE, HWND, LPARAM, LRESULT, WPARAM},
        Graphics::Gdi::{RedrawWindow, ValidateRect, RDW_INVALIDATE},
        System::LibraryLoader::GetModuleHandleW,
        UI::WindowsAndMessaging::{
            CreateWindowExW, DefWindowProcW, DispatchMessageW, GetMessageW, GetWindowLongPtrW,
            LoadCursorW, PostQuitMessage, RegisterClassExW, SetWindowLongPtrW, ShowWindow,
            CS_HREDRAW, CS_VREDRAW, CW_USEDEFAULT, IDC_ARROW, MSG, SW_SHOWNORMAL, WINDOW_EX_STYLE,
            WINDOW_LONG_PTR_INDEX, WM_DESTROY, WM_PAINT, WM_SIZE, WNDCLASSEXW, WS_CAPTION,
            WS_OVERLAPPED, WS_SYSMENU, WS_VISIBLE,
        },
    },
};

struct 窗口数据 {
    pub 绘制回调: Option<Box<dyn FnMut() -> () + 'static>>,
}

struct 窗口封装 {
    实例: HINSTANCE,
    窗口: HWND,

    数据: Box<窗口数据>,
}

impl 窗口封装 {
    /// 创建窗口
    pub unsafe fn new(宽高: (i32, i32), 标题: String) -> Self {
        let 实例: HINSTANCE = GetModuleHandleW(None).unwrap().into();

        let 窗口类名1 = HSTRING::from("pmse_window");
        let 窗口类名 = PCWSTR(窗口类名1.as_ptr());
        let 窗口类 = WNDCLASSEXW {
            cbSize: std::mem::size_of::<WNDCLASSEXW>() as u32,
            // SetWindowLongPtrW()
            cbWndExtra: std::mem::size_of::<*const c_void>() as i32,

            hInstance: 实例,
            lpszClassName: 窗口类名,
            lpfnWndProc: Some(pmse_win_wndproc),

            style: CS_HREDRAW | CS_VREDRAW,
            hCursor: LoadCursorW(None, IDC_ARROW).unwrap(),

            ..Default::default()
        };
        // 注册窗口类
        let a = RegisterClassExW(&窗口类);
        if 0 == a {
            panic!("RegisterClassExW()");
        }

        let 标题1 = HSTRING::from(标题);
        let 标题 = PCWSTR(标题1.as_ptr());
        // 创建窗口
        let 窗口 = CreateWindowExW(
            WINDOW_EX_STYLE::default(),
            窗口类名,
            标题,
            // 禁止改变窗口大小
            // WS_OVERLAPPEDWINDOW
            WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU | WS_VISIBLE,
            CW_USEDEFAULT,
            CW_USEDEFAULT,
            宽高.0,
            宽高.1,
            None,
            None,
            实例,
            None,
        )
        .unwrap();

        // 窗口数据
        let 数据 = Box::new(窗口数据 { 绘制回调: None });
        // 设置数据指针
        let 窗口数据指针: *const _ = &*数据;
        SetWindowLongPtrW(窗口, WINDOW_LONG_PTR_INDEX(0), 窗口数据指针 as isize);

        Self {
            实例, 窗口, 数据
        }
    }

    pub fn 设绘制回调(&mut self, 回调: Option<Box<dyn FnMut() -> () + 'static>>) {
        self.数据.绘制回调 = 回调;
    }

    pub fn 获取指针(&self) -> HandleBox {
        HandleBox::new(self.实例.0 as *mut _, self.窗口.0 as *mut _)
    }

    /// 请求重绘窗口
    pub unsafe fn 请求绘制(&mut self) {
        let _ = RedrawWindow(self.窗口, None, None, RDW_INVALIDATE);
    }

    pub unsafe fn 主循环(&mut self) {
        // 显示窗口
        let _ = ShowWindow(self.窗口, SW_SHOWNORMAL);

        let mut 消息 = MSG::default();
        while GetMessageW(&mut 消息, HWND(std::ptr::null_mut()), 0, 0).into() {
            DispatchMessageW(&消息);
        }
    }
}
```

创建窗口的过程如下:

+ (1) 调用 `GetModuleHandleW` 函数, 获取本程序的句柄.

+ (2) 创建 `WNDCLASSEXW` 数据结构,
  调用 `RegisterClassExW` 函数进行 **注册窗口类**.

+ (3) 调用 `CreateWindowExW` 函数, 根据上一步注册的窗口类, 创建新的窗口.

+ (4) 调用 `ShowWindow` 函数, 显示窗口.

在上面创建窗口的过程中可以看到, 窗口有很多参数可以设置,
这些选项决定了窗口的外观以及功能, 具有很大的灵活度.
比如可以设置窗口有没有边框, 有没有标题栏, 有没有最大化/最小化/关闭按钮,
能不能调整窗口的大小, 窗口是否透明, 甚至设置非矩形窗口 (比如圆形窗口).

然后进入处理消息的主循环. Windows 的窗口是基于消息队列的,
也就是操作系统会给窗口发送很多不同种类的消息, 窗口需要处理.
当然程序自己也可以给窗口发送消息.

调用 `GetMessageW` 函数从消息队列中获取消息,
然后调用 `DispatchMessageW` 函数分发消息, 进行处理.

----

```rust
unsafe extern "system" fn pmse_win_wndproc(
    窗口: HWND,
    消息: u32,
    w参数: WPARAM,
    l参数: LPARAM,
) -> LRESULT {
    fn 取窗口数据(窗口: HWND) -> *mut 窗口数据 {
        let 指针 = unsafe { GetWindowLongPtrW(窗口, WINDOW_LONG_PTR_INDEX(0)) };
        指针 as *mut _
    }

    match 消息 {
        WM_SIZE => {
            // TODO 窗口大小改变
            let 宽高 = (loword(l参数.0 as u32), hiword(l参数.0 as u32));
            println!("{:?}", 宽高);

            LRESULT(1)
        }

        WM_PAINT => {
            // 绘制回调
            let 数据 = 取窗口数据(窗口);
            match (*数据).绘制回调.as_mut() {
                Some(回调) => {
                    (回调)();
                }
                None => {}
            }

            let _ = ValidateRect(窗口, None);
            LRESULT(0)
        }

        WM_DESTROY => {
            // 关闭窗口
            PostQuitMessage(0);
            LRESULT(0)
        }
        _ => DefWindowProcW(窗口, 消息, w参数, l参数),
    }
}
```

这个就是大名鼎鼎的 **窗口函数** (wndproc),
也就是一个用来处理窗口消息的回调函数.

在上面注册窗口类的时候, 指定对应的窗口函数:

```rust
        let 窗口类 = WNDCLASSEXW {
            // 省略

            lpfnWndProc: Some(pmse_win_wndproc),
```

然后在调用 `DispatchMessageW` 函数的时候, 系统就会回调相应的窗口函数.

这种奇怪的设计, 窝觉得主要还是历史遗留问题. 在早期, Windows 界面的各种东西都是
"窗口". 通常用户了解的 "窗口", 是一种 "顶级窗口".
然后, Windows 的窗口是可以层层嵌套的, 也就是说和 Android 界面的 `View` 差不多.
Windows 界面上的一个 "按钮", "图标", "文字" 等等, 曾经都是一个一个的 "窗口".

当然, 对于我们 vulkan 渲染这种应用场景, 上述 Windows 提供的各种复杂的窗口功能,
我们都是不需要的.
我们只需要一个顶级窗口, 用来 vulkan 绘制即可.

在上面我们定义的窗口函数中, `WM_PAINT` 消息用来画窗口内容 (也就是说,
在处理这个消息时, 对窗口进行实际的绘制).
`WM_DESTROY` 消息是关闭窗口, 我们调用 `PostQuitMessage` 函数来退出主循环,
从而结束程序.

对于别的不感兴趣的窗口消息, 我们调用 `DefWindowProcW` 函数,
让 Windows 系统进行默认处理.

### 1.2 RawWindowHandle

上面已经创建并显示了一个窗口, 接下来就要对接 vulkan 初始化了.
还是老一套, 获取窗口原始指针.

```rust
/// 提供 RawWindowHandle, RawDisplayHandle (Windows)
#[derive(Debug, Clone)]
pub struct HandleBox {
    rd: RawDisplayHandle,
    rw: RawWindowHandle,
}

impl HandleBox {
    pub fn new(hinstance: *mut c_void, hwnd: *mut c_void) -> Self {
        let mut h = Win32WindowHandle::empty();
        h.hinstance = hinstance;
        h.hwnd = hwnd;

        let rw = RawWindowHandle::Win32(h);
        let rd = RawDisplayHandle::Windows(WindowsDisplayHandle::empty());
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

代码很简单, 就不多解释了. 然后对上述代码进行封装, 方便使用:

```rust
pub trait 回调接口 {
    fn 初始化(&mut self, h: HandleBox);
    fn 绘制(&mut self);
}

/// 封装窗口执行入口
pub fn pmse_win_main<T: 回调接口 + 'static>(标题: String, 宽高: (i32, i32), mut 回调: T) {
    let mut 窗口 = unsafe { 窗口封装::new(宽高, 标题) };
    回调.初始化(窗口.获取指针());

    窗口.设绘制回调(Some(Box::new(move || {
        回调.绘制();
    })));

    unsafe { 窗口.主循环() }
}
```


## 2 vulkan 渲染测试

文件 `pmse-win/src/main.rs`:

```rust
//! pmse-win
#![deny(unsafe_code)]

use env_logger;

use pmse_render::{
    draw_t::{PmseRenderT, 三角形},
    PmseRenderInit,
};

mod w;

use w::{pmse_win_main, HandleBox, 回调接口};

struct 回调 {
    pri: PmseRenderInit,
    t: Option<PmseRenderT>,
}

impl 回调 {
    pub fn new() -> Self {
        let pri = PmseRenderInit::vulkan().unwrap();
        Self { pri, t: None }
    }
}

impl 回调接口 for 回调 {
    fn 初始化(&mut self, h: HandleBox) {
        println!("cb init");

        let pr = self.pri.clone().init_w(h.into()).unwrap();
        let t = PmseRenderT::new(pr, (1280, 720)).unwrap();
        self.t = Some(t);
    }

    fn 绘制(&mut self) {
        println!("cb draw");

        self.t
            .as_mut()
            .unwrap()
            .draw(vec![三角形::default()])
            .unwrap();
    }
}

fn main() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("debug")).init();
    println!("main");

    pmse_win_main("测试窗口 (vulkan)".into(), (1280, 720), 回调::new());
}
```

代码和之前发布的文章中的差不多, 调用相同的代码进行 vulkan 初始化和渲染测试.

我们已经把复杂的东西封装好了, 此处调用起来就很简单了.


## 3 编译运行

需要先安装这些软件:

+ `rust`: <https://www.rust-lang.org/>

+ **Vulkan SDK**: <https://www.lunarg.com/vulkan-sdk/>

同时推荐安装这些软件:

+ `vscode` (代码编辑器): <https://code.visualstudio.com/>

+ `git` (版本控制系统): <https://git-scm.com/>

然后编译 (调试版本):

```sh
cargo build
```

如果想编译发布版本 (启用编译优化), 可以使用如下命令:

```sh
cargo build --release
```

编译之后获得:

![exe 文件](./图/3-t-1.png)

文件不大, 只有 `4.9MB`.

![运行截图](./图/3-t-2.png)

运行程序, 如图. 大成功 ! 完结撒花 ~


## 4 总结与展望

至此, vulkan 的 **跨平台** 能力已经得到了充分验证:
GNU/Linux (wayland), Android (手机), Windows (PC) 等操作系统 (平台),
都实现了 vulkan 初始化和绘制三角形.
本文相关的完整源代码请见: <https://crates.io/crates/pmse-win>

vulkan 部分, 底层基于 vulkano 库, 已经封装好了, 属于 **平台无关** 代码,
各平台都一样. 窗口系统部分, 每个平台都不一样.
这里我们 **没有** 选择直接使用封装好的 **跨平台窗口库**,
而是在每个平台都自己从头开始做, 从而可以对窗口具有更强的控制和定制能力.

GNU/Linux 平台, 采用 wayland 窗口协议, 以及 wayland 次表面 (Subsurface).
Android 平台, 通过 JNI (NDK) 和 SurfaceView,
将 rust 代码 "嵌入" 一个普通的 kotlin 应用.
Windows 平台, 基于 `windows` (rust) 库, 使用经典的 win32 API 创建窗口.

我们的 vulkan 程序已经可以支持多个常用平台, 接下来就要回到 vulkan 本身的使用了.

----

本文使用 CC-BY-SA 4.0 许可发布.
