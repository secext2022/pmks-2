# 流浪 ArchLinux 后续: 修复 fstrim USB SSD

SSD (固态硬盘) 作为一种使用 **闪存** (flash) 芯片的存储器,
支持 TRIM 命令来优化内部空间管理, 提高性能, 延长寿命.

操作系统的文件系统 (比如 ext4, btrfs) 管理存储器里面存储的文件,
文件系统知道哪些数据块 (block) 已占用, 哪些块是空闲的.
操作系统可以通过发送 TRIM 命令, 告诉 SSD 哪些块是空闲的,
SSD 的主控就可以在后台回收这些块.

所以, 定期执行 TRIM 是一个好习惯. 然而:

```sh
> sudo fstrim -v /
fstrim: /：不支持丢弃操作
```

?? ?

这什么情况 ? (黑人问号.jpg)

![USB SSD 不支持 TRIM](./图/0-i-1.png)

这是一个 2.5 英寸 SATA SSD, 当使用 SATA 数据线直接连接到主板时, TRIM 功能是正常的.
然而现在使用外置硬盘盒, 通过 USB 连接到主机.

难道, 使用 USB <-> SATA 时, 就不支持 TRIM 了 ? 这么悲吹的嘛 ?
在网上一顿查找资料, 并进行尝试, 最终修复了这个问题, 成功执行了 TRIM.

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 66 号作品. )

----

相关文章:

+ 《流浪 Linux: 外置 USB SSD 安装 ArchLinux》

  TODO

参考资料:

+ <https://www.jeffgeerling.com/blog/2020/enabling-trim-on-external-ssd-on-raspberry-pi>


## 目录

+ 1 修复过程

  - 1.1 安装所需软件包
  - 1.2 尝试修复 TRIM
  - 1.3 配置 udev 规则
  - 1.4 重启测试

+ 2 总结与展望


## 1 修复过程

**警告 (免责声明): 此操作有可能造成存储设备损坏或数据丢失, 请提前备份重要数据 !!**

### 1.1 安装所需软件包

首先安装所需的软件包:

```sh
sudo pacman -S sg3_utils lsscsi usbutils
```

### 1.2 尝试修复 TRIM

+ (1) 查看存储设备的 TRIM 功能:

  ```sh
  > lsblk -D
  NAME        DISC-ALN DISC-GRAN DISC-MAX DISC-ZERO
  sda                0      512B       0B         0
  ├─sda1           0      512B       0B         0
  ├─sda2           0      512B       0B         0
  └─sda3           0      512B       0B         0
  ```

  注意此处 `DISC-MAX 0B` 表示不支持.

+ (2) 获取设备信息:

  ```sh
  > sudo sg_vpd -p bl /dev/sda
  Block limits VPD page (SBC)
    Write same non-zero (WSNZ): 0
    Maximum compare and write length: 0 blocks [command not implemented]
    Optimal transfer length granularity: 0x1
    Maximum transfer length: 0xffff
    Optimal transfer length: 0xffff
    Maximum prefetch length: 0xffff
    Maximum unmap LBA count: 0x3fffc0
    Maximum unmap block descriptor count: 0x1
    Optimal unmap granularity: 0x1
    Unmap granularity alignment valid: false
    Maximum write same length: 0 blocks [not reported]
    Maximum atomic transfer length: 0 blocks [not reported]
    Atomic alignment: 0 blocks [unaligned atomic writes permitted]
    Atomic transfer length granularity: 0 blocks [no granularity requirement]
    Maximum atomic transfer length with atomic boundary: 0 blocks [not reported]
    Maximum atomic boundary size: 0 blocks [can only write atomic 1 block]
  ```

  以及:

  ```sh
  > sudo sg_vpd -p lbpv /dev/sda
  Logical block provisioning VPD page (SBC)
    LBPU=1
    LBPWS=0
    LBPWS10=0
    LBPRZ=0x0
    ANC_SUP=0
    DP=0
    Minimum percentage: 0 [not reported]
    Provisioning type: not known or fully provisioned
    Threshold percentage: 0 [percentages not supported]
  ```

  注意其中 `Maximum unmap LBA count: 0x3fffc0` 和
  `LBPU=1`.

  `Maximum unmap LBA count` 大于 0, 说明看起来是支持 TRIM 的.

+ (3) 设置 `unmap` (provisioning_mode):

  ```sh
  > sudo find /sys -name provisioning_mode -exec grep -H . {} + | sort
  /sys/devices/pci0000:00/0000:00:08.1/0000:05:00.4/usb4/4-2/4-2:1.0/host0/target0:0:0/0:0:0:0/scsi_disk/0:0:0:0/provisioning_mode:full
  ```

  注意此处 `full`, 接下来要把它改成 `unmap`.
  先确认一下设备:

  ```sh
  > sudo lsscsi
  [0:0:0:0]    disk             ASMT   ASM225    0     /dev/sda 
  ```

  然后进行修改:

  ```sh
  > echo unmap | sudo tee /sys/devices/pci0000:00/0000:00:08.1/0000:05:00.4/usb4/4-2/4-2:1.0/host0/target0:0:0/0:0:0:0/scsi_disk/0:0:0:0/provisioning_mode
  unmap
  ```

  确认修改结果:

  ```sh
  > sudo find /sys -name provisioning_mode -exec grep -H . {} + | sort
  /sys/devices/pci0000:00/0000:00:08.1/0000:05:00.4/usb4/4-2/4-2:1.0/host0/target0:0:0/0:0:0:0/scsi_disk/0:0:0:0/provisioning_mode:unmap
  ```

+ (4) 设置 discard_max_bytes:

  ```sh
  > sudo sg_readcap -l /dev/sda
  Read Capacity results:
    Protection: prot_en=0, p_type=0, p_i_exponent=0
    Logical block provisioning: lbpme=0, lbprz=0
    Last LBA=2000409263 (0x773bd2af), Number of logical blocks=2000409264
    Logical block length=512 bytes
    Logical blocks per physical block exponent=0
    Lowest aligned LBA=0
  Hence:
    Device size: 1024209543168 bytes, 976762.3 MiB, 1024.21 GB
  ```

  注意此处 `Logical block length=512 bytes` 以及前面的
  `Maximum unmap LBA count: 0x3fffc0`, 我们来计算一下:

  ```sh
  > node
  Welcome to Node.js v23.8.0.
  Type ".help" for more information.
  > 0x3fffc0 * 512
  2147450880
  > 
  ```

  然后:

  ```sh
  > echo 2147450880 | sudo tee /sys/block/sda/queue/discard_max_bytes
  2147450880
  ```

+ (5) 尝试执行 fstrim:

  ```sh
  > lsblk -D
  NAME        DISC-ALN DISC-GRAN DISC-MAX DISC-ZERO
  sda                0      512B       2G         0
  ├─sda1           0      512B       2G         0
  ├─sda2           0      512B       2G         0
  └─sda3           0      512B       2G         0
  ```

  注意其中 `DISC-MAX 2G` 说明已经开启了 TRIM. 然后:

  ```sh
  > sudo fstrim -v /
  /：874.1 GiB (938609360896 字节) 已修剪
  ```

  大成功 ! fstrim 正常.

### 1.3 配置 udev 规则

上面已经成功使用了 TRIM, 但是, 重启系统之后就会失效.

```sh
> lsusb
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 001 Device 002: ID 0e8d:c616 MediaTek Inc. Wireless_Device
Bus 004 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 004 Device 002: ID 174c:55aa ASMedia Technology Inc. ASM1051E SATA 6Gb/s bridge, ASM1053E SATA 6Gb/s bridge, ASM1153 SATA 3Gb/s bridge, ASM1153E SATA 6Gb/s bridge
```

需要配置 udev (创建配置文件):

```sh
sudo nano /etc/udev/rules.d/10-trim.rules
```

内容如下:

```sh
ACTION=="add|change", ATTRS{idVendor}=="174c", ATTRS{idProduct}=="55aa", SUBSYSTEM=="scsi_disk", ATTR{provisioning_mode}="unmap"
```

注意其中 `idVendor` 和 `idProduct` 的具体值要根据上面 `lsusb` 命令的结果, 对应 SSD 设备.

### 1.4 重启测试

重启.

```sh
> lsblk -D
NAME        DISC-ALN DISC-GRAN DISC-MAX DISC-ZERO
sda                0      512B       4G         0
├─sda1           0      512B       4G         0
├─sda2           0      512B       4G         0
└─sda3           0      512B       4G         0
```

尝试:

```sh
> sudo fstrim -v /
/：874.3 GiB (938724429824 字节) 已修剪
```

成功 !

----

定期自动执行 fstrim:

```sh
sudo systemctl enable fstrim.timer
```

好了, 默认每周执行一次 fstrim.


## 2 总结与展望

SATA SSD 本身支持 TRIM, 如果使用 SATA 数据线直接连接主板就工作正常.
然而使用外置 USB 硬盘盒时, TRIM 就无法使用了.

通过配置 udev 规则, 重新启用 TRIM 功能, 修复了这个问题.

TRIM 可以延长 SSD 的寿命, 是一种很好的技术 !

----

本文使用 CC-BY-SA 4.0 许可发布.
