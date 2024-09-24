# Android (rust) vulkan (JNI) 画一个三角形: VulkanSurfaceView 初始化

上文说到, vulkan 作为一种 GPU 编程接口标准, 具有很好的跨平台能力.
并且在 wayland (GNU/Linux) 成功使用 vulkan 绘制了一个三角形.

今天, 我们同样使用 vulkano (rust), 在 Android (手机) 也画一个三角形吧 ~

本文的解决方案主要参考了 stackoverflow 的一篇文章 (链接见下面的 `参考资料`),
在此表示感谢 !

注意, 本文中的代码写的比较丑, 只是用来快速验证工作原理, 没有经过充分的优化,
很多地方不完善, 仅供参考.

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 62 号作品. )

----

相关文章:

+ 《rust GTK4 窗口创建与 wayland Subsurface (vulkan 渲染窗口初始化 (Linux) 上篇)》

  TODO

+ 《vulkano (rust) 画一个三角形 (vulkan 渲染窗口初始化 (Linux) 下篇)》

  TODO

参考资料:

+ <https://stackoverflow.com/questions/45157950/can-we-use-vulkan-with-java-activity-on-android-platform>
+ <https://stuff.mit.edu/afs/sipb/project/android/docs/reference/android/opengl/GLSurfaceView.html>
+ <https://stuff.mit.edu/afs/sipb/project/android/docs/reference/android/app/NativeActivity.html>
+ <https://crates.io/crates/jni>
+ <https://crates.io/crates/ndk>
+ <https://crates.io/crates/android_logger>
+ <https://crates.io/crates/raw-window-handle>


## 目录

+ 1 Android (kotlin) 部分

  - 1.1 MainActivity
  - 1.2 VulkanSurfaceView
  - 1.3 JNI

+ 2 rust 代码部分

  - 2.1 JNI
  - 2.2 RawWindowHandle
  - 2.3 vulkan 渲染测试
  - 2.4 rust 部分的完整代码

+ 3 编译测试

  - 3.1 编译 rust (`libpmse_apk.so`)
  - 3.2 编译 apk (gradle)
  - 3.3 测试运行

+ 4 总结与展望


## 1 Android (kotlin) 部分

在 Android 应用 (apk) 之中, 如果想要直接使用 GPU 渲染 (OpenGL/vulkan),
官方文档有这两种方式 (链接见上面的 `参考资料`):

+ **`GLSurfaceView`**: 这个是 JVM (Java) 代码, 但是只能使用 OpenGL 进行渲染.

+ **`NativeActivity`**: 这个支持使用 vulkan, 但是这种方式要求,
  整个 Activity (可以理解为 `窗口`) 都要使用 native 代码 (比如 C/C++) 来编写.

----

插播小知识: **native 代码和 JVM 字节码**.

在 Android 系统开发应用软件, 可以使用很多种编程语言, 但是基本上可以分为两大类:
JVM 和 native.

其中 JVM 就是编译成 JVM 字节码 (dex), 然后由 JVM 虚拟机 (ART) 解释运行
(或者 JIT/AOT 等编译) 的编程语言,
常见的有古老的 Java 和新的 kotlin (JVM 还有很多种别的编程语言, 比如 Scala).

native 就是直接编译成 CPU 可以执行的二进制指令代码, 比如 ARM (`arm64-v8a`)
或者 `x86_64`, 然后可以由 CPU 直接执行 (无需 JVM 这种虚拟机).
native 编程语言有 C/C++, 当然 rust 这种编译到 LLVM 的编程语言也是 native 的.

Android 操作系统使用 Linux 内核, 所以 native 代码编译成动态链接库 (文件名后缀
`.so`, 文件格式 `ELF`), 然后加载到运行的应用进程中.

一般来说, JVM 语言编写起来更方便更容易, 能够更好的使用 Android 系统提供的功能
(调用 Android API).
native 语言性能更高 (运行速度快, 占用内存小), 但是编写起来难度较大.

----

一个应用软件, 特别是 **跨平台** 的应用, 代码可以分成两大部分: **平台无关** 代码,
**平台相关** 代码.
平台无关就是, 功能 (代码) 和具体的平台 (操作系统/设备形态等) 联系不太紧密,
一套代码可以到处运行.
平台相关就是, 这些代码和特定的平台联系密切, 一般只能用于这个平台,
别的地方用不了.

上述两种在 Android 直接使用 GPU 的方式中, `GLSurfaceView` 只能使用 OpenGL,
但是窝想使用 vulkan, 排除.
`NativeActivity` 必须全部使用 native 代码, 但是窝想使用 kotlin 编写 Android
平台相关代码, 使用 rust 编写平台无关代码, 也排除.

为什么不使用 rust 编写 Android 平台相关代码呢 ?
并不是技术上无法实现, 而是 rust 代码写起来确实比较费劲 (虽然代码质量也更高),
并且平台相关代码在别的地方也用不到, 性价比较低.
如果使用 kotlin 编写 Android 平台相关代码, 就会更方便更容易, 也能更好的使用
Android 系统 API, 提供更好的用户体验.

所以, 上述两种官方文档中的方式都不行, 我们需要新的创造性的方式,
在 Android 使用 vulkan.
主要思路是, 整个应用 (以及 Activity) 仍然使用 kotlin 编写,
rust 代码只负责 vulkan 渲染部分 (也就是绘制界面区域的一部分).
或者说 rust 代码 **嵌入** (embed) 一个普通的 Android apk 之中.

### 1.1 MainActivity

使用 `AndroidStudio` 创建一个普通的空白应用, 然后修改源代码文件
`app/src/main/java/io/github/fm_elpac/pmse_apk/MainActivity.kt`:

```kotlin
package io.github.fm_elpac.pmse_apk

import android.os.Bundle
import android.app.Activity

import io.github.fm_elpac.pmse_apk.vulkan_bridge.VulkanSurfaceView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        var v = VulkanSurfaceView(this)
        setContentView(v)
    }
}
```

这是一个简单的普通 `Activity` (可以理解为窗口/主界面, 在应用启动后显示).
其中使用 `setContentView()` 函数设置了界面显示的内容,
`VulkanSurfaceView` 就是使用 vulkan 渲染的部分 (相当于一块画布).

### 1.2 VulkanSurfaceView

文件 `app/src/main/java/io/github/fm_elpac/pmse_apk/vulkan_bridge/VulkanSurfaceView.kt`:

```kotlin
package io.github.fm_elpac.pmse_apk.vulkan_bridge

import android.content.Context
import android.util.AttributeSet
import android.view.Surface
import android.view.SurfaceHolder
import android.view.SurfaceView

class VulkanSurfaceView: SurfaceView, SurfaceHolder.Callback2 {
    private var b = VulkanJNI()

    // constructor just call super
    constructor(context: Context): super(context) {
    }
    constructor(context: Context, attrs: AttributeSet): super(context, attrs) {
    }
    constructor(context: Context, attrs: AttributeSet, defStyle: Int): super(context, attrs, defStyle) {
    }
    constructor(context: Context, attrs: AttributeSet, defStyle: Int, defStyleRes: Int): super(context, attrs, defStyle, defStyleRes) {
    }

    init {
        alpha = 1F
        holder.addCallback(this)
    }

    // TODO GLSurfaceView

    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
        b.resize(width, height)
    }

    override fun surfaceDestroyed(holder: SurfaceHolder) {
        b.destroy()
    }

    override fun surfaceCreated(holder: SurfaceHolder) {
        holder.let { h ->
            b.create(h.surface)
        }
    }

    override fun surfaceRedrawNeeded(holder: SurfaceHolder) {
        b.draw()
    }
}
```

此处创建一个类 `VulkanSurfaceView`, 继承 `SurfaceView`,
实现 `SurfaceHolder.Callback2` 回调接口.

其中 `SurfaceView` 是 Android 应用界面的一块 "画布",
可以使用 OpenGL/vulkan 绘制.
`SurfaceView` 继承 `View`, 也就是 Android 应用界面的一个组件.
`SurfaceHolder` 是 `SurfaceView` 正常工作所需要的.

其中几个重要的回调函数:

+ `surfaceCreated`: 这块画布创建后回调, 此时做一些初始化的工作.

+ `surfaceChanged`: 当画布发生变化时回调, 比如格式, 宽高 (像素) 改变.

+ `surfaceRedrawNeeded`: 需要重新绘制时回调.

+ `surfaceDestroyed`: 画布销毁时回调.

注意: `SurfaceView` 支持在另一个单独的线程中进行渲染, 这样可以提高性能,
不再阻塞 UI 主线程, 也是推荐的使用方式.
但是此处为了方便, 直接在 UI 线程中进行了渲染.

### 1.3 JNI

JVM 想要调用 native 代码, 就要使用大名鼎鼎的 `JNI` (Java Native Interface).

文件 `app/src/main/java/io/github/fm_elpac/pmse_apk/vulkan_bridge/VulkanJNI.kt`:

```kotlin
package io.github.fm_elpac.pmse_apk.vulkan_bridge

import android.view.Surface

class VulkanJNI {
    init {
        System.loadLibrary("pmse_apk")
        // debug
        println("DEBUG: load libpmse_apk.so")
    }

    private external fun nativeInit()
    private external fun nativeCreate(surface: Surface)
    private external fun nativeDestroy()
    private external fun nativeResize(width: Int, height: Int)
    private external fun nativeDraw()

    constructor() {
        nativeInit()
    }

    fun create(surface: Surface) {
        // debug
        println("DEBUG: before nativeCreate()")

        nativeCreate(surface)
    }

    fun destroy() {
        // debug
        println("DEBUG: before nativeDestroy()")

        nativeDestroy()
    }

    fun resize(width: Int, height: Int) {
        // debug
        println("DEBUG: before nativeResize()")

        nativeResize(width, height)
    }

    fun draw() {
        // debug
        println("DEBUG: before nativeDraw()")

        nativeDraw()
    }
}
```

这是 JNI 的 JVM 侧. 首先使用 `System.loadLibrary("pmse_apk")` 在初始化时,
加载 `libpmse_apk.so` 动态链接库文件 (native 代码会编译成这个).

然后使用 `external fun` 声明 native 侧的函数. 然后就可以调用啦 ~

添加了一些调试输出, 方便观察程序的行为 (运行过程).


## 2 rust 代码部分

kotlin 部分的代码讲完了, 该轮到 rust 了.

此处我们要使用几个别人已经写好的库: `jni`, `ndk`, `android_logger`,
`raw-window-handle`.

前人已经把路铺好了, 在此表示感谢 !

### 2.1 JNI

这是 JNI 的 native 侧.

```rust
/// io.github.fm_elpac.pmse_apk.vulkan_bridge.VulkanJNI.nativeInit()
#[no_mangle]
pub extern "system" fn Java_io_github_fm_1elpac_pmse_1apk_vulkan_1bridge_VulkanJNI_nativeInit<
    'local,
>(
    _env: JNIEnv<'local>,
    _class: JClass<'local>,
) {
    // init android logger
    android_logger::init_once(
        Config::default()
            .with_max_level(LevelFilter::Trace)
            .with_tag("pmse_apk"),
    );

    debug!("from rust: nativeInit()");

    测试1.lock().unwrap().init();
}

/// io.github.fm_elpac.pmse_apk.vulkan_bridge.VulkanJNI.nativeCreate(Surface)
#[no_mangle]
pub extern "system" fn Java_io_github_fm_1elpac_pmse_1apk_vulkan_1bridge_VulkanJNI_nativeCreate<
    'local,
>(
    env: JNIEnv<'local>,
    _class: JClass<'local>,
    surface: JClass<'local>,
) {
    debug!("from rust: nativeCreate()");

    let nw = unsafe { ANativeWindow_fromSurface(env.get_raw(), **surface) };
    let h = HandleBox::new(nw);

    测试1.lock().unwrap().create(h);
}

/// io.github.fm_elpac.pmse_apk.vulkan_bridge.VulkanJNI.nativeDestroy()
#[no_mangle]
pub extern "system" fn Java_io_github_fm_1elpac_pmse_1apk_vulkan_1bridge_VulkanJNI_nativeDestroy<
    'local,
>(
    _env: JNIEnv<'local>,
    _class: JClass<'local>,
) {
    debug!("from rust: nativeDestroy()");

    测试1.lock().unwrap().destroy();
}

/// io.github.fm_elpac.pmse_apk.vulkan_bridge.VulkanJNI.nativeResize(Int, Int)
#[no_mangle]
pub extern "system" fn Java_io_github_fm_1elpac_pmse_1apk_vulkan_1bridge_VulkanJNI_nativeResize<
    'local,
>(
    _env: JNIEnv<'local>,
    _class: JClass<'local>,
    w: i32,
    h: i32,
) {
    debug!("from rust: nativeResize({}, {})", w, h);

    测试1.lock().unwrap().resize(w as u32, h as u32);
}

/// io.github.fm_elpac.pmse_apk.vulkan_bridge.VulkanJNI.nativeDraw()
#[no_mangle]
pub extern "system" fn Java_io_github_fm_1elpac_pmse_1apk_vulkan_1bridge_VulkanJNI_nativeDraw<
    'local,
>(
    _env: JNIEnv<'local>,
    _class: JClass<'local>,
) {
    debug!("from rust: nativeDraw()");

    测试1.lock().unwrap().draw();
}
```

这几个函数是上面 kotlin 代码通过 JNI 直接调用到的.
使用 `#[no_mangle]` 和 `pub extern "system" fn` 来声明导出函数,
在编译之后的 `.so` 文件中会原样保留函数名 (如果没有 `#[no_mangle]`,
编译器就会修改函数名).

JNI 的一个关键重点是, 函数名称要对应, 否则会加载失败 (程序崩溃).
比如 JVM 侧的
`io.github.fm_elpac.pmse_apk.vulkan_bridge.VulkanJNI.nativeCreate`
函数, 对应 native 侧的
`Java_io_github_fm_1elpac_pmse_1apk_vulkan_1bridge_VulkanJNI_nativeCreate`
函数. 嗯, 很有 Java 遗风, 名称特别长 !

添加了一些调试输出 (Android logcat) 代码, 方便测试.

### 2.2 RawWindowHandle

从之前发布的文章中可知, 想要初始化 vulkan, 就要拿到原始窗口指针.
对于 Android 平台也是如此.

```rust
#[no_mangle]
pub extern "system" fn Java_io_github_fm_1elpac_pmse_1apk_vulkan_1bridge_VulkanJNI_nativeCreate<
    'local,
>(
    env: JNIEnv<'local>,
    _class: JClass<'local>,
    surface: JClass<'local>,
) {
    debug!("from rust: nativeCreate()");

    let nw = unsafe { ANativeWindow_fromSurface(env.get_raw(), **surface) };
    let h = HandleBox::new(nw);

    测试1.lock().unwrap().create(h);
```

此处使用 Android NDK 提供的函数 `ANativeWindow_fromSurface`,
从 `Surface` 创建 `ANativeWindow`.

还记得 `Surface` 嘛 ? 就是 kotlin 代码通过 JNI 传过来的一块 "画布".

```rust
/// 提供 RawWindowHandle, RawDisplayHandle (Android)
#[derive(Debug, Clone)]
pub struct HandleBox {
    rd: RawDisplayHandle,
    rw: RawWindowHandle,
}

impl HandleBox {
    pub fn new(w: *mut ANativeWindow) -> Self {
        let mut h = AndroidNdkWindowHandle::empty();
        h.a_native_window = w as *mut _;

        let rw = RawWindowHandle::AndroidNdk(h);
        let rd = RawDisplayHandle::Android(AndroidDisplayHandle::empty());
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

这是对 Android 平台的原始窗口指针的实现.
别的平台初始化 vulkan 通常需要 2 个原始指针, **显示指针**
(`RawDisplayHandle`) 和 **窗口指针** (`RawWindowHandle`),
但是 Android 只需要一个窗口指针, 显示指针是空的 (占位).

注意此处再次用到了不安全 (`unsafe`) rust.

### 2.3 vulkan 渲染测试

```rust
use pmse_render::{
    draw_t::{PmseRenderT, 三角形},
    PmseRenderHost, PmseRenderInit,
};

struct 测试渲染 {
    pri: Option<PmseRenderInit>,
    pr: Option<PmseRenderHost>,
    t: Option<PmseRenderT>,
}

impl 测试渲染 {
    pub const fn new() -> Self {
        Self {
            pri: None,
            pr: None,
            t: None,
        }
    }

    pub fn init(&mut self) {
        let pri = PmseRenderInit::vulkan().unwrap();
        self.pri = Some(pri);
    }

    // after init()
    pub fn create(&mut self, h: HandleBox) {
        let pr = self.pri.take().unwrap().init_w(h.into()).unwrap();
        self.pr = Some(pr);
    }

    pub fn destroy(&mut self) {
        // TODO
    }

    // after create()
    pub fn resize(&mut self, w: u32, h: u32) {
        let pr = self.pr.take().unwrap();
        let t = PmseRenderT::new(pr, (w, h)).unwrap();
        self.t = Some(t);
    }

    pub fn draw(&mut self) {
        self.t
            .as_mut()
            .unwrap()
            .draw(vec![三角形::default()])
            .unwrap();
    }
}

// TODO 全局变量, 方便测试
static 测试1: Mutex<测试渲染> = Mutex::new(测试渲染::new());
```

调用之前的文章中相同的 vulkan 初始化和测试代码, 绘制一个三角形.

此处设置一个全局变量, 方便测试. 正式代码中不建议这么用.

### 2.4 rust 部分的完整代码

文件 `pmse-apk/Cargo.toml`:

```toml
[package]
name = "pmse-apk"
version = "0.1.0-a1"
edition = "2021"
license = "LGPL-3.0-or-later"

[lib]
crate-type = ["cdylib"]

[dependencies]
log = "^0.4.22"

jni = "^0.21.1"
android_logger = "^0.14.1"
ndk = "^0.9.0"
ndk-sys = "^0.6.0"

# vulkano version
raw-window-handle = "0.5"

pmse-render = { path = "../../pmse-render", version = "^0.1.0-a2" }

[workspace]
```

文件 `pmse-apk/src/lib.rs`:

```rust
//! pmse-apk
#![deny(unsafe_code)]

pub mod jni;
```

文件 `pmse-apk/src/jni.rs`:

```rust
//! Android JNI
#![allow(unsafe_code)]
use std::sync::Mutex;

use android_logger::Config;
use jni::{objects::JClass, JNIEnv};
use log::{debug, LevelFilter};
use ndk_sys::{ANativeWindow, ANativeWindow_fromSurface};
use raw_window_handle::{
    AndroidDisplayHandle, AndroidNdkWindowHandle, HasRawDisplayHandle, HasRawWindowHandle,
    RawDisplayHandle, RawWindowHandle,
};

use pmse_render::{
    draw_t::{PmseRenderT, 三角形},
    PmseRenderHost, PmseRenderInit,
};

struct 测试渲染 {
    pri: Option<PmseRenderInit>,
    pr: Option<PmseRenderHost>,
    t: Option<PmseRenderT>,
}

impl 测试渲染 {
    pub const fn new() -> Self {
        Self {
            pri: None,
            pr: None,
            t: None,
        }
    }

    pub fn init(&mut self) {
        let pri = PmseRenderInit::vulkan().unwrap();
        self.pri = Some(pri);
    }

    // after init()
    pub fn create(&mut self, h: HandleBox) {
        let pr = self.pri.take().unwrap().init_w(h.into()).unwrap();
        self.pr = Some(pr);
    }

    pub fn destroy(&mut self) {
        // TODO
    }

    // after create()
    pub fn resize(&mut self, w: u32, h: u32) {
        let pr = self.pr.take().unwrap();
        let t = PmseRenderT::new(pr, (w, h)).unwrap();
        self.t = Some(t);
    }

    pub fn draw(&mut self) {
        self.t
            .as_mut()
            .unwrap()
            .draw(vec![三角形::default()])
            .unwrap();
    }
}

// TODO 全局变量, 方便测试
static 测试1: Mutex<测试渲染> = Mutex::new(测试渲染::new());

/// io.github.fm_elpac.pmse_apk.vulkan_bridge.VulkanJNI.nativeInit()
#[no_mangle]
pub extern "system" fn Java_io_github_fm_1elpac_pmse_1apk_vulkan_1bridge_VulkanJNI_nativeInit<
    'local,
>(
    _env: JNIEnv<'local>,
    _class: JClass<'local>,
) {
    // init android logger
    android_logger::init_once(
        Config::default()
            .with_max_level(LevelFilter::Trace)
            .with_tag("pmse_apk"),
    );

    debug!("from rust: nativeInit()");

    测试1.lock().unwrap().init();
}

/// io.github.fm_elpac.pmse_apk.vulkan_bridge.VulkanJNI.nativeCreate(Surface)
#[no_mangle]
pub extern "system" fn Java_io_github_fm_1elpac_pmse_1apk_vulkan_1bridge_VulkanJNI_nativeCreate<
    'local,
>(
    env: JNIEnv<'local>,
    _class: JClass<'local>,
    surface: JClass<'local>,
) {
    debug!("from rust: nativeCreate()");

    let nw = unsafe { ANativeWindow_fromSurface(env.get_raw(), **surface) };
    let h = HandleBox::new(nw);

    测试1.lock().unwrap().create(h);
}

/// io.github.fm_elpac.pmse_apk.vulkan_bridge.VulkanJNI.nativeDestroy()
#[no_mangle]
pub extern "system" fn Java_io_github_fm_1elpac_pmse_1apk_vulkan_1bridge_VulkanJNI_nativeDestroy<
    'local,
>(
    _env: JNIEnv<'local>,
    _class: JClass<'local>,
) {
    debug!("from rust: nativeDestroy()");

    测试1.lock().unwrap().destroy();
}

/// io.github.fm_elpac.pmse_apk.vulkan_bridge.VulkanJNI.nativeResize(Int, Int)
#[no_mangle]
pub extern "system" fn Java_io_github_fm_1elpac_pmse_1apk_vulkan_1bridge_VulkanJNI_nativeResize<
    'local,
>(
    _env: JNIEnv<'local>,
    _class: JClass<'local>,
    w: i32,
    h: i32,
) {
    debug!("from rust: nativeResize({}, {})", w, h);

    测试1.lock().unwrap().resize(w as u32, h as u32);
}

/// io.github.fm_elpac.pmse_apk.vulkan_bridge.VulkanJNI.nativeDraw()
#[no_mangle]
pub extern "system" fn Java_io_github_fm_1elpac_pmse_1apk_vulkan_1bridge_VulkanJNI_nativeDraw<
    'local,
>(
    _env: JNIEnv<'local>,
    _class: JClass<'local>,
) {
    debug!("from rust: nativeDraw()");

    测试1.lock().unwrap().draw();
}

/// 提供 RawWindowHandle, RawDisplayHandle (Android)
#[derive(Debug, Clone)]
pub struct HandleBox {
    rd: RawDisplayHandle,
    rw: RawWindowHandle,
}

impl HandleBox {
    pub fn new(w: *mut ANativeWindow) -> Self {
        let mut h = AndroidNdkWindowHandle::empty();
        h.a_native_window = w as *mut _;

        let rw = RawWindowHandle::AndroidNdk(h);
        let rd = RawDisplayHandle::Android(AndroidDisplayHandle::empty());
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


## 3 编译测试

代码写好了, 接下来编译, 运行测试一下吧 ~

### 3.1 编译 rust (`libpmse_apk.so`)

编译命令如下 (操作系统 ArchLinux, 仅供参考):

```sh
> export ANDROID_NDK_HOME=/opt/android-ndk
> export PATH=$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin:$PATH
> export CC_aarch64_linux_android=aarch64-linux-android28-clang
> export CXX_aarch64_linux_android=aarch64-linux-android28-clang++
> export AR_aarch64_linux_android=llvm-ar
> export CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER=aarch64-linux-android28-clang
> cargo build --target aarch64-linux-android
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.27s
```

编译后的文件位于 `target/aarch64-linux-android/debug/libpmse_apk.so`.

### 3.2 编译 apk (gradle)

首先, 把上面编译获得的 `.so` 文件放 (复制) 到这个位置:

```sh
app/src/main/jniLibs/arm64-v8a/libpmse_apk.so
```

然后使用如下编译命令:

```sh
env JAVA_HOME=/usr/lib/jvm/java-17-openjdk ./gradlew assembleDebug
```

这一步使用 `AndroidStudio` 进行编译, 也是一样的.

编译之后获得的 apk 文件位于 `app/build/outputs/apk/debug/app-debug.apk`.

### 3.3 测试运行

使用 adb 把应用安装到手机:

```sh
> adb devices
List of devices attached
643fa0f6	device

> adb install app-debug.apk
Performing Streamed Install
Success
```

使用 logcat 查看调试日志:

```sh
adb logcat -c
adb logcat | grep -e System.out -e pmse
```

在手机上打开应用:

![应用运行截图](./图/33-t-1.png)

同时能看到日志:

```sh
09-24 08:10:21.837  7418  7418 I System.out: DEBUG: load libpmse_apk.so
09-24 08:10:21.837  7418  7418 D pmse_apk: pmse_apk::jni: from rust: nativeInit()
09-24 08:10:21.837  7418  7418 D pmse_apk: pmse_render::vulkan::vulkan_init: init vulkan .. .
09-24 08:10:21.856  7418  7418 D vulkan  : searching for layers in '/data/app/~~vaPOKI1rvIXhWibZF5rASw==/io.github.fm_elpac.pmse_apk-VJsfFmA-8OzE7rL8tPsMeA==/lib/arm64'
09-24 08:10:21.856  7418  7418 D vulkan  : searching for layers in '/data/app/~~vaPOKI1rvIXhWibZF5rASw==/io.github.fm_elpac.pmse_apk-VJsfFmA-8OzE7rL8tPsMeA==/base.apk!/lib/arm64-v8a'

09-24 08:10:21.901  7418  7418 I System.out: DEBUG: before nativeCreate()
09-24 08:10:21.902  7418  7418 D pmse_apk: pmse_apk::jni: from rust: nativeCreate()
09-24 08:10:21.921  7418  7418 D pmse_apk: pmse_render::vulkan::vulkan_init:   Adreno (TM) 640
09-24 08:10:21.921  7418  7418 D pmse_apk: pmse_render::vulkan::vulkan_init: vulkan device queue 3
09-24 08:10:21.921  7418  7418 D pmse_apk: pmse_render::vulkan::vulkan_init: vulkan queue index 0
09-24 08:10:21.923  7418  7418 I System.out: DEBUG: before nativeResize()
09-24 08:10:21.923  7418  7418 D pmse_apk: pmse_apk::jni: from rust: nativeResize(1080, 2244)
09-24 08:10:21.925  7418  7418 D pmse_apk: pmse_render::vulkan::swapchain:   image format: R8G8B8A8_UNORM
09-24 08:10:21.925  7418  7418 D pmse_apk: pmse_render::vulkan::swapchain:   min_image_count 2
09-24 08:10:21.938  7418  7418 I System.out: DEBUG: before nativeDraw()
09-24 08:10:21.938  7418  7418 D pmse_apk: pmse_apk::jni: from rust: nativeDraw()
09-24 08:10:21.938  7418  7418 D pmse_apk: pmse_render::vulkan::test::draw_t: vulkan_test T

09-24 08:10:22.030  1832  1937 I ActivityTaskManager: Displayed io.github.fm_elpac.pmse_apk/.MainActivity: +351ms
```

大成功 ! 撒花 ~


## 4 总结与展望

kotlin 代码通过 `SurfaceView` 获得一块 "画布", 然后用 JNI 调用 rust 代码.
rust 代码初始化 vulkan 并渲染, 从而在 Android (手机) 画一个三角形.
这个结构实现了把一个 rust vulkan 渲染器 "嵌入" 一个普通的 Android apk 之中.

本文进一步验证了 vulkan 良好的 **跨平台** 能力.
只需要为每个平台编写少量的适配代码, 大部分代码都是可以直接复用的.

rust 对 Android 开发的支持, 已经达到了很好的状态.
前人已经把舞台搭建好了, 我们可以尽情发挥啦 ~

接下来会考虑 vulkan 在 Windows 平台的使用.

----

本文使用 CC-BY-SA 4.0 许可发布.
