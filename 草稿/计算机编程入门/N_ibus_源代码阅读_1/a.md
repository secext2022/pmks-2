# ibus 源代码阅读 (1)

ibus 是一种 GNU/Linux 操作系统的输入法框架.
GNOME 桌面环境从 3.6 版本开始直接集成了 ibus,
所以在 GNOME 中使用 ibus 比较方便, 整体体验也比较好.

但是 ibus 的文档写的不好 (特别是几乎没有中文文档, 这点必须差评),
很多东西必须通过阅读源代码才能明白.
然而 ibus 使用 C 编程语言, GObject 以及 D-Bus,
这些结合起来使得阅读 ibus 的源代码比较费劲.

本文主要内容是 ibus 架构简介和启动初始化部分.

----

相关链接:

TODO


## 目录

+ 1 ibus 架构简介

  - 1.1 安装 ibus
  - 1.2 systemd user 服务
  - 1.3 D-Bus 多进程架构
  - 1.4 输入法接口模块

+ 2 ibus 源码分析

  - 2.1 下载 ibus 源代码
  - 2.2 D-Bus 地址
  - 2.3 使用 Bustle 抓包分析
  - 2.4 从 SetGlobalEngine 作为入口分析
  - 2.5 从 ibus-libpinyin 入手进行分析

+ 3 使用 rust 实现 ibus 输入法

  - 3.1 获取 D-Bus 地址
  - 3.2 连接 ibus
  - 3.3 注册 engine factory
  - 3.4 实现 CreateEngine

+ 4 总结与展望

TODO
