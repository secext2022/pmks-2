# 在 Android 运行 GNU/Linux 二进制程序 (proot)

在 GNU/Linux 系统上运行 Android 应用比较容易 (比如 waydroid),
但是反过来就很麻烦了.

Android 虽然也使用 Linux 内核 (kernel),
但是系统环境和一般的 GNU/Linux 系统
(比如 ArchLinux, Debian, Ubuntu, Fedora, NixOS 等)
具有不可忽略的显著差异,
所以为 GNU/Linux 编译的二进制可执行文件, 不能拿过来直接运行.

想要在 Android 系统运行这些应用, 有几种不同的方法.
性能最高的方法当然是重新编译,
编译后的二进制文件就可以直接在 Android 运行了,
Termux 就是这么做的.
但是, 虽然最后一步很简单, 前面的为 Android 编译,
就是很麻烦甚至很困难的了.

如果能把为 GNU/Linux 编译的二进制文件直接拿来, 不加修改的运行,
在很多情况下会简单容易很多.
proot 就是一种这样的技术.
proot 通过使用 Linux 内核的 ptrace 功能,
对程序的内核调用 (syscall) 进行翻译, 从而实现一个很薄的兼容层,
性能只有很小的损失 (并不是虚拟机方法).

本文以应用程序 deno 举栗, 介绍在 Android 运行的方法.
本文不仅介绍最终结果 (具体的实现方案),
还重点说明探索的过程, 也就是这个结果是如何获得的.

----

相关链接:
+ <https://proot-me.github.io/>
+ <https://github.com/proot-me/proot>
+ <https://termux.dev/>
+ <https://github.com/termux/termux-app>
+ <https://wiki.termux.com/wiki/PRoot>
+ <https://github.com/termux/proot>
+ <https://github.com/termux/proot-distro>
+ <https://deno.com/>


## 目录

+ 1 获取所需文件

+ 2 组装运行环境

+ 3 测试

+ 4 总结与展望

+ 附录 1 proot-distro 简介


## 1 获取所需文件

本文的目标是构建一个相对独立的, 最小的运行环境.
这个运行环境所需的各种文件, 需要从多个地方分别获取.

+ (1) proot (termux)

  首先在手机上安装 Termux: <https://termux.dev/>

  然后在 Termux 中安装 proot:

  ```sh
  > pkg install proot
  ```

  ![termux 安装 proot](./图/1-termux-1.jpg)

+ (2) GNU/Linux 系统文件包 (proot-distro)

  这个需要从 proot-distro 的发布页面下载: <https://github.com/termux/proot-distro/releases>

  下载这个文件: `debian-bookworm-aarch64-pd-v4.7.0.tar.xz`

+ (3) deno (aarch64 linux)

  这个需要从 deno 的发布页面下载: <https://github.com/denoland/deno/releases>

  下载这个文件 (v1.41.0): `deno-aarch64-unknown-linux-gnu.zip`


## 2 组装运行环境

万事俱备, 可以开始拼凑运行环境了 !

+ (1) proot 运行所需文件.

  先来看看 proot 软件包都有哪些文件 (在 termux 中操作):

  ```sh
  > dpkg -L proot
  ```

  ![proot (1) (termux)](./图/2-proot-1.png)

  其中 `usr/bin/proot` 是 proot 的可执行文件,
  `usr/libexec/proot/loader` 这个也是 proot 的重要组成部分.

  再来看看 proot 的依赖库:

  ```sh
  > ldd /data/data/com.termux/files/usr/bin/proot
  ```

  ![proot (2) (termux)](./图/2-proot-2.png)

  `libtalloc.so.2` 这个是 proot 运行所需要的库文件, 需要注意.
  `libc.so`, `ld-android.so`, `libdl.so` 这些库是 Android 系统自身提供的,
  不用管.

+ (2) deno 运行所需文件.

  把压缩包 `deno-aarch64-unknown-linux-gnu.zip` 解压之后,
  把里面的 `deno` 文件拿出来, 放到 termux 中, 然后:

  ```sh
  > ldd deno
  ```

  ![ldd deno (termux)](./图/2-deno-1.png)

  这里可以看到一些依赖库文件:
  `libgcc_s.so.1`, `libpthread.so.0`, `libm.so.6`, `libc.so.6` 等.

  deno 使用 rust 编程语言开发, 虽然 rust 号称是静态链接,
  在最后生成的单个二进制可执行文件中打包所有依赖,
  但实际上还是有少量系统库是动态链接的 (比如 glibc).

  把压缩包 `debian-bookworm-aarch64-pd-v4.7.0.tar.xz` 解压之后,
  从里面获取此处所需的库文件.

+ (3) 开始组装:

  ```sh
  > find setup
  setup
  setup/proot
  setup/loader
  setup/libtalloc.so.2
  setup/run.sh
  setup/setup.sh
  setup/debian12_aarch64
  setup/debian12_aarch64/usr
  setup/debian12_aarch64/usr/bin
  setup/debian12_aarch64/usr/bin/env
  setup/debian12_aarch64/usr/bin/deno
  setup/debian12_aarch64/usr/lib
  setup/debian12_aarch64/usr/lib/aarch64-linux-gnu
  setup/debian12_aarch64/usr/lib/aarch64-linux-gnu/ld-linux-aarch64.so.1
  setup/debian12_aarch64/usr/lib/aarch64-linux-gnu/libc.so.6
  setup/debian12_aarch64/usr/lib/aarch64-linux-gnu/libm.so.6
  setup/debian12_aarch64/usr/lib/aarch64-linux-gnu/libpthread.so.0
  setup/debian12_aarch64/usr/lib/aarch64-linux-gnu/libgcc_s.so.1
  setup/debian12_aarch64/usr/lib/aarch64-linux-gnu/libdl.so.2
  ```

  这是最终组装好的运行环境的文件清单, 所有文件放在 `setup` 目录中.
  其中 `proot`, `loader`, `libtalloc.so.2` 是从 termux 中获取的.
  `usr/bin/deno` 是从压缩包 `deno-aarch64-unknown-linux-gnu.zip` 中获取的.
  `debian12_aarch64` 目录中的文件是从压缩包 `debian-bookworm-aarch64-pd-v4.7.0.tar.xz` 中获取的.

----

其中 `setup.sh` 文件:

```sh
#!/system/bin/sh
echo setup.sh $1
#cd $1

chmod +x run.sh
chmod +x proot
chmod +x loader

chmod +x debian12_aarch64/usr/bin/env
chmod +x debian12_aarch64/usr/bin/deno

mkdir -p tmp
mkdir -p debian12_aarch64/tmp

ln -s usr/lib debian12_aarch64/lib
ln -s aarch64-linux-gnu/ld-linux-aarch64.so.1 debian12_aarch64/usr/lib/ld-linux-aarch64.so.1

echo setup ok.
```

这个脚本用来做一些初始化的事情.

其中 `run.sh` 文件:

```sh
#!/system/bin/sh
export LD_LIBRARY_PATH=$(pwd)

export PROOT_TMP_DIR=$(pwd)/tmp
export PROOT_LOADER=$(pwd)/loader

./proot \
  --bind=debian12_aarch64/tmp:/dev/shm \
  --bind=/sys \
  --bind=/proc/self/fd/2:/dev/stderr \
  --bind=/proc/self/fd/1:/dev/stdout \
  --bind=/proc/self/fd/0:/dev/stdin \
  --bind=/proc/self/fd:/dev/fd \
  --bind=/proc \
  --bind=/dev/urandom:/dev/random \
  --bind=/dev \
  -L \
  --kernel-release=6.2.1-PRoot-Distro \
  --sysvipc \
  --link2symlink \
  --kill-on-exit \
  --cwd=/ \
  --change-id=0:0 \
  --rootfs=debian12_aarch64 \
  /usr/bin/deno "$@"
```

这个脚本调用 proot 来运行 deno.


## 3 测试

测试设备: 手机 Android 11 (MIUI 12.5)

使用 USB 数据线连接 PC 和手机:

```sh
> adb devices
List of devices attached
643fa0f6	device
```

然后:

```sh
> adb push setup /data/local/tmp
setup/: 13 files pushed, 0 skipped. 62.6 MB/s (94798346 bytes in 1.444s)
> adb shell
raphael:/ $ cd /data/local/tmp/setup
raphael:/data/local/tmp/setup $ ls -l
total 288
drwxrwxr-x 3 shell shell   4096 2024-02-27 21:15 debian12_aarch64
-rw-rw-rw- 1 shell shell  30504 2024-02-26 19:39 libtalloc.so.2
-rw-rw-rw- 1 shell shell   5736 2024-02-27 01:59 loader
-rwxrwxrwx 1 shell shell 213976 2024-02-26 19:39 proot
-rwxrwxrwx 1 shell shell    590 2024-02-27 03:38 run.sh
-rw-rw-rw- 1 shell shell    356 2024-02-27 03:34 setup.sh
raphael:/data/local/tmp/setup $ chmod +x setup.sh
raphael:/data/local/tmp/setup $ ./setup.sh
setup.sh
setup ok.
raphael:/data/local/tmp/setup $ ls -l
total 296
drwxrwxr-x 4 shell shell   4096 2024-02-27 21:16 debian12_aarch64
-rw-rw-rw- 1 shell shell  30504 2024-02-26 19:39 libtalloc.so.2
-rwxrwxrwx 1 shell shell   5736 2024-02-27 01:59 loader
-rwxrwxrwx 1 shell shell 213976 2024-02-26 19:39 proot
-rwxrwxrwx 1 shell shell    590 2024-02-27 03:38 run.sh
-rwxrwxrwx 1 shell shell    356 2024-02-27 03:34 setup.sh
drwxrwxrwx 2 shell shell   4096 2024-02-27 21:16 tmp
raphael:/data/local/tmp/setup $ ./run.sh --version
deno 1.41.0 (release, aarch64-unknown-linux-gnu)
v8 12.1.285.27
typescript 5.3.3
raphael:/data/local/tmp/setup $ ./run.sh repl -A
Deno 1.41.0
exit using ctrl+d, ctrl+c, or close()
> 0.1 + 0.2
0.30000000000000004
> 
```

成功运行了 GNU/Linux (aarch64) 版本的 deno.

![测试运行 deno](./图/3-t-1.png)


## 4 总结与展望

在 proot, termux, proot-distro 的帮助下,
我们终于成功在 Android 运行了最新版 deno.
这个小的运行环境是相对独立的,
可以单独拿出来放在一个地方就能运行.

虽然 proot 的工作原理很简单, 这个方案看起来也很简单,
窝之前以为不用费多大功夫就能轻松搞定.
实际上却是这也不行, 那也不行, 这里有问题, 那里也有问题,
这里是坑, 那里也是坑 .. .
折腾了好久, 遭遇了许多困难和挫折, 因为太笨气哭了好几次,
擦干眼睛旁边的小小水滴之后, 才有了这个最终方案.
好在最后雨过天晴了, 努力没有白费.

最好的方法还是重新编译, 然后直接在 Android 运行.
但是为 Android 编译很麻烦甚至很困难的情况下,
本文的方法就是一个好的替代方案.


## 附录 1 proot-distro 简介

+ <https://wiki.termux.com/wiki/PRoot>
+ <https://github.com/termux/proot-distro>

proot-distro 是 termux 团队开发的一个工具,
用来方便的在 Termux 中安装和运行 GNU/Linux 发行版 (比如 debian).

+ (1) 在 termux 中安装 proot-distro:

  ```sh
  > pkg install proot-distro
  ```

+ (2) 查看有哪些发行版可用:

  ```sh
  > proot-distro list
  ```

+ (3) 安装一个发行版 (比如 debian):

  ```sh
  > proot-distro install debian
  ```

+ (4) 启动一个发行版 (比如 debian):

  ```sh
  > proot-distro login debian
  ```

----

然后就获得了一个在 Android 运行的 GNU/Linux 系统环境.

如果拿到一个 GNU/Linux 的二进制程序,
首先在这个环境中测试一下, 能不能正常运行.
这是快速验证的方法.

如果可以运行, 那再用本文的方法.
如果不能运行, 那就不用考虑本文了, 早点洗洗睡吧.

本文之中构建的运行环境, 其实就是 proot-distro 的运行环境简化而来.

----

本文使用 CC-BY-SA 4.0 许可发布.
