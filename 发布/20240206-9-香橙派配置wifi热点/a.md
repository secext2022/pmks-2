# 香橙派配置 wifi 热点

书接上文, 香橙派 zero3 不仅有千兆以太网口 (有线), 还支持 wifi (无线).
本文配置香橙派作为 wifi 热点 (接入点, AP).

![香橙派 zero3](../图/20240206-9/0-zero3.jpg)

看到这条可爱的小尾巴了嘛 ?

----

相关文章:

+ 《香橙派配置 VLAN (802.1q)》

  TODO


## 目录

+ 1 需求分析

+ 2 香橙派配置

+ 3 测试

+ 4 坑

  - 4.1 iwd 无法使用, 直接卡死系统
  - 4.2 不支持 WPA3 (SAE)

+ 5 总结与展望


## 1 需求分析

有一些物联网 (IoT) 设备需要通过 wifi 连网 (比如 esp32c2 模块).
可以直接通过主路由 (wifi 6 路由器) 入网, 但是有几个问题:

+ (1) 通过 wifi 连接主路由, 意味着直接接入互联网 (Internet),
  在安全性上不太好, 可能遭遇来自互联网的黑客攻击.

+ (2) 主路由无法安装 OpenWrt 操作系统, 在可管理可控制方面较弱.
  难以实现对接入设备的精细化自定义管理.

+ (3) 主路由发射 wifi 6 (802.11ax) 信号,
  然而 esp32c2 只支持 wifi 4 (802.11b/g/n).

  也就是说接入的设备实际上并用不到 wifi 6,
  而且反过来会降低 wifi 6 的性能.

此处希望将香橙派 zero3 作为 wifi 接入点, 获得以下好处:

+ (1) 安全隔离:
  接入的设备只能访问本地局域网, 无法访问互联网.

  接入的设备使用单独的 wifi 密码, 与主路由的 wifi 分开,
  减少 wifi 密码意外泄漏的可能.

+ (2) wifi 在 2.4GHz 频段一共有 3 个可以同时使用的信道 (频率).

  通过合理的配置,
  使得主路由 (2.4GHz) 和香橙派使用互不重叠的信道,
  从而两个 wifi 信号互不影响, 提高效率.

+ (3) 避免香橙派 zero3 的 wifi 功能闲置不用.


## 2 香橙派配置

测试设备: 香橙派 Orange pi Zero3 (内存 1GB, 处理器 全志 H618)

操作系统: Debian 12 (官方镜像, Linux 6.1)

注意: 配置 wifi 网络有多种具体的方法, 此处介绍的只是其中之一,
并且主要是为了满足上述需求.

为了与之前的网络配置 (详见 《香橙派配置 VLAN (802.1q)》) 兼容,
此处仍然使用 `systemd-networkd` 进行配置.

参考资料:

+ <https://wiki.archlinux.org/title/Systemd-networkd>
+ <https://wiki.archlinux.org/title/Software_access_point>

----

+ (1) 查看无线网络接口:

  ```
  orangepi@orangepizero3 ~> ip link
  3: wlan0: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN mode DEFAULT group default qlen 1000
      link/ether ec:0e:f1:5e:c5:91 brd ff:ff:ff:ff:ff:ff
  ```

  接口名称 `wlan0`

+ (2) 确认 `hostapd` 已经安装:

  ```
  orangepi@orangepizero3 ~> apt search hostapd

  hostapd/stable,now 2:2.10-12 arm64 [installed]
    access point and authentication server for Wi-Fi and Ethernet
  ```

+ (3) 创建配置文件:

  ```
  orangepi@orangepizero3 ~> cat /etc/systemd/network/40-wifi-ap.network 
  [Match]
  Name=wlan0

  [Network]
  Address=192.168.40.1/24
  DHCPServer=true

  [DHCPServer]
  PoolOffset=10
  PoolSize=230
  DNS=192.168.40.1
  orangepi@orangepizero3 ~> 
  ```

  这是 `systemd-networkd` 的配置文件.
  此处网络接口名称 `wlan0`, 静态 IP 地址 `192.168.40.1/24`,
  启用 DHCP 服务器, 分配 IP 地址从 10 开始 230 个.
  DNS 为本机 (香橙派).

  ```
  orangepi@orangepizero3 ~> cat /etc/hostapd/hostapd.conf
  interface=wlan0

  ssid=t4
  wpa_passphrase=123456789

  hw_mode=g
  channel=11
  ieee80211n=1

  wpa=2
  rsn_pairwise=CCMP
  wpa_key_mgmt=WPA-PSK

  country_code=CN
  ieee80211d=1
  ieee80211h=1

  max_num_sta=255
  auth_algs=2
  ignore_broadcast_ssid=0

  logger_syslog=-1
  logger_syslog_level=2
  logger_stdout=-1
  logger_stdout_level=2

  ctrl_interface=/run/hostapd
  ctrl_interface_group=0
  orangepi@orangepizero3 ~> 
  ```

  这是 `hostapd` 的配置文件.
  网络接口名称 `wlan0`, wifi 名称 `t4`, wifi 密码 `123456789`
  (此处只是示例, 实际使用请配置复杂的密码)
  使用 2.4GHz 频段 (`g`), 信道 (频率) `11`, 启用 `802.11n`.
  加密认证方式 WPA2 (个人, PSK).
  其余配置不太重要.

  ```
  orangepi@orangepizero3 ~> cat /etc/systemd/system/hostapd.service.d/override.conf
  [Unit]
  BindsTo=sys-subsystem-net-devices-wlan0.device
  After=sys-subsystem-net-devices-wlan0.device
  orangepi@orangepizero3 ~> 
  ```

  这是 `systemd` 的配置文件.
  主要作用是等待无线网络接口启动后, 再启动 `hostapd`,
  避免启动失败.

+ (4) 启用 `hostapd` 服务:

  ```
  orangepi@orangepizero3 ~> sudo systemctl enable hostapd
  ```

  重启设备:

  ```
  orangepi@orangepizero3 ~> sudo systemctl reboot
  ```


## 3 测试

使用手机连接上面建立的 wifi, 如图:

![手机连接 wifi](../图/20240206-9/3-wifi.jpg)

使用 ping 进行网络测试:

![ping 测试](../图/20240206-9/3-ping.jpg)

可以看到, ping 香橙派 (`192.168.40.1`) 正常,
说明 wifi 网络工作正常.

下面的 ping 表示 DNS 服务器 (香橙派) 工作正常,
但是由于香橙派没有开启路由功能, 无法访问互联网.
也就实现了前面说的安全隔离的需求.


## 4 坑

无线网络果然水很深, 配置 wifi 比之前的配置 VLAN 坑多了.

### 4.1 iwd 无法使用, 直接卡死系统

启动 `iwd` 会直接导致系统卡死, 无法操作, 只能强制断电, 关闭系统.

原因未知.

版本信息:

```
orangepi@orangepizero3 ~> apt search iwd

iwd/stable,now 2.3-1 arm64 [installed]
  wireless daemon for Linux
```

### 4.2 不支持 WPA3 (SAE)

无法使用配置 (hostapd):

```
wpa_key_mgmt=SAE
ieee80211w=2
```

具体现象是建立的 wifi 热点能够被手机显示在列表上,
但是无法连接.

也就是不支持 WPA3, 所以目前只能使用 WPA2.
估计是因为硬件不支持.


## 5 总结与展望

经过一番努力, 终于配置好了香橙派 wifi 接入点.
无线网络真坑, 费了好大劲.

其中 `systemd-networkd` 负责管理网络接口, 配置静态 IP 地址,
提供 DHCP 服务器.
`hostapd` 负责建立 wifi 热点, 配置 wifi 名称, 密码, 加密方式等.
香橙派自己并没有开启路由功能, 实现了本地局域网和互联网的安全隔离.

香橙派 zero3 不支持 WPA3 (SAE), 很遗憾.
`iwd` 有严重 BUG, 无法使用.

有了专用的 wifi 接入点之后, 各种物联网设备就可以愉快的上线啦 !
目前使用的认证方式是 WPA2 个人版,
未来还可以考虑 WPA2 企业版, 功能更强大.

----

本文使用 CC-BY-SA 4.0 许可发布.
