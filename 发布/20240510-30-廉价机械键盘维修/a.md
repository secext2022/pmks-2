# 廉价机械键盘维修: 使用电烙铁更换损坏的轴

穷 (x1), 给老公买了个很便宜的机械键盘.
经过大半年的高强度使用, 其中一个按键坏了.
穷 (x2), 没钱再买一个新的了, 于是:
拆开键盘, 用电烙铁把损坏的轴焊下来, 再焊一个新的轴上去, 装好 ~~
然后键盘就满血复活啦 !


## 目录

+ 1 机械键盘结构与工作原理简介

  - 1.1 薄膜键盘
  - 1.2 机械键盘

+ 2 使用电烙铁焊接更换轴体

+ 3 装好并测试

+ 4 总结与展望


## 1 机械键盘结构与工作原理简介

根据按键的工作方式分类, 常见的键盘有: 薄膜键盘, 机械键盘, 静电容键盘.
其中薄膜键盘使用两张塑料薄膜, 机械键盘每个按键使用一个机械开关 (轴).

至于静电容嘛 .. .
众所周知, 近距离的两块导体之间, 会形成一个电容.
距离越近电容量就越大, 所以可以根据电容的变化, 来检测按键的上下移动.

![静电容键盘](./图/1-kbc-1.png)

图片: 3 年前花 600 元买的静电容键盘, 当时现在的老公还只是男朋友 .. .

咳咳, 静电容键盘适合用来养老, 享受退休后的幸福晚年生活, 少年, 你值得拥有 (误

### 1.1 薄膜键盘

最常见的计算机键盘有 104 个按键, 如图:

![薄膜键盘正面](./图/1-kbb-1.png)

最早的计算机键盘其实是机械键盘, 但是可能因为机械键盘太贵了,
后来又出现了薄膜键盘.

![薄膜键盘拆开](./图/1-kbb-2.png)

拧下键盘背面的所有螺丝, 就能把薄膜键盘拆开, 看到内部结构.

![薄膜键盘的薄膜结构](./图/1-kbb-3.png)

薄膜键盘的主要结构就是两张塑料薄膜, 上面印刷了一些导电线路,
以及橡胶材质的弹簧结构 (皮碗), 用于按键回弹.

![薄膜键盘电路板](./图/1-kbb-4.png)

只有一块非常小巧的电路板 (PCB),
以及异常经典的 "牛屎封装" 芯片 (图中的黑色圆形凸起).

所以, 薄膜键盘可以非常便宜. 比如图中这个, 淘宝只要 20 元.

对穷人来说, 便宜, 能用, 就是好 !!

### 1.2 机械键盘

机械键盘的结构稍微复杂一些, 最上面的一层是 **键帽**, 可以直接用力拔下来的
(大力出奇迹 ~ )

![机械键盘正面](./图/1-kbx-1.png)

图中这个是一个很便宜的机械键盘.

![淘宝截图 (1)](./图/1-tb-1.png)

图片来源: 淘宝 app 截图.

![一盆键帽](./图/1-kbx-2.png)

这是一盆键帽, 一共 104 个.

![机械键盘外壳内部](./图/1-kbx-c-1.png)

把正面的螺丝拧掉, 就能把键盘拆开, 后面的外壳部分只是一块塑料,
没啥好看的.

![机械键盘外壳外部](./图/1-kbx-c-2.png)

重要的是这一大块印刷电路板 (PCB):

![机械键盘电路板](./图/1-kbx-pcb-1.png)

可以看到, 机械键盘里面有一整块键盘这么大的电路板 !

![机械键盘电路板局部](./图/1-kbx-pcb-2.png)

电路板局部特写.
电路板上主要焊接着 **轴体**, 也就是每个按键对应的机械开关.
所以, 机械键盘的成本必然不便宜.

一些更高端的机械键盘, 轴也是能拔下来的, 可以很方便的换轴.
但是这里的键盘只是一个便宜货, 所以就是直接焊上去的.

![MCU 附近的电路板](./图/1-kbx-mcu-1.png)

这部分是控制电路, 左侧的 5 针白色插座连接 USB 数据线,
右侧是一个 LQFP48 封装的芯片, 应该是一个单片机 (MCU).

![MCU 特写](./图/1-kbx-mcu-2.png)

芯片丝印为: `SX83099EN VYPA1WX227L`

这可能是一个专用于键盘的型号.

----

机械键盘的轴有很多种, 通常以颜色区分, 比如 **青轴**, **黑轴**, **红轴** 等.
不同的轴手感不同, 也就是压力行程曲线不同, 按下按键时手指受到的力反馈有区别.

其中最经典的就是 **青轴** 和 **黑轴**,
别的各种轴基本就是在这两个的基础上修改而来的.
青轴具有 **段落感**, 按键按下会有 "咔哒" 响声以及力反馈,
所以青轴的噪声比较大.
黑轴直上直下, 没有段落感, 适合游戏场景.
红轴类似黑轴, 也是直上直下, 但是按键力度较小, 手指不容易累, 也比较安静.

![淘宝截图 (2)](./图/1-tb-2.png)

这是窝在淘宝买的红轴, 10 个 (包邮).

![一袋红轴](./图/1-kbx-k-1.png)

卖家贴心的赠送了拔键器 (拔轴器), 好评 !

![红轴特写](./图/1-kbx-k-2.png)

这种外形的轴一般被称为 "三脚": 中间的圆柱凸起用于定位孔, 另外两个是轴的引脚.

机械键盘的轴就是一个开关, 窝们可以使用万用表的欧姆档来测量:

![万用表用于测量轴](./图/1-kbx-m-1.png)

平时轴的开关断开, 电阻为无穷大.

![按键按下](./图/1-kbx-m-2.png)

按键按下时, 轴的开关闭合, 电阻接近 0 (测量有误差).

![轴拆开](./图/1-kbx-k-3.png)

把一个轴拆开后可以看到, 由这些零件组成.
主要部分是俩金属片和一个弹簧, 金属片上有专用的触点结构.


## 2 使用电烙铁焊接更换轴体

电烙铁, 启动 !

![电烙铁](./图/2-f-0.png)

之前损坏的按键的轴已经被焊下来了:

![轴已经焊下](./图/2-b-1.png)

反面 (PCB):

![轴已经焊下 (PCB)](./图/2-b-2.png)

焊上新的轴:

![焊上新轴 (PCB)](./图/2-f-1.png)

焊的不好, 抱歉.

![焊上新轴 (正面)](./图/2-f-2.png)

哈哈, 能看出来哪个是新的轴嘛 ?

最后, 无奖竞猜: 聪明的读者, 请问损坏的按键是哪个 ?


## 3 装好并测试

![连接 USB 线](./图/3-t-1.png)

连接 USB 数据线.

![点亮](./图/3-t-2.png)

成功点亮 !

![拧上螺丝](./图/3-t-3.png)

拧上所有螺丝, 就大功告成啦 ~

----

测试键盘按键的一种方法 (ArchLinux):

```sh
> lsusb

省略部分结果

Bus 001 Device 030: ID 1a2c:4fe8 China Resource Semico Co., Ltd USB Keyboard
```

使用 `lsusb` 命令找到对应的 USB 键盘.

```sh
> ls -l /dev/input/by-id

省略部分结果

lrwxrwxrwx 1 root root 10  5月10日 01:24 usb-SEMICO_USB_Keyboard-event-if01 -> ../event22
lrwxrwxrwx 1 root root 10  5月10日 01:24 usb-SEMICO_USB_Keyboard-event-kbd -> ../event20
lrwxrwxrwx 1 root root 10  5月10日 01:24 usb-SEMICO_USB_Keyboard-if01-event-kbd -> ../event23
```

找到键盘对应的事件源 `/dev/input/event20`.

```sh
> evtest /dev/input/event20
Input driver version is 1.0.1
Input device ID: bus 0x3 vendor 0x1a2c product 0x4fe8 version 0x110
Input device name: "SEMICO USB Keyboard"
Supported events:
  Event type 0 (EV_SYN)
  Event type 1 (EV_KEY)
    Event code 1 (KEY_ESC)
    Event code 2 (KEY_1)
    Event code 3 (KEY_2)
    Event code 4 (KEY_3)
    Event code 5 (KEY_4)
    Event code 6 (KEY_5)
    Event code 7 (KEY_6)
    Event code 8 (KEY_7)
    Event code 9 (KEY_8)
    Event code 10 (KEY_9)
    Event code 11 (KEY_0)
    Event code 12 (KEY_MINUS)
    Event code 13 (KEY_EQUAL)
    Event code 14 (KEY_BACKSPACE)
    Event code 15 (KEY_TAB)
    Event code 16 (KEY_Q)
    Event code 17 (KEY_W)
    Event code 18 (KEY_E)
    Event code 19 (KEY_R)
    Event code 20 (KEY_T)
    Event code 21 (KEY_Y)
    Event code 22 (KEY_U)
    Event code 23 (KEY_I)
    Event code 24 (KEY_O)
    Event code 25 (KEY_P)
    Event code 26 (KEY_LEFTBRACE)
    Event code 27 (KEY_RIGHTBRACE)
    Event code 28 (KEY_ENTER)
    Event code 29 (KEY_LEFTCTRL)
    Event code 30 (KEY_A)
    Event code 31 (KEY_S)
    Event code 32 (KEY_D)
    Event code 33 (KEY_F)
    Event code 34 (KEY_G)
    Event code 35 (KEY_H)
    Event code 36 (KEY_J)
    Event code 37 (KEY_K)
    Event code 38 (KEY_L)
    Event code 39 (KEY_SEMICOLON)
    Event code 40 (KEY_APOSTROPHE)
    Event code 41 (KEY_GRAVE)
    Event code 42 (KEY_LEFTSHIFT)
    Event code 43 (KEY_BACKSLASH)
    Event code 44 (KEY_Z)
    Event code 45 (KEY_X)
    Event code 46 (KEY_C)
    Event code 47 (KEY_V)
    Event code 48 (KEY_B)
    Event code 49 (KEY_N)
    Event code 50 (KEY_M)
    Event code 51 (KEY_COMMA)
    Event code 52 (KEY_DOT)
    Event code 53 (KEY_SLASH)
    Event code 54 (KEY_RIGHTSHIFT)
    Event code 55 (KEY_KPASTERISK)
    Event code 56 (KEY_LEFTALT)
    Event code 57 (KEY_SPACE)
    Event code 58 (KEY_CAPSLOCK)
    Event code 59 (KEY_F1)
    Event code 60 (KEY_F2)
    Event code 61 (KEY_F3)
    Event code 62 (KEY_F4)
    Event code 63 (KEY_F5)
    Event code 64 (KEY_F6)
    Event code 65 (KEY_F7)
    Event code 66 (KEY_F8)
    Event code 67 (KEY_F9)
    Event code 68 (KEY_F10)
    Event code 69 (KEY_NUMLOCK)
    Event code 70 (KEY_SCROLLLOCK)
    Event code 71 (KEY_KP7)
    Event code 72 (KEY_KP8)
    Event code 73 (KEY_KP9)
    Event code 74 (KEY_KPMINUS)
    Event code 75 (KEY_KP4)
    Event code 76 (KEY_KP5)
    Event code 77 (KEY_KP6)
    Event code 78 (KEY_KPPLUS)
    Event code 79 (KEY_KP1)
    Event code 80 (KEY_KP2)
    Event code 81 (KEY_KP3)
    Event code 82 (KEY_KP0)
    Event code 83 (KEY_KPDOT)
    Event code 85 (KEY_ZENKAKUHANKAKU)
    Event code 86 (KEY_102ND)
    Event code 87 (KEY_F11)
    Event code 88 (KEY_F12)
    Event code 89 (KEY_RO)
    Event code 90 (KEY_KATAKANA)
    Event code 91 (KEY_HIRAGANA)
    Event code 92 (KEY_HENKAN)
    Event code 93 (KEY_KATAKANAHIRAGANA)
    Event code 94 (KEY_MUHENKAN)
    Event code 95 (KEY_KPJPCOMMA)
    Event code 96 (KEY_KPENTER)
    Event code 97 (KEY_RIGHTCTRL)
    Event code 98 (KEY_KPSLASH)
    Event code 99 (KEY_SYSRQ)
    Event code 100 (KEY_RIGHTALT)
    Event code 102 (KEY_HOME)
    Event code 103 (KEY_UP)
    Event code 104 (KEY_PAGEUP)
    Event code 105 (KEY_LEFT)
    Event code 106 (KEY_RIGHT)
    Event code 107 (KEY_END)
    Event code 108 (KEY_DOWN)
    Event code 109 (KEY_PAGEDOWN)
    Event code 110 (KEY_INSERT)
    Event code 111 (KEY_DELETE)
    Event code 113 (KEY_MUTE)
    Event code 114 (KEY_VOLUMEDOWN)
    Event code 115 (KEY_VOLUMEUP)
    Event code 116 (KEY_POWER)
    Event code 117 (KEY_KPEQUAL)
    Event code 119 (KEY_PAUSE)
    Event code 121 (KEY_KPCOMMA)
    Event code 122 (KEY_HANGUEL)
    Event code 123 (KEY_HANJA)
    Event code 124 (KEY_YEN)
    Event code 125 (KEY_LEFTMETA)
    Event code 126 (KEY_RIGHTMETA)
    Event code 127 (KEY_COMPOSE)
    Event code 128 (KEY_STOP)
    Event code 129 (KEY_AGAIN)
    Event code 130 (KEY_PROPS)
    Event code 131 (KEY_UNDO)
    Event code 132 (KEY_FRONT)
    Event code 133 (KEY_COPY)
    Event code 134 (KEY_OPEN)
    Event code 135 (KEY_PASTE)
    Event code 136 (KEY_FIND)
    Event code 137 (KEY_CUT)
    Event code 138 (KEY_HELP)
    Event code 140 (KEY_CALC)
    Event code 142 (KEY_SLEEP)
    Event code 150 (KEY_WWW)
    Event code 152 (KEY_SCREENLOCK)
    Event code 158 (KEY_BACK)
    Event code 159 (KEY_FORWARD)
    Event code 161 (KEY_EJECTCD)
    Event code 163 (KEY_NEXTSONG)
    Event code 164 (KEY_PLAYPAUSE)
    Event code 165 (KEY_PREVIOUSSONG)
    Event code 166 (KEY_STOPCD)
    Event code 173 (KEY_REFRESH)
    Event code 176 (KEY_EDIT)
    Event code 177 (KEY_SCROLLUP)
    Event code 178 (KEY_SCROLLDOWN)
    Event code 179 (KEY_KPLEFTPAREN)
    Event code 180 (KEY_KPRIGHTPAREN)
    Event code 183 (KEY_F13)
    Event code 184 (KEY_F14)
    Event code 185 (KEY_F15)
    Event code 186 (KEY_F16)
    Event code 187 (KEY_F17)
    Event code 188 (KEY_F18)
    Event code 189 (KEY_F19)
    Event code 190 (KEY_F20)
    Event code 191 (KEY_F21)
    Event code 192 (KEY_F22)
    Event code 193 (KEY_F23)
    Event code 194 (KEY_F24)
    Event code 240 (KEY_UNKNOWN)
  Event type 4 (EV_MSC)
    Event code 4 (MSC_SCAN)
  Event type 17 (EV_LED)
    Event code 0 (LED_NUML) state 1
    Event code 1 (LED_CAPSL) state 0
    Event code 2 (LED_SCROLLL) state 0
    Event code 3 (LED_COMPOSE) state 0
    Event code 4 (LED_KANA) state 0
Key repeat handling:
  Repeat type 20 (EV_REP)
    Repeat code 0 (REP_DELAY)
      Value    250
    Repeat code 1 (REP_PERIOD)
      Value     33
Properties:
Testing ... (interrupt to exit)
Event: time 1715275675.922741, type 17 (EV_LED), code 0 (LED_NUML), value 0
Event: time 1715275675.922741, type 4 (EV_MSC), code 4 (MSC_SCAN), value 70014
Event: time 1715275675.922741, type 1 (EV_KEY), code 16 (KEY_Q), value 1
Event: time 1715275675.922741, -------------- SYN_REPORT ------------
'Event: time 1715275676.026802, type 4 (EV_MSC), code 4 (MSC_SCAN), value 70014
Event: time 1715275676.026802, type 1 (EV_KEY), code 16 (KEY_Q), value 0
Event: time 1715275676.026802, -------------- SYN_REPORT ------------
```

然后每按下一个按键, 这里就会有对应的输出.

另, 多说一句, 系统其实能够区分不同键盘上的按键 (同时连接多个键盘).
不过这个能力的应用嘛 .. . 好像不多.

参考文档: <https://wiki.archlinux.org/title/Keyboard_input>


## 4 总结与展望

使用计算机键盘时, 一般情况下, 并不会均匀的使用每个按键.
有少数高频使用的按键, 会首先损坏.
薄膜键盘虽然便宜, 但是基本不可维修, 一旦损坏就必须整个换新.

最便宜的机械键盘, 虽然比最便宜的薄膜键盘贵了数倍,
但是机械键盘的使用体验比薄膜键盘好很多.
另外, 机械键盘可以通过更换单个轴的方式进行维修,
理论上或许可以获得更长的使用寿命, 使得其总成本并不比薄膜键盘高 ?

总之, 作为穷人, 就喜欢追求低成本嘛.
本次维修的综合总成本不超过 10 元 (不含人工).

----

这次维修其实很简单, 核心工作只是用电烙铁焊俩点,
不到十分钟就能完成.

但是, 想到能够顺便科普一下机械键盘的工作原理, 还能再写 (发) 一篇文章,
还是很值得的嘛.
于是就有了本文.

目前计算机键盘已经很便宜了, 无论是薄膜键盘, 还是机械键盘,
都尽可能做到了物美价廉.
一想到 20 元就能买到一个一百多个按键的大键盘 .. .
还是挺令人激动的 !

这一切都显示出中国制造的强大力量.
作为居住在中国的中国人, 近水楼台先得月, 窝们可得好好享受这些好处呀 !

最后, 窝很好奇下次坏的是哪个按键.

----

彩蛋:

![水洗键帽](./图/4-w-1.png)

老公的键帽太脏了, 被窝拿去水洗了, 一时半会儿装不回去了.

![键盘侧面](./图/4-kbx-k-1.png)

小知识: 机械键盘每排键帽的高度不同, 从侧面看去, 有一个弯曲的弧度,
这个设计可以更加贴合手指, 使用键盘更舒适, 代价就是会增加成本.

![水洗键帽 (2)](./图/4-w-2.png)

用小牙刷把键帽一颗一颗的刷干净 .. .
修好了老公的键盘, 老公今晚就会给窝做好吃的啦 ~
(窝不是不会做饭, 只是做的饭好像不太好吃 .. . )

----

本文使用 CC-BY-SA 4.0 许可发布.
