# 组装 (DIY) 一台显示器 (4K 屏支持 4 画面分屏 PBP 1080p x4)

家里的 PC 主机比较多, 如果同时开机, 显示器就不够用了.
因为穷, 窝租住的房间又很小, 放不下很多显示器.
所以, 窝希望买一台支持 **分屏** 功能的显示器.

最好是 **4K** 分辨率 (3840x2160) 的屏幕,
然后 **4 分屏** (有 4 个 DP 或 HDMI 输入接口),
同时显示 4 路 1080p (1920x1080) 画面.
这样, 一个 4K 显示器还能同时充当 4 个 1080p 显示器 !!
无论 成本, 体积, 耗电 等方面, 这都是极好的 !

然而, 当窝打开 万能的淘宝, 找了半天, 始终找不到合适的显示器.
大部分 4K 显示器只有 3 个 (或更少) 接口, 最多只能支持 2 分屏 (同时显示 2 路画面), 排除.
还有就是某 43 英寸显示器, 商品介绍里面明确说明有 4 个接口, 并支持 4 分屏功能,
但是不仅价格太贵了, 体积也太大了, 排除.
还有就是所谓 "分屏器", 比如 4 个 HDMI 输入, 1 个 HDMI 输出接显示器,
但是这种盒子太贵了卖好几百, 并且窝不想使用外接形式, 排除.

然后又在网上搜索半天, 并且问了多个 AI (聊天大语言模型), 都得不到结果.
哎, 又遇到了 **知识的荒漠**: 有些知识, 你很确定在地球上肯定存在, 但你就是得不到它 !
(这就很难受, 都气哭了)

没办法, 没有合适的商品, 那只能自己动手了: 购买配件, **组装一台显示器** !
经过一顿努力, 终于成功组装出来一台支持 4 分屏的低成本 4K 显示器.
就让这篇文章, 成为知识沙漠里面的一小块绿洲吧.

(哼, 还不是因为老公霸占了显示器, 导致窝没有显示器用, 只能再弄一个 ~ )

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 70 号作品. )

----

相关文章:

+ 《显示器的隐藏功能: 显示数据通道命令接口 (DDC/CI)》

  TODO

+ 《香橙派 HDMI 显示器 DDC/CI 踩坑记录》

  TODO

+ 《低功耗低成本 PC (可更换内存条) 推荐 (笔记本, 小主机)》

  TODO

+ 《流浪 Linux: 外置 USB SSD 安装 ArchLinux》

  TODO


## 目录

+ 1 购买配件

+ 2 收货测试

+ 3 组装并测试

  - 3.1 全屏 4K 测试
  - 3.2 分屏 1080p x4 测试
  - 3.3 DDC/CI 功能测试

+ 4 总结与展望


## 1 购买配件

组装一台显示器只需要 4 个配件:
(1) (液晶) **面板** (2) **驱动** (主控) **板** (3) 外壳 (4) 电源.

怎么样, 是不是看起来很简单 ?

![淘宝截图 (1)](./图/1-c-1.png)

![淘宝截图 (2)](./图/1-c-2.png)

组装显示器配件清单 (共 887 元, 价格仅供参考):

+ 液晶面板: 京东方 MV270QUM-N60 (27 英寸 4K 60Hz)

+ 驱动板: JRY-W9UHD-NV2

+ 显示器塑料外壳 (27 英寸)

+ 电源: 12V 5A (DC 5.5/2.5mm 接口)

显示器功率: 约 21W ~ 50W

----

关于屏幕面板, 推荐在 屏库 网站上找, 比如:
<https://www.panelook.cn/MV270QUM-N60_BOE_27.0_LCM_overview_cn_52883.html>

![图片来源: panelook.cn 截图](./图/1-p-1.png)

(图片来源: `panelook.cn` 截图)

----

关于驱动板的挑选, 需要有 4 个 DP 或 HDMI 输入接口 (3 个或更少肯定不行).
另外下单购买前, **一定要明确去问卖家, 这个驱动板是否支持 4 画面分屏 !**
不要你觉得驱动板可能支持, 那样容易翻车.

还要把面板的具体 **型号** 告诉驱动板的卖家, 这样卖家可以对驱动板进行相应调整,
拿回来接上就能用.


## 2 收货测试

收到货后, 在组装起来之前, 先测试一下东西是不是好的, 能否正常工作.

![驱动板 (1)](./图/2-c-1.png)

驱动板 (主控板) 以及 按键板 (5 个按键, 以及电源指示灯),
屏幕背光供电线 (细), 面板信号线 (粗) (eDP).

![驱动板 (2)](./图/2-c-2.png)

驱动板正面.
可以看到, 驱动板的结构还是比较简单的:
左侧是供电部分的电路, 左侧下边是 12V DC 供电输入插座,
左侧上边是背光供电输出 (左) 插座, 按键板插座.
中间是主控芯片 (在黑色散热鳍片下面), 下边是 4 个信号输入接口,
上边是连接面板的 eDP 信号输出接口.

![驱动板 (3)](./图/2-c-3.png)

驱动板背面.

![驱动板 (4)](./图/2-c-4.png)

驱动板接口, 从左至右依次是:
12V 电源输入插座 (DC 5.5/2.5mm), HDMI 信号输入插座 (x3),
DP 信号输入插座 (x1), 3.5mm 音频插座.

----

![面板 (1)](./图/2-p-1.png)

液晶面板 (以及 显示器塑料外壳) 的包装箱.
包装是很好的, 有多层减震包装材料, 并且快递发了顺丰,
能够很大程度上避免运输过程中的破损.
因为面板和外壳是在同一家店购买的, 收到货时面板已经安装在了外壳上.

![面板 (2)](./图/2-p-2.png)

显示器外壳的两半.

![面板 (3)](./图/2-p-3.png)

这个是外壳后盖 (内部).
中间是安装显示器支架的位置, 中间下边有很多塑料柱 (螺丝孔) 的位置是安装驱动板的.
右侧下边是按键板 (5 个按键, 以及电源指示灯).

![面板 (4)](./图/2-p-4.png)

这个是 液晶面板 (后面), 已经安装到了前外壳上.
上边中间 (偏右) 是面板的 eDP 信号线接口, 右侧是背光供电线的接口.

----

好了, 驱动板和面板都有了, 下面接上线测试一下 !

![接线](./图/2-s-1.png)

如图, 驱动板和面板之间需要连接 2 根线: eDP 信号线 (上边), 背光供电线 (下边).

同时驱动板要接入输入信号 (此处为 HDMI), 12V DC 电源 (右边).

(啊, 然后这里翻车了, 屏幕点不亮 (捂脸) 所以这里没有对应的照片.
正常情况下, 应该是先测试好, 再开始组装的. )


## 3 组装并测试

简单的拧上几颗螺丝, 扣上卡扣, 显示器就安装好了.
组装过程还是挺容易的, 具体可以问配件卖家要安装教程.

![显示器接口](./图/3-i-1.png)

这是组装好的显示器接口部分.

哎, 百密一疏, 万万没想到, 之前的 **电源** 是坏的 ! 所以导致了翻车, 屏幕点不亮.
后来更换了新的 12V 5A 电源之后, 屏幕就顺利点亮啦 ~

### 3.1 全屏 4K 测试

接上 PC 主机, 首先作为一个普通的 4K 显示器进行测试.

![屏幕 (1)](./图/31-t-1.png)

主机成功识别显示器, 并能设置 3840x2160 分辨率和 60Hz 刷新率.

![屏幕 (2)](./图/31-t-2.png)

嗯, 用这台显示器, 来写关于这台显示器的文章.

----

功耗测试.

测试方法: 功率插座, 对输入显示器的总电源功率进行测量.

+ 待机功率 (显示器不显示画面, 休眠模式): 1.6W

+ 满载功率 (4K 60Hz, 亮度 100): 49.5W

+ 轻载功率 1 (4K 60Hz, 亮度 50): 37.2W

+ 轻载功率 2 (4K 60Hz, 亮度 0): 20.6W

我们发现, 亮度和显示器的耗电有很大关系, 调低亮度可以省电 !


### 3.2 分屏 1080p x4 测试

接下来, 就是激动人心的 4 分屏测试啦 ~

![分屏测试 (1)](./图/32-t-1.png)

同时显示 4 路 1080p 60Hz (1920x1080) 画面.

![分屏测试 (1)](./图/32-t-2.png)

这是对应的显示器菜单设置.

### 3.3 DDC/CI 功能测试

详见文章: 《显示器的隐藏功能: 显示数据通道命令接口 (DDC/CI)》

+ `ddcutil detect`

```sh
> ddcutil detect
Display 1
   I2C bus:  /dev/i2c-0
   DRM connector:           card1-HDMI-A-1
   EDID synopsis:
      Mfg id:               IPS - IPS, Inc.   {Intellectual Property Solutions, Inc.}
      Model:                T270LG
      Product code:         9984  (0x2700)
      Serial number:        
      Binary serial number: 1 (0x00000001)
      Manufacture year:     2021,  Week: 20
   VCP version:         2.1
```

+ `ddcutil capabilities`

```sh
> ddcutil capabilities
Model: Not specified
MCCS version: 2.1
VCP Features:
   Feature: 02 (New control value)
   Feature: 04 (Restore factory defaults)
   Feature: 05 (Restore factory brightness/contrast defaults)
   Feature: 08 (Restore color defaults)
   Feature: 10 (Brightness)
   Feature: 12 (Contrast)
   Feature: 14 (Select color preset)
      Values:
         05: 6500 K
         08: 9300 K
         0b: User 1
         0c: User 2
   Feature: 16 (Video gain: Red)
   Feature: 18 (Video gain: Green)
   Feature: 1A (Video gain: Blue)
   Feature: 52 (Active control)
   Feature: 60 (Input Source)
      Values:
         11: HDMI-1
         12: HDMI-2
         0f: DisplayPort-1
   Feature: AA (Screen Orientation)
      Values:
         01: 0 degrees
         02: 90 degrees
   Feature: AC (Horizontal frequency)
   Feature: AE (Vertical frequency)
   Feature: B2 (Flat panel sub-pixel layout)
   Feature: B6 (Display technology type)
   Feature: C6 (Application enable key)
   Feature: C8 (Display controller type)
   Feature: C9 (Display firmware level)
   Feature: D6 (Power mode)
      Values:
         01: DPM: On,  DPMS: Off
         04: DPM: Off, DPMS: Off
         05: Write only value to turn off display
   Feature: DC (Display Mode)
      Values:
         00: Standard/Default mode
         02: Mixed
         03: Movie
         05: Games
   Feature: DF (VCP Version)
   Feature: FD (Manufacturer specific feature)
```

+ `ddcutil vcpinfo all`

```sh
> ddcutil vcpinfo all
VCP code 01: Degauss
   Causes a CRT to perform a degauss cycle
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Write Only, Non-Continuous (write-only)
VCP code 02: New control value
   Indicates that a display user control (other than power) has been used to change and save (or autosave) a new value.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Non-Continuous (complex)
VCP code 03: Soft controls
   Allows display controls to be used as soft keys
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Non-Continuous (simple)
VCP code 04: Restore factory defaults
   Restore all factory presets including brightness/contrast, geometry, color, and TV defaults.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Write Only, Non-Continuous (write-only)
VCP code 05: Restore factory brightness/contrast defaults
   Restore factory defaults for brightness and contrast
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Write Only, Non-Continuous (write-only)
VCP code 06: Restore factory geometry defaults
   Restore factory defaults for geometry adjustments
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Write Only, Non-Continuous (write-only)
VCP code 08: Restore color defaults
   Restore factory defaults for color settings.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Write Only, Non-Continuous (write-only)
VCP code 0A: Restore factory TV defaults
   Restore factory defaults for TV functions.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: TV
   Attributes: Write Only, Non-Continuous (write-only)
VCP code 0B: Color temperature increment
   Color temperature increment used by feature 0Ch Color Temperature Request
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Read Only, Non-Continuous (complex)
VCP code 0C: Color temperature request
   Specifies a color temperature (degrees Kelvin)
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Read Write, Continuous (complex)
VCP code 0E: Clock
   Increase/decrease the sampling clock frequency.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Continuous (normal)
VCP code 10: Brightness
   Increase/decrease the brightness of the image.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 11: Flesh tone enhancement
   Select contrast enhancement algorithm respecting flesh tone region
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Read Write, Non-Continuous (complex)
VCP code 12: Contrast
   Increase/decrease the contrast of the image.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 13: Backlight control
   Increase/decrease the specified backlight control value
   MCCS versions: 2.1, 3.0
   ddcutil feature subsets: PROFILE, COLOR
   Attributes (v2.1): Read Write, Continuous (complex)
   Attributes (v3.0): Read Write, Continuous (complex)
   Attributes (v2.2): Deprecated, 
VCP code 14: Select color preset
   Select a specified color temperature
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes (v2.0): Read Write, Non-Continuous (simple)
   Attributes (v2.1): Read Write, Non-Continuous (simple)
   Attributes (v3.0): Read Write, Non-Continuous (complex)
   Attributes (v2.2): Read Write, Non-Continuous (complex)
VCP code 16: Video gain: Red
   Increase/decrease the luminesence of red pixels
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 17: User color vision compensation
   Increase/decrease the degree of compensation
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 18: Video gain: Green
   Increase/decrease the luminesence of green pixels
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 1A: Video gain: Blue
   Increase/decrease the luminesence of blue pixels
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 1C: Focus
   Increase/decrease the focus of the image
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Continuous (normal)
VCP code 1E: Auto setup
   Perform autosetup function (H/V position, clock, clock phase, A/D converter, etc.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Non-Continuous (simple)
VCP code 1F: Auto color setup
   Perform color autosetup function (R/G/B gain and offset, A/D setup, etc. 
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Read Write, Non-Continuous (simple)
VCP code 20: Horizontal Position (Phase)
   Increasing (decreasing) this value moves the image toward the right (left) of the display.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 22: Horizontal Size
   Increase/decrease the width of the image.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 24: Horizontal Pincushion
   Increasing (decreasing) this value causes the right and left sides of the image to become more (less) convex.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 26: Horizontal Pincushion Balance
   Increasing (decreasing) this value moves the center section of the image toward the right (left) side of the display.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 28: Horizontal Convergence R/B
   Increasing (decreasing) this value shifts the red pixels to the right (left) and the blue pixels left (right) across the image with respect to the green pixels.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 29: Horizontal Convergence M/G
   Increasing (decreasing) this value shifts the magenta pixels to the right (left) and the green pixels left (right) across the image with respect to the magenta (sic) pixels.
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 2A: Horizontal Linearity
   Increase/decrease the density of pixels in the image center.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 2C: Horizontal Linearity Balance
   Increasing (decreasing) this value shifts the density of pixels from the left (right) side to the right (left) side of the image.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 2E: Gray scale expansion
   Gray Scale Expansion
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Read Write, Non-Continuous (complex)
VCP code 30: Vertical Position (Phase)
   Increasing (decreasing) this value moves the image toward the top (bottom) edge of the display.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 32: Vertical Size
   Increase/decreasing the height of the image.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 34: Vertical Pincushion
   Increasing (decreasing) this value will cause the top and bottom edges of the image to become more (less) convex.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 36: Vertical Pincushion Balance
   Increasing (decreasing) this value will move the center section of the image toward the top (bottom) edge of the display.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 38: Vertical Convergence R/B
   Increasing (decreasing) this value shifts the red pixels up (down) across the image and the blue pixels down (up) across the image with respect to the green pixels.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 39: Vertical Convergence M/G
   Increasing (decreasing) this value shifts the magenta pixels up (down) across the image and the green pixels down (up) across the image with respect to the magenta (sic) pixels.
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 3A: Vertical Linearity
   Increase/decease the density of scan lines in the image center.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 3C: Vertical Linearity Balance
   Increase/decrease the density of scan lines in the image center.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 3E: Clock phase
   Increase/decrease the sampling clock phase shift
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Continuous (normal)
VCP code 40: Horizontal Parallelogram
   Increasing (decreasing) this value shifts the top section of the image to the right (left) with respect to the bottom section of the image.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 41: Vertical Parallelogram
   Increasing (decreasing) this value shifts the top section of the image to the right (left) with respect to the bottom section of the image. (sic)
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 42: Horizontal Keystone
   Increasing (decreasing) this value will increase (decrease) the ratio between the horizontal size at the top of the image and the horizontal size at the bottom of the image.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 43: Vertical Keystone
   Increasing (decreasing) this value will increase (decrease) the ratio between the vertical size at the left of the image and the vertical size at the right of the image.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 44: Rotation
   Increasing (decreasing) this value rotates the image (counter) clockwise around the center point of the screen.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 46: Top Corner Flare
   Increase/decrease the distance between the left and right sides at the top of the image.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 48: Top Corner Hook
   Increasing (decreasing) this value moves the top of the image to the right (left).
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 4A: Bottom Corner Flare
   Increase/decrease the distance between the left and right sides at the bottom of the image.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 4C: Bottom Corner Hook
   Increasing (decreasing) this value moves the bottom end of the image to the right (left).
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 52: Active control
   Read id of one feature that has changed, 0x00 indicates no more
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Only, Non-Continuous (complex)
VCP code 54: Performance Preservation
   Controls features aimed at preserving display performance
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Non-Continuous (complex)
VCP code 56: Horizontal Moire
   Increase/decrease horizontal moire cancellation.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Continuous (normal)
VCP code 58: Vertical Moire
   Increase/decrease vertical moire cancellation.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Continuous (normal)
VCP code 59: 6 axis saturation: Red
   Increase/decrease red saturation
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 5A: 6 axis saturation: Yellow
   Increase/decrease yellow saturation
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 5B: 6 axis saturation: Green
   Increase/decrease green saturation
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 5C: 6 axis saturation: Cyan
   Increase/decrease cyan saturation
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 5D: 6 axis saturation: Blue
   Increase/decrease blue saturation
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 5E: 6 axis saturation: Magenta
   Increase/decrease magenta saturation
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 60: Input Source
   Selects active video source
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes (v2.0): Read Write, Non-Continuous (simple)
   Attributes (v2.1): Read Write, Non-Continuous (simple)
   Attributes (v3.0): Read Write, Table (normal)
   Attributes (v2.2): Read Write, Non-Continuous (simple)
VCP code 62: Audio speaker volume
   Adjusts speaker volume
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: AUDIO
   Attributes (v2.0): Read Write, Continuous (normal)
   Attributes (v2.1): Read Write, Continuous (normal)
   Attributes (v3.0): Read Write, Non-Continuous with continuous subrange
   Attributes (v2.2): Read Write, Non-Continuous with continuous subrange
VCP code 63: Speaker Select
   Selects a group of speakers
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: AUDIO
   Attributes: Read Write, Non-Continuous (simple)
VCP code 64: Audio: Microphone Volume
   Increase/decrease microphone gain
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: AUDIO
   Attributes: Read Write, Continuous (normal)
VCP code 66: Ambient light sensor
   Enable/Disable ambient light sensor
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Non-Continuous (simple)
VCP code 6B: Backlight Level: White
   Increase/decrease the white backlight level
   MCCS versions: 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 6C: Video black level: Red
   Increase/decrease the black level of red pixels
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 6D: Backlight Level: Red
   Increase/decrease the red backlight level
   MCCS versions: 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 6E: Video black level: Green
   Increase/decrease the black level of green pixels
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 6F: Backlight Level: Green
   Increase/decrease the green backlight level
   MCCS versions: 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 70: Video black level: Blue
   Increase/decrease the black level of blue pixels
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 71: Backlight Level: Blue
   Increase/decrease the blue backlight level
   MCCS versions: 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 72: Gamma
   Select relative or absolute gamma
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Read Write, Non-Continuous (complex)
VCP code 73: LUT Size
   Provides the size (number of entries and number of bits/entry) for the Red, Green, and Blue LUT in the display.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: LUT
   Attributes: Read Only, Table (normal)
VCP code 74: Single point LUT operation
   Writes a single point within the display's LUT, reads a single point from the LUT
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: LUT
   Attributes: Read Write, Table (normal)
VCP code 75: Block LUT operation
   Load (read) multiple values into (from) the display's LUT
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: LUT
   Attributes: Read Write, Table (normal)
VCP code 76: Remote Procedure Call
   Initiates a routine resident in the display
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: LUT
   Attributes: Write Only, Table (write-only)
VCP code 78: Display Identification Operation
   Causes a selected 128 byte block of Display Identification Data (EDID or Display ID) to be read
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes (v2.1): Read Only, Table (normal)
   Attributes (v3.0): Read Only, Table (normal)
   Attributes (v2.2): Read Only, Table (normal)
VCP code 7A: Adjust Focal Plane
   Increase/decrease the distance to the focal plane of the image
   MCCS versions: 2.0, 2.1
   ddcutil feature subsets: 
   Attributes (v2.0): Read Write, Continuous (normal)
   Attributes (v2.1): Read Write, Continuous (normal)
   Attributes (v3.0): Deprecated, 
   Attributes (v2.2): Deprecated, 
VCP code 7C: Adjust Zoom
   Increase/decrease the distance to the zoom function of the projection lens (optics)
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Continuous (normal)
VCP code 7E: Trapezoid
   Increase/decrease the trapezoid distortion in the image
   MCCS versions: 2.0, 2.1
   ddcutil feature subsets: CRT
   Attributes (v2.0): Read Write, Continuous (normal)
   Attributes (v2.1): Read Write, Continuous (normal)
   Attributes (v3.0): Deprecated, 
   Attributes (v2.2): Deprecated, 
VCP code 80: Keystone
   Increase/decrease the keystone distortion in the image.
   MCCS versions: 2.0
   ddcutil feature subsets: CRT
   Attributes (v2.0): Read Write, Continuous (normal)
   Attributes (v2.1): Deprecated, 
   Attributes (v3.0): Deprecated, 
   Attributes (v2.2): Deprecated, 
VCP code 82: Horizontal Mirror (Flip)
   Flip picture horizontally
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes (v2.0): Write Only, Non-Continuous (write-only)
   Attributes (v2.1): Read Write, Non-Continuous (simple)
   Attributes (v3.0): Read Write, Non-Continuous (simple)
   Attributes (v2.2): Read Write, Non-Continuous (simple)
VCP code 84: Vertical Mirror (Flip)
   Flip picture vertically
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes (v2.0): Write Only, Non-Continuous (write-only)
   Attributes (v2.1): Read Write, Non-Continuous (simple)
   Attributes (v3.0): Read Write, Non-Continuous (simple)
   Attributes (v2.2): Read Write, Non-Continuous (simple)
VCP code 86: Display Scaling
   Control the scaling (input vs output) of the display
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Non-Continuous (simple)
VCP code 87: Sharpness
   Selects one of a range of algorithms. Increasing (decreasing) the value must increase (decrease) the edge sharpness of image features.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes (v2.0): Read Write, Non-Continuous (simple)
   Attributes (v2.1): Read Write, Continuous (normal)
   Attributes (v3.0): Read Write, Continuous (normal)
   Attributes (v2.2): Read Write, Continuous (normal)
VCP code 88: Velocity Scan Modulation
   Increase (decrease) the velocity modulation of the horizontal scan as a function of the change in luminescence level
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Continuous (normal)
VCP code 8A: Color Saturation
   Increase/decrease the amplitude of the color difference components of the video signal
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR, TV
   Attributes: Read Write, Continuous (normal)
VCP code 8B: TV Channel Up/Down
   Increment (1) or decrement (2) television channel
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: TV
   Attributes: Write Only, Non-Continuous (write-only)
VCP code 8C: TV Sharpness
   Increase/decrease the amplitude of the high frequency components  of the video signal
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: TV
   Attributes: Read Write, Continuous (normal)
VCP code 8D: Audio mute/Screen blank
   Mute/unmute audio, and (v2.2) screen blank
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: TV, AUDIO
   Attributes (v2.0): Read Write, Non-Continuous (simple)
   Attributes (v2.1): Read Write, Non-Continuous (simple)
   Attributes (v3.0): Read Write, Non-Continuous (simple)
   Attributes (v2.2): Read Write, Non-Continuous (complex)
VCP code 8E: TV Contrast
   Increase/decrease the ratio between blacks and whites in the image
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: TV
   Attributes: Read Write, Continuous (normal)
VCP code 8F: Audio Treble
   Emphasize/de-emphasize high frequency audio
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: AUDIO
   Attributes (v2.0): Read Write, Continuous (normal)
   Attributes (v2.1): Read Write, Continuous (normal)
   Attributes (v3.0): Read Write, Non-Continuous with continuous subrange
   Attributes (v2.2): Read Write, Non-Continuous with continuous subrange
VCP code 90: Hue
   Increase/decrease the wavelength of the color component of the video signal. AKA tint.  Applies to currently active interface
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR, TV
   Attributes: Read Write, Continuous (normal)
VCP code 91: Audio Bass
   Emphasize/de-emphasize low frequency audio
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: AUDIO
   Attributes (v2.0): Read Write, Continuous (normal)
   Attributes (v2.1): Read Write, Continuous (normal)
   Attributes (v3.0): Read Write, Non-Continuous with continuous subrange
   Attributes (v2.2): Read Write, Non-Continuous with continuous subrange
VCP code 92: TV Black level/Luminesence
   Increase/decrease the black level of the video
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: TV
   Attributes: Read Write, Continuous (normal)
VCP code 93: Audio Balance L/R
   Controls left/right audio balance
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: AUDIO
   Attributes (v2.0): Read Write, Continuous (normal)
   Attributes (v2.1): Read Write, Continuous (normal)
   Attributes (v3.0): Read Write, Non-Continuous with continuous subrange
   Attributes (v2.2): Read Write, Non-Continuous with continuous subrange
VCP code 94: Audio Processor Mode
   Select audio mode
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: TV, AUDIO
   Attributes: Read Write, Non-Continuous (simple)
VCP code 95: Window Position(TL_X)
   Top left X pixel of an area of the image
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: WINDOW
   Attributes: Read Write, Continuous (normal)
VCP code 96: Window Position(TL_Y)
   Top left Y pixel of an area of the image
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: WINDOW
   Attributes: Read Write, Continuous (normal)
VCP code 97: Window Position(BR_X)
   Bottom right X pixel of an area of the image
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: WINDOW
   Attributes: Read Write, Continuous (normal)
VCP code 98: Window Position(BR_Y)
   Bottom right Y pixel of an area of the image
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: WINDOW
   Attributes: Read Write, Continuous (normal)
VCP code 99: Window control on/off
   Enables the brightness and color within a window to be different from the desktop.
   MCCS versions: 2.0, 2.1
   ddcutil feature subsets: WINDOW
   Attributes (v2.0): Read Write, Non-Continuous (simple)
   Attributes (v2.1): Read Write, Non-Continuous (simple)
   Attributes (v3.0): Deprecated, 
   Attributes (v2.2): Deprecated, 
VCP code 9A: Window background
   Changes the contrast ratio between the area of the window and the rest of the desktop
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: WINDOW
   Attributes: Read Write, Continuous (normal)
VCP code 9B: 6 axis hue control: Red
   Decrease shifts toward magenta, increase shifts toward yellow
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 9C: 6 axis hue control: Yellow
   Decrease shifts toward green, increase shifts toward red
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 9D: 6 axis hue control: Green
   Decrease shifts toward yellow, increase shifts toward cyan
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 9E: 6 axis hue control: Cyan
   Decrease shifts toward green, increase shifts toward blue
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code 9F: 6 axis hue control: Blue
   Decrease shifts toward cyan, increase shifts toward magenta
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code A0: 6 axis hue control: Magenta
   Decrease shifts toward blue, 127 no effect, increase shifts toward red
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: PROFILE, COLOR
   Attributes: Read Write, Continuous (normal)
VCP code A2: Auto setup on/off
   Turn on/off an auto setup function
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Write Only, Non-Continuous (write-only)
VCP code A4: Window mask control
   Turn selected window operation on/off, window mask
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: WINDOW
   Attributes (v2.0): Read Write, Non-Continuous (complex)
   Attributes (v2.1): Read Write, Non-Continuous (complex)
   Attributes (v3.0): Read Write, Table (normal)
   Attributes (v2.2): Read Write, Table (normal)
VCP code A5: Change the selected window
   Change selected window (as defined by 95h..98h)
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: WINDOW
   Attributes: Read Write, Non-Continuous (simple)
VCP code AA: Screen Orientation
   Indicates screen orientation
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Only, Non-Continuous (simple)
VCP code AC: Horizontal frequency
   Horizontal sync signal frequency as determined by the display
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Only, Continuous (complex)
VCP code AE: Vertical frequency
   Vertical sync signal frequency as determined by the display, in .01 hz
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Only, Continuous (complex)
VCP code B0: Settings
   Store/restore the user saved values for the current mode.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Write Only, Non-Continuous (write-only)
VCP code B2: Flat panel sub-pixel layout
   LCD sub-pixel structure
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Only, Non-Continuous (simple)
VCP code B4: Source Timing Mode
   Indicates timing mode being sent by host
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes (v2.1): Read Write, Non-Continuous (complex)
   Attributes (v3.0): Read Write, Table (normal)
   Attributes (v2.2): Read Write, Table (normal)
VCP code B6: Display technology type
   Indicates the base technology type
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Only, Non-Continuous (simple)
VCP code B7: Monitor status
   Video mode and status of a DPVL capable monitor
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: DPVL
   Attributes: Read Only, Non-Continuous (complex)
VCP code B8: Packet count
   Counter for DPVL packets received
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: DPVL
   Attributes: Read Write, Continuous (complex)
VCP code B9: Monitor X origin
   X origin of the monitor in the vertical screen
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: DPVL
   Attributes: Read Write, Continuous (complex)
VCP code BA: Monitor Y origin
   Y origin of the monitor in the vertical screen
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: DPVL
   Attributes: Read Write, Continuous (complex)
VCP code BB: Header error count
   Error counter for the DPVL header
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: DPVL
   Attributes: Read Write, Continuous (complex)
VCP code BC: Body CRC error count
   CRC error counter for the DPVL body
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: DPVL
   Attributes: Read Write, Continuous (complex)
VCP code BD: Client ID
   Assigned identification number for the monitor
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: DPVL
   Attributes: Read Write, Continuous (complex)
VCP code BE: Link control
   Indicates status of the DVI link
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: DPVL
   Attributes: Read Write, Non-Continuous (complex)
VCP code C0: Display usage time
   Active power on time in hours
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Only, Continuous (complex)
VCP code C2: Display descriptor length
   Length in bytes of non-volatile storage in the display available for writing a display descriptor, max 256
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Only, Continuous (normal)
VCP code C3: Transmit display descriptor
   Reads (writes) a display descriptor from (to) non-volatile storage in the display.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Table (normal)
VCP code C4: Enable display of 'display descriptor'
   If enabled, the display descriptor shall be displayed when no video is being received.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Non-Continuous (complex)
VCP code C6: Application enable key
   A 2 byte value used to allow an application to only operate with known products.
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Only, Non-Continuous (complex)
VCP code C8: Display controller type
   Mfg id of controller and 2 byte manufacturer-specific controller type
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Only, Non-Continuous (complex)
VCP code C9: Display firmware level
   2 byte firmware level
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Only, Non-Continuous (complex)
VCP code CA: OSD/Button Control
   Sets and indicates the current operational state of OSD (and buttons in v2.2)
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes (v2.0): Read Write, Non-Continuous (simple)
   Attributes (v2.1): Read Write, Non-Continuous (simple)
   Attributes (v3.0): Read Write, Non-Continuous (simple)
   Attributes (v2.2): Read Write, Non-Continuous (complex)
VCP code CC: OSD Language
   On Screen Display language
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Non-Continuous (simple)
VCP code CD: Status Indicators
   Control up to 16 LED (or similar) indicators to indicate system status
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Non-Continuous (complex)
VCP code CE: Auxiliary display size
   Rows and characters/row of auxiliary display
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Only, Non-Continuous (complex)
VCP code CF: Auxiliary display data
   Sets contents of auxiliary display device
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Write Only, Table (write-only)
VCP code D0: Output select
   Selects the active output
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes (v2.0): Read Write, Non-Continuous (simple)
   Attributes (v2.1): Read Write, Non-Continuous (simple)
   Attributes (v3.0): Read Write, Table (normal)
   Attributes (v2.2): Read Write, Non-Continuous (simple)
VCP code D2: Asset Tag
   Read an Asset Tag to/from the display
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Table (normal)
VCP code D4: Stereo video mode
   Stereo video mode
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Non-Continuous (complex)
VCP code D6: Power mode
   DPM and DPMS status
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Non-Continuous (simple)
VCP code D7: Auxiliary power output
   Controls an auxiliary power output from a display to a host device
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Write, Non-Continuous (simple)
VCP code DA: Scan mode
   Controls scan characteristics (aka format)
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: CRT
   Attributes: Read Write, Non-Continuous (simple)
VCP code DB: Image Mode
   Controls aspects of the displayed image (TV applications)
   MCCS versions: 2.1, 3.0, 2.2
   ddcutil feature subsets: TV
   Attributes: Read Write, Non-Continuous (simple)
VCP code DC: Display Mode
   Type of application used on display
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: COLOR
   Attributes: Read Write, Non-Continuous (simple)
VCP code DE: Scratch Pad
   Operation mode (2.0) or scratch pad (3.0/2.2)
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes (v2.0): Write Only, Non-Continuous (write-only)
   Attributes (v2.1): Read Write, Non-Continuous (complex)
   Attributes (v3.0): Read Write, Non-Continuous (complex)
   Attributes (v2.2): Read Write, Non-Continuous (complex)
VCP code DF: VCP Version
   MCCS version
   MCCS versions: 2.0, 2.1, 3.0, 2.2
   ddcutil feature subsets: 
   Attributes: Read Only, Non-Continuous (complex)
```

+ `ddcutil getvcp scan`

```sh
> ddcutil getvcp scan
VCP code 0x02 (New control value             ): No new control values (0x01)
VCP code 0x0b (Color temperature increment   ): Invalid value: 0
VCP code 0x0c (Color temperature request     ): 3000 + 1 * (feature 0B color temp increment) degree(s) Kelvin
VCP code 0x0e (Clock                         ): current value =    50, max value =   100
VCP code 0x10 (Brightness                    ): current value =    37, max value =   100
VCP code 0x12 (Contrast                      ): current value =    50, max value =   100
VCP code 0x14 (Select color preset           ): 6500 K (sl=0x05)
VCP code 0x16 (Video gain: Red               ): current value =    49, max value =   100
VCP code 0x18 (Video gain: Green             ): current value =    50, max value =   100
VCP code 0x1a (Video gain: Blue              ): current value =    49, max value =   100
VCP code 0x1e (Auto setup                    ): Auto setup not active (sl=0x00)
VCP code 0x20 (Horizontal Position           ): current value =     0, max value =   100
VCP code 0x30 (Vertical Position             ): current value =     0, max value =   100
VCP code 0x3e (Clock phase                   ): current value =    50, max value =   100
VCP code 0x52 (Active control                ): Value: 0x00
VCP code 0x60 (Input Source                  ): HDMI-1 (sl=0x11)
VCP code 0x68 (Unknown feature               ): mh=0x00, ml=0x05, sh=0x00, sl=0x01
VCP code 0x6c (Video black level: Red        ): current value =    50, max value =   255
VCP code 0x6e (Video black level: Green      ): current value =    50, max value =   255
VCP code 0x70 (Video black level: Blue       ): current value =    50, max value =   255
VCP code 0xa8 (Unknown feature               ): mh=0x00, ml=0x03, sh=0x00, sl=0x00
VCP code 0xaa (Screen Orientation            ): 0 degrees (sl=0x01)
VCP code 0xac (Horizontal frequency          ): 3728 hz
VCP code 0xae (Vertical frequency            ): 59.91 hz
VCP code 0xb2 (Flat panel sub-pixel layout   ): Red/Green/Blue vertical stripe (sl=0x01)
VCP code 0xb4 (Source Timing Mode            ): mh=0x00, ml=0x02, sh=0x00, sl=0x01
VCP code 0xb6 (Display technology type       ): LCD (active matrix) (sl=0x03)
VCP code 0xc0 (Display usage time            ): Usage time (hours) = 0 (0x000000) mh=0xff, ml=0xff, sh=0x00, sl=0x00
VCP code 0xc6 (Application enable key        ): 0x45cc
VCP code 0xc8 (Display controller type       ): Mfg: Mstar (sl=0x05), controller number: mh=0x00, ml=0x00, sh=0x56
VCP code 0xc9 (Display firmware level        ): 0.0
VCP code 0xca (OSD                           ): OSD Enabled (sl=0x02)
VCP code 0xd6 (Power mode                    ): DPM: On,  DPMS: Off (sl=0x01)
VCP code 0xdc (Display Mode                  ): Standard/Default mode (sl=0x00)
VCP code 0xdf (VCP Version                   ): 2.1
VCP code 0xe3 (Manufacturer Specific         ): mh=0x00, ml=0x01, sh=0x00, sl=0x00
VCP code 0xed (Manufacturer Specific         ): mh=0x00, ml=0x01, sh=0x00, sl=0x01
VCP code 0xfa (Manufacturer Specific         ): mh=0xff, ml=0xff, sh=0x00, sl=0x00
VCP code 0xfd (Manufacturer Specific         ): mh=0xff, ml=0xff, sh=0x00, sl=0x63
VCP code 0xff (Manufacturer Specific         ): mh=0xff, ml=0xff, sh=0x00, sl=0x00
```

可以看到, 作为一款廉价的小厂显示器驱动板, 支持的 DDC/CI 功能是比较少的.
但是 **亮度** 控制功能是正常的, 能够正确设置 0 和 100 亮度.


## 4 总结与展望

组装一台显示器并不复杂, 只需要 4 个配件: 液晶面板, 驱动板, 外壳, 电源.
面板和驱动板之间需要连接 2 条线: eDP 信号线, 背光供电线.
只需要拧几颗螺丝, 显示器就组装好啦, 撒花 ~

在本文所选的型号中, 面板是 4K 60Hz 的, 驱动板有 1 个 DP 输入和 3 个 HDMI 输入接口,
支持分屏功能, 可以同时显示 4 路 1080p 60Hz 画面.
电源是很重要的, 之前电源坏了导致翻车, 屏幕点不亮, 后来换了新的 12V 5A 电源才好了.

如果找不到满意的显示器, 可以考虑用配件组装一台哦 ~

----

本文使用 CC-BY-SA 4.0 许可发布.
