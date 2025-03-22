# 香橙派配置 VLAN (802.1q)

VLAN 是一种网络虚拟化技术, 可以简单理解为网络的分身术或精神分裂术.

窝家的局域网稍微有点复杂, 有 2 个网段.
想让香橙派能够同时直接访问这 2 个网段, 但是香橙派只有一个网口,
怎么办 ?
VLAN !


## 目录

+ 1 什么是 VLAN (802.1q)

+ 2 窝的局域网结构

+ 3 交换机配置 VLAN

+ 4 香橙派配置 VLAN

+ 5 wifi 路由器的配置

+ 6 总结与展望


## 1 什么是 VLAN (802.1q)

VLAN (虚拟局域网) 是一种网络 **虚拟化** 技术.
类似于虚拟机技术, 可以把一台物理计算机 (CPU, 内存, 硬盘等资源)
划分成多个虚拟机 (逻辑计算机).
VLAN 可以把一个物理网络 (交换机, 网线, 网口等)
划分成多个互相隔离的逻辑网络.

计算机网络 (分组交换网络) 的协议体系结构符合 ISO/OSI
(国际标准化组织/开放系统互联) 的 7 层参考模型, 如图:

![网络协议分层模型](../图/20240124-7/1-osi.jpg)

左侧是参考模型的各层, 右侧是一些常见的网络协议和对应的层.
分组交换网络的工作方式是, 通过发送一个个小的数据包 (比如 1500 字节)
来传输数据.

VLAN 工作在第 2 层 (数据链路层), 有多种具体的 VLAN 技术,
其中常用的是 **IEEE 802.1q** 协议.
本文所说的 VLAN 就是指 802.1q.

802.1q 通过在以太网数据包载荷的头部增加 4 字节的标记,
来区分一个数据包属于哪个 VLAN.
802.1q VLAN 号 (vlan id) 的取值范围是 1 ~ 4094,
也就是最多可以定义 4094 个不同的 VLAN.
默认的 VLAN 是 vlan 1.


## 2 窝的局域网结构

窝家的物理网络结构 (拓扑图) 如图:

![物理网络结构图](../图/20240124-7/2-hnt-1.jpg)

(绘制软件: LibreOffice Draw
<https://www.libreoffice.org/discover/draw/>)
(图标库: VRT
<https://www.vrt.com.au/downloads/vrt-network-equipment>)

![交换机接线](../图/20240124-7/2-hnt-2.jpg)

交换机接线如图:
端口 1 连接光猫, 端口 3 连接 wifi 路由器 WAN 口,
端口 7 连接香橙派 zero3, 端口 9 连接 wifi 路由器 LAN 口,
端口 11 连接窝的 PC.

注意无线路由器与交换机通过 2 根网线连接, 一根连 WAN 口, 一根连 LAN 口.

----

在解释这个网络结构之前, 先假设以下前提条件:
(1) 光猫来自宽带运营商 (ISP), 难以修改配置.
(2) 无线路由器是普通的 wifi 6 路由器, 无法刷机安装 OpenWrt 系统.
如果这些条件不成立, 很可能就是另一种玩法了.

光猫本身充当一个路由器, 进行 PPPoE 拨号上网, 其下面的网段是 `192.168.1.0/24`.
无线路由器也是一个路由器, 其 WAN 口连接光猫, LAN 口的网段是 `192.168.31.0/24`.
也就是说, 无线路由器把整个局域网分隔成 2 个网段.

香橙派作为 DNS 服务器, 希望可以直接访问 2 个网段 (不经过路由器).

相关文章: 《香橙派安装 adguardhome (docker)》
TODO

为了实现这个目标, 一种简单粗暴的方法是, 有 2 个物理网口,
分别连接这 2 个网段, 比如:

![双网口的机器](../图/20240124-7/2-orangepi-r1-plus-lts.jpg)

(来源: Orange pi R1 plus lts
<http://www.orangepi.cn/html/hardWare/computerAndMicrocontrollers/details/Orange-Pi-R1-Plus-LTS.html>)

然而, 香橙派 zero3 只有一个千兆网口:

![Orange pi Zero3](../图/20240124-7/2-opi-zero3.jpg)

(来源: <http://www.orangepi.cn/html/hardWare/computerAndMicrocontrollers/details/Orange-Pi-Zero-3.html>)

也可以通过再接一个 USB 网卡来获得双网口, 但是存在一些问题:
(1) USB 网卡相对更不稳定, 也额外增加了成本.
(2) 香橙派 zero3 的 USB 接口是 USB 2.0, 带宽只有 480Mbps, 无法达到千兆.

实际上也没必要, 因为有 VLAN 这种网络虚拟化技术,
可以把一个物理网口变成 2 个网口 !


## 3 交换机配置 VLAN

注意: 需要确认使用的交换机是否支持 VLAN 功能.

802.1q 有多种具体的配置方式, 其中最简单的一种是根据交换机端口划分 VLAN.
也就是把不同的交换机端口分给不同的 VLAN.

![交换机端口配置](../图/20240124-7/3-vlan-1.jpg)

交换机端口配置如图.

![交换机 PVID 配置](../图/20240124-7/3-vlan-2.jpg)

PVID 配置如图.

----

此处一共有 2 个 VLAN,
其中 vlan 1 对应网段 `192.168.31.0/24`, 也就是无线路由器下面.
vlan 100 对应网段 `192.168.1.0/24`, 也就是光猫下面.

无标记 (untagged) 端口发出的数据包, 就是普通的数据包, 不带 802.1q 的标记.
标记 (tagged) 端口发出的数据包, 带有 802.1q 标记.
PVID 的意思是, 端口接收的数据包, 如果不带 802.1q 标记, 属于哪个 VLAN.

端口 1 ~ 6 分配给 vlan 100, 具体配置是 vlan 100 无标记端口, 同时 PVID 为 100.
也就是说, 交换机把属于 vlan 100 的数据包从 1 ~ 6 端口发出, 不带标记.
交换机收到 1 ~ 6 端口的普通数据包, 就认为是属于 vlan 100 的.

类似的, 端口 8 ~ 24 分配给 vlan 1, 具体配置是 vlan 1 无标记端口, 同时 PVID 为 1.

比较特殊的是端口 7, 同时属于 vlan 1 和 vlan 100.
端口 7 配置为 vlan 1 无标记端口, 以及 vlan 100 标记端口, PVID 为 1.
也就是说, 端口 7 收发普通数据包时, 相当于 vlan 1,
而对于 vlan 100 的数据包则带有 802.1q 标记.

![交换机接线](../图/20240124-7/2-hnt-2.jpg)

再来看一眼交换机的端口接线.
端口 1, 3 分别连接光猫和无线路由器 WAN 口, 属于 vlan 100,
对应网段 `192.168.1.0/24`.
端口 9, 11 分别连接无线路由器 LAN 口和窝的 PC, 属于 vlan 1,
对应网段 `192.168.31.0/24`.

端口 7 连接香橙派 zero3, 同时属于 vlan 1 和 vlan 100.
所以香橙派能直接访问这两个网段.

----

对于 802.1q 协议来说, 交换机必须知道 VLAN 的存在.
交换机能够见到的数据包对应的每一个 VLAN 都要在交换机上进行配置.

然而无标记端口连接的设备, 可以根本不知道 VLAN 的存在,
因为收发的都是普通数据包, 不带 802.1q 标记.
比如上面的光猫和 PC, 并不知道 VLAN 的存在.

上面的无线路由器, 其 WAN 口和 LAN 口分别连接两个 VLAN 的无标记端口,
无线路由器也不知道 VLAN 的存在.

香橙派则需要知道 VLAN 的存在, 因为除了收发普通数据包 (属于 vlan 1),
还会收发带标记的数据包 (vlan 100).


## 4 香橙派配置 VLAN

测试设备: 香橙派 Orange pi Zero3 (内存 1GB, 处理器 全志 H618)

操作系统: Debian 12 (官方镜像, Linux 6.1)

Linux 的网络功能是非常强大的,
配置一个简单的 VLAN (802.1q) 自然也是小菜一碟.

+ (1) 查看网络接口:

  ```
  orangepi@orangepizero3 ~> ip link
  1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
      link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
  2: end0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP mode DEFAULT group default qlen 1000
      link/ether 02:00:ac:d3:90:e3 brd ff:ff:ff:ff:ff:ff
  ```

  以太网接口的名称是 `end0`

+ (2) 创建配置文件, 如下:

  ```
  orangepi@orangepizero3 ~> ls -al /etc/systemd/network
  total 20
  drwxr-xr-x 2 root root 4096 Jan 21 20:49 ./
  drwxr-xr-x 5 root root 4096 Jan 21 20:44 ../
  -rw-r--r-- 1 root root   89 Jan 21 20:04 10-end0.network
  -rw-r--r-- 1 root root   48 Jan 21 19:59 20-end0.100.netdev
  -rw-r--r-- 1 root root   58 Jan 21 20:49 30-end0.100.network
  orangepi@orangepizero3 ~> cat /etc/systemd/network/10-end0.network
  [Match]
  Name=end0

  [Network]
  VLAN=end0.100
  DHCP=yes

  [Address]
  Address=192.168.31.2/24
  orangepi@orangepizero3 ~> cat /etc/systemd/network/20-end0.100.netdev
  [NetDev]
  Name=end0.100
  Kind=vlan

  [VLAN]
  Id=100
  orangepi@orangepizero3 ~> cat /etc/systemd/network/30-end0.100.network
  [Match]
  Name=end0.100

  [Address]
  Address=192.168.1.2/24
  orangepi@orangepizero3 ~>
  ```

  网络接口 `end0` 除了无标记数据包 (untagged) 之外,
  还加入 `vlan 100` (tagged), 对应的虚拟接口名称 `end0.100`

  分别为 `end0` 和 `end0.100` 配置了固定 IP 地址,
  并在 `end0` 上启用了 DHCP (自动获取 IP 地址).

+ (3) 禁用 `NetworkManager` 服务:

  ```sh
  sudo systemctl disable NetworkManager
  sudo systemctl stop NetworkManager
  ```

  多个网络管理服务会互相冲突, 同时只能使用一个.

+ (4) 启用 `systemd-networkd` 服务:

  ```sh
  sudo systemctl enable systemd-networkd
  ```

  重启:

  ```sh
  sudo systemctl reboot
  ```

+ 验证配置:

  ```
  orangepi@orangepizero3 ~> ip addr
  1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
      link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
      inet 127.0.0.1/8 scope host lo
        valid_lft forever preferred_lft forever
      inet6 ::1/128 scope host noprefixroute 
        valid_lft forever preferred_lft forever
  2: end0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
      link/ether 02:00:ac:d3:90:e3 brd ff:ff:ff:ff:ff:ff
      inet 192.168.31.2/24 brd 192.168.31.255 scope global end0
        valid_lft forever preferred_lft forever
      inet 192.168.31.214/24 metric 1024 brd 192.168.31.255 scope global secondary dynamic end0
        valid_lft 150457sec preferred_lft 150457sec
      inet6 fe80::acff:fed3:90e3/64 scope link 
        valid_lft forever preferred_lft forever
  4: end0.100@end0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
      link/ether 02:00:ac:d3:90:e3 brd ff:ff:ff:ff:ff:ff
      inet 192.168.1.2/24 brd 192.168.1.255 scope global end0.100
        valid_lft forever preferred_lft forever
      inet6 fe80::acff:fed3:90e3/64 scope link 
        valid_lft forever preferred_lft forever
  ```

  可以看到两个网络接口 `end0` (vlan 1), `end0.100` (vlan 100).
  其中 `192.168.31.2/24` 和 `192.168.1.2/24` 是固定分配的 IP 地址, `192.168.31.214/24` 是 `end0` 通过 DHCP 获取的 IP 地址.

----

参考资料:

+ <https://wiki.archlinux.org/title/VLAN>


## 5 wifi 路由器的配置

如图:

![无线路由器配置](../图/20240124-7/5-rc.jpg)

无线路由器下面的网段是 `192.168.31.0/24`,
无线路由器 LAN 口的 IP 地址是 `192.168.31.1`.

通过 DHCP 把 DNS 服务器的地址设置为 `192.168.31.2`,
也就是香橙派的 IP 地址.
这样设置之后, 无线路由器下面接入的设备,
无需任何设置, 便会使用香橙派作为 DNS 服务器.


## 6 总结与展望

wifi 路由器把局域网分隔成 2 个网段,
香橙派 zero3 作为 DNS 服务器, 想要直接访问这 2 个网段,
但是只有一个物理千兆网口.
通过配置 VLAN (802.1q), 把这一个物理网口变成 2 个逻辑网口,
从而实现了目标.

如果想用某设备作为路由器, 但是只有一个物理网口, 也可以使用类似的方案.
并且相比两个物理网口的方案, 网络性能基本没有下降,
因为千兆以太网的工作方式是全双工.

VLAN 是一种强大好用的网络虚拟化技术,
可以用少量的硬件支撑起无限的可能.

----

本文使用 CC-BY-SA 4.0 许可发布.
