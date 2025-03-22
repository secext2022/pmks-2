# Android 重要应用下载及更新方法


## 目录

+ adb 相关操作

+ F-Droid

+ 酷安

+ Kiwi 浏览器

+ Brave 浏览器

+ Google Chrome (Android)

+ Magisk

+ AIDA64


## adb 相关操作

+ 查看已连接的 Android 设备

  ```sh
  adb devices
  ```

+ 安装 apk 到 Android 设备

  比如:

  ```sh
  adb install Bravearm64Universal.apk
  ```

+ 从 Android 设备获取已安装的 apk

  比如:

  ```
  > adb shell pm path org.fdroid.fdroid
  package:/data/app/org.fdroid.fdroid-ps9AkVn-jIq06_WeyMYf5g==/base.apk
  > adb pull /data/app/org.fdroid.fdroid-ps9AkVn-jIq06_WeyMYf5g==/base.apk
  /data/app/org.fdroid.fdroid-ps9AkVn-jIq06_WeyMYf5g==/base.apk: 1 file pulled, 0 skipped. 37.8 MB/s (12688611 bytes in 0.320s)
  ```

+ 远程连接 adb

  比如:

  ```
  > adb connect 192.168.33.121
  connected to 192.168.33.121:5555
  > adb devices
  List of devices attached
  192.168.33.121:5555	device
  ```

+ 屏幕截图

  TODO


## F-Droid

<https://f-droid.org/>
<https://github.com/f-droid>

国内镜像:
<https://mirrors.tuna.tsinghua.edu.cn/help/fdroid/>


## 酷安

<https://www.coolapk.com/>


## Kiwi 浏览器

<https://kiwibrowser.com/>
<https://github.com/kiwibrowser/src.next>

下载地址:
<https://github.com/kiwibrowser/src.next/releases>

github 下载加速:
<https://ghproxy.com/>
<https://mirror.ghproxy.com/>
<https://gh.api.99988866.xyz/>
<https://github.ur1.fun/>

<https://climbsnail.github.io/2020/GithubSpeed/>


## Brave 浏览器

<https://brave.com/>
<https://github.com/brave/brave-browser>

下载地址:
<https://github.com/brave/brave-browser/releases>


## Google Chrome (Android)

<https://play.google.com/store/apps/details?id=com.android.chrome&hl=en>

下载地址:
<https://www.techspot.com/downloads/5818-google-chrome-for-android.html>


## Magisk

<https://github.com/topjohnwu/Magisk>

下载地址:
<https://github.com/topjohnwu/Magisk/releases>


## AIDA64

<https://www.aida64.com/downloads>
<https://www.aida64.com/aida64-android>

下载地址:
<https://mobile.softpedia.com/apk/aida64/>

比如:
<https://download.aida64.com/aida64-v198.apk>


TODO
