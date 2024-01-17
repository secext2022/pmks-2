# 香橙派安装 adguardhome (docker)

本文主要内容: 在香橙派 zero3 (1GB) 上安装 DNS 服务器 (adguardhome) 的过程.


## 目录

+ 1 香橙派安装 docker

+ 2 香橙派 IP 地址配置

+ 3 使用 docker 安装 adguardhome

+ 4 adguardhome 配置举例


## 1 香橙派安装 docker

测试设备: 香橙派 Orange pi Zero3 (内存 1GB, 处理器 全志 H618)

操作系统: Debian 12 (官方镜像, Linux 6.1)

安装操作系统此处不详细描述, 请见官方文档.

<http://www.orangepi.cn/html/hardWare/computerAndMicrocontrollers/details/Orange-Pi-Zero-3.html>

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
`d$$'     ,$P"'   .    $$$    Uptime: 3 days, 46 mins 
 $$P      d$'     ,    $$P    Packages: 1280 (dpkg) 
 $$:      $$.   -    ,d$$'    Shell: fish 3.6.0 
 $$;      Y$b._   _,d$P'      Resolution: 1920x1080 
 Y$$.    `.`"Y$$$$P"'         Terminal: /dev/pts/0 
 `$$b      "-.__              CPU: (4) @ 1.512GHz 
  `Y$$                        Memory: 491MiB / 981MiB 
   `Y$$.
     `$$b.                                            
       `Y$$b.                                         
          `"Y$b._
              `"""
```

----

+ (1) 安装 docker 的命令:

  ```
  > sudo apt install docker-ce
  ```

+ (2) 启用 docker 服务:

  ```
  orangepi@orangepizero3 ~> sudo systemctl enable docker
  Synchronizing state of docker.service with SysV service script with /lib/systemd/systemd-sysv-install.
  Executing: /lib/systemd/systemd-sysv-install enable docker
  Created symlink /etc/systemd/system/multi-user.target.wants/docker.service → /lib/systemd/system/docker.service.
  orangepi@orangepizero3 ~> sudo systemctl start docker
  ```

+ 查看服务状态:

  ```
  > systemctl status docker
  ```

验证安装:

```
orangepi@orangepizero3 ~> docker --version
Docker version 24.0.7, build afdd53b
orangepi@orangepizero3 ~> docker ps
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```


## 2 香橙派 IP 地址配置

注意: 此处描述的方法是为了满足下述需求, 如果不需要这种, 可以跳过本章节.

需求: 除了自动获取 IP 地址之外, 给香橙派再增加一个固定 IP 地址.

+ (1) 查看网络接口:

  ```
  orangepi@orangepizero3 ~> ip link
  1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
  2: end0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP mode DEFAULT group default qlen 1000
    link/ether 02:00:ac:d3:90:e3 brd ff:ff:ff:ff:ff:ff
  ```

  此处有线以太网接口的名称是 `end0`

+ (2) 创建文件, 内容如下:

  ```
  > cat /etc/NetworkManager/dispatcher.d/90-addip.sh 
  #!/bin/sh -e
  # add a static ip after interface up

  if [ "x$1" = "xend0" ] && [ "x$2" = "xup" ]; then
     ip addr add 192.168.1.2/24 dev end0
  fi
  ```

  香橙派默认使用 `NetworkManager` 管理网络接口,
  上面这个脚本在每次 `end0` 接口启动时执行 `ip` 命令,
  添加固定 IP 地址 `192.168.1.2/24`

  启用脚本:

  ```
  orangepi@orangepizero3 ~> sudo chmod +x /etc/NetworkManager/dispatcher.d/90-addip.sh 
  orangepi@orangepizero3 ~> ls -l /etc/NetworkManager/dispatcher.d/90-addip.sh
  -rwxr-xr-x 1 root root 150 Jan 18 06:27 /etc/NetworkManager/dispatcher.d/90-addip.sh*
  ```

+ (3) 重启:

  ```
  > sudo systemctl reboot
  ```

  验证配置:

  ```
  orangepi@orangepizero3 ~> ip addr show end0
  2: end0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
      link/ether 02:00:ac:d3:90:e3 brd ff:ff:ff:ff:ff:ff
      inet 192.168.1.36/24 brd 192.168.1.255 scope global dynamic noprefixroute end0
         valid_lft 259139sec preferred_lft 259139sec
      inet 192.168.1.2/24 scope global secondary end0
         valid_lft forever preferred_lft forever
  ```

  可以看到, 除了通过 DHCP 自动获取的 IP 地址 `192.168.1.36/24` 之外,
  还有我们添加的固定 IP 地址 `192.168.1.2/24`


## 3 使用 docker 安装 adguardhome

+ docker 镜像默认已经配置好了:

  ```
  orangepi@orangepizero3 ~> cat /etc/docker/daemon.json
  {
    "registry-mirrors": [
      "https://docker.mirrors.ustc.edu.cn"
    ]
  }
  ```

+ (1) 拉取 adguardhome 镜像:

  ```
  > docker pull adguard/adguardhome
  ```

  查看下载好的镜像:

  ```
  orangepi@orangepizero3 ~> docker images
  REPOSITORY            TAG       IMAGE ID       CREATED       SIZE
  adguard/adguardhome   latest    e94d62700da6   5 weeks ago   66.8MB
  ```

+ (2) 创建本地目录 (用于配置和数据):

  ```
  > sudo mkdir -p /opt/adguardhome/conf
  > sudo mkdir -p /opt/adguardhome/work
  ```

+ (3) 禁用 dnsmasq 服务:

  ```
  orangepi@orangepizero3 ~> sudo systemctl disable dnsmasq
  Synchronizing state of dnsmasq.service with SysV service script with /lib/systemd/systemd-sysv-install.
  Executing: /lib/systemd/systemd-sysv-install disable dnsmasq
  Removed "/etc/systemd/system/multi-user.target.wants/dnsmasq.service".
  orangepi@orangepizero3 ~> sudo systemctl stop dnsmasq
  ```

+ (4) 安装并启动 (创建容器):

  ```
  > docker run --name adguardhome \
  --restart unless-stopped \
  -v /opt/adguardhome/conf:/opt/adguardhome/conf \
  -v /opt/adguardhome/work:/opt/adguardhome/work \
  -p 53:53/tcp -p 53:53/udp \
  -p 80:80/tcp -p 443:443/tcp -p 443:443/udp -p 3000:3000/tcp \
  -p 853:853/tcp \
  -p 784:784/udp -p 853:853/udp -p 8853:8853/udp \
  -p 5443:5443/tcp -p 5443:5443/udp \
  -d adguard/adguardhome
  ```

+ 查看运行中的实例:

  ```
  > docker ps
  ```


## 4 adguardhome 配置举例

+ (1) 初始化配置 (设置用户名密码):

  访问 `http://192.168.1.2:3000`

  TODO

+ (2) 配置屏蔽域名.

  此处以 `www.baidu.com` 举例:

  TODO

+ (3) 测试配置:

  ```
  > ping www.baidu.com
  PING www.baidu.com (127.0.0.1) 56(84) 字节的数据。
  64 字节，来自 localhost (127.0.0.1): icmp_seq=1 ttl=64 时间=0.036 毫秒
  64 字节，来自 localhost (127.0.0.1): icmp_seq=2 ttl=64 时间=0.120 毫秒
  64 字节，来自 localhost (127.0.0.1): icmp_seq=3 ttl=64 时间=0.138 毫秒
  ```

  ```
  > dig www.baidu.com

  ; <<>> DiG 9.18.21 <<>> www.baidu.com
  ;; global options: +cmd
  ;; Got answer:
  ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 23940
  ;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0

  ;; QUESTION SECTION:
  ;www.baidu.com.			IN	A

  ;; ANSWER SECTION:
  www.baidu.com.		10	IN	A	127.0.0.1

  ;; Query time: 1 msec
  ;; SERVER: 192.168.1.2#53(192.168.1.2) (UDP)
  ;; WHEN: Thu Jan 18 07:11:13 CST 2024
  ;; MSG SIZE  rcvd: 47
  ```

  可以看到, 配置已经生效了.

TODO
