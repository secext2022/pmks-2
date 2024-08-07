# 如何了解计算机的底层工作原理 ?

本文来自于在知乎的一个回答: <https://www.zhihu.com/question/661645906/answer/3566556594>

以下为原文内容:

----

谢邀.

**计算机** (computer) 根据信号的类型,
可以分为 **模拟计算机** (处理连续的模拟信号),
**数字计算机** (处理离散的数字信号),
**量子计算机** (处理量子叠加态的量子比特) 等.

根据计算使用的物理原理, 又可以分为 **机械计算机**,
**继电器计算机**, **电子管计算机**, **晶体管计算机** 等.
根据计算使用的数字的进制, 又可以分为 **二进制计算机**,
**平衡三进制计算机** (苏联曾经搞过) 等.

目前最常用的计算机, 属于 **数字计算机**, **晶体管计算机**,
**二进制计算机**. 又分为许多种具体的产品形态, 比如 **超级计算机**,
**服务器**, **工作站**, **PC** (台式机/笔记本/迷你主机), **手机**,
平板, **路由器**, **电视盒子**, **单板机** (SBC, 比如 香橙派),
**单片机** (MCU, 比如 ch32v003) 等.

计算机的工作原理, 数学上主要基于 **图灵机**.
图灵机是一种高度抽象的计算机器,
目前的计算机可以认为是图灵机的具体实现.
在实现方面, 大部分计算机使用 **冯诺依曼** 结构,
也就是整个计算机 (硬件) 分为 **主机** (**CPU** 和 **内存**) 以及
**输入输出设备** (比如 硬盘, 网卡, 显示器, 键盘鼠标 等).
没错, **硬盘** (或者 SSD) 也是 输入输出 (**IO**) 设备 !

----

由于计算机的复杂度很高, 一个使用很广泛的应对方法是 **分层抽象**,
以及 **分治** (把一个复杂的大问题, 划分成多个简单的小问题).
所以计算机分为很多抽象层次, 以及很多功能模块.
大的功能模块里面又分为小的功能模块, 小的功能模块再进一步细分.

计算机 (系统) 整体上分为 **硬件** (hardware) 和 **软件** (software).
硬件就是物理实体, 物理器件, 比如电源, 主板, CPU, 内存条, 硬盘,
显卡, 数据线 (**总线**, bus) 等.
软件就是 **程序** (program) 和 **数据** (data).
然而程序也是一种特殊的数据.
冯诺依曼计算机使用 **存储程序** 的工作原理,
程序和数据 **不加区分** 的存储在内存 (memory) 中,
只有 CPU (中央处理器) 具体执行的时候, 才明确哪些是指令, 哪些是数据.

软件也分为许多层, 比如 **固件** (firmware, 比如 BIOS/UEFI),
**操作系统** (比如 GNU/Linux, Android, Windows 等),
**应用软件** (比如 浏览器, 视频播放器, 文本编辑器, 图片编辑器,
3D 建模软件 等).

----

要想搞清楚计算机的工作原理,
就要分别学习 `硬件` 和 `软件` 的工作原理.

硬件的底层工作原理, 是物理上的电子电路.
此处推荐 《**模拟电路**》 和 《**数字电路**》 这两本书.
模拟电路主要讲更底层的电路工作原理, 比如 电阻, 电容, 电感,
**晶体管** (二极管, 三极管, MOS 管) 的工作原理,
直流 和 交流 (比如 阻抗 的概念) 的工作原理等.
关于计算机的电源 (供电) 部分, 可以去学习一下 **开关电源**,
还有 DC-DC 降压/升压电路, LDO 稳压电路等.
模拟电路部分还有 **运算放大器** (OPA) 比较重要.
模拟电路和数字电路的接口部分,
**ADC** (模拟-数字转换) 和 **DAC** (数字-模拟转换) 比较重要.

向上一个层次, 来到了数字电路,
也就是处理 0 和 1 这种二进制信号的电路.
数字电路的底层是 **门电路**, 也就是逻辑门.
具有 **与** (and), **或** (or), **非** (not), **异或** (xor)
等逻辑门.
门电路主要使用晶体管和电阻来搭建, 并且工作在交流模式 (频繁开/关).
所以, 前面需要学好模拟电路, 才能理解数字电路的工作原理.
与门: 输入的多个二进制数字 (1 位), 全部为 1, 输出才为 1,
否则输出 0.
或门: 输入的只要有一个为 1, 输出就为 1, 只有输入全 0 才输出 0.
非门: 反转, 输入 0 输出 1, 输入 1 输出 0. 异或: 相同为 0, 不同为 1.

门电路是数字计算的基础,
比如使用这些逻辑门可以构建 **半加器** 和 全加器,
实现多位二进制数字的 **加法**.
在计算机之中, 整数使用 **补码** 表示, 所以 **减法** 使用加法实现.
**乘法** 和 **除法** 使用加减法来实现.
小数使用 **浮点数** (比如 IEEE-754) 来表示.
好了, 计算机现在可以计算加减乘除啦 ~

然后是 **触发器** 和 **锁存器**, 可以用来构建内存单元,
也就是存储一个二进制数字 (0 或 1).
然后再配合 **译码器**, 内存就做好啦 ~
这种快速, 但高成本的内存, 称为静态内存 (**SRAM**),
比如 CPU 内的 **寄存器** (register) 和
高速缓存 (L1 **cache**, L2, L3) 就使用 SRAM.
内存条是一种成本更低的动态内存 (DRAM),
每个内存单元使用一个电容和一个晶体管.
虽然成本低, 但是电容会慢慢放电, 需要定期刷新.

复杂数字电路的工作需要 **时钟信号** (clock) 的驱动,
这就构成了 **时序数字电路**.
时钟信号的产生, 通常使用 **晶振** (石英晶体震荡器),
配合 **锁相环** (PLL), 分频电路等实现.

向上一个层次, 就来到了 CPU (中央处理器) 的结构和工作原理.
CPU (单个核心) 的组成部分有 **运算器** (ALU,
用来进行加减乘除等数字计算), 寄存器 (用来暂存计算结果),
缓存 (用来解决内存太慢的问题), 指令译码器 (根据指令产生控制信号) 等.

CPU 的工作原理, 简单来说就是一条接一条的不停执行 **指令** (instruct).
比如计算加法/减法的运算指令,
把数据在寄存器和内存之间复制的 load / store 指令,
控制程序执行流程的条件判断指令和跳转指令等.
执行一条指令的过程, 可以分为 **取指** (从内存中读取指令), 译码,
执行, 写回结果等.
现代处理器, 为了尽可能加快指令的执行,
追求高 IPC (每时钟周期执行的指令条数), 采用了超标量流水线,
分支预测, 乱序执行, 多发射等加速技术,
造成了 幽灵, 熔断 等硬件级别的安全漏洞, 给黑客们打开了大门.

现代硬件, 由于复杂度很高, 早已放弃了手工设计电路.
而是首先通过 **硬件描述语言** (比如 verilog, CHISEL 等)
进行逻辑设计 (RTL, 寄存器-传输级别), 然后使用编译器进行 **综合**,
生成实际的门电路.
如果要更详细的了解这一方面, 可以去玩玩 **FPGA**,
动手设计实现一颗简单的 CPU 出来, 加油 ~

到这里, 我们就有了一大堆数字电路,
但是怎么把这些数字电路制造出来呢 ?
现代计算机使用超大规模 **集成电路** (IC), 也就是 **芯片**.
这方面可以去学习 **微纳加工技术**, 了解芯片是如何从 **晶圆** 开始,
通过 磨平 (CMP), 光刻, 化学气相沉积 (CVD), 刻蚀, 溅射,
离子注入等工艺, 一步一步的制造出来的.
晶圆制造好以后, 经过 **封测** (封装测试), 就形成了可以使用的芯片.

有了芯片, 再使用 KiCad 画一张印刷电路板 (PCB),
使用嘉立创打样, 然后把芯片, 电阻, 电容等元件焊接在电路板上,
一个小巧的计算机就造出来啦.

----

向上一个层次, 来到了软件部分. 软件最底层的部分,
也就是和硬件 (CPU) 的接口, 是 **指令集**.
此处建议去学习 **RISC-V** 指令集的文档.
RISC-V 是新的开源指令集, 最近几年应用越来越广了.
因为是新的指令集, 没有沉重的历史包袱, 设计比较整齐,
基础指令只有大约 40 条, 是入门学习的很好选择 !

然后就是 **汇编语言**. 汇编语言和 CPU 指令基本上是一一对应的,
学习汇编语言可以详细了解指令集和 CPU 的编程方法,
对于学习计算机的底层原理帮助很大 !

使用汇编语言虽然可以编写程序,
但是存在 **开发效率** 和 **可移植** 的问题.
使用汇编写程序太耗费时间, 太慢了.
并且不同 CPU 可能使用不同的指令集 (比如目前有 x86_64,
ARM (aarch64), RISC-V 等), 而一种汇编语言只对应一种指令集.
使用汇编写的程序, 无法在另一种指令集的 CPU 上运行 !

于是就有了 **高级语言** (比如 C, python, JavaScript 等),
使用高级语言编写程序就简单方便快多了 !
开发效率和可移植的问题就解决了.
但是, 高级语言 **源代码** (source code)
主要是为了方便 **人类** 阅读的, 计算机无法直接执行,
需要首先 **编译** 成机器指令, CPU 才可以运行.
**编译器** (compiler) 就是干这个活儿的,
此处建议学习 《**编译原理**》, 了解编译器的具体结构和工作原理.
有的高级语言, 是 **解释执行** 的, 比如 python 和 JavaScript.
解释执行用的还是编译原理, 比如 v8 虚拟机就有 JIT (即时编译) 技术,
通过在后台 "偷偷" 编译代码, 实现比直接解释执行快很多的速度.

向上一个层次, 来到了 **操作系统** (OS).
此处建议学习 GNU/Linux 操作系统, 因为这个系统整体都是开源的,
可以阅读源代码, 方便学习.
操作系统最底层的部分是 **内核** (kernel), 比如 Linux 就是一个内核.
操作系统的主要功能有: 进程调度 (CPU 管理), 内存管理, 设备驱动程序,
文件系统, 网络协议栈 等.
建议详细了解系统软件的组成结构 (都有哪些部分), 和计算机的启动过程.

向上一个层次, 来到了 **应用软件**.
此处可以根据自己的具体需求, 开发一些小工具.
建议学习 web 开发技术 (HTML, CSS, JS).
web 技术应用广泛, 不仅可以用来做网页 (浏览器), 小程序,
还可以写服务器 (node.js, deno), 制作小工具 (electronjs),
编写输入法 (比如 胖喵拼音) 等.
**数据库** 技术也是很重要的, 建议去学习 **PostgreSQL**.

另外, 学习单片机 (嵌入式) 的开发,
对于了解计算机的底层原理也有很大好处.
因为单片机就是一个很小的, 简单的计算机. 麻雀虽小, 五脏俱全.
单片机因为比较简单, 学习起来也比较容易, 适合入门.
此处推荐 **ch32v** 系列单片机, 比如 ch32v003, ch32v203,
ch32v307 等型号.
这些单片机使用 RISC-V 指令集, 可以在学习单片机的同时,
顺便把 RISC-V 指令集也学了.
并且这些单片机很便宜, 比如 ch32v003 只要 0.5 元一个,
开发板也在 10 元左右.
花小钱, 办大事 (学习计算机), 对穷人很友好, 强烈推荐 !!

好了, 到这里, 对计算机的组成结构和工作原理, 已经有了基本的了解了.
对哪个领域感兴趣, 再去继续深入就好啦, 完结撒花 ~

----

本文使用 CC-BY-SA 4.0 许可发布.
