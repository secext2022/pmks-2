# 安装 Fedora CoreOS 操作系统

有一台吃灰几年的 e5-26v3 古老机器, 最近翻出来用一下.
首先从安装操作系统开始.


## 目录

+ 1 FCOS 简介

+ 2 安装过程

  - 2.1 下载 iso 镜像文件并制作安装 U 盘
  - 2.2 编写安装配置文件
  - 2.3 编译安装配置文件
  - 2.4 从 U 盘启动并安装

+ 3 SSH 连接并测试

+ 4 总结与展望


## 1 FCOS 简介

Fedora CoreOS (简称 `fcos`) 是一个适用于服务器的 GNU/Linux 操作系统.

fcos 是一个基于 `rpm-ostree` 的不可变发行版本, 整个系统是一个只读镜像.
不同于大部分 GNU/Linux 的软件包管理方式,
fcos 的基础系统镜像作为一个整体进行安装/测试/升级.

fcos 系统镜像很小, `iso` 安装文件不到 1GB.
系统干净, 安装的软件少, 可以减少潜在的未知安全漏洞数量, 减小攻击面,
提高安全性.

fcos 系统的安装非常简单方便, 只需一条命令 (类似于一键安装) !
系统升级是全自动的, 经常升级系统有助于对抗已知安全漏洞攻击.

fcos 不建议使用传统的软件包 (RPM) 方式安装软件,
推荐使用容器 (`podman`) 运行负载应用.

参考资料:
+ <https://fedoraproject.org/coreos/>
+ <https://coreos.github.io/rpm-ostree/>


## 2 安装过程

### 2.1 下载 iso 镜像文件并制作安装 U 盘

下载地址: <https://fedoraproject.org/coreos/download>

![下载页面 (1)](./图/2-iso-1.png)

![下载页面 (2)](./图/2-iso-2.png)

下载 `Live DVD`, 下载之后:

```sh
> ls -lh fedora-coreos-40.20240519.3.0-live.x86_64.iso
-r--r--r-- 1 s2 s2 813M  6月15日 12:09 fedora-coreos-40.20240519.3.0-live.x86_64.iso
```

----

安装 `Fedora Media Writer`: <https://flathub.org/zh-Hans/apps/org.fedoraproject.MediaWriter>

准备一个总容量不小于 2GB 的 U 盘.

**注意: 制作过程会删除 U 盘上的全部数据文件, 请提前备份重要数据 !!**

![制作安装 U 盘](./图/2-u-1.png)

选择下载好的 iso 镜像文件, 以及 U 盘, 点击 `写入` 开始制作.

### 2.2 编写安装配置文件

首先, 需要编写一个 fcos 安装配置文件, 比如 `fc-server.bu` (YAML 格式):

```yaml
variant: fcos
version: 1.5.0
passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICHaotVMdOfQrHe4bEYtjAuzQr3LdIqYlDu0sgcKLXHD fc-server-202406
storage:
  files:
    - path: /etc/zincati/config.d/55-updates-strategy.toml
      contents:
        inline: |
          [updates]
          strategy = "periodic"
          [[updates.periodic.window]]
          days = [ "Tue", "Thu", "Sun" ]
          start_time = "03:00"
          length_minutes = 120
```

+ (1) 生成 SSH 密钥, 比如:

  ```sh
  ssh-keygen -t ed25519 -C fc-server-202406 -f ~/.ssh/id_ed25519-fc-server-202406
  ```

  其中 `-t` 指定密钥格式 (公钥算法), `-C` 指定注释, `-f` 指定私钥存储路径.

  生成的公钥:

  ```sh
  > cat ~/.ssh/id_ed25519-fc-server-202406.pub
  ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICHaotVMdOfQrHe4bEYtjAuzQr3LdIqYlDu0sgcKLXHD fc-server-202406
  ```

  注意以 `.pub` 结尾的是 **公钥**, 另一个文件是私钥.

  **请注意保管私钥文件, 千万不要泄露 !**

  ----

  fcos 系统直接使用 SSH 公钥登录 (认证), 完全不使用落后的用户名/密码方式,
  可以显著提高安全性.

+ (2) 自动更新的重启时间窗口配置 (可选).

  对应配置文件: `/etc/zincati/config.d/55-updates-strategy.toml`

  ```toml
  [updates]
  strategy = "periodic"
  [[updates.periodic.window]]
  days = [ "Tue", "Thu", "Sun" ]
  start_time = "03:00"
  length_minutes = 120
  ```

  此处配置的重启时间窗口是: 周二, 周四, 周日, 北京时间 11:00 ~ 13:00 (UTC+0800, CST).

  需要注意配置文件中写的是协调世界时 (UTC), 需要换算时区.

  服务器只有在时间窗口内才会重启, 这样可以避免在不确定的时间突然重启.
  (默认自动更新配置是下载更新后立即重启)

----

参考资料:
+ <https://docs.fedoraproject.org/en-US/fedora-coreos/producing-ign/>
+ <https://docs.fedoraproject.org/en-US/fedora-coreos/auto-updates/>
+ <https://coreos.github.io/zincati/usage/updates-strategy/>

### 2.3 编译安装配置文件

有多种具体的方式, 此处介绍的是窝觉得比较方便的一种.

+ (1) 安装 `toolbox`: <https://containertoolbx.org/>

  ```sh
  > toolbox --version
  toolbox version 0.0.99.5
  ```

+ (2) 创建 fedora 容器:

  ```sh
  > toolbox create -d fedora -r 40
  Image required to create toolbox container.
  Download registry.fedoraproject.org/fedora-toolbox:40? [y/N]: y
  Created container: fedora-toolbox-40
  Enter with: toolbox enter fedora-toolbox-40
  > toolbox list
  IMAGE ID      IMAGE NAME                                    CREATED
  2e494d43af40  registry.fedoraproject.org/fedora-toolbox:40  22 hours ago

  CONTAINER ID  CONTAINER NAME        CREATED         STATUS   IMAGE NAME
  671f941552d5  fedora-toolbox-40     17 seconds ago  created  registry.fedoraproject.org/fedora-toolbox:40
  ```

+ (3) 安装 `butane` 工具:

  ```sh
  > toolbox enter fedora-toolbox-40
  ⬢[s2@toolbox ~]$ sudo dnf install -y butane
  ```

  版本信息:

  ```sh
  ⬢[s2@toolbox ~]$ butane --version
  Butane 0.20.0
  ```

+ (4) 进行编译:

  ```sh
  ⬢[s2@toolbox ~]$ butane --pretty --strict fc-server.bu > fc-server.ign
  ```

  生成文件:

  ```json
  > cat fc-server.ign
  {
    "ignition": {
      "version": "3.4.0"
    },
    "passwd": {
      "users": [
        {
          "name": "core",
          "sshAuthorizedKeys": [
            "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICHaotVMdOfQrHe4bEYtjAuzQr3LdIqYlDu0sgcKLXHD fc-server-202406"
          ]
        }
      ]
    },
    "storage": {
      "files": [
        {
          "path": "/etc/zincati/config.d/55-updates-strategy.toml",
          "contents": {
            "compression": "",
            "source": "data:;base64,W3VwZGF0ZXNdCnN0cmF0ZWd5ID0gInBlcmlvZGljIgpbW3VwZGF0ZXMucGVyaW9kaWMud2luZG93XV0KZGF5cyA9IFsgIlR1ZSIsICJUaHUiLCAiU3VuIiBdCnN0YXJ0X3RpbWUgPSAiMDM6MDAiCmxlbmd0aF9taW51dGVzID0gMTIwCg=="
          }
        }
      ]
    }
  }
  ```

### 2.4 从 U 盘启动并安装

**注意: 安装系统会删除整个目标硬盘 (包括所有分区) 上的所有数据, 请提前备份重要文件 !!**

**注意: 安装系统会删除整个目标硬盘 (包括所有分区) 上的所有数据, 请提前备份重要文件 !!**

**注意: 安装系统会删除整个目标硬盘 (包括所有分区) 上的所有数据, 请提前备份重要文件 !!**

+ (1) 将上面制作好的安装 U 盘插在目标机器上, 然后从 U 盘启动.
  可能需要修改主板的 BIOS (UEFI) 启动设置.

  启动之后, 查看硬盘设备:

  ```sh
  $ sudo fdisk -l
  Disk /dev/nvme0n1: 476.94 GiB, 512110190592 bytes, 1000215216 sectors
  Disk model: KINGBANK KP230                          
  Units: sectors of 1 * 512 = 512 bytes
  Sector size (logical/physical): 512 bytes / 512 bytes
  I/O size (minimum/optimal): 512 bytes / 512 bytes
  Disklabel type: gpt
  ```

  这里计划安装到 M.2 SSD 设备上, 名称 `/dev/nvme0n1`.

+ (2) 下载上面编译好的 `fc-server.ign` 文件:

  ```sh
  $ curl -O http://192.168.31.12:4507/fc-server.ign
    % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                  Dload  Upload   Total   Spent    Left  Speed
  100   678  100   678    0     0  29652      0 --:--:-- --:--:-- --:--:-- 30818
  $ ls -l fc-server.ign
  -rw-r--r--. 1 core core 678 Jun 15 06:40 fc-server.ign
  ```

+ (3) 执行安装 ! (只需一条命令)

  ```sh
  sudo coreos-installer install /dev/nvme0n1 -i fc-server.ign
  ```

  安装很快完成, 然后重启:

  ```sh
  reboot
  ```

  记得拔掉安装 U 盘, 从新系统启动.

参考资料: <https://docs.fedoraproject.org/en-US/fedora-coreos/bare-metal/>


## 3 SSH 连接并测试

本机 SSH 配置 (从这里发起 SSH 连接):

```sh
> cat ~/.ssh/config
Host fc-server
    HostName 192.168.31.2
    User core
    IdentityFile ~/.ssh/id_ed25519-fc-server-202406
```

其中 `HostName` 填写服务器的 IP 地址, `IdentityFile` 是自己的私钥文件.

然后连接服务器, 并查看系统版本:

```sh
> ssh fc-server
Fedora CoreOS 40.20240519.3.0
Tracker: https://github.com/coreos/fedora-coreos-tracker
Discuss: https://discussion.fedoraproject.org/tag/coreos

Last login: Sat Jun 15 06:20:26 2024 from 192.168.31.12
core@MiWiFi-RA74-srv:~$ rpm-ostree status
State: idle
AutomaticUpdatesDriver: Zincati
  DriverState: active; periodically polling for updates (last checked Sat 2024-06-15 06:16:27 UTC)
Deployments:
● fedora:fedora/x86_64/coreos/stable
                  Version: 40.20240519.3.0 (2024-06-04T23:21:15Z)
                   Commit: 724ce262d4a27f6b7cb1508e8737e2244d69bb78509d2749cebd7972042bf814
             GPGSignature: Valid signature by 115DF9AEF857853EE8445D0A0727707EA15B79CC
core@MiWiFi-RA74-srv:~$ 
```

一些基础的系统信息:

```sh
core@MiWiFi-RA74-srv:~$ id
uid=1000(core) gid=1000(core) groups=1000(core),4(adm),10(wheel),16(sudo),190(systemd-journal) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
core@MiWiFi-RA74-srv:~$ pwd
/var/home/core
core@MiWiFi-RA74-srv:~$ uname -a
Linux MiWiFi-RA74-srv 6.8.9-300.fc40.x86_64 #1 SMP PREEMPT_DYNAMIC Thu May  2 18:59:06 UTC 2024 x86_64 GNU/Linux
core@MiWiFi-RA74-srv:~$ getenforce
Enforcing
core@MiWiFi-RA74-srv:~$ free -h
               total        used        free      shared  buff/cache   available
Mem:            31Gi       704Mi        30Gi       9.3Mi       196Mi        30Gi
Swap:             0B          0B          0B
core@MiWiFi-RA74-srv:~$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p4  477G   11G  466G   3% /sysroot
devtmpfs        4.0M     0  4.0M   0% /dev
tmpfs            16G     0   16G   0% /dev/shm
efivarfs        120K   83K   33K  72% /sys/firmware/efi/efivars
tmpfs           6.3G  9.3M  6.3G   1% /run
tmpfs            16G     0   16G   0% /tmp
/dev/nvme0n1p3  350M  112M  216M  35% /boot
tmpfs           3.2G  4.0K  3.2G   1% /run/user/1000
core@MiWiFi-RA74-srv:~$ 
```

CPU 信息:

```sh
core@MiWiFi-RA74-srv:~$ lscpu
Architecture:             x86_64
  CPU op-mode(s):         32-bit, 64-bit
  Address sizes:          46 bits physical, 48 bits virtual
  Byte Order:             Little Endian
CPU(s):                   20
  On-line CPU(s) list:    0-9
  Off-line CPU(s) list:   10-19
Vendor ID:                GenuineIntel
  Model name:             Intel(R) Xeon(R) CPU E5-2650 v3 @ 2.30GHz
    CPU family:           6
    Model:                63
    Thread(s) per core:   1
    Core(s) per socket:   10
    Socket(s):            1
    Stepping:             2
    CPU(s) scaling MHz:   47%
    CPU max MHz:          3000.0000
    CPU min MHz:          0.0000
    BogoMIPS:             4589.41
    Flags:                fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge m
                          ca cmov pat pse36 clflush dts acpi mmx fxsr sse sse2 s
                          s ht tm pbe syscall nx pdpe1gb rdtscp lm constant_tsc 
                          arch_perfmon pebs bts rep_good nopl xtopology nonstop_
                          tsc cpuid aperfmperf pni pclmulqdq dtes64 monitor ds_c
                          pl vmx smx est tm2 ssse3 sdbg fma cx16 xtpr pdcm pcid 
                          dca sse4_1 sse4_2 x2apic movbe popcnt tsc_deadline_tim
                          er aes xsave avx f16c rdrand lahf_lm abm cpuid_fault e
                          pb pti intel_ppin ssbd ibrs ibpb stibp tpr_shadow flex
                          priority ept vpid ept_ad fsgsbase tsc_adjust bmi1 avx2
                           smep bmi2 erms invpcid cqm xsaveopt cqm_llc cqm_occup
                          _llc dtherm ida arat pln pts vnmi md_clear flush_l1d
Virtualization features:  
  Virtualization:         VT-x
Caches (sum of all):      
  L1d:                    320 KiB (10 instances)
  L1i:                    320 KiB (10 instances)
  L2:                     2.5 MiB (10 instances)
  L3:                     25 MiB (1 instance)
NUMA:                     
  NUMA node(s):           1
  NUMA node0 CPU(s):      0-9
Vulnerabilities:          
  Gather data sampling:   Not affected
  Itlb multihit:          KVM: Mitigation: VMX disabled
  L1tf:                   Mitigation; PTE Inversion; VMX conditional cache flush
                          es, SMT disabled
  Mds:                    Mitigation; Clear CPU buffers; SMT disabled
  Meltdown:               Mitigation; PTI
  Mmio stale data:        Mitigation; Clear CPU buffers; SMT disabled
  Reg file data sampling: Not affected
  Retbleed:               Not affected
  Spec rstack overflow:   Not affected
  Spec store bypass:      Mitigation; Speculative Store Bypass disabled via prct
                          l
  Spectre v1:             Mitigation; usercopy/swapgs barriers and __user pointe
                          r sanitization
  Spectre v2:             Mitigation; Retpolines; IBPB conditional; IBRS_FW; RSB
                           filling; PBRSB-eIBRS Not affected; BHI Not affected
  Srbds:                  Not affected
  Tsx async abort:        Not affected
core@MiWiFi-RA74-srv:~$ 
```

----

运行容器应用 (podman):

相关文章: 《构建 deno/fresh 的 docker 镜像》

TODO

加载容器镜像:

```sh
core@MiWiFi-RA74-srv:~$ ls -lh my-app.tar.zst
-rw-r--r--. 1 core core 77M Jun 15 07:22 my-app.tar.zst
core@MiWiFi-RA74-srv:~$ podman load < my-app.tar.zst 
Getting image source signatures
Copying blob 90ec6ab34ce0 done   | 
Copying blob a62d4638ad90 done   | 
Copying blob 31e29b5ab918 done   | 
Copying blob c83c49512daf done   | 
Copying blob ff9964444958 done   | 
Copying blob 6389ca351a5d done   | 
Copying blob 2ca6496c9f8b done   | 
Copying config 83173f90cc done   | 
Writing manifest to image destination
Loaded image: docker.io/library/my-app:latest
core@MiWiFi-RA74-srv:~$ podman images
REPOSITORY                TAG         IMAGE ID      CREATED     SIZE
docker.io/library/my-app  latest      83173f90cca5  2 days ago  238 MB
core@MiWiFi-RA74-srv:~$ 
```

运行容器:

```sh
core@MiWiFi-RA74-srv:~$ podman run -it -p 8000:8000 my-app
Using snapshot found at /app/_fresh
 🍋 Fresh ready  Local: http://localhost:8000/
```

![测试页面](./图/3-t-1.png)

参考资料: <https://podman.io/docs>


## 4 总结与展望

fcos 是一个干净 (小) 且安全的服务器操作系统, 安装非常简单只需一条命令, 自动更新.
fcos 推荐使用容器 (podman) 运行应用.

安装之前的准备工作有: 下载 iso 镜像 (只有 813MB), 制作安装 U 盘,
编写/编译安装配置文件 (.ign).
需要生成自己的 SSH 密钥 (用于连接/登录服务器),
注意配置自动更新的重启时间窗口, 避免服务器突然重启.

刚装好的 (空的) 系统大约占用 800MB 内存和 12GB 硬盘空间,
对硬件配置性能的要求不高.

有了服务器, 未来就可以部署各种基于服务器的应用啦.

----

本文使用 CC-BY-SA 4.0 许可发布.
