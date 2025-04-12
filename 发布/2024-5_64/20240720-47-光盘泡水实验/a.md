# 光盘防水嘛 ? DVD+R 刻录光盘泡水实验

同志们好, 欢迎来到 胖喵穷人实验室 !
这里专注于 **低成本**, **低难度**, **低风险** 的 "三低" 小实验.

```
胖喵穷人实验室 (PM-PLab-E)

正式名称: 紫腹巨蚊 (Toxorhynchites gravelyi) 系列
  穷人 (Poor people) 实验室
```

**风险警告: 低风险并不是零风险, 无风险. 本文中的做法可能造成光盘以及光盘驱动器 (刻录机) 的损坏 !**

**免责声明: 本文并不保证内容的正确, 有效, 安全. 如果模仿文中的做法, 后果自负 !!**


## 目录

+ 1 实验方案设计

+ 2 实验过程

  - 2.1 刻录数据
  - 2.2 验证刻录的光盘
  - 2.3 泡水
  - 2.4 捞出光盘擦干水
  - 2.5 读取光盘

+ 3 结果及局限性分析

  - 3.1 光盘数量较少, 实验精度较低
  - 3.2 仅适用于 DVD+R 刻录光盘
  - 3.3 仅适用于常温清水
  - 3.4 仅适用于短期浸泡
  - 3.5 不知道泡水对光盘的长期影响

+ 4 总结与展望


## 1 实验方案设计

实验材料清单:

| 序号 | 名称 | 数量 | 备注 |
| :--: | :--- | ---: | :--- |
| 1 | DVD+R 空白 (普通) 刻录光盘 | 4 | 容量 4.7GB (单层), 品牌为 清华紫光 UNIS |
| 2 | DVD 光驱 | 1 | 品牌为 先锋 (2013 年生产) |
| 3 | PC (台式机) | 1 | 用于操作光盘刻录及读取 |
| 4 | 记号笔 | 1 | 用于在光盘印刷面写字 |
| 5 | 光盘袋 | 3 | 用于装光盘 |
| 6 | 塑料盆 | 1 | 用于装清水 |
| 7 | 卫生纸 | (少许) | 用于泡水后, 吸干光盘表面的水 |
| 8 | 清水 | (少量) | 普通自来水, 用于泡光盘 |

一共 4 张 DVD+R 空白光盘, 分成 2 组:

+ 对照组 (2 张): 普通存放.

+ 实验组 (2 张): 进行泡水测试.

4 张光盘全部刻录相同的数据, 然后实验组泡水一段时间.
然后把光盘捞出, 擦干表面水分.
等待 24 小时之后 (充分干燥), 使用光驱读取光盘.

----

泡水除了可能损坏光盘本身, 还有可能损坏读取泡过水的光盘的光驱.
蓝光刻录机还是有点小贵的 (请看窝的网名),
所以使用 DVD 光盘和 DVD 光驱进行测试.
目前二手的 DVD 刻录机, 淘宝大约 20 元就能买到, DVD 光盘也只要几元,
比较便宜.

**千年光盘** (M-Disc) 已经有了 "千层面实验" (光盘和面条一起蒸熟),
所以这里使用的是 **普通光盘** (不是 **档案级光盘**, 也不是千年光盘),
也就是基本上最便宜的那一种.
考虑到普通光盘可能比较脆弱, 这里没有使用水煮, 而是使用常温清水浸泡.

这里使用的 DVD+R 光盘是多年前买的, 具体什么时间买的, 已经忘记了.
大约是 6 年前, 或者更早, 总之是已经吃灰多年的空白刻录光盘了.

刻录光盘从结构上来说, 只是一张塑料片, 里面封装了一层化学染料.
理论上来说, 应该是不怕水的.
下面就来实际验证一下.


## 2 实验过程

环境参数:

| 序号 | 名称 | 数值 | 备注 |
| :--: | :--- | ---: | :--- |
| 1 | 室内温度 | 30 °C |  |
| 2 | 相对湿度 | 70% |  |
| 3 | 大气压强 | 99 kPa |  |

注: 这里没有对环境条件的精确测量或控制设备, 所以此处的数据仅供参考,
实际波动较大.

### 2.1 刻录数据

使用的软件版本如下 (操作系统 ArchLinux):

```sh
> uname -a
Linux a2 6.9.9-zen1-1-zen #1 ZEN SMP PREEMPT_DYNAMIC Fri, 12 Jul 2024 00:06:19 +0000 x86_64 GNU/Linux
> cdrskin --version
cdrskin 1.5.6 : limited cdrecord compatibility wrapper for libburn
Cdrecord 2.01a27 Emulation. Copyright (C) 2006-2023, see libburnia-project.org
System adapter    :  internal GNU/Linux SG_IO adapter sg-linux
libburn interface :  1.5.6
libburn in use    :  1.5.6
cdrskin version   :  1.5.6
Version timestamp :  2023.06.07.143001
Build timestamp   :  -none-given-
```

为了尽量接近实际使用情况, 此处刻录的数据是 ArchLinux 安装光盘镜像.
如果系统崩溃, 可以从安装光盘启动, 进行一些修复操作.

下载地址: <https://archlinux.org/download/>

```sh
> cdrskin dev=/dev/sr1 -v -minfo
cdrskin 1.5.6 : limited cdrecord compatibility wrapper for libburn
cdrskin: verbosity level : 1
cdrskin: NOTE : greying out all drives besides given dev='/dev/sr1'
cdrskin: scanning for devices ...
cdrskin: ... scanning for devices done
cdrskin: pseudo-atip on drive 0
cdrskin: status 1 burn_disc_blank "The drive holds a blank disc"
scsidev: '/dev/sr1'
Device type    : Removable CD-ROM
Vendor_info    : 'PIONEER'
Identifikation : 'BD-RW BDR-207D'
Revision       : '1.21'
Drive id       : 'LGDL050745WL'
Driver flags   : BURNFREE
Supported modes: TAO SAO
cdrskin: burn_drive_get_write_speed = 22160  (16.0x)
Current: DVD+R
Profile: 0x0043 (BD-RE)
Profile: 0x0042 (BD-R random recording)
Profile: 0x0041 (BD-R sequential recording)
Profile: 0x0040 (BD-ROM)
Profile: 0x002B (DVD+R/DL)
Profile: 0x001A (DVD+RW)
Profile: 0x001B (DVD+R) (current)
Profile: 0x0016 (DVD-R/DL layer jump recording)
Profile: 0x0015 (DVD-R/DL sequential recording)
Profile: 0x0013 (DVD-RW restricted overwrite)
Profile: 0x0014 (DVD-RW sequential recording)
Profile: 0x0011 (DVD-R sequential recording)
Profile: 0x0002 (Removable disk)
Profile: 0x0010 (DVD-ROM)
Profile: 0x000A (CD-RW)
Profile: 0x0009 (CD-R)
Profile: 0x0008 (CD-ROM)
book type:     DVD+R (emulated booktype)
Product Id:    AML/003/48
Producer:      UML
Manufacturer:    'AML'
Media type:      '003'

Mounted media class:      DVD
Mounted media type:       DVD+R
Disk Is not erasable
disk status:              empty
session status:           empty
first track:              1
number of sessions:       1
first track in last sess: 1
last track in last sess:  1
Disk Is not unrestricted
Disk type: DVD, HD-DVD or BD

Track  Sess Type   Start Addr End Addr   Size
==============================================
    1     1 Blank  0          2295103    2295104   

Next writable address:              0         
Remaining writable size:            2295104   
```

空白 DVD+R 光盘看起来是这样的. 然后进行刻录:

```sh
> cdrskin dev=/dev/sr1 -v archlinux-2024.07.01-x86_64.iso 
cdrskin 1.5.6 : limited cdrecord compatibility wrapper for libburn
cdrskin: verbosity level : 1
cdrskin: NOTE : greying out all drives besides given dev='/dev/sr1'
cdrskin: scanning for devices ...
cdrskin: ... scanning for devices done
cdrskin: beginning to burn disc
cdrskin: status 1 burn_disc_blank "The drive holds a blank disc"
Current: DVD+R
Track 01: data  1119 MB        
Total size:     1119 MB (127:21.25) = 572944 sectors
Lout start:     1119 MB (127:23/25) = 573094 sectors
Starting to write CD/DVD at speed MAX in real SAO mode for single session.
Last chance to quit, starting real write in   0 seconds. Operation starts.
Waiting for reader process to fill input buffer ... input buffer ready.
Starting new track at sector: 0
Track 01: 1119 of 1119 MB written (fifo 100%) [buf  85%]   9.1x.              
Fixating...

cdrskin: working post-track (burning since 159 seconds)        
Track 01: Total bytes read/written: 1173389312/1173389312 (572944 sectors).
Writing  time:  159.613s
Cdrskin: fifo had 572944 puts and 572944 gets.
Cdrskin: fifo was 0 times empty and 25021 times full, min fill was 99%.
Min drive buffer fill was 82%
cdrskin: burning done
```

刻录之后的光盘看起来是这样的:

```sh
> cdrskin dev=/dev/sr0 -v -minfo
cdrskin 1.5.6 : limited cdrecord compatibility wrapper for libburn
cdrskin: verbosity level : 1
cdrskin: NOTE : greying out all drives besides given dev='/dev/sr0'
cdrskin: scanning for devices ...
cdrskin: ... scanning for devices done
cdrskin: pseudo-atip on drive 0
cdrskin: status 4 burn_disc_full "There is a disc with data on it in the drive"
scsidev: '/dev/sr0'
Device type    : Removable CD-ROM
Vendor_info    : 'PIONEER'
Identifikation : 'DVD-RW DVR-221L'
Revision       : '1.00'
Drive id       : 'MDQC181365CN        '
Driver flags   : BURNFREE
Supported modes: TAO SAO
cdrskin: burn_drive_get_write_speed = 27700  (20.0x)
Current: DVD+R
Profile: 0x0015 (DVD-R/DL sequential recording)
Profile: 0x0016 (DVD-R/DL layer jump recording)
Profile: 0x002B (DVD+R/DL)
Profile: 0x001B (DVD+R) (current)
Profile: 0x001A (DVD+RW)
Profile: 0x0014 (DVD-RW sequential recording)
Profile: 0x0013 (DVD-RW restricted overwrite)
Profile: 0x0012 (DVD-RAM)
Profile: 0x0011 (DVD-R sequential recording)
Profile: 0x0010 (DVD-ROM)
Profile: 0x000A (CD-RW)
Profile: 0x0009 (CD-R)
Profile: 0x0008 (CD-ROM)
Profile: 0x0002 (Removable disk)
book type:     DVD+R (emulated booktype)
Product Id:    AML/003/48
Producer:      UML
Manufacturer:    'AML'
Media type:      '003'

Mounted media class:      DVD
Mounted media type:       DVD+R
Disk Is not erasable
disk status:              complete
session status:           complete
first track:              1
number of sessions:       1
first track in last sess: 1
last track in last sess:  1
Disk Is unrestricted
Disk type: DVD, HD-DVD or BD

Track  Sess Type   Start Addr End Addr   Size
==============================================
    1     1 Data   0          572943     572944    

Last session start address:         0         
Last session leadout start address: 572944    
```

重复上述操作, 刻录全部 4 张光盘.

然后用记号笔在光盘的印刷面做好标记, 装入光盘袋:

![刻录后的光盘](./图/21-d-1.png)

### 2.2 验证刻录的光盘

计算光盘数据的 `sha256`:

```sh
> sha256sum /dev/sr0
398dceea2d04767fbb8b61a9e824f2c8f5eacf62b2cb5006fd63321d978d48bc  /dev/sr0
```

对 4 张光盘全部进行检查, 确认其中的数据完全一样.

然后使用塑料袋密封保存对照组光盘:

![塑料袋存放](./图/22-d-1.png)

### 2.3 泡水

使用塑料盆装一些自来水:

![塑料盆中的水](./图/23-w-1.png)

刚刚刻录后的光盘比较热, 刚接的自来水比较凉.
为了避免温差的可能影响, 静置 1 小时, 让光盘和水都达到室温.

![泡水的光盘](./图/23-w-2.png)

然后用力把光盘按入水中, 确保光盘和水充分接触.

这里有一个有趣的小发现: **光盘会漂在水面上 !**
这是因为塑料的密度低于水.

此时, 光盘又要振臂高呼: 还有谁 ?!
除了光盘, 还有什么存储器落水后可以漂在水面上 ?

### 2.4 捞出光盘擦干水

浸泡 36 分钟, 然后从水中捞出光盘.

将光盘从光盘袋中取出, 甩干大部分水分,
然后用卫生纸小心吸干剩余的少量小水滴.
注意尽量不要擦伤/污染光盘的读取面, 也不要残留纸张纤维在光盘上.

把泡水的光盘袋扔掉, 换一个新的干燥的光盘袋, 装入泡水后的光盘.

静置 24 小时, 让光盘充分干燥.

### 2.5 读取光盘

第二天, 使用 DVD 光驱尝试读取实验组的 2 张光盘:

```sh
> dd if=/dev/sr0 of=/dev/null status=progress
1163575808 字节 (1.2 GB, 1.1 GiB) 已复制，102 s，11.4 MB/s
输入了 2291776+0 块记录
输出了 2291776+0 块记录
1173389312 字节 (1.2 GB, 1.1 GiB) 已复制，102.758 s，11.4 MB/s
> sha256sum /dev/sr0
398dceea2d04767fbb8b61a9e824f2c8f5eacf62b2cb5006fd63321d978d48bc  /dev/sr0
```

这是 1 号泡水光盘, 读取速度正常, 数据完好.

```sh
> dd if=/dev/sr0 of=/dev/null status=progress
1159713280 字节 (1.2 GB, 1.1 GiB) 已复制，99 s，11.7 MB/s 
输入了 2291776+0 块记录
输出了 2291776+0 块记录
1173389312 字节 (1.2 GB, 1.1 GiB) 已复制，99.9448 s，11.7 MB/s
> sha256sum /dev/sr0
398dceea2d04767fbb8b61a9e824f2c8f5eacf62b2cb5006fd63321d978d48bc  /dev/sr0
```

这是 2 号泡水光盘, 读取速度正常, 数据完好.

----

因为实验组的泡水光盘, 看起来完好无损, 所以就没必要读取对照组的光盘了.

观察泡水光盘表面 (读取面), 有少量划痕, 有少量小水滴干了之后留下的痕迹.
但是仍然不影响正常读取.


## 3 结果及局限性分析

实验结果: 普通 DVD+R 刻录光盘, 在常温的清水中浸泡 36 分钟之后,
没有损坏, 其中的数据可以正常读取.

本实验的局限性如下:

### 3.1 光盘数量较少, 实验精度较低

如果按照更好的实验设计, 应该使用较多数量的光盘 (比如每组 20 张),
从而能够统计计算损坏的比例, 获得比如 "95% 完好" 之类的结果.

然而为了低成本 (请看窝的网名), 本次实验组光盘只有 2 张.
这可能会因为偶然性因素, 导致结果不正确.
所以本实验结果的精度较低, 仅供参考.

### 3.2 仅适用于 DVD+R 刻录光盘

CD, DVD, BD (蓝光) 光盘的结构不同. 虽然直径都是 12cm, 厚度都是 1.2mm,
但是 DVD 光盘的数据记录层夹在中间, 也就是距离读取面约 0.6mm 的深度.
而蓝光光盘的数据记录层在读取面很浅的位置 (约 0.1mm),
因为蓝光光驱的物镜的数值孔径 (NA) 较大, 工作距离很短.

由于 DVD 光盘容量太小, 数据备份一般使用 BD-R 光盘.
然而由于光盘结构不同, 本实验的结果并不能直接用于蓝光光盘.

### 3.3 仅适用于常温清水

本实验使用室温的普通自来水浸泡光盘.
所以本实验的结果并不适用于热水, 冰水等温度.

也不适用于脏水 (比如洪水), 酒精等别的液体.
除了清水之外的液体, 仍然可能损坏光盘.

### 3.4 仅适用于短期浸泡

本实验中, 光盘只浸泡了 36 分钟, 时间比较短.
如果光盘长期浸泡在水中, 仍然有可能损坏.

### 3.5 不知道泡水对光盘的长期影响

本实验中, 光盘在泡水 24 小时 (1 天) 后进行读取.
这只能说明, 光盘泡水之后, 在短期内不会损坏.

然而泡水还可能对光盘有长期影响.
比如, 正常情况下光盘的存储寿命可能为 3 年, 但是泡水后寿命缩短为半年.
本实验并没有测量这方面的情况.


## 4 总结与展望

本实验通过把刻录后的 DVD+R 光盘浸入常温清水, 捞出擦干后读取光盘数据,
初步验证了 **普通光盘** (非档案级) 具有一定的防水能力,
在泡水之后不易损坏.
需要注意本实验的各种局限性: 实验组光盘数量少, 结果精度低.
仅适用于 DVD+R 光盘, 常温清水, 短期浸泡.
并且不知道泡水对光盘的长期影响.

本实验的成本较低, 总成本约 30 元 (不含 PC).

关于泡水对光盘寿命的长期影响, 需要在以后定期检查实验组的光盘,
比如每个月 (或者半年) 读取一次光盘中的数据, 看看是否损坏.
所以实验组和对照组的光盘仍然需要好好保存, 这个实验还在继续,
在几个月或者几年之后, 还能得出新的结论.

----

本文使用 CC-BY-SA 4.0 许可发布.
