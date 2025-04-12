# 制作一个 rpm 软件包

本文以 `ibrus` (艾刷, 胖喵拼音 ibus 接口模块) 为例,
介绍 rpm 软件包的制作过程.

----

相关文章:

+ 《发布 AUR 软件包 (ArchLinux)》

  TODO

+ 《多种双拼方案的实现》

  TODO


## 目录

+ 1 问题背景

+ 2 创建 rpm 软件包

+ 3 测试

+ 4 总结与展望


## 1 问题背景

本文来源于胖喵拼音的一个问题 (issue): <https://github.com/fm-elpac/pmim-ibus/issues/1>

Fedora Kinoite 是一个 GNU/Linux 发行版本, 这个系统的特点是,
使用 `rpm-ostree` 来进行软件包管理 (系统升级).

+ <https://fedoraproject.org/atomic-desktops/kinoite/>
+ <https://coreos.github.io/rpm-ostree/>

所以 `/usr` 目录是只读的:

```sh
a2@fedora:~$ mount | grep /usr
/dev/sda3 on /usr type btrfs (ro,relatime,seclabel,compress=zstd:1,space_cache=v2,subvolid=258,subvol=/root)
```

注意这里的 `ro`.

由于 ibus 输入法框架的限制, 需要把配置文件 `pmim_ibrus.xml` 安装到
`/usr/share/ibus/component` 目录.

此时需要制作一个 rpm 软件包, 通过安装 rpm 软件包来安装这个配置文件.

+ <https://docs.fedoraproject.org/en-US/fedora-kinoite/getting-started/#package-layering>

----

系统版本信息:

```sh
a2@fedora:~$ rpm-ostree status
State: idle
Deployments:
● fedora:fedora/40/x86_64/kinoite
                  Version: 40.20240430.0 (2024-04-30T00:38:03Z)
                   Commit: 68a08da82e9303cc1fd5956a1cbbbc3675b2f0f076c4cf9b0413feb026b11096
             GPGSignature: Valid signature by 115DF9AEF857853EE8445D0A0727707EA15B79CC
a2@fedora:~$ uname -a
Linux fedora 6.8.7-300.fc40.x86_64 #1 SMP PREEMPT_DYNAMIC Wed Apr 17 19:21:08 UTC 2024 x86_64 GNU/Linux
```

ibus 版本:

```sh
a2@fedora:~$ rpm -qi ibus
Name        : ibus
Version     : 1.5.30~rc3
Release     : 1.fc40
Architecture: x86_64
Install Date: 2024年04月30日 星期二 08时29分30秒
Group       : Unspecified
Size        : 147304373
License     : LGPL-2.1-or-later
Signature   : RSA/SHA256, 2024年04月02日 星期二 22时52分24秒, Key ID 0727707ea15b79cc
Source RPM  : ibus-1.5.30~rc3-1.fc40.src.rpm
Build Date  : 2024年04月02日 星期二 22时25分13秒
Build Host  : buildhw-x86-07.iad2.fedoraproject.org
Packager    : Fedora Project
Vendor      : Fedora Project
URL         : https://github.com/ibus/ibus/wiki
Bug URL     : https://bugz.fedoraproject.org/ibus
Summary     : Intelligent Input Bus for Linux OS
Description :
IBus means Intelligent Input Bus. It is an input framework for Linux OS.
```


## 2 创建 rpm 软件包

主要参考资料: <https://rpm-packaging-guide.github.io/>

编写 rpm 描述文件 `librush/rpm/ibrus.spec`:

```sh
Name:       ibrus
Version:    0.1.0a3
Release:    1%{?dist}
Summary:    ibus module for pmim (a Chinese pinyin input method)
License:    LGPL-2.1-or-later OR GPL-3.0-or-later
URL:        https://github.com/fm-elpac/librush
Requires:   ibus

%description
librush: ibus module for pmim (a Chinese pinyin input method)

%prep
# TODO

%build
# skip

%install
mkdir -p %{buildroot}/usr/lib/pmim
install -Dm755 -t %{buildroot}/usr/lib/pmim %{_topdir}/SOURCES/ibrus
install -Dm644 -t %{buildroot}/usr/share/ibus/component %{_topdir}/SOURCES/pmim_ibrus.xml

%files
/usr/lib/pmim/ibrus
/usr/share/ibus/component/pmim_ibrus.xml

%changelog
# TODO
```

----

然后:

+ (1) 安装 `toolbox`: <https://containertoolbx.org/>

  版本信息:

  ```sh
  > toolbox --version
  toolbox version 0.0.99.5
  ```

  参考资料: <https://wiki.archlinux.org/title/Toolbox>

+ (2) 创建运行环境:

  ```sh
  > toolbox create -d fedora -r 40
  Image required to create toolbox container.
  Download registry.fedoraproject.org/fedora-toolbox:40? [y/N]: y
  Created container: fedora-toolbox-40
  Enter with: toolbox enter fedora-toolbox-40
  ```

  创建之后:

  ```sh
  > toolbox list
  IMAGE ID      IMAGE NAME                                    CREATED
  1b6661a009d9  registry.fedoraproject.org/fedora-toolbox:40  5 days ago

  CONTAINER ID  CONTAINER NAME       CREATED         STATUS   IMAGE NAME
  4a40c125ebbf  fedora-toolbox-40    52 seconds ago  created  registry.fedoraproject.org/fedora-toolbox:40
  ```

+ (3) 进入运行环境:

  ```sh
  > toolbox enter fedora-toolbox-40
  ⬢[s2@toolbox ~]$ type dnf
  dnf 是 /usr/bin/dnf
  ⬢[s2@toolbox ~]$
  ```

+ (4) 安装 rpm 开发工具:

  ```sh
  ⬢[s2@toolbox ~]$ sudo dnf install rpm-build rpm-devel rpmdevtools
  ```

+ (5) 初始化 rpm 编译环境:

  ```sh
  ⬢[s2@toolbox ~]$ rpmdev-setuptree
  ```

  初始的编译目录:

  ```sh
  ⬢[s2@toolbox ~]$ tree ~/rpmbuild
  /home/s2/rpmbuild
  ├── BUILD
  ├── RPMS
  ├── SOURCES
  ├── SPECS
  └── SRPMS

  6 directories, 0 files
  ```

+ (6) 将所需文件放在相应的位置:

  ```sh
  ⬢[s2@toolbox ~]$ tree ~/rpmbuild
  /home/s2/rpmbuild
  ├── BUILD
  ├── RPMS
  ├── SOURCES
  │   ├── ibrus
  │   └── pmim_ibrus.xml
  ├── SPECS
  │   └── ibrus.spec
  └── SRPMS

  6 directories, 3 files
  ```

+ (7) 编译 rpm 软件包:

  ```sh
  ⬢[s2@toolbox ~]$ rpmbuild -bb ~/rpmbuild/SPECS/ibrus.spec
  ```

  编译之后:

  ```sh
  ⬢[s2@toolbox ~]$ tree ~/rpmbuild
  /home/s2/rpmbuild
  ├── BUILD
  ├── BUILDROOT
  ├── RPMS
  │   └── x86_64
  │       └── ibrus-0.1.0a3-1.fc40.x86_64.rpm
  ├── SOURCES
  │   ├── ibrus
  │   └── pmim_ibrus.xml
  ├── SPECS
  │   └── ibrus.spec
  └── SRPMS

  8 directories, 4 files
  ```

  其中 `ibrus-0.1.0a3-1.fc40.x86_64.rpm` 就是制作好的 rpm 软件包.

  包含的文件:

  ```sh
  ⬢[s2@toolbox ~]$ rpm -qlp ~/rpmbuild/RPMS/x86_64/ibrus-0.1.0a3-1.fc40.x86_64.rpm
  /usr/lib/.build-id
  /usr/lib/.build-id/6f
  /usr/lib/.build-id/6f/ddc23c3dcf3a7ef8cb8800119bcfbeaaf60779
  /usr/lib/pmim/ibrus
  /usr/share/ibus/component/pmim_ibrus.xml
  ```

  软件包信息:

  ```sh
  ⬢[s2@toolbox ~]$ rpm -qip ~/rpmbuild/RPMS/x86_64/ibrus-0.1.0a3-1.fc40.x86_64.rpm
  Name        : ibrus
  Version     : 0.1.0a3
  Release     : 1.fc40
  Architecture: x86_64
  Install Date: (not installed)
  Group       : Unspecified
  Size        : 6403239
  License     : LGPL-2.1-or-later OR GPL-3.0-or-later
  Signature   : (none)
  Source RPM  : ibrus-0.1.0a3-1.fc40.src.rpm
  Build Date  : 2024年04月30日 星期二 09时52分16秒
  Build Host  : toolbox
  URL         : https://github.com/fm-elpac/librush
  Summary     : ibus module for pmim (a Chinese pinyin input method)
  Description :
  librush: ibus module for pmim (a Chinese pinyin input method)
  ```


## 3 测试

操作系统: Fedora Kinoite 40

+ (1) 安装 rpm 软件包:

  ![fedora 40](./图/3-fedora-1.png)

  ```sh
  a2@fedora:~$ sudo rpm-ostree install ibrus-0.1.0a3-1.fc40.x86_64.rpm
  Checking out tree 68a08da... done
  Enabled rpm-md repositories: fedora-cisco-openh264 updates fedora updates-archive
  Updating metadata for 'fedora-cisco-openh264'... done
  Updating metadata for 'updates'... done
  Updating metadata for 'fedora'... done
  Updating metadata for 'updates-archive'... done
  Importing rpm-md... done
  rpm-md repo 'fedora-cisco-openh264'; generated: 2023-12-11T14:43:50Z solvables: 4
  rpm-md repo 'updates'; generated: 2024-04-29T01:08:34Z solvables: 8720
  rpm-md repo 'fedora'; generated: 2024-04-14T18:51:11Z solvables: 74881
  rpm-md repo 'updates-archive'; generated: 2024-04-30T01:22:20Z solvables: 7344
  Resolving dependencies... done
  Checking out packages... done
  Running pre scripts... done
  Running post scripts... done
  Running posttrans scripts... done
  Writing rpmdb... done
  Writing OSTree commit... done
  Staging deployment... done
  Freed: 1.9 GB (pkgcache branches: 0)
  Added:
    ibrus-0.1.0a3-1.fc40.x86_64
  Changes queued for next boot. Run "systemctl reboot" to start a reboot
  a2@fedora:~$
  ```

+ (2) 重启系统.

  重启之后:

  ```sh
  a2@fedora:~$ rpm-ostree status
  State: idle
  Deployments:
  ● fedora:fedora/40/x86_64/kinoite
                    Version: 40.20240430.0 (2024-04-30T00:38:03Z)
                BaseCommit: 68a08da82e9303cc1fd5956a1cbbbc3675b2f0f076c4cf9b0413feb026b11096
              GPGSignature: Valid signature by 115DF9AEF857853EE8445D0A0727707EA15B79CC
              LocalPackages: ibrus-0.1.0a3-1.fc40.x86_64

  a2@fedora:~$ rpm -qi ibrus
  Name        : ibrus
  Version     : 0.1.0a3
  Release     : 1.fc40
  Architecture: x86_64
  Install Date: 2024年04月30日 星期二 10时07分01秒
  Group       : Unspecified
  Size        : 6403239
  License     : LGPL-2.1-or-later OR GPL-3.0-or-later
  Signature   : (none)
  Source RPM  : ibrus-0.1.0a3-1.fc40.src.rpm
  Build Date  : 2024年04月30日 星期二 09时52分16秒
  Build Host  : toolbox
  URL         : https://github.com/fm-elpac/librush
  Summary     : ibus module for pmim (a Chinese pinyin input method)
  Description :
  librush: ibus module for pmim (a Chinese pinyin input method)

  a2@fedora:~$ ls -l /usr/share/ibus/component/
  总计 496
  -rw-r--r--. 3 root root    656 1970年 1月 1日 anthy.xml
  -rw-r--r--. 3 root root    421 1970年 1月 1日 dconf.xml
  -rw-r--r--. 3 root root    465 1970年 1月 1日 gtkextension.xml
  -rw-r--r--. 3 root root    428 1970年 1月 1日 gtkpanel.xml
  -rw-r--r--. 3 root root    904 1970年 1月 1日 hangul.xml
  -rw-r--r--. 3 root root   1941 1970年 1月 1日 libpinyin.xml
  -rw-r--r--. 3 root root   1165 1970年 1月 1日 libzhuyin.xml
  -rw-r--r--. 3 root root    625 1970年 1月 1日 m17n.xml
  -rw-r--r--. 2 root root    857 1970年 1月 1日 pmim_ibrus.xml
  -rw-r--r--. 3 root root 464835 1970年 1月 1日 simple.xml
  -rw-r--r--. 3 root root    751 1970年 1月 1日 typing-booster.xml
  ```

----

![ibus setup](./图/3-ibus-setup-1.png)

ibus 配置界面中已经出现了 胖喵拼音.

![pmim](./图/3-pmim-1.png)

输入测试.


## 4 总结与展望

通过制作一个 rpm 软件包, 胖喵拼音 实现了对基于 `rpm-ostree` 系统的支持.

如果 ibus 输入法框架做出改进, 支持在用户级别 (而不是系统级别)
安装新的输入法, 就不用这么麻烦了.

对比 AUR (ArchLinux) 和 RPM (Fedora) 软件包格式,
窝还是觉得 AUR 的打包更加简单方便一些.

----

彩蛋:

最近胖喵拼音新增了一个可选的词库, 数据来自于
清华大学开放中文词库 (THUOCL) <http://thuocl.thunlp.org/>

包含约 11 万个词.

体验地址: <https://github.com/fm-elpac/pmim-data-thuocl>

----

本文使用 CC-BY-SA 4.0 许可发布.
