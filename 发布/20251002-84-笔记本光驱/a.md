# 笔记本 光驱 的内部结构及用法: 应急系统启动 (恢复) 光盘 (DVD+R/RW)

光盘 (CD/DVD/BD) 基本上是一种被淘汰的古老存储技术了,
然而在特定领域, 光盘仍然具有明显的使用价值, 宝刀未老.

低成本 (特别是单张光盘很便宜), **防水防磁耐摔**, **只读** (不可修改,
比如 DVD+R, BD-R), **读写设备与存储分离**, 这些优点至今难以超越.
笔记本光驱 (轻薄小, 9 ~ 13mm 厚) (二手) 淘宝价约 30 元/个,
5.25 英寸 SATA 大光驱 (台式) (二手) 淘宝价约 20 元/个,
单张光盘 (全新) 只需 2 元.

本文介绍目前还能用的上的一种光盘的典型用途: 应急系统启动 (恢复) 光盘.

光盘, 并不是技术本身很差, 而是被故意 "战略性" 放弃了.
打败光盘的, 不是新的存储技术, 而是互联网.
这很像 "手机不能解 BL" 以及 "DDR4 内存停产导致反而比 DDR5 更贵" 一样.

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 84 号作品. )

----

相关文章:

+ 《光驱的内部结构及日常使用》

  TODO

+ 《光盘防水嘛 ? DVD+R 刻录光盘泡水实验》

  TODO

+ 《小水滴系列文章目录 (整理)》

  TODO

+ 《光盘文件系统 (iso9660) 格式解析》

  TODO

+ 《光盘 RAID: 允许丢失损坏的备份数据》

  TODO

+ 《在 VirtualBox 虚拟机中安装 Fedora CoreOS 操作系统》

  TODO

+ 《防误删 (实时) 文件备份系统 (btrfs 快照 + rsync)》

  TODO

参考资料:

+ <https://archlinux.org/download/>
+ <https://fedoraproject.org/coreos/download?stream=stable>
+ <https://docs.fedoraproject.org/en-US/fedora-coreos/live-booting/>


## 目录

+ 1 笔记本光驱的硬件结构 (拆解)

+ 2 制作系统安装 (启动) 光盘 (Fedora CoreOS)

+ 3 DVD+RW 光盘的只读用法 (DVD-ROM 光驱)

+ 4 总结与展望


## 1 笔记本光驱的硬件结构 (拆解)

![淘宝截图](./图/1-t-1.jpg)

图片来源: 淘宝 app 截图

关于 5.25 英寸大光驱 (台式) 的拆解, 详见文章 《光驱的内部结构及日常使用》.

----

![光驱 (1)](./图/1-d-1.png)

首先是光驱的接口部分.
虽然笔记本光驱也是 SATA 接口, 接口的形状却和 2.5 英寸驱动器的 SATA 接口不同.
这点需要注意, 可能需要额外的接口转接器.

![光驱 (2)](./图/1-d-2.png)

笔记本光驱 (小) 和 5.25 英寸 (台式) 大光驱的对比.

![光驱 (3)](./图/1-d-3.png)

笔记本光驱 (长宽) 约 13x13cm, 厚 9.5/12.7mm.
台式光驱 (长宽高) 约 17x15x4cm.

![光驱 (4)](./图/1-d-4.png)

笔记本光驱和台式光驱的厚度对比.
可以看到, 光驱也可以做成轻薄小的外观.

![光驱 (5)](./图/1-d-5.png)

接下来准备拆开, 拧掉顶盖的 4 颗螺丝:

![光驱 (6)](./图/1-d-6.png)

轻松取掉顶盖, 即可看到内部结构.

![光驱 (7)](./图/1-d-7.png)

这是放入光盘的样子.
可以看到, 由于光盘本身直径 12cm, 光驱已经无法继续缩小了.

![光驱 (8)](./图/1-d-8.png)

笔记本光驱也有强制开仓孔, 用细针状物捅一下, 即可开仓.

笔记本光驱的结构非常简单:
激光头 (含物镜), 主轴电机 (及光盘夹) 都做在光盘托盘上,
托盘通过弹簧实现手动开仓 (关仓).
然后就只有很小的一块电路板, 使用软排线连接光头等组件.

![光驱 (9)](./图/1-d-9.png)

这是反面, 没啥好看的.
可以看到, 已经没有进一步拆解的必要了.

![光驱 (10)](./图/1-d-10.png)

把上盖和螺丝装回去.


## 2 制作系统安装 (启动) 光盘 (Fedora CoreOS)

此处以 2 种系统安装光盘 (镜像) 举栗:

+ ArchLinux: <https://archlinux.org/download/>
+ Fedora CoreOS: <https://fedoraproject.org/coreos/download?stream=stable>

安装刻录软件 (ArchLinux):

```sh
sudo pacman -S libburn
```

使用 USB 转 SATA 线连接笔记本光驱, 装入 DVD 光盘, 然后:

```sh
> cdrskin dev=/dev/sr0 -v -minfo
cdrskin 1.5.6 : limited cdrecord compatibility wrapper for libburn
cdrskin: verbosity level : 1
cdrskin: NOTE : greying out all drives besides given dev='/dev/sr0'
cdrskin: scanning for devices ...
cdrskin: ... scanning for devices done
cdrskin: pseudo-atip on drive 0
cdrskin: status 1 burn_disc_blank "The drive holds a blank disc"
scsidev: '0,0,0'
Device type    : Removable CD-ROM
Vendor_info    : 'HL-DT-ST'
Identifikation : 'DVDRAM GT50N'
Revision       : 'LC02'
Drive id       : 'M11D3541049 '
Driver flags   : BURNFREE
Supported modes: TAO SAO
cdrskin: burn_drive_get_write_speed = 5540  (4.0x)
Current: DVD+RW
Profile: 0x0012 (DVD-RAM)
Profile: 0x002B (DVD+R/DL)
Profile: 0x001B (DVD+R)
Profile: 0x001A (DVD+RW) (current)
Profile: 0x0016 (DVD-R/DL layer jump recording)
Profile: 0x0015 (DVD-R/DL sequential recording)
Profile: 0x0014 (DVD-RW sequential recording)
Profile: 0x0013 (DVD-RW restricted overwrite)
Profile: 0x0011 (DVD-R sequential recording)
Profile: 0x0010 (DVD-ROM) (current)
Profile: 0x000A (CD-RW)
Profile: 0x0009 (CD-R)
Profile: 0x0008 (CD-ROM)
Profile: 0x0002 (Removable disk)
book type:     DVD+RW (emulated booktype)
Product Id:    RITEK/004/48
Producer:      Ritek Corp
Manufacturer:    'RITEK'
Media type:      '004'

Mounted media class:      DVD
Mounted media type:       DVD+RW
Disk Is erasable
disk status:              complete
session status:           complete
first track:              1
number of sessions:       1
first track in last sess: 1
last track in last sess:  1
Disk Is not unrestricted
Disk type: DVD, HD-DVD or BD

Track  Sess Type   Start Addr End Addr   Size
==============================================
    1     1 Data   0          2295103    2295104   

Last session start address:         0         
Last session leadout start address: 2295104   

cdrskin: Media is overwriteable. No blanking needed. No reliable track size.
cdrskin: Above contrary statements follow cdrecord traditions.
```

刻录 iso 镜像, 比如:

```sh
> cdrskin dev=/dev/sr0 -v archlinux-2025.10.01-x86_64.iso
cdrskin 1.5.6 : limited cdrecord compatibility wrapper for libburn
cdrskin: verbosity level : 1
cdrskin: NOTE : greying out all drives besides given dev='/dev/sr0'
cdrskin: scanning for devices ...
cdrskin: ... scanning for devices done
cdrskin: beginning to burn disc
cdrskin: status 1 burn_disc_blank "The drive holds a blank disc"
Current: DVD+RW
Track 01: data  1449 MB        
Total size:     1449 MB (164:54.05) = 741904 sectors
Lout start:     1449 MB (164:56/05) = 742054 sectors
Starting to write CD/DVD at speed MAX in real TAO mode for single session.
Last chance to quit, starting real write in   0 seconds. Operation starts.
Waiting for reader process to fill input buffer ... input buffer ready.
Starting new track at sector: 0
Track 01: 1449 of 1449 MB written (fifo 100%) [buf  67%]   3.7x.        
Fixating...

cdrskin: working post-track (burning since 387 seconds)        
Track 01: Total bytes read/written: 1519419392/1519419392 (741904 sectors).
Writing  time:  387.038s
Cdrskin: fifo had 741904 puts and 741904 gets.
Cdrskin: fifo was 0 times empty and 60635 times full, min fill was 99%.
Min drive buffer fill was 0%
cdrskin: burning done
```

然后这张光盘就能用于 ArchLinux 的安装或者应急系统恢复了.

----

对于 Fedora CoreOS, 如果直接刻录下载的 iso 镜像, 使用光盘启动时,
会有大量的随机读写, 速度很慢, 因此需要先进行简单的处理:

```sh
podman run --rm -v .:/data -w /data quay.io/coreos/coreos-installer:release iso customize --live-karg-append=coreos.liveiso.fromram -o fedora-coreos-42.20250914.3.0-live-fromram-iso.x86_64.iso fedora-coreos-42.20250914.3.0-live-iso.x86_64.iso
```

然后刻录 `fedora-coreos-42.20250914.3.0-live-fromram-iso.x86_64.iso` 到光盘.
系统启动时, 会把全部光盘的内容读入内存, 然后就不需要光盘了, 系统运行速度快.

![启动测试](./图/2-b-1.png)

如图, 使用 USB 转 SATA 笔记本光驱启动 Fedora CoreOS.
启动后就进入 (root) 命令行了, 有很多工具可以使用 (比如 rsync, podman, fdisk).
就可以用于应急恢复系统, 或者重新安装系统了.


## 3 DVD+RW 光盘的只读用法 (DVD-ROM 光驱)

与目前主流的存储设备 (SSD, 机械硬盘, 存储卡 (SD 卡), U 盘, 等) 相比,
光盘最大的优点是 **只读**, 也就是刻录之后数据无法修改 (比如 DVD+R, BD-R 光盘).
这一点可以用于 **重要数据的备份和存储**.

那么, **可擦写** 光盘 (比如 DVD+RW, BD-RE), 也就是可以反复刻录的光盘, 看起来用处就不大了.
可擦写光盘速度慢, 并且缺乏最重要的优点 "只读".

但是, 光驱也分 2 种: **只读光驱** (比如 DVD-ROM) 和 **刻录机** (比如 DVD-RW).
如果 `DVD+RW` (可擦写) 光盘放入 `DVD-ROM` (只读) 光驱使用, 同样可以达到只读的效果 !

比如一个只读光驱:

```sh
> cdrskin dev=/dev/sr0 -v -minfo
cdrskin 1.5.6 : limited cdrecord compatibility wrapper for libburn
cdrskin: verbosity level : 1
cdrskin: NOTE : greying out all drives besides given dev='/dev/sr0'
cdrskin: scanning for devices ...
cdrskin: ... scanning for devices done
cdrskin: pseudo-atip on drive 0
cdrskin: status 4 burn_disc_full "There is a disc with data on it in the drive"
scsidev: '0,0,0'
Device type    : Removable CD-ROM
Vendor_info    : 'hp'
Identifikation : 'DVD-ROM SU-108GB'
Revision       : 'JN00'
Drive id       : 'S18H6YGH3005VR  '
Driver flags   : BURNFREE
Supported modes:
cdrskin: burn_drive_get_write_speed = 0  (0.0x)
Current: DVD-ROM
Profile: 0x0010 (DVD-ROM) (current)
Profile: 0x0008 (CD-ROM)
book type:     DVD-ROM (emulated booktype)

Mounted media class:      DVD
Mounted media type:       DVD-ROM
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
    1     1 Data   0          2295103    2295104   

Last session start address:         0         
Last session leadout start address: 2295104   
Read capacity:                      494080    
```

可以看到, 这个光驱只有读取能力 (ROM), 没有写入能力 (RW).

尝试刻录光盘:

```sh
> cdrskin dev=/dev/sr0 -v archlinux-2025.10.01-x86_64.iso
cdrskin 1.5.6 : limited cdrecord compatibility wrapper for libburn
cdrskin: verbosity level : 1
cdrskin: NOTE : greying out all drives besides given dev='/dev/sr0'
cdrskin: scanning for devices ...
cdrskin: ... scanning for devices done
cdrskin: beginning to burn disc
cdrskin: status 4 burn_disc_full "There is a disc with data on it in the drive"
Current: DVD-ROM
cdrskin: FATAL : No suitable media detected
cdrskin: Media : ** closed ** DVD-ROM
cdrskin: burning failed
cdrskin: FATAL : burning failed.
```

刻录失败.

----

这样, 使用 `DVD+RW` 光盘时, 如果想要刻录, 就放入刻录机, 如果只读, 就放入 `ROM` 光驱.
也能利用光盘 "只读" 的优点.

据说 DVD+RW 光盘可以反复刻录 1000 次 (只是听说, 没有实际测试过).
某些情况下, 也具有一定的使用价值.


## 4 总结与展望

如果系统 (软件) 突然崩溃, 就需要从恢复 (盘) 启动.
U 盘可以实现这个功能, 但是, U 盘容易丢 (至少对窝来说, 每次都找不到 U 盘在哪里).

光盘因为比较大, 相对不容易丢 (狗头).
应急系统恢复 (安装) 光盘, 以及重要数据备份 (存储),
可能是目前光盘仅剩的为数不多的使用场景之一了.

除了 5.25 英寸的台式大光驱, 还有小巧轻薄的笔记本光驱可以使用.
存储数据的光盘与读写数据的光驱互相分离, 如果光驱坏了, 换一个即可, 数据不受影响.
这种结构更适合以低成本实现更可靠的数据存储.

DVD 光驱 (刻录机) 目前 (二手) 已经很便宜了, 虽然用处不大, 买个玩玩也是可以的.

----

彩蛋:

MOGA 计划: Make Optical disk Great Again !

----

本文使用 CC-BY-SA 4.0 许可发布.
