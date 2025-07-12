# 购买域名并制作简单页面 (cloudflare)

cloudflare 被誉为 **赛博佛祖** (引用自公众号 `老冯云数`),
提供 CDN, DNS 等一大堆服务, 在全球网络中具有重要地位.

今天就来体验一下普照的佛光 (一条龙服务).

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 77 号作品. )

----

相关文章:

+ 《小水滴系列文章目录 (整理)》

  TODO

+ 《香橙派安装 adguardhome (docker)》

  TODO

参考资料:

+ <https://developers.cloudflare.com/registrar/get-started/register-domain/>
+ <https://developers.cloudflare.com/workers/>
+ <https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/>
+ <https://rust-lang.github.io/mdBook/>


## 目录

+ 1 购买域名

  - 1.1 挑选域名
  - 1.2 支付

+ 2 简单页面

  - 2.1 mdbook
  - 2.2 worker

+ 3 总结与展望


## 1 购买域名

众所周知, **域名** (Domain Name) 是需要花钱购买和续费的, 一次性最多续费 10 年.
域名过期后, 别人就可以买去用了. 所以, 记得按时续费哦 ~

### 1.1 挑选域名

想要购买域名, 首先需要决定从哪里购买, 有多个选择.
本文既然决定使用一条龙服务, 那自然是选择从赛博佛祖那里购买啦. (详见上面的 `参考资料`)

因为 **穷** (请看窝的网名), 那当然是选择最便宜的域名 (`$8` /年).
然后, 选一个尽量 **短** 的域名, 因为 **懒** 得多按几个键.

很快, 域名就挑选好了. 一年几十元, 也不贵, 比大部分网站会员都便宜, 就当买个便宜的赛博小玩具了.

**免责声明: 本域名仅用于技术测试, 不提供任何实际服务 !**

(Pang Miao Poor Little Water)

### 1.2 支付

众所周知, **支付** 是本文中最大的难点.

看 ! 窝是 银行认证 的穷人, 信用卡都不给发:

![审批拒绝](./图/12-p-1.png)

图片来源: 某银行 app 截图

听说, 申请信用卡需要高学历, 稳定的工作, 或者存款/房车什么的, 这些窝都没有 !!
干日结临时工的勉强生存的打工人, 哪里有稳定的工作 ?

嗯, 所以后来又用别的方式解决了. 由于这不是技术问题, 本文就不记录具体细节了.
总之, 最后成功了:

![购买域名成功](./图/12-p-2.png)


## 2 简单页面

接下来制作简单页面.

### 2.1 mdbook

此处选择使用 `mdbook` 这个工具. 使用 `markdown` 写内容, 然后编译成静态资源文件.

首先安装 mdbook (此处以 ArchLinux 举栗):

```sh
sudo pacman -S mdbook
```

创建新项目:

```sh
mdbook init
```

然后编写内容. 比如配置文件 `book.toml`:

```toml
[book]
authors = ["secext2022"]
language = "zh"
src = "src"
title = "(胖喵) 穷人小水滴"
```

本地预览效果:

```sh
mdbook serve
```

然后编译:

```sh
mdbook build
```

编译输出的文件在 `book` 目录中.

### 2.2 worker

然后部署到 cloudflare worker 上 (详见上面的 `参考资料`).
静态资源文件是免费的.

比如配置文件 `wrangler.toml`:

```toml
name = "plw-mdb"
compatibility_date = "2025-07-01"

[assets]
directory = "./book"
```

github actions 文件 `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches:
      - main

jobs:
  publish-cf:
    runs-on: ubuntu-latest
    container:
      image: quay.io/jitesoft/ubuntu:latest
    steps:
      - uses: actions/checkout@v4
      - run: apt-get update && apt-get install -y mdbook npm

      - run: mdbook build
      # upload
      - uses: actions/upload-artifact@v4
        with:
          name: book
          path: book

      # publish
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

最后的效果如下:

![效果](./图/22-s-1.jpg)


## 3 总结与展望

本文没有任何技术含量. 是的, 这是一篇水文 (狗头)
讲的只是烂大街的东西而已.

30 多岁, 人到中年, 在这个域名几乎被遗忘, 很少有人再手动输入域名的时代, 才有了第一个域名.
哎, 在此小小的伤感一下 ~ 没用, 完全没有什么用.

也就只是一个廉价的赛博小玩具, 还是成年人才能玩的那种, 可以抽空自娱自乐吧.

----

本文使用 CC-BY-SA 4.0 许可发布.
