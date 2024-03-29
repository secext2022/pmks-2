# 多种双拼方案的实现

就像 GNU/Linux 用户, 虽然比例小, 却又分散为一堆不同的发行版.
双拼用户在拼音输入法之中的比例也很小, 同时也分为各种不同的双拼方案.

那么作为一个 **双拼** 输入法, 最重要的事情是什么呢 ?
嗯, 那当然是支持自定义双拼方案 !
实际上也就是帮助双拼用户继续分散成更多的不同的双拼方案 .. .
无论如何, 提高生物多样性对生态系统应该是好事吧.

本文介绍一个拼音输入法对多种不同双拼方案的实现 (支持).

----

相关文章:

+ 《双拼 (自然码) 的简单实现》

  TODO

+ 《多平台拼音输入法软件的开发》

  TODO


## 目录

+ 1 前言

+ 2 具体的双拼方案

  - 2.1 自然码

  - 2.2 国家标准双拼

  - 2.3 小鹤双拼

  - 2.4 微软双拼

  - 2.5 搜狗双拼

+ 3 总结与展望


## 1 前言

今天发布了新版本, 对界面做了一点小小的改动:

![界面的小改动](./图/1-ui-1.png)

右上角添加了一个小按钮, 点击之后就会打开设置窗口:

![设置窗口](./图/1-ui-2.png)

在左侧可以切换具体的功能界面.


## 2 具体的双拼方案

### 2.1 自然码

**自然码** 是一个古老 (上个世纪) 的双拼方案.
因为窝自己用的就是自然码, 所以这个输入法首先支持的就是自然码.

![自然码键位图 (qwerty)](./图/21-kbl-1.png)

这是自然码的键位图 (qwerty), 其中声母用 **橙色** 显示,
韵母用 **蓝色** 显示.
当然也可以切换为别的键盘布局:

![自然码键位图 (abcd7109)](./图/21-kbl-2.png)

这个键盘布局被窝称为 `abcd7109`, 这是一种很复古 (上上个世纪) 的设计.

![自然码键位图 (dvorak)](./图/21-kbl-3.png)

这是 dvorak 键盘布局.

### 2.2 国家标准双拼

也就是 `GB/T 34947-2017`, 键位图如下:

![国家标准双拼键位图](./图/22-2p-1.png)

不知道用这个的人多不多, 但毕竟是国家标准嘛.
支持一种双拼方案也就只是分分钟的事儿, 所以就顺便支持了.

这个双拼方案和自然码的区别很大.

### 2.3 小鹤双拼

![小鹤双拼键位图](./图/23-2p-1.png)

小鹤双拼在网上的讨论比较多, 可能用的人比较多吧.

这个双拼方案和自然码的区别很大.

### 2.4 微软双拼

![微软双拼键位图](./图/24-2p-1.png)

这个双拼方案和自然码的区别比较小.
区别有 `T`, `Y`, `O`, `;`, `V` 这几个键.

### 2.5 搜狗双拼

![搜狗双拼键位图](./图/25-2p-1.png)

这个双拼方案和自然码的区别很小.
区别有 `Y`, `O`, `;` 这几个键.

----

最后, 当然要支持自定义双拼表啦 ~

![自定义双拼表](./图/25-2p-2.png)

双拼表级别的自定义, 可以提供很大的灵活度,
理论上可以支持所有的双拼方案.

关于如何制作双拼表, 详见 《双拼 (自然码) 的简单实现》 文章.


## 3 总结与展望

本文对多种常见的双拼方案进行了实现, 有些双拼方案和自然码很接近.
本文验证了文章 《双拼 (自然码) 的简单实现》 中的说法,
文中的代码只需很少的修改, 即可生成新的双拼表.

不仅支持多种双拼方案, 还支持多种键盘布局, 这就是给用户更多选择的权利.
自定义双拼表更加灵活.

由于窝自己使用自然码, 一个人基本上只能固定使用一种双拼方案,
所以对别的双拼方案缺乏测试.

欢迎大家体验试用, 发现 BUG 哦 ~~

----

彩蛋 1: 圆周率日纪念版

![版本历史](./图/3-v-1.png)

在 3 月 14 日发布 0.1.5 版本, 3.1415 .. .
所以, 这个版本应该被命名为圆周率日纪念版 (确信) !

版本号不连续, 只是因为没有发布, 那些版本都是真实存在的:

![tag 列表](./图/3-v-2.png)

所以, 绝对不是故意在今天发这个版本号的, 只是巧合, 巧合 .. .

相关文章: 《发布 flatpak 应用 (flathub)》

TODO

----

彩蛋 2: 同款输入测量表格

![输入测量 (1)](./图/3-m-1.png)

![输入测量 (2)](./图/3-m-2.png)

一个是正常使用 (flatpak) 的用户数据库, 一个是测试数据库,
所以有 2 组数据, 需要加起来.

相关文章: 《多平台拼音输入法软件的开发》

TODO

----

彩蛋 3: 后院起火, 老公跑了, 去追老公导致本文的发布时间推迟了一天.
在此对各位粉丝说声抱歉.

----

本文使用 CC-BY-SA 4.0 许可发布.
