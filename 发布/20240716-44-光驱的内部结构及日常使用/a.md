# 光驱的内部结构及日常使用

都 2024 年了, 光盘基本上算是一种已经淘汰的古老 (40 年前 ~ 20 年前)
落后技术了, 还写光盘的文章, 是不是傻 ??
额 .. . 可能有点吧.
但是目前光盘并没有完全消失, 所以窝觉得, 写光盘还是有点剩余价值哒 ~

----

相关文章:

+ 《穷人如何备份数据 ? 常见存储设备简单总结》

  TODO


## 目录

+ 1 光驱 (DVD 刻录机) 拆解

+ 2 光盘的日常使用

  - 2.1 安装相关软件
  - 2.2 查看光驱及光盘信息
  - 2.3 刻录 iso 镜像文件
  - 2.4 验证刻录的光盘

+ 3 总结与展望


## 1 光驱 (DVD 刻录机) 拆解

![光驱 (1)](./图/1-d-1.png)

如图 (顶部), 这是一个 11 年前 (2013 年) 生产的 DVD 刻录机,
早已过保 (光驱的保修期通常只有一年).
当年买的全新的, 然后基本没怎么使用, 吃灰了这么多年.

![光驱 (2)](./图/1-d-2.png)

这个是前面板, 主要有: 光盘仓盖, 按钮 (按一下打开光盘仓),
工作指示灯 (平时不亮, 读写时闪烁), 强制开仓小孔 (用比牙签还细的小棍,
用力捅, 就能强行打开光盘仓, 在光驱损坏时使用, 可以取出光盘).

二手 DVD 刻录机, 功能完好的, 在淘宝也就 20 元左右.
图中这个坏了一半, 也就更不值钱了.
所以, 开拆:

![光驱 (3)](./图/1-d-3.png)

这个是底部, 用螺丝刀拧下四角的 4 颗螺丝, 就能拆掉下盖了:

![光驱 (4)](./图/1-d-4.png)

去掉下盖之后是这个样子的.

![光驱 (5)](./图/1-d-5.png)

这个是拆掉的下盖 (内部).

接下来拆上盖, 稍微麻烦一些:
(1) 找个东西捅前面板的小孔, 把光盘仓打开.
(2) 按住前面板 (塑料材质) 周围的倒钩, 拆掉前面板.
(3) 然后才能把上盖拿下来.

![光驱 (6)](./图/1-d-6.png)

这个是拆掉的上盖.
中间这个黑色圆形物体是用来夹住光盘的 (磁吸).

![光驱 (7)](./图/1-d-7.png)

这个是拆掉上盖之后, 光驱内部的样子.
这里就能看到光驱的主要结构了:

最上面黑色的是光盘托架.
中间黑色圆形的是光盘的主轴电机 (无刷直流电机, BLDC), 用来驱动光盘旋转.

下方圆圆的反光物体, 就是光驱的物镜了, 数值孔径 (NA) 约 0.6.
此处就是光驱的核心结构: 光头.
光头装在两根滑轨上, 由步进电机驱动, 可以沿光盘半径方向移动.

比较有意思的是, 物镜由周围的音圈电机驱动, 可以 3 自由度活动 (上下, 左右, 前后).

![光驱 (8)](./图/1-d-8.png)

这个是从下方看.
上面的一小块电路板, 主要有一个有刷直流电机 (用来驱动光盘托架,
开关光盘仓), 工作指示灯, 按钮 (就是前面板的按钮).

下面的一小块电路板, 就是控制电路, SATA 接口也在这里.

![光驱 (9)](./图/1-d-9.png)

这个是光盘托架和前面板, 都是黑色塑料材质.

从 CD, DVD, 再到蓝光光盘 (BD), 光驱的结构基本都是这个样子的.
可以看到, 光驱的结构并不复杂.


## 2 光盘的日常使用

此处使用的操作系统是 ArchLinux: <https://archlinux.org/>

```sh
> uname -a
Linux S2L 6.9.9-zen1-1-zen #1 ZEN SMP PREEMPT_DYNAMIC Fri, 12 Jul 2024 00:06:19 +0000 x86_64 GNU/Linux
```

窝觉得, 讲在 GNU/Linux 之中使用光盘的文章, 比较少.

### 2.1 安装相关软件

+ (1) 安装 `libburn`: <https://dev.lovelyhq.com/libburnia/web/wiki>

  ```sh
  sudo pacman -S libburn
  ```

  安装之后:

  ```sh
  > type cdrskin
  cdrskin is /usr/bin/cdrskin
  > pacman -Qo cdrskin
  /usr/bin/cdrskin 由 libburn 1.5.6-1 所拥有
  > cdrskin --version
  cdrskin 1.5.6 : limited cdrecord compatibility wrapper for libburn
  Cdrecord 2.01a27 Emulation. Copyright (C) 2006-2023, see libburnia-project.org
  System adapter    :  internal GNU/Linux SG_IO adapter sg-linux
  libburn interface :  1.5.6
  libburn in use    :  1.5.6
  cdrskin version   :  1.5.6
  Version timestamp :  2023.06.07.143001
  Build timestamp   :  -none-given-
  > 
  ```

+ (2) 使用 SATA 数据线连接光驱和主板 (以及 SATA 电源线) 后,
  查看系统是否识别了光驱:

  ```sh
  > ls -l /dev/sr*
  brw-rw----+ 1 root optical 11, 0  7月16日 06:35 /dev/sr0
  brw-rw----+ 1 root optical 11, 1  7月16日 07:02 /dev/sr1
  ```

  光驱的设备文件名称以 `sr` 开头.
  比如此处 `/dev/sr0` 是蓝光刻录机, `/dev/sr1` 是 DVD 刻录机.

  ----

  插播冷知识:
  SATA 具有 **即插即用** (热插拔) 能力, 开机状态下,
  接入 SATA 光驱, 可以正常识别, 无需关机重启.
  (但是对硬盘就不建议这样做了, 容易造成数据丢失, 硬盘损坏. )

  ----

  可以看到, 光驱属于 `optical` 用户组.
  为了方便自己日常使用, 需要把自己 (用户) 加入这个用户组:

  ```sh
  sudo gpasswd -a s2 optical
  ```

  把其中 `s2` 换成自己的用户名.
  **重启**, 然后查看是否生效:

  ```sh
  > id
  uid=1000(s2) gid=1000(s2) 组=1000(s2),108(vboxusers),956(docker),957(adbusers),959(i2c),964(libvirt),990(optical),998(wheel)
  ```

### 2.2 查看光驱及光盘信息

把一张空白 DVD+R 光盘 (注意 DVD-R 和 DVD+R 是两种不同的光盘)
放入光驱, 然后:

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
disk status:              empty
session status:           empty
first track:              1
number of sessions:       1
first track in last sess: 1
last track in last sess:  1
Disk Is unrestricted
Disk type: DVD, HD-DVD or BD

Track  Sess Type   Start Addr End Addr   Size
==============================================
    1     1 Blank  0          2295103    2295104   

Next writable address:              0         
Remaining writable size:            2295104   
```

+ (1) 命令行说明:

  ```sh
  cdrskin dev=/dev/sr1 -v -minfo
  ```

  使用 `cdrskin` 命令, 其中 `dev=` 指定使用哪个光驱,
  `-v` 表示显示详细信息, `-minfo` 表示查看光盘状态.

+ (2) 光驱信息:

  ```sh
  cdrskin: status 1 burn_disc_blank "The drive holds a blank disc"
  ```

  这个表示光驱中有一个空白光盘.

  ```sh
  Vendor_info    : 'PIONEER'
  Identifikation : 'DVD-RW DVR-221L'
  Revision       : '1.00'
  Drive id       : 'MDQC181365CN        '
  ```

  这里有光驱的生产厂家, 型号, 版本号, 序列号等信息.

  ```sh
  cdrskin: burn_drive_get_write_speed = 27700  (20.0x)
  Current: DVD+R
  ```

  最大刻录速度 `20.0x` (实际上比这个慢).
  当前工作模式 `DVD+R`.

  ```sh
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
  ```

  这个表示光驱支持的光盘类型.
  可以看到, 这个光驱支持很多种不同的 CD 和 DVD 光盘.
  有意思的是, 这个光驱居然支持 `DVD-RAM` (哪天闲了可以试试玩)

+ (3) 光盘信息:

  ```sh
  book type:     DVD+R (emulated booktype)
  Product Id:    AML/003/48
  Producer:      UML
  Manufacturer:    'AML'
  Media type:      '003'
  ```

  当前光盘类型是 `DVD+R`, 以及光盘的生产厂家, 型号等信息.

  ```sh
  Mounted media class:      DVD
  Mounted media type:       DVD+R
  Disk Is not erasable
  disk status:              empty
  session status:           empty
  first track:              1
  number of sessions:       1
  first track in last sess: 1
  last track in last sess:  1
  ```

  光盘不可擦除 (只能刻录一次), 是空白光盘.

+ (4) 光盘容量:

  ```sh
  Track  Sess Type   Start Addr End Addr   Size
  ==============================================
      1     1 Blank  0          2295103    2295104   

  Next writable address:              0         
  Remaining writable size:            2295104   
  ```

  此处的 `2295104` 是光盘 **扇区** (sector, 就是最小数据块) 的个数.
  注意光盘每个扇区的容量是 2KB.

  然后就可以计算一下光盘的总的存储容量:

  ```sh
  $ node
  Welcome to Node.js v22.4.1.
  Type ".help" for more information.
  > 2295104 * 2 / 1024 / 1024
  4.3775634765625
  > 
  ```

  嗯, 计算结果是大约 4.37GB.

### 2.3 刻录 iso 镜像文件

准备一个光盘镜像文件, 比如: <https://fedoraproject.org/coreos/download?stream=stable>

```sh
> sha256sum fedora-coreos-40.20240616.3.0-live.x86_64.iso
527f76d12942ad4a305421adbb35247fd93ae3588b5c2bb7f03534e2d603c0a8  fedora-coreos-40.20240616.3.0-live.x86_64.iso
```

然后开始刻录:

```sh
> cdrskin dev=/dev/sr1 -v fedora-coreos-40.20240616.3.0-live.x86_64.iso
cdrskin 1.5.6 : limited cdrecord compatibility wrapper for libburn
cdrskin: verbosity level : 1
cdrskin: NOTE : greying out all drives besides given dev='/dev/sr1'
cdrskin: scanning for devices ...
cdrskin: ... scanning for devices done
cdrskin: beginning to burn disc
cdrskin: status 1 burn_disc_blank "The drive holds a blank disc"
Current: DVD+R
Track 01: data   852 MB        
Total size:      852 MB (96:58.31) = 436224 sectors
Lout start:      852 MB (97:00/31) = 436374 sectors
Starting to write CD/DVD at speed MAX in real SAO mode for single session.
Last chance to quit, starting real write in   0 seconds. Operation starts.
Waiting for reader process to fill input buffer ... input buffer ready.
Starting new track at sector: 0
Track 01:  852 of  852 MB written (fifo 100%) [buf  98%]   7.4x.        
cdrskin: thank you for being patient for 89 seconds                     
Fixating...
cdrskin: working post-track (burning since 106 seconds)        
Track 01: Total bytes read/written: 893386752/893386752 (436224 sectors).
Writing  time:  106.161s
Cdrskin: fifo had 436224 puts and 436224 gets.
Cdrskin: fifo was 0 times empty and 30133 times full, min fill was 99%.
Min drive buffer fill was 98%
cdrskin: burning done
```

耐心等待, 很快就刻录完成了. 平均速度 `7.4x` (不算太慢).
然后用记号笔 (笔尖很软) 在光盘印刷面写上注释, 用光盘袋装好:

![光盘 (1)](./图/2-d-1.png)

![光盘 (2)](./图/2-d-2.png)

刻录后的光盘看起来是这个样子的:

```sh
> cdrskin dev=/dev/sr1 -v -minfo
cdrskin 1.5.6 : limited cdrecord compatibility wrapper for libburn
cdrskin: verbosity level : 1
cdrskin: NOTE : greying out all drives besides given dev='/dev/sr1'
cdrskin: scanning for devices ...
cdrskin: ... scanning for devices done
cdrskin: pseudo-atip on drive 0
cdrskin: status 4 burn_disc_full "There is a disc with data on it in the drive"
scsidev: '/dev/sr1'
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

注意其中:

```sh
disk status:              complete
session status:           complete
```

### 2.4 验证刻录的光盘

在 Linux 之中 **一切都是文件** (everything is file),
所以光驱嘛, 也只是一个设备文件而已, 直接计算其 `sha256` 即可:

```sh
> sha256sum /dev/sr1
527f76d12942ad4a305421adbb35247fd93ae3588b5c2bb7f03534e2d603c0a8  /dev/sr1
```

看, 和前面计算光盘镜像文件是一毛一样哒 !
然后去对比一下 sha256 计算结果, 就知道刻录的数据是否正确了.

----

如果要从一个光盘, 制作镜像文件, 也很简单, 比如:

```sh
> dd if=/dev/sr1 of=/dev/null status=progress
888984064 字节 (889 MB, 848 MiB) 已复制，79 s，11.3 MB/s
输入了 1744896+0 块记录
输出了 1744896+0 块记录
893386752 字节 (893 MB, 852 MiB) 已复制，79.3074 s，11.3 MB/s
```

把其中 `/dev/null` 换成要保存的文件名即可, 比如 `XXX.iso`.


## 3 总结与展望

最近天天下大雨, 门口的公路已经淹了.
这边距离最近的大河只有 4km, 窝觉得还是有那么一丢丢发水的风险的.
所以窝正在紧急把重要数据备份到光盘上.
光盘虽然缺点一大堆, 很难用, 但是在防水能力上,
差不多是各种存储器之中最好的, 所以提前准备一下.

Linux 对光盘的支持确实不好, 根本就没有好用的图形界面软件,
只能使用命令行操作.
相比之下, Windows 对光盘的支持就好很多了.
但是作为穷人, 窝觉得还是要多支持开源软件的, 穷嘛 !

另外 Linux 内核对 UDF 文件系统的支持也不好,
比如蓝光光盘使用的 UDF 2.50 版本, 在 Linux 之下是 **只读** 的.
听说 NetBSD 内核对 UDF 的支持很好, 准备去尝试一下.
另外单个光盘容量较小, 在备份大量数据时, 还有许多困难需要解决.

----

彩蛋:

文中拆解的 DVD 刻录机, 毕竟年纪这么大了, 读盘还可以,
刻盘已经不行了, 刻录一张坏一张.
有意思的是, 它居然可以把 DVD+R 光盘刻录成 DVD+RW 光盘 (误)
如果这是真的话, 岂不是发财了 !

----

本文使用 CC-BY-SA 4.0 许可发布.
