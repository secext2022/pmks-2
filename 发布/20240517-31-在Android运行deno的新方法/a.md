# 在 Android 运行 deno (aarch64) 的新方法 (glibc-runner)

胖喵拼音依赖 `deno`, 但是因为 deno 尚未解决的 BUG, 无法编译 Android 版本.
所以之前使用 `proot` 运行 deno.

不久前, 有人发现了一种新的在 Android 运行 deno 的方法.
新的方法更简单, 更快速, 不依赖 termux 和 proot, 是一个很好的方法 !

相关文章:

+ 《在 Android 运行 GNU/Linux 二进制程序 (proot)》

  TODO

目录:

+ 1 具体方法
+ 2 相关链接与致谢
+ 3 总结与展望


## 1 具体方法

+ (1) 下载官方编译好的 deno 二进制: <https://github.com/denoland/deno/releases>

  解压 `deno-aarch64-unknown-linux-gnu.zip`, 获得 `deno` 文件.

+ (2) 从 `termux-pacman` 下载 `glibc` 和 `gcc-libs-glibc` 软件包:

  ```sh
  curl -O https://service.termux-pacman.dev/gpkg/aarch64/gpkg.json

  curl https://service.termux-pacman.dev/gpkg/aarch64/$(cat gpkg.json | jq -r '."glibc".FILENAME') -o glibc.tar.xz

  curl https://service.termux-pacman.dev/gpkg/aarch64/$(cat gpkg.json | jq -r '."gcc-libs-glibc".FILENAME') -o gcc-libs-glibc.tar.xz
  ```

  解压, 获得下列文件:

  ```sh
  ld-linux-aarch64.so.1
  libc.so.6
  libdl.so.2
  libgcc_s.so.1
  libm.so.6
  libpthread.so.0
  ```

+ (3) 使用 `patchelf` 修改 `deno`:

  ```sh
  patchelf --set-rpath /data/local/tmp/lib --set-interpreter /data/local/tmp/lib/ld-linux-aarch64.so.1 deno
  ```

+ (4) 使用 `adb push` 将相关文件传输到 Android 手机:

  ```sh
  adb push deno /data/local/tmp

  adb push lib /data/local/tmp
  ```

+ (5) 使用 `adb shell` 测试运行:

  ```sh
  raphael:/data/local/tmp $ pwd
  /data/local/tmp
  raphael:/data/local/tmp $ ls -l 
  total 138648
  -rwxrwxrwx 1 shell shell 141959425 2024-05-17 06:57 deno
  drwxrwxr-x 2 shell shell      4096 2024-05-17 06:54 lib
  raphael:/data/local/tmp $ ls -l lib
  total 4240
  -rwxrwxrwx 1 shell shell  241064 2024-05-17 06:53 ld-linux-aarch64.so.1
  -rwxrwxrwx 1 shell shell 2292352 2024-05-17 06:53 libc.so.6
  -rwxrwxrwx 1 shell shell   69736 2024-05-17 06:53 libdl.so.2
  -rw-rw-rw- 1 shell shell  591400 2024-05-17 06:53 libgcc_s.so.1
  -rwxrwxrwx 1 shell shell 1039216 2024-05-17 06:53 libm.so.6
  -rwxrwxrwx 1 shell shell   70120 2024-05-17 06:53 libpthread.so.0
  raphael:/data/local/tmp $ export HOME=$(pwd)
  raphael:/data/local/tmp $ ./deno --version
  deno 1.43.3 (release, aarch64-unknown-linux-gnu)
  v8 12.4.254.13
  typescript 5.4.5
  raphael:/data/local/tmp $ ./deno
  Deno 1.43.3
  exit using ctrl+d, ctrl+c, or close()
  REPL is running with all permissions allowed.
  To specify permissions, run `deno repl` with allow flags.
  > 0.1 + 0.2
  0.30000000000000004
  > Deno.version
  { deno: "1.43.3", v8: "12.4.254.13", typescript: "5.4.5" }
  >
  ```

![测试运行 deno](./图/0-adb.png)


## 2 相关链接与致谢

首先, 感谢外国网友 `CodeIter` 提供的这个好方法 ! <https://github.com/CodeIter>

相关讨论详见: <https://github.com/denoland/deno/issues/19759#issuecomment-2116026016>

`glibc-runner` 来自 `termux-pacman` 项目:
+ <https://github.com/termux-pacman/glibc-packages/wiki/About-glibc-runner-(grun)>
+ <https://github.com/termux-pacman/glibc-packages/tree/main/gpkg/glibc-runner>
+ <https://service.termux-pacman.dev/gpkg/aarch64/>

`patchelf` 工具: <https://github.com/NixOS/patchelf>

`deno` 项目: <https://github.com/denoland/deno>


## 3 总结与展望

一个陌生的外国人, 突然之间解决了窝的问题, 帮助了窝.
这种跨国的合作, 体现的正是开源精神 ! 在此再次感谢 !

之前使用 `proot` 方法, 相当麻烦复杂, 并且依赖 `termux` 环境 (`proot-distro`).
proot 需要拦截系统调用 (syscall), 所以理论上会有一定的性能损失.

新的方法不需要 proot, 不依赖 termux.
只需要使用 `patchelf` 修改库的路径, 并提供几个 `.so` 库文件, 即可运行.
简单方便了许多, 并且没有性能损耗了.

最好的方法还是直接编译 Android 版 deno.
但是目前由于尚未解决的 BUG, 无法编译: <https://github.com/denoland/rusty_v8/issues/1475>

希望这个 BUG 能够早日解决, 使得 deno 对 Android 有更好的支持.

----

本文使用 CC-BY-SA 4.0 许可发布.
