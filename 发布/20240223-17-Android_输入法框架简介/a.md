# Android 输入法框架简介

每种平台都有自己的输入法框架.
GNU/Linux 桌面环境有多种输入法框架, 比如 ibus, fcitx 等.
但是 Android 操作系统只有一种, 是统一提供的输入法框架.

----

相关链接:

+ 《ibus 源代码阅读 (1)》

  TODO

+ <https://developer.android.google.cn/develop/ui/views/touch-and-input/creating-input-method>


## 目录

+ 1 Android 输入法框架

+ 2 实现一个简单的 Android 输入法

+ 3 测试

+ 4 总结与展望

+ 附录 1 相关代码


## 1 Android 输入法框架

![Android 输入法框架示意图](../图/20240223-17/1-a-1.jpg)

这个图看起来和 ibus 输入法框架差不多,
都有具体的输入法 (engine), 接受输入的应用,
以及系统服务 (输入法框架).

在 Android 系统中, 输入法, 以及接受输入的应用,
都以应用 (apk) 的形式存在.
可以很方便的安装新的输入法, 就和安装普通的应用一样.


## 2 实现一个简单的 Android 输入法

要想详细的了解 Android 系统的输入法接口,
最好的方法还是自己做一个输入法.

+ (1) 打开 Android Studio, 随意创建一个新的空白应用.

+ (2) 编写一个新的类, 继承 `InputMethodService`
  <https://developer.android.google.cn/reference/android/inputmethodservice/InputMethodService>

  比如创建文件 `app/src/main/java/io/github/fm_elpac/pmim_apk/im/PmimService.kt` (有省略):

  ```kotlin
  package io.github.fm_elpac.pmim_apk.im

  import android.inputmethodservice.InputMethodService

  import android.webkit.WebView
  import android.webkit.JavascriptInterface

  class PmimService : InputMethodService() {

      // 生命周期函数
      override fun onCreate() {
          super.onCreate()
          // 用于调试 (服务生命周期), 下同
          println("PmimService.onCreate()")
      }

      override fun onCreateInputView(): View {
          println("PmimService.onCreateInputView()")

          // 创建 WebView
          var w = WebView(this)
          w.getSettings().setJavaScriptEnabled(true)

          class 接口 {
              @JavascriptInterface
              fun commit(t: String) {
                  im_commitText(t)
              }
          }

          w.addJavascriptInterface(接口(), "pmim")

          w.loadUrl("file:///android_asset/ui/index.html")
          return setH(w)
      }

      // 预留接口: 输入文本
      fun im_commitText(text: String) {
          currentInputConnection.commitText(text, 1)
      }

      fun sendKeyEvent(event: KeyEvent) {
          currentInputConnection.sendKeyEvent(event)
      }
  ```

  这个类就相当于自己实现的一个输入法了.

  其中重要函数 `onCreateInputView()` 创建软键盘,
  就是显示在屏幕底部的触摸输入区域.

+ (3) 添加输入法相关信息.

  文件 `app/src/main/res/xml/im.xml`:

  ```xml
  <?xml version="1.0" encoding="utf-8"?>
  <input-method
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:settingsActivity="io.github.fm_elpac.pmim_apk.MainActivity"
    android:icon="@mipmap/ic_launcher">
    <subtype
      android:label="@string/im_label"
      android:name="@string/im_name"
      android:imeSubtypeLocale="zh_CN"
      android:imeSubtypeMode="keyboard"
    />
    <subtype
      android:label="@string/im_label_en"
      android:name="@string/im_name"
      android:imeSubtypeLocale="en_US"
      android:imeSubtypeMode="keyboard"
    />
  </input-method>
  ```

  文件 `app/src/main/res/values/strings.xml`:

  ```xml
  <resources>
    <string name="app_name">胖喵拼音</string>

    <string name="im_name">胖喵拼音</string>
    <string name="im_label">中文 (中国)</string>
    <string name="im_label_en">Chinese (zh_CN)</string>
  </resources>
  ```

  `im.xml` 里面是输入法的信息, 操作系统 (设置输入法) 需要使用.

+ (4) 清单文件 `app/src/main/AndroidManifest.xml` (有省略):

  ```xml
  <!-- Android 输入法服务 -->
  <service
    android:name=".im.PmimService"
    android:exported="true"
    android:label="@string/im_name"
    android:permission="android.permission.BIND_INPUT_METHOD">
    <intent-filter>
      <action android:name="android.view.InputMethod" />
    </intent-filter>
    <!-- 必须有此元数据, 输入法才能在系统设置中出现 -->
    <meta-data android:name="android.view.im" android:resource="@xml/im" />
  </service>
  ```

  前面编写的类 `PmimService` 是传说中的 Android **四大组件** 之一 (服务),
  所以必须在清单文件中声明.

+ (5) 最后实现用户界面 (底部的软键盘).

  文件 `app/src/main/assets/ui/index.html`:

  ```html
  <!DOCTYPE html>
  <html>
  <head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>测试输入法键盘</title>
  <style>

  body {
    background-color: #FFF3E0;
  }

  img {
    width: 150px;
    height: 150px;
  }

  .b {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border-top: solid 8px #FF9800;

    display: flex;
    align-items: center;
    justify-content: space-around;
  }
  </style>
  </head>
  <body>
    <div class="b">
      <img id="m" src="./m.jpg" />
      <img id="q" src="./q.png" />
    </div>

  <script>
  function 输入(t) {
    console.log(t);

    pmim.commit(t);
  }

  function 初始化() {
    const m = document.getElementById("m");
    const q = document.getElementById("q");

    m.addEventListener("click", () => 输入("喵"));
    q.addEventListener("click", () => 输入("穷"));
  }

  初始化();
  </script>
  </body>
  </html>
  ```


## 3 测试

又到了喜闻乐见的测试环节.

+ (1) 编译 apk (相关重要文件的完整代码请见 附录 1):

  ```sh
  JAVA_HOME=/usr/lib/jvm/java-17-openjdk ./gradlew assembleDebug
  ```

  编译生成的 apk 文件位于: `app/build/outputs/apk/debug/app-debug.apk`

+ (2) 安装 apk.

  使用 USB 数据线连接手机和 PC, 然后:

  ```sh
  > adb devices
  List of devices attached
  268bca3e	device

  > adb install app-debug.apk
  Performing Streamed Install
  Success
  ```

+ (3) 在手机的系统设置里, 启用新的输入法:

  ![启用输入法](../图/20240223-17/3-t-1.jpg)

+ (4) 找一个能输入的地方, 切换输入法:

  ![切换输入法](../图/20240223-17/3-t-2.jpg)

+ (5) 然后就可以愉快的输入啦 ~

  ![输入测试](../图/20240223-17/3-t-3.jpg)

  嗯, 点击这俩图标分别可以输入一个汉字.

----

我们来分析一下, 点击图标的时候发生了什么.

+ (1) 用户界面 (网页) js 代码调用 `pmim.commit()`

+ (2) 其中 `pmim` 是 kotlin 代码调用 `addJavascriptInterface()` 添加的接口.

+ (3) 最后 kotlin 代码调用了 Android 输入法框架的接口 `currentInputConnection.commitText()`,
  最终实现了文字的输入 (撒花 ~~)


## 4 总结与展望

各个平台的输入法框架的整体工作原理都差不多,
输入法框架在中间做管理, 一边是输入法, 一边是接受输入的应用.

和 ibus 相比, Android 输入法框架使用起来要简单容易很多,
Android 官方文档写的也很清楚, 好评 !

今天实现了输入俩字, 距离实现完整的输入法还会远嘛 ?

----

彩蛋:
本文使用刚开发的 ibus 输入法编写.
编写本文的过程中顺便又修复了一个 BUG (输入 `嗯`).

![彩蛋](../图/20240223-17/4-c-1.jpg)


## 附录 1 相关代码

+ `app/src/main/java/io/github/fm_elpac/pmim_apk/im/PmimService.kt`

```kotlin
package io.github.fm_elpac.pmim_apk.im

import android.inputmethodservice.InputMethodService
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.LinearLayout

import android.webkit.WebView
import android.webkit.JavascriptInterface
import android.view.ViewGroup.LayoutParams

// Android 输入法服务, 仅关注面向 Android 系统的接口部分
class PmimService : InputMethodService() {

    // 生命周期函数
    override fun onCreate() {
        super.onCreate()
        // 用于调试 (服务生命周期), 下同
        println("PmimService.onCreate()")
    }

    // 设置软键盘高度
    private fun setH(view: View): View {
        val h = 350f;
        // dp -> px
        val d = resources.displayMetrics.density
        val px = h * d + 0.5f
        println("  dp = " + h + "  d = " + d + "  px = " + px)

        view.setLayoutParams(LayoutParams(-1, px.toInt()))

        val l = LinearLayout(this)
        l.addView(view)
        return l
    }

    override fun onCreateInputView(): View {
        println("PmimService.onCreateInputView()")

        // 创建 WebView
        var w = WebView(this)
        w.getSettings().setJavaScriptEnabled(true);

        class 接口 {
            @JavascriptInterface
            fun commit(t: String) {
                im_commitText(t)
            }
        }

        w.addJavascriptInterface(接口(), "pmim")

        w.loadUrl("file:///android_asset/ui/index.html")
        return setH(w)
    }

    override fun onBindInput() {
        super.onBindInput()
        println("PmimService.onBindInput()")
    }
    override fun onUnbindInput() {
        super.onUnbindInput()
        println("PmimService.onUnbindInput()")
    }

    // 软键盘显示
    override fun onStartInputView(info: EditorInfo, restarting: Boolean) {
        println("PmimService.onStartInputView()")
    }
    // 软键盘隐藏
    override fun onFinishInput() {
        println("PmimService.onFinishInput()")
    }

    override fun onDestroy() {
        super.onDestroy()
        println("PmimService.onDestroy()")
    }

    // 预留接口: 关闭软键盘
    fun im_hideKb() {
        // run on ui thread
        hideWindow()
    }

    // 预留接口: 输入文本
    fun im_commitText(text: String) {
        currentInputConnection.commitText(text, 1)
    }

    fun sendKeyEvent(event: KeyEvent) {
        currentInputConnection.sendKeyEvent(event)
    }

    // 预留接口: 发送编辑器默认动作 (比如: 搜索)
    fun im_sendDefaultEditorAction(fromEnterKey: Boolean) {
        sendDefaultEditorAction(fromEnterKey)
    }

    // 预留接口: 发送字符
    fun im_sendKeyChar(code: Char) {
        sendKeyChar(code)
    }

    // 预留接口: 获取选择的文本 (复制)
    fun im_getSelectedText(): String? {
        return currentInputConnection.getSelectedText(0)?.toString()
    }

    // 预留接口: 设置选择的文本 (比如: 全选)
    fun im_setSelection(start: Int, end: Int) {
        currentInputConnection.setSelection(start, end)
    }
}
```

+ `app/src/main/res/xml/im.xml`: 正文中已贴出完整代码.

+ `app/src/main/res/values/strings.xml`: 正文中已贴出完整代码.

+ `app/src/main/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest
  xmlns:android="http://schemas.android.com/apk/res/android"
  xmlns:tools="http://schemas.android.com/tools">

  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
  <uses-permission android:name="android.permission.VIBRATE" />
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
  <uses-permission android:name="android.permission.INTERNET" />

  <application
    android:allowBackup="true"
    android:dataExtractionRules="@xml/data_extraction_rules"
    android:fullBackupContent="@xml/backup_rules"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/Theme.MyApp"
    tools:targetApi="31">

    <activity
      android:name=".MainActivity"
      android:exported="true"
      android:label="@string/app_name"
      android:theme="@style/Theme.MyApp">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>

    <!-- Android 输入法服务 -->
    <service
      android:name=".im.PmimService"
      android:exported="true"
      android:label="@string/im_name"
      android:permission="android.permission.BIND_INPUT_METHOD">
      <intent-filter>
        <action android:name="android.view.InputMethod" />
      </intent-filter>
      <!-- 必须有此元数据, 输入法才能在系统设置中出现 -->
      <meta-data android:name="android.view.im" android:resource="@xml/im" />
    </service>

  </application>
</manifest>
```

+ `app/src/main/assets/ui/index.html`: 正文中已贴出完整代码.

----

本文使用 CC-BY-SA 4.0 许可发布.
