# 在 Termux 中签名 apk 文件

apk 文件必须经过数字签名, 然后才能在 Android 系统上安装.
本文介绍如何对未签名的 apk 文件进行签名.

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 72 号作品. )

----

相关文章:

+ 《在 Android 设备上写代码 (Termux, code-server)》

  TODO

+ 《高版本 Android 如何访问 sdcard/Android/data 目录中的文件 (翻译)》

  TODO

参考资料:

+ <https://developer.android.google.cn/studio/publish/app-signing>


## 目录

+ 1 apk 数字签名简介

+ 2 具体操作步骤

  - 2.1 安装所需软件
  - 2.2 生成密钥 (自签名证书)
  - 2.3 签名 apk

+ 3 总结与展望


## 1 apk 数字签名简介

在对 apk 进行数字签名之前, 我们首先要知道, 为什么要对 apk 进行签名.

Android 系统规定, apk 安装包文件必须经过数字签名, 才能在 Android 系统中安装:
<https://developer.android.google.cn/studio/publish/app-signing>

如果 apk 没有签名, 就会安装失败, 比如:

![未签名 apk 安装失败](./图/1-f-1.jpg)

然后我们要知道, 什么是 **数字签名** ?

这个涉及到 **密码学** 的非对称加密算法, 比如 RSA 和椭圆曲线 (EC) 等.
**对称加密** 的加密密钥和解密密钥 (key) 相同 (或者很容易从一个推出另一个).
而非对称加密算法的密钥分为 **公钥** (public key) 和 **私钥** (private key).
顾名思义, 公钥就是可以公开的, 别人知道了也没关系.
而私钥必须严格保密, 不能泄露, 一旦私钥泄露, 加密安全就被破坏了 (compromised).

作为普通人, 我们不需要弄懂加密算法的具体细节和数学原理, 但是需要知道其性质, 方便应用.
如果有了私钥, 那么可以很容易的推出公钥.
但是反过来不行, 知道了公钥, 想要推出私钥, 是十分困难的, 实际上可以认为不可行.
这些性质是由很高深的数学原理保证的, 至少在量子计算机成熟之前, RSA 等公钥加密算法是破解不了的.

非对称加密算法中, 使用公钥加密的消息, 必须使用私钥解密.
使用私钥加密的消息, 必须使用公钥解密.
数字签名的原理就是, 使用私钥加密一段消息 (签名信息).
因为大家都知道公钥, 都可以解密查看 (并验证) 这段签名信息.
但是只有签名者持有私钥, 只有签名者可以产生签名信息 (进行签名).

所以, 数字签名成立 (安全) 的前提条件就是, **只有签名者有私钥**.
因此一定要保护好私钥, 不要泄露.
一旦泄露, 数字签名的安全就被破坏了 (拿到私钥的人可以伪造签名).

公钥只是一串数字, 为了方便使用, 经常会用到 **证书** (certificate).
证书就是把公钥和相关信息 (比如拥有这个公钥的机构名称) 包装在一起, 然后再进行数字签名的东西.
是的, **证书本身也是要被数字签名的**.
一种证书是权威机构 (CA) 签发的, 也就是用 CA 的私钥进行数字签名的证书.
比如 HTTPS 证书通常就是 CA 签发的.

另一种是 **自签名证书**, 也就是用自己的私钥签名的证书, 不需要 CA.

----

在 Android 系统中, 同一个应用的 apk 安装包必须始终被同一个证书 (私钥) 签名.
进行应用升级 (安装新版本 apk) 时, 系统会检查新版 apk 的证书是否与已安装的证书相同,
只有相同情况下, 才允许升级.

如果证书不同, 无法安装新的 apk, 只能先将之前安装的应用 **卸载**, 然后再安装新的 apk.
这实际上相当于重新安装了另一个应用.
也就是说, Android 系统 "**只认证书不认人**".

特别需要注意, 在 Android 系统中, **卸载应用会同时删除应用的数据**,
也就是 `/data/data/APP` 目录和 `/sdcard/Android/data/APP` 目录中的数据.
其中 `APP` 是应用的 applicationId.
所以卸载应用需要慎重, 可能造成数据丢失, 建议卸载之前备份重要数据.


## 2 具体操作步骤

下面介绍在 Android 设备 (比如 手机) 上进行 apk 签名的具体方法.

### 2.1 安装所需软件

安装 Termux 的方法详见文章 《在 Android 设备上写代码 (Termux, code-server)》:

TODO

打开 Termux, 安装所需软件包:

![termux 安装软件包 (1)](./图/21-t-1.jpg)

命令:

```sh
pkg install openssl-tool apksigner
```

其中 `openssl-tool` 用来生成私钥和自签名证书, `apksigner` 用来对 apk 签名.

![termux 安装软件包 (2)](./图/21-t-2.jpg)

按 回车键 (Enter/换行) 确认安装.

### 2.2 生成密钥 (自签名证书)

首先生成密钥 (私钥) 和证书:

![生成证书 (1)](./图/22-t-1.jpg)

命令:

```sh
openssl req -x509 -nodes -days 600 -newkey rsa:2048 -keyout key.pem -out cert.pem
```

其中 `req -x509` 表示生成 x509 证书,
`-days 600` 表示证书有效期 600 天 (这个根据自己需要设置, 建议设置久一些, 比如 30 年).
`-newkey rsa:2048` 表示使用 RSA 算法, 2048 位密钥长度 (通常够用, 如果追求安全可以使用 4096 位).
`-keyout key.pem` 表示输出的私钥文件名 `key.pem` (文件名可以随意),
`-out cert.pem` 表示输出的证书文件名 `cert.pem` (文件名可以随意).

![生成证书 (2)](./图/22-t-2.jpg)

提示填写一些证书信息, 这个可以随便填.
然后就能看到生成的私钥文件和证书文件.

----

然后需要生成一个密钥存储文件, 用于签名:

![生成证书 (3)](./图/22-t-3.jpg)

命令:

```sh
openssl pkcs12 -export -in cert.pem -inkey key.pem -out keystore.p12 -password pass:android -name k
```

其中 `-in cert.pem` 指定输入证书文件 `cert.pem`,
`-inkey key.pem` 指定输入私钥文件 `key.pem`.
`-out keystore.p12` 指定输出文件 `keystore.p12` (文件名随意).
`-password pass:android` 指定密码为 `android` (密码随意),
`-name k` 指定密钥名称为 `k` (名称随意).

![生成证书 (4)](./图/22-t-4.jpg)

然后就能看到生成的密钥存储文件.

为了安全, 建议删除私钥文件:

```sh
rm key.pem
```

### 2.3 签名 apk

有了证书 (私钥) 之后, 就可以对 apk 文件签名啦.

首先找一个未签名的 apk 文件复制过来, 比如:

![签名 apk (1)](./图/23-s-1.jpg)

```sh
cp /sdcard/test/io.github.fm_elpac.azi_demo_2.apk .
```

然后进行签名:

![签名 apk (2)](./图/23-s-2.jpg)

命令:

```sh
apksigner sign --ks-type PKCS12 --ks keystore.p12 --in io.github.fm_elpac.azi_demo_2.apk --out io.github.fm_elpac.azi_demo_2-signed.apk
```

其中 `apksigner sign` 表示使用 apksigner 进行签名.
`--ks-type PKCS12` 表示密钥存储格式为 `PKCS12`,
`--ks keystore.p12` 指定密钥存储文件.
`--in io.github.fm_elpac.azi_demo_2.apk` 指定输入文件名 (未签名的 apk),
`--out io.github.fm_elpac.azi_demo_2-signed.apk` 指定输出文件名 (签名后的 apk).

![签名 apk (3)](./图/23-s-3.jpg)

提示输入密码 (在上面设置), 稍后就生成了签名后的 apk 文件.

![签名 apk (4)](./图/23-s-4.jpg)

复制签名后的 apk 文件:

```sh
cp io.github.fm_elpac.azi_demo_2-signed.apk /sdcard/test
```

![签名 apk (5)](./图/23-s-5.jpg)

这里并列显示了未签名和已签名的 apk 文件.

----

然后点击 apk 文件测试安装:

![安装 apk (1)](./图/23-t-1.jpg)

![安装 apk (2)](./图/23-t-2.jpg)

安装成功, 撒花 ~


## 3 总结与展望

apk 文件必须经过数字签名, 才能在 Android 系统上安装.
应用升级时, 新的 apk 签名证书必须与已安装的一致.
在 Termux 中可以使用相关软件, 生成私钥和自签名证书, 然后对 apk 文件进行签名.

而这一切可以在 Android 设备上进行, Termux 的含金量又增加了 !!

最后, 一定要保护好私钥, 不要丢失或泄露哦 ~

----

本文使用 CC-BY-SA 4.0 许可发布.
