# 在容器 (podman) 中运行虚拟机 (QEMU/KVM, libvirt)

**虚拟机** (virtual machine) 是一种计算机的虚拟化技术,
**容器** (container) 是一种更轻量级的虚拟化技术.
虚拟机可以套娃 (嵌套, nest), 也就是在虚拟机中运行虚拟机.
容器也可以套娃, 比如 Docker in Docker, Podman in Podman, Podman in Docker 等.
容器和虚拟机也可以互相套娃, 比如在虚拟机中运行容器, 是可以的.

那么, 反过来, **在容器中运行虚拟机呢** ?

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 57 号作品. )

----

参考资料:

+ <https://www.redhat.com/sysadmin/podman-inside-container>
+ <https://libvirt.org/uri.html>
+ <https://github.com/virt-manager/virt-manager/issues/333>
+ <https://github.com/virt-manager/virt-manager/issues/592>
+ <https://virt-manager.org/>
+ <https://www.qemu.org/>

相关文章:

+ 《QEMU/KVM 虚拟机显卡透传 (vfio-pci)》

  TODO

+ 《香橙派: 在容器 (podman) 中运行 x11 图形界面》

  TODO

+ 《自制神之嘴: fish-speech 容器镜像 (文本转语音 AI 大模型)》

  TODO

+ 《基于 sftp 的 NAS (局域网文件存储服务器)》

  TODO

+ 《安装 Fedora CoreOS 操作系统》

  TODO


## 目录

+ 1 制作容器镜像

+ 2 运行测试

+ 3 总结与展望


## 1 制作容器镜像

使用的 `Dockerfile` 内容如下:

```sh
# alpine-qemu-libvirt
FROM quay.io/jitesoft/alpine:latest

RUN sed -i 's/ftp.halifax.rwth-aachen.de/mirrors.sjtug.sjtu.edu.cn/g' /etc/apk/repositories

RUN apk update && apk upgrade && \
    apk add curl bridge-utils \
            qemu qemu-block-curl qemu-block-ssh qemu-bridge-helper qemu-img qemu-system-x86_64 qemu-tools \
            libvirt libvirt-daemon libvirt-qemu && \
    apk cache clean

RUN cp /etc/libvirt/libvirtd.conf /etc/libvirt/libvirtd.conf.old && \
    cp /etc/libvirt/qemu.conf /etc/libvirt/qemu.conf.old
COPY ./libvirtd.conf /etc/libvirt/libvirtd.conf
COPY ./qemu.conf /etc/libvirt/qemu.conf

# libvirt 默认端口
EXPOSE 16509

# VOLUME /var/lib/libvirt/images

CMD /usr/sbin/virtlogd -d && /usr/sbin/libvirtd -l
#CMD /bin/ash
```

其中配置文件 `libvirtd.conf`:

```sh
listen_tls = 0
listen_tcp = 1

# !! 警告: 仅用于测试, 这个设置不安全 !! !
auth_tcp = "none"
```

其中配置文件 `qemu.conf`:

```sh
# 修复: Unable to set XATTR trusted.libvirt.security.dac on /var/lib/libvirt/qemu/domain-1-*/master-key.aes: Operation not permitted
# https://github.com/virt-manager/virt-manager/issues/333
remember_owner = 0
```

----

构建命令:

```sh
podman build -t alpine-qemu-libvirt .
```

保存镜像:

```sh
podman save alpine-qemu-libvirt | zstd > alpine-qemu-libvirt-20240828.tar.zst
```

在服务器上加载镜像:

```sh
fc-test@MiWiFi-RA74-srv:~$ ls -l alpine-qemu-libvirt-20240828.tar.zst
-r--r--r--. 1 fc-test fc-test 60481128 Aug 27 17:08 alpine-qemu-libvirt-20240828.tar.zst
fc-test@MiWiFi-RA74-srv:~$ podman load < alpine-qemu-libvirt-20240828.tar.zst
```

加载的镜像:

```sh
fc-test@MiWiFi-RA74-srv:~$ podman images
REPOSITORY                       TAG       IMAGE ID      CREATED       SIZE
localhost/alpine-qemu-libvirt    latest    3e1b75a9c069  12 hours ago  168 MB
```


## 2 运行测试

首先检查服务器 KVM 功能是否开启:

```sh
fc-test@MiWiFi-RA74-srv:~/tmp-libvirt$ id
uid=1002(fc-test) gid=1002(fc-test) groups=1002(fc-test) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
fc-test@MiWiFi-RA74-srv:~/tmp-libvirt$ ls -l /dev/kvm
crw-rw-rw-. 1 root kvm 10, 232 Aug 18 03:01 /dev/kvm
```

在服务器上运行容器:

```sh
podman run --rm --device /dev/kvm --device /dev/net/tun -v .:/var/lib/libvirt/images:z -p 16509:16509 -p 5900:5900 alpine-qemu-libvirt
```

在本机尝试连接服务器的 `libvirtd`:

```sh
> virsh -c qemu+tcp://fc-server.test/system list
 Id   名称   状态
-------------------

```

其中 `fc-server.test` 是服务器的 IP 地址.

----

在本机启动 `virt-manager`:

![测试 (1)](./图/2-v-1.png)

点击添加连接:

![测试 (2)](./图/2-v-2.png)

选择自定义 URI, 输入 `qemu+tcp://fc-server.test/system`, 确定:

![测试 (3)](./图/2-v-3.png)

成功连接:

![测试 (4)](./图/2-v-4.png)

----

创建虚拟机:

![创建 (1)](./图/2-vc-1.png)

选择系统安装光盘 iso 文件:

![创建 (2)](./图/2-vc-2.png)

注意勾选 **在安装前自定义配置**, 完成:

![创建 (3)](./图/2-vc-3.png)

如图所示进行配置, 注意删除网卡 (NIC), 配置 VNC 服务器的端口号:

![创建 (4)](./图/2-vc-4.png)

----

点击开始安装:

![安装 (1)](./图/2-vi-1.png)

这是 ArchLinux 安装光盘的启动界面.

![安装 (2)](./图/2-vi-2.png)

启动进入系统, 注意 KVM (`/dev/kvm`) 是启用的.

![安装 (3)](./图/2-vi-3.png)

执行 `lscpu` 命令, 注意鼠标指针指向的位置.
这表示系统在 QEMU/KVM 虚拟机中运行, 同时开启了 **嵌套虚拟化**
(也就是可以在虚拟机中运行虚拟机, 同样可以使用 KVM 硬件加速).

至此, 在容器 (podman) 中运行 QEMU/KVM 虚拟机, 测试成功.


## 3 总结与展望

本文验证了在容器中运行 QEMU/KVM 虚拟机是可行的,
可以正常使用 Linux 内核的 KVM 硬件加速.
podman 可以普通用户运行, 无需 root 权限, 所以普通用户也可以运行 QEMU/KVM 虚拟机.

但是 libvirt 不太适应容器内的环境 (也可能是不适应没有 root 权限),
BUG 和报错一大堆, 比如虚拟机的关机/重启功能严重故障, 直接卡死.
这个也可能是配置和使用方式不太对, 需要进一步分析具体的原因.
同时因为没有 root 权限, 虚拟机的网络功能也无法使用 (无法连网),
这个问题还没解决.

后续可以考虑不使用 libvirt, 直接使用 qemu-system 来运行虚拟机,
或许可以解决上述问题.
不过, 虚拟机和容器的互相疯狂套娃, 这里是达成了, 撒花 ~

----

本文使用 CC-BY-SA 4.0 许可发布.
