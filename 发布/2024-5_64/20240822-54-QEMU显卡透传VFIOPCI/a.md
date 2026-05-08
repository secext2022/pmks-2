# QEMU/KVM 虚拟机显卡透传 (vfio-pci)

本文介绍将 PCIE 设备 (显卡) 透传给 QEMU/KVM 虚拟机的一种方法,
基于 Linux 内核的 vfio-pci 功能.
透传 (pass through) 之后, 虚拟机内可以直接操作 (使用) 显卡硬件, 就像物理机那样,
几乎没有虚拟化的性能损失.

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术.

----

相关文章:

+ 《香橙派: 在容器 (podman) 中运行 x11 图形界面》

  TODO

+ 《自制神之嘴: fish-speech 容器镜像 (文本转语音 AI 大模型)》

  TODO


## 目录

+ 1 显卡透传简介

+ 2 详细过程

  - 2.1 安装虚拟机软件 (QEMU, libvirt, virt-manager)
  - 2.2 配置 vfio-pci 内核参数 (GRUB)
  - 2.3 创建虚拟机并安装 ubuntu 22.04 (server)
  - 2.4 配置 SSH 公钥登录
  - 2.5 分配显卡

+ 3 测试

  - 3.1 安装 Intel GPU 驱动
  - 3.2 获取 GPU 信息

+ 4 总结与展望


## 1 显卡透传简介

**虚拟机** (virtual machine) 顾名思义, 一台计算机的各种硬件设备都是虚拟的:
CPU 是虚拟的, 内存是虚拟的, 硬盘, 网卡, 显卡, 键盘/鼠标/显示器, .. .
这些全都是用软件虚拟的.
比如著名的开源虚拟机软件 **QEMU** 里面就有模拟各种硬件设备的程序代码:
<https://www.qemu.org/>

软件虚拟能够提供很高的灵活度和弹性, 能够实现很多物理硬件难以做到的,
玩的很花的操作.
但是软件虚拟有一个很大的缺点: **性能差**. 软件虚拟的损耗比较高,
速度通常只有物理硬件设备的几分之一, 甚至有时候降低很多个数量级.

人们又总是想既要又要, 想要虚拟机的灵活, 又想要物理机的高速, 怎么办 ?
简单, 双方混合一下: 一部分用软件虚拟, 另一部分不虚拟, 这不就行了 ?

PCIE 设备透传就是这样一种技术, 可以将一个物理 PCIE 设备直接分配给某个虚拟机,
由这个虚拟机独占并直接操作这个硬件设备.
这种技术常用于 **显卡** (GPU) 的透传, 因为透传显卡的效果很显著.

通过透传, 一台虚拟机就不再是纯软件虚拟的, 通过放弃一部分虚拟化的好处,
在虚和不虚之间达到一种平衡.


## 2 详细过程

物理机操作系统: ArchLinux

```sh
> uname -a
Linux a23 6.10.6-zen1-1-zen #1 ZEN SMP PREEMPT_DYNAMIC Mon, 19 Aug 2024 17:02:05 +0000 x86_64 GNU/Linux
```

参考资料: <https://wiki.archlinux.org/title/PCI_passthrough_via_OVMF>

主要硬件:

+ CPU: AMD `r5-5600g`
+ GPU: Intel Arc A770 (16GB)

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
    CPU(s) scaling MHz:   68%
    CPU 最大 MHz：        4464.0000
    CPU 最小 MHz：        400.0000
    BogoMIPS：            7785.35
    标记：                fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov p
                          at pse36 clflush mmx fxsr sse sse2 ht syscall nx mmxext fxsr_op
                          t pdpe1gb rdtscp lm constant_tsc rep_good nopl xtopology nonsto
                          p_tsc cpuid extd_apicid aperfmperf rapl pni pclmulqdq monitor s
                          sse3 fma cx16 sse4_1 sse4_2 x2apic movbe popcnt aes xsave avx f
                          16c rdrand lahf_lm cmp_legacy svm extapic cr8_legacy abm sse4a 
                          misalignsse 3dnowprefetch osvw ibs skinit wdt tce topoext perfc
                          tr_core perfctr_nb bpext perfctr_llc mwaitx cpb cat_l3 cdp_l3 h
                          w_pstate ssbd mba ibrs ibpb stibp vmmcall fsgsbase bmi1 avx2 sm
                          ep bmi2 erms invpcid cqm rdt_a rdseed adx smap clflushopt clwb 
                          sha_ni xsaveopt xsavec xgetbv1 xsaves cqm_llc cqm_occup_llc cqm
                          _mbm_total cqm_mbm_local user_shstk clzero irperf xsaveerptr rd
                          pru wbnoinvd cppc arat npt lbrv svm_lock nrip_save tsc_scale vm
                          cb_clean flushbyasid decodeassists pausefilter pfthreshold avic
                           v_vmsave_vmload vgif v_spec_ctrl umip pku ospke vaes vpclmulqd
                          q rdpid overflow_recov succor smca fsrm debug_swap
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
  Spec store bypass:      Mitigation; Speculative Store Bypass disabled via prctl
  Spectre v1:             Mitigation; usercopy/swapgs barriers and __user pointer sanitiz
                          ation
  Spectre v2:             Mitigation; Retpolines; IBPB conditional; IBRS_FW; STIBP always
                          -on; RSB filling; PBRSB-eIBRS Not affected; BHI Not affected
  Srbds:                  Not affected
  Tsx async abort:        Not affected
```

### 2.1 安装虚拟机软件 (QEMU, libvirt, virt-manager)

安装相关软件包 (执行命令):

```sh
sudo pacman -S qemu-desktop libvirt edk2-ovmf virt-manager
```

然后将自己加入 `libvirt` 用户组 (获得使用权限):

```sh
sudo gpasswd -a s2 libvirt
```

注意把 `s2` 换成自己的用户名.

### 2.2 配置 vfio-pci 内核参数 (GRUB)

+ (1) 检查 IOMMU 是否启用.
  为了进行 PCIE 透传, 需要启用 `IOMMU`.
  IOMMU 是 CPU (或主板芯片组) 中的一个硬件, 能够管理 PCIE 设备对内存的访问.

  ```sh
  > sudo dmesg | grep IOMMU
  [    0.329992] pci 0000:00:00.2: AMD-Vi: IOMMU performance counters supported
  [    0.609945] perf/amd_iommu: Detected AMD IOMMU #0 (2 banks, 4 counters/bank).
  ```

  比如此处显示 IOMMU (AMD-Vi) 已经启用.
  如果没有启用, 可能需要在主板的 BIOS 设置中启用, 或者在网上查找资料解决.

+ (2) 检查 IOMMU 设备分组情况.
  首先将下列代码保存为 `iommu-group.sh` (文件名随意):

  ```sh
  #!/bin/bash
  shopt -s nullglob
  for g in $(find /sys/kernel/iommu_groups/* -maxdepth 0 -type d | sort -V); do
      echo "IOMMU Group ${g##*/}:"
      for d in $g/devices/*; do
          echo -e "\t$(lspci -nns ${d##*/})"
      done;
  done;
  ```

  然后运行一下 (省略部分结果):

  ```sh
  > chmod +x iommu-group.sh
  > ./iommu-group.sh

  IOMMU Group 12:
    12:00.0 VGA compatible controller [0300]: Intel Corporation DG2 [Arc A770] [8086:56a0] (rev 08)
  ```

  比如此处显示 A770 显卡位于 `IOMMU Group 12` 分组.

  位于同一个 IOMMU 分组中的设备, 只能整体全部分配给虚拟机.
  也就是说 IOMMU 分组不能拆分.
  所以, 如果同一个 IOMMU 分组里面还有别的设备, 就麻烦了.
  此处没有别的设备, 很好.

+ (3) 配置 Linux 内核命令行参数.
  为了把显卡分配给虚拟机使用, 应该避免物理机上的驱动使用显卡,
  否则可能会造成冲突.

  ----

  此处以引导程序 `GRUB` 举栗.
  如果使用别的引导程序, 具体细节可能不同, 但原理是一样的.
  编辑 GRUB 配置文件 `/etc/default/grub`:

  ```sh
  sudo nano /etc/default/grub
  ```

  改成这样 (省略部分结果):

  ```sh
  > cat /etc/default/grub

  GRUB_CMDLINE_LINUX_DEFAULT="loglevel=3 quiet vfio-pci.ids=8086:56a0"
  ```

  也就是在 `GRUB_CMDLINE_LINUX_DEFAULT` 里面添加 `vfio-pci.ids=8086:56a0`.
  这表示给内核模块 `vfio-pci` 设置参数 `ids`.
  其中 `8086:56a0` 是设备的 PCI 编号, 在上一步查看 IOMMU 分组时可以获得.
  如果有多个设备, 以逗号 `,` 分隔, 比如 `vfio-pci.ids=8086:56a0,103c:8136`.

  然后重新生成 GRUB 配置文件:

  ```sh
  sudo grub-mkconfig -o /boot/grub/grub.cfg
  ```

**重启计算机 (物理机)**.

----

重启之后检查配置是否生效:

```sh
> sudo dmesg | grep -i vfio

[    3.102514] VFIO - User Level meta-driver version: 0.3
[    3.110611] vfio-pci 0000:12:00.0: vgaarb: VGA decodes changed: olddecodes=io+mem,decodes=io+mem:owns=none
[    3.110717] vfio_pci: add [8086:56a0[ffffffff:ffffffff]] class 0x000000/00000000
```

以及:

```sh
> lspci -nnk -d 8086:56a0
12:00.0 VGA compatible controller [0300]: Intel Corporation DG2 [Arc A770] [8086:56a0] (rev 08)
	Subsystem: Shenzhen Gunnir Technology Development Co., Ltd Device [1ef7:1513]
	Kernel driver in use: vfio-pci
	Kernel modules: i915, xe
```

比如此处表示 A770 目前使用 `vfio-pci` 内核驱动.

### 2.3 创建虚拟机并安装 ubuntu 22.04 (server)

下载 ubuntu 22.04 安装光盘镜像: <https://ubuntu.com/download/server>

```sh
> ls -l ubuntu-22.04.4-live-server-amd64.iso
-rw-r--r-- 1 s2 s2 2104408064  8月21日 10:45 ubuntu-22.04.4-live-server-amd64.iso
```

这是下载的 iso 文件.

----

启动 `libvirtd` 服务:

```sh
sudo systemctl start libvirtd
```

然后打开 `virt-manager`:

![创建虚拟机 (1)](./图/23-cv-1.png)

这是一个方便使用的虚拟机管理 (libvirt) 图形界面.

![创建虚拟机 (2)](./图/23-cv-2.png)

右击 `QEMU/KVM` 在菜单中选择 `New` 开始创建虚拟机.

![创建虚拟机 (3)](./图/23-cv-3.png)

点击 `Forward` 下一步.

![创建虚拟机 (4)](./图/23-cv-4.png)

点击 `浏览` 选择安装光盘镜像.

![创建虚拟机 (5)](./图/23-cv-5.png)

点击左下角的 加号:

![创建虚拟机 (6)](./图/23-cv-6.png)

点击 `浏览` 选择本地目录:

![创建虚拟机 (7)](./图/23-cv-7.png)

点击 `完成`.

![创建虚拟机 (8)](./图/23-cv-8.png)

选择安装光盘镜像 iso 文件, 点击 `Choose Volume` 按钮.

![创建虚拟机 (9)](./图/23-cv-9.png)

下一步.

![创建虚拟机 (10)](./图/23-cv-10.png)

分配内存大小和 CPU 核心数, 下一步.

![创建虚拟机 (11)](./图/23-cv-11.png)

设置虚拟磁盘大小, 下一步.
虚拟磁盘的大小在使用过程中动态分配, 所以设置的大一些也可以.

![创建虚拟机 (12)](./图/23-cv-12.png)

点击 `完成`, 开始安装 ubuntu 22.04:

![安装 ubuntu (1)](./图/23-iu-1.png)

启动界面, 选择第一项, 回车 (Enter) 键启动.

![安装 ubuntu (2)](./图/23-iu-2.png)

语言选项, 保持默认, 按回车键.

![安装 ubuntu (3)](./图/23-iu-3.png)

软件源配置 (用来下载软件包), 默认会自动检测. 按回车键确认.

![安装 ubuntu (4)](./图/23-iu-4.png)

磁盘分区配置, 保持默认, 按回车键.

![安装 ubuntu (5)](./图/23-iu-5.png)

设置用户名和密码. 此处设置的用户名为 `a2`, 按回车键确认.

![安装 ubuntu (6)](./图/23-iu-6.png)

选择安装 OpenSSH (`Install OpenSSH server`), 按回车键确认.

![安装 ubuntu (7)](./图/23-iu-7.png)

正在安装系统, 稍等.

![安装 ubuntu (8)](./图/23-iu-8.png)

安装完毕, 选择重启 (`Reboot Now`).

![安装 ubuntu (9)](./图/23-iu-9.png)

重启之后, 提示登录.

![安装 ubuntu (10)](./图/23-iu-10.png)

输入之前设置的用户名和密码, 登录成功.
注意此处显示的虚拟机的 IP 地址 (`192.168.122.140`), 接下来会用到.

至此, ubuntu 22.04 操作系统在虚拟机内安装完毕.

### 2.4 配置 SSH 公钥登录

为了方便操作, 配置 SSH 登录虚拟机.

+ (1) 在物理机生成 **公钥** / **私钥** 对:

  ```sh
  ssh-keygen -t ed25519 -C ubuntu-20240821 -f ~/.ssh/id_ed25519-ubuntu-20240821
  ```

+ (2) 使用 `ssh-copy-id` 命令, 复制公钥到虚拟机:

  ```sh
  ssh-copy-id -i ~/.ssh/id_ed25519-ubuntu-20240821 a2@192.168.122.140
  ```

  此处虚拟机的 IP 地址是 `192.168.122.140`.
  输入用户的密码, 完成复制.

+ (3) 编辑 SSH 配置文件:

  ```sh
  nano ~/.ssh/config
  ```

  改成类似这样:

  ```sh
  > cat ~/.ssh/config

  Host u2
      HostName 192.168.122.140
      User a2
      IdentityFile ~/.ssh/id_ed25519-ubuntu-20240821
  ```

----

尝试 SSH 连接:

```sh
ssh u2
```

如果正常登录, 说明配置成功.

### 2.5 分配显卡

首先 **关闭虚拟机**:

```sh
sudo systemctl poweroff
```

然后对虚拟机进行配置:

![分配显卡 (1)](./图/25-g-1.png)

在 `概况` > `XML` 里面, 选中这一部分, 删除:

![分配显卡 (2)](./图/25-g-2.png)

然后点击 `Apply` 应用.

![分配显卡 (3)](./图/25-g-3.png)

**把左侧多余的硬件删除**, 然后点击 `添加硬件`:

![分配显卡 (4)](./图/25-g-4.png)

选择 `A770` 显卡, 点击 `完成`.

![分配显卡 (5)](./图/25-g-5.png)

配置完毕, 如图.

----

启动虚拟机 (此时没有显示画面), 使用 SSH 登录.
安装软件包:

```sh
a2@a2s:~$ sudo apt install hwinfo
```

查看显卡信息:

```sh
a2@a2s:~$ hwinfo --display
06: PCI 300.0: 0300 VGA compatible controller (VGA)             
  [Created at pci.386]
  Unique ID: svHJ.GAeDACVau78
  Parent ID: jDmU.iGV8l8b74r0
  SysFS ID: /devices/pci0000:00/0000:00:02.2/0000:03:00.0
  SysFS BusID: 0000:03:00.0
  Hardware Class: graphics card
  Model: "Intel VGA compatible controller"
  Vendor: pci 0x8086 "Intel Corporation"
  Device: pci 0x56a0 
  SubVendor: pci 0x1ef7 
  SubDevice: pci 0x1513 
  Revision: 0x08
  Memory Range: 0xfb000000-0xfbffffff (rw,non-prefetchable)
  Memory Range: 0x385800000000-0x385bffffffff (ro,non-prefetchable)
  Memory Range: 0x000c0000-0x000dffff (rw,non-prefetchable,disabled)
  Module Alias: "pci:v00008086d000056A0sv00001EF7sd00001513bc03sc00i00"
  Config Status: cfg=new, avail=yes, need=no, active=unknown
  Attached to: #25 (PCI bridge)

Primary display adapter: #6
```

说明透传成功.


## 3 测试

这些操作在虚拟机中进行. 首先更新一下系统:

```sh
a2@a2s:~$ uname -a
Linux a2s 5.15.0-119-generic #129-Ubuntu SMP Fri Aug 2 19:25:20 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux
a2@a2s:~$ sudo apt update
```

然后:

```sh
a2@a2s:~$ sudo apt upgrade
```

### 3.1 安装 Intel GPU 驱动

参考资料: <https://dgpu-docs.intel.com/driver/client/overview.html>

+ (1) 配置 apt 软件源:

  ```sh
  curl https://repositories.intel.com/gpu/intel-graphics.key | sudo gpg --dearmor --output /usr/share/keyrings/intel-graphics.gpg

  echo "deb [arch=amd64,i386 signed-by=/usr/share/keyrings/intel-graphics.gpg] https://repositories.intel.com/gpu/ubuntu jammy client" | sudo tee /etc/apt/sources.list.d/intel-gpu-jammy.list

  apt update
  ```

+ (2) 安装新的 (HWE) Linux 内核:

  ```sh
  sudo apt install --install-suggests linux-generic-hwe-22.04
  ```

+ (3) 安装 GPU 驱动软件包:

  ```sh
  sudo apt install intel-opencl-icd intel-level-zero-gpu level-zero intel-level-zero-gpu-raytracing intel-media-va-driver-non-free libmfx1 libmfxgen1 libvpl2 libegl-mesa0 libegl1-mesa libegl1-mesa-dev libgbm1 libgl1-mesa-dev libgl1-mesa-dri libglapi-mesa libgles2-mesa-dev libglx-mesa0 libigdgmm12 libxatracker2 mesa-va-drivers mesa-vdpau-drivers mesa-vulkan-drivers va-driver-all vainfo hwinfo clinfo
  ```

  把自己加入 `render` 用户组:

  ```sh
  a2@a2s:~$ sudo gpasswd -a a2 render
  [sudo] password for a2: 
  Adding user a2 to group render
  ```

**重启虚拟机**:

```sh
a2@a2s:~$ sudo systemctl reboot
```

### 3.2 获取 GPU 信息

重启之后进行检查:

```sh
a2@a2s:~$ uname -a
Linux a2s 6.8.0-40-generic #40~22.04.3-Ubuntu SMP PREEMPT_DYNAMIC Tue Jul 30 17:30:19 UTC 2 x86_64 x86_64 x86_64 GNU/Linux
a2@a2s:~$ ls -l /dev/dri
total 0
drwxr-xr-x 2 root root         80 Aug 21 04:45 by-path
crw-rw---- 1 root video  226,   0 Aug 21 04:45 card0
crw-rw---- 1 root render 226, 128 Aug 21 04:45 renderD128
a2@a2s:~$ hwinfo --display
06: PCI 300.0: 0300 VGA compatible controller (VGA)             
  [Created at pci.386]
  Unique ID: svHJ.GAeDACVau78
  Parent ID: jDmU.iGV8l8b74r0
  SysFS ID: /devices/pci0000:00/0000:00:02.2/0000:03:00.0
  SysFS BusID: 0000:03:00.0
  Hardware Class: graphics card
  Model: "Intel VGA compatible controller"
  Vendor: pci 0x8086 "Intel Corporation"
  Device: pci 0x56a0 
  SubVendor: pci 0x1ef7 
  SubDevice: pci 0x1513 
  Revision: 0x08
  Driver: "i915"
  Driver Modules: "i915"
  Memory Range: 0xfb000000-0xfbffffff (rw,non-prefetchable)
  Memory Range: 0x385800000000-0x385bffffffff (ro,non-prefetchable)
  Memory Range: 0x000c0000-0x000dffff (rw,non-prefetchable,disabled)
  IRQ: 54 (88 events)
  Module Alias: "pci:v00008086d000056A0sv00001EF7sd00001513bc03sc00i00"
  Driver Info #0:
    Driver Status: i915 is active
    Driver Activation Cmd: "modprobe i915"
  Driver Info #1:
    Driver Status: xe is active
    Driver Activation Cmd: "modprobe xe"
  Config Status: cfg=new, avail=yes, need=no, active=unknown
  Attached to: #25 (PCI bridge)

Primary display adapter: #6
```

以及:

```sh
a2@a2s:~$ id
uid=1000(a2) gid=1000(a2) groups=1000(a2),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),109(render),110(lxd)
a2@a2s:~$ clinfo -l
Platform #0: Intel(R) OpenCL Graphics
 `-- Device #0: Intel(R) Arc(TM) A770 Graphics
```

说明 GPU 驱动安装成功.


## 4 总结与展望

通过使用 Linux 内核的 vfio-pci 功能, 成功将显卡 A770 透传给 QEMU/KVM 虚拟机,
并在虚拟机中成功安装了 GPU 驱动.

本文演示了在虚拟机中安装 ubuntu 22.04 (server) 操作系统.
其实在虚拟机中安装 Windows 也是可以的, 同样能够安装显卡驱动并使用.

除了透传显卡, 根据实际需要, 也可以尝试透传别的 PCIE 设备.

显卡透传之后, 虚拟机内就可以直接操作显卡了, 通过安装驱动,
可以使用显卡的全部功能, 就像物理机一样.

----

本文使用 CC-BY-SA 4.0 许可发布.
