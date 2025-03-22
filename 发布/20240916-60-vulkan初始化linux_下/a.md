# vulkano (rust) 画一个三角形 (vulkan 渲染窗口初始化 (Linux) 下篇)

上文说到, vulkan 相比 OpenGL (ES), 更加贴近底层硬件,
许多东西需要应用软件手动管理, 所以 vulkan 的初始化过程比较麻烦,
或者说学习曲线比较陡峭.
但是, 这种麻烦是一次性的, 一旦学会了, 就能开始享受 vulkan 的诸多好处啦 ~

本文以绘制一个三角形为例, 介绍 vulkan 的初始化过程和基础使用.

rust 编程语言对 vulkan API 的封装库有好几个, 各自有不同的特点.
本文选择使用的是 `vulkano` 库.

本文的知识主要来自 **vulkano book** 和 **Vulkano Tutorial**
(链接见下方 `参考资料`), 在此表示感谢 !
这是两个很好的 rust vulkan 入门学习资料, 强烈推荐 !
限于篇幅, 本文对一些知识点的解释可能不是很清楚, 这两个资料可以作为很好的补充.

----

本内容太长, 分为上下两篇文章:

+ 《rust GTK4 窗口创建与 wayland Subsurface (vulkan 渲染窗口初始化 (Linux) 上篇)》
+ (本文) 《vulkano (rust) 画一个三角形 (vulkan 渲染窗口初始化 (Linux) 下篇)》

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 60 号作品. )

----

相关文章:

+ 《rust GTK4 窗口创建与 wayland Subsurface (vulkan 渲染窗口初始化 (Linux) 上篇)》

  TODO

参考资料:

+ <https://vulkano.rs/>
+ <https://taidaesal.github.io/vulkano_tutorial/>
+ <https://crates.io/crates/vulkano>


## 目录

+ 1 测试代码

+ 2 vulkan 初始化过程

  - 2.1 加载 vulkan 库 (VulkanLibrary)
  - 2.2 创建 vulkan 实例 (Instance)
  - 2.3 枚举并选择物理设备 (PhysicalDevice)
  - 2.4 创建 vulkan 设备和队列 (Device, Queue)
  - 2.5 创建内存分配器和窗口表面 (StandardMemoryAllocator, Surface)

+ 3 vulkan 绘制一个三角形

  - 3.1 创建交换链 (Swapchain, Image)
  - 3.2 加载着色器 (PipelineShaderStageCreateInfo)
  - 3.3 创建渲染过程 (RenderPass, Subpass, PipelineLayout)
  - 3.4 创建帧缓冲区 (Framebuffer)
  - 3.5 创建图形管线 (GraphicsPipeline)
  - 3.6 创建命令缓冲区 (StandardCommandBufferAllocator, Subbuffer, PrimaryAutoCommandBuffer)
  - 3.7 执行命令 (绘制)
  - 3.8 运行测试

+ 4 总结与展望


## 1 测试代码

首先来看一下测试用的调用代码, 对 vulkan 初始化和使用的整体过程有个简单的了解.

文件 `pmse/src/main.rs`:

```rust
//! pmse-bin
#![deny(unsafe_code)]

use std::sync::Arc;

use pmse_gtk::{pmse_gtk_main, Cb, ExitCode, HandleBox};
use pmse_render::{PmseRenderInit, PmseRenderTest};

#[derive(Debug, Clone)]
struct 回调 {
    pri: PmseRenderInit,
}

impl Cb for 回调 {
    fn cb(&self, h: HandleBox) {
        let pr = self.pri.clone().init_w(h.into()).unwrap();
        let t = PmseRenderTest::new(pr, (1280, 720)).unwrap();
        t.draw().unwrap();
        // TODO
    }
}

fn main() -> ExitCode {
    let pri = PmseRenderInit::vulkan().unwrap();
    let 回调: Arc<Box<dyn Cb>> = Arc::new(Box::new(回调 { pri }));

    pmse_gtk_main(
        "io.github.fm_elpac.pmse_bin".into(),
        "测试 (vulkan) 穷人小水滴".into(),
        (1280, 720, 62, 56),
        (44, 8, 8, 8),
        回调,
    )
}
```

此处的代码在上一篇文章的测试代码中, 增加了一些 vulkan 相关的部分.
重点有:

+ (1) `PmseRenderInit::vulkan()` 这个函数对 vulkan 进行初步初始化.

+ (2) `PmseRenderInit.init_w()` 在创建和显示 GTK4 窗口之后
  (初始化 wayland Subsurface 之后), 对 vulkan 进行进一步的初始化.

+ (3) `PmseRenderTest::new()` 对测试渲染部分进行初始化 (画一个三角形).

+ (4) `PmseRenderTest.draw()` 进行实际的绘制.

注意, 这只是窝选择的封装方式, 仅供参考.
主要目的是把 "vulkan 相关代码" 和 "窗口相关代码" 互相隔离, 各自封装为模块
(从而做到 "高内聚, 低耦合").

vulkan 其实可以单独运行, 不需要窗口, 但是这样做有一个限制,
就是 vulkan 渲染的内容不能用窗口显示出来.
将 vulkan 和窗口关联起来, 只是为了显示渲染的结果, 并不是 vulkan 必须的.

----

文件 `pmse-render/Cargo.toml`:

```toml
[package]
name = "pmse-render"
version = "0.1.0-a1"
edition = "2021"
license = "LGPL-3.0-or-later"

[dependencies]
vulkano = "^0.34.1"
vulkano-shaders = "^0.34.0"

# vulkano version
raw-window-handle = "0.5"
```

这是使用的主要依赖软件包.


## 2 vulkan 初始化过程

本章节对这一部分代码相关的 vulkan 初始化过程进行介绍,
文件 `pmse-render/src/vulkan_init.rs`:

```rust
//! vulkan 初始化
use std::error::Error;
use std::sync::Arc;

use raw_window_handle::{HasRawDisplayHandle, HasRawWindowHandle};
use vulkano::{
    device::{
        physical::PhysicalDevice, Device, DeviceCreateInfo, DeviceExtensions, Queue,
        QueueCreateInfo, QueueFlags,
    },
    instance::{Instance, InstanceCreateInfo},
    memory::allocator::StandardMemoryAllocator,
    swapchain::Surface,
    VulkanLibrary,
};

use crate::E;

/// 正在初始化的 vulkan 渲染器
#[derive(Debug, Clone)]
pub struct PmseRenderInit {
    库: Arc<VulkanLibrary>,
}

impl PmseRenderInit {
    /// 初始化 vulkan (加载 vulkan 库 .so)
    pub fn vulkan() -> Result<Self, Box<dyn Error>> {
        // debug
        println!("init vulkan .. .");

        let 库 = VulkanLibrary::new()?;
        Ok(Self { 库 })
    }

    /// 窗口初始化, 传入窗口
    pub fn init_w(
        self,
        w: Arc<impl HasRawDisplayHandle + HasRawWindowHandle + Send + Sync + 'static>,
    ) -> Result<PmseRenderHost, Box<dyn Error>> {
        let 实例扩展 = Surface::required_extensions(w.as_ref());
        // 创建 vulkan 实例
        let 实例 = Instance::new(
            self.库.clone(),
            InstanceCreateInfo {
                enabled_extensions: 实例扩展,
                ..Default::default()
            },
        )?;

        // 创建设备队列
        let 设备扩展 = DeviceExtensions {
            khr_swapchain: true,
            ..DeviceExtensions::empty()
        };
        let (物理设备, 队列序号) = 选择设备(&实例, 设备扩展.clone())?;
        let (设备, 队列) = 创建设备队列(&物理设备, 队列序号, 设备扩展)?;

        // 创建内存分配器
        let ma = Arc::new(StandardMemoryAllocator::new_default(设备.clone()));
        // 创建窗口表面
        let 表面 = Surface::from_window(实例.clone(), w)?;

        // 初始化 (这部分) 完成
        Ok(PmseRenderHost::new(物理设备, 设备, 队列, ma, 表面))
    }
}
```

### 2.1 加载 vulkan 库 (VulkanLibrary)

```rust
        let 库 = VulkanLibrary::new()?;
```

使用 vulkan 的第一步, 就是加载系统上安装的 vulkan 库.
一般在安装显卡驱动的时候, 这个就已经安装好了.

### 2.2 创建 vulkan 实例 (Instance)

加载 vulkan 库之后, 就要创建 vulkan 实例了.
如果想要使用窗口显示渲染结果, 就要等到创建窗口之后,
再来创建 vulkan 实例.

```rust
    /// 窗口初始化, 传入窗口
    pub fn init_w(
        self,
        w: Arc<impl HasRawDisplayHandle + HasRawWindowHandle + Send + Sync + 'static>,
    ) -> Result<PmseRenderHost, Box<dyn Error>> {
        let 实例扩展 = Surface::required_extensions(w.as_ref());
        // 创建 vulkan 实例
        let 实例 = Instance::new(
            self.库.clone(),
            InstanceCreateInfo {
                enabled_extensions: 实例扩展,
                ..Default::default()
            },
        )?;
```

传入参数 `w` 就是上一篇文章中, 在初始化 wayland Subsurface 之后,
获取的窗口原始指针.

为了让窗口能够显示 vulkan 渲染的结果, 需要启用 vulkan 实例的相应扩展.
我们使用 `Surface::required_extensions()` 函数, 来获取所需的扩展,
然后创建 vulkan 实例.

### 2.3 枚举并选择物理设备 (PhysicalDevice)

```rust
        let 设备扩展 = DeviceExtensions {
            khr_swapchain: true,
            ..DeviceExtensions::empty()
        };
        let (物理设备, 队列序号) = 选择设备(&实例, 设备扩展.clone())?;
```

在一个系统上, 可能同时安装有多个支持 vulkan 的硬件设备,
比如多个 GPU (比如, 集成显卡, 独立显卡), 甚至 CPU 也可以进行软件渲染.
在这里需要选择使用哪个 vulkan 设备.
其中 `khr_swapchain` 是设备需要支持的扩展 (交换链), 这个用于窗口显示渲染结果.

```rust
/// 选择 vulkan 设备
fn 选择设备(
    实例: &Arc<Instance>,
    扩展: DeviceExtensions,
) -> Result<(Arc<PhysicalDevice>, u32), Box<dyn Error>> {
    // TODO 优化设备选择功能

    // 列出 (枚举) vulkan 设备
    let 设备列表 = 实例
        .enumerate_physical_devices()?
        .filter(|p| p.supported_extensions().contains(&扩展));
    let mut d1: Option<Arc<PhysicalDevice>> = None;
    for i in 设备列表 {
        // 输出设备列表, 选择第一个 vulkan 设备
        println!("  {}", i.properties().device_name);
        if d1.is_none() {
            d1.replace(i);
        }
    }
    let 设备 = d1.ok_or(E("ERROR vulkan list device".into()))?;

    // 列出 (查找) vulkan 队列
    for f in 设备.queue_family_properties() {
        println!("vulkan device queue {:?}", f.queue_count);
    }
    let queue_family_index = 设备
        .queue_family_properties()
        .iter()
        .enumerate()
        .position(|(_i, q)| q.queue_flags.contains(QueueFlags::GRAPHICS))
        .ok_or(E("ERROR vulkan find queue".into()))? as u32;
    println!("vulkan queue index {}", queue_family_index);

    Ok((设备, queue_family_index))
}
```

此处给出的是一种非常简单的设备选择方法, 仅供参考, 后续还能继续优化.
也就是选择满足要求的第一个设备.

此处同时需要 (选择) 找出 vulkan 队列的序号, 此处选择支持图形渲染
(`QueueFlags::GRAPHICS`) 的队列, 并返回队列序号.

vulkan 队列用来提交 vulkan 命令, 也就是让 GPU 干活的一个接口.
同一个 vulkan 设备可能同时具有多种队列, 每种类型的队列也可能有多个,
应用软件需要选择使用合适的队列.

### 2.4 创建 vulkan 设备和队列 (Device, Queue)

```rust
        let (设备, 队列) = 创建设备队列(&物理设备, 队列序号, 设备扩展)?;
```

上面选择好了使用的 vulkan 物理设备, 以及队列序号, 接下来就要创建 vulkan 设备了.

```rust
/// 创建 vulkan 设备, 队列
fn 创建设备队列(
    设备: &Arc<PhysicalDevice>,
    queue_family_index: u32,
    enabled_extensions: DeviceExtensions,
) -> Result<(Arc<Device>, Arc<Queue>), Box<dyn Error>> {
    let (d, mut 队列) = Device::new(
        设备.clone(),
        DeviceCreateInfo {
            queue_create_infos: vec![QueueCreateInfo {
                queue_family_index,
                ..Default::default()
            }],
            enabled_extensions,
            ..Default::default()
        },
    )?;
    let q = 队列.next().unwrap();
    Ok((d, q))
}
```

简单粗暴, 根据前面的物理设备和队列序号, 直接创建就完事了, 注意启用设备扩展.
在 vulkan 里面, 核心功能是最基本的, 很多功能需要使用之前, 都要启用对应的 **扩展**.

此处只使用了一个 vulkan 队列, 但是在复杂的应用中, 可能同时使用多个 vulkan 队列.

### 2.5 创建内存分配器和窗口表面 (StandardMemoryAllocator, Surface)

```rust
        // 创建内存分配器
        let ma = Arc::new(StandardMemoryAllocator::new_default(设备.clone()));
        // 创建窗口表面
        let 表面 = Surface::from_window(实例.clone(), w)?;
```

内存分配器用来分配 (管理) vulkan 设备的内存, 也就是 GPU **显存**.
没错, 这就是 vulkan 的强大功能之一: 显存由应用软件进行手动管理.
这样应用软件在内存 (显存) 的分配和使用方面, 就能做更多的优化,
容易达到更高的性能, 而不必依赖太多显卡驱动的优化.

此处使用 `vulkano` 提供的 `StandardMemoryAllocator` 分配器,
这是一个通用的内存分配器, 如果没有特别的理由, 默认选这个就好了.

此处创建的 vulkan 表面, 就对应上一篇文章中创建的 wayland 表面 (Subsurface),
也就是 vulkan 渲染结果要显示到的地方.


## 3 vulkan 绘制一个三角形

本章节对这一部分代码相关的 vulkan 初始化和使用进行介绍,
文件 `pmse-render/src/render_test.rs`:

```rust
//! 渲染测试
use std::error::Error;
use std::sync::Arc;

use vulkano::{
    buffer::{Buffer, BufferContents, BufferCreateInfo, BufferUsage, Subbuffer},
    command_buffer::{
        allocator::StandardCommandBufferAllocator, AutoCommandBufferBuilder, CommandBufferUsage,
        PrimaryAutoCommandBuffer, RenderPassBeginInfo, SubpassBeginInfo, SubpassContents,
        SubpassEndInfo,
    },
    device::{Device, Queue},
    memory::allocator::{AllocationCreateInfo, MemoryTypeFilter, StandardMemoryAllocator},
    pipeline::{
        graphics::{
            color_blend::{ColorBlendAttachmentState, ColorBlendState},
            input_assembly::InputAssemblyState,
            multisample::MultisampleState,
            rasterization::RasterizationState,
            vertex_input::{Vertex, VertexDefinition},
            viewport::{Viewport, ViewportState},
            GraphicsPipelineCreateInfo,
        },
        layout::PipelineDescriptorSetLayoutCreateInfo,
        GraphicsPipeline, PipelineLayout, PipelineShaderStageCreateInfo,
    },
    render_pass::{Framebuffer, RenderPass, Subpass},
    shader::EntryPoint,
    swapchain::Swapchain,
};

use crate::shader;
use crate::util::{交换链执行, 创建命令缓冲分配器};
use crate::E;
use crate::{PmseRenderHost, PmseRenderSc};

// 省略

/// vulkan 渲染测试
pub struct PmseRenderTest {
    h: PmseRenderHost,
    /// 交换链
    sc: PmseRenderSc,
    /// (no Debug) 命令缓冲区
    命令: Vec<Arc<PrimaryAutoCommandBuffer>>,
}

impl PmseRenderTest {
    /// 初始化
    pub fn new(h: PmseRenderHost, size: (u32, u32)) -> Result<Self, Box<dyn Error>> {
        // 创建交换链
        let mut sc = PmseRenderSc::new(&h, size.into())?;

        let (阶段, 顶点入口) = 加载着色器(h.d())?;
        let (渲染过程, 分过程, 布局) = 创建渲染过程(h.d(), &阶段, sc.sc())?;
        // 初始化 帧缓冲区
        sc.init_framebuffer(&渲染过程)?;

        let 视口 = Viewport {
            offset: [0.0, 0.0],
            extent: [size.0 as f32, size.1 as f32],
            depth_range: 0.0..=1.0,
        };
        let 管线 = 创建图形管线(h.d(), 顶点入口, 阶段, 视口, 分过程, 布局)?;

        let ca = 创建命令缓冲分配器(h.d());
        let 顶点数据 = 创建顶点缓冲区(h.ma())?;

        let mut 命令: Vec<Arc<PrimaryAutoCommandBuffer>> = Vec::new();
        for i in sc.framebuffer() {
            命令.push(创建命令缓冲区(&ca, h.q(), &管线, i, &顶点数据)?);
        }

        Ok(Self { h, sc, 命令 })
    }

    /// vulkan 绘制 测试
    pub fn draw(&self) -> Result<(), Box<dyn Error>> {
        // debug
        println!("vulkan_test");
        交换链执行(self.h.d(), self.h.q(), &self.命令, self.sc.sc())?;
        Ok(())
    }
}
```

### 3.1 创建交换链 (Swapchain, Image)

```rust
impl PmseRenderTest {
    /// 初始化
    pub fn new(h: PmseRenderHost, size: (u32, u32)) -> Result<Self, Box<dyn Error>> {
        // 创建交换链
        let mut sc = PmseRenderSc::new(&h, size.into())?;
```

为了在窗口中显示内容, 就要创建 **交换链** (Swapchain).

交换链可以理解为几张循环重复使用的画布, 其中一张的内容用来屏幕显示,
一张用来 vulkan 绘制, 画好了一个画面之后, 交换画布, 屏幕显示新的内容.
至少需要 2 张画布, 才可以实现这种工作方式, 但是实际可能使用更多张画布,
来取得更好的性能.

文件 `pmse-render/src/swapchain.rs`:

```rust
//! 交换链 (swapchain) 创建/初始化
use std::error::Error;
use std::sync::Arc;

use vulkano::{
    device::{physical::PhysicalDevice, Device},
    image::{view::ImageView, Image, ImageUsage},
    render_pass::{Framebuffer, FramebufferCreateInfo, RenderPass},
    swapchain::{Surface, Swapchain, SwapchainCreateInfo},
};

use crate::PmseRenderHost;

/// 交换链 (swapchain) 管理
#[derive(Debug)]
pub struct PmseRenderSc {
    /// (no Clone) 交换链
    交换链: Arc<Swapchain>,
    /// 图像
    图像: Vec<Arc<Image>>,
    /// 帧缓冲区
    帧缓冲: Vec<Arc<Framebuffer>>,
}

impl PmseRenderSc {
    pub fn new(h: &PmseRenderHost, size: [u32; 2]) -> Result<Self, Box<dyn Error>> {
        let (交换链, 图像) = 创建交换链(h.d(), h.p(), h.s(), size)?;
        // 稍后初始化 帧缓冲
        Ok(Self {
            交换链,
            图像,
            帧缓冲: vec![],
        })
    }

    /// 获取交换链
    pub fn sc(&self) -> &Arc<Swapchain> {
        &self.交换链
    }

    /// 创建帧缓冲区
    pub fn init_framebuffer(&mut self, rp: &Arc<RenderPass>) -> Result<(), Box<dyn Error>> {
        self.帧缓冲 = 创建帧缓冲区(&self.图像, rp)?;
        Ok(())
    }
```

其中:

```rust
/// 创建交换链
fn 创建交换链(
    设备: &Arc<Device>,
    物理设备: &Arc<PhysicalDevice>,
    表面: &Arc<Surface>,
    image_extent: [u32; 2],
) -> Result<(Arc<Swapchain>, Vec<Arc<Image>>), Box<dyn Error>> {
    let 能力 = 物理设备.surface_capabilities(表面, Default::default())?;
    let composite_alpha = 能力.supported_composite_alpha.into_iter().next().unwrap();
    let image_format = 物理设备.surface_formats(表面, Default::default())?[0].0;
    println!("  image format: {:?}", image_format);
    println!("  min_image_count {}", 能力.min_image_count);

    Ok(Swapchain::new(
        设备.clone(),
        表面.clone(),
        SwapchainCreateInfo {
            min_image_count: 能力.min_image_count + 1,
            image_format,
            image_extent,
            image_usage: ImageUsage::COLOR_ATTACHMENT,
            composite_alpha,
            ..Default::default()
        },
    )?)
}
```

传入参数 `表面` 就是前面说的窗口表面, `image_extent` 是显示区域的宽高 (像素).

首先查询表面的参数 (能力), 获取透明度格式 (`composite_alpha`),
表面的图像格式 (`image_format`), 然后创建交换链.
注意, 表面支持的透明度以及图像格式, 也可能有多种, 此处使用的是非常简单的选择方法:
选择第一个.

创建交换链的同时, 会返回一组 vulkan 图像 (`Image`), 也就是已经分配好的内存区域,
之后绘制的目标就是这个.

### 3.2 加载着色器 (PipelineShaderStageCreateInfo)

**着色器** (shader) 是一段在 GPU 上运行的代码, 着色器分为多种类型, 比如:
顶点着色器 (vertex shader), 片段着色器 (fragment shader),
计算着色器 (compute shader), 等等.

在本文画一个三角形的应用场景下, 我们使用两种着色器:
顶点着色器, 用来计算每个顶点的位置. 片段着色器, 用来计算每个像素点的颜色.
GPU 是大规模并行计算的结构, 所以顶点着色器会为每个顶点执行一次
(在本文中, 为三角形的每个顶点运行一次, 一共运行 3 次),
片段着色器为每个像素执行一次 (在本文中, 为三角形覆盖的屏幕上的每个像素运行一次,
大约运行几十万次).

vulkan 的着色器被编译成 `SPIR-V` 的二进制格式, 加载到 vulkan 驱动中.
所以可以使用多种 "高级语言" 来编写着色器, 然后把源代码编译成 SPIR-V 格式,
就能使用了.

其中比较常用的着色器编程语言是 `GLSL` (OpenGL Shader Language),
`vulkano` 具有 GLSL 着色器的编译功能, 使用起来比较方便.

----

首先定义一个顶点的数据结构 (rust):

```rust
/// 顶点数据结构
#[derive(Debug, Clone, BufferContents, Vertex)]
#[repr(C)]
pub struct 顶点 {
    /// 位置坐标 (x, y, z)
    #[format(R32G32B32_SFLOAT)]
    p: [f32; 3],
    /// 颜色
    #[format(R32G32B32_SFLOAT)]
    color: [f32; 3],
}

impl 顶点 {
    pub fn new(p: [f32; 3], color: [f32; 3]) -> Self {
        Self { p, color }
    }
}
```

每个顶点具有 2 个数据变量: 位置坐标 (`p`), 颜色 (`color`).
都分别使用 3 个单精度浮点数 (`f32`) 来表示.

文件 `pmse-render/shader/test_v.glsl`:

```glsl
#version 460
// 顶点着色器 (vertex shader)

layout(location = 0) in vec3 p;
layout(location = 1) in vec3 color;

layout(location = 0) out vec3 out_color;

void main() {
  gl_Position = vec4(p, 1.0);
  out_color = color;
}
```

这是顶点着色器的代码 (GLSL), 有 2 输入变量 (`p`, `color`), 和上面对应.
有一个输出变量 `out_color`, 这个会被传递给下面的片段着色器.
`gl_Position` 是一个特殊变量 (GLSL 内置变量), 表示顶点的位置.

此处的顶点着色器代码非常简单, 把位置和颜色原样输出.

文件 `pmse-render/shader/test_f.glsl`:

```glsl
#version 460
// 片段着色器 (fragment shader)

layout(location = 0) in vec3 in_color;

layout(location = 0) out vec4 f_color;

void main() {
  f_color = vec4(in_color, 1.0);
}
```

这是片段着色器的代码 (GLSL), 有一个输入变量 `in_color`, 来自上面的顶点着色器.
有一个输出变量 `f_color`, 表示像素的颜色.

此处的代码也很简单, 把颜色值原样输出.

文件 `pmse-render/src/shader.rs`:

```rust
//! vulkan shader (GLSL)

/// 顶点着色器
pub mod test_v {
    vulkano_shaders::shader! {
        ty: "vertex",
        path: "shader/test_v.glsl",
    }
}

/// 片段着色器
pub mod test_f {
    vulkano_shaders::shader! {
        ty: "fragment",
        path: "shader/test_f.glsl",
    }
}
```

这是使用 `vulkano` 编译着色器的代码.

----

```rust
        let (阶段, 顶点入口) = 加载着色器(h.d())?;
```

其中:

```rust
/// 初始化 (加载/编译) 着色器
fn 加载着色器(
    设备: &Arc<Device>,
) -> Result<([PipelineShaderStageCreateInfo; 2], EntryPoint), Box<dyn Error>> {
    let 顶点着色器 = shader::test_v::load(设备.clone())?;
    let 片段着色器 = shader::test_f::load(设备.clone())?;

    // 着色器 入口函数
    let 顶点入口 = 顶点着色器
        .entry_point("main")
        .ok_or(E("ERROR vulkan shader vs main".into()))?;
    let 片段入口 = 片段着色器
        .entry_point("main")
        .ok_or(E("ERROR vulkan shader fs main".into()))?;

    let 阶段 = [
        PipelineShaderStageCreateInfo::new(顶点入口.clone()),
        PipelineShaderStageCreateInfo::new(片段入口),
    ];

    Ok((阶段, 顶点入口))
}
```

使用这样的代码把着色器代码加载到 vulkan 设备, 然后获取着色器执行入口函数,
指定函数名称 (`main`). 着色器函数名称可以随便, 但是习惯用 `main`.

其中 `阶段` 数据的意思是, 在 vulkan 渲染的过程中, 将使用这两个着色器.

### 3.3 创建渲染过程 (RenderPass, Subpass, PipelineLayout)

在 vulkan 中, 渲染过程 (RenderPass) 描述了如何绘制一帧 (一张图片),
一个渲染过程可能含有多个分过程 (Subpass), 每个分过程都可以使用不同的着色器,
以及输入输出数据.

```rust
        let (渲染过程, 分过程, 布局) = 创建渲染过程(h.d(), &阶段, sc.sc())?;
```

其中:

```rust
/// 创建渲染过程
fn 创建渲染过程(
    设备: &Arc<Device>,
    阶段: &[PipelineShaderStageCreateInfo; 2],
    交换链: &Arc<Swapchain>,
) -> Result<(Arc<RenderPass>, Subpass, Arc<PipelineLayout>), Box<dyn Error>> {
    let 布局 = PipelineLayout::new(
        设备.clone(),
        PipelineDescriptorSetLayoutCreateInfo::from_stages(阶段)
            .into_pipeline_layout_create_info(设备.clone())?,
    )?;
    let 渲染过程 = vulkano::single_pass_renderpass!(
        设备.clone(),
        attachments: {
            color: {
                format: 交换链.image_format(),
                samples: 1,
                load_op: Clear,
                store_op: Store,
            }
        },
        pass: {
            color: [color],
            depth_stencil: {},
        }
    )?;
    let 分过程 = Subpass::from(渲染过程.clone(), 0).unwrap();

    Ok((渲染过程, 分过程, 布局))
}
```

首先, 从上面的着色器 `阶段` (`PipelineShaderStageCreateInfo`)
获取管线的 `布局` (`PipelineLayout`),
然后使用宏 `vulkano::single_pass_renderpass!()` 来创建一个简单的 `渲染过程`
(`RenderPass`), 这个渲染过程只有一个 `分过程` (`Subpass`).

创建时, 需要指定附加数据 (`attachments`) 以及格式,
此处指定了一个附加数据 (`color`), 格式为交换链的格式 (也就是窗口表面的格式).
我们要绘制到这里, 然后通过窗口显示到屏幕上.

不使用深度缓冲区 (以及深度检测) (`depth_stencil`).
`samples: 1` 表示采样数为 1 (也就是不使用 MSAA 等抗锯齿处理).
`load_op: Clear` 表示加载时清除颜色值 (也就是使用设定的背景色).
`store_op: Store` 表示需要保存计算结果.

### 3.4 创建帧缓冲区 (Framebuffer)

帧缓冲区是配合渲染过程使用的, 帧缓冲区包含了渲染过程中使用的输入输出数据.

```rust
        sc.init_framebuffer(&渲染过程)?;
```

其中 (详见 `3.1 创建交换链` 章节):

```rust
/// 创建帧缓冲区
fn 创建帧缓冲区(
    图像: &Vec<Arc<Image>>,
    渲染过程: &Arc<RenderPass>,
) -> Result<Vec<Arc<Framebuffer>>, Box<dyn Error>> {
    let mut o: Vec<Arc<Framebuffer>> = Vec::new();
    for i in 图像 {
        let 视图 = ImageView::new_default(i.clone())?;
        o.push(Framebuffer::new(
            渲染过程.clone(),
            FramebufferCreateInfo {
                attachments: vec![视图],
                ..Default::default()
            },
        )?)
    }
    Ok(o)
}
```

此处创建的帧缓冲区, 包含了来自交换链的图像, 用于绘制之后的显示.
此处的每个帧缓冲区, 只包含了一个图像, 其实也可以同时使用多个图像.

### 3.5 创建图形管线 (GraphicsPipeline)

```rust
        let 视口 = Viewport {
            offset: [0.0, 0.0],
            extent: [size.0 as f32, size.1 as f32],
            depth_range: 0.0..=1.0,
        };
        let 管线 = 创建图形管线(h.d(), 顶点入口, 阶段, 视口, 分过程, 布局)?;
```

其中:

```rust
/// 创建图形渲染管线
fn 创建图形管线(
    设备: &Arc<Device>,
    顶点入口: EntryPoint,
    阶段: [PipelineShaderStageCreateInfo; 2],
    视口: Viewport,
    分过程: Subpass,
    布局: Arc<PipelineLayout>,
) -> Result<Arc<GraphicsPipeline>, Box<dyn Error>> {
    let 顶点输入状态 = 顶点::per_vertex().definition(&顶点入口.info().input_interface)?;
    let 管线 = GraphicsPipeline::new(
        设备.clone(),
        None,
        GraphicsPipelineCreateInfo {
            stages: 阶段.into_iter().collect(),
            vertex_input_state: Some(顶点输入状态),
            input_assembly_state: Some(InputAssemblyState::default()),
            viewport_state: Some(ViewportState {
                viewports: [视口].into_iter().collect(),
                ..Default::default()
            }),
            rasterization_state: Some(RasterizationState::default()),
            multisample_state: Some(MultisampleState::default()),
            color_blend_state: Some(ColorBlendState::with_attachment_states(
                分过程.num_color_attachments(),
                ColorBlendAttachmentState::default(),
            )),
            subpass: Some(分过程.into()),
            ..GraphicsPipelineCreateInfo::layout(布局)
        },
    )?;
    Ok(管线)
}
```

在此处创建图形管线 (`GraphicsPipeline`), 可以看到, 需要指定一大堆参数.
限于篇幅, 就不一一详细解释了.
其中 `视口` (`Viewport`) 就是屏幕显示的矩形区域 (也就是 vulkan 绘制区域),
需要指定宽高.

这里突出了 vulkan 的一个特点 (优点), 那就是可以配置的参数非常多,
所以应用软件可以做的优化也比较多.

### 3.6 创建命令缓冲区 (StandardCommandBufferAllocator, Subbuffer, PrimaryAutoCommandBuffer)

```rust
        let ca = 创建命令缓冲分配器(h.d());
        let 顶点数据 = 创建顶点缓冲区(h.ma())?;

        let mut 命令: Vec<Arc<PrimaryAutoCommandBuffer>> = Vec::new();
        for i in sc.framebuffer() {
            命令.push(创建命令缓冲区(&ca, h.q(), &管线, i, &顶点数据)?);
        }
```

上面做了那么多初始化工作, 现在终于可以下达绘制命令了.
vulkan 的命令放在 **命令缓冲区** 中, 然后再批量发送给 GPU 执行, 这样可以提高效率.

文件 `pmse-render/src/util.rs`:

```rust
//! 工具函数
use std::error::Error;
use std::sync::Arc;

use vulkano::{
    command_buffer::{
        allocator::{StandardCommandBufferAllocator, StandardCommandBufferAllocatorCreateInfo},
        PrimaryAutoCommandBuffer,
    },
    device::{Device, Queue},
    swapchain::{self, Swapchain, SwapchainPresentInfo},
    sync::{self, GpuFuture},
    Validated, VulkanError,
};

use crate::E;

/// 创建 命令缓冲区 分配器
pub fn 创建命令缓冲分配器(设备: &Arc<Device>) -> StandardCommandBufferAllocator {
    StandardCommandBufferAllocator::new(
        设备.clone(),
        StandardCommandBufferAllocatorCreateInfo::default(),
    )
}
```

命令缓冲区分配器类似于前面说的内存分配器, 只不过前面的用于分配数据资源的内存,
此处的用于分配命令缓冲区.

----

```rust
/// 创建 顶点数据缓冲区 (三角形)
fn 创建顶点缓冲区(
    ma: &Arc<StandardMemoryAllocator>,
) -> Result<Subbuffer<[顶点]>, Box<dyn Error>> {
    Ok(Buffer::from_iter(
        ma.clone(),
        BufferCreateInfo {
            usage: BufferUsage::VERTEX_BUFFER,
            ..Default::default()
        },
        AllocationCreateInfo {
            memory_type_filter: MemoryTypeFilter::PREFER_DEVICE
                | MemoryTypeFilter::HOST_SEQUENTIAL_WRITE,
            ..Default::default()
        },
        vec![
            顶点::new([0.1, 0.8, 0.0], [1.0, 0.0, 0.0]),
            顶点::new([-0.8, -0.6, 0.0], [0.0, 1.0, 0.0]),
            顶点::new([0.9, -0.9, 0.0], [0.0, 0.0, 1.0]),
        ],
    )?)
}
```

此处创建一个数据缓冲区 (`Subbuffer`), 存放三角形的顶点数据.
除了顶点数据本身, 还要指定数据的用法, 方便 vulkan 驱动进行优化.

`BufferUsage::VERTEX_BUFFER` 表示这个缓冲区用来存储顶点数据.
`MemoryTypeFilter::PREFER_DEVICE` 表示优先使用设备内存 (也就是显卡的显存).
`MemoryTypeFilter::HOST_SEQUENTIAL_WRITE` 表示主机 (CPU) 需要顺序写入,
也就是用来加载数据到显卡的显存.

----

```rust
/// 创建 命令缓冲区
fn 创建命令缓冲区(
    ca: &StandardCommandBufferAllocator,
    队列: &Arc<Queue>,
    图形管线: &Arc<GraphicsPipeline>,
    帧缓冲区: &Arc<Framebuffer>,
    顶点缓冲区: &Subbuffer<[顶点]>,
) -> Result<Arc<PrimaryAutoCommandBuffer>, Box<dyn Error>> {
    let mut b = AutoCommandBufferBuilder::primary(
        ca,
        队列.queue_family_index(),
        CommandBufferUsage::MultipleSubmit,
    )?;
    // 渲染命令
    b.begin_render_pass(
        RenderPassBeginInfo {
            clear_values: vec![Some([0.0, 0.0, 0.0, 1.0].into())],
            ..RenderPassBeginInfo::framebuffer(帧缓冲区.clone())
        },
        SubpassBeginInfo {
            contents: SubpassContents::Inline,
            ..Default::default()
        },
    )?
    .bind_pipeline_graphics(图形管线.clone())?
    .bind_vertex_buffers(0, 顶点缓冲区.clone())?
    .draw(顶点缓冲区.len() as u32, 1, 0, 0)?
    .end_render_pass(SubpassEndInfo::default())?;

    Ok(b.build()?)
}
```

此处使用 `AutoCommandBufferBuilder` 录制命令.
首先使用 `begin_render_pass()` 开始渲染过程, 指定清除颜色 (背景颜色),
使用的帧缓冲区. 然后绑定图形管线 (`bind_pipeline_graphics`),
指定顶点数据 (`bind_vertex_buffers`), 下达绘制命令 (`draw`),
最后结束渲染过程 (`end_render_pass`).

### 3.7 执行命令 (绘制)

一切准备完毕, 终于可以执行绘制命令了.

```rust
    /// vulkan 绘制 测试
    pub fn draw(&self) -> Result<(), Box<dyn Error>> {
        // debug
        println!("vulkan_test");
        交换链执行(self.h.d(), self.h.q(), &self.命令, self.sc.sc())?;
        Ok(())
    }
```

其中:

```rust
/// 从交换链获取一个图像, 绘制
pub fn 交换链执行(
    设备: &Arc<Device>,
    队列: &Arc<Queue>,
    命令: &Vec<Arc<PrimaryAutoCommandBuffer>>,
    交换链: &Arc<Swapchain>,
) -> Result<(), Box<dyn Error>> {
    // 从交换链获取下一个图像
    let (序号, _退化, 获取未来) =
        match swapchain::acquire_next_image(交换链.clone(), None).map_err(Validated::unwrap) {
            Ok(r) => r,
            Err(VulkanError::OutOfDate) => {
                // TODO 重新创建交换链
                println!("ERROR swapchain acquire OutOfDate");
                return Err(Box::new(E("vulkan OutOfDate".into())));
            }
            Err(e) => {
                // TODO unknown error
                println!("ERROR swapchain acquire {}", e);
                return Err(Box::new(E("unknown error".into())));
            }
        };
    // 绘制
    let 执行 = sync::now(设备.clone())
        .join(获取未来)
        .then_execute(队列.clone(), 命令[序号 as usize].clone())?
        .then_swapchain_present(
            队列.clone(),
            SwapchainPresentInfo::swapchain_image_index(交换链.clone(), 序号),
        )
        .then_signal_fence_and_flush();
    // 错误处理
    match 执行.map_err(Validated::unwrap) {
        Ok(f) => {
            f.wait(None)?;
        }
        Err(e) => {
            // TODO unknown error
            println!("ERROR flush {}", e);
        }
    }
    Ok(())
}
```

首先, 从交换链获取一个空闲的图像 (`swapchain::acquire_next_image`), 用于绘制.
然后等待 (`join`), 提交命令缓冲区 (执行命令) (`then_execute`),
交换链显示绘制的结果 (`then_swapchain_present`),
同步 GPU (`then_signal_fence_and_flush`).

这段代码写的很粗糙, 只是勉强能用, 很多地方 (错误处理) 不完善.
有时候, 比如窗口大小改变等, 会导致当前的交换链失效, 需要重新创建交换链,
这段代码没有处理这种情况.

### 3.8 运行测试

使用 cargo 编译项目:

```sh
cargo build -p pmse
```

运行:

```sh
> ./pmse
init vulkan .. .
pmse_gtk_main: (1280, 720, 62, 56) (44, 8, 8, 8) w = 1296, h = 772 (70, 100)
gtk4 backend = Wayland
  WaylandDisplay { inner: TypedObjectRef { inner: 0x55c698face70, type: GdkWaylandDisplay } }
  Connection { backend: Backend { backend: InnerBackend { inner: Inner { state: Mutex { data: ConnectionState { display: 0x55c698fa62c0, owns_display: false, evq: 0x55c699008960, display_id: ObjectId(wl_display@1), last_error: None, known_proxies: {} }, poisoned: false, .. }, dispatch_lock: Mutex { data: Dispatcher, poisoned: false, .. }, debug: false } } } }
  WaylandSurface { inner: TypedObjectRef { inner: 0x55c69901d260, type: GdkWaylandToplevel } }
wayland queue run
wayland gtk4 read
wayland registry global:
  WlCompositor { id: ObjectId(wl_compositor@52), version: 6, data: Some(ObjectData { .. }), backend: WeakBackend { inner: WeakInnerBackend { inner: (Weak) } } }
  WlSubcompositor { id: ObjectId(wl_subcompositor@47), version: 1, data: Some(ObjectData { .. }), backend: WeakBackend { inner: WeakInnerBackend { inner: (Weak) } } }
create subsurface (70, 100)
  Intel(R) HD Graphics 520 (SKL GT2)
vulkan device queue 1
vulkan queue index 0
  image format: R16G16B16A16_SFLOAT
  min_image_count 4
vulkan_test
```

![vulkan 绘制测试](./图/3-t-1.png)

然后我们就成功画出了一个三角形, 撒花 ~

咦 ? 上面的顶点数据中, 只是指定了 3 个顶点的颜色,
为什么会画出来一个彩色的三角形呢 ?

嗯, 这是因为, 从顶点着色器传递到片段着色器的数据, 会进行 **插值** 处理,
所以顶点着色器输出的是单个顶点的颜色, 但是片段着色器接收到的,
就是经过插值之后的渐变颜色啦.


## 4 总结与展望

本文已经很长了, 所以总结就简单点吧.
本文通过绘制一个三角形, 介绍了 vulkan 的初始化和简单使用.
可以看到, 由于 vulkan 更加接近底层硬件, 初始化过程是比较麻烦的.

本文使用的系统软件环境: ArchLinux (GNOME).
本文相关的完整源代码请见: <https://crates.io/crates/pmse-render>

vulkan 本身具有很好的跨平台能力, 后续考虑别的平台的 vulkan 初始化,
真正做到 "跨平台".

----

本文使用 CC-BY-SA 4.0 许可发布.
