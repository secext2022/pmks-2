# LLVM IR 入门: 使用 LLVM 编译到 WebAssembly

LLVM 是一个强大的开源编译器基础设施, 或者说是一个通用的优化器和编译器后端.
有很多编程语言, 比如 rust, 编译器把高级语言源代码编译为 LLVM IR,
然后再通过 LLVM 编译成 CPU 可执行的二进制代码.

所以, 学习 LLVM, 特别是 LLVM IR (中间表示), 是学习编译器工作原理的重要内容.

WebAssembly 作为一种二进制格式, 可以方便的在浏览器中运行,
也可以在很多 js 环境 (v8, 比如 deno, node.js) 运行.
编译到 WebAssembly 降低了整体的难度, 因为不需要直接和操作系统交互.

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 87 号作品. )

----

相关文章:

+ 《小水滴系列文章目录 (整理)》

  TODO

+ 《流浪 Linux: 外置 USB SSD 安装 ArchLinux》

  TODO

+ 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》

  TODO

参考资料:

+ <https://mcyoung.xyz/2023/08/01/llvm-ir/>
+ <https://mapping-high-level-constructs-to-llvm-ir.readthedocs.io/en/latest/>
+ <https://llvm.org/docs/LangRef.html>
+ <https://developer.mozilla.org/en-US/docs/WebAssembly>
+ <https://webassembly.github.io/spec/core/syntax/types.html>
+ <https://www.compilersutra.com/docs/llvm/llvm_ir/intro_to_llvm_ir/>
+ <https://linuxcommandlibrary.com/man/llc>
+ <https://andrewsweeney.net/post/llvm-to-wasm/>
+ <https://deno.com/>
+ <https://clang.llvm.org/docs/AttributeReference.html#export-name-funcref>


## 目录

+ 1 安装软件

+ 2 编写 LLVM IR (`.ll`)

+ 3 编译到 WebAssembly

+ 4 测试运行

+ 5 总结与展望

+ 附录 1 使用 clang 生成 LLVM IR


## 1 安装软件

首先, 安装 llvm, clang 等软件, 此处以 ArchLinux 操作系统举栗:

```sh
sudo pacman -S llvm clang wabt
```

验证安装:

```sh
> llc --version
LLVM (http://llvm.org/):
  LLVM version 21.1.8
  Optimized build.
  Default target: x86_64-pc-linux-gnu
  Host CPU: znver3

  Registered Targets:
    aarch64     - AArch64 (little endian)
    aarch64_32  - AArch64 (little endian ILP32)
    aarch64_be  - AArch64 (big endian)
    amdgcn      - AMD GCN GPUs
    arm         - ARM
    arm64       - ARM64 (little endian)
    arm64_32    - ARM64 (little endian ILP32)
    armeb       - ARM (big endian)
    avr         - Atmel AVR Microcontroller
    bpf         - BPF (host endian)
    bpfeb       - BPF (big endian)
    bpfel       - BPF (little endian)
    hexagon     - Hexagon
    lanai       - Lanai
    loongarch32 - 32-bit LoongArch
    loongarch64 - 64-bit LoongArch
    mips        - MIPS (32-bit big endian)
    mips64      - MIPS (64-bit big endian)
    mips64el    - MIPS (64-bit little endian)
    mipsel      - MIPS (32-bit little endian)
    msp430      - MSP430 [experimental]
    nvptx       - NVIDIA PTX 32-bit
    nvptx64     - NVIDIA PTX 64-bit
    ppc32       - PowerPC 32
    ppc32le     - PowerPC 32 LE
    ppc64       - PowerPC 64
    ppc64le     - PowerPC 64 LE
    r600        - AMD GPUs HD2XXX-HD6XXX
    riscv32     - 32-bit RISC-V
    riscv64     - 64-bit RISC-V
    sparc       - Sparc
    sparcel     - Sparc LE
    sparcv9     - Sparc V9
    spirv       - SPIR-V Logical
    spirv32     - SPIR-V 32-bit
    spirv64     - SPIR-V 64-bit
    systemz     - SystemZ
    thumb       - Thumb
    thumbeb     - Thumb (big endian)
    ve          - VE
    wasm32      - WebAssembly 32-bit
    wasm64      - WebAssembly 64-bit
    x86         - 32-bit X86: Pentium-Pro and above
    x86-64      - 64-bit X86: EM64T and AMD64
    xcore       - XCore
> clang --version
clang version 21.1.8
Target: x86_64-pc-linux-gnu
Thread model: posix
InstalledDir: /usr/bin
```


## 2 编写 LLVM IR (.ll)

**LLVM IR** (中间表示) 可以看成是一种虚拟的高级 **汇编** 语言,
在这里有 **无限多** 个虚拟 CPU 寄存器.
关于 LLVM IR 的具体语法, 上面 "参考资料" 处已经给出了学习资料.

下面写一个简单的测试程序 `6.ll`:

```ll
; 6.ll
; 这是注释

; 全局静态 (只读) 数据 (常量), 用来存储要输出的字符串
@.str1 = private unnamed_addr constant [8 x i8] c"test 666", align 1

; 声明外部函数 (API)
; 输出一个 i32 整数
declare void @print_i32(i32) nounwind

; 输出 utf8 字符串 (开始地址, 字节长度)
declare void @print_utf8(ptr, i32) nounwind

; 这是一个可以被外部调用的导出函数 (主函数)
define void @main() nounwind #0 {
  ; 输出 整数
  call void @print_i32(i32 233)

  ; 输出 字符串
  call void @print_utf8(ptr @.str1, i32 8)

  ret void
}

; 标记 wasm 导出名称
attributes #0 = { "wasm-export-name"="main" }
```


## 3 编译到 WebAssembly

将上面的 LLVM IR (`6.ll`) 使用 `llc` 编译为 WebAssembly 二进制 (wasm):

```sh
llc 6.ll -mtriple=wasm32 -filetype=obj -O3 -o 6.wasm
```

生成的文件:

```sh
> ls -l 6.wasm
-rw-r--r-- 1 s2 s2 429  2月16日 20:24 6.wasm
```

以文本格式查看编译结果 (WAT):

```sh
> wasm2wat 6.wasm
(module
  (type (;0;) (func))
  (type (;1;) (func (param i32)))
  (type (;2;) (func (param i32 i32)))
  (import "env" "__linear_memory" (memory (;0;) 1))
  (import "env" "print_i32" (func (;0;) (type 1)))
  (import "env" "print_utf8" (func (;1;) (type 2)))
  (func $main (type 0)
    i32.const 233
    call 0
    i32.const 0
    i32.const 8
    call 1)
  (export "main" (func $main))
  (data $.L.str1 (i32.const 0) "test 666"))
```

![wasm](./图/3.png)


## 4 测试运行

我们写一个 Deno (js) 程序, 来加载运行这个 wasm 模块: `test.js`

```js
// test.js
//
// deno run --allow-read test.js 6.wasm

// 命令行参数
const [f_wasm] = Deno.args;

console.log("加载", f_wasm);
// 读取 wasm 二进制
const b = await Deno.readFile(f_wasm);

// 编译 wasm 模块
const m = await WebAssembly.compile(b);

// 生成导入数据
function 导入() {
  // 运行内存
  const __linear_memory = new WebAssembly.Memory({ initial: 1024 });

  // 导入函数
  function print_i32(值) {
    console.log("print_i32", 值);
  }

  function print_utf8(偏移, 长度) {
    // 读取二进制数据
    const b = new Uint8Array(__linear_memory.buffer, 偏移, 长度);

    // 字符串 utf8 解码
    const s = new TextDecoder("utf8").decode(b);

    console.log("print_utf8", s);
  }

  return {
    env: {
      __linear_memory,
      print_i32,
      print_utf8,
    },
  };
}

// 实例化模块
const i = new WebAssembly.Instance(m, 导入());

// 调用导出函数
i.exports.main();
```

运行:

```sh
> deno run --allow-read test.js 6.wasm
加载 6.wasm
print_i32 233
print_utf8 test 666
```

成功 !


## 5 总结与展望

我们初步了解了现代编译器的工作原理: 把源代码编译成 LLVM IR, 然后再通过 LLVM 编译成机器指令.
这样可以方便的支持多种指令集 (ISA) 的 CPU, 比如 x86, arm, risc-v 等.

在本文中, 我们手写了一个简单的 LLVM IR 程序, 通过 LLVM 编译成 WebAssembly, 并成功运行.

把这一套流程跑通之后, 继续深入的学习 LLVM 和编译器, 就更方便了.


## 附录 1 使用 clang 生成 LLVM IR

高级语言 (比如 C) 可以编译到 LLVM IR.
所以学习 LLVM IR 的另一种方式, 就是看成熟的编译器是怎么做的,
比如对照 C 代码和对应生成的 LLVM IR, 了解什么东西会编译成什么.

比如一个简单的程序 `222.c`:

```c
extern void out(const char*, int);

__attribute__((export_name("main"))) int main(int argc, char** argv) {
  out("test 666", 8);
  return 0;
}
```

使用 clang 编译:

```sh
clang 222.c --target=wasm32 -O3 -nostdlib -S -emit-llvm -o 222.ll
```

然后生成的 `222.ll` 文件:

```ll
; ModuleID = '222.c'
source_filename = "222.c"
target datalayout = "e-m:e-p:32:32-p10:8:8-p20:8:8-i64:64-i128:128-n32:64-S128-ni:1:10:20"
target triple = "wasm32"

@.str = private unnamed_addr constant [9 x i8] c"test 666\00", align 1
@llvm.used = appending global [1 x ptr] [ptr @__main_argc_argv], section "llvm.metadata"

; Function Attrs: nounwind
define hidden noundef i32 @__main_argc_argv(i32 %0, ptr readnone captures(none) %1) #0 {
  tail call void @out(ptr noundef nonnull @.str, i32 noundef 8) #2
  ret i32 0
}

declare void @out(ptr noundef, i32 noundef) local_unnamed_addr #1

attributes #0 = { nounwind "no-trapping-math"="true" "stack-protector-buffer-size"="8" "target-cpu"="generic" "target-features"="+bulk-memory,+bulk-memory-opt,+call-indirect-overlong,+multivalue,+mutable-globals,+nontrapping-fptoint,+reference-types,+sign-ext" "wasm-export-name"="main" }
attributes #1 = { "no-trapping-math"="true" "stack-protector-buffer-size"="8" "target-cpu"="generic" "target-features"="+bulk-memory,+bulk-memory-opt,+call-indirect-overlong,+multivalue,+mutable-globals,+nontrapping-fptoint,+reference-types,+sign-ext" }
attributes #2 = { nounwind }

!llvm.module.flags = !{!0}
!llvm.ident = !{!1}

!0 = !{i32 1, !"wchar_size", i32 4}
!1 = !{!"clang version 21.1.8"}
```

----

本文使用 CC-BY-SA 4.0 许可发布.
