# 显示器的隐藏功能: 显示数据通道命令接口 (DDC/CI)

有一个大部分显示器都有, 但是很少人知道的功能:
**显示数据通道命令接口** (Display Data Channel Command Interface, DDC/CI)
(窝也是刚知道)

这个功能有什么用呢 ?
可以用软件 (主机) 去控制显示器的多种工作参数,
比如亮度, 对比度, 音量, 色温, 输入源等.
大部分使用显示器菜单 (OSD) 可以设置的参数, 通过 DDC/CI 都可以,
再也不用费劲去按显示器上手感超差的按键了 ! (误

本文对 4 台显示设备进行了实际测试, 并对一些控制功能进行了说明.

----

主要参考资料:

+ Backlight - ArchWiki

  <https://wiki.archlinux.org/title/Backlight>

+ ddcutil: Control monitor settings using DDC/CI and USB

  <https://www.ddcutil.com/>
  <https://github.com/rockowitz/ddcutil>

+ ddccontrol: DDCcontrol is a software used to control monitor parameters, like brightness, contrast, RGB color levels and others.

  <https://github.com/ddccontrol/ddccontrol>


## 目录

+ 0 工作原理 (I2C)

+ 1 软件安装 (ArchLinux)

  - 1.1 常用命令

+ 2 显示器: 飞利浦 275M8RZ (27 英寸, 2021 年生产)

  - 2.1 `ddcutil` 检测

  - 2.2 操作记录

  - 2.3 部分 VCP 说明

+ 3 显示器: HKC T4000 (24 英寸, 2013 年生产)

  - 3.1 `ddcutil` 检测

  - 3.2 操作记录

  - 3.3 部分 VCP 说明

+ 4 (不支持) 小米电视 A43 pro (43 英寸, 2023 年生产)

+ 5 显示器: (新买不久) (杂牌) (23.6 英寸, 2022 年生产)

  - 5.1 `ddcutil` 检测

  - 5.2 操作记录

  - 5.3 部分 VCP 说明

+ 6 总结与展望


## 0 工作原理 (I2C)

主机的显卡和显示器之间,
通过 I2C 总线通信 (DP, HDMI, DVI, VGA 都有).
在这个过程中,
主机不仅可以获取显示器的信息 (分辨率, 刷新率, 显示器名称等),
也可以向显示器发送命令, 这就是 DDC/CI.

具体使用的协议叫做 *显示器控制命令集* (Monitor Control Command Set, MCCS),
其中的每一项功能叫做 *虚拟控制面板* (Virtual Control Panel, VCP).


## 1 软件安装 (ArchLinux)

此处以 ArchLinux 举例, 各种操作系统应该都支持.

+ (1) 安装 `ddcutil`:

  ```
  > sudo pacman -S ddcutil
  ```

+ (2) 将自己加入 `i2c` 用户组:

  ```
  > sudo gpasswd -a s20 i2c
  ```

  此处用户名 `s20` 需要替换成自己的.

+ (3) 重启.

### 1.1 常用命令

+ 查看命令帮助信息:

  ```
  > ddcutil --help
  ```

+ 查看连接的显示器:

  ```
  > ddcutil detect
  ```

+ 查询显示器支持的功能:

  ```
  > ddcutil capabilities
  ```

+ 获取某个 VCP 的当前数值:

  ```
  > ddcutil getvcp 10
  ```

  比如此处使用 `10` (亮度).

+ 设置某个 VCP 的数值:

  ```
  > ddcutil setvcp 10 30
  ```

  比如此处把亮度设为 `30`.

+ 获取所有 VCP 的当前数值, 比如:

```
> ddcutil getvcp scan
VCP code 0x02 (New control value             ): One or more new control values have been saved (0x02)
VCP code 0x0b (Color temperature increment   ): 100 degree(s) Kelvin
VCP code 0x0c (Color temperature request     ): 3000 + 70 * (feature 0B color temp increment) degree(s) Kelvin
VCP code 0x10 (Brightness                    ): current value =    30, max value =   100
VCP code 0x12 (Contrast                      ): current value =    40, max value =   100
VCP code 0x14 (Select color preset           ): 6500 K (0x05), Tolerance: Unspecified (0x00)
VCP code 0x16 (Video gain: Red               ): current value =   100, max value =   100
VCP code 0x18 (Video gain: Green             ): current value =   100, max value =   100
VCP code 0x1a (Video gain: Blue              ): current value =   100, max value =   100
VCP code 0x1e (Auto setup                    ): Auto setup not active (sl=0x00)
VCP code 0x20 (Horizontal Position (Phase)   ): current value =    50, max value =   100
VCP code 0x30 (Vertical Position (Phase)     ): current value =    50, max value =   100
VCP code 0x52 (Active control                ): Value: 0x32
VCP code 0x54 (Performance Preservation      ): mh=0x00, ml=0x01, sh=0x00, sl=0x01
VCP code 0x60 (Input Source                  ): HDMI-2 (sl=0x12)
VCP code 0x62 (Audio speaker volume          ): Volume level: 30 (00x1e)
VCP code 0x6c (Video black level: Red        ): current value =   512, max value =   100
VCP code 0x6e (Video black level: Green      ): current value =   512, max value =   100
VCP code 0x70 (Video black level: Blue       ): current value =   512, max value =   100
VCP code 0x72 (Gamma                         ): 0x0078 - Invalid sl value. sl=0x78, sh=0x00
VCP code 0x7e (Trapezoid                     ): Maximum retries exceeded
VCP code 0x86 (Display Scaling               ): No scaling (sl=0x01)
VCP code 0x87 (Sharpness                     ): current value =     5, max value =    10
VCP code 0x8d (Audio mute/Screen blank       ): Unmute the audio (sl=0x02), Invalid value (sh=0x00)
VCP code 0xac (Horizontal frequency          ): 1 hz
VCP code 0xae (Vertical frequency            ): 60.00 hz
VCP code 0xb2 (Flat panel sub-pixel layout   ): Red/Green/Blue vertical stripe (sl=0x01)
VCP code 0xb6 (Display technology type       ): LCD (active matrix) (sl=0x03)
VCP code 0xc6 (Application enable key        ): 0x005a
VCP code 0xc8 (Display controller type       ): Mfg: RealTek (sl=0x09), controller number: mh=0x00, ml=0x00, sh=0x00
VCP code 0xc9 (Display firmware level        ): 0.1
VCP code 0xca (OSD/Button Control            ): OSD disabled, button events enabled (sl=0x01), Host control of power unsupported (sh=0x00)
VCP code 0xcc (OSD Language                  ): Chinese (simplified / Kantai) (sl=0x0d)
VCP code 0xd6 (Power mode                    ): DPM: On,  DPMS: Off (sl=0x01)
VCP code 0xdf (VCP Version                   ): 2.2
VCP code 0xe6 (Manufacturer Specific         ): mh=0x00, ml=0x00, sh=0x00, sl=0x00
VCP code 0xe9 (Manufacturer Specific         ): mh=0x00, ml=0x02, sh=0x00, sl=0x00
VCP code 0xfe (Manufacturer Specific         ): Maximum retries exceeded
```


## 2 显示器: 飞利浦 275M8RZ (27 英寸, 2021 年生产)

在此说一下这个型号 (`275M8RZ`) 显示器的一些小知识:

(显示器下方的 4 个按键, 从左至右依次编号为 1 2 3 4,
比如 4 是 `OK/菜单` 键, 5 是电源开关)

+ **`屏幕控制锁定`**

  在这个状态下, 显示器是无法进行设置的,
  按显示器的按键只会在屏幕上显示 `屏幕控制锁定`.

  解锁方式:
  - (1) 关闭显示器 (按 5)
  - (2) 按住 4 不松, 开机 (按 5)

+ 打开/关闭 DDC/CI

  在正常显示状态下, 同时按住 1 和 4 不松, 保持一会儿.

  - 屏幕显示 `DDC/CI 关闭`: 表示已经关闭此功能.

  - 屏幕显示 `DDC/CI 开启`: 表示已经开启此功能 (默认).

### 2.1 `ddcutil` 检测

```
> ddcutil detect
Display 1
   I2C bus:  /dev/i2c-10
   DRM connector:           card2-HDMI-A-1
   EDID synopsis:
      Mfg id:               PHL - Philips Consumer Electronics Company
      Model:                PHL 275M8RZ
      Product code:         49702  (0xc226)
      Serial number:        
      Binary serial number: 1567 (0x0000061f)
      Manufacture year:     2021,  Week: 9
   VCP version:         2.2
```

成功检测到了显示器, 通过 HDMI 连接, 然后是显示器名称和型号信息.
生产日期 2021 年第 9 周, 支持的 VCP 版本 2.2.

```
> ddcutil capabilities
Model: 275M8RZ
MCCS version: 2.2
Commands:
   Op Code: 01 (VCP Request)
   Op Code: 02 (VCP Response)
   Op Code: 03 (VCP Set)
   Op Code: 07 (Timing Request)
   Op Code: 0C (Save Settings)
   Op Code: E3 (Capabilities Reply)
   Op Code: F3 (Capabilities Request)
VCP Features:
   Feature: 02 (New control value)
   Feature: 04 (Restore factory defaults)
   Feature: 05 (Restore factory brightness/contrast defaults)
   Feature: 08 (Restore color defaults)
   Feature: 0B (Color temperature increment)
   Feature: 0C (Color temperature request)
   Feature: 10 (Brightness)
   Feature: 12 (Contrast)
   Feature: 14 (Select color preset)
      Values:
         01: sRGB
         04: 5000 K
         05: 6500 K
         06: 7500 K
         07: 8200 K
         08: 9300 K
         0a: 11500 K
         0b: User 1
   Feature: 16 (Video gain: Red)
   Feature: 18 (Video gain: Green)
   Feature: 1A (Video gain: Blue)
   Feature: 52 (Active control)
   Feature: 54 (Performance Preservation)
      Values: 00 01 (interpretation unavailable)
   Feature: 60 (Input Source)
      Values:
         11: HDMI-1
         12: HDMI-2
         0f: DisplayPort-1
   Feature: 62 (Audio speaker volume)
      Values: 00 01 (interpretation unavailable)
   Feature: 6C (Video black level: Red)
   Feature: 6E (Video black level: Green)
   Feature: 70 (Video black level: Blue)
   Feature: 72 (Gamma)
      Specific presets of absolute adjustment supported (0xfb)
      Absolute tolerance: +/- 5% (=0x05)
      Native gamma: 2.20 (0x78)
      Specific presets:  1.80 (0x50), 2.00 (0x64), 2.20 (0x78), 2.40 (0x8c), 2.60 (0xa0)
   Feature: 86 (Display Scaling)
      Values:
         01: No scaling
         02: Max image, no aspect ration distortion
         08: Linear expansion (compression) on h and v axes
   Feature: 87 (Sharpness)
   Feature: 8D (Audio mute/Screen blank)
      Values: 00 01 (interpretation unavailable)
   Feature: AC (Horizontal frequency)
   Feature: AE (Vertical frequency)
   Feature: B2 (Flat panel sub-pixel layout)
   Feature: B6 (Display technology type)
   Feature: C0 (Display usage time)
   Feature: C6 (Application enable key)
   Feature: C8 (Display controller type)
   Feature: CA (OSD/Button Control)
      Values:
         01: OSD disabled, button events enabled
         02: OSD enabled, button events enabled
   Feature: CC (OSD Language)
      Values:
         01: Chinese (traditional, Hantai)
         02: English
         03: French
         04: German
         05: Italian
         06: Japanese
         07: Korean
         08: Portuguese (Portugal)
         09: Russian
         0a: Spanish
         0b: Swedish
         0c: Turkish
         0d: Chinese (simplified / Kantai)
         0e: Portuguese (Brazil)
         12: Czech
         14: Dutch
         16: Finnish
         17: Greek
         1a: Hungarian
         1e: Polish
         24: Ukranian
   Feature: D6 (Power mode)
      Values:
         01: DPM: On,  DPMS: Off
         04: DPM: Off, DPMS: Off
         05: Write only value to turn off display
   Feature: DC (Display Mode)
      Values:
         00: Standard/Default mode
         01: Productivity
         02: Mixed
         03: Movie
         05: Games
         08: Standard/Default mode with intermediate power consumption
   Feature: DF (VCP Version)
   Feature: E9 (Manufacturer specific feature)
      Values: 00 02 (interpretation unavailable)
   Feature: EB (Manufacturer specific feature)
      Values: 00 01 02 03 (interpretation unavailable)
   Feature: F0 (Manufacturer specific feature)
      Values: 00 01 (interpretation unavailable)
   Feature: FD (Manufacturer specific feature)
   Feature: FF (Manufacturer specific feature)
>
```

显示器型号 `275M8RZ`, MCCS 版本 2.2, 然后是支持的 VCP 功能列表.

可以看到, 对于大牌显示器, 支持的功能还是比较多的 (后面会详细介绍).

### 2.2 操作记录

```
> ddcutil getvcp 02
VCP code 0x02 (New control value             ): One or more new control values have been saved (0x02)
> ddcutil getvcp 04
Feature 04 (Restore factory defaults) is not readable
> ddcutil getvcp 05
Feature 05 (Restore factory brightness/contrast defaults) is not readable
> ddcutil getvcp 08
Feature 08 (Restore color defaults) is not readable
> ddcutil getvcp 0b
VCP code 0x0b (Color temperature increment   ): 100 degree(s) Kelvin
> ddcutil getvcp 0c
VCP code 0x0c (Color temperature request     ): 3000 + 70 * (feature 0B color temp increment) degree(s) Kelvin
> ddcutil getvcp 10
VCP code 0x10 (Brightness                    ): current value =    30, max value =   100
> ddcutil setvcp 10 80
> ddcutil getvcp 10
VCP code 0x10 (Brightness                    ): current value =    80, max value =   100
> ddcutil setvcp 10 30
> ddcutil getvcp 10
VCP code 0x10 (Brightness                    ): current value =    30, max value =   100
> ddcutil getvcp 12
VCP code 0x12 (Contrast                      ): current value =    40, max value =   100
> ddcutil getvcp 14
VCP code 0x14 (Select color preset           ): 6500 K (0x05), Tolerance: Unspecified (0x00)
> ddcutil getvcp 16
VCP code 0x16 (Video gain: Red               ): current value =   100, max value =   100
> ddcutil getvcp 18
VCP code 0x18 (Video gain: Green             ): current value =   100, max value =   100
> ddcutil getvcp 1a
VCP code 0x1a (Video gain: Blue              ): current value =   100, max value =   100
> ddcutil getvcp 52
VCP code 0x52 (Active control                ): Value: 0x02
> ddcutil getvcp 54
VCP code 0x54 (Performance Preservation      ): mh=0x00, ml=0x01, sh=0x00, sl=0x01
> ddcutil getvcp 60
VCP code 0x60 (Input Source                  ): HDMI-2 (sl=0x12)
> ddcutil getvcp 62
VCP code 0x62 (Audio speaker volume          ): Volume level: 30 (00x1e)
> ddcutil getvcp 6c
VCP code 0x6c (Video black level: Red        ): current value =   512, max value =   100
> ddcutil getvcp 6e
VCP code 0x6e (Video black level: Green      ): current value =   512, max value =   100
> ddcutil getvcp 70
VCP code 0x70 (Video black level: Blue       ): current value =   512, max value =   100
> ddcutil getvcp 72
VCP code 0x72 (Gamma                         ): 0x0078 - Invalid sl value. sl=0x78, sh=0x00
> ddcutil getvcp 86
VCP code 0x86 (Display Scaling               ): No scaling (sl=0x01)
> ddcutil getvcp 87
VCP code 0x87 (Sharpness                     ): current value =     5, max value =    10
> ddcutil getvcp 8d
VCP code 0x8d (Audio mute/Screen blank       ): Unmute the audio (sl=0x02), Invalid value (sh=0x00)
> ddcutil getvcp ac
VCP code 0xac (Horizontal frequency          ): 1 hz
> ddcutil getvcp ae
VCP code 0xae (Vertical frequency            ): 60.00 hz
> ddcutil getvcp b2
VCP code 0xb2 (Flat panel sub-pixel layout   ): Red/Green/Blue vertical stripe (sl=0x01)
> ddcutil getvcp b6
VCP code 0xb6 (Display technology type       ): LCD (active matrix) (sl=0x03)
> ddcutil getvcp c0
VCP code 0xc0 (Display usage time            ): Unsupported feature code
> ddcutil getvcp c6
VCP code 0xc6 (Application enable key        ): 0x005a
> ddcutil getvcp c8
VCP code 0xc8 (Display controller type       ): Mfg: RealTek (sl=0x09), controller number: mh=0x00, ml=0x00, sh=0x00
> ddcutil getvcp ca
VCP code 0xca (OSD/Button Control            ): OSD disabled, button events enabled (sl=0x01), Host control of power unsupported (sh=0x00)
> ddcutil getvcp cc
VCP code 0xcc (OSD Language                  ): Chinese (simplified / Kantai) (sl=0x0d)
> ddcutil getvcp d6
VCP code 0xd6 (Power mode                    ): DPM: On,  DPMS: Off (sl=0x01)
> ddcutil getvcp dc
VCP code 0xdc (Display Mode                  ): Unsupported feature code
> ddcutil getvcp df
VCP code 0xdf (VCP Version                   ): 2.2
> ddcutil getvcp e9
VCP code 0xe9 (Manufacturer Specific         ): mh=0x00, ml=0x02, sh=0x00, sl=0x00
> ddcutil getvcp eb
VCP code 0xeb (Manufacturer Specific         ): Unsupported feature code
> ddcutil getvcp f0
VCP code 0xf0 (Manufacturer Specific         ): Unsupported feature code
> ddcutil getvcp fd
VCP code 0xfd (Manufacturer Specific         ): Unsupported feature code
> ddcutil getvcp ff
VCP code 0xff (Manufacturer Specific         ): Unsupported feature code
> 
```

### 2.3 部分 VCP 说明

此处对一些 VCP 功能进行说明.

+ `VCP 0b` 色温增量

  ```
  > ddcutil getvcp 0b
  VCP code 0x0b (Color temperature increment   ): 100 degree(s) Kelvin
  ```

  此处值为 100 开尔文 (K).

+ `VCP 0c` 色温请求

  ```
  > ddcutil getvcp 0c
  VCP code 0x0c (Color temperature request     ): 3000 + 70 * (feature 0B color temp increment) degree(s) Kelvin
  ```

  公式: 3000 + 70 * 100 K

+ `VCP 10` **亮度**

  ```
  > ddcutil getvcp 10
  VCP code 0x10 (Brightness                    ): current value =    30, max value =   100
  > ddcutil setvcp 10 80
  > ddcutil getvcp 10
  VCP code 0x10 (Brightness                    ): current value =    80, max value =   100
  ```

  这是一个很常用的重要功能.
  对于液晶 (LCD) 显示器来说, 亮度是直接控制背光灯的亮度.

  此处开始时亮度是 30, 然后修改为 80.

+ `VCP 12` 对比度

  ```
  > ddcutil getvcp 12
  VCP code 0x12 (Contrast                      ): current value =    40, max value =   100
  ```

  当前值 40, 最大值 100.

+ `VCP 14` 选择颜色预设

  ```
  > ddcutil getvcp 14
  VCP code 0x14 (Select color preset           ): 6500 K (0x05), Tolerance: Unspecified (0x00)
  ```

  参考之前的说明:

  ```
   Feature: 14 (Select color preset)
      Values:
         01: sRGB
         04: 5000 K
         05: 6500 K
         06: 7500 K
         07: 8200 K
         08: 9300 K
         0a: 11500 K
         0b: User 1
  ```

+ `VCP 16` 视频增益: 红

  ```
  > ddcutil getvcp 16
  VCP code 0x16 (Video gain: Red               ): current value =   100, max value =   100
  ```

+ `VCP 18` 视频增益: 绿

  ```
  > ddcutil getvcp 18
  VCP code 0x18 (Video gain: Green             ): current value =   100, max value =   100
  ```

+ `VCP 1a` 视频增益: 蓝

  ```
  > ddcutil getvcp 1a
  VCP code 0x1a (Video gain: Blue              ): current value =   100, max value =   100
  ```

+ `VCP 52` 活动控制

  ```
  > ddcutil getvcp 52
  VCP code 0x52 (Active control                ): Value: 0x02
  ```

+ `VCP 54` 性能保持

  ```
  > ddcutil getvcp 54
  VCP code 0x54 (Performance Preservation      ): mh=0x00, ml=0x01, sh=0x00, sl=0x01
  ```

+ `VCP 60` 输入源

  ```
  > ddcutil getvcp 60
  VCP code 0x60 (Input Source                  ): HDMI-2 (sl=0x12)
  ```

  参考之前的说明:

  ```
   Feature: 60 (Input Source)
      Values:
         11: HDMI-1
         12: HDMI-2
         0f: DisplayPort-1
  ```

  这个显示器有 3 个输入接口: DP, HDMI-1, HDMI-2,
  目前使用的是 HDMI-2.

+ `VCP 62` **音量**

  ```
  > ddcutil getvcp 62
  VCP code 0x62 (Audio speaker volume          ): Volume level: 30 (00x1e)
  ```

  这个显示器没有内置喇叭, 但是有一个 3.5mm 接口可以插音箱或耳机.
  此处的音量是 30.

+ `VCP 6c` 视频黑级: 红

  ```
  > ddcutil getvcp 6c
  VCP code 0x6c (Video black level: Red        ): current value =   512, max value =   100
  ```

+ `VCP 6e` 视频黑级: 绿

  ```
  > ddcutil getvcp 6e
  VCP code 0x6e (Video black level: Green      ): current value =   512, max value =   100
  ```

+ `VCP 70` 视频黑级: 蓝

  ```
  > ddcutil getvcp 70
  VCP code 0x70 (Video black level: Blue       ): current value =   512, max value =   100
  ```

+ `VCP 72` 伽马

  ```
  > ddcutil getvcp 72
  VCP code 0x72 (Gamma                         ): 0x0078 - Invalid sl value. sl=0x78, sh=0x00
  ```

  参考之前的说明:

  ```
   Feature: 72 (Gamma)
      Specific presets of absolute adjustment supported (0xfb)
      Absolute tolerance: +/- 5% (=0x05)
      Native gamma: 2.20 (0x78)
      Specific presets:  1.80 (0x50), 2.00 (0x64), 2.20 (0x78), 2.40 (0x8c), 2.60 (0xa0)
  ```

+ `VCP 86` 显示缩放

  ```
  > ddcutil getvcp 86
  VCP code 0x86 (Display Scaling               ): No scaling (sl=0x01)
  ```

  参考之前的说明:

  ```
   Feature: 86 (Display Scaling)
      Values:
         01: No scaling
         02: Max image, no aspect ration distortion
         08: Linear expansion (compression) on h and v axes
  ```

  01: 无缩放

  02: 保持比例, 放大到全屏

  08: 拉伸到全屏 (无视画面的原始比例)

+ `VCP 87` 锐度

  ```
  > ddcutil getvcp 87
  VCP code 0x87 (Sharpness                     ): current value =     5, max value =    10
  ```

+ `VCP 8d` 静音

  ```
  > ddcutil getvcp 8d
  VCP code 0x8d (Audio mute/Screen blank       ): Unmute the audio (sl=0x02), Invalid value (sh=0x00)
  ```

  当前没有静音.

+ `VCP ac` 水平扫描频率

  ```
  > ddcutil getvcp ac
  VCP code 0xac (Horizontal frequency          ): 1 hz
  ```

  这个随便看看就好, 用处不大.

+ `VCP ae` 垂直扫描频率

  ```
  > ddcutil getvcp ae
  VCP code 0xae (Vertical frequency            ): 60.00 hz
  ```

  这个就是通常说的显示器刷新率.

+ `VCP b2` 平板子像素布局

  ```
  > ddcutil getvcp b2
  VCP code 0xb2 (Flat panel sub-pixel layout   ): Red/Green/Blue vertical stripe (sl=0x01)
  ```

  RGB 垂直条带.

+ `VCP b6` 显示技术类型

  ```
  > ddcutil getvcp b6
  VCP code 0xb6 (Display technology type       ): LCD (active matrix) (sl=0x03)
  ```

  LCD 表示液晶.

+ `VCP c6` 应用启用键

  ```
  > ddcutil getvcp c6
  VCP code 0xc6 (Application enable key        ): 0x005a
  ```

  (这个干嘛的窝也不懂, 呜 ~ )

+ `VCP c8` 显示控制器类型

  ```
  > ddcutil getvcp c8
  VCP code 0xc8 (Display controller type       ): Mfg: RealTek (sl=0x09), controller number: mh=0x00, ml=0x00, sh=0x00
  ```

  这个应该是显示器用的哪种芯片.

+ `VCP ca` 显示器菜单/按键控制

  ```
  > ddcutil getvcp ca
  VCP code 0xca (OSD/Button Control            ): OSD disabled, button events enabled (sl=0x01), Host control of power unsupported (sh=0x00)
  ```

  参考之前的说明:

  ```
   Feature: CA (OSD/Button Control)
      Values:
         01: OSD disabled, button events enabled
         02: OSD enabled, button events enabled
  ```

+ `VCP cc` 显示器菜单语言

  ```
  > ddcutil getvcp cc
  VCP code 0xcc (OSD Language                  ): Chinese (simplified / Kantai) (sl=0x0d)
  ```

  参考之前的说明:

  ```
   Feature: CC (OSD Language)
      Values:
         01: Chinese (traditional, Hantai)
         02: English
         03: French
         04: German
         05: Italian
         06: Japanese
         07: Korean
         08: Portuguese (Portugal)
         09: Russian
         0a: Spanish
         0b: Swedish
         0c: Turkish
         0d: Chinese (simplified / Kantai)
         0e: Portuguese (Brazil)
         12: Czech
         14: Dutch
         16: Finnish
         17: Greek
         1a: Hungarian
         1e: Polish
         24: Ukranian
  ```

  这个显示器支持的界面语言还挺多的.

+ `VCP d6` 电源模式

  ```
  > ddcutil getvcp d6
  VCP code 0xd6 (Power mode                    ): DPM: On,  DPMS: Off (sl=0x01)
  ```

  参考之前的说明:

  ```
   Feature: D6 (Power mode)
      Values:
         01: DPM: On,  DPMS: Off
         04: DPM: Off, DPMS: Off
         05: Write only value to turn off display
  ```

  这个可用于控制显示器关机.

+ `VCP df` VCP 版本

  ```
  > ddcutil getvcp df
  VCP code 0xdf (VCP Version                   ): 2.2
  ```

  VCP 版本 2.2.

可以看到, 这个显示器支持的功能还是挺多的.


## 3 显示器: HKC T4000 (24 英寸, 2013 年生产)

注意, 这个是 10 年前的显示器, 至今仍然正常工作.

### 3.1 `ddcutil` 检测

```
> ddcutil detect
Display 1
   I2C bus:  /dev/i2c-10
   DRM connector:           card2-HDMI-A-1
   EDID synopsis:
      Mfg id:               HKC - UNK
      Model:                T4000+HDMI
      Product code:         9216  (0x2400)
      Serial number:        0000000000001
      Binary serial number: 0 (0x00000000)
      Manufacture year:     2013,  Week: 33
   VCP version:         2.1
```

成功检测到了显示器, 通过 HDMI 连接.
生产日期 2013 年第 33 周, 支持的 VCP 版本 2.1.

```
> ddcutil capabilities
Model: FALCON
MCCS version: 2.0
Commands:
   Op Code: 01 (VCP Request)
   Op Code: 02 (VCP Response)
   Op Code: 03 (VCP Set)
   Op Code: 07 (Timing Request)
   Op Code: 0C (Save Settings)
   Op Code: 4E (Unrecognized operation code)
   Op Code: F3 (Capabilities Request)
   Op Code: E3 (Capabilities Reply)
VCP Features:
   Feature: 02 (New control value)
   Feature: 04 (Restore factory defaults)
   Feature: 05 (Restore factory brightness/contrast defaults)
   Feature: 08 (Restore color defaults)
   Feature: 0B (Color temperature increment)
   Feature: 0C (Color temperature request)
   Feature: 10 (Brightness)
   Feature: 12 (Contrast)
   Feature: 14 (Select color preset)
      Values:
         01: sRGB
         04: 5000 K
         05: 6500 K
         06: 7500 K
         07: 8200 K
         08: 9300 K
         0a: 11500 K
         0b: User 1
   Feature: 16 (Video gain: Red)
   Feature: 18 (Video gain: Green)
   Feature: 1A (Video gain: Blue)
   Feature: 6C (Video black level: Red)
   Feature: 6E (Video black level: Green)
   Feature: 70 (Video black level: Blue)
   Feature: AC (Horizontal frequency)
   Feature: AE (Vertical frequency)
   Feature: B6 (Display technology type)
   Feature: C0 (Display usage time)
   Feature: C6 (Application enable key)
   Feature: C8 (Display controller type)
   Feature: C9 (Display firmware level)
   Feature: CA (OSD)
   Feature: CC (OSD Language)
      Values:
         00: Reserved value, must be ignored
         02: English
         03: French
         04: German
         05: Italian
         08: Portuguese (Portugal)
         09: Russian
         0a: Spanish
         0d: Chinese (simplified / Kantai)
   Feature: D6 (Power mode)
      Values:
         01: DPM: On,  DPMS: Off
         04: DPM: Off, DPMS: Off
   Feature: DC (Display Mode)
      Values:
         00: Standard/Default mode
         01: Productivity
         02: Mixed
         03: Movie
         04: User defined
   Feature: DF (VCP Version)
   Feature: 60 (Input Source)
      Values:
         01: VGA-1
         03: DVI-1
   Feature: 62 (Audio speaker volume)
   Feature: 8D (Audio Mute)
   Feature: FF (Manufacturer specific feature)
   Feature: 39 (Vertical Convergence M/G)
   Feature: 32 (Vertical Size)
   Feature: 35 (Unrecognized feature)
>
```

显示器型号 `FALCON`, MCCS 版本 2.0.

VCP 和 MCCS 版本都比上一个显示器低, 正常, 毕竟 10 年前的老显示器.
支持的 VCP 功能也较少.

### 3.2 操作记录

```
> ddcutil getvcp 02
VCP code 0x02 (New control value             ): One or more new control values have been saved (0x02)
> ddcutil getvcp 04
Feature 04 (Restore factory defaults) is not readable
> ddcutil getvcp 05
Feature 05 (Restore factory brightness/contrast defaults) is not readable
> ddcutil getvcp 08
Feature 08 (Restore color defaults) is not readable
> ddcutil getvcp 0b
VCP code 0x0b (Color temperature increment   ): 50 degree(s) Kelvin
> ddcutil getvcp 0c
VCP code 0x0c (Color temperature request     ): 3000 + 70 * (feature 0B color temp increment) degree(s) Kelvin
> ddcutil getvcp 10
VCP code 0x10 (Brightness                    ): current value =    70, max value =   100
> ddcutil setvcp 10 30
> ddcutil getvcp 10
VCP code 0x10 (Brightness                    ): current value =    30, max value =   100
> ddcutil setvcp 10 70
> ddcutil getvcp 12
VCP code 0x12 (Contrast                      ): current value =    50, max value =   100
> ddcutil getvcp 14
VCP code 0x14 (Select color preset           ): 5000 K (sl=0x04)
> ddcutil getvcp 16
VCP code 0x16 (Video gain: Red               ): current value =   100, max value =   100
> ddcutil getvcp 18
VCP code 0x18 (Video gain: Green             ): current value =   100, max value =   100
> ddcutil getvcp 1a
VCP code 0x1a (Video gain: Blue              ): current value =   100, max value =   100
> ddcutil getvcp 6c
VCP code 0x6c (Video black level: Red        ): current value =    50, max value =   100
> ddcutil getvcp 6e
VCP code 0x6e (Video black level: Green      ): current value =    50, max value =   100
> ddcutil getvcp 70
VCP code 0x70 (Video black level: Blue       ): current value =    50, max value =   100
> ddcutil getvcp ac
VCP code 0xac (Horizontal frequency          ): 8464 hz
> ddcutil getvcp ae
VCP code 0xae (Vertical frequency            ): 60.00 hz
> ddcutil getvcp b6
VCP code 0xb6 (Display technology type       ): LCD (active matrix) (sl=0x03)
> ddcutil getvcp c0
VCP code 0xc0 (Display usage time            ): Usage time (hours) = 7186 (0x001c12) mh=0xff, ml=0xff, sh=0x1c, sl=0x12
> ddcutil getvcp c6
VCP code 0xc6 (Application enable key        ): 0x006f
> ddcutil getvcp c8
VCP code 0xc8 (Display controller type       ): Mfg: Novatek (sl=0x12), controller number: mh=0xff, ml=0xff, sh=0x00
> ddcutil getvcp c9
VCP code 0xc9 (Display firmware level        ): 2.32
> ddcutil getvcp ca
VCP code 0xca (OSD                           ): OSD Enabled (sl=0x02)
> ddcutil getvcp cc
VCP code 0xcc (OSD Language                  ): Chinese (simplified / Kantai) (sl=0x0d)
> ddcutil getvcp d6
VCP code 0xd6 (Power mode                    ): DPM: On,  DPMS: Off (sl=0x01)
> ddcutil getvcp dc
VCP code 0xdc (Display Mode                  ): Mixed (sl=0x02)
> ddcutil getvcp df
VCP code 0xdf (VCP Version                   ): 2.1
> ddcutil getvcp 60
VCP code 0x60 (Input Source                  ): DVI-1 (sl=0x03)
> ddcutil getvcp 62
VCP code 0x62 (Audio speaker volume          ): current value =    50, max value =   100
> ddcutil getvcp 8d
VCP code 0x8d (Audio Mute                    ): Unmute the audio (sl=0x02)
> ddcutil getvcp ff
VCP code 0xff (Manufacturer Specific         ): mh=0x00, ml=0x01, sh=0x00, sl=0x00
> ddcutil getvcp 39
VCP code 0x39 (Vertical Convergence M/G      ): Unsupported feature code
> ddcutil getvcp 32
VCP code 0x32 (Vertical Size                 ): Unsupported feature code
> ddcutil getvcp 35
VCP code 0x35 (Unknown feature               ): Unsupported feature code
>
```

### 3.3 部分 VCP 说明

上面介绍过的 VCP 功能基本就不再重复了, 只说一些有意思的.

+ `VCP c0` 显示器使用时间 (小时)

  ```
  > ddcutil getvcp c0
  VCP code 0xc0 (Display usage time            ): Usage time (hours) = 7186 (0x001c12) mh=0xff, ml=0xff, sh=0x1c, sl=0x12
  ```

  这个显示器已经使用了 7186 小时 (约 300 天).

+ `VCP c8` 显示控制器类型

  ```
  > ddcutil getvcp c8
  VCP code 0xc8 (Display controller type       ): Mfg: Novatek (sl=0x12), controller number: mh=0xff, ml=0xff, sh=0x00
  ```

+ `VCP c9` 显示器固件版本

  ```
  > ddcutil getvcp c9
  VCP code 0xc9 (Display firmware level        ): 2.32
  ```

  固件版本: 2.32

+ `VCP cc` 显示器菜单语言

  ```
  > ddcutil getvcp cc
  VCP code 0xcc (OSD Language                  ): Chinese (simplified / Kantai) (sl=0x0d)
  ```

  参考之前的说明:

  ```
   Feature: CC (OSD Language)
      Values:
         00: Reserved value, must be ignored
         02: English
         03: French
         04: German
         05: Italian
         08: Portuguese (Portugal)
         09: Russian
         0a: Spanish
         0d: Chinese (simplified / Kantai)
  ```

  这个显示器支持的界面语言就比较少了.

+ `VCP dc` 显示模式

  ```
  > ddcutil getvcp dc
  VCP code 0xdc (Display Mode                  ): Mixed (sl=0x02)
  ```

  参考之前的说明:

  ```
   Feature: DC (Display Mode)
      Values:
         00: Standard/Default mode
         01: Productivity
         02: Mixed
         03: Movie
         04: User defined
  ```

  这个就是显示器预设的一些显示模式,
  比如标准模式, 电影模式, 用户自定义等.

+ `VCP df` VCP 版本

  ```
  > ddcutil getvcp df
  VCP code 0xdf (VCP Version                   ): 2.1
  ```

  VCP 版本 2.1.

+ `VCP 60` 输入源

  ```
  > ddcutil getvcp 60
  VCP code 0x60 (Input Source                  ): DVI-1 (sl=0x03)
  ```

  参考之前的说明:

  ```
   Feature: 60 (Input Source)
      Values:
         01: VGA-1
         03: DVI-1
  ```

  这里显示的明显是错的, 这个显示器实际上有 4 个输入接口:
  DP, HDMI, DVI, VGA.

+ `VCP 62` 音量

  ```
  > ddcutil getvcp 62
  VCP code 0x62 (Audio speaker volume          ): current value =    50, max value =   100
  ```

  这里也有问题, 这个显示器没有内置喇叭, 也没有音频输出接口.
  所以这个音量选项实际上没用.


## 4 (不支持) 小米电视 A43 pro (43 英寸, 2023 年生产)

小米电视怎么样 ?
试一试吧:

```
> ddcutil detect
Invalid display
   I2C bus:  /dev/i2c-10
   DRM connector:           card2-HDMI-A-1
   EDID synopsis:
      Mfg id:               XMD - UNK
      Model:                Mi TV
      Product code:         234  (0x00ea)
      Serial number:        
      Binary serial number: 1 (0x00000001)
      Manufacture year:     2021,  Week: 1
   DDC communication failed. (getvcp of feature x10 returned Error_Info[ENXIO in ddc_write_read_with_retry, causes: ENXIO])
```

使用 HDMI 连接小米电视, 获取到了显示器的基本信息, 但是生产日期是错的.

```
> ddcutil capabilities
Display not found
```

小米电视不支持 DDC/CI, 有点遗憾.


## 5 显示器: (新买不久) (杂牌) (23.6 英寸, 2022 年生产)

这个是便宜的杂牌显示器 (全新只要不到 300 元),
只不过显示效果不太好罢了, 但凑合凑合肯定能用.

23.6 英寸, 1920x1080 分辨率 60Hz 刷新率, 还有内置喇叭,
HDMI 可以一线同时传输画面和声音, 还是比较香的.
别问窝为啥买这么便宜的显示器 (因为穷)

### 5.1 `ddcutil` 检测

```
> ddcutil detect
Display 1
   I2C bus:  /dev/i2c-10
   DRM connector:           card2-HDMI-A-1
   EDID synopsis:
      Mfg id:               GVE - UNK
      Model:                
      Product code:         9491  (0x2513)
      Serial number:        
      Binary serial number: 1 (0x00000001)
      Manufacture year:     2022,  Week: 29
   VCP version:         2.2
```

成功检测到了显示器, 通过 HDMI 连接.
生产日期 2022 年第 29 周, 支持的 VCP 版本 2.2.

型号 (Model) 直接没有 (果然是杂牌显示器)

```
> ddcutil capabilities
Model: RTK
MCCS version: 2.2
Commands:
   Op Code: 01 (VCP Request)
   Op Code: 02 (VCP Response)
   Op Code: 03 (VCP Set)
   Op Code: 07 (Timing Request)
   Op Code: 0C (Save Settings)
   Op Code: E3 (Capabilities Reply)
   Op Code: F3 (Capabilities Request)
VCP Features:
   Feature: 02 (New control value)
   Feature: 04 (Restore factory defaults)
   Feature: 05 (Restore factory brightness/contrast defaults)
   Feature: 06 (Restore factory geometry defaults)
   Feature: 08 (Restore color defaults)
   Feature: 0B (Color temperature increment)
   Feature: 0C (Color temperature request)
   Feature: 10 (Brightness)
   Feature: 12 (Contrast)
   Feature: 14 (Select color preset)
      Values:
         01: sRGB
         02: Display Native
         04: 5000 K
         05: 6500 K
         06: 7500 K
         08: 9300 K
         0b: User 1
   Feature: 16 (Video gain: Red)
   Feature: 18 (Video gain: Green)
   Feature: 1A (Video gain: Blue)
   Feature: 52 (Active control)
   Feature: 60 (Input Source)
      Values:
         01: VGA-1
         03: DVI-1
         04: DVI-2
         0f: DisplayPort-1
         10: DisplayPort-2
         11: HDMI-1
         12: HDMI-2
   Feature: 87 (Sharpness)
   Feature: AC (Horizontal frequency)
   Feature: AE (Vertical frequency)
   Feature: B2 (Flat panel sub-pixel layout)
   Feature: B6 (Display technology type)
   Feature: C6 (Application enable key)
   Feature: C8 (Display controller type)
   Feature: CA (OSD/Button Control)
   Feature: CC (OSD Language)
      Values:
         01: Chinese (traditional, Hantai)
         02: English
         03: French
         04: German
         06: Japanese
         0a: Spanish
         0d: Chinese (simplified / Kantai)
   Feature: D6 (Power mode)
      Values:
         01: DPM: On,  DPMS: Off
         04: DPM: Off, DPMS: Off
         05: Write only value to turn off display
   Feature: DF (VCP Version)
   Feature: FD (Manufacturer specific feature)
   Feature: FF (Manufacturer specific feature)
> 
```

显示器型号 `RTK`, MCCS 版本 2.2.

这个显示器支持的 VCP 功能也比较少.

### 5.2 操作记录

```
> ddcutil getvcp 02
VCP code 0x02 (New control value             ): No new control values (0x01)
> ddcutil getvcp 04
Feature 04 (Restore factory defaults) is not readable
> ddcutil getvcp 05
Feature 05 (Restore factory brightness/contrast defaults) is not readable
> ddcutil getvcp 06
Feature 06 (Restore factory geometry defaults) is not readable
> ddcutil getvcp 08
Feature 08 (Restore color defaults) is not readable
> ddcutil getvcp 0b
VCP code 0x0b (Color temperature increment   ): 100 degree(s) Kelvin
> ddcutil getvcp 0c
VCP code 0x0c (Color temperature request     ): 3000 + 35 * (feature 0B color temp increment) degree(s) Kelvin
> ddcutil getvcp 10
VCP code 0x10 (Brightness                    ): current value =    41, max value =   100
> ddcutil setvcp 10 10
> ddcutil setvcp 10 0
> ddcutil getvcp 10
VCP code 0x10 (Brightness                    ): current value =     0, max value =   100
> ddcutil setvcp 10 100
> ddcutil getvcp 10
VCP code 0x10 (Brightness                    ): current value =   100, max value =   100
> ddcutil setvcp 10 40
> ddcutil getvcp 12
VCP code 0x12 (Contrast                      ): current value =    50, max value =   100
> ddcutil getvcp 14
VCP code 0x14 (Select color preset           ): 5000 K (0x04), Tolerance: Unspecified (0x00)
> ddcutil getvcp 16
VCP code 0x16 (Video gain: Red               ): current value =    50, max value =   100
> ddcutil getvcp 18
VCP code 0x18 (Video gain: Green             ): current value =    50, max value =   100
> ddcutil getvcp 1a
VCP code 0x1a (Video gain: Blue              ): current value =    50, max value =   100
> ddcutil getvcp 52
VCP code 0x52 (Active control                ): Value: 0x02
> ddcutil getvcp 60
VCP code 0x60 (Input Source                  ): HDMI-1 (sl=0x11)
> ddcutil getvcp 87
VCP code 0x87 (Sharpness                     ): current value =     2, max value =     4
> ddcutil getvcp ac
VCP code 0xac (Horizontal frequency          ): 2124 hz
> ddcutil getvcp ae
VCP code 0xae (Vertical frequency            ): 75.10 hz
> ddcutil getvcp b2
VCP code 0xb2 (Flat panel sub-pixel layout   ): Red/Green/Blue vertical stripe (sl=0x01)
> ddcutil getvcp b6
VCP code 0xb6 (Display technology type       ): LCD (active matrix) (sl=0x03)
> ddcutil getvcp c6
VCP code 0xc6 (Application enable key        ): 0x005a
> ddcutil getvcp c8
VCP code 0xc8 (Display controller type       ): Mfg: RealTek (sl=0x09), controller number: mh=0x00, ml=0x00, sh=0x00
> ddcutil getvcp ca
VCP code 0xca (OSD/Button Control            ): OSD disabled, button events enabled (sl=0x01), Host control of power unsupported (sh=0x00)
> ddcutil getvcp cc
VCP code 0xcc (OSD Language                  ): Spanish (sl=0x0a)
> ddcutil getvcp d6
VCP code 0xd6 (Power mode                    ): DPM: On,  DPMS: Off (sl=0x01)
> ddcutil getvcp df
VCP code 0xdf (VCP Version                   ): 2.2
> ddcutil getvcp fd
VCP code 0xfd (Manufacturer Specific         ): Unsupported feature code
> ddcutil getvcp ff
VCP code 0xff (Manufacturer Specific         ): Unsupported feature code
> 
```

### 5.3 部分 VCP 说明

只说一些有意思的 VCP 功能.

+ `VCP 60` 输入源

  ```
  > ddcutil getvcp 60
  VCP code 0x60 (Input Source                  ): HDMI-1 (sl=0x11)
  ```

  参考之前的说明:

  ```
   Feature: 60 (Input Source)
      Values:
         01: VGA-1
         03: DVI-1
         04: DVI-2
         0f: DisplayPort-1
         10: DisplayPort-2
         11: HDMI-1
         12: HDMI-2
  ```

  这里也有问题, 这个显示器只有 2 个输入接口: HDMI, VGA.
  这里明显虚标了 (果然是杂牌显示器)

+ `VCP c8` 显示控制器类型

  ```
  > ddcutil getvcp c8
  VCP code 0xc8 (Display controller type       ): Mfg: RealTek (sl=0x09), controller number: mh=0x00, ml=0x00, sh=0x00
  ```

+ `VCP cc` 显示器菜单语言

  ```
  > ddcutil getvcp cc
  VCP code 0xcc (OSD Language                  ): Spanish (sl=0x0a)
  ```

  参考之前的说明:

  ```
   Feature: CC (OSD Language)
      Values:
         01: Chinese (traditional, Hantai)
         02: English
         03: French
         04: German
         06: Japanese
         0a: Spanish
         0d: Chinese (simplified / Kantai)
  ```

  这里也是错的, 实际显示器菜单语言是简体中文.
  (果然是杂牌显示器)

另外还有个问题, 这个显示器有个内置的喇叭,
可以通过 HDMI 传输声音, 但是却没有音量控制的 VCP 功能.

可以看到, 便宜的杂牌显示器的 DDC/CI 功能问题还是比较多的.


## 6 总结与展望

大部分显示器都支持 DDC/CI 功能, 包括 10 年前的老显示器,
也包括便宜的杂牌显示器.
好的显示器对 DDC/CI 的支持更好一些, 功能也更多一些.
便宜的杂牌显示器问题就比较多了, 但是常用功能还是有的,
基本不影响使用.

有了 DDC/CI, 就可以在此基础上做一些方便的小工具了.
比如显示器按键的手感太差, 按着手疼,
那么可以把常用功能做成软件, 直接用软件调节显示器参数.

也可以做一个自动调节亮度的功能, 可以根据时间进行调节,
比如白天把亮度调高, 晚上把亮度调低.
甚至可以外接一个环境光传感器, 根据光照情况自动调节.

还有很多可能, 上面只是两个小小的栗子.


----

本文使用 CC-BY-SA 4.0 许可发布.
