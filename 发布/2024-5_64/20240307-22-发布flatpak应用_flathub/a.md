# 发布 flatpak 应用 (flathub)

**警告: flathub 网站目前只支持显示英文, 这一点必须强烈差评 !!!**

世界上至少有几百种不同的 GNU/Linux 发行版, 常见的都有几十种.
如何给这么多不同版本的系统发布软件, 对开发者是个大难题.

flatpak 提供了一种统一发布应用的方式,
一次发布, 理论上适用于所有发行版的系统.

本文以应用 `io.github.fm_elpac.pmim_ibus` 举栗, 介绍在 flathub 发布 flatpak 应用的步骤.


## 目录

+ 1 flatpak 简介

  - 1.1 GNU/Linux 系统发布 (桌面) 应用软件的困境
  - 1.2 flatpak 类似于容器技术 (比如 docker)
  - 1.3 flathub 作为集中的软件发布中心

+ 2 准备所需文件

  - 2.1 选择包名 (应用 id)
  - 2.2 应用图标
  - 2.3 `包名.desktop` 文件
  - 2.4 `包名.metainfo.xml` 文件
  - 2.5 `包名.yml` 文件

+ 3 本地 flatpak 编译测试

+ 4 提交应用

+ 5 发布成功

+ 6 总结与展望


## 1 flatpak 简介

相关链接: <https://flatpak.org/setup/>

国内 flathub 镜像: <https://mirror.sjtu.edu.cn/docs/flathub>

### 1.1 GNU/Linux 系统发布 (桌面) 应用软件的困境

世界上至少有几百种不同的 GNU/Linux 发行版, 详见这个网站:
<https://distrowatch.com/>

不同的发行版使用不同的软件包管理器和软件包格式,
比如 ArchLinux 的 pacman, Debian (以及 Ubuntu) 的 apt (`.deb`),
Fedora (RedHat) 的 `.rpm` 等等.
不同软件包格式的打包方式也都不一样.

更麻烦的是, 不同系统的 **软件环境** 也都不一样,
如果软件依赖 (库) 比较多的话, 在每个系统上都要重新解决一遍依赖的问题,
万一遇到依赖的版本不对, 软件直接就无法工作了.

对于一个开发者, 面对这么一大堆乱七八糟的不同系统, 怎么办 ?
如果只对少数几个 GNU/Linux 发行版提供支持,
那么使用别的发行版的用户怎么办 ?
如果对每一个发行版都提供支持, 那么开发者的时间和精力根本不够用,
完全无法实现.

### 1.2 flatpak 类似于容器技术 (比如 docker)

类似的困难人们早就遇到了, 并且提出了相应的解决方案:
**容器** 技术 (比如 docker, k8s).

容器就是, 除了 Linux 内核,
别的软件依赖运行环境统统打包进容器镜像.
只要下载了容器镜像, 在哪里都可以运行, 非常简单.
容器同时保证了运行环境和开发环境完全一致,
只要开发者那里测试正常, 那么就一定可以运行,
不会遇到环境问题而产生的各种奇奇怪怪的 BUG, 节省了大量调试时间.
容器顺便还能增强安全性 (隔离, 轻量虚拟化技术),
可谓是好处多多.

但是通常的容器技术是用于服务器 (后端) 的, 也就是没有图形界面.
而大部分桌面应用都是要图形用户界面的.
flatpak 差不多就是带图形界面的容器.

为了能够适应各种不同的系统环境, 在哪里都可以运行,
flatpak 也要求应用打包所有依赖.
flatpak 底层使用 `ostree` 存储应用的文件,
`ostree` 类似 `git`, 是一个基于 **内容寻址** 的数据库,
所以可以消除重复, 不同应用的内容相同的文件只存储一份.
软件升级也很方便, 自带增量更新功能,
也就是只下载新版本有变化的那部分文件.

flatpak 已经支持了几十种不同的系统,
并且理论上可以支持全部 GNU/Linux 发行版:

![flatpak 支持的系统](./图/12-s-1.png)

有了 flatpak, 那发布软件就简单多了, 只需要以 flatpak 格式发布一个安装包,
所有的系统就都可以安装运行啦, 撒花 ~

**注意: flatpak 的安全性比容器 (比如 docker) 差很多, 还是要尽量避免运行恶意软件 !**

### 1.3 flathub 作为集中的软件发布中心

相关链接: <https://flathub.org/>

flathub 之于 flatpak, 就像 github 之于 git.

自己搭建服务器, 用于发布 flatpak 应用,
或者以单个文件 (压缩包) 的形式发布 flatpak 应用,
这些都是很容易实现的.

但是, 最方便的使用方式, 还是有一个集中发布应用软件的地方.
这对于开发者和用户都方便.

----

**flathub 网站目前只支持显示英文, 这一点必须强烈差评 !!!**

![flathub issue](./图/13-i-1.png)

在 flathub 网站上支持别的语言, 这在技术上很容易实现, 完全没有难度,
并且有人早已在 2 年前提交了相关实现代码.
但是这个网站的管理人员不愿意添加支持, 可能这就是英语人的傲慢吧.
差评, 必须差评 !!

----

**强烈建议使用国内 flathub 镜像, 能够大大加快下载安装软件的速度 !**

验证 flatpak 镜像配置:

```sh
> cat /var/lib/flatpak/repo/config
[core]
repo_version=1
mode=bare-user-only
min-free-space-size=500MB
xa.applied-remotes=flathub;
xa.extra-languages=zh_CN
xa.languages=zh;en

[remote "flathub"]
url=https://mirror.sjtu.edu.cn/flathub
xa.title=Flathub
gpg-verify=true
gpg-verify-summary=true
xa.comment=Central repository of Flatpak applications
xa.description=Central repository of Flatpak applications
xa.icon=https://dl.flathub.org/repo/logo.svg
xa.homepage=https://flathub.org/
url-is-set=true
```


## 2 准备所需文件

在 flathub 发布 flatpak 应用还是有点麻烦的,
首先需要阅读所有下列文档:

+ <https://docs.flathub.org/docs/for-app-authors/submission/>
+ <https://docs.flathub.org/docs/for-app-authors/requirements/>
+ <https://docs.flathub.org/docs/for-app-authors/maintenance/>
+ <https://docs.flathub.org/docs/for-app-authors/metainfo-guidelines/>

### 2.1 选择包名 (应用 id)

包名用于唯一标识一个应用, 要求使用 **反向域名** 的格式,
并且使用的域名必须是开发者可以控制的.
如果是源代码发布在 github 的应用, 包名应该以 `io.github.用户名` 开头.

这里窝使用的包名是 `io.github.fm_elpac.pmim_ibus`

### 2.2 应用图标

应该使用一个高分辨率的正方形图片作为应用的图标, 或者使用 svg (矢量图片).

为了方便, 窝使用了一个 svg 图片 (分辨率无关), 在构建应用的过程中,
这个文件应该被复制到:

```
/app/share/icons/hicolor/scalable/apps/io.github.fm_elpac.pmim_ibus.svg
```

### 2.3 `包名.desktop` 文件

这个文件提供一些应用的信息, 系统的启动器可以把这个应用显示出来.

可以使用在线工具 `AppStream MetaInfo Creator` 帮忙生成这个文件:
<https://www.freedesktop.org/software/appstream/metainfocreator/>

这里窝使用的相应文件是:
`/app/share/applications/io.github.fm_elpac.pmim_ibus.desktop`

```
[Desktop Entry]
Version=1.0
Type=Application

Name=胖喵拼音
Comment=胖喵拼音输入法 (ibus)
Categories=Utility;Accessibility;

Icon=io.github.fm_elpac.pmim_ibus
Exec=run.sh
Terminal=false
```

### 2.4 `包名.metainfo.xml` 文件

这个文件提供更多的应用信息,
可以使用在线工具 `AppStream MetaInfo Creator` 帮忙生成这个文件.

这里窝使用的相应文件是:
`/app/share/metainfo/io.github.fm_elpac.pmim_ibus.metainfo.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- Copyright 2024 secext2022 -->
<component type="desktop-application">
  <id>io.github.fm_elpac.pmim_ibus</id>
  <metadata_license>CC-BY-SA-4.0</metadata_license>
  <project_license>GPL-3.0-or-later</project_license>

  <name>PMIM</name>
  <name xml:lang="zh">胖喵拼音</name>
  <summary>A Chinese pinyin input method</summary>
  <summary xml:lang="zh">可信任的跨平台开源输入法</summary>

  <developer id="io.github.fm_elpac">
    <name>secext2022</name>
    <name xml:lang="zh">第二扩展</name>
  </developer>

  <description>
    <p>
      A Chinese pinyin input method for ibus.

      Please note that the features of this input method is very simple.
      The source code of this input method is only a few thousands lines.
      We recommend that every user read the source code first before use.

      This input method is cross platform.
      There is an Android version (please see the project page).
    </p>
    <p xml:lang="zh">
      胖喵拼音输入法 (ibus)

      本输入法的功能非常简单 (简陋), 使用之前请做好心理准备.
      但是本输入法的源代码一共只有几千行,
      建议每个用户在使用之前先读一遍源代码.

      本输入法是跨平台的, 另外还有 Android 版本 (详见项目页面).
    </p>
    <p>
      Please note that this is only the input method (engine),
      need to install and configure ibus for this app to work.
      Please see the project page (link below) for how to setup.
    </p>
    <p xml:lang="zh">
      这只是输入法, 需要另外安装和配置 ibus 才能正常工作.
      具体安装步骤请见项目页面 (链接在下方).
    </p>
  </description>

  <launchable type="desktop-id">io.github.fm_elpac.pmim_ibus.desktop</launchable>

  <branding>
    <color type="primary" scheme_preference="light">#fff3e0</color>
    <color type="primary" scheme_preference="dark">#000000</color>
  </branding>

  <url type="homepage">https://github.com/fm-elpac/pmim-ibus</url>
  <url type="vcs-browser">https://github.com/fm-elpac/pmim-ibus</url>
  <url type="bugtracker">https://github.com/fm-elpac/pmim-ibus/issues</url>

  <keywords>
    <keyword translate="no">ibus</keyword>
    <keyword xml:lang="zh">ibus</keyword>

    <keyword translate="no">input method</keyword>
    <keyword xml:lang="zh">输入法</keyword>

    <keyword translate="no">pinyin</keyword>
    <keyword xml:lang="zh">拼音</keyword>
  </keywords>

  <content_rating type="oars-1.1" />

  <screenshots>
    <screenshot type="default">
      <image>https://cdn.jsdelivr.net/gh/fm-elpac/pmim-ibus@92f2fc39e6e42f248261d9a5892d9eef89235679/img/20240301_112648.png</image>
      <caption>screenshot of running</caption>
      <caption xml:lang="zh">运行截图</caption>
    </screenshot>
  </screenshots>

  <releases>
    <release version="0.1.0" date="2024-03-01">
      <description>
        <p>The first version.</p>
        <p xml:lang="zh">首个发布版本.</p>
      </description>
    </release>
  </releases>

</component>
```

注意事项主要有:

+ (1) 必须设置使用的许可证 (`metadata_license`, `project_license`).

+ (2) 必须设置名称和描述, 长度必须符合要求 (`name`, `summary`).

+ (3) 详细描述要足够长 (`description`).

+ (4) 必须设置内容分级 (`content_rating`).
  使用这个页面生成: <https://hughsie.github.io/oars/generate.html>

+ (5) 至少有一张运行截图 (`screenshot`).

+ (6) 至少有一个版本发布说明 (`release`), 且日期不能在未来.

这里窝设置了中文内容, 然而 flathub 网站不支持显示, 必须差评 !

### 2.5 `包名.yml` 文件

这个文件用于构建 (打包) flatpak 应用.
可以阅读 flatpak 的文档, 了解如何编写这个文件.

因为窝的应用使用了 electronjs, 所以使用这个指导:
<https://docs.flatpak.org/en/latest/electron.html>

这里窝使用的相应文件是: `io.github.fm_elpac.pmim_ibus.yml`

```yml
app-id: io.github.fm_elpac.pmim_ibus
runtime: org.freedesktop.Platform
runtime-version: '23.08'
sdk: org.freedesktop.Sdk

base: org.electronjs.Electron2.BaseApp
base-version: '23.08'
sdk-extensions:
  - org.freedesktop.Sdk.Extension.node20
build-options:
  append-path: /usr/lib/sdk/node20/bin
  env:
    NPM_CONFIG_LOGLEVEL: info
separate-locales: false

command: run.sh
finish-args:
  - --share=ipc
  - --socket=x11
  - --socket=pulseaudio
  - --share=network
  - --device=dri
  - --filesystem=xdg-run/pmim:create

modules:
  - name: pmim-ibus
    buildsystem: simple
    build-options:
      env:
        XDG_CACHE_HOME: /run/build/pmim-ibus/flatpak-node/cache
        npm_config_cache: /run/build/pmim-ibus/flatpak-node/npm-cache
        npm_config_offline: 'true'
    build-commands:

      # files for desktop app
      - install -D -t /app/share/metainfo/ pmim-ibus/flatpak/io.github.fm_elpac.pmim_ibus.metainfo.xml
      - install -D -t /app/share/applications/ pmim-ibus/flatpak/io.github.fm_elpac.pmim_ibus.desktop
      - install -D pmim-ibus/logo/pmim-2024-2.svg /app/share/icons/hicolor/scalable/apps/io.github.fm_elpac.pmim_ibus.svg

      - install -D -t /app/ pmim-ibus/LICENSE
      - install -D -t /app/ pmim-ibus/README.md

      # /app/bin
      - install -Dm755 -t /app/bin/ run.sh
      - install -Dm755 -t /app/bin/ pmim-ibus/flatpak/restart.sh

      - install -Dm755 -t /app/bin/ dist-deno/deno

      - |
        if [ "$FLATPAK_ARCH" == "x86_64" ]; then
          install -Dm755 -t /app/bin/ dist-librush/release/ibrus
        fi
      - |
        if [ "$FLATPAK_ARCH" == "aarch64" ]; then
          install -Dm755 -t /app/bin/ dist-librush/aarch64-unknown-linux-gnu/release/ibrus
        fi

      - cp pmim-ibus/ibus_component/pmim_ibrus.xml /app

      # /app/main *.js
      - mkdir -p /app/main
      - cp pmim-ibus/electronjs/*.js /app/main

      # pmim-server
      - cp -r server /app/
      # ui-vue-dist
      - cp -r ui/dist/* /app/server/static/

      # electron dist
      - mkdir -p /app/dist-electron
      - cp dist-electron.zip /app/dist-electron
      - cd /app/dist-electron && unzip dist-electron.zip
      - rm /app/dist-electron/dist-electron.zip

    sources:
      - type: script
        dest-filename: run.sh
        commands:
          - env PMIMS_DB=${XDG_CONFIG_HOME}/pmim zypak-wrapper.sh /app/dist-electron/electron /app/main/main.js "$@"

      # pmim-ibus
      - type: git
        dest: pmim-ibus
        url: https://github.com/fm-elpac/pmim-ibus
        tag: v0.1.2
        commit: 47cd7dc5097f19b040a1aeea0e695bdaa0c21ac1

      # pmim-ibus/ui-vue-dist
      - type: archive
        dest: ui
        url: https://github.com/fm-elpac/pmim-ibus/releases/download/v0.1.2/ui-vue-dist.tar.zst
        sha256: 8e7a0ebf61f1e35eb8163e4324d4b31db46b84835c9695ff85da2bd8b4a2964e

      # pmim-server
      - type: archive
        dest: server
        url: https://github.com/fm-elpac/pmim/releases/download/v0.1.1/pmim-server.tar.zst
        sha256: d06bd825f04ac5b96ac6e6c6824e83b87849fbb082c10994df226f246689e660

      # deno
      - type: archive
        dest: dist-deno
        only-arches: [ "x86_64" ]
        url: https://github.com/denoland/deno/releases/download/v1.41.1/deno-x86_64-unknown-linux-gnu.zip
        sha256: 233377822ad21dd8e90953e0d0301dfa8219379bf0512b1e15aa4f507e830b7b
      - type: archive
        dest: dist-deno
        only-arches: [ "aarch64" ]
        url: https://github.com/denoland/deno/releases/download/v1.41.1/deno-aarch64-unknown-linux-gnu.zip
        sha256: b4ff594dd635ff0cfa19a94bb8f7de6f11389be26eaec1dc40c2b3fab16f5c8a

      # electronjs dist
      - type: file
        dest-filename: dist-electron.zip
        only-arches: [ "x86_64" ]
        url: https://github.com/electron/electron/releases/download/v29.1.0/electron-v29.1.0-linux-x64.zip
        sha256: af7964b3f8c72b5ec1946b46a8396fda67feae71ae0b8bdb329e2abcccf45a81
      - type: file
        dest-filename: dist-electron.zip
        only-arches: [ "aarch64" ]
        url: https://github.com/electron/electron/releases/download/v29.1.0/electron-v29.1.0-linux-arm64.zip
        sha256: 1e6482001dbae554359efee298889d6cd5c8aca18e9e83e91b01da72bf13195d

      # ibrus
      - type: archive
        dest: dist-librush
        only-arches: [ "x86_64" ]
        url: https://github.com/fm-elpac/librush/releases/download/v0.1.0-a1/librush_release_x86_64-unknown-linux-gnu.tar.zst
        sha256: 87c842509ffd5d516a505e612c970afb53a9e47c66208f7e07dcc7abea1cd77e
      - type: archive
        dest: dist-librush
        only-arches: [ "aarch64" ]
        url: https://github.com/fm-elpac/librush/releases/download/v0.1.0-a1/librush_release_aarch64-unknown-linux-gnu.tar.zst
        sha256: 29e121df54eea3f4b17a555210cbe5fae6dcdd537c9465a283320ffd6162077b
```

注意事项主要有:

+ (1) 构建过程是不能访问互联网的, 所有依赖的文件必须提前下载好.

+ (2) 必须使用 **不可变数据**, 实现完全可复现的构建.
  具体包括:

  - git 代码仓库 (`type: git`) 必须使用特定的提交 (`commit:`),
    而不能使用分支.
    建议使用 `tag:` 来增加可读性.

  - 下载的文件 (`type: archive`, `type: file`) 必须提供 `sha256:`
    来验证文件的数据内容.

+ (3) 对于 zip 文件, 不要直接使用 flatpak 解压, 这会丢失文件目录结构.
  需要自己使用 `unzip` 解压.

  这是窝遇到的一个 BUG, 导致 electronjs 一启动就崩溃.


## 3 本地 flatpak 编译测试

在提交应用之前, 先在本地编译测试一下.

+ (1) 安装 `org.flatpak.Builder` (flatpak 构建工具):

  ```sh
  > flatpak install flathub org.flatpak.Builder
  ```

+ (2) 验证 `包名.desktop` 文件:

  ```sh
  > desktop-file-validate io.github.fm_elpac.pmim_ibus.desktop
  ```

  此处的任何错误和警告都需要解决.

+ (3) 验证 `包名.metainfo.xml` 文件:

  ```sh
  > flatpak run --command=flatpak-builder-lint org.flatpak.Builder appstream io.github.fm_elpac.pmim_ibus.metainfo.xml
  ```

  此处的任何错误和警告都需要解决.

+ (4) 验证 `包名.yml` 文件:

  ```sh
  > flatpak run --command=flatpak-builder-lint org.flatpak.Builder manifest io.github.fm_elpac.pmim_ibus.yml
  ```

  此处的任何错误和警告都需要解决.

+ (5) 本地编译:

  ```sh
  > flatpak run org.flatpak.Builder --force-clean --sandbox --user --install --install-deps-from=flathub --ccache --mirror-screenshots-url=https://dl.flathub.org/media/ --repo=repo builddir io.github.fm_elpac.pmim_ibus.yml
  ```

+ (6) 验证编译结果:

  ```sh
  > flatpak run --command=flatpak-builder-lint org.flatpak.Builder repo repo
  ```

+ (7) 本地运行测试:

  ```sh
  > flatpak run io.github.fm_elpac.pmim_ibus
  ```


## 4 提交应用

相关链接: <https://docs.flathub.org/docs/for-app-authors/submission/>

到这里, 万里长征终于走过了第一步.

+ (1) `fork` flathub 的 github 仓库.

+ (2) 本地下载 `new-pr` 分支:

  ```sh
  > git clone git@github.com:fm-elpac/flathub.git --branch=new-pr
  ```

+ (3) 创建新分支, 分支名称随意:

  ```sh
  > cd flathub
  > git checkout -b pmim_ibus
  ```

+ (4) 添加文件 `io.github.fm_elpac.pmim_ibus.yml`, 提交,
  然后开一个 `PR` (合并请求):

  ![PR](./图/4-pr-1.png)

+ (5) 然后耐心等待热心的小哥哥和另一个志愿者过来检查, 比如:

  ![PR (2)](./图/4-pr-2.png)

  这家伙特别在意对 `aarch64` CPU 的支持,
  如果你的应用不支持 aarch64, 那么很有可能被吐槽.

+ (6) 如果有问题, 会获得 `awaiting-changes` 标签, 等待修改:

  ![PR (3)](./图/4-pr-3.png)

+ (7) 如果改好了, 会获得 `ready` 标签:

  ![PR (4)](./图/4-pr-4.png)

+ (8) 可以使用指令让机器人构建应用:

  ```
  bot, build io.github.fm_elpac.pmim_ibus
  ```

  ![PR (5)](./图/4-pr-5.png)

+ (9) 获得 `ready` 之后, 耐心等待几天, 会有大佬过来合并:

  ![PR (6)](./图/4-pr-6.png)

+ (10) 然后就会获得一个专属仓库, 在这个仓库更新,
  应用就会被发布到 flathub:

  ![flathub 仓库](./图/4-repo-1.png)


## 5 发布成功

![flathub 应用页面](./图/5-flathub-1.png)

flathub 只能显示英文, 再次差评.

----

然后就可以搜索到这个应用:

```sh
> flatpak search pmim
名称            描述                            应用程序 ID                         版本         分支          远程仓库
胖喵拼音        可信任的跨平台开源输入法        io.github.fm_elpac.pmim_ibus        0.1.2        stable        flathub
```

安装应用:

```sh
> flatpak install flathub io.github.fm_elpac.pmim_ibus
```

![安装应用](./图/5-install-2.png)

运行应用:

```sh
> flatpak run io.github.fm_elpac.pmim_ibus
```

在 `GNOME 软件` 中可以查看应用信息:

![应用信息](./图/5-s-3.png)

支持显示中文, 好评 !


## 6 总结与展望

可以看到, 为了在 flathub 发布 flatpak 应用, 需要做很多工作.
然而, 在努力了这么多天之后, 却突然发现, 喵的 flathub 只能显示英文.
那必然会感到很生气的 !
所以, 必须写一篇文章出来, 反复差评 !!

虽然发布 flatpak 应用比较麻烦, 但是发布之后, 安装和运行就很简单了.
一下子支持了一大堆 GNU/Linux 发行版, 不挑环境, 都能运行.
配合国内 flathub 镜像, 下载安装速度也是快到飞起 !

在此强烈谴责, 希望 flathub 可以放下英语人的傲慢, 不要再一意孤行,
尽快支持显示非英文.

----

本文使用 CC-BY-SA 4.0 许可发布.
