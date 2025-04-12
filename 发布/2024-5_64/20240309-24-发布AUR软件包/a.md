# 发布 AUR 软件包 (ArchLinux)

理论上来说, 我们应该平等的对待每一个 GNU/Linux 发行版本.
但是, 因为窝日常使用 ArchLinux, 所以对 ArchLinux 有一些特别的优待,
比如自己做的软件优先为 ArchLinux 打包发布.

本文以软件包 `librush-bin` 为例, 介绍发布 AUR 软件包的过程.


## 目录

+ 1 AUR 简介

+ 2 编写 `PKGBUILD`

+ 3 本地打包测试

+ 4 上传到 AUR

+ 5 总结与展望


## 1 AUR 简介

相关链接: <https://aur.archlinux.org/>

AUR (Arch User Repository, Arch 用户仓库) 是一个允许 ArchLinux
用户上传软件包打包文件 (`PKGBUILD`) 的地方.
这区别于 ArchLinux 官方维护的软件包仓库.

只要注册一个账号, 就能上传 AUR 软件包,
所以 AUR 软件包的数量很多 (目前有 8.5 万个),
这也是 ArchLinux 的一大优点 (软件包数量多).

使用 AUR 软件包时, 用户下载 `PKGBUILD` 文件,
在本地生成 (构建) 软件包, 然后使用 `pacman` 安装.
相比手动编译打包软件, AUR 将这个过程自动化了 (软件包维护者已经做好了),
所以使用起来还是相对比较方便的.

由于 AUR 软件包不是官方维护的, 软件包的质量是没有保证的,
使用起来也是有一定风险的.
但总的来说, AUR 还是一个好东西.


## 2 编写 `PKGBUILD`

在开始之前, 请首先阅读下列文档:

+ <https://wiki.archlinux.org/title/AUR_submission_guidelines>
+ <https://wiki.archlinux.org/title/Arch_package_guidelines>
+ <https://wiki.archlinux.org/title/Arch_User_Repository>
+ <https://wiki.archlinux.org/title/Package_Maintainer_guidelines>
+ <https://wiki.archlinux.org/title/PKGBUILD>

不符合要求的软件包可能会被直接删除.

文件 `librush-bin/PKGBUILD`:

```sh
# Maintainer: secext2022 <secext2022 at outlook dot com>
pkgname=librush-bin
pkgver=0.1.0a2
pkgrel=1
# https://github.com/fm-elpac/pmim-ibus
pkgdesc="ibus module for pmim (a Chinese pinyin input method)"
arch=('x86_64')
url="https://github.com/fm-elpac/librush"
license=('LGPL-2.1-or-later OR GPL-3.0-or-later')
depends=('ibus>=1.5.29')
source=(
  'librush_release_x86_64-unknown-linux-gnu.tar.zst::https://github.com/fm-elpac/librush/releases/download/v0.1.0-a2/librush_release_x86_64-unknown-linux-gnu.tar.zst'
  'pmim_ibrus.xml')
sha256sums=('1d0a1d257d6d2d4daac56a926c7a40b6215964bd27251e6c4da3e7acfc1b81cf'
            '1ee458d6dc9ad97a4afe9939076675b43f236196eb3bd6e9a5a9e7e41ee1ded6')

build() {
  cd "$srcdir"
}

package() {
  cd "$srcdir"

  install -Dm755 -t "$pkgdir/usr/lib/pmim" target/release/ibrus
  install -Dm644 -t "$pkgdir/usr/share/ibus/component" pmim_ibrus.xml
}
```

解释:

+ `# Maintainer`: 文件的开头必须添加软件包维护者的信息.

+ `pkgname=librush-bin`: 软件包的名称.
  预编译的软件包必须使用 `-bin` 后缀.

+ `pkgver=0.1.0a2`: 软件包的版本, 和上游发布的版本号保持一致.
  注意不能含有 `-` 字符.

+ `pkgrel=1`: ArchLinux 软件包的版本, 从 `1` 开始.
  每次 `pkgver` 更新后, 重置为 1.

+ `pkgdesc=`: 软件包的描述, 长度不超过 80 字符.

+ `arch=('x86_64')`: 这个软件包只支持 x86_64 架构的 CPU.

+ `url=`: 软件项目的网址.

+ `license=`: 软件包发布使用的许可协议.

+ `depends=('ibus>=1.5.29')`: 软件包运行所需的依赖.
  在安装这个软件包之前, 所有依赖的软件包也会被安装.

+ `source=`: 构建软件包所需的文件列表 (以及下载网址).

+ `sha256sums=`: 上述文件的校验值 (hash).
  这个不需要手动填写, 运行命令 `updpkgsums` 自动更新.

+ `build()`: 编译这个软件需要运行的命令.
  因为这个软件已经编译过了, 所以这里没有.

+ `package()`: 打包这个软件需要运行的命令.
  此处只是把两个文件安装 (复制) 到相应的路径.


## 3 本地打包测试

+ (1) 打包, 执行命令:

  ```sh
  > makepkg
  ```

  成功之后就能获得 ArchLinux 格式的软件包:

  ```sh
  > ls -l librush-bin-0.1.0a2-1-x86_64.pkg.tar.zst 
  -rw-r--r-- 1 s2 s2 1503158  3月 8日 09:08 librush-bin-0.1.0a2-1-x86_64.pkg.tar.zst
  ```

+ (2) 安装软件包:

  ```sh
  > sudo pacman -U librush-bin-0.1.0a2-1-x86_64.pkg.tar.zst
  ```

+ (3) 安装之后可以查看这个软件包都有哪些文件:

  ```sh
  > pacman -Ql librush-bin
  librush-bin /usr/
  librush-bin /usr/lib/
  librush-bin /usr/lib/pmim/
  librush-bin /usr/lib/pmim/ibrus
  librush-bin /usr/share/
  librush-bin /usr/share/ibus/
  librush-bin /usr/share/ibus/component/
  librush-bin /usr/share/ibus/component/pmim_ibrus.xml
  ```

  这个软件包很简单, 只有两个文件.

  `/usr/lib/pmim/ibrus` 是 **艾刷** (librush) 模块,
  处理与 ibus 输入法框架的接口.

  `/usr/share/ibus/component/pmim_ibrus.xml` 是 ibus 配置文件,
  用于启动运行艾刷模块.

----

相关文章: 《ibus 源代码阅读 (1)》

TODO


## 4 上传到 AUR

相关链接:

+ <https://aur.archlinux.org/>
+ <https://wiki.archlinux.org/title/AUR_submission_guidelines>

----

+ (1) 注册账号并登录.
  需要使用电子邮箱 (email).

+ (2) 创建 SSH 密钥对, 比如:

  ```sh
  > ssh-keygen -t ed25519 -C aur-test -f ~/.ssh/id_ed25519-aur-test
  ```

  其中 `-t ed25519` 指定密钥使用的算法.
  `-C aur-test` 指定注释.
  `-f ~/.ssh/id_ed25519-aur-test` 指定密钥文件的路径.

  注意 `~/.ssh/id_ed25519-aur-test` 文件是 **私钥**, **千万不要泄露 !**
  如果一旦泄露, 请尽快重新生成密钥,
  并注销之前使用的密钥 (在 AUR 账户界面设置新的公钥).

+ (3) 在 AUR 账户界面设置自己的 SSH 公钥, 比如:

  ```sh
  > cat ~/.ssh/id_ed25519-aur-test.pub
  ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPza3zpjo/RuKSRk6Kvr5kP9RtfNZ7crujvPqHUM9nfw aur-test
  ```

  注意 `.pub` 结尾的文件是 **公钥**, 把公钥复制粘贴到设置页面中的文本框.

+ (4) 配置 SSH, 比如:

  ```sh
  > cat ~/.ssh/config

  Host aur.archlinux.org
      IdentityFile ~/.ssh/id_ed25519-aur-test
      User aur
  ```

+ (5) 测试 SSH 配置:

  ```sh
  > ssh -T aur@aur.archlinux.org
  Welcome to AUR, secext2022! Interactive shell is disabled.
  Try `ssh aur@aur.archlinux.org help` for a list of commands.
  ```

  如果一切正常, 会显示类似的信息.

+ (6) 克隆 git 仓库:

  ```sh
  > git -c init.defaultbranch=master clone aur@aur.archlinux.org:librush-bin.git
  ```

  因为这个软件包名称之前没有用过, 所以会是一个空仓库.

+ (7) 添加 `PKGBUILD` 等文件 (`git add`).

  更新源文件校验值:

  ```sh
  > updpkgsums
  ```

  生成 `.SRCINFO` 文件:

  ```sh
  > makepkg --printsrcinfo > .SRCINFO
  ```

+ (8) 提交 (`git commit`), 然后推送:

  ```sh
  > git push
  ```

----

然后就可以在 AUR 看到发布的软件包啦 ~

![AUR](./图/4-aur-1.png)

不久后就可以搜索到这个软件包:

```sh
> yay -Ss librush
aur/librush-bin 0.1.0a2-1 (+1 1.00) (已安装)
    ibus module for pmim (a Chinese pinyin input method)
```


## 5 总结与展望

发布 AUR 软件包比发布 flathub 应用, 要简单容易快速很多.

相关文章: 《发布 flatpak 应用 (flathub)》

TODO

所以目前 AUR 有 8.5 万个软件包, 而 flathub 只有 2512 个软件.

----

由于 ibus 输入法框架的限制, 目前只从 flatpak 安装应用是不够的.
在 flatpak 应用安装之后, 用户需要手动配置 ibus (安装 艾刷 `ibrus` 模块),
才能让整个拼音输入法正常工作.

ArchLinux 用户只需要从 AUR 安装 `librush-bin` 软件包即可,
这比手动配置容易一点.

未来如果 ibus 做出改变, 能够更好的支持第三方输入法,
可能就不用这么麻烦了.

----

本文使用 CC-BY-SA 4.0 许可发布.
