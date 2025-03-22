# 发布 rust 源码包 (crates.io)

rust 编程语言的包 (或者 `库`, library) 叫做 `crate`,
也就是软件中的一个组件.
一个完整的软件通常由多个 crate 组成,
rust 编译器 (`rustc`) 一次编译一整个 crate,
不同的 crate 可以同时并行编译.

rust 官方有一个集中发布开源包的网站 `crates.io`.
发布在这上面的 crate 可以很方便的在自己的项目中依赖使用,
国内也有这个网站的加速镜像.

本文介绍发布 crate 的过程.

----

相关链接:

+ 《ibus 源代码阅读 (1)》

  TODO

+ <https://www.rust-lang.org/>

+ <https://crates.io/>

  国内镜像: <https://rsproxy.cn/>


## 目录

+ 1 编写 `Cargo.toml`

+ 2 登录 `crates.io`

+ 3 发布源码包

+ 4 总结与展望


## 1 编写 `Cargo.toml`

在发布之前, 需要仔细检查一下 `Cargo.toml` 文件, 比如:

```toml
[package]
name = "librush"
version = "0.1.0-a1"
edition = "2021"
license = "LGPL-2.1-or-later OR GPL-3.0-or-later"

authors = ["secext2022 <secext2022@outlook.com>"]
description = "艾刷 (libRush = lib + IBus + Rust + h): 用 rust 编写的 ibus 模块, 不用 GObject (ibus module written in pure rust, without GObject) (输入法, input method)"
repository = "https://github.com/fm-elpac/librush"
keywords = ["ibus", "input-method"]
categories = ["accessibility", "api-bindings", "localization"]

[[bin]]
name="ibrus"
path="src/bin.rs"

[dependencies]
log = "^0.4.20"
serde = "^1.0.196"
serde_json = "^1.0.113"
zbus = { version = "^4.0.1", default-features = false }

env_logger = "^0.11.1"

tokio = { version = "^1.36.0", features = ["full"], optional = true }

[build-dependencies]
built = { version = "^0.7.1" }
vergen = { version = "^8.3.1", features = ["build", "git", "gitcl"] }

[features]
default = ["pmim"]
pmim = ["tokio", "zbus/tokio"]
async-io = ["zbus/async-io"]
```

下面对其中的一些重要字段进行说明:
(参考文档 <https://doc.rust-lang.org/cargo/reference/manifest.html>)

+ `name` 源码包的名称.

  和大部分编程语言的 **标识符** 的命名规则差不多.
  只允许使用 `0-9a-z` 和 `-` `_` 字符, 最大长度 64.

  crates.io 对于名称的管理原则是, **先到先得**.
  除非特殊情况, 谁先发布了某个名称的源码包, 这个名称就归谁所有.
  这个类似于域名 (DNS) 的管理原则.

  所以, 有喜欢的名称快去抢啊 ~

+ `version` 源码包的版本号.

  必须符合 **语义化版本 2.0.0** <https://semver.org/lang/zh-CN/>

+ `edition` rust 编程语言的大版本.

  rust `1.0` 版本以后, 必须保持很强的向后兼容性, 不能破坏已有的代码.
  为了在兼容的同时, 能够继续健康发展 (避免历史包袱),
  rust 提出了 edition 机制.

  每 3 年推出一个 edition, 目前有: 2015, 2018, 2021.
  不同 edition 的代码不兼容.

  参考文档 <https://doc.rust-lang.org/edition-guide/editions/index.html>

+ `license` 源码包使用的开源许可证.

  许可证的列表可以在这个网站查找: <https://spdx.org/licenses/>

+ `authors` 作者.

+ `description` 源码包的描述, 比较简短 (可以使用中文).

+ `repository` 对应源代码仓库的 URL.

+ `keywords` 关键词.

  有助于搜索到这个源码包.
  最多 5 个, 只能使用 ASCII 字符, 每个关键词的最大长度 20.
  这个对中文不太友好, 必须差评 !

+ `categories` 源码包所属的分类.

  最多 5 个, 只能从这个列表中选择: <https://crates.io/category_slugs>

----

区区几个字段, 每个字段都对应一大堆不同的规则.
想搞懂所有这些还真不容易呢 !

除了 `Cargo.toml` 文件, 还要检查一下 `README.md` 文件,
这个是项目的说明文件, 别人点进去首先看到的东西.

最后使用命令 `cargo doc` 编译一下文档,
在本地先看看文档是否还需要补充.


## 2 登录 `crates.io`

![crates.io](../图/20240220-16/2-cratesio-1.jpg)

打开 `crates.io`, 点击右上角的 `Log in with GitHub` 登录.

![设置](../图/20240220-16/2-cratesio-2.jpg)

登录之后, 点击右上角的 `Account Settings`.

![token](../图/20240220-16/2-cratesio-3.jpg)

点击左侧的 `API Tokens`, 然后创建一个新的 token.
在本地运行命令:

```sh
> cargo login --registry crates-io
```

粘贴刚刚创建的 token, 完成登录.


## 3 发布源码包

在项目的根目录运行命令:

```sh
> cargo publish --registry crates-io
```

耐心等待, 这个会把要发布的源码包重新编译一遍,
可能需要比较长的时间.
编译完后就会发布了.

![dashboard](../图/20240220-16/3-cratesio-1.jpg)

发布之后就能在 `My Crates` 看到了.

![详情页](../图/20240220-16/3-cratesio-2.jpg)


## 4 总结与展望

`crates.io` 是 rust 源码包集中发布的地方,
发布一个 crate 还是比较简单的.

如果有 rust 代码需要分享, 建议发在这里, 使用起来就会很方便.

----

本文使用 CC-BY-SA 4.0 许可发布.
