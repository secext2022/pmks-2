# 小米电视 root 的准备工作

**注意: 这不是 root 电视的完整教程**,
但是包含了进入电视系统底层的各种准备工作.
能够进入电视系统底层之后,
任何有 magisk 使用经验的人都可以轻松实现 root.

测试设备: 小米电视 A43 pro (L43MA-AP) (2023 年上市)

**警告 (免责声明): 操作有风险, 包括但不限于数据丢失, 设备损坏, 失去保修等.
如果您继续阅读本文, 表示您同意:
您将自行承担操作设备所造成的一切后果与责任.**


## 目录

+ 0 来源

+ 1 启用 adb 并安装 apk

+ 2 开机进入 recovery

+ 3 制作 HDMI 转 UART (TTL 5V) 调试线

+ 4 开机进入 uboot

+ 5 进入 recovery 命令行

+ 6 在 uboot 下备份各个系统分区

+ 7 在 recovery 下备份各个系统分区

+ 8 总结与展望


## 0 来源

本文使用的各种方法并非原创, 而是主要来自于以下几篇文章:
(相关链接可能发在评论区)

+ (ZNDS 智能电视网) 教程&攻略 2022新款小米电视（安卓6以上）硬核root教程（需要USB转TTL）

  <https://www.znds.com/tv-1228229-1-1.html>

+ (ZNDS 智能电视网) 教程&攻略 小米电视硬核root教程（需要USB转TTL硬件工具）

  <https://www.znds.com/tv-1203308-1-1.html>

+ (XDA xdaforums) GUIDE MAGISK PIE MSD6683 How to root MSTAR Smart TV

  <https://xdaforums.com/t/guide-magisk-pie-msd6683-how-to-root-mstar-smart-tv.4253243/>


## 1 启用 adb 并安装 apk

本章所需硬件设备:
小米电视, 小米电视的遥控器, PC (台式机或笔记本),
本地局域网络 (有线以太网或无线 WIFI).

+ (1) 正常开机, 先看一下系统信息:

  ![主界面](../图/20231227-3/1-sys-main-ui.jpg)

  进入 `电视设置`.

  ![操作系统版本](../图/20231227-3/1-miui-version.jpg)

  关于: MIUI TV 版本: MiTV OS 2.8.2129 (稳定版)

  ![设备信息](../图/20231227-3/1-device-info.jpg)

  设备信息:
  屏幕参数 3840x2160 43英寸, 存储 内存 2GB 闪存 32GB,
  无线连接 2.4GHz/5GHz 蓝牙, 操作系统 Android.

  ![存储空间](../图/20231227-3/1-sys-storage.jpg)

  存储空间: 共 30536MB, 系统 4446MB.

+ (2) 在设置中的 `关于` 页面找到 `产品型号` (`MiTV`):

  ![关于界面](../图/20231227-3/1-dev.jpg)

  选中 `产品型号` 然后连续多次点击遥控器上的 `确认` 按键,
  即可进入 `开发者模式`.

+ (3) 在设置中的 `帐号与安全` 页面, 将 `ADB调试` 选项打开:

  ![帐号与安全界面](../图/20231227-3/1-adb.jpg)

  ADB 调试这个开关只有在上一步开启开发者模式后才会出现.
  并且每次重启之后, 这个选项都会自动关闭.

+ (4) 通过有线以太网或无线 wifi 将设备联网,
  然后看一下设备的 IP 地址 (下图已打马):

  ![网络信息界面 (已打马)](../图/20231227-3/1-net.jpg)

  比如此处设备的 IP 地址是 `192.168.33.121`

  注意, 只需要将设备连接至本地局域网,
  能够通过 DHCP 获取 IP 地址即可, 无需连接互联网 (Internet).

+ (5) 在 PC (台式机或笔记本) 上安装 adb 工具, 然后执行命令:

  ```
  > adb connect 192.168.33.121
  connected to 192.168.33.121:5555
  > adb devices
  List of devices attached
  192.168.33.121:5555	device
  ```

  需要在电视上使用遥控器同意 adb 调试.

  此时就成功通过 adb 连接到了电视 !

+ (6) 在 PC 上使用 adb 安装 apk, 比如:

  ```sh
  adb install aida64-v198.apk
  ```

  重复使用这个命令, 就可以安装多个应用:

  ![应用列表](../图/20231227-3/1-app.jpg)

  如果安装命令执行成功后, 没有显示出应用图标, 可以重启电视.

----

下面是运行一些应用的截图:

+ AIDA64

  ![AIDA64 (1)](../图/20231227-3/1-aida-1.jpg)
  ![AIDA64 (2)](../图/20231227-3/1-aida-2.jpg)

  AIDA64 for Android 版本 1.98

  ![AIDA64 (3)](../图/20231227-3/1-aida-3.jpg)

  设备代号 `mulan`, 型号 `MiTV-ASTP0`, 处理器厂家 `amlogic`.

  ![AIDA64 (4)](../图/20231227-3/1-aida-4.jpg)
  ![AIDA64 (5)](../图/20231227-3/1-aida-5.jpg)
  ![AIDA64 (6)](../图/20231227-3/1-aida-6.jpg)

  设备特性.

  ![AIDA64 (7)](../图/20231227-3/1-aida-7.jpg)

  处理器: 4 核 A35 频率 1.8GHz, 处理器支持 aarch64-v8a,
  但是 Android 系统是 32 位的 (armeabi-v7a),
  所以只能运行 32 位的应用.

  这点需要特别注意,
  因为最新版的 Android 和处理器已经放弃了 32 位 ARM 的支持,
  未来各种应用基本都会成为 64 位的.
  而 64 位的应用无法在这个设备上运行.

  ![AIDA64 (8)](../图/20231227-3/1-aida-8.jpg)

  GPU Mali-G31, 支持 OpenGL ES 3.2.

  Android UI 分辨率 1920x1080,
  这是因为弱鸡处理器根本带不动更高分辨率的图形界面.

  ![AIDA64 (9)](../图/20231227-3/1-aida-9.jpg)

  网络支持 5GHz wifi.

  ![AIDA64 (10)](../图/20231227-3/1-aida-10.jpg)
  ![AIDA64 (11)](../图/20231227-3/1-aida-11.jpg)

  系统版本 Android 9 (API 28), Android 安全补丁级别 2021-02-01.

  引导程序 U-Boot, Linux 内核版本 4.9.113.

  ![AIDA64 (12)](../图/20231227-3/1-aida-12.jpg)
  ![AIDA64 (13)](../图/20231227-3/1-aida-13.jpg)

  设备.

  ![AIDA64 (14)](../图/20231227-3/1-aida-14.jpg)
  ![AIDA64 (15)](../图/20231227-3/1-aida-15.jpg)
  ![AIDA64 (16)](../图/20231227-3/1-aida-16.jpg)

  编解码器.

  ![AIDA64 (17)](../图/20231227-3/1-aida-17.jpg)

  目录.

  ![AIDA64 (18)](../图/20231227-3/1-aida-18.jpg)
  ![AIDA64 (19)](../图/20231227-3/1-aida-19.jpg)

  系统文件.

+ Chrome

  ![chrome (2)](../图/20231227-3/1-chrome-2.jpg)

  ![chrome (3)](../图/20231227-3/1-chrome-3.jpg)

  ![chrome (4)](../图/20231227-3/1-chrome-4.jpg)

  ![chrome (5)](../图/20231227-3/1-chrome-5.jpg)

  ![chrome (6)](../图/20231227-3/1-chrome-6.jpg)

  ![chrome (7)](../图/20231227-3/1-chrome-7.jpg)

  ![chrome (8)](../图/20231227-3/1-chrome-8.jpg)

  ![chrome (9)](../图/20231227-3/1-chrome-9.jpg)

  ![chrome (10)](../图/20231227-3/1-chrome-10.jpg)

+ 酷安:

  ![酷安 (1)](../图/20231227-3/1-coolapk-1.jpg)

+ 文件管理器 (Simple File Manager pro):

  ![Simple File Manager pro](../图/20231227-3/1-simple-file-manager-pro-1.jpg)

+ Jellyfin TV:

  ![Jellyfin TV](../图/20231227-3/1-jellyfin-tv-1.jpg)

+ 安兔兔:

  ![安兔兔 (1)](../图/20231227-3/1-antutu-1.jpg)

  ![安兔兔 (2)](../图/20231227-3/1-antutu-2.jpg)
  ![安兔兔 (3)](../图/20231227-3/1-antutu-3.jpg)
  ![安兔兔 (4)](../图/20231227-3/1-antutu-4.jpg)
  ![安兔兔 (5)](../图/20231227-3/1-antutu-5.jpg)

  ![安兔兔 (6)](../图/20231227-3/1-antutu-6.jpg)
  ![安兔兔 (7)](../图/20231227-3/1-antutu-7.jpg)

  ![安兔兔 (8)](../图/20231227-3/1-antutu-8.jpg)
  ![安兔兔 (9)](../图/20231227-3/1-antutu-9.jpg)

  ![安兔兔 (10)](../图/20231227-3/1-antutu-10.jpg)


## 2 开机进入 recovery

本章所需硬件设备:
小米电视, 小米电视的遥控器.

+ (1) 关机, **拔掉电源**.

  注意, 一定要拔掉电源, 仅仅关机是不够的.

+ (2) (适用于 蓝牙遥控器)

  同时按住遥控器上的 `确认` 和 `返回` 按键, 如图 (黄圈标记):

  ![遥控器按钮](../图/20231227-3/2-a43p-brc-1.jpg)

  按住遥控器按键不松手, 插电开机.

+ 进入 recovery 界面如图:

  ![小米电视 recovery 界面](../图/20231227-3/2-a43p-recovery-1.jpg)


## 3 制作 HDMI 转 UART (TTL 5V) 调试线

本章所需硬件设备:
HDMI 插头 (或 HDMI 线), USB 转 UART 模块 (推荐 CP2102), 杜邦线,
万用表 (可选), 剪刀、螺丝刀等小工具.

在淘宝等购买 HDMI 插头 (推荐 HDMI 免焊接插头, 方便接线),
以及 USB 转 UART 模块 (推荐 CP2102 型号), 照片如图:

![所需硬件照片](../图/20231227-3/3-m-1.jpg)

按照下表接线:

| HDMI 引脚 | CP2102 模块 | 备注 |
| --------: | :---------- | :--- |
| 14 | +5V | 电源 |
| 15 | TXD | UART 发送 |
| 16 | RXD | UART 接收 |
| 20 | GND | 接地 |

**注意: 5V 电源线必须连接, 如果不接则 UART 不会有输出.**

接线后照片:

![接线后照片 (1)](../图/20231227-3/3-w-1.jpg)
![接线后照片 (2)](../图/20231227-3/3-w-2.jpg)

如果有万用表, 可以在接线之后测量一下是否连通.


## 4 开机进入 uboot

本章所需硬件设备:
小米电视, 章节 (3) 制作的调试线, PC (台式机或笔记本).

**注意: 这台设备的 UART 波特率为 `921600` !**
(之前使用 `115200` 一直是乱码)

+ (1) 将调试线的 USB 转 UART 模块插到 PC, 并打开 UART.

  使用哪种操作系统, 以及串口软件都可以.
  以下栗子只是多种可能之一.

操作命令举例 (操作系统 ArchLinux):

+ 插上 CP2102 模块:

  ```
  > lsusb
  Bus 001 Device 006: ID 10c4:ea60 Silicon Labs CP210x UART Bridge
  > ls -l /dev/tty*
  crw-rw---- 1 root uucp 188,  0 12月26日 15:40 /dev/ttyUSB0
  ```

  此处 CP2102 USB 转 UART 模块出现为设备文件 `/dev/ttyUSB0`

+ 设置波特率为 `921600`:

  ```
  > stty -F /dev/ttyUSB0 ispeed 921600 ospeed 921600
  > stty -F /dev/ttyUSB0 speed
  921600
  ```

+ 打开 UART:

  ```
  > cu -l /dev/ttyUSB0
  Connected.
  ```

  如果没有 `cu` 命令, 可以安装 `uucp`:

  ```
  > sudo pacman -S uucp
  ```

----

+ (2) 将调试线的 HDMI 插头插到电视的 HDMI 1 插座, 如图:

  ![调试线插图](../图/20231227-3/4-s-1.jpg)

  正常开机状态下, **重启** 电视.
  然后应该能看到 UART 输出的启动日志:

```
AOCPU unknown cmd=20
[VRTC] xMboxSetRTC val=0x64373481
T5:BL:b49668;ID:4D32583237340F0000250D01;FEAT:B0F875B4:280000;POC:F;RCY:0;EMMC:0;READ:0;0.0;0.0;CHK:0;
aml log : uart_clk_enhance() need fine tune

efuse adjust vddee vol,get efuse index value:0002
use efuse adjust vddee voltage, set vol 0.84v
bl2_stage_init 0x01

L0:00001803
L1:00000702
L2:00008060
L3:00000000
SIP:0006c6a

TE: 117954

BL2 Aarch32 Built : 15:50:08, Mar 17 2023. t5 g2df8b51 - zhiguang.zhang@droid08-bj


aml log : T5 efuse_get_sar_adc_ref() need fine tune
Board ID = 1
Set cpu clk to 24M
Set clk81 to 24M
CPU clk: 1800 MHz
Set clk81 to 166.6M

aml log : bl2_platform_setup() need fine tune
eMMC boot @ 0
sw-hs 00000000
s
sw8 s
storage init finish
DDR debug 1  p_acs_set=fffc30f0,come here plat/t5/ddr/ddr.c ,207
aml log : not USB BOOT...
DDR_DRIVER_VERSION: AML_A_PHY_V_1_2; Built : 15:50:08, Mar 17 2023. t5 g2df8b51 - zhiguang.zhang@droid08-bj
00000000
emmc switch 1 ok
ddr saved addr:00016000
Load ddr parameter from eMMC, src: 0x02c00000, des: 0xfffc4fbc, size: 0x00001000, part: 0
00000000
emmc switch 0 ok
fastboot data verify
verify result: 0
enable_fast_boot
dram_type==DDR4
config==Rank01_32bit_ch0
DDR : DDR4 Rank01_32bit_ch0
Set ddr clk to 1176 MHz
DDR debug 1 dram_vref_reg_value=00000016 plat/t5/ddr/ddr_lib.c ,4844
CS0 size: 1024MB
CS1 size: 1024MB
Total size: 2048MB @ 1176MHz
DDR : 2048MB @1176MHz
cs0 DataBus test pass
cs1 DataBus test pass
cs0 AddrBus test pass
cs1 AddrBus test pass
bdlr_step_size ps=397
rpmb not init until <register.h> have been fixed
Load FIP HDR from eMMC, src: 0x00014200, des: 0x00200000, size: 0x00004000, part: 0
Load BL3X from eMMC, src: 0x00018200, des: 0x00204000, size: 0x00138000, part: 0

boot BL31
NOTICE:  BL31: v1.3(release):e2d6c4e91
NOTICE:  BL31: Built : 15:39:27, May 20 2021
BL31:tsensor calibration rev, buf1[1], buf1[0]: 0x2, 0x80, 0xc
BL31:tsensor calibration: 0x8600000c
tsensor reg: 0x20d4
mhu init done-v2
NOTICE:  BL31: T5 secure boot!
NOTICE:  BL31: BL33 decompress pass
Starting IANFO:    BL3-2: ATOS-V2.4.4-145-gf6c6ed9e2 #1 Wed Dec 16 12:45:54 2020 +0800 arm
INFO:    BL3-2: Chip: T5 Rev: B (34:B - 10:11)
INFO:    BL3-2: crypto engine DMA
INFO:    BL3-2: secure time TEE
INFO:    BL3-2: CONFIG_DEVICE_SECURE 0xb200000e
OCPU FreeRTOS
AOCPU image version='(no 6774b479c2e09162650601c4c33d8a1f194dd5f1 15:55:52 2023-04-04'
[AOCPU]: mailbox init start
reg idx=0 cmd=6 handler=100051da
reg idx=1 cmd=7 handler=100051c4
[AOCPU]: mailbox -v1 init end
reg idx=2 cmd=9 handler=100057ca
Starting timer ...
reg idx=3 cmd=b4 handler=10002a4e
reg idx=4 cmd=b6 handler=10002992
reg idx=5 cmd=11 handler=100017b0
reg idx=6 cmd=12 handler=100017e8
reg idx=7 cmd=4 handler=100019b6
reg idx=8 cmd=30 handler=100019a2
reg idx=9 cmd=31 handler=100019b2
Starting task scheduler ...
protect cbus registers


U-Boot 2015.01-g9fb9269-mulan_a-22 (Apr 04 2023 - 15:55:49), Build: jenkins-uboot_Mulan_A-22

DRAM:  2 GiB
Relocation Offset is: 76e45000
mmu cfg end: 0x80000000
mmu cfg end: 0x80000000
spi_post_bind(spicc): req_seq = 0
register usb cfg[0][1] = 0000000077f4dae8
gpio: pin GPIOD_2 (gpio 2) value is 0
gpio: pin GPIOD_3 (gpio 3) value is 1
gpio: pin GPIOB_12 (gpio 48) value is 0
gpio: pin GPIOB_13 (gpio 49) value is 0
MMC:   aml_priv->desc_buf = 0x0000000073e35cd0
aml_priv->desc_buf = 0x0000000073e38010
SDIO Port B: 0, SDIO Port C: 1
co-phase 0x3, tx-dly 0, clock 400000
co-phase 0x3, tx-dly 0, clock 400000
co-phase 0x3, tx-dly 0, clock 400000
emmc/sd response timeout, cmd8, cmd->cmdarg=0x1aa, status=0x1ff2800
emmc/sd response timeout, cmd55, cmd->cmdarg=0x0, status=0x1ff2800
co-phase 0x3, tx-dly 0, clock 400000
co-phase 0x3, tx-dly 0, clock 40000000
init_part() 297: PART_TYPE_AML
[mmc_init] mmc init success
aml log : R2048 check pass!
      Amlogic Multi-DTB tool
      Multi DTB detected.
      Multi DTB tool version: v2.
      Support 2 DTBS.
ddr size = 80000000
      Found DTB for "t5_mulan_01_2g"
start dts,buffer=0000000073e3a860,dt_addr=0000000073e3b060
get_partition_from_dts() 80: ret 0
parts: 19
00:      logo	0000000000800000 1
01:  recovery	0000000001800000 1
02:      misc	0000000000800000 1
03:      dtbo	0000000000800000 1
04:  cri_data	0000000000800000 11
05:     param	0000000001000000 2
06:      boot	0000000001000000 1
set has_boot_slot = 0
07:       rsv	0000000001000000 1
08:  metadata	0000000001000000 1
09:    vbmeta	0000000000200000 1
10:       tee	0000000002000000 1
11:secure_recovery	0000000002000000 1
12:factorydata	0000000000a00000 11
13:    vendor	0000000020000000 1
14:       odm	0000000008000000 1
15:    system	0000000060000000 1
16:   product	0000000002000000 1
17:     cache	0000000020000000 2
18:      data	ffffffffffffffff 4
init_part() 297: PART_TYPE_AML
eMMC/TSD partition table have been checked OK!
crc32_s:0x1577dad == storage crc_pattern:0x1577dad!!!
crc32_s:0xee152b83 == storage crc_pattern:0xee152b83!!!
crc32_s:0x79f50f07 == storage crc_pattern:0x79f50f07!!!
mmc env offset: 0x27400000 
aml log : internal sys error!
reboot_mode=normal
gpio: pin GPIOD_7 (gpio 7) value is 1
[store]To run cmd[emmc dtb_read 0x1000000 0x40000]
_verify_dtb_checksum()-3476: calc 21656022, store 21656022
_verify_dtb_checksum()-3476: calc 21656022, store 21656022
dtb_read()-3691: total valid 2
update_old_dtb()-3672: do nothing
aml log : R2048 check pass!
      Amlogic Multi-DTB tool
      Multi DTB detected.
      Multi DTB tool version: v2.
      Support 2 DTBS.
ddr size = 80000000
      Found DTB for "t5_mulan_01_2g"
amlkey_init() enter!
calc 62758a9f50c, store 62758a9f50c
calc 62758a9f50c, store 62758a9f50c
do nothing
[EFUSE_MSG]keynum is 4
co-phase 0x3, tx-dly 0, clock 40000000
co-phase 0x3, tx-dly 0, clock 40000000
co-phase 0x3, tx-dly 0, clock 400000
emmc/sd response timeout, cmd8, cmd->cmdarg=0x1aa, status=0x1ff2800
emmc/sd response timeout, cmd55, cmd->cmdarg=0x0, status=0x1ff2800
co-phase 0x3, tx-dly 0, clock 400000
co-phase 0x3, tx-dly 0, clock 40000000
init_part() 297: PART_TYPE_AML
[mmc_init] mmc init success
switch to partitions #0, OK
mmc1(part 0) is current device
current model_name: dzvc_01_20
mmc env offset: 0x27400000 
Writing to MMC(1)... done
D/    model:    handle_lcd_phy, phy_lane_ctrl[0] is (0x37)

D/    model:    handle_lcd_phy, phy_lane_ctrl[1] is (0x37)

D/    model:    handle_lcd_phy, phy_lane_ctrl[2] is (0x37)

D/    model:    handle_lcd_phy, phy_lane_ctrl[3] is (0x37)

D/    model:    handle_lcd_phy, phy_lane_ctrl[4] is (0x37)

D/    model:    handle_lcd_phy, phy_lane_ctrl[5] is (0x37)

D/    model:    handle_lcd_phy, phy_lane_ctrl[6] is (0x37)

D/    model:    handle_lcd_phy, phy_lane_ctrl[7] is (0x37)

D/    model:    handle_lcd_phy, phy_lane_ctrl[8] is (0x37)

D/    model:    handle_lcd_phy, phy_lane_ctrl[9] is (0x37)

D/    model:    handle_lcd_phy, phy_lane_ctrl[10] is (0x37)

D/    model:    handle_lcd_phy, phy_lane_ctrl[11] is (0x37)

[KM]Error:f[keymanage_dts_get_key_device]L99:lcd_optical key name is not exist
[KM]Error:f[_get_km_ops_by_name]L247:key lcd_optical not know device 5
[KM]Error:f[key_unify_query_exist]L367:key[lcd_optical] not cfg in dts
E/    UnifyKey:    checkUnifyKey, lcd_optical query exist error.

E/    ini_io:    check_hex_data_have_header_valid, rd data len error (0x0, 0xffffffff)

D/    model:    handle_panel_ini, check lcd_optical param data diff (0xffffffff), save new param.

[KM]Error:f[keymanage_dts_get_key_device]L99:lcd_optical key name is not exist
[KM]Error:f[_get_km_ops_by_name]L247:key lcd_optical not know device 5
[KM]Error:f[key_unify_write]L278:key[lcd_optical] no cfg in dts
vpu: clk_level in dts: 7
vpu: vpu_power_on_new
vpu: set clk: 666667000Hz, readback: 666666667Hz(0x100)
vpu: vpu_module_init_config
vpp: vpp_init
vpp: vpp osd1 matrix rgb2yuv..............
vpp: vpp osd2 matrix rgb2yuv..............
hdr_func 4, hdr_process_select 0x1
hdr_func 1, hdr_process_select 0x1
lcd: lcd_debug_print flag: 0
lcd: detect mode: tv, key_valid: 1
lcd: load lcd_config from unifykey
lcd_phy_probe
lcd: unifykey version: 0x0002
lcd: unifykey version: 0x0002
lcd: tcon: rsv_mem addr:0x2bc00000, size:0xc00000
lcd: lcd_tcon_bin_path_update: init_load: 0
lcd: tcon: load init data len: 6356, ver: 20221009
lcd: lcd_tcon_bin_load
E/    model:    handle_tcon_data_load, tcon_data[4] file name "/param/tcon_demura.bin" not exist.

lcd extern: load config from unifykey
lcd extern: add driver ext_default(0)
lcd: lcd_extern_config_update_dynamic_size size:0x2b
lcd: lcd_extern_config_update_dynamic_size size:0x0
lcd: lcd_extern_config_update_dynamic_size size:0x0
lcd extern: aml_lcd_extern_probe: index(0->0) ok
lcd: load backlight_config from unifykey
lcd: bl: unifykey version: 0x0001
lcd: bl: pinctrl_version: 2
lcd: bl: name: bl_pwm, method: 2
lcd: bl: bl_level: 127
lcd: bl: aml_bl_power_ctrl: 0
aml log : internal sys error!
s_version: U-Boot 2015.01-g9fb9269-mulan_a-22
do_factorydata_read:258 Can't find out dcdc from factorydata.
factorydata - Access the factorydata from Xiaomi Partition

Usage:
factorydata     argv:  
    dump
    read keyname
    write keyname value
    erase keyname

Hit Enter or space or Ctrl+C key to stop autoboot -- :  0 

soc_family_id==0x00000034
table_max=0000000c,p_ddr_base_add=77f4b9c0,chip_id=00000034
table_index=00000000,p_ddr_base_add=77f4b9c0,(p_ddr_base->chip_id==00000028
no find match chip id=0x00000034, ,G12A will use default value
table_index=00000001,p_ddr_base_add=77f4ba10,(p_ddr_base->chip_id==00000029
no find match chip id=0x00000034, ,G12B will use default value
table_index=00000002,p_ddr_base_add=77f4ba60,(p_ddr_base->chip_id==0000002e
no find match chip id=0x00000034, ,TL1 will use default value
table_index=00000003,p_ddr_base_add=77f4bab0,(p_ddr_base->chip_id==0000002b
no find match chip id=0x00000034, ,SM1 will use default value
table_index=00000004,p_ddr_base_add=77f4bb00,(p_ddr_base->chip_id==0000002f
no find match chip id=0x00000034, ,TM2 will use default value
table_index=00000005,p_ddr_base_add=77f4bb50,(p_ddr_base->chip_id==0000002c
no find match chip id=0x00000034, ,A1 will use default value
table_index=00000006,p_ddr_base_add=77f4bba0,(p_ddr_base->chip_id==00000030
no find match chip id=0x00000034, ,C1 will use default value
table_index=00000007,p_ddr_base_add=77f4bbf0,(p_ddr_base->chip_id==00000033
no find match chip id=0x00000034, ,C2 will use default value
table_index=00000008,p_ddr_base_add=77f4bc40,(p_ddr_base->chip_id==00000032
no find match chip id=0x00000034, ,SC2 will use default value
table_index=00000009,p_ddr_base_add=77f4bc90,(p_ddr_base->chip_id==00000034
find match chip id=0x00000034 ,T5
uboot  auto fast boot check flash data is ok return 
Command: bcb uboot-command 
Start read misc partition datas!
BCB hasn't any datas,exit!
pll tsensor avg: 0x20da, u_efuse: 0xc
temp1: 45
device cool done
[OSD]load fb addr from dts:/meson-fb
[OSD]load fb addr from dts:/fb
[OSD]set initrd_high: 0x2b400000
[OSD]fb_addr for logo: 0x2b400000
[OSD]load fb addr from dts:/meson-fb
[OSD]load fb addr from dts:/fb
[OSD]fb_addr for logo: 0x2b400000
[OSD]VPP_OFIFO_SIZE:0xfff01fff
[CANVAS]canvas init
[CANVAS]addr=0x2b400000 width=3840, height=2160
[OSD]osd_hw.free_dst_data: 0,3839,0,2159
[OSD]osd1_update_disp_freescale_enable
vpp: vpp_matrix_update: 0
vpp: g12a/b post2(bit12) matrix: YUV limit -> RGB ..............
lcd: enable: ST4251D02_1, p2p, 3840x2160@60. 0Hz
lcd: tv driver init(ver 20221101): p2p
lcd: reset tcon
lcd: lcd_pll_wait_lock: pll_lock=1, wait_loop=1
lcd: set pll spread spectrum: 15, 30000ppm
lcd: set pll spread spectrum: freq=0, mode=0
vpp: vpp_init_lcd_gamma_table
[info]spicc_probe: amlogic,meson-g12a-spicc @00000000ffd13000
[info]spicc_cs_gpio_init: cs_gpio[0]=22
[info]spicc_cs_gpio_init: total (1) slaves
SF: Detected XM25QH80B with page size 256 Bytes, erase size 4 KiB, total 1 MiB
spi read test ok spi_read_test
lcd: error: spi read test ok
lcd: lcd_tcon_core_reg_set
lcd: error: lcd_tcon_data_set: data index -1 is invalid
lcd extern: lcd_extern_power_ctrl: ext_default(0): 1
lcd: bl: set level: 127, last level: 0
lcd: bl: aml_bl_power_ctrl: 1
lcd: clear mute
Start read misc partition datas!
info->attemp_times = 0
info->active_slot = 0
info->slot_info[0].bootable = 1
info->slot_info[0].online = 1
info->slot_info[1].bootable = 0
info->slot_info[1].online = 0
info->attemp_times = 0
attemp_times = 0 
active slot = 0 
[imgread]szTimeStamp[2023041122493711]
[imgread]secureKernelImgSz=0x866000
aml log : R~2048 check pass!
aml log : R2048 check pass!
aml log : R2048 check pass!
avb2: 0
ee_gate_off ...
avb2: 0
## Booting Android Image at 0x01080000 ...
Kernel command line: androidboot.dtbo_idx=0 buildvariant=user
[store]Is good fdt check header, no need decrypt!
active_slot is normal
load dtb from 0x1000000 ......
      Amlogic Multi-DTB tool
      Single DTB detected
find 1 dtbos
dtbos to be applied: 0
Apply dtbo 0
   Loading Kernel Image(COMP_NONE) ... OK
   kernel loaded at 0x01080000, end = 0x018b9000
libfdt fdt_getprop(): FDT_ERR_NOTFOUND
   Loading Device Tree to 0000000009fe7000, end 0000000009fff559 ... OK
fdt_fixup_memory_banks, reg:0000000000000000

Starting kernel ...

uboot time: 3036492 us
vmin:72 b2 6 0!
[VRTC]: xMboxGetRTC val=0x64373481
[cec_get_portinfo]: info=0x0
AOCPU unknown cmd=b5
```

如果看到类似上面的输出, 说明调试线及各种设置一切正常 !

+ (3) 再次重启, 同时快速连续多次按回车键, 直到进入 uboot 命令行:

```
s_version: U-Boot 2015.01-g9fb9269-mulan_a-22
do_factorydata_read:258 Can't find out dcdc from factorydata.
factorydata - Access the factorydata from Xiaomi Partition

Usage:
factorydata     argv:  
    dump
    read keyname
    write keyname value
    erase keyname

Hit Enter or space or Ctrl+C key to stop autoboot -- :  0 
mulan#
mulan#
mulan#
mulan#
```

好了, 这就进入 uboot 命令行了 !
我们先来查看一些信息.

执行 `printenv` 命令:

```
mulan#printenv
DisableSelinux=permissive
EnableSelinux=enforcing
Irq_check_en=0
Ramoops_io_dump=0
Ramoops_io_en=0
Ramoops_io_skip=1
assm_mn=DZVCARF3B18TXNXX02321
assm_sn=48276106100061401
baudrate=115200
bl_level=127
boot_part=boot
bootargs=init=/init ramoops.pstore_en=1 ramoops.record_size=0x8000 ramoops.console_size=0x4000 logo=osd0,loaded,0x3d800000 powermode=on fb_width=1920 fb_height=1080 display_bpp=16 outputmode=2160p60hz vout=2160p60hz,enable panel_type= lcd_ctrl=0x00001185 osd_reverse=n video_reverse=0 androidboot.firstboot=0 jtag=disable irq_check_en=0 ramoops_io_en=0 ramoops_io_dump=0 ramoops_io_skip=1 androidboot.mi.panel_size=43 bl_level=127 androidboot.mi.panel_vendor=csot androidboot.mi.panel_resolution=3840x2160 androidboot.panel_type=20 androidboot.reboot_mode=normal androidboot.platform_id=1180 androidboot.model_name=dzvc_01_20 androidboot.redmi=false androidboot.hwid=01 androidboot.serialno=48276106100061401 androidboot.mac=78:53:33:10:dd:a5 androidboot.assm_mn=DZVCARF3B18TXNXX02321 androidboot.did_key=00CB00073C3B|754663978|k5sBrXtwBJ6BLv5O loglevel=0 androidboot.console_enable=0 androidboot.hardware=amlogic androidboot.bootloader=U-Boot 2015.01-g9fb9269-mulan_a-22 androidboot.build.expect.baseband=N/A androidboot.provider=amlogic androidboot.watchdog=enabled androidboot.mi.panel_buildin=true androidboot.mi.panel_3d_attribut=0 androidboot.mi.cpu=Cortex-A35 androidboot.mi.gpu=Mali-G31
bootcmd=ddr_auto_fast_boot_check 6; run switch_bootmode
bootdelay=1
bootloader_version=U-Boot 2015.01-g9fb9269-mulan_a-22
cec_ac_wakeup=1
cec_fun=0x2F
cmdline_keys=if factorydata read assm_sn; then setenv bootargs ${bootargs} androidboot.serialno=${assm_sn};else setenv bootargs ${bootargs} androidboot.serialno=1234567890;fi;if factorydata read mac; then setenv bootargs ${bootargs} androidboot.mac=${mac};fi;if factorydata read assm_mn; then setenv bootargs ${bootargs} androidboot.assm_mn=${assm_mn};fi;if factorydata read did_key; then setenv bootargs ${bootargs} androidboot.did_key=${did_key};fi;if factorydata read dcdc; then setenv bootargs ${bootargs} androidboot.dcdc=${dcdc};fi;if factorydata read log_level; then setenv bootargs ${bootargs} loglevel=${log_level};else setenv bootargs ${bootargs} quiet;fi;if factorydata read console_enable; then setenv bootargs ${bootargs} androidboot.console_enable=${console_enable};if itest ${console_enable} != 0; then setenv bootargs ${bootargs} ${console_userdebug};fi;else setenv bootargs ${bootargs} ${console_userdebug};fi;if factorydata read mitv_screen_on; then if test ${mitv_screen_on} = false; then factorydata write mitv_screen_on 'true';else factorydata write mitv_screen_on 'true';setenv mitv_screen_on true;fi;else factorydata write mitv_screen_on 'true';setenv mitv_screen_on true;fi;
console_enable=0
console_userdebug=console=ttyS0,921600 no_console_suspend earlycon=aml-uart,0xffd23000 printk.devkmsg=on
did_key=00CB00073C3B|754663978|k5sBrXtwBJ6BLv5O
display_bpp=16
display_color_bg=0
display_color_fg=0xffff
display_color_index=16
display_height=1080
display_layer=osd0
display_width=1920
dtb_mem_addr=0x1000000
edid_14_dir=/odm/etc/tvconfig/hdmi/port_14.bin
edid_20_dir=/odm/etc/tvconfig/hdmi/port_20.bin
edid_select=0
factory_reset_poweroff_protect=if test ${wipe_data} = failed; then echo wipe_data=${wipe_data};run update;fi;if test ${wipe_cache} = failed; then echo wipe_cache=${wipe_cache};run update;fi;
fb_addr=0x3d800000
fb_height=1080
fb_width=1920
fdt_high=0x20000000
ffv_freeze=off
ffv_wake=off
firstboot=0
frac_rate_policy=1
fs_type=root=/dev/mmcblk0p20 ro rootwait skip_initramfs
hdmimode=2160p60hz
hdr_policy=1
hwid=01
init_display=osd open;osd clear;if test ${redmi} = true; then imgread pic logo redmi ${loadaddr};bmp display ${redmi_offset};else imgread pic logo bootup ${loadaddr};bmp display ${bootup_offset};fi;bmp scale;vout output ${outputmode}
initargs=init=/init ramoops.pstore_en=1 ramoops.record_size=0x8000 ramoops.console_size=0x4000 
irremote_update=if irkey 2500000 0xe31cfb04 0xb748fb04; then echo read irkey ok!; if itest ${irkey_value} == 0xe31cfb04; then run update;fi;fi;
jtag=disable
lcd_ctrl=0x00001185
lcd_init_level=0
led_brightness=0xff
loadaddr=1080000
lock=10101000
log_level=0
logic_addr=0x0
mac=78:53:33:10:dd:a5
mitv_screen_on=true
model_edid=/odm/etc/tvconfig/hdmi/port_14.bin
model_name=dzvc_01_20
model_panel=/odm/panel/CSOT_ST4251D02-1/p2p_cspi_cvte.ini
model_tcon=/odm/panel/CSOT_ST4251D02-1/p2p_cspi.bin
model_tcon_bin_header=1
model_tcon_ext_b0=null
model_tcon_ext_b0_spi=/param/tcon_p_gamma.bin
model_tcon_ext_b1=null
model_tcon_ext_b1_spi=null
model_tcon_ext_b2=null
model_tcon_ext_b2_spi=null
model_tcon_ext_b3=null
model_tcon_ext_b3_spi=null
osd_reverse=n
otg_device=0
outputmode=2160p60hz
panel_name=ST4251D02_1
panel_resolution=3840x2160
panel_reverse=0
panel_size=43
panel_vendor=csot
platform_id=1180
port_map=4312
powermode=on
preboot=run storeargs;
ramdump_enable=1
reboot_mode=normal
recovery_from_flash=if itest ${upgrade_step} == 3; then if ext4load mmc 1:2 ${dtb_mem_addr} /recovery/dtb.img; then echo cache dtb.img loaded; fi;if ext4load mmc 1:2 ${loadaddr} /recovery/recovery.img; then echo cache recovery.img loaded; bootm ${loadaddr}; fi;fi;if imgread kernel ${recovery_part} ${loadaddr} ${recovery_offset}; then bootm ${loadaddr}; fi;
recovery_from_udisk=if fatload usb 0 ${loadaddr} mulan.autoscript; then autoscr ${loadaddr}; fi;if fatload usb 0 ${loadaddr} mulan.recovery; then if fatload usb 0 ${dtb_mem_addr} mulan.dtb; then echo udisk dtb loaded; fi;bootm ${loadaddr};fi;
recovery_fs_type=root=ramfs
recovery_offset=0
recovery_part=recovery
redmi=false
sdr2hdr=0
secureboot=setenv bootargs ${bootargs} ${recovery_fs_type} otg_device=0;run init_display;get_valid_slot;if imgread kernel secure_recovery ${loadaddr} 0; then bootm ${loadaddr}; fi;reboot;
stderr=serial
stdin=serial
stdout=serial
storeargs=get_rebootmode;get_bootloaderversion;setenv bootargs ${initargs} logo=${display_layer},loaded,${fb_addr} powermode=${powermode} fb_width=${fb_width} fb_height=${fb_height} display_bpp=${display_bpp} outputmode=${outputmode} vout=${outputmode},enable panel_type=${panel_type} lcd_ctrl=${lcd_ctrl} osd_reverse=${osd_reverse} video_reverse=${video_reverse} androidboot.firstboot=${firstboot} jtag=${jtag} irq_check_en=${Irq_check_en} ramoops_io_en=${Ramoops_io_en} ramoops_io_dump=${Ramoops_io_dump} ramoops_io_skip=${Ramoops_io_skip};setenv bootargs ${bootargs} androidboot.mi.panel_size=${panel_size} bl_level=${bl_level} androidboot.mi.panel_vendor=${panel_vendor} androidboot.mi.panel_resolution=${panel_resolution} androidboot.panel_type=${tag};setenv bootargs ${bootargs} androidboot.reboot_mode=${reboot_mode} androidboot.platform_id=${platform_id} androidboot.model_name=${model_name} androidboot.redmi=${redmi} androidboot.hwid=${hwid};run cmdline_keys;setenv bootargs ${bootargs} androidboot.hardware=amlogic androidboot.bootloader=${bootloader_version} androidboot.build.expect.baseband=N/A;setenv bootargs ${bootargs} androidboot.provider=amlogic androidboot.watchdog=enabled androidboot.mi.panel_buildin=true androidboot.mi.panel_3d_attribut=0 androidboot.mi.cpu=Cortex-A35 androidboot.mi.gpu=Mali-G31;
suspend=shutdown
switch_bootmode=bcb uboot-command;run factory_reset_poweroff_protect;run upgrade_check;if test ${reboot_mode} = cold_boot; then if adcdetect; then echo GOT secure_recovery key from ADC;run secureboot;fi;if irdetect; then echo GOT recovery key from IR;run update;fi;if monitor_bt_cmdline; then echo GOT recovery key from BT;run update;fi;if factorydata read factory_power_mode; then echo Factory power mode: ${factory_power_mode};if test ${factory_power_mode} = secondary;then systemoff;fi;fi;else boot_cooling;if test ${reboot_mode} = fastboot; then fastboot;else if test ${reboot_mode} = update; then setenv bootargs ${bootargs} ${recovery_fs_type} aml_dt=${aml_dt} recovery_part=${recovery_part} recovery_offset=${recovery_offset} androidboot.selinux=${DisableSelinux} otg_device=0;run init_display;run recovery_from_flash;else if test ${reboot_mode} = watchdog_reboot; then if test ${mitv_screen_on} = false; then monitor_bt_cmdline;echo watchdog enter system off;systemoff;fi;else if test ${reboot_mode} = kernel_panic; then if test ${mitv_screen_on} = false; then monitor_bt_cmdline;echo kernel_panic enter system off;systemoff;fi;else if test ${reboot_mode} = factory_reset; then setenv bootargs ${bootargs} ${recovery_fs_type} aml_dt=${aml_dt} recovery_part=${recovery_part} recovery_offset=${recovery_offset} androidboot.selinux=${DisableSelinux} otg_device=0;run init_display;run recovery_from_flash;fi; fi; fi; fi; fi; fi;run init_display;setenv bootargs ${bootargs} ${fs_type} androidboot.selinux=${EnableSelinux} otg_device=${otg_device} androidboot.led_brightness=${led_brightness};get_valid_slot;if imgread kernel boot ${loadaddr}; then bootm ${loadaddr}; fi;run storeargs;setenv bootargs ${bootargs} ${recovery_fs_type} aml_dt=${aml_dt} recovery_part=${recovery_part} recovery_offset=${recovery_offset} androidboot.selinux=${DisableSelinux} otg_device=0;run recovery_from_flash;
tag=20
update=setenv bootargs ${bootargs} ${recovery_fs_type} aml_dt=${aml_dt} recovery_part=${recovery_part} recovery_offset=${recovery_offset} androidboot.selinux=${DisableSelinux} otg_device=0;run init_display;if usb start 0; then run recovery_from_udisk;fi;run recovery_from_flash;
upgrade_check=if itest ${upgrade_step} == 3; then echo upgrade_step=${upgrade_step}; run update;fi;
upgrade_step=0
video_reverse=0
wipe_cache=successful
wipe_data=successful

Environment size: 9759/65532 bytes
mulan#
```

uboot 命令行帮助信息:

```
mulan#help
?       - alias for 'help'
adcdetect- Detect ADC Key to start secure recovery system
adnl    - use Amlogic DNL protocol
aml_bcb - aml_bcb
aml_sysrecovery- Burning with amlogic format package from partition sysrecovery
amlmmc  - AMLMMC sub system
autoscr - run script from memory
avb     - avb
base    - print or set address offset
bcb     - bcb
bmp     - manipulate BMP image data
boot_cooling- cpu temp-system
booti   - boot arm64 Linux Image image from memory
bootm   - boot application image from memory
cec     - Amlogic cec
clkmsr  - Amlogic measure clock
cmp     - memory compare
cp      - memory copy
crc32   - checksum calculation
dcache  - enable or disable data cache
ddr_auto_fast_boot_check- ddr_fastboot_config cmd arg1 arg2 arg3...
ddr_auto_scan_drv- ddr_test_cmd cmd arg1 arg2 arg3...
ddr_auto_test_window- ddr_test_cmd cmd arg1 arg2 arg3...
ddr_cpu_test- ddr_test_cmd cmd arg1 arg2 arg3...
ddr_fast_boot- ddr_fastboot_config cmd arg1 arg2 arg3...
ddr_g12_offset_data- ddr_g12_offset_data  1 0  0 0  1 3
ddr_g12_override_data- ddr_g12_override_data  1 0  0 0  1 3
ddr_spec_test- DDR test function
ddr_test_cmd- ddr_test_cmd cmd arg1 arg2 arg3...
ddr_test_copy- ddr_test_copy function
ddrtest - DDR test function
defenv_reserv- reserve some specified envs after defaulting env
dspjtagreset- excute dsp jtag rest
dtimg   - manipulate dtb/dtbo Android image
echo    - echo args to console
efuse   - efuse commands
efuse_user- efuse user space read write ops
emmc    - EMMC sub system
env     - environment handling commands
exit    - exit script
ext4load- load binary file from a Ext4 filesystem
ext4ls  - list files in a directory (default /)
ext4size- determine a file's size
factorydata- Access the factorydata from Xiaomi Partition
false   - do nothing, unsuccessfully
fastboot- use USB Fastboot protocol
fatinfo - print information about filesystem
fatload - load binary file from a dos filesystem
fatls   - list files in a directory (default /)
fatsize - determine a file's size
fdt     - flattened device tree utility commands
forceupdate- forceupdate
g12_d2pll- g12_d2pll 1300  1 0x10 0
get_avb_mode- get_avb_mode
get_bootloaderversion- print bootloader version
get_nearly_model- find the nearly model name
get_rebootmode- get reboot mode
get_system_as_root_mode- get_system_as_root_mode
get_valid_slot- get_valid_slot
go      - start application at address 'addr'
gpio    - query and control gpio pins
gpt     - GUID Partition Table
guid    - GUID - generate Globally Unique Identifier based on random UUID
hdmirx  - hdmirx init function

help    - print command description/usage
i2c     - I2C sub-system
icache  - enable or disable instruction cache
img_osd - image osd sub-system
imgread - Read the image from internal flash with actual size
ini     - parse an ini file in memory and merge the specified section into the env
ini_model- parse ini file by env model_name
init_vpp- Initial VPP Module
irdetect- Detect IR Key to start recovery system
itest   - return true/false on integer compare
jtagoff - disable jtag
jtagon  - enable jtag
keyman  - Unify key ops interfaces based dts cfg
keyunify- key unify sub-system
lcd     - lcd sub-system
loadb   - load binary file over serial line (kermit mode)
loadx   - load binary file over serial line (xmodem mode)
loady   - load binary file over serial line (ymodem mode)
loop    - infinite loop on address range
md      - memory display
mm      - memory modify (auto-incrementing address)
mmc     - MMC sub system
mmcinfo - display MMC info
model_list- list ini model name
monitor_bt_cmdline- monitor_bt_cmdline
mw      - memory write (fill)
mwm     - mw mask function
nm      - memory modify (constant address)
open_scp_log- print SCP messgage
osd     - osd sub-system
panel_detect- Detect panel type from GPIO pin configuration
printenv- print environment variables
query   - SoC query commands
rdext4pic- read logo bmp from ext4 part
readMetadata- readMetadata
read_temp- cpu temp-system
reboot  - set reboot mode and reboot system
reset   - Perform RESET of the CPU
ringmsr - Amlogic measure ring
rpmb_state- RPMB sub-system
rsvmem  - reserve memory
run     - run commands in an environment variable
saradc  - saradc sub-system
saradc_12bit- saradc sub-system
saveenv - save environment variables to persistent storage
sdc_burn- Burning with amlogic format package in sdmmc 
sdc_update- Burning a partition with image file in sdmmc card
set_active_slot- set_active_slot
set_trim_base- cpu temp-system
set_usb_boot- set usb boot mode
setenv  - set environment variables
sf      - SPI flash sub-system
showvar - print local hushshell variables
sleep   - delay execution for some time
spi_read_test- read spi

sspi    - SPI utility command
startdsp- load dspboot.bin from address
store   - STORE sub-system
systemoff- system off 
tee_log_level- update tee log level
temp_triming- cpu temp-system
test    - minimal test like /bin/sh
testcache- cache test
testsmp - test each CPU power on/off
true    - do nothing, successfully
unpackimg- un pack logo image into pictures
usb     - USB sub-system
usb_burn- Burning with amlogic format package in usb 
usb_update- Burning a partition with image file in usb host
usbboot - boot from USB device
uuid    - UUID - generate random Universally Unique Identifier
version - print monitor, compiler and linker version
viu_probe- enable viu probe in no secure chip
vout    - VOUT sub-system
vout2   - VOUT2 sub-system
vpp     - vpp sub-system
vpu     - vpu sub-system
write_trim- cpu temp-system
write_version- cpu temp-system
mulan#
```

分区信息:

```
mulan#mmcinfo
Device: SDIO Port C
Manufacturer ID: 9b
OEM: 100
Name: Y2P03 
Tran Speed: 52000000
Rd Block Len: 512
MMC version 5.1
High Capacity: Yes
Capacity: (0x747c00000 Bytes) 29.1 GiB
mmc clock: 40000000
Bus Width: 8-bit
mulan#mmc part

Partition Map for MMC device 1  --   Partition Type: AML

Part   Start     Sect x Size Type  name
 00 0 8192    512 U-Boot bootloader
 01 73728 131072    512 U-Boot reserved
 02 221184 1048576    512 U-Boot cache
 03 1286144 16384    512 U-Boot env
 04 1318912 16384    512 U-Boot logo
 05 1351680 49152    512 U-Boot recovery
 06 1417216 16384    512 U-Boot misc
 07 1449984 16384    512 U-Boot dtbo
 08 1482752 16384    512 U-Boot cri_data
 09 1515520 32768    512 U-Boot param
 10 1564672 32768    512 U-Boot boot
 11 1613824 32768    512 U-Boot rsv
 12 1662976 32768    512 U-Boot metadata
 13 1712128 4096    512 U-Boot vbmeta
 14 1732608 65536    512 U-Boot tee
 15 1814528 65536    512 U-Boot secure_recovery
 16 1896448 20480    512 U-Boot factorydata
 17 1933312 1048576    512 U-Boot vendor
 18 2998272 262144    512 U-Boot odm
 19 3276800 3145728    512 U-Boot system
 20 6438912 65536    512 U-Boot product
 21 6520832 54550528    512 U-Boot data
** Partition 22 not found on device 1 **
mulan#
```

重启设备:

```
mulan#reset
resetting ...
```


## 5 进入 recovery 命令行

本章所需硬件设备:
小米电视, 小米电视的遥控器, 章节 (3) 制作的调试线, PC (台式机或笔记本).

+ (1) 按照章节 (4) 的方法进入 uboot 命令行.

工厂数据:

```
mulan#factorydata
factorydata - Access the factorydata from Xiaomi Partition

Usage:
factorydata     argv:  
    dump
    read keyname
    write keyname value
    erase keyname

mulan#factorydata dump
do_factorydata_dump : Got factory_power_mode[18] is [9]secondary
do_factorydata_dump : Got console_enable[14] is [1]0
do_factorydata_dump : Got pcba_mn[7] is [21]DZVCBCP3A12XXNXF00793
do_factorydata_dump : Got pcba_sn[7] is [21]DZVCBCP3A12XXNXF00793
do_factorydata_dump : Got assm_sn[7] is [17]48276106100061401
do_factorydata_dump : Got mac[3] is [17]78:53:33:10:dd:a5
do_factorydata_dump : Got did_key[7] is [39]00CB00073C3B|754663978|k5sBrXtwBJ6BLv5O
do_factorydata_dump : Got assm_mn[7] is [21]DZVCARF3B18TXNXX02321
do_factorydata_dump : Got bt_rc_mac[9] is [18]F4:22:7A:63:AE:6D;
do_factorydata_dump : Got log_level[9] is [1]0
do_factorydata_dump : Got mitv_screen_on[14] is [4]true
do_factorydata_dump : Got miot_beacon_pdu[15] is [38]0201060FFF8F030A10070F00ACE90FE18040E0
mulan#
```

+ (2) 启用 console:

  ```
  mulan#factorydata write console_enable 1
  ```

+ (3) 按照章节 (2) 的方法进入 recovery:

```
Starting kernel ...

uboot time: 10638025 us
vmin:72 b2 6 0!
[VRTC]: xMboxGetRTC val=0x0
[cec_get_portinfo]: info=0x0
AOCPU unknown cmd=b5
# 
```

好了, 我们进入 recovery 命令行了 !
看一下基本信息:

```
# type busybox
busybox is /sbin/busybox
# busybox id
uid=0(root) gid=0(root) context=u:r:shell:s0
# busybox getenforce
Permissive
# busybox uname -a
Linux localhost 4.9.113 #1 SMP PREEMPT Tue Apr 11 22:37:53 CST 2023 armv7l GNU/Linux
# 
```

好, 我们是 `root`, 并且 SELinux 处于关闭状态, 可以为所欲为了 !

根目录:

```
# busybox ls -al /
total 2080
__bionic_open_tzdata: couldn't find any tzdata when looking for localtime!
__bionic_open_tzdata: couldn't find any tzdata when looking for GMT!
__bionic_open_tzdata: couldn't find any tzdata when looking for posixrules!
drwxr-xr-x   27 root     root             0 Jan  1 00:00 .
drwxr-xr-x   27 root     root             0 Jan  1 00:00 ..
dr-xr-xr-x    4 root     root             0 Jan  1 00:00 acct
lrwxrwxrwx    1 root     root            11 Jan  1  1970 bin -> /system/bin
drwxr-xr-x    2 root     root             0 Jan  1  1970 boot
lrwxrwxrwx    1 root     root            50 Jan  1  1970 bugreports -> /data/user_de/0/com.android.shell/files/bugreports
drwxrwx---    6 system   cache         4096 Jan  1 00:03 cache
lrwxrwxrwx    1 root     root            13 Jan  1  1970 charger -> /sbin/charger
drwxr-xr-x    4 root     root             0 Jan  1  1970 config
lrwxrwxrwx    1 root     root            17 Jan  1  1970 d -> /sys/kernel/debug
drwxr-xr-x    2 root     root             0 Jan  1  1970 data
lrwxrwxrwx    1 root     root            12 Jan  1  1970 default.prop -> prop.default
drwxr-xr-x   12 root     root          5320 Jan  1 00:00 dev
drwxr-xr-x    2 root     root             0 Jan  1  1970 etc
-rwxr-x---    1 root     root       1500384 Jan  1  1970 init
-rwxr-x---    1 root     root          2842 Jan  1  1970 init.rc
-rwxr-x---    1 root     root         14915 Jan  1  1970 init.recovery.amlogic.rc
drwxr-xr-x    2 root     root             0 Jan  1  1970 metadata
drwxr-xr-x    3 root     system          60 Jan  1 00:00 mnt
drwxr-xr-x    2 root     root             0 Jan  1  1970 odm
drwxr-xr-x    2 root     root             0 Jan  1  1970 oem
drwxr-xr-x    3 root     root             0 Jan  1  1970 persist
-rw-r--r--    1 root     root         24584 Jan  1  1970 plat_file_contexts
-rw-r--r--    1 root     root         28976 Jan  1  1970 plat_property_contexts
dr-xr-xr-x  137 root     root             0 Jan  1  1970 proc
drwxr-xr-x    2 root     root             0 Jan  1  1970 product
-rw-r--r--    1 root     root          6676 Jan  1  1970 prop.default
drwxr-xr-x    3 root     root             0 Jan  1  1970 res
drwx------    2 root     root             0 Apr 11  2023 root
drwxr-x---    2 root     root             0 Jan  1  1970 sbin
drwxr-xr-x    2 root     root             0 Jan  1  1970 sdcard
-rw-r--r--    1 root     root        472377 Jan  1  1970 sepolicy
drwxr-xr-x    2 root     root             0 Jan  1 00:00 sideload
drwxr-x--x    2 root     root             0 Jan  1  1970 storage
dr-xr-xr-x   12 root     root             0 Jan  1 00:00 sys
lrwxr-xr-x    1 root     root            19 Jan  1  1970 system -> /system_root/system
drwxr-xr-x    2 root     root             0 Jan  1  1970 system_root
drwxrwxr-x    2 root     shell           80 Jan  1 00:00 tmp
drwx------    3 root     root          8192 Jan  1  1970 udisk
-rw-r--r--    1 root     root          5272 Jan  1  1970 ueventd.rc
drwxr-xr-x    5 root     root             0 Jan  1  1970 vendor
-rw-r--r--    1 root     root         28202 Jan  1  1970 vendor_file_contexts
-rw-r--r--    1 root     root          4146 Jan  1  1970 vendor_property_contexts
# 
```


## 6 在 uboot 下备份各个系统分区

本章所需硬件设备:
小米电视, 章节 (3) 制作的调试线, PC (台式机或笔记本),
U 盘 (1 个, 格式化为 FAT32 文件系统, 容量 8GB 以上).

(这个暂时还没弄明白 !
呜 ~


## 7 在 recovery 下备份各个系统分区

本章所需硬件设备:
小米电视, 小米电视的遥控器, 章节 (3) 制作的调试线, PC (台式机或笔记本),
U 盘 (1 个, 格式化为 FAT32 文件系统, 容量 8GB 以上).

+ (1) 插入 U 盘 (FAT32 格式), 然后进入 recovery:

看一下分区:

```
# busybox ls -al /dev/block
total 0
__bionic_open_tzdata: couldn't find any tzdata when looking for localtime!
__bionic_open_tzdata: couldn't find any tzdata when looking for GMT!
__bionic_open_tzdata: couldn't find any tzdata when looking for posixrules!
drwxr-xr-x    3 root     root           820 Jan  1 00:00 .
drwxr-xr-x   12 root     root          5320 Jan  1 00:00 ..
brw-------    1 root     root      179,  11 Jan  1 00:00 boot
brw-------    1 root     root      179,   1 Jan  1 00:00 bootloader
brw-------    1 root     root      179,   3 Jan  1 00:00 cache
brw-------    1 root     root      179,   9 Jan  1 00:00 cri_data
brw-------    1 root     root      179,  22 Jan  1 00:00 data
brw-------    1 root     root      179,   8 Jan  1 00:00 dtbo
brw-------    1 root     root      179,   4 Jan  1 00:00 env
brw-------    1 root     root      179,  17 Jan  1 00:00 factorydata
brw-------    1 root     root      179,   5 Jan  1 00:00 logo
brw-------    1 root     root        7,   0 Jan  1 00:00 loop0
brw-------    1 root     root        7,   8 Jan  1 00:00 loop1
brw-------    1 root     root        7,  16 Jan  1 00:00 loop2
brw-------    1 root     root        7,  24 Jan  1 00:00 loop3
brw-------    1 root     root        7,  32 Jan  1 00:00 loop4
brw-------    1 root     root        7,  40 Jan  1 00:00 loop5
brw-------    1 root     root        7,  48 Jan  1 00:00 loop6
brw-------    1 root     root        7,  56 Jan  1 00:00 loop7
brw-------    1 root     root      179,  13 Jan  1 00:00 metadata
brw-------    1 root     root      179,   7 Jan  1 00:00 misc
brw-------    1 root     root      179,   0 Jan  1 00:00 mmcblk0
brw-------    1 root     root      179,  32 Jan  1 00:00 mmcblk0boot0
brw-------    1 root     root      179,  64 Jan  1 00:00 mmcblk0boot1
brw-------    1 root     root      179,  96 Jan  1 00:00 mmcblk0rpmb
brw-------    1 root     root       31,   0 Jan  1 00:00 mtdblock0
brw-------    1 root     root      179,  19 Jan  1 00:00 odm
brw-------    1 root     root      179,  10 Jan  1 00:00 param
drwxr-xr-x    5 root     root           100 Jan  1 00:00 platform
brw-------    1 root     root      179,  21 Jan  1 00:00 product
brw-------    1 root     root      179,   6 Jan  1 00:00 recovery
brw-------    1 root     root      179,   2 Jan  1 00:00 reserved
brw-------    1 root     root      179,  12 Jan  1 00:00 rsv
brw-------    1 root     root        8,   0 Jan  1 00:00 sda
brw-------    1 root     root        8,   1 Jan  1 00:00 sda1
brw-------    1 root     root      179,  16 Jan  1 00:00 secure_recovery
brw-------    1 root     root      179,  20 Jan  1 00:00 system
brw-------    1 root     root      179,  15 Jan  1 00:00 tee
brw-------    1 root     root      179,  14 Jan  1 00:00 vbmeta
brw-------    1 root     root      179,  18 Jan  1 00:00 vendor
brw-------    1 root     root      254,   0 Jan  1 00:00 zram0
```

挂载状态:

```
# busybox mount
rootfs on / type rootfs (rw,seclabel)
tmpfs on /dev type tmpfs (rw,seclabel,nosuid,relatime,mode=755)
devpts on /dev/pts type devpts (rw,seclabel,relatime,mode=600,ptmxmode=000)
proc on /proc type proc (rw,relatime)
sysfs on /sys type sysfs (rw,seclabel,relatime)
selinuxfs on /sys/fs/selinux type selinuxfs (rw,relatime)
tmpfs on /mnt type tmpfs (rw,seclabel,nosuid,nodev,noexec,relatime,mode=755,gid=1000)
none on /acct type cgroup (rw,relatime,cpuacct)
tmpfs on /tmp type tmpfs (rw,seclabel,relatime)
none on /config type configfs (rw,relatime)
adb on /dev/usb-ffs/adb type functionfs (rw,relatime)
/dev/block/sda1 on /udisk type vfat (rw,nodev,noatime,nodiratime,fmask=0077,dmask=0077,codepage=437,iocharset=iso8859-1,shortname=mixed,errors=remount-ro)
/dev/block/cache on /cache type ext4 (rw,seclabel,nodev,noatime,nodiratime,discard,data=ordered)
# busybox ls -al /udisk
total 16
__bionic_open_tzdata: couldn't find any tzdata when looking for localtime!
__bionic_open_tzdata: couldn't find any tzdata when looking for GMT!
__bionic_open_tzdata: couldn't find any tzdata when looking for posixrules!
drwx------    3 root     root          8192 Jan  1  1970 .
drwxr-xr-x   27 root     root             0 Jan  1 00:00 ..
drwx------    2 root     root          8192 Dec 26  2023 202312
# 
```

recovery 已经自动将 U 盘挂载到了 `/udisk` 目录.

+ (2) 备份除了 `data` (用户数据) 外的所有分区:

```
# busybox dd if=/dev/block/boot of=/udisk/boot.img
32768+0 records in
32768+0 records out
16777216 bytes (16.0MB) copied, 0.417935 seconds, 38.3MB/s
# 
```

重复使用 `dd` 命令, 具体需要备份的分区可以参考以下列表:

```
# busybox ls -al /udisk
total 3072016
__bionic_open_tzdata: couldn't find any tzdata when looking for localtime!
__bionic_open_tzdata: couldn't find any tzdata when looking for GMT!
__bionic_open_tzdata: couldn't find any tzdata when looking for posixrules!
drwx------    3 root     root          8192 Jan  1 00:21 .
drwxr-xr-x   27 root     root             0 Jan  1 00:00 ..
drwx------    2 root     root          8192 Dec 26  2023 202312
-rwx------    1 root     root      16777216 Jan  1 00:05 boot.img
-rwx------    1 root     root       4194304 Jan  1 00:06 bootloader.img
-rwx------    1 root     root     536870912 Jan  1 00:13 cache.img
-rwx------    1 root     root       8388608 Jan  1 00:16 cri_data.img
-rwx------    1 root     root       8388608 Jan  1 00:17 dtbo.img
-rwx------    1 root     root       8388608 Jan  1 00:17 env.img
-rwx------    1 root     root      10485760 Jan  1 00:18 factorydata.img
-rwx------    1 root     root       8388608 Jan  1 00:20 logo.img
-rwx------    1 root     root      16777216 Jan  1 00:18 metadata.img
-rwx------    1 root     root       8388608 Jan  1 00:20 misc.img
-rwx------    1 root     root       4194304 Jan  1 00:12 mmcblk0boot0.img
-rwx------    1 root     root       4194304 Jan  1 00:12 mmcblk0boot1.img
-rwx------    1 root     root     134217728 Jan  1 00:16 odm.img
-rwx------    1 root     root      16777216 Jan  1 00:17 param.img
-rwx------    1 root     root      33554432 Jan  1 00:19 product.img
-rwx------    1 root     root      25165824 Jan  1 00:21 recovery.img
-rwx------    1 root     root      67108864 Jan  1 00:21 reserved.img
-rwx------    1 root     root      16777216 Jan  1 00:12 rsv.img
-rwx------    1 root     root      33554432 Jan  1 00:16 secure_recovery.img
-rwx------    1 root     root     1610612736 Jan  1 00:24 system.img
-rwx------    1 root     root      33554432 Jan  1 00:17 tee.img
-rwx------    1 root     root       2097152 Jan  1 00:18 vbmeta.img
-rwx------    1 root     root     536870912 Jan  1 00:20 vendor.img
# 
```

+ (3) 重启设备, 拔出 U 盘.

  然后把上述获得的分区镜像文件, 打包压缩一下,
  找个安全的地方备份起来 (建议上传网盘), 以后对于救砖有重要用途.

  ![mitv_a43p_firmware_backup-20231226.7z](../图/20231227-3/7-backup.jpg)

  上述整个操作过程中获得的各种信息 (UART 输出), 也建议保存备用.


## 8 总结与展望

穷, 住的房间小, 所以买了个便宜的小电视, 顺便作为显示器.
这个设备计划使用多年, 所以当然要 root 了才更有可玩性,
也能在几年后延长设备的使用寿命 (当官方停止软件更新之后).
看网上这方面的文章很少, 所以查找资料总结成了这篇文章, 并且实际进行了验证.

通过本文, 你已经掌握了连接 adb, 安装 apk, 进入 uboot 命令行,
进入 recovery 命令行, 备份系统分区等多种能力.
在此基础之上, 使用 magisk 进行 root 是很容易的.

本文虽然只使用了一个型号的设备进行测试,
但是本文中的方法和思路, 应该适用于许多具体的小米电视型号,
当然具体细节可能有差别.


----

本文使用 CC-BY-SA 4.0 许可发布.
