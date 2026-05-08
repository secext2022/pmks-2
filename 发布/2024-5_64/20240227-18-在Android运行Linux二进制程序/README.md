# 20240227-18

标题:
**在 Android 运行 GNU/Linux 二进制程序 (proot)**

索引: `计算机编程入门`

关键词: Android, GNU/Linux, proot, termux, 二进制


## 图文版

[已发布](./a.md): (5)

+ <https://blog.csdn.net/secext2022/article/details/136333781>
+ <https://zhuanlan.zhihu.com/p/684273410>
+ <https://www.bilibili.com/read/cv32154318/>

+ <https://mp.weixin.qq.com/s?__biz=MzkyMDU4ODYwMQ==&mid=2247483827&idx=1&sn=49b4d74d231ca2b29f86adcd1985c5d6&chksm=c191d9e5f6e650f387117509f4ce46dae64ce50fb4a0e135bdc41376440c5e904d61a369972b&token=825065677&lang=zh_CN#rd>

+ <https://juejin.cn/post/7343902139822096420>


## 修正

+ 修正:

  `setup.sh` 文件需要添加命令:

  ```sh
  chmod +x debian12_aarch64/usr/lib/aarch64-linux-gnu/ld-linux-aarch64.so.1
  ```

  否则可能会遇到错误:

  ```
  proot error: execve("/usr/bin/deno"): Function not implemented
  proot info: possible causes:
    * the program is a script but its interpreter (eg. /bin/sh) was not found;
    * the program is an ELF but its interpreter (eg. ld-linux.so) was not found;
    * the program is a foreign binary but qemu was not specified;
    * qemu does not work correctly (if specified);
    * the loader was not found or doesn't work.
  fatal error: see `proot --help`.
  ```

  ```
  proot error: execve("/usr/bin/deno"): Permission denied
  ```

TODO
