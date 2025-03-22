# 香橙派 HDMI 显示器 DDC/CI 踩坑记录

书接上文, 自从知道了 DDC/CI 这个大部分显示器都支持的好用功能之后,
就愉快的跑去香橙派上使用了.
结果, 不支持 ?
这是什么情况 ??
树莓派都支持, 香橙派居然不支持 ?

一通研究之后发现, 还真的是硬件不支持 !
这怎么行 ?
俗话说的好, 有条件要上, 没有条件创造条件也要上 !

最终, 在坚持不懈的努力之下, 以不足 5 元 (3.4 元) 的硬件成本,
在香橙派上成功实现了 DDC/CI 功能.

----

相关文章:

+ 《显示器的隐藏功能: 显示数据通道命令接口 (DDC/CI)》

  TODO


## 目录

+ 1 香橙派 zero3 不支持 DDC/CI

+ 2 H618 处理器的 DesignWare HDMI 控制器不支持 DDC/CI

  - 2.1 香橙派 HDMI i2c 总线没有从机地址 `37`
  - 2.2 查找相关的 Linux 内核驱动代码
  - 2.3 DesignWare HDMI 硬件不支持

+ 3 旁路引出 HDMI 的 i2c

+ 4 测试成功

+ 5 总结与展望


## 1 香橙派 zero3 不支持 DDC/CI

测试设备: 香橙派 Orange pi Zero3 (内存 1GB, 处理器 全志 H618)

操作系统: Debian 12 (官方镜像, Linux 6.1)

话不多说, 直接使用 `ddcutil` 进行测试:

```
orangepi@orangepizero3 ~> ddcutil detect
Invalid display
   I2C bus:  /dev/i2c-5
   DRM connector:           card0-HDMI-A-1
   EDID synopsis:
      Mfg id:               GVE - UNK
      Model:                
      Product code:         9491  (0x2513)
      Serial number:        
      Binary serial number: 1 (0x00000001)
      Manufacture year:     2022,  Week: 29
   DDC communication failed
   This appears to be a laptop display. Laptop displays do not support DDC/CI.
```

嗯 ?
什么情况 ??

同一个显示器, 使用 HDMI 连接 PC (ArchLinux) 就是正常的啊:

```
> ddcutil detect
Display 1
   I2C bus:  /dev/i2c-2
   DRM connector:           card1-HDMI-A-1
   EDID synopsis:
      Mfg id:               GVE - UNK
      Model:                
      Product code:         9491  (0x2513)
      Serial number:        
      Binary serial number: 1 (0x00000001)
      Manufacture year:     2022,  Week: 29
   VCP version:         2.2
> ddcutil getvcp 10
VCP code 0x10 (Brightness                    ): current value =     0, max value =   100
```

----

系统版本信息:

```
orangepi@orangepizero3 ~> uname -a
Linux orangepizero3 6.1.31-sun50iw9 #1.0.0 SMP Mon Jul  3 13:44:03 CST 2023 aarch64 GNU/Linux
orangepi@orangepizero3 ~> neofetch
       _,met$$$$$gg.          orangepi@orangepizero3 
    ,g$$$$$$$$$$$$$$$P.       ---------------------- 
  ,g$$P"     """Y$$.".        OS: Debian GNU/Linux 12 (bookworm) aarch64 
 ,$$P'              `$$$.     Host: OrangePi Zero3 
',$$P       ,ggs.     `$$b:   Kernel: 6.1.31-sun50iw9 
`d$$'     ,$P"'   .    $$$    Uptime: 3 days, 4 hours, 40 mins 
 $$P      d$'     ,    $$P    Packages: 1281 (dpkg) 
 $$:      $$.   -    ,d$$'    Shell: fish 3.6.0 
 $$;      Y$b._   _,d$P'      Resolution: 1920x1080 
 Y$$.    `.`"Y$$$$P"'         Terminal: /dev/pts/0 
 `$$b      "-.__              CPU: (4) @ 1.512GHz 
  `Y$$                        Memory: 513MiB / 981MiB 
   `Y$$.
     `$$b.                                            
       `Y$$b.                                         
          `"Y$b._
              `"""
```

```
orangepi@orangepizero3 ~> ddcutil --version
ddcutil 1.4.1
Built with support for USB connected displays.
Built without function failure simulation.
Built with libdrm services.

Copyright (C) 2015-2023 Sanford Rockowitz
License GPLv2: GNU GPL version 2 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
```


## 2 H618 处理器的 DesignWare HDMI 控制器不支持 DDC/CI

### 2.1 香橙派 HDMI i2c 总线没有从机地址 `37`

我们知道, DDC/CI 功能是通过 i2c 总线实现的, 那看看 i2c 是什么情况:

```
orangepi@orangepizero3 ~> /sbin/i2cdetect -l
i2c-3	i2c       	mv64xxx_i2c adapter             	I2C adapter
i2c-4	i2c       	mv64xxx_i2c adapter             	I2C adapter
i2c-5	i2c       	DesignWare HDMI                 	I2C adapter
```

可以看到, `i2c-5` 名称 `DesignWare HDMI`, 这个应该就是 HDMI 的 i2c 总线.

```
orangepi@orangepizero3 ~> /sbin/i2cdetect -y -r 5
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
00:                         -- -- -- -- -- -- -- -- 
10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
20: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
30: 30 -- -- -- -- -- -- -- -- -- 3a -- -- -- -- -- 
40: -- -- -- -- -- -- -- -- -- -- 4a 4b -- -- -- -- 
50: 50 -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
60: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
70: -- -- -- -- -- -- -- --                         
```

下面是 PC (ArchLinux) 连接同一个显示器的情况:

```
> i2cdetect -y 2
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
00:                         -- -- -- -- -- -- -- -- 
10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
20: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
30: -- -- -- -- -- -- -- 37 -- -- 3a -- -- -- -- -- 
40: -- -- -- -- -- -- -- -- -- -- 4a 4b -- -- -- -- 
50: 50 -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
60: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
70: -- -- -- -- -- -- -- --                         
```

这是 i2c 从机的地址, 其中 `50` 用于 EDID (获取显示器信息),
`37` 用于 DDC/CI.

香橙派 HDMI i2c 有 `50` 地址, 所以 EDID 功能正常.
然而, 别的从机地址都有, 就是没有该死的 `37` 地址 !

这种情况好奇怪啊, 你说 i2c 不正常吧, 它有 `50` 地址,
EDID 正常, 别的从机地址也都有.
你说 i2c 正常吧, 它就是没有从机地址 `37`.
你说气人不气人 !

### 2.2 查找相关的 Linux 内核驱动代码

我们去 Linux 代码中找找, 搜索关键词 `DesignWare`.
然后找到了文件 `linux-6.6.8/drivers/gpu/drm/bridge/synopsys/dw-hdmi.c` 第 421 行:

```c
static int dw_hdmi_i2c_xfer(struct i2c_adapter *adap,
			    struct i2c_msg *msgs, int num)
{
	struct dw_hdmi *hdmi = i2c_get_adapdata(adap);
	struct dw_hdmi_i2c *i2c = hdmi->i2c;
	u8 addr = msgs[0].addr;
	int i, ret = 0;

	if (addr == DDC_CI_ADDR)
		/*
		 * The internal I2C controller does not support the multi-byte
		 * read and write operations needed for DDC/CI.
		 * TOFIX: Blacklist the DDC/CI address until we filter out
		 * unsupported I2C operations.
		 */
		return -EOPNOTSUPP;
```

同一个文件第 42 行:

```c
#define DDC_CI_ADDR		0x37
```

嗯, 破案了, 原来 Linux 内核驱动代码中, 故意屏蔽了从机地址 `37` !
所以才会别的从机地址都有, 就是 `37` 没有.

但是, 为啥呢 ?

### 2.3 DesignWare HDMI 硬件不支持

使用 `git blame` 查找这段代码对应的提交, 找到了 `bee447e224b2645911c5d06e35dc90d8433fcef6`:

```
drm/bridge: dw-hdmi: Refuse DDC/CI transfers on the internal I2C controller

The DDC/CI protocol involves sending a multi-byte request to the
display via I2C, which is typically followed by a multi-byte
response. The internal I2C controller only allows single byte
reads/writes or reads of 8 sequential bytes, hence DDC/CI is not
supported when the internal I2C controller is used. The I2C
transfers complete without errors, however the data in the response
is garbage. Abort transfers to/from slave address 0x37 (DDC) with
-EOPNOTSUPP, to make it evident that the communication is failing.

Signed-off-by: Matthias Kaehlcke <mka@chromium.org>
Reviewed-by: Douglas Anderson <dianders@chromium.org>
Reviewed-by: Sean Paul <sean@poorly.run>
Acked-by: Neil Armstrong <narmstrong@baylibre.com>
Signed-off-by: Neil Armstrong <narmstrong@baylibre.com>
Link: https://patchwork.freedesktop.org/patch/msgid/20191002124354.v2.1.I709dfec496f5f0b44a7b61dcd4937924da8d8382@changeid
```

这是一个 5 年前 (2019 年) 的内核提交.
大致意思是说,
H618 芯片使用的 DesignWare HDMI 接口 IP 内置的 i2c 功能并不是通用的 i2c 硬件,
只支持读写单个字节, 或读取不超过 8 个的连续字节.
所以在硬件级别就不支持 DDC/CI 功能 (需要连续读写多个字节).
内核中的驱动只是在模拟一个 i2c 硬件, 但是无法使用 i2c 的全部功能.

好了, 这下实锤是硬件不支持了.

相关链接:
+ <https://github.com/torvalds/linux/commit/bee447e224b2645911c5d06e35dc90d8433fcef6>
+ <https://patchwork.freedesktop.org/patch/319153/?series=63919&rev=2>


## 3 旁路引出 HDMI 的 i2c

i2c 总线支持多主机多从机, 也就是多个设备可以同时连接在一条总线上,
其中任意设备都可以在任意时间充当主机, 发起数据传输.
i2c 总线有仲裁功能, 即使两个主机同时发起通信, 数据也不会丢失,
总线仍然可以正常工作.

虽然香橙派的 HDMI i2c 不支持 DDC/CI,
但是香橙派还有别的板载 i2c 接口, 如图:

![Orange pi Zero3 板载排针接口](../图/20240121-6/3-zero3-1.jpg)

(来源: http://www.orangepi.cn/html/hardWare/computerAndMicrocontrollers/details/Orange-Pi-Zero-3.html)

那么, 如果把 HDMI 中的 i2c 旁路引出, 连接到板载的 i2c 接口,
是不是就能使用 DDC/CI 呢 ?

为了实现这个目标, 一种简单粗暴的方法是,
直接剥开 HDMI 线缆, 找到 i2c 的 SCL, SDA 这两条信号线, 接线 !

但是, 想做的更优雅一些: KiCad, 启动 !

![原理图](../图/20240121-6/3-kicad-1.jpg)

这是原理图, 很简单:
两个 HDMI 接头, 20 根线直接对应连接 (直通), 另有一个排针,
旁路引出 13 ~ 19 号所有的低速信号线.
(1 ~ 12 是 HDMI 的 4 组 TMDS 高速差分信号线)

![PCB 图](../图/20240121-6/3-kicad-2.jpg)

电路板布线如图.

![PCB 打样](../图/20240121-6/3-pcb-1.jpg)

嘉立创 PCB 打样.

![PCBA 焊接后](../图/20240121-6/3-pcb-2.jpg)

焊接之后.

这块 PCB 成本 2.5 元, 元件成本总计 0.88 元,
所以 PCBA 成本 3.4 元 (每片).


## 4 测试成功

如图所示接线:

![测试接线](../图/20240121-6/4-test-1.jpg)

从香橙派出来 micro-HDMI 转 HDMI 短线, 进旁路电路板,
另一头 HDMI 线缆再接显示器.
i2c 两根线 SCL, SDA 接香橙派板载排针.

----

小知识:
香橙派 zero3 的 micro-HDMI 转接头不要买这种,
会和旁边的插头挤在一起:

![转接头拥挤](../图/20240121-6/4-test-2.jpg)

----

需要配置开启香橙派的 i2c-3 板载接口:

```
sudo orangepi-config
```

进入文本图形化配置界面,
菜单选择 `System` -> `Hardware`, 把 `ph-i2c3` 选中 (显示 `[*]`).
保存重启.

```
orangepi@orangepizero3 ~> /sbin/i2cdetect -l
i2c-3	i2c       	mv64xxx_i2c adapter             	I2C adapter
i2c-4	i2c       	mv64xxx_i2c adapter             	I2C adapter
i2c-5	i2c       	DesignWare HDMI                 	I2C adapter
orangepi@orangepizero3 ~> ddcutil detect
Error opening "/sys/devices/platform/soc/6000000.hdmi/edid", No such file or directory
Display 1
   I2C bus:  /dev/i2c-3
   DRM connector:           card0-HDMI-A-1
   EDID synopsis:
      Mfg id:               GVE - UNK
      Model:                
      Product code:         9491  (0x2513)
      Serial number:        
      Binary serial number: 1 (0x00000001)
      Manufacture year:     2022,  Week: 29
   VCP version:         2.2

Invalid display
   I2C bus:  /dev/i2c-5
   DRM connector:           card0-HDMI-A-1
   EDID synopsis:
      Mfg id:               GVE - UNK
      Model:                
      Product code:         9491  (0x2513)
      Serial number:        
      Binary serial number: 1 (0x00000001)
      Manufacture year:     2022,  Week: 29
   DDC communication failed
   This appears to be a laptop display. Laptop displays do not support DDC/CI.

orangepi@orangepizero3 ~> ddcutil getvcp 10
Error opening "/sys/devices/platform/soc/6000000.hdmi/edid", No such file or directory
VCP code 0x10 (Brightness                    ): current value =     0, max value =   100
```

`ddcutil` 会显示两个显示器 (其实只有一个),
`Invalid display` 是 HDMI i2c (不能用 DDC/CI),
另一个好的是旁路接的 i2c-3.

会报错, 但是不影响正常使用.


## 5 总结与展望

经过一番努力, 以不足 5 元的硬件成本, 实现了在香橙派上使用 DDC/CI 功能.

DesignWare HDMI (dw-hdmi) 不支持 DDC/CI, 这个必须差评 !
这个控制器 (芯片 IP) 在很多处理器里面都用到了,
很明显, 这些处理器也都不支持 DDC/CI 功能.

但是没关系, 本文的解决方案, 适用于所有这些情况.
应该适用于很多国产的单板机 (SBC).
不支持 DDC/CI, 外接一个就好了, 成本也很低.

本文中的电路板, 由于引出了 HDMI 所有低速信号,
也可以用于别的 HDMI 功能, 比如 CEC.
很多 PC 的 HDMI 接口并不支持 CEC, 如果想使用也要外接硬件.

这个电路板也可以用于调试小米电视:

![调试接线](../图/20240121-6/5-test-1.jpg)

相关文章: 《小米电视 root 的准备工作》

TODO

----

本文使用 CC-BY-SA 4.0 许可发布.
