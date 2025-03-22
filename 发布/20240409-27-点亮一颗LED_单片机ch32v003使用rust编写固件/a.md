# 点亮一颗 LED: 单片机 ch32v003 (RISC-V) 使用 rust 编写固件

使用 rust 编写单片机的程序 ? 很新, 但没问题.
使用 RISC-V CPU 的单片机 (比如 ch32v003) ? 也没问题.
同时使用 ? 哦嚯, 问题出现了 !!

ch32v003 是一款使用 rv32ec 指令集的国产单片机,
很便宜 (某宝零卖只要 0.4 元一个, 在同档次几乎是无敌的存在).

主要困难在于 `rv32ec` 其中的 `e`.
rust 编译器使用 LLVM 作为后端 (机器代码生成), 很早就对 rv32i 提供了支持.
但是 LLVM 对 rv32e 的支持一直有问题, 相关支持补丁最近才刚刚合并.

本文主要参考以下资料:

+ <https://noxim.xyz/blog/rust-ch32v003/>
+ <https://github.com/ch32-rs/ch32v00x-hal>

在此感谢 Noxim 这位大神在使用 rust 编写 rv32ec
单片机程序方面的先驱探索和贡献 !


## 目录

+ 1 单片机 (MCU) ch32v003 简介

+ 2 rust 编译工具 (rv32ec)

+ 3 创建 rust 项目

+ 4 点亮一颗 LED

+ 5 总结与展望


## 1 单片机 (MCU) ch32v003 简介

相关链接: <https://www.wch.cn/products/CH32V003.html>

单片机 (也叫 MCU, 微控制器) 是低成本嵌入式系统的核心部件,
在单个芯片上集成了一整台计算机 (包括 CPU, RAM, flash, 输入输出设备
(GPIO, UART, I2C, SPI, ADC, DAC, OPA, USB) 等),
体积小, 功耗低, 使用方便, 只需要搭配很少的外围器件即可运行.

ch32v003 是国产芯片, 是南京沁恒微电子股份有限公司 (WCH) 推出的一款
32 位通用 RISC-V CPU 的单片机.

为什么选择 ch32v003 ? 国产, RISC-V, 便宜 !

RISC-V 是一种很年轻的开源指令集架构 (ISA), 最近几年火的不得了,
未来很有可能与 x86, ARM 形成三足鼎立之势.
因为 RISC-V 是开源的, 任何人都能基于 RISC-V 指令集来设计处理器,
比如 ch32v003 单片机使用沁恒自研的青稞 V2A CPU 核心,
没有授权费用, 在成本上具有明显优势.
目前 RISC-V 还正在努力的进入服务器, 个人计算设备 (比如手机)
等高性能计算领域.
但是 RISC-V 在嵌入式 (单片机) 领域已经广泛使用了, 有百亿颗芯片的出货量.

RISC-V 指令集是模块化设计, 分为基础指令集和许多的功能扩展指令集.
RISC-V 基础指令集非常简单 (只有约 40 条指令),
分为 rv32i (用于 32 位处理器), rv64i (用于 64 位处理器),
以及 rv32e (用于 32 位嵌入式处理器).

其中 rv32i 和 rv32e 的区别是, rv32i 具有 32 个通用寄存器,
rv32e 只有 16 个通用寄存器 (少了一半).
对于低成本处理器 (比如单片机) 来说, 减少这些寄存器,
可以显著减少门电路数量, 缩小芯片面积, 从而大幅度降低成本.

ch32v003 单片机使用 rv32ec 指令集, 其中 `rv32e` 就是上面说的,
`c` 表示压缩指令集扩展, 可以提高代码密度 (同样的程序减少占用的存储空间).
RISC-V 非压缩指令 (正常指令) 的每条指令占用 4 字节存储空间,
压缩指令一条只需要 2 字节.

![ch32v003 功能框图](./图/1-m-1.png)

(图片来源: wch 官网)

![ch32v003 封装型号](./图/1-m-2.jpg)

ch32v003 单片机具有一个最高 48MHz 主频的 rv32ec 指令集 CPU 核心,
2KB SRAM (存储运行数据), 16KB flash (存储程序代码), 5 个定时器 (timer).
输入输出接口有: 最多 18 个通用输入输出 (GPIO), 1 个 UART, 1 个 I2C,
1 个 SPI, 8 通道 10 位精度的模拟数字转换器 (ADC), 1 个运算放大器 (OPA,
相当于买运放赠送单片机 ~ ).
有 4 种封装可选.

其中窝比较喜欢的是 TSSOP20 封装 (型号 ch32v003f4p6),
引脚比较多有 20 个 (其中 2 个用于供电, 18 个用于输入输出), 焊接也比较方便.

窝觉得, ch32v003 单片机的主要缺点是 flash 容量较小, 只有 16KB.
如果出个 32KB 的型号就更好了.

----

本文用到的硬件设备有:

![ch32v003 开发板](./图/1-m-3.png)

ch32v003 单片机开发板 (CH32V003F4P6-R0-1v1).

![WCH-LINKE](./图/1-m-4.png)

单片机调试和固件写入工具 (WCH-LinkE-R0-1v3).

以及一台 x86 PC (笔记本或台式机), 几条杜邦线.


## 2 rust 编译工具 (rv32ec)

为什么选择 rust 来编写单片机程序 ?
就俩字, 舒服 !
再也不想使用古老的 C 语言了呜呜 ~~

----

本文使用的计算机软件环境如下:

+ 操作系统: ArchLinux

建议通过 `rustup` 来安装 rust 编译工具: <https://www.rust-lang.org/zh-CN/learn/get-started>

建议使用国内镜像进行加速: <https://rsproxy.cn/>

+ (1) 安装 nightly 版的 rust 编译器:

  ```sh
  rustup toolchain install nightly
  ```

+ (2) 安装 `rust-src` 组件:

  ```sh
  rustup component add rust-src --toolchain nightly-x86_64-unknown-linux-gnu
  ```

+ (3) 安装之后:

  ```sh
  > rustup toolchain list
  stable-x86_64-unknown-linux-gnu (default)
  nightly-x86_64-unknown-linux-gnu
  ```

+ 编译器版本:

  ```sh
  > rustc +nightly --version --verbose
  rustc 1.79.0-nightly (9d5cdf75a 2024-04-07)
  binary: rustc
  commit-hash: 9d5cdf75aa42faaf0b58ba21a510117e8d0051a3
  commit-date: 2024-04-07
  host: x86_64-unknown-linux-gnu
  release: 1.79.0-nightly
  LLVM version: 18.1.3
  ```

  ```sh
  > rustc --version --verbose
  rustc 1.77.1 (7cf61ebde 2024-03-27)
  binary: rustc
  commit-hash: 7cf61ebde7b22796c69757901dd346d0fe70bd97
  commit-date: 2024-03-27
  host: x86_64-unknown-linux-gnu
  release: 1.77.1
  LLVM version: 17.0.6
  ```

----

相关背景故事 (历史):

这件事其实去年就已经可以做到了 (Noxim 大神的博客发布日期是 `2023-03-26`).

但是之前 rust 编译器对 `rv32e` 没有支持 (本质上是因为 LLVM 不支持),
所以 Noxim 大神只好自己魔改了 rustc:

+ <https://github.com/Noxime/rust/tree/rv32e>
+ <https://github.com/Noxime/llvm-project/tree/rv32e>

所以当时是很麻烦的: 首先下载大神修改后的代码, 然后编译 rust 编译器,
然后再使用编译好的 rust 编译器来编译自己的单片机程序 .. .

直到最近 LLVM 才添加了对 `rv32e` 的实验性支持:

+ LLVM 18.1.0 Released!
  <https://discourse.llvm.org/t/llvm-18-1-0-released/77448>
  (发布日期 `2024-03-06`)

其中 [LLVM 18.1.0rc Release Notes](https://releases.llvm.org/18.1.0/docs/ReleaseNotes.html#changes-to-the-risc-v-backend)
有:

> Changes to the RISC-V Backend
>
> + CodeGen of RV32E/RV64E was supported experimentally.
> + CodeGen of ilp32e/lp64e was supported experimentally.

也就是说, 直到 LLVM 18.1.0 才支持.

目前 rust 稳定版 (rustc 1.77.1) 对应的 LLVM 版本是 `17.0.6`,
nightly 对应的 LLVM 版本是 `18.1.3`.


## 3 创建 rust 项目

+ (1) 使用 cargo 创建项目:

  ```sh
  > cargo new --bin t4
      Created binary (application) `t4` package
  ```

  项目名称随意, 此处以 `t4` 举栗.

+ (2) 完整源代码:

文件 `t4/Cargo.toml`:

```toml
[package]
name = "t4"
version = "0.1.0"
edition = "2021"

[dependencies]
panic-halt = "^0.2.0"
riscv = "^0.11.1"
ch32v0 = { version = "^0.2.0", features = ["rt", "ch32v003"] }
qingke-rt = "^0.1.9"
qingke = "^0.1.9"

[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
debug = true

# 不应使用 dev 编译 (代码太大), 应该始终使用 --release
[profile.dev]
opt-level = "z"
```

由于单片机的 flash 容量较小, 编译时应该尽量减小生成代码的大小.
此处 `[profile.release]` 相关的编译选项就是为了这个目的.

文件 `t4/.cargo/config.toml`:

```toml
# ch32v003 (rv32ec)
[build]
target = "riscv32ec-unknown-none-elf.json"

[unstable]
build-std = ["core"]
build-std-features = ["compiler-builtins-mem"]

[target.riscv32ec-unknown-none-elf]
rustflags = [
  "-C", "link-arg=-Tlink.x",
]
```

cargo 相关的编译配置.

文件 `t4/riscv32ec-unknown-none-elf.json`:

```json
{
  "arch": "riscv32",
  "atomic-cas": false,
  "cpu": "generic-rv32",
  "crt-objects-fallback": "false",
  "data-layout": "e-m:e-p:32:32-i64:64-n32-S32",
  "eh-frame-header": false,
  "emit-debug-gdb-scripts": false,
  "features": "+e,+c,+forced-atomics",
  "linker": "rust-lld",
  "linker-flavor": "gnu-lld",
  "llvm-target": "riscv32",
  "llvm-abiname": "ilp32e",
  "max-atomic-width": 32,
  "panic-strategy": "abort",
  "relocation-model": "static",
  "target-pointer-width": "32"
}
```

rustc 目前还没有内置 `riscv32ec` 编译目标, 所以需要自定义.

文件 `t4/build.rs`:

```rust
use std::path::PathBuf;
use std::{env, fs};

fn main() {
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=ch32v003/memory.x");

    let out_dir = PathBuf::from(env::var("OUT_DIR").unwrap());

    fs::write(
        out_dir.join("memory.x"),
        include_bytes!("ch32v003/memory.x"),
    )
    .unwrap();
    println!("cargo:rustc-link-search={}", out_dir.display());
}
```

编译脚本, 主要作用是指定 `memory.x` 链接脚本.

文件 `t4/ch32v003/memory.x`:

```x
PROVIDE(_hart_stack_size = 64);

MEMORY
{
	FLASH (rx) : ORIGIN = 0x00000000, LENGTH = 16K
	RAM (xrw)  : ORIGIN = 0x20000000, LENGTH = 2K
}

REGION_ALIAS("REGION_TEXT", FLASH);
REGION_ALIAS("REGION_RODATA", FLASH);
REGION_ALIAS("REGION_DATA", RAM);
REGION_ALIAS("REGION_BSS", RAM);
REGION_ALIAS("REGION_HEAP", RAM);
REGION_ALIAS("REGION_STACK", RAM);
```

这个链接脚本定义了 ch32v003 单片机的内存地址布局.

文件 `t4/src/main.rs`:

```rust
#![no_std]
#![no_main]

use panic_halt as _;
use qingke::riscv::asm;
use qingke_rt::entry;

use ch32v0::ch32v003::Peripherals as P;

#[entry]
fn main() -> ! {
    let p = unsafe { P::steal() };
    // 初始化配置外设

    // 启用 GPIOC
    p.RCC.apb2pcenr().modify(|_, w| w.iopcen().set_bit());
    // 配置 PC1 引脚 (推挽输出 10MHz)
    p.GPIOC
        .cfglr()
        .modify(|_, w| w.mode1().variant(0b01).cnf1().variant(0b00));

    // 主循环
    loop {
        // 点亮 LED (PC1)
        p.GPIOC.outdr().modify(|_, w| w.odr1().clear_bit());

        // 延时等待
        asm::delay(1_000_000);

        // 关闭 LED (PC1)
        p.GPIOC.outdr().modify(|_, w| w.odr1().set_bit());

        // 延时等待
        asm::delay(500_000);
    }
}
```

终于到了单片机程序代码.
首先, 通过写入配置寄存器, 对各种需要用到的外设进行初始化配置.
此处只启用了 GPIOC 和 PC1 引脚.
然后进入无限循环, 控制 PC1 引脚输出高低电平, 使 LED 闪烁.

----

+ (3) 编译项目:

  ```sh
  > cargo +nightly build --release

      Finished `release` profile [optimized + debuginfo] target(s) in 14.78s
  ```

+ (4) 将编译结果 ELF 文件转换为 Intel HEX 文件:

  ```sh
  > cd target/riscv32ec-unknown-none-elf/release
  > llvm-objcopy -O ihex t4 out.hex
  ```

  编译输出目录的文件:

  ```sh
  > ls -l
  总计 68
  drwxr-xr-x 1 s2 s2   290  4月 8日 18:53 build/
  drwxr-xr-x 1 s2 s2  3318  4月 8日 19:07 deps/
  drwxr-xr-x 1 s2 s2     0  4月 8日 18:53 examples/
  drwxr-xr-x 1 s2 s2     0  4月 8日 18:53 incremental/
  -rwxr-xr-x 1 s2 s2  1425  4月 8日 19:09 out.hex*
  -rwxr-xr-x 2 s2 s2 60932  4月 8日 19:07 t4*
  -rw-r--r-- 1 s2 s2   697  4月 8日 18:53 t4.d
  ```


## 4 点亮一颗 LED

+ (1) 安装 wlink 刷写工具: <https://github.com/ch32-rs/wlink>

  这个是第三方开发的开源的刷写工具, 在 GNU/Linux 系统上使用比较方便.
  当然使用 WCH 官方提供的刷写工具也可以.

  版本信息:

  ```sh
  > type wlink
  wlink is /home/s2/.cargo/bin/wlink
  > wlink --version
  wlink 0.0.9
  ```

+ (2) 使用 WCH-LINKE 连接 ch32v003 单片机.

  按照下表接线:

| 序号 | WCH-LINKE 针脚 | ch32v003 引脚 |
| :--: | :------------- | :------------ |
|  1   | GND            | GND           |
|  2   | 3V3            | VCC           |
|  3   | SWDIO          | PD1           |

  如图:

  ![接线图](./图/4-t-1.png)

  WCH-LINKE 通过 USB 连接 PC.

+ (3) 查看连接的芯片信息:

  ```sh
  > lsusb

  Bus 001 Device 024: ID 1a86:8010 QinHeng Electronics WCH-Link
  ```

  ```sh
  > wlink status
  11:19:29 [INFO] Connected to WCH-Link v2.9(v29) (WCH-LinkE-CH32V305)
  11:19:29 [INFO] Attached chip: CH32V003 [CH32V003F4P6] (ChipID: 0x00300500)
  11:19:29 [INFO] Chip ESIG: FlashSize(16KB) UID(cd-ab-84-aa-49-bc-9a-12)
  11:19:29 [INFO] Flash protected: false
  11:19:29 [INFO] RISC-V ISA(misa): Some("RV32CEX")
  11:19:29 [INFO] RISC-V arch(marchid): Some("WCH-V2A")
  11:19:29 [WARN] The halt status may be incorrect because detaching might resume the MCU
  11:19:29 [INFO] Dmstatus {
      .0: 0x4c0382,
      allhavereset: true,
      anyhavereset: true,
      allresumeack: false,
      anyresumeack: false,
      allunavail: false,
      anyunavail: false,
      allrunning: false,
      anyrunning: false,
      allhalted: true,
      anyhalted: true,
      authenticated: true,
      version: 0x2,
  }
  11:19:29 [INFO] Dmcontrol {
      .0: 0x80000001,
      haltreq: true,
      resumereq: false,
      ackhavereset: false,
      ndmreset: false,
      dmactive: true,
  }
  11:19:29 [INFO] Hartinfo {
      .0: 0x2120f4,
      nscratch: 0x2,
      dataaccess: true,
      datasize: 0x2,
      dataaddr: 0xf4,
  }
  11:19:29 [INFO] Abstractcs {
      .0: 0x8000002,
      progbufsize: 0x8,
      busy: false,
      cmderr: 0x0,
      datacount: 0x2,
  }
  11:19:29 [INFO] haltsum0: 0x1
  ```

+ (4) 将编译好的固件写入单片机的 flash 存储器 (也叫 "烧录"):

  ```sh
  > wlink flash out.hex
  11:25:42 [INFO] Connected to WCH-Link v2.9(v29) (WCH-LinkE-CH32V305)
  11:25:42 [INFO] Attached chip: CH32V003 [CH32V003F4P6] (ChipID: 0x00300500)
  11:25:42 [INFO] Chip ESIG: FlashSize(16KB) UID(cd-ab-84-aa-49-bc-9a-12)
  11:25:42 [INFO] Flash protected: false
  11:25:42 [INFO] Read out.hex as IntelHex format
  11:25:42 [INFO] Flashing 500 bytes to 0x08000000
  11:25:42 [INFO] Read protected: false
  ██████████████████████████████████ 500/500
  11:25:42 [INFO] Flash done
  11:25:43 [INFO] Now reset...
  ```

  这个单片机程序比较简单, 所以大小只有几百字节.

----

然后就能看到 LED 闪烁啦 ~

![LED 闪烁](./图/4-t-2.gif)


## 5 总结与展望

在计算机领域, 学习最大的困难是什么 ? 搭建开发环境 !!!

如何让整个系统跑起来, 让一代又一代的人头疼.
所以, 要先从最简单的做起, 先实现一个能运行的最小系统.
比如在学习编程语言的时候, 国际惯例就是先写一个 "Hello world" 并运行.

那么对应于嵌入式 (单片机) 领域, 当然是点亮一颗 LED !
这个已经做到了, 然后就可以起飞啦 .. .
(此处缺一个表情包)

对 rv32ec 的初步支持还没有进入 rust 稳定版 (目前是 rustc 1.77,
要等到下个版本才有), 所以本文的内容还算比较新鲜热乎.
目前 rust 对 rv32ec 的支持还不是很好, 比如 rv32ec 编译目标还没有内置.
所以可以看到, 在本文中编译一个单片机程序还是比较麻烦的.
但是以后相关工具的支持会越来越好的, 开发也会越来越容易的.

还有一个 rust 编写的嵌入式 (单片机) 开发框架 Embassy:
<https://embassy.dev/>

Embassy 使用异步编程 (async), 并且有硬件抽象层 (HAL) 和设备驱动程序,
可以作为传统实时操作系统 (RTOS) 的一种替代方案.
使用 Embassy 和 rust 编写单片机程序会舒适很多,
期待这个年轻框架发展的越来越好.

----

本文使用 CC-BY-SA 4.0 许可发布.
