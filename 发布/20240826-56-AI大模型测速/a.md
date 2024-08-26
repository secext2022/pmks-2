# 本地运行 AI 有多慢 ? 大模型推理测速 (llama.cpp, Intel GPU A770)

上文说到, **天下苦 N 卡久矣**, 直接使用 CPU 推理又太慢.
那么, 在没有 N 卡的情况下, 本地运行 AI (神经网络) 大模型,
能够达到怎样的速度 ?

----

同志们好, 欢迎来到 胖喵穷人实验室 !
这里专注于 **低成本**, **低难度**, **低风险** 的 "三低" 小实验.

```
胖喵穷人实验室 (PM-PLab-E)

正式名称: 紫腹巨蚊 (Toxorhynchites gravelyi) 系列
  穷人 (Poor people) 实验室
```

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 56 号作品. )

**注意: 本文的测试结果仅供参考**, 重点是测量的方法和过程.
硬件配置, 软件/驱动的版本, 运行的模型, 设置的参数, 甚至环境温度等很多因素,
都可能会影响实际运行速度.

----

相关文章:

+ 《编译运行 llama.cpp (vulkan, Intel GPU SYCL)》

  TODO

+ 《QEMU/KVM 虚拟机显卡透传 (vfio-pci)》

  TODO

+ 《自制神之嘴: fish-speech 容器镜像 (文本转语音 AI 大模型)》

  TODO


## 目录

+ 1 背景知识和测量方法

  - 1.1 模型量化
  - 1.2 模型选择 (llama2-7B.q4, qwen2-7B.q8, gguf)
  - 1.3 llama.cpp 软件版本 (b3617, avx2, vulkan, SYCL)

+ 2 软硬件配置

  - 2.1 笔记本 (4 号 PC) i5-6200U (ArchLinux)
  - 2.2 服务器 (5 号) e5-2650v3 (Fedora CoreOS)
  - 2.3 台式机 (6 号 PC) r5-5600g (ArchLinux)
  - 2.4 虚拟机 (6 号) A770 (16GB) Ubuntu 22.04

+ 3 详细测量过程

  - 3.1 CPU (i5-6200U, 2C/4T/2.8GHz) x86_64 AVX2
  - 3.2 CPU (E5-2650v3, 10C/10T/3.0GHz) x86_64 AVX2
  - 3.3 CPU (r5-5600g, 6C/12T/4.4GHz) x86_64 AVX2
  - 3.4 iGPU (Intel HD520, i5-6200U) vulkan
  - 3.5 iGPU (AMD Radeon Vega 7, r5-5600g) vulkan
  - 3.6 dGPU (A770) vulkan
  - 3.7 dGPU (A770) SYCL
  - 3.8 Windows (CPU) r5-5600g AVX2
  - 3.9 Windows (GPU) A770 vulkan

+ 4 结果对比

  - 4.1 CPU 运行
  - 4.2 iGPU 运行
  - 4.3 dGPU (A770) 运行
  - 4.4 Linux 和 Windows 对比

+ 5 总结与展望


## 1 背景知识和测量方法

基于 **神经网络** (Neural Network) 的 AI 模型,
其底层的运算主要是 **乘法** 和 **加法** (矩阵相乘).
神经网络通常分为多层 (深度神经网络), 每层包含许多 "神经元" (感知机).
通常神经网络的各层从前向后依次连接 (前馈神经网络),
而同一层的神经元之间没有直接连接.

所以, 神经网络的每一层需要按先后顺序计算, 算完一层才能算下一层.
但是同一层内部却可以大规模 **并行运算**, 加快速度.

所谓 **大模型**, 顾名思义, 就是模型很大.
比如 **7B** 模型有 70 亿个参数 (`B` 表示 10 亿),
目前最先进的大模型参数超过千亿 (比如 400B 模型).
**参数** 是一个数字 (权重), 表示两个神经元之间连接的强弱,
比如 `0.0` 表示连接很弱, `1.0` 表示连接很强.
大模型的层数很多, 每层之中的神经元很多, 神经元之间的连接, 也就是参数, 自然也很多.

----

模型大, 参数多, 运算量也很大, 如何计算是个很大的困难.

CPU 的工作方式是串行计算, 也就是一个接一个的计算, 所以速度比较慢.
即使是多核 CPU, 同时能够进行的计算也不是很多, 比如 8 核 16 线程,
可以简单理解为同时只能进行 16 个计算.

GPU (显卡) 的核心就很多了, 比如几百个甚至几千个计算核心 (流处理器 SM),
很适合大规模并行计算.
所以 N 卡 (CUDA) 才会那么厉害, 在 AI 大模型时代一骑绝尘.

不过 CPU 并没有坐以待毙, 这边有 **SIMD** (单指令多数据) 技术.
虽然 CPU 是一条接一条执行指令的, 这个祖宗之法不可变,
但是如果一条指令能够同时计算多个数据, 那么速度不就快了 ?
比如 x86_64 CPU 的 avx 指令集, 能够同时计算 128bit 数据,
avx2 指令集可以计算 256bit, 最新的 avx512 指令集则增加到了 512bit (宽度).

除了 x86_64, 别的 CPU 也有 SIMD 技术, 比如 ARM 的 NEON 指令集,
RISC-V 的 `V` 扩展 (向量指令集).
其中 RISC-V 的向量指令, 采用动态宽度设计,
不像 x86_64 那样每次增加宽度都要推出新的指令集,
RISC-V 的指令可以直接适应新的更强大的硬件, 所以未来可能会很好的发展.

----

神经网络在模型搭建好 (设计好模型结构) 之后,
主要分为 **训练** (training) 和 **推理** (inference) 这两个阶段.
训练可以简单理解为制造成品模型的过程, 而推理是实际使用这个模型.

模型设计好之后, 这个模型有多少层, 每层有多少神经元, 神经元之间如何连接,
这些已经确定了, 也就是一共有多少参数确定了, 比如模型有 7B 参数.
但是每个参数的具体数值还是不知道的 (也就是比如有 70 亿个未知数).

这么多参数, 人工设定每一个参数的具体数值显然是不可能的.
训练模型就是 **自动** 获得参数的具体数值的过程.
通过给模型投喂大量数据 (训练集), 使用损失函数, 反向传播, **梯度下降** 等方法,
一步一步逐渐调整模型的参数, 最终让模型能够得到一个比较高的准确率.
这个过程又被称为 "机器学习".

对于固定大小的模型, 投喂的训练数据越多, 训练的时间 (步数) 越长, 模型的效果越好.
如果训练数据太少, 很可能只能获得一个智障.

训练大模型并不是普通人能够玩的起的:
首先需要准备很多 TB 的训练数据, 除了收集数据, 还要对数据进行清洗, 整理, 标注等.
然后需要大规模硬件, 比如成千上万张显卡, 消耗很多很多电能, 才能完成模型的训练.
所以训练大模型超级费钱, 比如训练一个模型需要千万甚至上亿美元.

----

模型训练好之后, 使用起来就容易多了. 如果模型不是特别大, 只需要一张显卡即可运行.
对于更小的模型, 消费级硬件, 甚至 CPU 都可以运行.

这也是普通人更容易参与的事情: 在本地运行 AI 大模型 (推理).

为什么非要在本地运行 ? 直接使用在线的服务不好嘛 ?
嗯, 这个问题, 就和有了网盘, 为什么还要买硬盘, 组建 NAS 存储服务器, 差不多.

+ (1) 成本问题.
  与在线服务相比, 购买硬件 (特别是二手硬件) 在本地运行, 有些情况下更便宜.

+ (2) 自主可控和靠谱程度.
  在线服务说关就关, 存储的文件说丢就丢. 在本地运行的话, 什么时候关, 自己说了算.

+ (3) 模型定制及个性化选项. 本地运行, 有更丰富的模型可供选择,
  甚至还可以考虑模型 **微调** (fine tuning) 等高级玩法.

### 1.1 模型量化

训练时, 模型的参数通常用 `f32` (32 位浮点数) 或 `f16` (16 位浮点数)
等高精度格式存储.
但是这导致模型占用很大的存储空间, 比如 7B 模型 f32 存储大约 28GB,
f16 存储大约 14GB, 高精度数字也需要消耗更多的计算资源.

所以就有了模型量化技术, 通过降低一部分参数的精度, 减小存储空间占用, 降低计算量.
比如 8bit 量化, 一个参数只用 8 位二进制存储, 类似的还有 4bit, 2bit 甚至 1bit.

模型量化因为降低了参数的精度, 会导致模型变差 (准确度降低),
但是合理的量化不会导致模型变差太多, 仍然可以正常使用.
同时因为量化显著降低了存储大小, 加快了运行速度, 使得消费级的硬件也可以使用.
所以模型量化还是很香的.

### 1.2 模型选择 (llama2-7B.q4, qwen2-7B.q8, gguf)

此处选择了两个 AI 语言模型 (生成文本), 从这里下载:
<https://hf-mirror.com/TheBloke/Llama-2-7B-GGUF>
<https://hf-mirror.com/Qwen/Qwen2-7B-Instruct-GGUF>

下载的模型文件:

```sh
> ls -l

-r--r--r-- 1 s2 s2 4081004224  8月19日 13:20 llama-2-7b.Q4_K_M.gguf
-r--r--r-- 1 s2 s2 8098522912  8月20日 09:52 qwen2-7b-instruct-q8_0.gguf
```

其中 `gguf` 是 `llama.cpp` 推出的模型格式, 只需要一个文件即可运行, 很方便.

+ `llama-2-7b.Q4_K_M.gguf`:
  这个是 llama-2, 国外开源的英文模型. 参数约 7B, 采用 4bit 量化.
  模型文件大小约 4GB, 运行 (A770) 占用显存约 7GB.

  这个是比较小的模型, 运行起来比较容易, 同时模型质量也不会太差.

+ `qwen2-7b-instruct-q8_0.gguf`:
  这个是千问 2, 国产开源的模型, 中文能力比较好. 参数约 7B, 采用 8bit 量化.
  模型文件大小约 8GB, 运行 (A770) 占用显存约 12GB.

  这个模型相对就比较大了, 更大的模型就难以运行了.
  因为如果模型继续增大, 占用的显存很可能会超过 16GB,
  此时就需要很贵的高端显卡 (比如 4090) 才可以运行.

### 1.3 llama.cpp 软件版本 (b3617, avx2, vulkan, SYCL)

llama.cpp 是一个用来运行 (推理) AI 大语言模型的开源软件, 支持多种后端:

+ CPU 后端, 可以使用 SIMD 指令集进行加速.
  比如 x86_64 CPU 的 avx2 指令集.

+ GPU 通用后端. 比如 vulkan, 通过使用 **计算着色器** (compute shader),
  支持很多种不同的显卡.

+ GPU 专用后端. 这种只支持一种显卡, 进行专门的优化.
  比如 N 卡的 CUDA, A 卡的 ROCm, Intel 的 SYCL 等.

  本文使用 SYCL 后端在 A770 显卡运行.

----

本文使用的版本是 `b3617`, 从这里下载:
<https://github.com/ggerganov/llama.cpp/releases>

其中用于 GNU/Linux 系统的 vulkan 后端和 SYCL 后端没有官方编译的版本,
所以是自己编译的, 详见文章 《编译运行 llama.cpp (vulkan, Intel GPU SYCL)》.

其中编译 SYCL 后端的 `Dockerfile` 如下:

```sh
# llama.cpp SYCL
FROM ubuntu-intel-base as build

WORKDIR /app
COPY llama.cpp-b3617 .

RUN . /opt/intel/oneapi/setvars.sh && \
    cmake -B build -DGGML_SYCL=ON -DCMAKE_C_COMPILER=icx -DCMAKE_CXX_COMPILER=icpx -DBUILD_SHARED_LIBS=OFF && \
    cmake --build build --config Release --target llama-cli

# 阶段 2
FROM ubuntu-intel-base as runtime

COPY --from=build /app/build/bin/llama-cli /usr/bin/llama-cli

CMD /bin/bash
```

这是编译 `f32` 版本的. 编译 `f16` SYCL 版本使用如下命令:

```sh
cmake -B build -DGGML_SYCL=ON -DGGML_SYCL_F16=ON -DCMAKE_C_COMPILER=icx -DCMAKE_CXX_COMPILER=icpx -DBUILD_SHARED_LIBS=OFF
```

注意多了 `-DGGML_SYCL_F16=ON` 参数.


## 2 软硬件配置

为了使测量结果更容易复现, 本章节详细描述运行设备的软硬件配置情况.

### 2.1 笔记本 (4 号 PC) i5-6200U (ArchLinux)

CPU: Intel Core i5-6200U

```sh
> lscpu
架构：                    x86_64
  CPU 运行模式：          32-bit, 64-bit
  Address sizes:          39 bits physical, 48 bits virtual
  字节序：                Little Endian
CPU:                      4
  在线 CPU 列表：         0-3
厂商 ID：                 GenuineIntel
  型号名称：              Intel(R) Core(TM) i5-6200U CPU @ 2.30GHz
    CPU 系列：            6
    型号：                78
    每个核的线程数：      2
    每个座的核数：        2
    座：                  1
    步进：                3
    CPU(s) scaling MHz:   30%
    CPU 最大 MHz：        2800.0000
    CPU 最小 MHz：        400.0000
    BogoMIPS：            4800.00
    标记：                fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge m
                          ca cmov pat pse36 clflush dts acpi mmx fxsr sse sse2 s
                          s ht tm pbe syscall nx pdpe1gb rdtscp lm constant_tsc 
                          art arch_perfmon pebs bts rep_good nopl xtopology nons
                          top_tsc cpuid aperfmperf pni pclmulqdq dtes64 monitor 
                          ds_cpl vmx est tm2 ssse3 sdbg fma cx16 xtpr pdcm pcid 
                          sse4_1 sse4_2 x2apic movbe popcnt tsc_deadline_timer a
                          es xsave avx f16c rdrand lahf_lm abm 3dnowprefetch cpu
                          id_fault epb pti ssbd ibrs ibpb stibp tpr_shadow flexp
                          riority ept vpid ept_ad fsgsbase tsc_adjust bmi1 avx2 
                          smep bmi2 erms invpcid mpx rdseed adx smap clflushopt 
                          intel_pt xsaveopt xsavec xgetbv1 xsaves dtherm ida ara
                          t pln pts hwp hwp_notify hwp_act_window hwp_epp vnmi m
                          d_clear flush_l1d arch_capabilities
Virtualization features:  
  虚拟化：                VT-x
Caches (sum of all):      
  L1d:                    64 KiB (2 instances)
  L1i:                    64 KiB (2 instances)
  L2:                     512 KiB (2 instances)
  L3:                     3 MiB (1 instance)
NUMA:                     
  NUMA 节点：             1
  NUMA 节点0 CPU：        0-3
Vulnerabilities:          
  Gather data sampling:   Vulnerable: No microcode
  Itlb multihit:          KVM: Mitigation: VMX disabled
  L1tf:                   Mitigation; PTE Inversion; VMX conditional cache flush
                          es, SMT vulnerable
  Mds:                    Mitigation; Clear CPU buffers; SMT vulnerable
  Meltdown:               Mitigation; PTI
  Mmio stale data:        Mitigation; Clear CPU buffers; SMT vulnerable
  Reg file data sampling: Not affected
  Retbleed:               Mitigation; IBRS
  Spec rstack overflow:   Not affected
  Spec store bypass:      Mitigation; Speculative Store Bypass disabled via prct
                          l
  Spectre v1:             Mitigation; usercopy/swapgs barriers and __user pointe
                          r sanitization
  Spectre v2:             Mitigation; IBRS; IBPB conditional; STIBP conditional;
                           RSB filling; PBRSB-eIBRS Not affected; BHI Not affect
                          ed
  Srbds:                  Mitigation; Microcode
  Tsx async abort:        Not affected
```

内存: DDR3L-1600MHz 16GB (双通道, 8GB x2)

集成显卡: Skylake GT2 [HD Graphics 520]

操作系统: ArchLinux

```sh
> uname -a
Linux S2L 6.10.6-zen1-1-zen #1 ZEN SMP PREEMPT_DYNAMIC Mon, 19 Aug 2024 17:02:05 +0000 x86_64 GNU/Linux
```

### 2.2 服务器 (5 号) e5-2650v3 (Fedora CoreOS)

CPU: Intel Xeon E5-2650v3

```sh
fc-test@MiWiFi-RA74-srv:~$ lscpu
Architecture:             x86_64
  CPU op-mode(s):         32-bit, 64-bit
  Address sizes:          46 bits physical, 48 bits virtual
  Byte Order:             Little Endian
CPU(s):                   20
  On-line CPU(s) list:    0-9
  Off-line CPU(s) list:   10-19
Vendor ID:                GenuineIntel
  Model name:             Intel(R) Xeon(R) CPU E5-2650 v3 @ 2.30GHz
    CPU family:           6
    Model:                63
    Thread(s) per core:   1
    Core(s) per socket:   10
    Socket(s):            1
    Stepping:             2
    CPU(s) scaling MHz:   48%
    CPU max MHz:          3000.0000
    CPU min MHz:          0.0000
    BogoMIPS:             4589.44
    Flags:                fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge m
                          ca cmov pat pse36 clflush dts acpi mmx fxsr sse sse2 s
                          s ht tm pbe syscall nx pdpe1gb rdtscp lm constant_tsc 
                          arch_perfmon pebs bts rep_good nopl xtopology nonstop_
                          tsc cpuid aperfmperf pni pclmulqdq dtes64 monitor ds_c
                          pl vmx smx est tm2 ssse3 sdbg fma cx16 xtpr pdcm pcid 
                          dca sse4_1 sse4_2 x2apic movbe popcnt tsc_deadline_tim
                          er aes xsave avx f16c rdrand lahf_lm abm cpuid_fault e
                          pb pti intel_ppin ssbd ibrs ibpb stibp tpr_shadow flex
                          priority ept vpid ept_ad fsgsbase tsc_adjust bmi1 avx2
                           smep bmi2 erms invpcid cqm xsaveopt cqm_llc cqm_occup
                          _llc dtherm ida arat pln pts vnmi md_clear flush_l1d
Virtualization features:  
  Virtualization:         VT-x
Caches (sum of all):      
  L1d:                    320 KiB (10 instances)
  L1i:                    320 KiB (10 instances)
  L2:                     2.5 MiB (10 instances)
  L3:                     25 MiB (1 instance)
NUMA:                     
  NUMA node(s):           1
  NUMA node0 CPU(s):      0-9
Vulnerabilities:          
  Gather data sampling:   Not affected
  Itlb multihit:          KVM: Mitigation: VMX disabled
  L1tf:                   Mitigation; PTE Inversion; VMX conditional cache flush
                          es, SMT disabled
  Mds:                    Mitigation; Clear CPU buffers; SMT disabled
  Meltdown:               Mitigation; PTI
  Mmio stale data:        Mitigation; Clear CPU buffers; SMT disabled
  Reg file data sampling: Not affected
  Retbleed:               Not affected
  Spec rstack overflow:   Not affected
  Spec store bypass:      Mitigation; Speculative Store Bypass disabled via prct
                          l
  Spectre v1:             Mitigation; usercopy/swapgs barriers and __user pointe
                          r sanitization
  Spectre v2:             Mitigation; Retpolines; IBPB conditional; IBRS_FW; RSB
                           filling; PBRSB-eIBRS Not affected; BHI Not affected
  Srbds:                  Not affected
  Tsx async abort:        Not affected
```

内存: DDR4-2133MHz REG ECC 32GB (四通道, 8GB x4)

操作系统: Fedora CoreOS 40

```sh
fc-test@MiWiFi-RA74-srv:~$ uname -a
Linux MiWiFi-RA74-srv 6.9.11-200.fc40.x86_64 #1 SMP PREEMPT_DYNAMIC Thu Jul 25 18:17:34 UTC 2024 x86_64 GNU/Linux
fc-test@MiWiFi-RA74-srv:~$ rpm-ostree status
State: idle
warning: Failed to query journal: couldn't find current boot in journal
AutomaticUpdatesDriver: Zincati
  DriverState: active; periodically polling for updates (last checked Sat 2024-08-24 10:27:49 UTC)
Deployments:
● fedora:fedora/x86_64/coreos/stable
                  Version: 40.20240728.3.0 (2024-08-12T20:22:19Z)
               BaseCommit: 2098f40910d5d7c0171a8f7173d81cb070f4047e1e81d9d5228d5d62e24fe722
             GPGSignature: Valid signature by 115DF9AEF857853EE8445D0A0727707EA15B79CC
          LayeredPackages: smartmontools snapper systemd-networkd
fc-test@MiWiFi-RA74-srv:~$ free -h
               total        used        free      shared  buff/cache   available
Mem:            31Gi       1.3Gi       2.3Gi       9.8Mi        28Gi        29Gi
Swap:             0B          0B          0B
```

### 2.3 台式机 (6 号 PC) r5-5600g (ArchLinux)

CPU: AMD Ryzen 5 5600G with Radeon Graphics

```sh
> lscpu
架构：                    x86_64
  CPU 运行模式：          32-bit, 64-bit
  Address sizes:          48 bits physical, 48 bits virtual
  字节序：                Little Endian
CPU:                      12
  在线 CPU 列表：         0-11
厂商 ID：                 AuthenticAMD
  型号名称：              AMD Ryzen 5 5600G with Radeon Graphics
    CPU 系列：            25
    型号：                80
    每个核的线程数：      2
    每个座的核数：        6
    座：                  1
    步进：                0
    CPU(s) scaling MHz:   51%
    CPU 最大 MHz：        4464.0000
    CPU 最小 MHz：        400.0000
    BogoMIPS：            7785.61
    标记：                fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge m
                          ca cmov pat pse36 clflush mmx fxsr sse sse2 ht syscall
                           nx mmxext fxsr_opt pdpe1gb rdtscp lm constant_tsc rep
                          _good nopl xtopology nonstop_tsc cpuid extd_apicid ape
                          rfmperf rapl pni pclmulqdq monitor ssse3 fma cx16 sse4
                          _1 sse4_2 x2apic movbe popcnt aes xsave avx f16c rdran
                          d lahf_lm cmp_legacy svm extapic cr8_legacy abm sse4a 
                          misalignsse 3dnowprefetch osvw ibs skinit wdt tce topo
                          ext perfctr_core perfctr_nb bpext perfctr_llc mwaitx c
                          pb cat_l3 cdp_l3 hw_pstate ssbd mba ibrs ibpb stibp vm
                          mcall fsgsbase bmi1 avx2 smep bmi2 erms invpcid cqm rd
                          t_a rdseed adx smap clflushopt clwb sha_ni xsaveopt xs
                          avec xgetbv1 xsaves cqm_llc cqm_occup_llc cqm_mbm_tota
                          l cqm_mbm_local user_shstk clzero irperf xsaveerptr rd
                          pru wbnoinvd cppc arat npt lbrv svm_lock nrip_save tsc
                          _scale vmcb_clean flushbyasid decodeassists pausefilte
                          r pfthreshold avic v_vmsave_vmload vgif v_spec_ctrl um
                          ip pku ospke vaes vpclmulqdq rdpid overflow_recov succ
                          or smca fsrm debug_swap
Virtualization features:  
  虚拟化：                AMD-V
Caches (sum of all):      
  L1d:                    192 KiB (6 instances)
  L1i:                    192 KiB (6 instances)
  L2:                     3 MiB (6 instances)
  L3:                     16 MiB (1 instance)
NUMA:                     
  NUMA 节点：             1
  NUMA 节点0 CPU：        0-11
Vulnerabilities:          
  Gather data sampling:   Not affected
  Itlb multihit:          Not affected
  L1tf:                   Not affected
  Mds:                    Not affected
  Meltdown:               Not affected
  Mmio stale data:        Not affected
  Reg file data sampling: Not affected
  Retbleed:               Not affected
  Spec rstack overflow:   Vulnerable: Safe RET, no microcode
  Spec store bypass:      Mitigation; Speculative Store Bypass disabled via prct
                          l
  Spectre v1:             Mitigation; usercopy/swapgs barriers and __user pointe
                          r sanitization
  Spectre v2:             Mitigation; Retpolines; IBPB conditional; IBRS_FW; STI
                          BP always-on; RSB filling; PBRSB-eIBRS Not affected; B
                          HI Not affected
  Srbds:                  Not affected
  Tsx async abort:        Not affected
```

内存: DDR4-3200MHz 32GB (双通道, 16GB x2)

集成显卡: AMD Radeon Graphics (RADV RENOIR)

操作系统: ArchLinux

```sh
> uname -a
Linux a2 6.10.6-zen1-1-zen #1 ZEN SMP PREEMPT_DYNAMIC Mon, 19 Aug 2024 17:02:05 +0000 x86_64 GNU/Linux
```

### 2.4 虚拟机 (6 号) A770 (16GB) Ubuntu 22.04

详见文章 《QEMU/KVM 虚拟机显卡透传 (vfio-pci)》.

显卡: Intel Arc A770 (16GB)

```sh
a2@a2s:~$ clinfo -l
Platform #0: Intel(R) OpenCL Graphics
 `-- Device #0: Intel(R) Arc(TM) A770 Graphics
```

操作系统: Ubuntu 22.04

```sh
> ssh u2

a2@a2s:~$ uname -a
Linux a2s 6.8.0-40-generic #40~22.04.3-Ubuntu SMP PREEMPT_DYNAMIC Tue Jul 30 17:30:19 UTC 2 x86_64 x86_64 x86_64 GNU/Linux
```


## 3 详细测量过程

使用相同版本的 llama.cpp (`b3617`), 相同的模型文件, 在不同的设备上运行.

使用相同的输入 (提示词):

```sh
-p "hello, this is a very very long story"
```

因为生成长度会影响运行速度, 所以使用 `100`, `200`, `500`, `1000` 的生成长度,
用来覆盖常见的情况.

本章节比较长, 读者可以考虑跳过这一章节.

### 3.1 CPU (i5-6200U, 2C/4T/2.8GHz) x86_64 AVX2

在 4 号 PC (物理机) 上运行. 版本:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli --version
version: 3617 (a07c32ea)
built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
```

运行模型 `llama2-7B.q4`, 生成长度 `100`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 100
Log start
main: build = 3617 (a07c32ea)
main: built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
main: seed  = 1724500181
llama_model_loader: loaded meta data with 19 key-value pairs and 291 tensors from llama-2-7b.Q4_K_M.gguf (version GGUF V2)
llama_model_loader: Dumping metadata keys/values. Note: KV overrides do not apply in this output.
llama_model_loader: - kv   0:                       general.architecture str              = llama
llama_model_loader: - kv   1:                               general.name str              = LLaMA v2
llama_model_loader: - kv   2:                       llama.context_length u32              = 4096
llama_model_loader: - kv   3:                     llama.embedding_length u32              = 4096
llama_model_loader: - kv   4:                          llama.block_count u32              = 32
llama_model_loader: - kv   5:                  llama.feed_forward_length u32              = 11008
llama_model_loader: - kv   6:                 llama.rope.dimension_count u32              = 128
llama_model_loader: - kv   7:                 llama.attention.head_count u32              = 32
llama_model_loader: - kv   8:              llama.attention.head_count_kv u32              = 32
llama_model_loader: - kv   9:     llama.attention.layer_norm_rms_epsilon f32              = 0.000010
llama_model_loader: - kv  10:                          general.file_type u32              = 15
llama_model_loader: - kv  11:                       tokenizer.ggml.model str              = llama
llama_model_loader: - kv  12:                      tokenizer.ggml.tokens arr[str,32000]   = ["<unk>", "<s>", "</s>", "<0x00>", "<...
llama_model_loader: - kv  13:                      tokenizer.ggml.scores arr[f32,32000]   = [0.000000, 0.000000, 0.000000, 0.0000...
llama_model_loader: - kv  14:                  tokenizer.ggml.token_type arr[i32,32000]   = [2, 3, 3, 6, 6, 6, 6, 6, 6, 6, 6, 6, ...
llama_model_loader: - kv  15:                tokenizer.ggml.bos_token_id u32              = 1
llama_model_loader: - kv  16:                tokenizer.ggml.eos_token_id u32              = 2
llama_model_loader: - kv  17:            tokenizer.ggml.unknown_token_id u32              = 0
llama_model_loader: - kv  18:               general.quantization_version u32              = 2
llama_model_loader: - type  f32:   65 tensors
llama_model_loader: - type q4_K:  193 tensors
llama_model_loader: - type q6_K:   33 tensors
llm_load_vocab: special tokens cache size = 3
llm_load_vocab: token to piece cache size = 0.1684 MB
llm_load_print_meta: format           = GGUF V2
llm_load_print_meta: arch             = llama
llm_load_print_meta: vocab type       = SPM
llm_load_print_meta: n_vocab          = 32000
llm_load_print_meta: n_merges         = 0
llm_load_print_meta: vocab_only       = 0
llm_load_print_meta: n_ctx_train      = 4096
llm_load_print_meta: n_embd           = 4096
llm_load_print_meta: n_layer          = 32
llm_load_print_meta: n_head           = 32
llm_load_print_meta: n_head_kv        = 32
llm_load_print_meta: n_rot            = 128
llm_load_print_meta: n_swa            = 0
llm_load_print_meta: n_embd_head_k    = 128
llm_load_print_meta: n_embd_head_v    = 128
llm_load_print_meta: n_gqa            = 1
llm_load_print_meta: n_embd_k_gqa     = 4096
llm_load_print_meta: n_embd_v_gqa     = 4096
llm_load_print_meta: f_norm_eps       = 0.0e+00
llm_load_print_meta: f_norm_rms_eps   = 1.0e-05
llm_load_print_meta: f_clamp_kqv      = 0.0e+00
llm_load_print_meta: f_max_alibi_bias = 0.0e+00
llm_load_print_meta: f_logit_scale    = 0.0e+00
llm_load_print_meta: n_ff             = 11008
llm_load_print_meta: n_expert         = 0
llm_load_print_meta: n_expert_used    = 0
llm_load_print_meta: causal attn      = 1
llm_load_print_meta: pooling type     = 0
llm_load_print_meta: rope type        = 0
llm_load_print_meta: rope scaling     = linear
llm_load_print_meta: freq_base_train  = 10000.0
llm_load_print_meta: freq_scale_train = 1
llm_load_print_meta: n_ctx_orig_yarn  = 4096
llm_load_print_meta: rope_finetuned   = unknown
llm_load_print_meta: ssm_d_conv       = 0
llm_load_print_meta: ssm_d_inner      = 0
llm_load_print_meta: ssm_d_state      = 0
llm_load_print_meta: ssm_dt_rank      = 0
llm_load_print_meta: ssm_dt_b_c_rms   = 0
llm_load_print_meta: model type       = 7B
llm_load_print_meta: model ftype      = Q4_K - Medium
llm_load_print_meta: model params     = 6.74 B
llm_load_print_meta: model size       = 3.80 GiB (4.84 BPW) 
llm_load_print_meta: general.name     = LLaMA v2
llm_load_print_meta: BOS token        = 1 '<s>'
llm_load_print_meta: EOS token        = 2 '</s>'
llm_load_print_meta: UNK token        = 0 '<unk>'
llm_load_print_meta: LF token         = 13 '<0x0A>'
llm_load_print_meta: max token length = 48
llm_load_tensors: ggml ctx size =    0.14 MiB
llm_load_tensors: offloading 0 repeating layers to GPU
llm_load_tensors: offloaded 0/33 layers to GPU
llm_load_tensors:        CPU buffer size =  3891.24 MiB
..................................................................................................
llama_new_context_with_model: n_ctx      = 4096
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 10000.0
llama_new_context_with_model: freq_scale = 1
llama_kv_cache_init:        CPU KV buffer size =  2048.00 MiB
llama_new_context_with_model: KV self size  = 2048.00 MiB, K (f16): 1024.00 MiB, V (f16): 1024.00 MiB
llama_new_context_with_model:        CPU  output buffer size =     0.12 MiB
llama_new_context_with_model:        CPU compute buffer size =   296.01 MiB
llama_new_context_with_model: graph nodes  = 1030
llama_new_context_with_model: graph splits = 1

system_info: n_threads = 2 / 4 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 0 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 4096, n_batch = 2048, n_predict = 100, n_keep = 1


 hello, this is a very very long story. nobody wants to read this much. just tell me what happened.

(此处省略一部分)

llama_print_timings:        load time =    2666.87 ms
llama_print_timings:      sample time =       5.38 ms /   100 runs   (    0.05 ms per token, 18580.45 tokens per second)
llama_print_timings: prompt eval time =    1898.40 ms /    10 tokens (  189.84 ms per token,     5.27 tokens per second)
llama_print_timings:        eval time =   28113.06 ms /    99 runs   (  283.97 ms per token,     3.52 tokens per second)
llama_print_timings:       total time =   30034.85 ms /   109 tokens
Log end
```

运行模型 `llama2-7B.q4`, 生成长度 `200`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 200

(此处省略一部分)

llama_print_timings:        load time =    2703.62 ms
llama_print_timings:      sample time =      12.85 ms /   200 runs   (    0.06 ms per token, 15560.57 tokens per second)
llama_print_timings: prompt eval time =    1873.80 ms /    10 tokens (  187.38 ms per token,     5.34 tokens per second)
llama_print_timings:        eval time =   59352.84 ms /   199 runs   (  298.26 ms per token,     3.35 tokens per second)
llama_print_timings:       total time =   61281.14 ms /   209 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `500`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 500

(此处省略一部分)

llama_print_timings:        load time =    2706.04 ms
llama_print_timings:      sample time =      33.77 ms /   500 runs   (    0.07 ms per token, 14808.23 tokens per second)
llama_print_timings: prompt eval time =    1866.60 ms /    10 tokens (  186.66 ms per token,     5.36 tokens per second)
llama_print_timings:        eval time =  154145.54 ms /   499 runs   (  308.91 ms per token,     3.24 tokens per second)
llama_print_timings:       total time =  156146.19 ms /   509 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `1000`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 1000

(此处省略一部分)

llama_print_timings:        load time =    2912.39 ms
llama_print_timings:      sample time =      60.76 ms /  1000 runs   (    0.06 ms per token, 16457.65 tokens per second)
llama_print_timings: prompt eval time =    1870.87 ms /    10 tokens (  187.09 ms per token,     5.35 tokens per second)
llama_print_timings:        eval time =  335019.17 ms /   999 runs   (  335.35 ms per token,     2.98 tokens per second)
llama_print_timings:       total time =  337155.40 ms /  1009 tokens
```

----

运行模型 `qwen2-7B.q8`, 生成长度 `100`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 100
Log start
main: build = 3617 (a07c32ea)
main: built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
main: seed  = 1724501237
llama_model_loader: loaded meta data with 26 key-value pairs and 339 tensors from qwen2-7b-instruct-q8_0.gguf (version GGUF V3 (latest))
llama_model_loader: Dumping metadata keys/values. Note: KV overrides do not apply in this output.
llama_model_loader: - kv   0:                       general.architecture str              = qwen2
llama_model_loader: - kv   1:                               general.name str              = qwen2-7b-instruct
llama_model_loader: - kv   2:                          qwen2.block_count u32              = 28
llama_model_loader: - kv   3:                       qwen2.context_length u32              = 32768
llama_model_loader: - kv   4:                     qwen2.embedding_length u32              = 3584
llama_model_loader: - kv   5:                  qwen2.feed_forward_length u32              = 18944
llama_model_loader: - kv   6:                 qwen2.attention.head_count u32              = 28
llama_model_loader: - kv   7:              qwen2.attention.head_count_kv u32              = 4
llama_model_loader: - kv   8:                       qwen2.rope.freq_base f32              = 1000000.000000
llama_model_loader: - kv   9:     qwen2.attention.layer_norm_rms_epsilon f32              = 0.000001
llama_model_loader: - kv  10:                          general.file_type u32              = 7
llama_model_loader: - kv  11:                       tokenizer.ggml.model str              = gpt2
llama_model_loader: - kv  12:                         tokenizer.ggml.pre str              = qwen2
llama_model_loader: - kv  13:                      tokenizer.ggml.tokens arr[str,152064]  = ["!", "\"", "#", "$", "%", "&", "'", ...
llama_model_loader: - kv  14:                  tokenizer.ggml.token_type arr[i32,152064]  = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, ...
llama_model_loader: - kv  15:                      tokenizer.ggml.merges arr[str,151387]  = ["Ġ Ġ", "ĠĠ ĠĠ", "i n", "Ġ t",...
llama_model_loader: - kv  16:                tokenizer.ggml.eos_token_id u32              = 151645
llama_model_loader: - kv  17:            tokenizer.ggml.padding_token_id u32              = 151643
llama_model_loader: - kv  18:                tokenizer.ggml.bos_token_id u32              = 151643
llama_model_loader: - kv  19:                    tokenizer.chat_template str              = {% for message in messages %}{% if lo...
llama_model_loader: - kv  20:               tokenizer.ggml.add_bos_token bool             = false
llama_model_loader: - kv  21:               general.quantization_version u32              = 2
llama_model_loader: - kv  22:                      quantize.imatrix.file str              = ../Qwen2/gguf/qwen2-7b-imatrix/imatri...
llama_model_loader: - kv  23:                   quantize.imatrix.dataset str              = ../sft_2406.txt
llama_model_loader: - kv  24:             quantize.imatrix.entries_count i32              = 196
llama_model_loader: - kv  25:              quantize.imatrix.chunks_count i32              = 1937
llama_model_loader: - type  f32:  141 tensors
llama_model_loader: - type q8_0:  198 tensors
llm_load_vocab: special tokens cache size = 421
llm_load_vocab: token to piece cache size = 0.9352 MB
llm_load_print_meta: format           = GGUF V3 (latest)
llm_load_print_meta: arch             = qwen2
llm_load_print_meta: vocab type       = BPE
llm_load_print_meta: n_vocab          = 152064
llm_load_print_meta: n_merges         = 151387
llm_load_print_meta: vocab_only       = 0
llm_load_print_meta: n_ctx_train      = 32768
llm_load_print_meta: n_embd           = 3584
llm_load_print_meta: n_layer          = 28
llm_load_print_meta: n_head           = 28
llm_load_print_meta: n_head_kv        = 4
llm_load_print_meta: n_rot            = 128
llm_load_print_meta: n_swa            = 0
llm_load_print_meta: n_embd_head_k    = 128
llm_load_print_meta: n_embd_head_v    = 128
llm_load_print_meta: n_gqa            = 7
llm_load_print_meta: n_embd_k_gqa     = 512
llm_load_print_meta: n_embd_v_gqa     = 512
llm_load_print_meta: f_norm_eps       = 0.0e+00
llm_load_print_meta: f_norm_rms_eps   = 1.0e-06
llm_load_print_meta: f_clamp_kqv      = 0.0e+00
llm_load_print_meta: f_max_alibi_bias = 0.0e+00
llm_load_print_meta: f_logit_scale    = 0.0e+00
llm_load_print_meta: n_ff             = 18944
llm_load_print_meta: n_expert         = 0
llm_load_print_meta: n_expert_used    = 0
llm_load_print_meta: causal attn      = 1
llm_load_print_meta: pooling type     = 0
llm_load_print_meta: rope type        = 2
llm_load_print_meta: rope scaling     = linear
llm_load_print_meta: freq_base_train  = 1000000.0
llm_load_print_meta: freq_scale_train = 1
llm_load_print_meta: n_ctx_orig_yarn  = 32768
llm_load_print_meta: rope_finetuned   = unknown
llm_load_print_meta: ssm_d_conv       = 0
llm_load_print_meta: ssm_d_inner      = 0
llm_load_print_meta: ssm_d_state      = 0
llm_load_print_meta: ssm_dt_rank      = 0
llm_load_print_meta: ssm_dt_b_c_rms   = 0
llm_load_print_meta: model type       = ?B
llm_load_print_meta: model ftype      = Q8_0
llm_load_print_meta: model params     = 7.62 B
llm_load_print_meta: model size       = 7.54 GiB (8.50 BPW) 
llm_load_print_meta: general.name     = qwen2-7b-instruct
llm_load_print_meta: BOS token        = 151643 '<|endoftext|>'
llm_load_print_meta: EOS token        = 151645 '<|im_end|>'
llm_load_print_meta: PAD token        = 151643 '<|endoftext|>'
llm_load_print_meta: LF token         = 148848 'ÄĬ'
llm_load_print_meta: EOT token        = 151645 '<|im_end|>'
llm_load_print_meta: max token length = 256
llm_load_tensors: ggml ctx size =    0.15 MiB
llm_load_tensors: offloading 0 repeating layers to GPU
llm_load_tensors: offloaded 0/29 layers to GPU
llm_load_tensors:        CPU buffer size =  7717.68 MiB
........................................................................................
llama_new_context_with_model: n_ctx      = 32768
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 1000000.0
llama_new_context_with_model: freq_scale = 1
llama_kv_cache_init:        CPU KV buffer size =  1792.00 MiB
llama_new_context_with_model: KV self size  = 1792.00 MiB, K (f16):  896.00 MiB, V (f16):  896.00 MiB
llama_new_context_with_model:        CPU  output buffer size =     0.58 MiB
llama_new_context_with_model:        CPU compute buffer size =  1884.01 MiB
llama_new_context_with_model: graph nodes  = 986
llama_new_context_with_model: graph splits = 1

system_info: n_threads = 2 / 4 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 0 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 32768, n_batch = 2048, n_predict = 100, n_keep = 0


hello, this is a very very long story and it is very complicated.

(此处省略一部分)

llama_print_timings:        load time =    5355.79 ms
llama_print_timings:      sample time =      16.50 ms /   100 runs   (    0.17 ms per token,  6059.14 tokens per second)
llama_print_timings: prompt eval time =    1727.39 ms /     9 tokens (  191.93 ms per token,     5.21 tokens per second)
llama_print_timings:        eval time =   41066.65 ms /    99 runs   (  414.81 ms per token,     2.41 tokens per second)
llama_print_timings:       total time =   42914.72 ms /   108 tokens
Log end
```

运行模型 `qwen2-7B.q8`, 生成长度 `200`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 200

(此处省略一部分)

llama_print_timings:        load time =    4641.45 ms
llama_print_timings:      sample time =      34.69 ms /   200 runs   (    0.17 ms per token,  5765.85 tokens per second)
llama_print_timings: prompt eval time =    1735.51 ms /     9 tokens (  192.83 ms per token,     5.19 tokens per second)
llama_print_timings:        eval time =   84374.46 ms /   199 runs   (  423.99 ms per token,     2.36 tokens per second)
llama_print_timings:       total time =   86360.14 ms /   208 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `500`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 500

(此处省略一部分)

llama_print_timings:        load time =    5026.41 ms
llama_print_timings:      sample time =      91.64 ms /   500 runs   (    0.18 ms per token,  5456.37 tokens per second)
llama_print_timings: prompt eval time =    1713.90 ms /     9 tokens (  190.43 ms per token,     5.25 tokens per second)
llama_print_timings:        eval time =  214729.88 ms /   499 runs   (  430.32 ms per token,     2.32 tokens per second)
llama_print_timings:       total time =  217097.31 ms /   508 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `1000`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 1000

(此处省略一部分)

llama_print_timings:        load time =    4939.31 ms
llama_print_timings:      sample time =     194.02 ms /  1000 runs   (    0.19 ms per token,  5154.00 tokens per second)
llama_print_timings: prompt eval time =    1879.29 ms /     9 tokens (  208.81 ms per token,     4.79 tokens per second)
llama_print_timings:        eval time =  440575.12 ms /   999 runs   (  441.02 ms per token,     2.27 tokens per second)
llama_print_timings:       total time =  443841.74 ms /  1008 tokens
```

### 3.2 CPU (E5-2650v3, 10C/10T/3.0GHz) x86_64 AVX2

在 5 号 (物理机) 上运行. 版本:

```sh
fc-test@MiWiFi-RA74-srv:~/llama-cpp$ ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli --version
./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli: /lib64/libcurl.so.4: no version information available (required by ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli)
version: 3617 (a07c32ea)
built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
```

运行模型 `llama2-7B.q4`, 生成长度 `100`:

```sh
fc-test@MiWiFi-RA74-srv:~/llama-cpp$ ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 100
./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli: /lib64/libcurl.so.4: no version information available (required by ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli)
Log start
main: build = 3617 (a07c32ea)
main: built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
main: seed  = 1724498199

(此处省略一部分)

llm_load_print_meta: max token length = 48
llm_load_tensors: ggml ctx size =    0.14 MiB
llm_load_tensors: offloading 0 repeating layers to GPU
llm_load_tensors: offloaded 0/33 layers to GPU
llm_load_tensors:        CPU buffer size =  3891.24 MiB
..................................................................................................
llama_new_context_with_model: n_ctx      = 4096
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 10000.0
llama_new_context_with_model: freq_scale = 1
llama_kv_cache_init:        CPU KV buffer size =  2048.00 MiB
llama_new_context_with_model: KV self size  = 2048.00 MiB, K (f16): 1024.00 MiB, V (f16): 1024.00 MiB
llama_new_context_with_model:        CPU  output buffer size =     0.12 MiB
llama_new_context_with_model:        CPU compute buffer size =   296.01 MiB
llama_new_context_with_model: graph nodes  = 1030
llama_new_context_with_model: graph splits = 1

system_info: n_threads = 10 / 10 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 0 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 4096, n_batch = 2048, n_predict = 100, n_keep = 1


 hello, this is a very very long story, but this is the only way I could explain what I did to solve this problem. everyone here said it cannot be done, but I did it. I don't know why I can solve it, but I did.

(此处省略一部分)

llama_print_timings:        load time =    1542.10 ms
llama_print_timings:      sample time =       4.82 ms /   100 runs   (    0.05 ms per token, 20768.43 tokens per second)
llama_print_timings: prompt eval time =     493.57 ms /    10 tokens (   49.36 ms per token,    20.26 tokens per second)
llama_print_timings:        eval time =   10175.47 ms /    99 runs   (  102.78 ms per token,     9.73 tokens per second)
llama_print_timings:       total time =   10693.97 ms /   109 tokens
Log end
```

运行模型 `llama2-7B.q4`, 生成长度 `200`:

```sh
$ ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 200

(此处省略一部分)

llama_print_timings:        load time =    1607.02 ms
llama_print_timings:      sample time =       9.29 ms /   200 runs   (    0.05 ms per token, 21528.53 tokens per second)
llama_print_timings: prompt eval time =     494.35 ms /    10 tokens (   49.44 ms per token,    20.23 tokens per second)
llama_print_timings:        eval time =   20434.74 ms /   199 runs   (  102.69 ms per token,     9.74 tokens per second)
llama_print_timings:       total time =   20978.91 ms /   209 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `500`:

```sh
$ ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 500

(此处省略一部分)

llama_print_timings:        load time =    1583.59 ms
llama_print_timings:      sample time =      23.55 ms /   500 runs   (    0.05 ms per token, 21226.92 tokens per second)
llama_print_timings: prompt eval time =     499.12 ms /    10 tokens (   49.91 ms per token,    20.04 tokens per second)
llama_print_timings:        eval time =   52358.53 ms /   499 runs   (  104.93 ms per token,     9.53 tokens per second)
llama_print_timings:       total time =   52987.01 ms /   509 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `1000`:

```sh
$ ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 1000

(此处省略一部分)

llama_print_timings:        load time =    3247.78 ms
llama_print_timings:      sample time =      47.13 ms /  1000 runs   (    0.05 ms per token, 21218.81 tokens per second)
llama_print_timings: prompt eval time =    2596.30 ms /    10 tokens (  259.63 ms per token,     3.85 tokens per second)
llama_print_timings:        eval time =  118042.47 ms /   999 runs   (  118.16 ms per token,     8.46 tokens per second)
llama_print_timings:       total time =  120896.74 ms /  1009 tokens
```

----

运行模型 `qwen2-7B.q8`, 生成长度 `100`:

```sh
fc-test@MiWiFi-RA74-srv:~/llama-cpp$ ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 100
./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli: /lib64/libcurl.so.4: no version information available (required by ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli)
Log start
main: build = 3617 (a07c32ea)
main: built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
main: seed  = 1724498632
llama_model_loader: loaded meta data with 26 key-value pairs and 339 tensors from qwen2-7b-instruct-q8_0.gguf (version GGUF V3 (latest))

(此处省略一部分)

llm_load_print_meta: max token length = 256
llm_load_tensors: ggml ctx size =    0.15 MiB
llm_load_tensors: offloading 0 repeating layers to GPU
llm_load_tensors: offloaded 0/29 layers to GPU
llm_load_tensors:        CPU buffer size =  7717.68 MiB
........................................................................................
llama_new_context_with_model: n_ctx      = 32768
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 1000000.0
llama_new_context_with_model: freq_scale = 1
llama_kv_cache_init:        CPU KV buffer size =  1792.00 MiB
llama_new_context_with_model: KV self size  = 1792.00 MiB, K (f16):  896.00 MiB, V (f16):  896.00 MiB
llama_new_context_with_model:        CPU  output buffer size =     0.58 MiB
llama_new_context_with_model:        CPU compute buffer size =  1884.01 MiB
llama_new_context_with_model: graph nodes  = 986
llama_new_context_with_model: graph splits = 1

system_info: n_threads = 10 / 10 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 0 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 32768, n_batch = 2048, n_predict = 100, n_keep = 0


hello, this is a very very long story, so i will split it into parts.

(此处省略一部分)

llama_print_timings:        load time =    1626.44 ms
llama_print_timings:      sample time =      14.31 ms /   100 runs   (    0.14 ms per token,  6987.63 tokens per second)
llama_print_timings: prompt eval time =     507.61 ms /     9 tokens (   56.40 ms per token,    17.73 tokens per second)
llama_print_timings:        eval time =   14615.79 ms /    99 runs   (  147.63 ms per token,     6.77 tokens per second)
llama_print_timings:       total time =   15238.41 ms /   108 tokens
Log end
```

运行模型 `qwen2-7B.q8`, 生成长度 `200`:

```sh
$ ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 200

(此处省略一部分)

llama_print_timings:        load time =    1577.00 ms
llama_print_timings:      sample time =      28.41 ms /   200 runs   (    0.14 ms per token,  7039.03 tokens per second)
llama_print_timings: prompt eval time =     503.02 ms /     9 tokens (   55.89 ms per token,    17.89 tokens per second)
llama_print_timings:        eval time =   28940.41 ms /   199 runs   (  145.43 ms per token,     6.88 tokens per second)
llama_print_timings:       total time =   29668.90 ms /   208 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `500`:

```sh
$ ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 500

(此处省略一部分)

llama_print_timings:        load time =    1598.72 ms
llama_print_timings:      sample time =      72.10 ms /   500 runs   (    0.14 ms per token,  6935.01 tokens per second)
llama_print_timings: prompt eval time =     502.73 ms /     9 tokens (   55.86 ms per token,    17.90 tokens per second)
llama_print_timings:        eval time =   72983.23 ms /   499 runs   (  146.26 ms per token,     6.84 tokens per second)
llama_print_timings:       total time =   74061.66 ms /   508 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `1000`:

```sh
$ ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 1000

(此处省略一部分)

llama_print_timings:        load time =    1602.06 ms
llama_print_timings:      sample time =     144.15 ms /  1000 runs   (    0.14 ms per token,  6937.31 tokens per second)
llama_print_timings: prompt eval time =     509.66 ms /     9 tokens (   56.63 ms per token,    17.66 tokens per second)
llama_print_timings:        eval time =  149336.77 ms /   999 runs   (  149.49 ms per token,     6.69 tokens per second)
llama_print_timings:       total time =  150983.01 ms /  1008 tokens
```

### 3.3 CPU (r5-5600g, 6C/12T/4.4GHz) x86_64 AVX2

在 6 号 PC (物理机) 上运行. 版本:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli --version
version: 3617 (a07c32ea)
built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
```

运行模型 `llama2-7B.q4`, 生成长度 `100`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 100
Log start
main: build = 3617 (a07c32ea)
main: built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
main: seed  = 1724488187

(此处省略一部分)

llm_load_print_meta: max token length = 48
llm_load_tensors: ggml ctx size =    0.14 MiB
llm_load_tensors: offloading 0 repeating layers to GPU
llm_load_tensors: offloaded 0/33 layers to GPU
llm_load_tensors:        CPU buffer size =  3891.24 MiB
..................................................................................................
llama_new_context_with_model: n_ctx      = 4096
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 10000.0
llama_new_context_with_model: freq_scale = 1
llama_kv_cache_init:        CPU KV buffer size =  2048.00 MiB
llama_new_context_with_model: KV self size  = 2048.00 MiB, K (f16): 1024.00 MiB, V (f16): 1024.00 MiB
llama_new_context_with_model:        CPU  output buffer size =     0.12 MiB
llama_new_context_with_model:        CPU compute buffer size =   296.01 MiB
llama_new_context_with_model: graph nodes  = 1030
llama_new_context_with_model: graph splits = 1

system_info: n_threads = 6 / 12 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 0 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 4096, n_batch = 2048, n_predict = 100, n_keep = 1


 hello, this is a very very long story, but i think it's important to read.

(此处省略一部分)

llama_print_timings:        load time =     649.76 ms
llama_print_timings:      sample time =       2.40 ms /   100 runs   (    0.02 ms per token, 41701.42 tokens per second)
llama_print_timings: prompt eval time =     311.37 ms /    10 tokens (   31.14 ms per token,    32.12 tokens per second)
llama_print_timings:        eval time =    9771.88 ms /    99 runs   (   98.71 ms per token,    10.13 tokens per second)
llama_print_timings:       total time =   10092.46 ms /   109 tokens
Log end
```

运行模型 `llama2-7B.q4`, 生成长度 `200`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 200

(此处省略一部分)

llama_print_timings:        load time =     650.76 ms
llama_print_timings:      sample time =       5.08 ms /   200 runs   (    0.03 ms per token, 39331.37 tokens per second)
llama_print_timings: prompt eval time =     308.01 ms /    10 tokens (   30.80 ms per token,    32.47 tokens per second)
llama_print_timings:        eval time =   19887.24 ms /   199 runs   (   99.94 ms per token,    10.01 tokens per second)
llama_print_timings:       total time =   20214.70 ms /   209 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `500`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 500

(此处省略一部分)

llama_print_timings:        load time =     648.51 ms
llama_print_timings:      sample time =      12.16 ms /   500 runs   (    0.02 ms per token, 41128.57 tokens per second)
llama_print_timings: prompt eval time =     308.95 ms /    10 tokens (   30.89 ms per token,    32.37 tokens per second)
llama_print_timings:        eval time =   51687.76 ms /   499 runs   (  103.58 ms per token,     9.65 tokens per second)
llama_print_timings:       total time =   52043.21 ms /   509 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `1000`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 1000

(此处省略一部分)

llama_print_timings:        load time =     648.60 ms
llama_print_timings:      sample time =      24.13 ms /  1000 runs   (    0.02 ms per token, 41438.75 tokens per second)
llama_print_timings: prompt eval time =     311.58 ms /    10 tokens (   31.16 ms per token,    32.09 tokens per second)
llama_print_timings:        eval time =  107409.32 ms /   999 runs   (  107.52 ms per token,     9.30 tokens per second)
llama_print_timings:       total time =  107815.70 ms /  1009 tokens
```

----

运行模型 `qwen2-7B.q8`, 生成长度 `100`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 100
Log start
main: build = 3617 (a07c32ea)
main: built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
main: seed  = 1724489633
llama_model_loader: loaded meta data with 26 key-value pairs and 339 tensors from qwen2-7b-instruct-q8_0.gguf (version GGUF V3 (latest))

(此处省略一部分)

llm_load_print_meta: max token length = 256
llm_load_tensors: ggml ctx size =    0.15 MiB
llm_load_tensors: offloading 0 repeating layers to GPU
llm_load_tensors: offloaded 0/29 layers to GPU
llm_load_tensors:        CPU buffer size =  7717.68 MiB
........................................................................................
llama_new_context_with_model: n_ctx      = 32768
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 1000000.0
llama_new_context_with_model: freq_scale = 1
llama_kv_cache_init:        CPU KV buffer size =  1792.00 MiB
llama_new_context_with_model: KV self size  = 1792.00 MiB, K (f16):  896.00 MiB, V (f16):  896.00 MiB
llama_new_context_with_model:        CPU  output buffer size =     0.58 MiB
llama_new_context_with_model:        CPU compute buffer size =  1884.01 MiB
llama_new_context_with_model: graph nodes  = 986
llama_new_context_with_model: graph splits = 1

system_info: n_threads = 6 / 12 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 0 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 32768, n_batch = 2048, n_predict = 100, n_keep = 0


hello, this is a very very long story about my friend and her husband, so please bear with me.

(此处省略一部分)

llama_print_timings:        load time =    1158.78 ms
llama_print_timings:      sample time =       8.32 ms /   100 runs   (    0.08 ms per token, 12025.01 tokens per second)
llama_print_timings: prompt eval time =     457.69 ms /     9 tokens (   50.85 ms per token,    19.66 tokens per second)
llama_print_timings:        eval time =   17878.08 ms /    99 runs   (  180.59 ms per token,     5.54 tokens per second)
llama_print_timings:       total time =   18402.49 ms /   108 tokens
Log end
```

运行模型 `qwen2-7B.q8`, 生成长度 `200`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 200

(此处省略一部分)

llama_print_timings:        load time =    1109.41 ms
llama_print_timings:      sample time =      13.17 ms /   200 runs   (    0.07 ms per token, 15181.42 tokens per second)
llama_print_timings: prompt eval time =     496.57 ms /     9 tokens (   55.17 ms per token,    18.12 tokens per second)
llama_print_timings:        eval time =   35791.00 ms /   199 runs   (  179.85 ms per token,     5.56 tokens per second)
llama_print_timings:       total time =   36411.02 ms /   208 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `500`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 500

(此处省略一部分)

llama_print_timings:        load time =    1061.77 ms
llama_print_timings:      sample time =      40.61 ms /   500 runs   (    0.08 ms per token, 12311.03 tokens per second)
llama_print_timings: prompt eval time =     409.44 ms /     9 tokens (   45.49 ms per token,    21.98 tokens per second)
llama_print_timings:        eval time =   90250.99 ms /   499 runs   (  180.86 ms per token,     5.53 tokens per second)
llama_print_timings:       total time =   90991.53 ms /   508 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `1000`:

```sh
> ./llama-b3617-bin-ubuntu-x64/build/bin/llama-cli -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 1000

(此处省略一部分)

llama_print_timings:        load time =     977.25 ms
llama_print_timings:      sample time =      60.87 ms /  1000 runs   (    0.06 ms per token, 16428.99 tokens per second)
llama_print_timings: prompt eval time =     479.25 ms /     9 tokens (   53.25 ms per token,    18.78 tokens per second)
llama_print_timings:        eval time =  182514.10 ms /   999 runs   (  182.70 ms per token,     5.47 tokens per second)
llama_print_timings:       total time =  183593.03 ms /  1008 tokens
```

### 3.4 iGPU (Intel HD520, i5-6200U) vulkan

在 4 号 PC (物理机) 上运行. 版本:

```sh
> ./llama-cli-vulkan-b3617 --version
version: 1 (a07c32e)
built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
```

运行模型 `llama2-7B.q4`, 生成长度 `100`:

```sh
> ./llama-cli-vulkan-b3617 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -ngl 33 -n 100
Log start
main: build = 1 (a07c32e)
main: built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
main: seed  = 1724502840

(此处省略一部分)

llm_load_print_meta: max token length = 48
ggml_vulkan: Found 1 Vulkan devices:
Vulkan0: Intel(R) HD Graphics 520 (SKL GT2) (Intel open-source Mesa driver) | uma: 1 | fp16: 1 | warp size: 32
llm_load_tensors: ggml ctx size =    0.27 MiB
llm_load_tensors: offloading 32 repeating layers to GPU
llm_load_tensors: offloading non-repeating layers to GPU
llm_load_tensors: offloaded 33/33 layers to GPU
llm_load_tensors:        CPU buffer size =    70.31 MiB
llm_load_tensors: Intel(R) HD Graphics 520 (SKL GT2) buffer size =  3820.93 MiB
..................................................................................................
llama_new_context_with_model: n_ctx      = 4096
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 10000.0
llama_new_context_with_model: freq_scale = 1
llama_kv_cache_init: Intel(R) HD Graphics 520 (SKL GT2) KV buffer size =  2048.00 MiB
llama_new_context_with_model: KV self size  = 2048.00 MiB, K (f16): 1024.00 MiB, V (f16): 1024.00 MiB
llama_new_context_with_model: Vulkan_Host  output buffer size =     0.12 MiB
llama_new_context_with_model: Intel(R) HD Graphics 520 (SKL GT2) compute buffer size =   296.00 MiB
llama_new_context_with_model: Vulkan_Host compute buffer size =    16.01 MiB
llama_new_context_with_model: graph nodes  = 1030
llama_new_context_with_model: graph splits = 2

system_info: n_threads = 2 / 4 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 1 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 4096, n_batch = 2048, n_predict = 100, n_keep = 1


 hello, this is a very very long story but i will try and make it short

(此处省略一部分)

llama_print_timings:        load time =   27305.92 ms
llama_print_timings:      sample time =      20.64 ms /   100 runs   (    0.21 ms per token,  4844.49 tokens per second)
llama_print_timings: prompt eval time =   10725.27 ms /    10 tokens ( 1072.53 ms per token,     0.93 tokens per second)
llama_print_timings:        eval time =  104246.69 ms /    99 runs   ( 1053.00 ms per token,     0.95 tokens per second)
llama_print_timings:       total time =  115065.04 ms /   109 tokens
Log end
```

运行模型 `llama2-7B.q4`, 生成长度 `200`:

```sh
> ./llama-cli-vulkan-b3617 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -ngl 33 -n 200

(此处省略一部分)

llama_print_timings:        load time =   26358.11 ms
llama_print_timings:      sample time =      43.34 ms /   200 runs   (    0.22 ms per token,  4615.21 tokens per second)
llama_print_timings: prompt eval time =   10579.07 ms /    10 tokens ( 1057.91 ms per token,     0.95 tokens per second)
llama_print_timings:        eval time =  209900.70 ms /   199 runs   ( 1054.78 ms per token,     0.95 tokens per second)
llama_print_timings:       total time =  220666.27 ms /   209 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `500`:

```sh
> ./llama-cli-vulkan-b3617 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -ngl 33 -n 500

(此处省略一部分)

llama_print_timings:        load time =   27769.47 ms
llama_print_timings:      sample time =     100.38 ms /   500 runs   (    0.20 ms per token,  4981.17 tokens per second)
llama_print_timings: prompt eval time =   10573.54 ms /    10 tokens ( 1057.35 ms per token,     0.95 tokens per second)
llama_print_timings:        eval time =  532338.80 ms /   499 runs   ( 1066.81 ms per token,     0.94 tokens per second)
llama_print_timings:       total time =  543350.42 ms /   509 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `1000`:

```sh
> ./llama-cli-vulkan-b3617 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -ngl 33 -n 1000

(此处省略一部分)

llama_print_timings:        load time =   29646.65 ms
llama_print_timings:      sample time =     179.74 ms /  1000 runs   (    0.18 ms per token,  5563.62 tokens per second)
llama_print_timings: prompt eval time =   10538.36 ms /    10 tokens ( 1053.84 ms per token,     0.95 tokens per second)
llama_print_timings:        eval time = 1089916.74 ms /   999 runs   ( 1091.01 ms per token,     0.92 tokens per second)
llama_print_timings:       total time = 1101057.43 ms /  1009 tokens
```

----

运行模型 `qwen2-7B.q8`.
错误, 无法运行, 提示内存不足:

```sh
> ./llama-cli-vulkan-b3617 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -ngl 33 -n 100
Log start
main: build = 1 (a07c32e)
main: built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
main: seed  = 1724508115
llama_model_loader: loaded meta data with 26 key-value pairs and 339 tensors from qwen2-7b-instruct-q8_0.gguf (version GGUF V3 (latest))

(此处省略一部分)

llm_load_print_meta: max token length = 256
ggml_vulkan: Found 1 Vulkan devices:
Vulkan0: Intel(R) HD Graphics 520 (SKL GT2) (Intel open-source Mesa driver) | uma: 1 | fp16: 1 | warp size: 32
llm_load_tensors: ggml ctx size =    0.30 MiB
llm_load_tensors: offloading 28 repeating layers to GPU
llm_load_tensors: offloading non-repeating layers to GPU
llm_load_tensors: offloaded 29/29 layers to GPU
llm_load_tensors:        CPU buffer size =   552.23 MiB
llm_load_tensors: Intel(R) HD Graphics 520 (SKL GT2) buffer size =  7165.44 MiB
........................................................................................
llama_new_context_with_model: n_ctx      = 32768
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 1000000.0
llama_new_context_with_model: freq_scale = 1
ggml_vulkan: Device memory allocation of size 1879048192 failed.
ggml_vulkan: vk::Device::allocateMemory: ErrorOutOfDeviceMemory
llama_kv_cache_init: failed to allocate buffer for kv cache
llama_new_context_with_model: llama_kv_cache_init() failed for self-attention cache
llama_init_from_gpt_params: error: failed to create context with model 'qwen2-7b-instruct-q8_0.gguf'
main: error: unable to load model
```

### 3.5 iGPU (AMD Radeon Vega 7, r5-5600g) vulkan

在 6 号 PC (物理机) 上运行. 版本:

```sh
> ./llama-cli-vulkan-b3617 --version
version: 1 (a07c32e)
built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
```

运行模型 `llama2-7B.q4`, 生成长度 `100`:

```sh
> ./llama-cli-vulkan-b3617 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 100 -ngl 33
Log start
main: build = 1 (a07c32e)
main: built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
main: seed  = 1724488777

(此处省略一部分)

llm_load_print_meta: max token length = 48
ggml_vulkan: Found 1 Vulkan devices:
Vulkan0: AMD Radeon Graphics (RADV RENOIR) (radv) | uma: 1 | fp16: 1 | warp size: 64
llm_load_tensors: ggml ctx size =    0.27 MiB
llm_load_tensors: offloading 32 repeating layers to GPU
llm_load_tensors: offloading non-repeating layers to GPU
llm_load_tensors: offloaded 33/33 layers to GPU
llm_load_tensors:        CPU buffer size =    70.31 MiB
llm_load_tensors: AMD Radeon Graphics (RADV RENOIR) buffer size =  3820.93 MiB
..................................................................................................
llama_new_context_with_model: n_ctx      = 4096
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 10000.0
llama_new_context_with_model: freq_scale = 1
llama_kv_cache_init: AMD Radeon Graphics (RADV RENOIR) KV buffer size =  2048.00 MiB
llama_new_context_with_model: KV self size  = 2048.00 MiB, K (f16): 1024.00 MiB, V (f16): 1024.00 MiB
llama_new_context_with_model: Vulkan_Host  output buffer size =     0.12 MiB
llama_new_context_with_model: AMD Radeon Graphics (RADV RENOIR) compute buffer size =   296.00 MiB
llama_new_context_with_model: Vulkan_Host compute buffer size =    16.01 MiB
llama_new_context_with_model: graph nodes  = 1030
llama_new_context_with_model: graph splits = 2

system_info: n_threads = 6 / 12 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 1 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 4096, n_batch = 2048, n_predict = 100, n_keep = 1


 hello, this is a very very long story and it's only the first episode.

(此处省略一部分)

llama_print_timings:        load time =    3300.29 ms
llama_print_timings:      sample time =       4.41 ms /   100 runs   (    0.04 ms per token, 22686.03 tokens per second)
llama_print_timings: prompt eval time =    1028.22 ms /    10 tokens (  102.82 ms per token,     9.73 tokens per second)
llama_print_timings:        eval time =   23080.64 ms /    99 runs   (  233.14 ms per token,     4.29 tokens per second)
llama_print_timings:       total time =   24122.46 ms /   109 tokens
Log end
```

运行模型 `llama2-7B.q4`, 生成长度 `200`:

```sh
> ./llama-cli-vulkan-b3617 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 200 -ngl 33

(此处省略一部分)

llama_print_timings:        load time =    3410.94 ms
llama_print_timings:      sample time =       8.64 ms /   200 runs   (    0.04 ms per token, 23153.51 tokens per second)
llama_print_timings: prompt eval time =    1027.37 ms /    10 tokens (  102.74 ms per token,     9.73 tokens per second)
llama_print_timings:        eval time =   46620.34 ms /   199 runs   (  234.27 ms per token,     4.27 tokens per second)
llama_print_timings:       total time =   47674.32 ms /   209 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `500`:

```sh
> ./llama-cli-vulkan-b3617 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 500 -ngl 33

(此处省略一部分)

llama_print_timings:        load time =    3389.70 ms
llama_print_timings:      sample time =      21.42 ms /   500 runs   (    0.04 ms per token, 23339.40 tokens per second)
llama_print_timings: prompt eval time =    1026.09 ms /    10 tokens (  102.61 ms per token,     9.75 tokens per second)
llama_print_timings:        eval time =  118409.44 ms /   499 runs   (  237.29 ms per token,     4.21 tokens per second)
llama_print_timings:       total time =  119502.95 ms /   509 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `1000`:

```sh
> ./llama-cli-vulkan-b3617 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 1000 -ngl 33

(此处省略一部分)

llama_print_timings:        load time =    3362.42 ms
llama_print_timings:      sample time =      43.25 ms /  1000 runs   (    0.04 ms per token, 23120.85 tokens per second)
llama_print_timings: prompt eval time =    1027.78 ms /    10 tokens (  102.78 ms per token,     9.73 tokens per second)
llama_print_timings:        eval time =  242531.02 ms /   999 runs   (  242.77 ms per token,     4.12 tokens per second)
llama_print_timings:       total time =  243694.80 ms /  1009 tokens
```

----

运行模型 `qwen2-7B.q8`, 生成长度 `100`:

```sh
> ./llama-cli-vulkan-b3617 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 100 -ngl 33
Log start
main: build = 1 (a07c32e)
main: built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
main: seed  = 1724490279
llama_model_loader: loaded meta data with 26 key-value pairs and 339 tensors from qwen2-7b-instruct-q8_0.gguf (version GGUF V3 (latest))

(此处省略一部分)

llm_load_print_meta: max token length = 256
ggml_vulkan: Found 1 Vulkan devices:
Vulkan0: AMD Radeon Graphics (RADV RENOIR) (radv) | uma: 1 | fp16: 1 | warp size: 64
llm_load_tensors: ggml ctx size =    0.30 MiB
llm_load_tensors: offloading 28 repeating layers to GPU
llm_load_tensors: offloading non-repeating layers to GPU
llm_load_tensors: offloaded 29/29 layers to GPU
llm_load_tensors:        CPU buffer size =   552.23 MiB
llm_load_tensors: AMD Radeon Graphics (RADV RENOIR) buffer size =  7165.44 MiB
........................................................................................
llama_new_context_with_model: n_ctx      = 32768
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 1000000.0
llama_new_context_with_model: freq_scale = 1
llama_kv_cache_init: AMD Radeon Graphics (RADV RENOIR) KV buffer size =  1792.00 MiB
llama_new_context_with_model: KV self size  = 1792.00 MiB, K (f16):  896.00 MiB, V (f16):  896.00 MiB
llama_new_context_with_model: Vulkan_Host  output buffer size =     0.58 MiB
llama_new_context_with_model: AMD Radeon Graphics (RADV RENOIR) compute buffer size =  1884.00 MiB
llama_new_context_with_model: Vulkan_Host compute buffer size =    71.01 MiB
llama_new_context_with_model: graph nodes  = 986
llama_new_context_with_model: graph splits = 2

system_info: n_threads = 6 / 12 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 1 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 32768, n_batch = 2048, n_predict = 100, n_keep = 0


hello, this is a very very long story, but I'm going to do my best to explain in a concise manner:

(此处省略一部分)

llama_print_timings:        load time =    8781.85 ms
llama_print_timings:      sample time =       9.19 ms /   100 runs   (    0.09 ms per token, 10880.21 tokens per second)
llama_print_timings: prompt eval time =     913.76 ms /     9 tokens (  101.53 ms per token,     9.85 tokens per second)
llama_print_timings:        eval time =   34897.82 ms /    99 runs   (  352.50 ms per token,     2.84 tokens per second)
llama_print_timings:       total time =   35889.02 ms /   108 tokens
Log end
```

运行模型 `qwen2-7B.q8`, 生成长度 `200`:

```sh
> ./llama-cli-vulkan-b3617 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 200 -ngl 33

(此处省略一部分)

llama_print_timings:        load time =    8249.67 ms
llama_print_timings:      sample time =      17.88 ms /   200 runs   (    0.09 ms per token, 11185.68 tokens per second)
llama_print_timings: prompt eval time =     909.22 ms /     9 tokens (  101.02 ms per token,     9.90 tokens per second)
llama_print_timings:        eval time =   70426.63 ms /   199 runs   (  353.90 ms per token,     2.83 tokens per second)
llama_print_timings:       total time =   71489.45 ms /   208 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `500`:

```sh
> ./llama-cli-vulkan-b3617 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 500 -ngl 33

(此处省略一部分)

llama_print_timings:        load time =    6014.76 ms
llama_print_timings:      sample time =      46.23 ms /   500 runs   (    0.09 ms per token, 10815.96 tokens per second)
llama_print_timings: prompt eval time =     916.14 ms /     9 tokens (  101.79 ms per token,     9.82 tokens per second)
llama_print_timings:        eval time =  177508.81 ms /   499 runs   (  355.73 ms per token,     2.81 tokens per second)
llama_print_timings:       total time =  178809.12 ms /   508 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `1000`:

```sh
> ./llama-cli-vulkan-b3617 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 1000 -ngl 33

(此处省略一部分)

llama_print_timings:        load time =    6662.38 ms
llama_print_timings:      sample time =      89.55 ms /  1000 runs   (    0.09 ms per token, 11167.57 tokens per second)
llama_print_timings: prompt eval time =     916.79 ms /     9 tokens (  101.87 ms per token,     9.82 tokens per second)
llama_print_timings:        eval time =  358831.15 ms /   999 runs   (  359.19 ms per token,     2.78 tokens per second)
llama_print_timings:       total time =  360504.90 ms /  1008 tokens
```

### 3.6 dGPU (A770) vulkan

在 6 号 (虚拟机) 上运行. 版本:

```sh
a2@a2s:~$ ./llama-cli-vulkan-b3617 --version
version: 1 (a07c32e)
built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
```

运行模型 `llama2-7B.q4`, 生成长度 `100`:

```sh
a2@a2s:~$ ./llama-cli-vulkan-b3617 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 100 -ngl 33
Log start
main: build = 1 (a07c32e)
main: built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
main: seed  = 1724492722

(此处省略一部分)

llm_load_print_meta: max token length = 48
ggml_vulkan: Found 1 Vulkan devices:
Vulkan0: Intel(R) Arc(tm) A770 Graphics (DG2) (Intel open-source Mesa driver) | uma: 0 | fp16: 1 | warp size: 32
llm_load_tensors: ggml ctx size =    0.27 MiB
llm_load_tensors: offloading 32 repeating layers to GPU
llm_load_tensors: offloading non-repeating layers to GPU
llm_load_tensors: offloaded 33/33 layers to GPU
llm_load_tensors:        CPU buffer size =    70.31 MiB
llm_load_tensors: Intel(R) Arc(tm) A770 Graphics (DG2) buffer size =  3820.93 MiB
..................................................................................................
llama_new_context_with_model: n_ctx      = 4096
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 10000.0
llama_new_context_with_model: freq_scale = 1
llama_kv_cache_init: Intel(R) Arc(tm) A770 Graphics (DG2) KV buffer size =  2048.00 MiB
llama_new_context_with_model: KV self size  = 2048.00 MiB, K (f16): 1024.00 MiB, V (f16): 1024.00 MiB
llama_new_context_with_model: Vulkan_Host  output buffer size =     0.12 MiB
llama_new_context_with_model: Intel(R) Arc(tm) A770 Graphics (DG2) compute buffer size =   296.00 MiB
llama_new_context_with_model: Vulkan_Host compute buffer size =    16.01 MiB
llama_new_context_with_model: graph nodes  = 1030
llama_new_context_with_model: graph splits = 2

system_info: n_threads = 4 / 4 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 1 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 4096, n_batch = 2048, n_predict = 100, n_keep = 1


 hello, this is a very very long story, and you can ignore most of it, i'm just putting it here for reference in case anyone has a similar issue.

(此处省略一部分)

llama_print_timings:        load time =    2274.09 ms
llama_print_timings:      sample time =       4.14 ms /   100 runs   (    0.04 ms per token, 24148.76 tokens per second)
llama_print_timings: prompt eval time =     440.70 ms /    10 tokens (   44.07 ms per token,    22.69 tokens per second)
llama_print_timings:        eval time =    3809.51 ms /    99 runs   (   38.48 ms per token,    25.99 tokens per second)
llama_print_timings:       total time =    4262.46 ms /   109 tokens
Log end
```

运行模型 `llama2-7B.q4`, 生成长度 `200`:

```sh
a2@a2s:~$ ./llama-cli-vulkan-b3617 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 200 -ngl 33

(此处省略一部分)

llama_print_timings:        load time =    2308.60 ms
llama_print_timings:      sample time =       8.50 ms /   200 runs   (    0.04 ms per token, 23518.34 tokens per second)
llama_print_timings: prompt eval time =     441.26 ms /    10 tokens (   44.13 ms per token,    22.66 tokens per second)
llama_print_timings:        eval time =    7704.86 ms /   199 runs   (   38.72 ms per token,    25.83 tokens per second)
llama_print_timings:       total time =    8171.87 ms /   209 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `500`:

```sh
a2@a2s:~$ ./llama-cli-vulkan-b3617 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 500 -ngl 33

(此处省略一部分)

llama_print_timings:        load time =    2296.68 ms
llama_print_timings:      sample time =      21.31 ms /   500 runs   (    0.04 ms per token, 23460.96 tokens per second)
llama_print_timings: prompt eval time =     440.77 ms /    10 tokens (   44.08 ms per token,    22.69 tokens per second)
llama_print_timings:        eval time =   19597.74 ms /   499 runs   (   39.27 ms per token,    25.46 tokens per second)
llama_print_timings:       total time =   20102.66 ms /   509 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `1000`:

```sh
a2@a2s:~$ ./llama-cli-vulkan-b3617 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 1000 -ngl 33

(此处省略一部分)

llama_print_timings:        load time =    2273.46 ms
llama_print_timings:      sample time =      42.10 ms /  1000 runs   (    0.04 ms per token, 23751.84 tokens per second)
llama_print_timings: prompt eval time =     441.47 ms /    10 tokens (   44.15 ms per token,    22.65 tokens per second)
llama_print_timings:        eval time =   40262.07 ms /   999 runs   (   40.30 ms per token,    24.81 tokens per second)
llama_print_timings:       total time =   40827.46 ms /  1009 tokens
```

----

运行模型 `qwen2-7B.q8`, 生成长度 `100`:

```sh
a2@a2s:~$ ./llama-cli-vulkan-b3617 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 100 -ngl 33
Log start
main: build = 1 (a07c32e)
main: built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
main: seed  = 1724493121
llama_model_loader: loaded meta data with 26 key-value pairs and 339 tensors from qwen2-7b-instruct-q8_0.gguf (version GGUF V3 (latest))

(此处省略一部分)

llm_load_print_meta: max token length = 256
ggml_vulkan: Found 1 Vulkan devices:
Vulkan0: Intel(R) Arc(tm) A770 Graphics (DG2) (Intel open-source Mesa driver) | uma: 0 | fp16: 1 | warp size: 32
llm_load_tensors: ggml ctx size =    0.30 MiB
llm_load_tensors: offloading 28 repeating layers to GPU
llm_load_tensors: offloading non-repeating layers to GPU
llm_load_tensors: offloaded 29/29 layers to GPU
llm_load_tensors:        CPU buffer size =   552.23 MiB
llm_load_tensors: Intel(R) Arc(tm) A770 Graphics (DG2) buffer size =  7165.44 MiB
........................................................................................
llama_new_context_with_model: n_ctx      = 32768
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 1000000.0
llama_new_context_with_model: freq_scale = 1
llama_kv_cache_init: Intel(R) Arc(tm) A770 Graphics (DG2) KV buffer size =  1792.00 MiB
llama_new_context_with_model: KV self size  = 1792.00 MiB, K (f16):  896.00 MiB, V (f16):  896.00 MiB
llama_new_context_with_model: Vulkan_Host  output buffer size =     0.58 MiB
llama_new_context_with_model: Intel(R) Arc(tm) A770 Graphics (DG2) compute buffer size =  1884.00 MiB
llama_new_context_with_model: Vulkan_Host compute buffer size =    71.01 MiB
llama_new_context_with_model: graph nodes  = 986
llama_new_context_with_model: graph splits = 2

system_info: n_threads = 4 / 4 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 1 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 32768, n_batch = 2048, n_predict = 100, n_keep = 0


hello, this is a very very long story with multiple characters, but i will try to write it in a way that makes it easy to follow. 

(此处省略一部分)

llama_print_timings:        load time =    8202.05 ms
llama_print_timings:      sample time =      10.16 ms /   100 runs   (    0.10 ms per token,  9839.61 tokens per second)
llama_print_timings: prompt eval time =     587.73 ms /     9 tokens (   65.30 ms per token,    15.31 tokens per second)
llama_print_timings:        eval time =    4755.44 ms /    99 runs   (   48.03 ms per token,    20.82 tokens per second)
llama_print_timings:       total time =    5460.46 ms /   108 tokens
Log end
```

运行模型 `qwen2-7B.q8`, 生成长度 `200`:

```sh
a2@a2s:~$ ./llama-cli-vulkan-b3617 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 200 -ngl 33

(此处省略一部分)

llama_print_timings:        load time =    6642.05 ms
llama_print_timings:      sample time =      19.91 ms /   200 runs   (    0.10 ms per token, 10043.19 tokens per second)
llama_print_timings: prompt eval time =     587.07 ms /     9 tokens (   65.23 ms per token,    15.33 tokens per second)
llama_print_timings:        eval time =    9581.81 ms /   199 runs   (   48.15 ms per token,    20.77 tokens per second)
llama_print_timings:       total time =   10348.91 ms /   208 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `500`:

```sh
a2@a2s:~$ ./llama-cli-vulkan-b3617 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 500 -ngl 33

(此处省略一部分)

llama_print_timings:        load time =    6756.91 ms
llama_print_timings:      sample time =      51.43 ms /   500 runs   (    0.10 ms per token,  9722.33 tokens per second)
llama_print_timings: prompt eval time =     588.10 ms /     9 tokens (   65.34 ms per token,    15.30 tokens per second)
llama_print_timings:        eval time =   24196.44 ms /   499 runs   (   48.49 ms per token,    20.62 tokens per second)
llama_print_timings:       total time =   25212.38 ms /   508 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `1000`:

```sh
a2@a2s:~$ ./llama-cli-vulkan-b3617 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 1000 -ngl 33

(此处省略一部分)

llama_print_timings:        load time =    6664.69 ms
llama_print_timings:      sample time =      92.37 ms /  1000 runs   (    0.09 ms per token, 10825.91 tokens per second)
llama_print_timings: prompt eval time =     586.92 ms /     9 tokens (   65.21 ms per token,    15.33 tokens per second)
llama_print_timings:        eval time =   48610.18 ms /   999 runs   (   48.66 ms per token,    20.55 tokens per second)
llama_print_timings:       total time =   49939.72 ms /  1008 tokens
```

### 3.7 dGPU (A770) SYCL

在 6 号 (虚拟机) 上运行. 准备工作:

```sh
a2@a2s:~$ source /opt/intel/oneapi/setvars.sh
 
:: initializing oneAPI environment ...
   -bash: BASH_VERSION = 5.1.16(1)-release
   args: Using "$@" for setvars.sh arguments: 
:: ccl -- latest
:: compiler -- latest
:: debugger -- latest
:: dev-utilities -- latest
:: mkl -- latest
:: mpi -- latest
:: tbb -- latest
:: oneAPI environment initialized ::
 
a2@a2s:~$ export ZES_ENABLE_SYSMAN=1
a2@a2s:~$ export USE_XETLA=OFF
a2@a2s:~$ export SYCL_CACHE_PERSISTENT=1
a2@a2s:~$ export SYCL_PI_LEVEL_ZERO_USE_IMMEDIATE_COMMANDLISTS=1
a2@a2s:~$ sycl-ls
[opencl:cpu][opencl:0] Intel(R) OpenCL, AMD Ryzen 5 5600G with Radeon Graphics          OpenCL 3.0 (Build 0) [2024.18.7.0.11_160000]
[opencl:gpu][opencl:1] Intel(R) OpenCL Graphics, Intel(R) Arc(TM) A770 Graphics OpenCL 3.0 NEO  [24.22.29735.27]
[level_zero:gpu][level_zero:0] Intel(R) Level-Zero, Intel(R) Arc(TM) A770 Graphics 1.3 [1.3.29735]
```

版本:

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f32 --version
version: 1 (a07c32e)
built with Intel(R) oneAPI DPC++/C++ Compiler 2024.2.1 (2024.2.1.20240711) for x86_64-unknown-linux-gnu
a2@a2s:~$ ./llama-cli-sycl-b3617-f16 --version
version: 1 (a07c32e)
built with Intel(R) oneAPI DPC++/C++ Compiler 2024.2.1 (2024.2.1.20240711) for x86_64-unknown-linux-gnu
```

运行模型 `llama2-7B.q4`, 生成长度 `100` (f32):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f32 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 100
Log start
main: build = 1 (a07c32e)
main: built with Intel(R) oneAPI DPC++/C++ Compiler 2024.2.1 (2024.2.1.20240711) for x86_64-unknown-linux-gnu
main: seed  = 1724493845

(此处省略一部分)

llm_load_print_meta: max token length = 48
ggml_sycl_init: GGML_SYCL_FORCE_MMQ:   no
ggml_sycl_init: SYCL_USE_XMX: yes
ggml_sycl_init: found 1 SYCL devices:
llm_load_tensors: ggml ctx size =    0.27 MiB
llm_load_tensors: offloading 32 repeating layers to GPU
llm_load_tensors: offloading non-repeating layers to GPU
llm_load_tensors: offloaded 33/33 layers to GPU
llm_load_tensors:      SYCL0 buffer size =  3820.94 MiB
llm_load_tensors:        CPU buffer size =    70.31 MiB
..................................................................................................
llama_new_context_with_model: n_ctx      = 4096
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 10000.0
llama_new_context_with_model: freq_scale = 1
[SYCL] call ggml_check_sycl
ggml_check_sycl: GGML_SYCL_DEBUG: 0
ggml_check_sycl: GGML_SYCL_F16: no
found 1 SYCL devices:
|  |                   |                                       |       |Max    |        |Max  |Global |                     |
|  |                   |                                       |       |compute|Max work|sub  |mem    |                     |
|ID|        Device Type|                                   Name|Version|units  |group   |group|size   |       Driver version|
|--|-------------------|---------------------------------------|-------|-------|--------|-----|-------|---------------------|
| 0| [level_zero:gpu:0]|                Intel Arc A770 Graphics|    1.3|    512|    1024|   32| 16225M|            1.3.29735|
llama_kv_cache_init:      SYCL0 KV buffer size =  2048.00 MiB
llama_new_context_with_model: KV self size  = 2048.00 MiB, K (f16): 1024.00 MiB, V (f16): 1024.00 MiB
llama_new_context_with_model:  SYCL_Host  output buffer size =     0.12 MiB
llama_new_context_with_model:      SYCL0 compute buffer size =   296.00 MiB
llama_new_context_with_model:  SYCL_Host compute buffer size =    16.01 MiB
llama_new_context_with_model: graph nodes  = 1030
llama_new_context_with_model: graph splits = 2

system_info: n_threads = 4 / 4 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 1 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 4096, n_batch = 2048, n_predict = 100, n_keep = 1


 hello, this is a very very long story, but i promise it's worth it.

(此处省略一部分)

llama_print_timings:        load time =    2066.71 ms
llama_print_timings:      sample time =       2.90 ms /   100 runs   (    0.03 ms per token, 34542.31 tokens per second)
llama_print_timings: prompt eval time =     180.84 ms /    10 tokens (   18.08 ms per token,    55.30 tokens per second)
llama_print_timings:        eval time =    2852.87 ms /    99 runs   (   28.82 ms per token,    34.70 tokens per second)
llama_print_timings:       total time =    3044.63 ms /   109 tokens
Log end
```

运行模型 `llama2-7B.q4`, 生成长度 `200` (f32):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f32 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 200

(此处省略一部分)

llama_print_timings:        load time =    2040.98 ms
llama_print_timings:      sample time =       5.98 ms /   200 runs   (    0.03 ms per token, 33450.41 tokens per second)
llama_print_timings: prompt eval time =     179.29 ms /    10 tokens (   17.93 ms per token,    55.78 tokens per second)
llama_print_timings:        eval time =    5765.54 ms /   199 runs   (   28.97 ms per token,    34.52 tokens per second)
llama_print_timings:       total time =    5968.10 ms /   209 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `500` (f32):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f32 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 500

(此处省略一部分)

llama_print_timings:        load time =    1994.74 ms
llama_print_timings:      sample time =      15.04 ms /   500 runs   (    0.03 ms per token, 33246.89 tokens per second)
llama_print_timings: prompt eval time =     177.09 ms /    10 tokens (   17.71 ms per token,    56.47 tokens per second)
llama_print_timings:        eval time =   14675.46 ms /   499 runs   (   29.41 ms per token,    34.00 tokens per second)
llama_print_timings:       total time =   14911.41 ms /   509 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `1000` (f32):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f32 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 1000

(此处省略一部分)

llama_print_timings:        load time =    2071.28 ms
llama_print_timings:      sample time =      28.05 ms /  1000 runs   (    0.03 ms per token, 35646.81 tokens per second)
llama_print_timings: prompt eval time =     178.45 ms /    10 tokens (   17.85 ms per token,    56.04 tokens per second)
llama_print_timings:        eval time =   30044.60 ms /   999 runs   (   30.07 ms per token,    33.25 tokens per second)
llama_print_timings:       total time =   30329.49 ms /  1009 tokens
```

----

运行模型 `qwen2-7B.q8`, 生成长度 `100` (f32):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f32 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 100
Log start
main: build = 1 (a07c32e)
main: built with Intel(R) oneAPI DPC++/C++ Compiler 2024.2.1 (2024.2.1.20240711) for x86_64-unknown-linux-gnu
main: seed  = 1724494148
llama_model_loader: loaded meta data with 26 key-value pairs and 339 tensors from qwen2-7b-instruct-q8_0.gguf (version GGUF V3 (latest))

(此处省略一部分)

llm_load_print_meta: max token length = 256
ggml_sycl_init: GGML_SYCL_FORCE_MMQ:   no
ggml_sycl_init: SYCL_USE_XMX: yes
ggml_sycl_init: found 1 SYCL devices:
llm_load_tensors: ggml ctx size =    0.30 MiB
llm_load_tensors: offloading 28 repeating layers to GPU
llm_load_tensors: offloading non-repeating layers to GPU
llm_load_tensors: offloaded 29/29 layers to GPU
llm_load_tensors:      SYCL0 buffer size =  7165.44 MiB
llm_load_tensors:        CPU buffer size =   552.23 MiB
.......................................................................................
llama_new_context_with_model: n_ctx      = 32768
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 1000000.0
llama_new_context_with_model: freq_scale = 1
[SYCL] call ggml_check_sycl
ggml_check_sycl: GGML_SYCL_DEBUG: 0
ggml_check_sycl: GGML_SYCL_F16: no
found 1 SYCL devices:
|  |                   |                                       |       |Max    |        |Max  |Global |                     |
|  |                   |                                       |       |compute|Max work|sub  |mem    |                     |
|ID|        Device Type|                                   Name|Version|units  |group   |group|size   |       Driver version|
|--|-------------------|---------------------------------------|-------|-------|--------|-----|-------|---------------------|
| 0| [level_zero:gpu:0]|                Intel Arc A770 Graphics|    1.3|    512|    1024|   32| 16225M|            1.3.29735|
llama_kv_cache_init:      SYCL0 KV buffer size =  1792.00 MiB
llama_new_context_with_model: KV self size  = 1792.00 MiB, K (f16):  896.00 MiB, V (f16):  896.00 MiB
llama_new_context_with_model:  SYCL_Host  output buffer size =     0.58 MiB
llama_new_context_with_model:      SYCL0 compute buffer size =  1884.00 MiB
llama_new_context_with_model:  SYCL_Host compute buffer size =    71.01 MiB
llama_new_context_with_model: graph nodes  = 986
llama_new_context_with_model: graph splits = 2

system_info: n_threads = 4 / 4 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 1 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 32768, n_batch = 2048, n_predict = 100, n_keep = 0


hello, this is a very very long story and I would like to ask for help.

(此处省略一部分)

llama_print_timings:        load time =    9055.51 ms
llama_print_timings:      sample time =       8.22 ms /   100 runs   (    0.08 ms per token, 12158.05 tokens per second)
llama_print_timings: prompt eval time =     395.27 ms /     9 tokens (   43.92 ms per token,    22.77 tokens per second)
llama_print_timings:        eval time =    5195.18 ms /    99 runs   (   52.48 ms per token,    19.06 tokens per second)
llama_print_timings:       total time =    5679.84 ms /   108 tokens
Log end
```

运行模型 `qwen2-7B.q8`, 生成长度 `200` (f32):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f32 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 200

(此处省略一部分)

llama_print_timings:        load time =    8413.38 ms
llama_print_timings:      sample time =      16.47 ms /   200 runs   (    0.08 ms per token, 12141.08 tokens per second)
llama_print_timings: prompt eval time =     405.85 ms /     9 tokens (   45.09 ms per token,    22.18 tokens per second)
llama_print_timings:        eval time =   10455.78 ms /   199 runs   (   52.54 ms per token,    19.03 tokens per second)
llama_print_timings:       total time =   11017.44 ms /   208 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `500` (f32):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f32 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 500

(此处省略一部分)

llama_print_timings:        load time =    9179.45 ms
llama_print_timings:      sample time =      47.42 ms /   500 runs   (    0.09 ms per token, 10544.74 tokens per second)
llama_print_timings: prompt eval time =     402.42 ms /     9 tokens (   44.71 ms per token,    22.36 tokens per second)
llama_print_timings:        eval time =   26367.77 ms /   499 runs   (   52.84 ms per token,    18.92 tokens per second)
llama_print_timings:       total time =   27130.93 ms /   508 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `1000` (f32):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f32 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 1000

(此处省略一部分)

llama_print_timings:        load time =    9531.60 ms
llama_print_timings:      sample time =      96.63 ms /  1000 runs   (    0.10 ms per token, 10348.86 tokens per second)
llama_print_timings: prompt eval time =     401.50 ms /     9 tokens (   44.61 ms per token,    22.42 tokens per second)
llama_print_timings:        eval time =   53212.71 ms /   999 runs   (   53.27 ms per token,    18.77 tokens per second)
llama_print_timings:       total time =   54321.34 ms /  1008 tokens
```

----

运行模型 `llama2-7B.q4`, 生成长度 `100` (f16):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f16 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 100
Log start
main: build = 1 (a07c32e)
main: built with Intel(R) oneAPI DPC++/C++ Compiler 2024.2.1 (2024.2.1.20240711) for x86_64-unknown-linux-gnu
main: seed  = 1724494475

(此处省略一部分)

llm_load_print_meta: max token length = 48
ggml_sycl_init: GGML_SYCL_FORCE_MMQ:   no
ggml_sycl_init: SYCL_USE_XMX: yes
ggml_sycl_init: found 1 SYCL devices:
llm_load_tensors: ggml ctx size =    0.27 MiB
llm_load_tensors: offloading 32 repeating layers to GPU
llm_load_tensors: offloading non-repeating layers to GPU
llm_load_tensors: offloaded 33/33 layers to GPU
llm_load_tensors:      SYCL0 buffer size =  3820.94 MiB
llm_load_tensors:        CPU buffer size =    70.31 MiB
..................................................................................................
llama_new_context_with_model: n_ctx      = 4096
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 10000.0
llama_new_context_with_model: freq_scale = 1
[SYCL] call ggml_check_sycl
ggml_check_sycl: GGML_SYCL_DEBUG: 0
ggml_check_sycl: GGML_SYCL_F16: yes
found 1 SYCL devices:
|  |                   |                                       |       |Max    |        |Max  |Global |                     |
|  |                   |                                       |       |compute|Max work|sub  |mem    |                     |
|ID|        Device Type|                                   Name|Version|units  |group   |group|size   |       Driver version|
|--|-------------------|---------------------------------------|-------|-------|--------|-----|-------|---------------------|
| 0| [level_zero:gpu:0]|                Intel Arc A770 Graphics|    1.3|    512|    1024|   32| 16225M|            1.3.29735|
llama_kv_cache_init:      SYCL0 KV buffer size =  2048.00 MiB
llama_new_context_with_model: KV self size  = 2048.00 MiB, K (f16): 1024.00 MiB, V (f16): 1024.00 MiB
llama_new_context_with_model:  SYCL_Host  output buffer size =     0.12 MiB
llama_new_context_with_model:      SYCL0 compute buffer size =   296.00 MiB
llama_new_context_with_model:  SYCL_Host compute buffer size =    16.01 MiB
llama_new_context_with_model: graph nodes  = 1030
llama_new_context_with_model: graph splits = 2

system_info: n_threads = 4 / 4 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 1 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 4096, n_batch = 2048, n_predict = 100, n_keep = 1


 hello, this is a very very long story, and I hope you will read it, because I need to tell you something.

(此处省略一部分)

llama_print_timings:        load time =    1866.40 ms
llama_print_timings:      sample time =       3.23 ms /   100 runs   (    0.03 ms per token, 30998.14 tokens per second)
llama_print_timings: prompt eval time =     187.70 ms /    10 tokens (   18.77 ms per token,    53.28 tokens per second)
llama_print_timings:        eval time =    2873.84 ms /    99 runs   (   29.03 ms per token,    34.45 tokens per second)
llama_print_timings:       total time =    3074.08 ms /   109 tokens
Log end
```

运行模型 `llama2-7B.q4`, 生成长度 `200` (f16):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f16 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 200

(此处省略一部分)

llama_print_timings:        load time =    1867.46 ms
llama_print_timings:      sample time =       5.99 ms /   200 runs   (    0.03 ms per token, 33411.29 tokens per second)
llama_print_timings: prompt eval time =     194.39 ms /    10 tokens (   19.44 ms per token,    51.44 tokens per second)
llama_print_timings:        eval time =    5783.95 ms /   199 runs   (   29.07 ms per token,    34.41 tokens per second)
llama_print_timings:       total time =    6003.07 ms /   209 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `500` (f16):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f16 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 500

(此处省略一部分)

llama_print_timings:        load time =    1909.92 ms
llama_print_timings:      sample time =      15.56 ms /   500 runs   (    0.03 ms per token, 32123.35 tokens per second)
llama_print_timings: prompt eval time =     186.10 ms /    10 tokens (   18.61 ms per token,    53.73 tokens per second)
llama_print_timings:        eval time =   14680.81 ms /   499 runs   (   29.42 ms per token,    33.99 tokens per second)
llama_print_timings:       total time =   14925.64 ms /   509 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `1000` (f16):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f16 -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 1000

(此处省略一部分)

llama_print_timings:        load time =    2017.43 ms
llama_print_timings:      sample time =      13.53 ms /   461 runs   (    0.03 ms per token, 34067.40 tokens per second)
llama_print_timings: prompt eval time =     189.74 ms /    10 tokens (   18.97 ms per token,    52.70 tokens per second)
llama_print_timings:        eval time =   13480.19 ms /   460 runs   (   29.30 ms per token,    34.12 tokens per second)
llama_print_timings:       total time =   13722.36 ms /   470 tokens
```

----

运行模型 `qwen2-7B.q8`, 生成长度 `100` (f16):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f16 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 100
Log start
main: build = 1 (a07c32e)
main: built with Intel(R) oneAPI DPC++/C++ Compiler 2024.2.1 (2024.2.1.20240711) for x86_64-unknown-linux-gnu
main: seed  = 1724494717
llama_model_loader: loaded meta data with 26 key-value pairs and 339 tensors from qwen2-7b-instruct-q8_0.gguf (version GGUF V3 (latest))

(此处省略一部分)

llm_load_print_meta: max token length = 256
ggml_sycl_init: GGML_SYCL_FORCE_MMQ:   no
ggml_sycl_init: SYCL_USE_XMX: yes
ggml_sycl_init: found 1 SYCL devices:
llm_load_tensors: ggml ctx size =    0.30 MiB
llm_load_tensors: offloading 28 repeating layers to GPU
llm_load_tensors: offloading non-repeating layers to GPU
llm_load_tensors: offloaded 29/29 layers to GPU
llm_load_tensors:      SYCL0 buffer size =  7165.44 MiB
llm_load_tensors:        CPU buffer size =   552.23 MiB
.......................................................................................
llama_new_context_with_model: n_ctx      = 32768
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 1000000.0
llama_new_context_with_model: freq_scale = 1
[SYCL] call ggml_check_sycl
ggml_check_sycl: GGML_SYCL_DEBUG: 0
ggml_check_sycl: GGML_SYCL_F16: yes
found 1 SYCL devices:
|  |                   |                                       |       |Max    |        |Max  |Global |                     |
|  |                   |                                       |       |compute|Max work|sub  |mem    |                     |
|ID|        Device Type|                                   Name|Version|units  |group   |group|size   |       Driver version|
|--|-------------------|---------------------------------------|-------|-------|--------|-----|-------|---------------------|
| 0| [level_zero:gpu:0]|                Intel Arc A770 Graphics|    1.3|    512|    1024|   32| 16225M|            1.3.29735|
llama_kv_cache_init:      SYCL0 KV buffer size =  1792.00 MiB
llama_new_context_with_model: KV self size  = 1792.00 MiB, K (f16):  896.00 MiB, V (f16):  896.00 MiB
llama_new_context_with_model:  SYCL_Host  output buffer size =     0.58 MiB
llama_new_context_with_model:      SYCL0 compute buffer size =  1884.00 MiB
llama_new_context_with_model:  SYCL_Host compute buffer size =    71.01 MiB
llama_new_context_with_model: graph nodes  = 986
llama_new_context_with_model: graph splits = 2

system_info: n_threads = 4 / 4 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 1 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 32768, n_batch = 2048, n_predict = 100, n_keep = 0


hello, this is a very very long story but I will try to make it as short as possible.

(此处省略一部分)

llama_print_timings:        load time =    8893.71 ms
llama_print_timings:      sample time =       9.80 ms /   100 runs   (    0.10 ms per token, 10204.08 tokens per second)
llama_print_timings: prompt eval time =     295.81 ms /     9 tokens (   32.87 ms per token,    30.42 tokens per second)
llama_print_timings:        eval time =    5931.59 ms /    99 runs   (   59.91 ms per token,    16.69 tokens per second)
llama_print_timings:       total time =    6305.29 ms /   108 tokens
Log end
```

运行模型 `qwen2-7B.q8`, 生成长度 `200` (f16):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f16 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 200

(此处省略一部分)

llama_print_timings:        load time =    8474.98 ms
llama_print_timings:      sample time =      18.22 ms /   200 runs   (    0.09 ms per token, 10978.15 tokens per second)
llama_print_timings: prompt eval time =     298.85 ms /     9 tokens (   33.21 ms per token,    30.12 tokens per second)
llama_print_timings:        eval time =   11935.47 ms /   199 runs   (   59.98 ms per token,    16.67 tokens per second)
llama_print_timings:       total time =   12379.13 ms /   208 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `500` (f16):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f16 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 500

(此处省略一部分)

llama_print_timings:        load time =    8836.66 ms
llama_print_timings:      sample time =      41.76 ms /   500 runs   (    0.08 ms per token, 11972.32 tokens per second)
llama_print_timings: prompt eval time =     304.28 ms /     9 tokens (   33.81 ms per token,    29.58 tokens per second)
llama_print_timings:        eval time =   30052.85 ms /   499 runs   (   60.23 ms per token,    16.60 tokens per second)
llama_print_timings:       total time =   30722.98 ms /   508 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `1000` (f16):

```sh
a2@a2s:~$ ./llama-cli-sycl-b3617-f16 -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -ngl 33 -sm none -n 1000

(此处省略一部分)

llama_print_timings:        load time =    8206.19 ms
llama_print_timings:      sample time =      96.05 ms /  1000 runs   (    0.10 ms per token, 10411.24 tokens per second)
llama_print_timings: prompt eval time =     312.47 ms /     9 tokens (   34.72 ms per token,    28.80 tokens per second)
llama_print_timings:        eval time =   60716.89 ms /   999 runs   (   60.78 ms per token,    16.45 tokens per second)
llama_print_timings:       total time =   61768.29 ms /  1008 tokens
```

### 3.8 Windows (CPU) r5-5600g AVX2

在 6 号 PC (物理机) 上运行. 版本:

```sh
>.\llama-b3617-bin-win-avx2-x64\llama-cli.exe --version
version: 3617 (a07c32ea)
built with MSVC 19.29.30154.0 for x64
```

运行模型 `llama2-7B.q4`, 生成长度 `100`:

```sh
p>.\llama-b3617-bin-win-avx2-x64\llama-cli.exe -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 100
Log start
main: build = 3617 (a07c32ea)
main: built with MSVC 19.29.30154.0 for x64
main: seed  = 1724480697

llama_print_timings:        load time =    1005.41 ms
llama_print_timings:      sample time =       4.11 ms /   100 runs   (    0.04 ms per token, 24354.60 tokens per second)
llama_print_timings: prompt eval time =     399.08 ms /    10 tokens (   39.91 ms per token,    25.06 tokens per second)
llama_print_timings:        eval time =    9688.39 ms /    99 runs   (   97.86 ms per token,    10.22 tokens per second)
llama_print_timings:       total time =   10110.42 ms /   109 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `200`:

```sh
>.\llama-b3617-bin-win-avx2-x64\llama-cli.exe -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 200

llama_print_timings:        load time =    1045.93 ms
llama_print_timings:      sample time =       8.82 ms /   200 runs   (    0.04 ms per token, 22673.17 tokens per second)
llama_print_timings: prompt eval time =     436.84 ms /    10 tokens (   43.68 ms per token,    22.89 tokens per second)
llama_print_timings:        eval time =   19960.35 ms /   199 runs   (  100.30 ms per token,     9.97 tokens per second)
llama_print_timings:       total time =   20439.79 ms /   209 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `500`:

```sh
>.\llama-b3617-bin-win-avx2-x64\llama-cli.exe -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 500

llama_print_timings:        load time =    1028.02 ms
llama_print_timings:      sample time =      18.32 ms /   500 runs   (    0.04 ms per token, 27300.03 tokens per second)
llama_print_timings: prompt eval time =     382.15 ms /    10 tokens (   38.22 ms per token,    26.17 tokens per second)
llama_print_timings:        eval time =   51622.99 ms /   499 runs   (  103.45 ms per token,     9.67 tokens per second)
llama_print_timings:       total time =   52107.10 ms /   509 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `1000`:

```sh
>.\llama-b3617-bin-win-avx2-x64\llama-cli.exe -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 1000

llama_print_timings:        load time =    1241.78 ms
llama_print_timings:      sample time =      41.52 ms /  1000 runs   (    0.04 ms per token, 24084.78 tokens per second)
llama_print_timings: prompt eval time =     484.10 ms /    10 tokens (   48.41 ms per token,    20.66 tokens per second)
llama_print_timings:        eval time =  114393.05 ms /   999 runs   (  114.51 ms per token,     8.73 tokens per second)
llama_print_timings:       total time =  115084.29 ms /  1009 tokens
```

----

运行模型 `qwen2-7B.q8`, 生成长度 `100`:

```sh
>.\llama-b3617-bin-win-avx2-x64\llama-cli.exe -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 100

llama_print_timings:        load time =    1429.29 ms
llama_print_timings:      sample time =      15.21 ms /   100 runs   (    0.15 ms per token,  6572.89 tokens per second)
llama_print_timings: prompt eval time =     523.07 ms /     9 tokens (   58.12 ms per token,    17.21 tokens per second)
llama_print_timings:        eval time =   17786.69 ms /    99 runs   (  179.66 ms per token,     5.57 tokens per second)
llama_print_timings:       total time =   18409.82 ms /   108 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `200`:

```sh
>.\llama-b3617-bin-win-avx2-x64\llama-cli.exe -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 200

llama_print_timings:        load time =    1424.62 ms
llama_print_timings:      sample time =      31.78 ms /   200 runs   (    0.16 ms per token,  6292.47 tokens per second)
llama_print_timings: prompt eval time =     564.79 ms /     9 tokens (   62.75 ms per token,    15.93 tokens per second)
llama_print_timings:        eval time =   36148.33 ms /   199 runs   (  181.65 ms per token,     5.51 tokens per second)
llama_print_timings:       total time =   36919.37 ms /   208 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `500`:

```sh
>.\llama-b3617-bin-win-avx2-x64\llama-cli.exe -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 500

llama_print_timings:        load time =    1462.26 ms
llama_print_timings:      sample time =      80.31 ms /   500 runs   (    0.16 ms per token,  6225.64 tokens per second)
llama_print_timings: prompt eval time =     720.86 ms /     9 tokens (   80.10 ms per token,    12.49 tokens per second)
llama_print_timings:        eval time =   90566.92 ms /   499 runs   (  181.50 ms per token,     5.51 tokens per second)
llama_print_timings:       total time =   91801.55 ms /   508 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `1000`:

```sh
>.\llama-b3617-bin-win-avx2-x64\llama-cli.exe -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 1000

llama_print_timings:        load time =    1439.21 ms
llama_print_timings:      sample time =     165.06 ms /  1000 runs   (    0.17 ms per token,  6058.48 tokens per second)
llama_print_timings: prompt eval time =     555.15 ms /     9 tokens (   61.68 ms per token,    16.21 tokens per second)
llama_print_timings:        eval time =  184706.64 ms /   999 runs   (  184.89 ms per token,     5.41 tokens per second)
llama_print_timings:       total time =  186313.82 ms /  1008 tokens
```

### 3.9 Windows (GPU) A770 vulkan

在 6 号 PC (物理机) 上运行. 版本:

```sh
>.\llama-b3617-bin-win-vulkan-x64\llama-cli.exe --version
version: 3617 (a07c32ea)
built with MSVC 19.29.30154.0 for x64
```

运行模型 `llama2-7B.q4`, 生成长度 `100`:

```sh
>.\llama-b3617-bin-win-vulkan-x64\llama-cli.exe -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 100 -ngl 33
Log start
main: build = 3617 (a07c32ea)
main: built with MSVC 19.29.30154.0 for x64
main: seed  = 1724482103

llama_print_timings:        load time =    3375.14 ms
llama_print_timings:      sample time =       4.04 ms /   100 runs   (    0.04 ms per token, 24764.74 tokens per second)
llama_print_timings: prompt eval time =     471.87 ms /    10 tokens (   47.19 ms per token,    21.19 tokens per second)
llama_print_timings:        eval time =    5913.11 ms /    99 runs   (   59.73 ms per token,    16.74 tokens per second)
llama_print_timings:       total time =    6408.49 ms /   109 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `200`:

```sh
>.\llama-b3617-bin-win-vulkan-x64\llama-cli.exe -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 200 -ngl 33

llama_print_timings:        load time =    2932.55 ms
llama_print_timings:      sample time =       8.03 ms /   200 runs   (    0.04 ms per token, 24915.91 tokens per second)
llama_print_timings: prompt eval time =     471.34 ms /    10 tokens (   47.13 ms per token,    21.22 tokens per second)
llama_print_timings:        eval time =   11931.98 ms /   199 runs   (   59.96 ms per token,    16.68 tokens per second)
llama_print_timings:       total time =   12452.04 ms /   209 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `500`:

```sh
>.\llama-b3617-bin-win-vulkan-x64\llama-cli.exe -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 500 -ngl 33

llama_print_timings:        load time =    2913.84 ms
llama_print_timings:      sample time =      19.84 ms /   500 runs   (    0.04 ms per token, 25204.15 tokens per second)
llama_print_timings: prompt eval time =     471.64 ms /    10 tokens (   47.16 ms per token,    21.20 tokens per second)
llama_print_timings:        eval time =   30253.41 ms /   499 runs   (   60.63 ms per token,    16.49 tokens per second)
llama_print_timings:       total time =   30844.12 ms /   509 tokens
```

运行模型 `llama2-7B.q4`, 生成长度 `1000`:

```sh
>.\llama-b3617-bin-win-vulkan-x64\llama-cli.exe -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 1000 -ngl 33

llama_print_timings:        load time =    2909.30 ms
llama_print_timings:      sample time =      40.91 ms /  1000 runs   (    0.04 ms per token, 24443.90 tokens per second)
llama_print_timings: prompt eval time =     471.58 ms /    10 tokens (   47.16 ms per token,    21.21 tokens per second)
llama_print_timings:        eval time =   61725.41 ms /   999 runs   (   61.79 ms per token,    16.18 tokens per second)
llama_print_timings:       total time =   62433.39 ms /  1009 tokens
```

----

运行模型 `qwen2-7B.q8`, 生成长度 `100`:

```sh
>.\llama-b3617-bin-win-vulkan-x64\llama-cli.exe -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 100 -ngl 33

llama_print_timings:        load time =    4785.92 ms
llama_print_timings:      sample time =       9.08 ms /   100 runs   (    0.09 ms per token, 11016.86 tokens per second)
llama_print_timings: prompt eval time =     609.77 ms /     9 tokens (   67.75 ms per token,    14.76 tokens per second)
llama_print_timings:        eval time =    6401.98 ms /    99 runs   (   64.67 ms per token,    15.46 tokens per second)
llama_print_timings:       total time =    7100.18 ms /   108 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `200`:

```sh
>.\llama-b3617-bin-win-vulkan-x64\llama-cli.exe -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 200 -ngl 33

llama_print_timings:        load time =    4783.54 ms
llama_print_timings:      sample time =      18.63 ms /   200 runs   (    0.09 ms per token, 10735.37 tokens per second)
llama_print_timings: prompt eval time =     610.60 ms /     9 tokens (   67.84 ms per token,    14.74 tokens per second)
llama_print_timings:        eval time =   12910.01 ms /   199 runs   (   64.87 ms per token,    15.41 tokens per second)
llama_print_timings:       total time =   13698.94 ms /   208 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `500`:

```sh
>.\llama-b3617-bin-win-vulkan-x64\llama-cli.exe -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 500 -ngl 33

llama_print_timings:        load time =    4798.07 ms
llama_print_timings:      sample time =      46.32 ms /   500 runs   (    0.09 ms per token, 10794.47 tokens per second)
llama_print_timings: prompt eval time =     610.28 ms /     9 tokens (   67.81 ms per token,    14.75 tokens per second)
llama_print_timings:        eval time =   32517.07 ms /   499 runs   (   65.16 ms per token,    15.35 tokens per second)
llama_print_timings:       total time =   33565.60 ms /   508 tokens
```

运行模型 `qwen2-7B.q8`, 生成长度 `1000`:

```sh
>.\llama-b3617-bin-win-vulkan-x64\llama-cli.exe -m qwen2-7b-instruct-q8_0.gguf -p "hello, this is a very very long story" -n 1000 -ngl 33

llama_print_timings:        load time =    4802.01 ms
llama_print_timings:      sample time =      93.21 ms /   989 runs   (    0.09 ms per token, 10610.22 tokens per second)
llama_print_timings: prompt eval time =     610.76 ms /     9 tokens (   67.86 ms per token,    14.74 tokens per second)
llama_print_timings:        eval time =   64868.89 ms /   988 runs   (   65.66 ms per token,    15.23 tokens per second)
llama_print_timings:       total time =   66351.20 ms /   997 tokens
```


## 4 结果对比

上面的测量结果汇总如下表:

![测量结果汇总表](./图/4-t-1.png)

数据单位: `token/s`

注意 token 并不相当于字符.
一个 token 有时候对应一个字符 (数字, 标点, 空格 等),
有时候对应一个单词, 有时候对应半个单词.

### 4.1 CPU 运行

![CPU 推理速度](./图/4-c-1.png)

这 3 个都是 x86_64 CPU, 都使用 avx2 指令集进行 SIMD 加速.

弱鸡老旧笔记本 CPU (i5-6200U, 2 核 4 线程) 确实很慢,
e5-2650v3 (10 核 10 线程) 和 r5-5600g (6 核 12 线程) 打的难舍难分.
对于 7B.q4 模型 r5-5600g 更快一些, 对于 7B.q8 模型 e5-2650v3 更快一些.

### 4.2 iGPU 运行

![iGPU 推理速度](./图/4-c-2.png)

这是集成显卡 (核显), 都使用 vulkan 运行.

弱鸡核显, 速度甚至比自己隔壁的 CPU 更慢, 基本没有实用价值.

### 4.3 dGPU (A770) 运行

![A770 推理速度](./图/4-c-3.png)

这是 A770 (16GB) 显卡, 分别以 vulkan, SYCL (f32), SYCL (f16) 运行.
左侧是 CPU (avx2) 的对比.

A770 的速度大约可以达到 CPU 的 2 ~ 3 倍.
对于 7B.q4 模型 SYCL (f32) 更快, 对于 7B.q8 模型 vulkan 更快.

SYCL 的 f32 和 f16 区别不大, 通常 f32 更快一点.

### 4.4 Linux 和 Windows 对比

![Linux vs Windows](./图/4-c-4.png)

这是 CPU (r5-5600g, avx2) 和 dGPU (A770, vulkan) 的速度对比,
标记 "Win" 的是 Windows 系统, 没有标记的是 GNU/Linux 系统.

CPU 运行速度基本没有区别, vulkan 运行速度 Linux 更快一些.

----

本章节图表绘制软件: LibreOffice Calc.


## 5 总结与展望

通过 `llama.cpp` 运行 7B.q4 (4bit 量化), 7B.q8 (8bit 量化) 模型,
测量了生成式 AI 语言模型在多种硬件上的运行 (推理) 速度.

根据上述测量结果, 可以得到以下初步结论:

+ (1) **显存 (内存) 大就是正义 ! 大, 就是正义 !!**

  限制能够运行的模型规模的最主要因素, 就是显存的大小.
  目前的大部分显卡 (除了高端的比如 4090), 显存都不超过 16GB.

  即使显卡计算能力弱鸡, 如果显存够大, 那么也能慢慢运行大模型.
  但是如果显存不够, 那么不好意思, 基本上就是无法运行 !
  所以, 在条件允许的情况下, 优先选显存更大的显卡.

+ (2) **生成长度越长, 推理速度越慢.**
  从上面的测量数据可以发现这个规律.
  但是随着生成长度的增加, 推理速度下降的幅度很小, 影响不大.

+ (3) **弱鸡核显 (iGPU vulkan) 可能比 CPU (avx2) 更慢.**
  核显有可能比 CPU 更慢, 这种情况下, 使用核显基本上就没有意义,
  直接使用 CPU 是更好的选择.

+ (4) **e5 宝刀未老: avx2 运行 AI 模型仍有一战之力.**

  本文中 e5 的成绩是很惊艳的.
  要知道, e5 (v3) 是一颗很古老, 很便宜的 CPU, 在淘宝一颗 e5 可能只要几十元.
  但是 e5 却可以达到甚至超过 r5-5600g 的速度, 所以 e5 的性价比应该是很高的.

  运行大模型时, 内存带宽可能是瓶颈. e5 作为服务器 CPU, 有多通道内存的优势.
  比如本文中 e5 配备 4 通道 DDR4 内存, 这也可能是 e5 成绩好的原因.

  本文中没有近几年的新 CPU, 所以只支持 avx2 指令集, 没有最新的 axv512 指令集.
  具有 avx512 指令集的新 CPU, 在运行 AI 大模型时应该更有优势.

+ (5) **A770 vulkan 不算太慢**, 可以日常使用.
  本文中 A770 的推理速度可达 20 ~ 30 token/s, 虽然不算很快, 但基本能用了.

+ (6) **Linux 和 Windows 的 CPU 性能基本相同.**
  很好, 这说明两个系统都没有明显的性能方面的问题.

+ (7) **Linux 的 vulkan 性能比 Windows 好一些.**
  这可能和显卡驱动的优化有关, 还需要进一步分析可能的原因.

+ (8) **SYCL 性能需要继续努力优化.**

  vulkan 是通用的 GPU 接口, 支持多种显卡.
  而 SYCL 是专用的 GPU 接口, 为 Intel GPU 专门优化, 比如支持 XMX (矩阵乘法加速).
  SYCL 对于 Intel GPU 的地位, 就类似于 CUDA 对于 N 卡.
  所以 SYCL 理应比 vulkan 速度更快, 这才正常.

  在运行 7B.q4 模型时, SYCL 确实比 vulkan 快很多.
  但是运行 7B.q8 模型时, SYCL 居然反而比 vulkan 更慢 !
  这种速度是不正常的, 肯定是哪里优化的问题.
  可能是 llama.cpp 的优化不到位, 也可能是 Intel 显卡驱动的优化不到位.
  所以相关团队需要继续努力哟 ~

----

本文只是简单测量了神经网络模型的推理速度, 还有很多有趣的问题没有探索.
比如运行大模型时, 整机功耗及发热情况, 内存带宽与运行速度的关系等.

llama.cpp 用来加速运行模型的各种方法, 比如模型量化 (8bit, 4bit 等),
SIMD (avx2), vulkan (GPU), SYCL (Intel GPU) 等,
也都很值得学习和借鉴.

----

本文使用 CC-BY-SA 4.0 许可发布.
