# 胖喵安初 (azi) Android 应用初始化库 (类似 Termux)

说实话, 窝并不是很喜欢 Android 操作系统.
窝喜欢 GNU/Linux (比如 ArchLinux, Debian, Fedora, Alpine, Ubuntu 等).
但是在手机上, 并没有更好的选择, 所以对于 Android 系统的各种缺点, 忍了 !

Termux 把很多 GNU/Linux 的体验搬到了 Android 系统, 所以 Termux 可能是窝最喜欢的 app !

但是 Termux 只是一个应用, 如何把 Termux 用于自己的应用 ?
为了把 Termux 的体验方便的加入 Android 应用, 窝又造了一个轮子: 胖喵安初 (azi 库).

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 76 号作品. )

----

相关文章:

+ 《小水滴系列文章目录 (整理)》

  TODO

+ 《在 Android 设备上写代码 (Termux, code-server)》

  TODO

+ 《在 Termux 中签名 apk 文件》

  TODO

+ 《高版本 Android 如何访问 sdcard/Android/data 目录中的文件 (翻译)》

  TODO

参考资料:

+ <https://github.com/agnostic-apollo/Android-Docs/blob/master/site/pages/en/projects/docs/apps/processes/app-data-file-execute-restrictions.md>
+ <https://termux.dev/en/>
+ <https://gitlab.com/fdroid/fdroid-website/-/blob/master/_docs/Inclusion_Policy.md?ref_type=heads>
+ <https://gitlab.com/fdroid/fdroid-website/-/blob/master/_docs/Inclusion_How-To.md?ref_type=heads>
+ <https://gitlab.com/fdroid/fdroid-website/-/blob/master/_docs/Submitting_to_F-Droid_Quick_Start_Guide.md?ref_type=heads>
+ <https://gitlab.com/fdroid/fdroid-website/-/blob/master/_docs/Build_Metadata_Reference.md?ref_type=heads>
+ <https://gitlab.com/fdroid/fdroid-website/-/blob/master/_docs/All_About_Descriptions_Graphics_and_Screenshots.md?ref_type=heads>
+ <https://dev.to/sanandmv7/how-to-publish-your-apps-on-f-droid-2epn>
+ <https://crates.io/crates/static-web-server>


## 目录

+ 1 主要设计与实现

+ 2 举栗 (示例应用)

  - 2.1 发布 fdroid
  - 2.2 安装运行
  - 2.3 运行文件服务器

+ 3 总结与展望


## 1 主要设计与实现

胖喵安初 (azi) 的设计非常简单粗暴 (KISS 原则, 保持简单愚蠢):
应用首次启动时, 胖喵安初从 `apk` 的 `assets` 中解压 (释放) 一个 zip 压缩包
(比如 `test-init.azi.zip`) 到应用的 `sdcard/Android/data` 目录,
然后调用 `/system/bin/sh` (Android 系统自带 shell) 执行 `azi_init.sh` 脚本, 来进行初始化操作.
初始化成功后, 创建 `azi_ok` 文件, 避免重复初始化.

由于初始化 zip 包被内嵌到 apk 的 assets 中, 一个 apk 文件就是完整的, 安装之后可以直接初始化并运行.
使用胖喵安初的应用可以在 zip 包中放入任意内容, 且初始化 shell 脚本也在 zip 包中.
shell 脚本为初始化操作提供了很高的灵活性, 有很大的发挥空间.
`sdcard/Android/data` 目录中的文件方便用户查看修改, 也方便开发调试.

为了方便下游应用使用, 胖喵安初编译后是 `AAR` 库.
下游应用只需引入单个文件 `app/libs/azi.aar` 即可使用胖喵安初.

此外, 胖喵安初对 Android WebView 进行了简单封装, 方便使用 vue 等 web 技术栈来开发应用.

----

胖喵安初的主要模块有:

+ `azi-unzip`: 用于解压 zip 包的可执行程序, 使用 rust 编写, 并编译为 Android 可执行的 ELF 二进制文件.

+ `ui-loader`: 一个简单的加载界面, 在进行初始化时显示, 使用 vue 框架编写 (js/vite).

+ azi: 初始化库本体, 使用 kotlin 编写.

+ azi demo: 示例应用, 演示如何使用胖喵安初这个初始化库.


## 2 举栗 (示例应用)

由于胖喵安初进行了封装, 下游应用可以简单的使用.

文件 `demo-apk/app/src/main/java/io/github/fm_elpac/azi_demo/DemoApp.kt`:

```kotlin
package io.github.fm_elpac.azi_demo

import android.app.Application

import io.github.fm_elpac.azi.Azi

class DemoApp: Application() {

    override fun onCreate() {
        super.onCreate()

        // init azi
        Azi.setContext(this)
    }
}
```

这个是在应用启动时, 对胖喵安初库进行初始化.

----

文件 `demo-apk/app/src/main/java/io/github/fm_elpac/azi_demo/MainActivity.kt`:

```kotlin
package io.github.fm_elpac.azi_demo

import android.app.Activity
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.JavascriptInterface

import io.github.fm_elpac.azi.Azi
import io.github.fm_elpac.azi.AziCb
import io.github.fm_elpac.azi.AziWebView

class MainActivity: Activity() {
    var aw: AziWebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        Azi.log("azi-demo MainActivity.onCreate()")

        val w = AziWebView(this)
        // 显示 WebView
        setContentView(w.getWebView())

        // status bar color (black)
        window.statusBarColor = 0xff000000.toInt()

        // 添加自定义 js api
        w.addJsApi("demo", DemoApi(this))
        w.addJsApi("azi_api", LoaderApi())
        // 显示 ui-loader
        w.loadLoader()

        aw = w
        // 开始 (后台) 初始化
        val cb = object: AziCb {
            override fun ok() {
                aw?.loadSdcard(Azi.AZI_DIR_SDCARD_DATA, "demo/index.html")
            }
        }
        Azi.initZip("test-init.azi.zip", "demo", cb)
    }

    // 在受限的 WebView 环境中加载页面
    fun openCleanWebView(url: String) {
        Azi.log("Demo.openCleanWebView()  " + url)

        val w = WebView(this)
        w.settings.javaScriptEnabled = true
        w.setWebViewClient(WebViewClient())

        setContentView(w)
        w.loadUrl(url)
    }
}

class DemoApi(val a: MainActivity) {
    // 打开外部页面 URL
    @JavascriptInterface
    fun openPage(url: String) {
        a.aw?.runOnUiThread {
            a.openCleanWebView(url)
        }
    }
}

class LoaderApi() {
    // azi_api.getJsLoadList()
    @JavascriptInterface
    fun getJsLoadList(): List<String> {
        return listOf<String>()
    }

    // azi_api.checkInit()
    @JavascriptInterface
    fun checkInit(): String {
        return "加载中 .. ."
    }
}
```

这个是在应用主界面启动时, 调用胖喵安初进行初始化, 并在初始化完成后显示 web 界面.

### 2.1 发布 fdroid

fdroid 是一个可以发布 apk 的很特殊的地方: 你把所有源代码交给 fdroid,
然后 fdroid 替你编译出 apk, 替你签名, 替你发布.

如何安装 fdroid 请见文章 《在 Android 设备上写代码 (Termux, code-server)》.

----

然而, 为了实现 fdroid 编译, 费了好大劲, 失败了几十次.
胖喵安初同时使用了 rust, vue, kotlin, aar, 所以编译起来稍微有点麻烦.

总之, 最后成功的方案如下:

文件: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches:
      - main

jobs:

  build-fdroid:
    #needs: build
    runs-on: ubuntu-latest
    container:
      image: registry.gitlab.com/fdroid/fdroidserver:buildserver
    steps:
      - uses: actions/checkout@v4

      - run: apt-get update && apt-get dist-upgrade

      - name: setup env
        run: |
          . /etc/profile.d/bsenv.sh
          # save env
          echo "ANDROID_HOME=${ANDROID_HOME}" >> "$GITHUB_ENV"
          echo "DEBIAN_FRONTEND=${DEBIAN_FRONTEND}" >> "$GITHUB_ENV"
          echo "home_vagrant=${home_vagrant}" >> "$GITHUB_ENV"
          echo "fdroidserver=${fdroidserver}" >> "$GITHUB_ENV"
          echo "LC_ALL=${LC_ALL}" >> "$GITHUB_ENV"

          # more env
          echo PYTHONPATH="$fdroidserver:$fdroidserver/examples" >> "$GITHUB_ENV"
          echo JAVA_HOME=$(java -XshowSettings:properties -version 2>&1 > /dev/null | grep 'java.home' | awk -F'=' '{print $2}' | tr -d ' ') >> "$GITHUB_ENV"
          # PATH
          echo PATH="$fdroidserver:$PATH" >> "$GITHUB_ENV"

          # debug
          cat "$GITHUB_ENV"

      - run: sdkmanager "platform-tools" "build-tools;31.0.0"

      # fdroiddata
      - run: git clone --depth=1 --single-branch https://gitlab.com/fdroid/fdroiddata /build
      - run: cp .fdroid.yml /build/metadata/io.github.fm_elpac.azi_demo.yml

      # fdroidserver
      - run: git clone --depth=1 --single-branch https://gitlab.com/fdroid/fdroidserver $fdroidserver

      - name: "> fdroid readmeta && fdroid rewritemeta"
        run: |
          cd /build
          fdroid readmeta
          fdroid rewritemeta io.github.fm_elpac.azi_demo

      # DEBUG
      - run: cat /build/metadata/io.github.fm_elpac.azi_demo.yml

      - name: "> fdroid checkupdates"
        run: |
          cd /build
          fdroid checkupdates --allow-dirty io.github.fm_elpac.azi_demo

      - name: "> fdroid fetchsrclibs"
        run: |
          cd /build
          fdroid fetchsrclibs --verbose io.github.fm_elpac.azi_demo

      - name: "> fdroid build"
        run: |
          cd /build
          fdroid build --verbose --on-server --no-tarball io.github.fm_elpac.azi_demo

      - uses: actions/upload-artifact@v4
        with:
          name: unsigned-fdroid
          path: /build/unsigned
```

这个是使用 github actions 运行 `fdroidserver` 来编译 apk 的方法.

文件 `.fdroid.yml`:

```yaml
Categories:
  - Development
License: MIT
AuthorName: secext2022
AuthorEmail: secext2022@outlook.com
SourceCode: https://github.com/fm-elpac/azi
IssueTracker: https://github.com/fm-elpac/azi/issues

RepoType: git
Repo: https://github.com/fm-elpac/azi

Builds:
  - versionName: 0.1.0
    versionCode: 2
    commit: HEAD
    sudo:
      - apt-get update
      - apt-get install -y make npm zip
    output: demo-apk/app/build/outputs/apk/release/app-release-unsigned.apk
    srclibs:
      - rustup@1.28.2
    prebuild: $$rustup$$/rustup-init.sh -y --default-toolchain 1.87.0 --target aarch64-linux-android
    build:
      - source $HOME/.cargo/env
      - make BUILD=fdroid all
    ndk: r28b

#AutoUpdateMode: Version
#UpdateCheckMode: Tags v[0-9].*
#UpdateCheckData: demo-apk/app/build.gradle.kts|versionCode\s=\s(\d+)|.|versionName\s=\s"([^"]+)"
#CurrentVersion: 0.1.0
#CurrentVersionCode: 2
```

这个是 fdroid 用于编译 apk 的说明文件.

----

编译成功之后, 就可以按照 fdroid 官方文档, 去提 MR (合并请求) 即可.
当然这个过程又费了好大劲. 总之, 最后成功了 !

### 2.2 安装运行

在 fdroid 中找到胖喵安初:

![azi demo (1)](./图/22-f-1.jpg)

额 .. . 或者搜索:

![azi demo (2)](./图/22-f-2.jpg)

点进去查看详情:

![azi demo (3)](./图/22-f-3.jpg)

![azi demo (4)](./图/22-f-4.jpg)

安装后运行:

![azi demo (5)](./图/22-r-1.jpg)

对应的应用信息:

![azi demo (6)](./图/22-s-1.jpg)

![azi demo (7)](./图/22-s-2.jpg)

![azi demo (8)](./图/22-s-3.jpg)

### 2.3 运行文件服务器

上面只是胖喵安初的初步测试运行, 下面进一步展示胖喵安初的能力.

下载 <https://github.com/fm-elpac/azi/releases/download/v0.1.0/file-server-2__test-init.azi.zip>
然后放在 `/sdcard/Android/data/io.github.fm_elpac.azi_demo/cache/test-init.azi.zip` (注意重命名).
并删除 `/sdcard/Android/data/io.github.fm_elpac.azi_demo/files/demo/` 目录, `/sdcard/Android/data/io.github.fm_elpac.azi_demo/files/azi/azi_ok` 文件.

重新启动应用, 文件服务器就会运行. 在浏览器中打开 `http://localhost:3333` 查看结果.

----

此处的文件服务器 (`static-web-server`) 来自: <https://crates.io/crates/static-web-server>

只需一个简单的 shell 脚本即可在胖喵安初运行 (文件 `demo/azi_init.sh`):

```sh
#!/system/bin/sh
# test file server

echo "init file server"
cp $AZI_DIR_SDCARD_DATA/demo/server/static-web-server $AZI_DIR_APP_DATA

echo "start server (background)"
/system/bin/linker64 $AZI_DIR_APP_DATA/static-web-server -p 3333 -d $AZI_DIR_SDCARD_DATA -z &

sleep 2
/system/bin/sh $AZI_DIR_SDCARD_DATA/demo/rm_ok.sh &

echo exit
```


## 3 总结与展望

胖喵安初 (azi) 是一个简单的 Android 应用初始化库, 可以把类似 Termux 的运行环境引入 apk.
胖喵安初编译后是 aar 包, 方便下游应用引入使用.
胖喵安初对 WebView 进行了简单封装, 方便使用 web 技术栈 (比如 vue) 开发应用.
胖喵安初有一个简单的示例应用, 可以从 fdroid 下载安装.

使用胖喵安初来制造有趣的 Android 应用吧 !

----

本文使用 CC-BY-SA 4.0 许可发布.
