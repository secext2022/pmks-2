# 编译 LLVM: 跨平台 npm 二进制包

**国际劳动妇女节** 快乐 !

上文说到, LLVM 是一个强大的开源编译器基础设施 (工具集).
虽然相比别的大型项目 (比如 chromium, v8), LLVM 的编译已经算很简单了, 但是如果想要在多个平台上使用 LLVM (涉及到 交叉编译), 还是比较麻烦的.

虽然官方文档写的比较清晰, 但窝在多平台交叉编译的过程中, 仍然失败了几十次 (报错), 经过反复尝试, 才搞定这个问题. 并且编译 LLVM 比较耗时, 每次编译都要 1 小时以上.

为了方便使用, 最好是直接安装已经编译好的二进制. 那么, 如何发布多平台的二进制包呢 ?

npm 作为具有数百万个软件包的巨大平台, 并没有限制 npm 包里面只能是 js, 完全可以通过 npm 发布二进制包. 这也是 npm 很常见的一种现有的用法, 同时也可以利用 npm 的 CDN 等全套基础设施, 下载速度也很快 ! 在 npm 上发布好二进制包之后, 只需要:

```sh
pnpm install @pm-spl/llvm
```

就可以在多个平台安装并使用相关工具啦 ! 简单方便了很多.

LLVM 是一个巨大的项目, 含有很多组件, 本文抛砖引玉, 只编译其中的 `llc` 和 `lld`.

![(GA)](./图/0-ga.png)

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 88 号作品. )

----

相关文章:

+ 《LLVM IR 入门: 使用 LLVM 编译到 WebAssembly》

  TODO

+ 《小水滴系列文章目录 (整理)》

  TODO

+ 《在 Android 设备上写代码 (Termux, code-server)》

  TODO

+ 《低功耗低成本 PC (可更换内存条) 推荐 (笔记本, 小主机)》

  TODO

参考资料:

+ <https://llvm.org/docs/CMake.html>
+ <https://llvm.org/docs/GettingStarted.html>
+ <https://llvm.org/docs/HowToCrossCompileLLVM.html>
+ <https://cmake.org/cmake/help/book/mastering-cmake/chapter/Cross%20Compiling%20With%20CMake.html>
+ <https://cmake.org/cmake/help/latest/manual/cmake-toolchains.7.html>
+ <https://emscripten.org/docs/getting_started/downloads.html>
+ <https://emscripten.org/docs/compiling/Building-Projects.html>
+ <https://docs.npmjs.com/cli/v11/configuring-npm/package-json>
+ <https://pnpm.io/installation>
+ <https://www.npmjs.com/package/@swc/core>
+ <https://www.npmjs.com/package/@swc/core-linux-x64-gnu>
+ <https://www.npmjs.com/package/@swc/core-linux-x64-musl>
+ <https://www.npmjs.com/package/resolve-pkg>
+ <https://www.npmjs.com/package/@pm-spl/llvm>


## 目录

+ 1 手动编译 LLVM

+ 2 跨平台 npm 二进制包

+ 3 自动编译并发布 npm

+ 4 测试运行

+ 5 总结与展望

+ 附录 1 交叉编译

  - A1.1 linux (x64, arm64, riscv64)
  - A1.2 android-arm64
  - A1.3 wasm (emscripten)
  - A1.4 win32-x64


## 1 手动编译 LLVM

首先, 以 ArchLinux 举栗, 手动体验一下编译 LLVM 的过程.
(别的平台的编译详见附录)

(0) 安装所需软件包:

```sh
sudo pacman -S base-devel git clang llvm cmake ninja
```

(1) 下载 LLVM 的源代码, 比如:

```sh
git clone https://github.com/llvm/llvm-project --branch=llvmorg-22.1.0 --depth=1 --single-branch
```

(2) 创建一个专门用来编译的目录, 并进入:

```sh
mkdir build-linux-x64
cd build-linux-x64
```

----

(3) 使用 cmake 生成 使用 ninja 编译的文件:

```sh
env CC=clang CXX=clang++ cmake -G Ninja -S ../llvm-project/llvm -DCMAKE_BUILD_TYPE=Release -DLLVM_TARGETS_TO_BUILD="AArch64;RISCV;SPIRV;WebAssembly;X86" -DLLVM_ENABLE_PROJECTS=lld -DLLVM_USE_LINKER=lld -DLLVM_ENABLE_LTO=Full
```

这可能是最关键的一步 ! 重要参数解释如下:

+ `CC=clang CXX=clang++`: LLVM 作为一个编译器基础设施, 当然也能编译自己啦 ! ~~ 所以此处使用 LLVM (`clang`) 来编译 LLVM (狗头)

+ `-G Ninja`: cmake 底层支持多种构建系统, 但是 ninja 比较常用, 且默认多线程编译, 速度比较快, 所以此处选用这个.

+ `-S ../llvm-project/llvm`: 此处是刚才下载的 LLVM 源代码目录的路径.

+ `-DCMAKE_BUILD_TYPE=Release`: 表示编译优化版 (运行速度快). 另外还有 `Debug` 版, 运行速度慢, 但方便调试 (这个是开发 LLVM 自身的时候用的, 最终用户一般用不到).

+ `-DLLVM_TARGETS_TO_BUILD="AArch64;RISCV;SPIRV;WebAssembly;X86" -DLLVM_ENABLE_PROJECTS=lld`: 指定编译范围. LLVM 是一个巨大的项目, 含有很多功能和组件. 此处为了缩短编译时间, 减小最终编译出的二进制文件的大小, 只编译了 LLVM 的一部分. 这些选项可以根据自己的需要进行调整.

+ `-DLLVM_USE_LINKER=lld -DLLVM_ENABLE_LTO=Full`: 链接器使用 `lld`, 并启用链接时优化 (`LTO`). 同样的, 这也是使用 LLVM 来编译 LLVM (狗头)

链接器 `lld` 也是 LLVM 项目的一部分, 开启 LTO 编译会更慢, 编译时需要更多内存, 但是编译出的二进制可以获得更多优化.

----

(4) 稍等, cmake 会进行许多检查, 并生成 ninja 所需的文件.

然后就可以调用 ninja 实际开始编译啦:

```sh
cmake --build . --target llc lld
```

同样的, 为了加快编译速度, 此处只编译 `llc` 和 `lld` (而不编译 LLVM 的其余部分).

耐心等待, 编译大约需要 1 小时或更久.

编译结束后, 在 `bin` 目录就能看到编译出来的 `llc` 和 `lld` 啦 ! ~~


## 2 跨平台 npm 二进制包

为了方便, 我们希望, 用户安装二进制包的时候, 不需要手动选择自己是哪个操作系统, 哪种 CPU, 而是可以 **自动** 安装对应的二进制包.

很好, npm 自带这种功能. 比如有一个主包 (入口包), 也就是用户安装时输入的包名.

文件 `npm/llvm/package.json`:

```json
{
  "name": "@pm-spl/llvm",
  "version": "0.1.0",
  "description": "Compiled LLVM binary (llc, lld) for multi-platform",
  "keywords": [
    "llvm",
    "llc",
    "lld",
    "wasm"
  ],
  "dependencies": {
    "resolve-pkg": "^3.0.1"
  },
  "optionalDependencies": {
    "@pm-spl/llc-android-arm64": "0.1.0",
    "@pm-spl/lld-android-arm64": "0.1.0",
    "@pm-spl/llc-linux-arm64-glibc": "0.1.0",
    "@pm-spl/llc-linux-riscv64-glibc": "0.1.0",
    "@pm-spl/llc-linux-x64-glibc": "0.1.0",
    "@pm-spl/lld-linux-arm64-glibc": "0.1.0",
    "@pm-spl/lld-linux-riscv64-glibc": "0.1.0",
    "@pm-spl/lld-linux-x64-glibc": "0.1.0",
    "@pm-spl/llc-win32-x64": "0.1.0",
    "@pm-spl/lld-win32-x64": "0.1.0",
    "@pm-spl/llvm-dll-win32-x64": "0.1.0"
  },
  "devDependencies": {
    "serve": "^14.2.5"
  },

  "files": [
    "bin",
    "example",
    "lib.js"
  ],
  "directories": {
    "bin": "bin"
  },
  "main": "lib.js",

  "repository": {
    "type": "git",
    "url": "git+https://github.com/fm-elpac/llvm-wasm.git",
    "directory": "npm/llvm"
  },
  "bugs": {
    "url": "https://github.com/fm-elpac/llvm-wasm/issues"
  },
  "license": "Apache-2.0",
  "author": "secext2022",

  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "engines": {
    "node": "> 24.0",
    "pnpm": "^10.30.3"
  }
}
```

入口包的名称是 `@pm-spl/llvm`, 然后使用 `optionalDependencies` 定义一堆可选依赖, 比如 `@pm-spl/llc-android-arm64`, `@pm-spl/llc-linux-x64-glibc`, `@pm-spl/lld-linux-arm64-glibc` 等.

然后:

----

文件 `npm/llc-linux-x64-glibc/package.json`:

```json
{
  "name": "@pm-spl/llc-linux-x64-glibc",
  "version": "0.1.0",
  "description": "Compiled LLVM binary (llc) for linux-x64-glibc",
  "keywords": [
    "llvm",
    "llc",
    "linux"
  ],
  "os": ["linux"],
  "cpu": ["x64"],
  "libc": ["glibc"],

  "files": [
    "bin"
  ],
  "directories": {
    "bin": "bin"
  },

  "repository": {
    "type": "git",
    "url": "git+https://github.com/fm-elpac/llvm-wasm.git",
    "directory": "npm/llc-linux-x64-glibc"
  },
  "bugs": {
    "url": "https://github.com/fm-elpac/llvm-wasm/issues"
  },
  "license": "Apache-2.0",
  "author": "secext2022",

  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "engines": {
    "node": "> 24.0",
    "pnpm": "^10.30.3"
  }
}
```

此处 `@pm-spl/llc-linux-x64-glibc` 是一个实际的二进制包.
通过 `os`, `cpu`, `libc` 等指定这个包兼容的操作系统, CPU 等.

----

然后, 当用户使用:

```sh
pnpm install @pm-spl/llvm
```

安装入口包时, npm 会检查其可选依赖, 并自动跳过与当前平台不兼容的包. 于是, 就实现了根据当前平台, 自动安装对应的二进制包 !

----

最后, 入口包进行一些简单的处理, 根据当前平台调用对应的二进制包, 比如:

文件 `npm/llvm/bin/llc`:

```js
#!/usr/bin/env node
const lib = require("../lib.js");

lib.run_bin("llc");
```

文件 `npm/llvm/lib.js`:

```js
// (llc, lld) Compiled LLVM binary for multi-platform
const path = require("path");
const cp = require("child_process");

const resolvePkg = require("resolve-pkg").default;

const list_os_cpu_bin_p = {
  "android arm64": {
    "llc": "@pm-spl/llc-android-arm64",
    "lld": "@pm-spl/lld-android-arm64",
  },
  // TODO libc
  "linux arm64": {
    "llc": "@pm-spl/llc-linux-arm64-glibc",
    "lld": "@pm-spl/lld-linux-arm64-glibc",
  },
  "linux riscv64": {
    "llc": "@pm-spl/llc-linux-riscv64-glibc",
    "lld": "@pm-spl/lld-linux-riscv64-glibc",
  },
  "linux x64": {
    "llc": "@pm-spl/llc-linux-x64-glibc",
    "lld": "@pm-spl/lld-linux-x64-glibc",
  },
  "win32 x64": {
    "llc": "@pm-spl/llc-win32-x64",
    "lld": "@pm-spl/lld-win32-x64",
  },
  // TODO
  "wasm": {
    "llc": "@pm-spl/llc-wasm",
    "lld": "@pm-spl/lld-wasm",
  },
};

/// get npm package
function get_p(name) {
  const k = process.platform + " " + process.arch;
  const b = list_os_cpu_bin_p[k];
  if (null != b) {
    const p = b[name];
    if (null != p) {
      return p;
    }
  }

  throw new Error("not support " + name + " " + k);
}

/// get binary path
function bin(name) {
  const p = get_p(name);
  const r = resolvePkg(p, { cwd: __dirname });

  if (null != r) {
    const b = path.join(r, "bin", name);
    return b;
  }

  throw new Error("not found package " + p);
}

/// run process
function run_p(b, a) {
  cp.spawn(b, a, {
    stdio: "inherit",
  });
}

function get_a() {
  const a = process.argv.slice(2);
  //console.log(a);

  return a;
}

function run_bin_win32(name, a) {
  const p = get_p(name);
  const b = require(p);

  b.run_bin(a);
}

/// run bin
function run_bin(name, a) {
  if (null == a) {
    a = get_a();
  }

  if ("win32" == process.platform) {
    run_bin_win32(name, a);
  } else {
    const b = bin(name);

    run_p(b, a);
  }
}

module.exports = {
  bin,
  run_bin,
};
```

这就是跨平台 npm 二进制包的全部秘密啦 ! ~~


## 3 自动编译并发布 npm

LLVM 是一个巨大的项目, 编译出来也是很大的二进制文件.
并且每个发布的 npm 包也有最大容量限制.
所以选择分成多个 npm 包发布, 不同平台的分开, 不同工具分开 (比如 `llc` 和 `lld` 分开发布).
这样用户下载时, 也能尽量减少需要下载的文件.

手动发布一大堆 npm 包太麻烦了, 所以写成脚本自动发布, 只需要点一个按钮即可, 方便了很多, 喵呜 ! ~~

文件 `.github/workflows/npm-publish-bin.yml`:

```yml
# 手动运行: 发布 npm 包 (二进制)
name: npm publish (bin)

on:
  workflow_dispatch:
    inputs:
      tag:
        description: "Release tag"
        required: true
        default: "latest"

permissions:
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "latest"
          registry-url: "https://registry.npmjs.org"

      # 下载编译好的二进制包
      - run: echo "U=https://github.com/fm-elpac/llvm-wasm/releases/download/${{ github.event.inputs.tag }}" >> "$GITHUB_ENV"
      - run: curl -LO ${U}/llvm-android-arm64.zip
      - run: curl -LO ${U}/llvm-linux-arm64-glibc.zip
      - run: curl -LO ${U}/llvm-linux-riscv64-glibc.zip
      - run: curl -LO ${U}/llvm-linux-x64-glibc.zip
      - run: curl -LO ${U}/llvm-win32-x64.zip
      - run: curl -LO ${U}/llvm-wasm.zip
      # mingw-w64
      - run: curl -o mingw64.7z -L "https://github.com/niXman/mingw-builds-binaries/releases/download/15.2.0-rt_v13-rev1/x86_64-15.2.0-release-win32-seh-msvcrt-rt_v13-rev1.7z"

      # 解压, 准备 npm 包文件
      - run: |
          unzip llvm-android-arm64.zip -d llvm-android-arm64
          unzip llvm-linux-arm64-glibc.zip -d llvm-linux-arm64-glibc
          unzip llvm-linux-riscv64-glibc.zip -d llvm-linux-riscv64-glibc
          unzip llvm-linux-x64-glibc.zip -d llvm-linux-x64-glibc

          7z x mingw64.7z
          unzip llvm-win32-x64.zip -d llvm-win32-x64

          #unzip llvm-wasm.zip -d llvm-wasm
          unzip llvm-wasm.zip

      - run: |
          cp LICENSE npm/llc-android-arm64/
          cp LICENSE npm/lld-android-arm64/

          cp LICENSE npm/llc-linux-arm64-glibc/
          cp LICENSE npm/llc-linux-riscv64-glibc/
          cp LICENSE npm/llc-linux-x64-glibc/
          cp LICENSE npm/lld-linux-arm64-glibc/
          cp LICENSE npm/lld-linux-riscv64-glibc/
          cp LICENSE npm/lld-linux-x64-glibc/

          cp LICENSE npm/llc-win32-x64/
          cp LICENSE npm/lld-win32-x64/

          cp LICENSE npm/llc-wasm/
          cp LICENSE npm/lld-wasm/

      - run: |
          mkdir -p npm/llc-android-arm64/bin/
          mkdir -p npm/lld-android-arm64/bin/

          mkdir -p npm/llc-linux-arm64-glibc/bin/
          mkdir -p npm/llc-linux-riscv64-glibc/bin/
          mkdir -p npm/llc-linux-x64-glibc/bin/
          mkdir -p npm/lld-linux-arm64-glibc/bin/
          mkdir -p npm/lld-linux-riscv64-glibc/bin/
          mkdir -p npm/lld-linux-x64-glibc/bin/

          mkdir -p npm/llvm-dll-win32-x64/lib/
          mkdir -p npm/llc-win32-x64/lib/
          mkdir -p npm/lld-win32-x64/lib/

          mkdir -p npm/llc-wasm/bin/
          mkdir -p npm/lld-wasm/bin/

      - run: |
          cp llvm-android-arm64/llc npm/llc-android-arm64/bin/
          cp llvm-android-arm64/lld npm/lld-android-arm64/bin/

          cp llvm-linux-arm64-glibc/llc npm/llc-linux-arm64-glibc/bin/
          cp llvm-linux-riscv64-glibc/llc npm/llc-linux-riscv64-glibc/bin/
          cp llvm-linux-x64-glibc/llc npm/llc-linux-x64-glibc/bin/
          cp llvm-linux-arm64-glibc/lld npm/lld-linux-arm64-glibc/bin/
          cp llvm-linux-riscv64-glibc/lld npm/lld-linux-riscv64-glibc/bin/
          cp llvm-linux-x64-glibc/lld npm/lld-linux-x64-glibc/bin/

          cp \
            mingw64/bin/libgcc_s_seh-1.dll \
            mingw64/bin/libwinpthread-1.dll \
            mingw64/bin/libstdc++-6.dll \
            npm/llvm-dll-win32-x64/lib/

          cp llvm-win32-x64/llc.exe npm/llc-win32-x64/lib/
          cp llvm-win32-x64/lld.exe npm/lld-win32-x64/lib/

          cp llvm-wasm/llc.wasm \
            llvm-wasm/llc.js \
            npm/llc-wasm/bin/
          cp llvm-wasm/lld.wasm \
            llvm-wasm/lld.js \
            llvm-wasm/ld.lld.js \
            llvm-wasm/ld64.lld.js \
            llvm-wasm/lld-link.js \
            llvm-wasm/wasm-ld.js \
            npm/lld-wasm/bin/

      # DEBUG
      - run: find npm/

      # 发布 npm
      - run: |
          cd npm/llc-android-arm64 && \
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - run: |
          cd npm/lld-android-arm64 && \
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - run: |
          cd npm/llc-linux-arm64-glibc && \
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - run: |
          cd npm/llc-linux-riscv64-glibc && \
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - run: |
          cd npm/llc-linux-x64-glibc && \
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - run: |
          cd npm/lld-linux-arm64-glibc && \
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - run: |
          cd npm/lld-linux-riscv64-glibc && \
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - run: |
          cd npm/lld-linux-x64-glibc && \
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - run: |
          cd npm/llvm-dll-win32-x64 && \
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - run: |
          cd npm/llc-win32-x64 && \
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - run: |
          cd npm/lld-win32-x64 && \
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      # wasm
      - run: |
          cd npm/llc-wasm && \
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - run: |
          cd npm/lld-wasm && \
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      # 测试包
      # - run: |
      #     cd npm/llc-android-arm64 && \
      #     npm publish --tag beta --access public
      #   env:
      #     NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

由于每个平台的编译时间都较长 (约 1 小时), 也很容易半路报错 (编译失败),
所以各平台的编译是另外分开的, 需要手动触发. 详见附录.


## 4 测试运行

安装 pnpm 详见: <https://pnpm.io/installation>

```sh
> pnpm --version
10.31.0
```

然后, 只需要:

```sh
> pnpm install @pm-spl/llvm
Packages: +5
+++++
Progress: resolved 14, reused 5, downloaded 0, added 5, done

dependencies:
+ @pm-spl/llvm 0.1.0

Done in 3.7s using pnpm v10.31.0
```

验证安装:

```sh
> pnpm exec llc --version
LLVM (http://llvm.org/):
  LLVM version 22.1.0
  Optimized build.
  Default target: x86_64-unknown-linux-gnu
  Host CPU: znver3

  Registered Targets:
    aarch64    - AArch64 (little endian)
    aarch64_32 - AArch64 (little endian ILP32)
    aarch64_be - AArch64 (big endian)
    arm64      - ARM64 (little endian)
    arm64_32   - ARM64 (little endian ILP32)
    riscv32    - 32-bit RISC-V
    riscv32be  - 32-bit big endian RISC-V
    riscv64    - 64-bit RISC-V
    riscv64be  - 64-bit big endian RISC-V
    spirv      - SPIR-V Logical
    spirv32    - SPIR-V 32-bit
    spirv64    - SPIR-V 64-bit
    wasm32     - WebAssembly 32-bit
    wasm64     - WebAssembly 64-bit
    x86        - 32-bit X86: Pentium-Pro and above
    x86-64     - 64-bit X86: EM64T and AMD64
```

测试使用 `llc` 进行编译:

```sh
pnpm exec llc node_modules/@pm-spl/llvm/example/test.ll -mtriple=wasm32 -filetype=obj -O3 -o test.wasm
```

检查结果:

```sh
> ls -l test.wasm
-rw-r--r-- 1 s2 s2 448  3月 8日 13:21 test.wasm
> file test.wasm
test.wasm: WebAssembly (wasm) binary version 0x1 (MVP module)
> wasm2wat test.wasm
(module
  (type (;0;) (func))
  (type (;1;) (func (param i32)))
  (type (;2;) (func (param i32 i32)))
  (import "env" "__linear_memory" (memory (;0;) 1))
  (import "t1" "print_i32" (func $print_i32 (type 1)))
  (import "t1" "print_utf8" (func $print_utf8 (type 2)))
  (func $main (type 0)
    i32.const 233
    call $print_i32
    i32.const 0
    i32.const 8
    call $print_utf8)
  (export "main" (func $main))
  (data $.L.str1 (i32.const 0) "test 666"))
```

成功 ! 撒花 ~~


## 5 总结与展望

本文介绍了编译 LLVM 的过程, 跨平台 npm 二进制包的原理. (并在 附录 中说明了 多平台 交叉编译 的细节. )

此处 (附录) 支持了 `linux`, `android` (比如 手机), `win32` 等多种操作系统, `x64`, `arm64`, `riscv64` 等多种 CPU. 还有 WebAssembly (emscripten) 可以在浏览器等中运行.

可以看到, LLVM 是一个非常优秀的可移植 (portable) 跨平台项目, 各平台的交叉编译也比较方便.

----

发布好 npm 二进制包之后, 用户只需使用同一个 npm 安装命令, 即可在各平台自动安装对应的二进制包, 方便了很多. 同时可以利用 npm 强大的基础设施, 下载速度也很快, 这也是使用 npm 的重要优点之一.

此处支持的平台 (操作系统, CPU 等) 有限, 并且只编译了 LLVM 的 `llc` 和 `lld`. 但是根据本文的方法, 可以很容易的扩展支持更多平台, 编译 LLVM 的更多部分.

进行了 LLVM 的多平台编译之后, 就可以更方便的开发基于 LLVM 的项目了.


## 附录 1 交叉编译

本章节说明 LLVM 多平台交叉编译的细节.

文件 `Makefile`:

```Makefile
# llvm-wasm: Compile LLVM
LLVM_TAG := llvmorg-22.1.0

LLVM_TARGETS_TO_BUILD := "AArch64;RISCV;SPIRV;WebAssembly;X86"

# cmake 参数
A := -S ../../llvm-project/llvm \
	-DCMAKE_BUILD_TYPE=Release \
	-DLLVM_TARGETS_TO_BUILD=$(LLVM_TARGETS_TO_BUILD) \
	-DLLVM_ENABLE_PROJECTS=lld

G := -G Ninja

CMAKE_BUILD := --build . --target llc lld

# 清理编译
clean:
	- rm -r build
.PHONY: clean

# 下载 LLVM 代码
clone-llvm:
	git clone https://github.com/llvm/llvm-project \
	--branch=$(LLVM_TAG) \
	--single-branch --depth=1
.PHONY: clone-llvm

# 复制编译后的文件, 并 strip
copy-strip:
	mkdir -p $(DIR_LLVM)
	cp $(DIR_BUILD)/bin/llc \
		$(DIR_BUILD)/bin/lld \
		$(DIR_LLVM)/

	llvm-strip $(DIR_LLVM)/llc
	llvm-strip $(DIR_LLVM)/lld
.PHONY: copy-strip

# 编译 (1) (非交叉)
b1-linux:
	mkdir -p $(DIR_BUILD)

	cd $(DIR_BUILD) && \
	env CC=clang CXX=clang++ \
	cmake $(G) $(A) \
		-DLLVM_USE_LINKER=lld -DLLVM_ENABLE_LTO=Full

	cd $(DIR_BUILD) && cmake $(CMAKE_BUILD)
.PHONY: b1-linux

# 编译 (2) 交叉
b2-cross:
	mkdir -p $(DIR_BUILD)

	cd $(DIR_BUILD) && \
	cmake --toolchain ../../cross/$(CROSS) $(G) $(A)

	cd $(DIR_BUILD) && cmake $(CMAKE_BUILD)
.PHONY: b2-cross

# 编译 (3) Android
b3-android:
	mkdir -p $(DIR_BUILD)

	cd $(DIR_BUILD) && \
	cmake --toolchain ../../cross/$(CROSS) $(G) $(A)

	cd $(DIR_BUILD) && cmake $(CMAKE_BUILD)
.PHONY: b3-android

# 编译 (4) emscripten
b4-wasm:
	mkdir -p $(DIR_BUILD)

	cd $(DIR_BUILD) && \
	emcmake cmake $(G) $(A) \
		-DLLVM_USE_LINKER=lld -DLLVM_ENABLE_LTO=Full

	cd $(DIR_BUILD) && cmake $(CMAKE_BUILD)
.PHONY: b4-wasm

# build LLVM: linux-x64
build-linux-x64: DIR_BUILD := build/linux-x64
build-linux-x64: DIR_LLVM := llvm-linux-x64-glibc
build-linux-x64: b1-linux copy-strip
.PHONY: build-linux-x64

# build LLVM: linux-arm64
build-linux-arm64: DIR_BUILD := build/linux-arm64
build-linux-arm64: DIR_LLVM := llvm-linux-arm64-glibc
build-linux-arm64: b1-linux copy-strip
.PHONY: build-linux-arm64

# build LLVM: linux-arm64 (cross)
build-linux-arm64-cross: DIR_BUILD := build/linux-arm64
build-linux-arm64-cross: DIR_LLVM := llvm-linux-arm64-glibc
build-linux-arm64-cross: CROSS := linux-arm64-glibc.cmake
build-linux-arm64-cross: b2-cross copy-strip
.PHONY: build-linux-arm64-cross

# build LLVM: linux-riscv64 (cross)
build-linux-riscv64-cross: DIR_BUILD := build/linux-riscv64
build-linux-riscv64-cross: DIR_LLVM := llvm-linux-riscv64-glibc
build-linux-riscv64-cross: CROSS := linux-riscv64-glibc.cmake
build-linux-riscv64-cross: b2-cross copy-strip
.PHONY: build-linux-riscv64-cross

# build LLVM: android-arm64
build-android-arm64: DIR_BUILD := build/android-arm64
build-android-arm64: DIR_LLVM := llvm-android-arm64
build-android-arm64: CROSS := android-arm64.cmake
build-android-arm64: b3-android copy-strip
.PHONY: build-android-arm64

# build LLVM: wasm (emscripten)
build-wasm: DIR_BUILD := build/wasm
build-wasm: DIR_LLVM := llvm-wasm
build-wasm: b4-wasm
	cp -r $(DIR_BUILD)/bin $(DIR_LLVM)
.PHONY: build-wasm

# build LLVM: win32-x64
build-win32-x64: DIR_BUILD := build/win32-x64
build-win32-x64: DIR_LLVM := llvm-win32-x64
build-win32-x64:
	mkdir -p $(DIR_BUILD)

	cd $(DIR_BUILD) && cmake $(G) $(A)

	cd $(DIR_BUILD) && cmake $(CMAKE_BUILD)

	cp -r $(DIR_BUILD)/bin $(DIR_LLVM)
.PHONY: build-win32-x64
```

这个文件包含了主要的编译命令.

### A1.1 linux (x64, arm64, riscv64)

文件 `.github/workflows/build-linux-x64-glibc.yml`:

```yml
# 手动运行: 编译 llvm linux-x64-glibc
name: build linux-x64-glibc

on:
  workflow_dispatch:
    inputs:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      # 安装依赖
      - run: |
          sudo apt-get update && \
          sudo apt-get -y install \
            llvm lld

      # 下载代码并编译
      - run: make clone-llvm

      # llvm: linux-x64-glibc
      - run: make build-linux-x64

      # 测试运行
      - run: llvm-linux-x64-glibc/llc --version

      - uses: actions/upload-artifact@v6
        with:
          name: llvm-linux-x64-glibc
          path: llvm-linux-x64-glibc
```

文件 `.github/workflows/build-linux-arm64-glibc.yml`:

```yml
# 手动运行: 编译 llvm linux-arm64-glibc
name: build linux-arm64-glibc

on:
  workflow_dispatch:
    inputs:

jobs:
  build:
    runs-on: ubuntu-latest
    # 注: 直接编译失败, 需要 交叉编译
    #runs-on: ubuntu-24.04-arm
    steps:
      - uses: actions/checkout@v6

      # 安装依赖
      - run: |
          sudo apt-get update && \
          sudo apt-get -y install \
            llvm lld \
            binutils-aarch64-linux-gnu gcc-aarch64-linux-gnu g++-aarch64-linux-gnu libc6-dev-arm64-cross

      # 下载代码并编译
      - run: make clone-llvm

      # llvm: linux-arm64-glibc
      #- run: make build-linux-arm64
      - run: make build-linux-arm64-cross

      # 测试运行
      #- run: llvm-linux-arm64-glibc/llc --version

      - uses: actions/upload-artifact@v6
        with:
          name: llvm-linux-arm64-glibc
          path: llvm-linux-arm64-glibc
```

文件 `.github/workflows/build-linux-riscv64-glibc.yml`:

```yml
# 手动运行: 编译 llvm linux-riscv64-glibc
name: build linux-riscv64-glibc

on:
  workflow_dispatch:
    inputs:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      # 安装依赖
      - run: |
          sudo apt-get update && \
          sudo apt-get -y install \
            llvm lld \
            binutils-riscv64-linux-gnu gcc-riscv64-linux-gnu g++-riscv64-linux-gnu libc6-dev-riscv64-cross

      # 下载代码并编译
      - run: make clone-llvm

      # llvm: linux-riscv64-glibc
      - run: make build-linux-riscv64-cross

      # 测试运行
      #- run: llvm-linux-riscv64-glibc/llc --version

      - uses: actions/upload-artifact@v6
        with:
          name: llvm-linux-riscv64-glibc
          path: llvm-linux-riscv64-glibc
```

文件 `cross/linux-arm64-glibc.cmake`:

```cmake
# aarch64-linux-gnu-gcc
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR arm64)

set(CMAKE_C_COMPILER aarch64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER aarch64-linux-gnu-g++)

#set(CMAKE_SYSROOT "/usr/aarch64-linux-gnu")
set(CMAKE_FIND_ROOT_PATH "/usr/aarch64-linux-gnu")

set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
#set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
#set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
#set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)
```

文件 `cross/linux-riscv64-glibc.cmake`:

```cmake
# riscv64-linux-gnu-gcc
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)

set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)

#set(CMAKE_SYSROOT "/usr/riscv64-linux-gnu")
set(CMAKE_FIND_ROOT_PATH "/usr/riscv64-linux-gnu")

set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
#set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
#set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
#set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)
```

### A1.2 android-arm64

文件 `.github/workflows/build-android-arm64.yml`:

```yml
# 手动运行: 编译 llvm android-arm64
name: build android-arm64

on:
  workflow_dispatch:
    inputs:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      # 安装依赖
      - run: |
          sudo apt-get update && \
          sudo apt-get -y install \
            llvm lld

      # 下载代码并编译
      - run: make clone-llvm

      # llvm: android-arm64
      - run: make build-android-arm64

      # 测试运行
      #- run: llvm-android-arm64/llc --version

      - uses: actions/upload-artifact@v6
        with:
          name: llvm-android-arm64
          path: llvm-android-arm64
```

文件 `cross/android-arm64.cmake`:

```cmake
set(CMAKE_SYSTEM_NAME Android)
set(CMAKE_SYSTEM_VERSION 28)
set(CMAKE_ANDROID_ARCH_ABI arm64-v8a)
```

### A1.3 wasm (emscripten)

文件 `.github/workflows/build-wasm.yml`:

```yml
# 手动运行: 编译 llvm emscripten
name: build wasm (emscripten)

on:
  workflow_dispatch:
    inputs:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      # 安装依赖
      - run: |
          sudo apt-get update && \
          sudo apt-get -y install \
            llvm lld

      # 安装 emscripten
      - run: git clone https://github.com/emscripten-core/emsdk.git --depth=1 --single-branch
      - run: cd emsdk && ./emsdk install latest
      - run: cd emsdk && ./emsdk activate latest

      # 下载代码并编译
      - run: make clone-llvm

      # llvm: emscripten
      - run: |
          source emsdk/emsdk_env.sh &&
          emcc --version &&
          make build-wasm

      - uses: actions/upload-artifact@v6
        with:
          name: llvm-wasm
          path: llvm-wasm
```

文件 `cross/emscripten.cmake`:

```cmake
# 注意: ArchLinux 成功编译, ubuntu 失败 (需要使用 emcmake)
set(CMAKE_SYSTEM_NAME Emscripten)
set(CMAKE_C_COMPILER emcc)
set(CMAKE_CXX_COMPILER em++)
```

----

在 ArchLinux 编译 (emscripten) 的具体细节.

(1) 安装所需软件包:

```sh
sudo pacman -S base-devel clang llvm cmake ninja emscripten
```

(2) 进行编译:

```sh
source /etc/profile.d/emscripten.sh
make build-wasm
```

### A1.4 win32-x64

文件 `.github/workflows/build-win32-x64.yml`:

```yml
# 手动运行: 编译 llvm win32-x64
name: build win32-x64

on:
  workflow_dispatch:
    inputs:

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v6

      # 下载代码并编译
      - run: make clone-llvm

      # llvm: win32-x64
      - run: make build-win32-x64

      # 测试运行
      - run: llvm-win32-x64/llc.exe --version

      - uses: actions/upload-artifact@v6
        with:
          name: llvm-win32-x64
          path: llvm-win32-x64
```

----

本文使用 CC-BY-SA 4.0 许可发布.
