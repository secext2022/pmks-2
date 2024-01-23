# 香橙派配置 VLAN (802.1q)

TODO


## 目录

+ 1 什么是 VLAN (802.1q)

+ 2 窝的局域网结构

+ 3 交换机配置 VLAN

+ 4 香橙派配置 VLAN

+ 5 wifi 路由器的配置

+ 6 总结与展望


## 1 什么是 VLAN (802.1q)

TODO


## 2 窝的局域网结构

TODO


## 3 交换机配置 VLAN

TODO


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

TODO


## 6 总结与展望

TODO
