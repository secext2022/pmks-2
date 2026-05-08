# Android 运行 deno 的新方法 (3): Termux 胖喵安初

梅开 3 度 !! 这是第 3 篇在 Android 运行 deno 的文章了, 之前的两篇是
《在 Android 运行 deno (aarch64) 的新方法 (glibc-runner)》
《在 Android 运行 GNU/Linux 二进制程序 (proot)》

deno 是个好东西, 可以很方便的编写和运行 js 程序.
感谢 Termux ! 不久前 deno 终于直接编译到 Android 成功了 !!
现在可以直接在 Termux 中安装并运行 deno 啦 ~

但是, 如何在自己的 app 中使用 (运行) deno 呢 ?
胖喵拼音 (pmim) 依赖 deno, 当时 deno 还只是 1.x 版本, 如今 deno 已经升级到 2.x 版本了,
情况发生了变化.
直接编译 deno 超级麻烦 (Android), 窝尝试过, 但是失败了.
所以, 换一种方法, 把 Termux 中编译好的 deno 直接拿过来运行 !

胖喵安初 (azi) 是一个方便在 app 中建立类似 Termux 环境的库, 所以就用胖喵安初来测试运行啦 ~

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 78 号作品. )

----

相关文章:

+ 《小水滴系列文章目录 (整理)》

  TODO

+ 《在 Android 设备上写代码 (Termux, code-server)》

  TODO

+ 《胖喵安初 (azi) Android 应用初始化库 (类似 Termux)》

  TODO

+ 《在 Android 运行 deno (aarch64) 的新方法 (glibc-runner)》

  TODO

+ 《在 Android 运行 GNU/Linux 二进制程序 (proot)》

  TODO

+ 《高版本 Android 如何访问 sdcard/Android/data 目录中的文件 (翻译)》

  TODO


## 目录

+ 1 打包 deno (Termux)

+ 2 测试运行 (胖喵安初 azi)

+ 3 总结与展望


## 1 打包 deno (Termux)

首先, 打开 Termux.

关于如何安装 Termux 请见文章 《在 Android 设备上写代码 (Termux, code-server)》.

![1](./图/1-i-1.jpg)

安装 deno 和 ldd, 命令:

```sh
pkg install deno ldd
```

![2](./图/1-i-2.jpg)

尝试运行一下 deno:

```sh
deno --version
```

![3](./图/1-ldd-3.jpg)

然后列出 deno 依赖的库文件 (`.so`):

```sh
ldd /data/data/com.termux/files/usr/bin/deno | grep termux
```

![4](./图/1-cp-4.jpg)

复制相关文件到 sdcard:

```sh
mkdir -p /sdcard/test-deno2
cp /data/data/com.termux/files/usr/bin/deno /sdcard/test-deno2
cp /data/data/com.termux/files/usr/lib/libz.so.1 /sdcard/test-deno2
cp /data/data/com.termux/files/usr/lib/libsqlite3.so /sdcard/test-deno2
touch /sdcard/test-deno2/azi_init.sh
```

![5](./图/1-sh-5.jpg)

然后编辑文件 `/sdcard/test-deno2/azi_init.sh`:

```sh
# test deno2 azi_init.sh

# 复制 deno
cp $AZI_DIR_SDCARD_DATA/demo/deno $AZI_DIR_APP_DATA
cp $AZI_DIR_SDCARD_DATA/demo/libz.so.1 $AZI_DIR_APP_DATA
cp $AZI_DIR_SDCARD_DATA/demo/libsqlite3.so $AZI_DIR_APP_DATA

# 运行 deno
export LD_LIBRARY_PATH=$AZI_DIR_APP_DATA

/system/bin/linker64 $AZI_DIR_APP_DATA/deno --version
```

可以看到, 只有 5 行简单的代码 (shell 脚本).

![6](./图/1-zip-6.jpg)

最后把这些文件压缩成一个 zip 压缩包:

![7](./图/1-zip-7.jpg)

获得文件 `test-init.azi.zip`, 撒花 ~


## 2 测试运行 (胖喵安初 azi)

然后使用 胖喵安初 进行测试.
关于胖喵安初详见文章 《胖喵安初 (azi) Android 应用初始化库 (类似 Termux)》.

![1](./图/2-cp-1.jpg)

将上面的压缩包文件复制到 `/sdcard/Android/data/io.github.fm_elpac.azi_demo/cache/test-init.azi.zip`.

关于如何访问 `Android/data` 目录请见文章 《高版本 Android 如何访问 sdcard/Android/data 目录中的文件 (翻译)》.

![2](./图/2-rm-2.jpg)

然后删除 `/sdcard/Android/data/io.github.fm_elpac.azi_demo/files` 中的文件.

----

准备完毕, 然后关闭 胖喵安初 (azi demo), 并重新打开.

然后上面写的 `azi_init.sh` 脚本就会运行 !

![3](./图/2-r-3.jpg)

运行成功后就会创建 `azi/azi_ok` 文件.

![4](./图/2-r-4.jpg)

其中 `cache/azi_log` 是运行日志:

![5](./图/2-cache-5.jpg)

![6](./图/2-log-6.jpg)

打开 `-o.txt` 文件:

![7](./图/2-log-7.jpg)

deno 已经成功运行:

```sh
deno 2.2.13 (stable, release, aarch64-linux-android)
v8 13.5.212.10-rusty
typescript 5.7.3
```

撒花 ~


## 3 总结与展望

在 Android 上不仅可以在 Termux 中安装运行 deno, 还可以把 deno 拿出来, 在自己的 app 中运行.
使用 胖喵安初 (azi) 可以方便的进行测试.

更有趣的是, 上述操作可以全部在一只手机上完成 !!
距离我们在手机上写代码的 "伟大" 计划, 又近了一步 (狗头)

可爱的 deno 已经在小巧的 Android 手机上跑起来了, 带来了更多可能 ~

----

本文使用 CC-BY-SA 4.0 许可发布.
