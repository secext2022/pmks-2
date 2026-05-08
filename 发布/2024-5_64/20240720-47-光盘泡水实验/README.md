# 20240720-47

标题:
**光盘防水嘛 ? DVD+R 刻录光盘泡水实验**

索引: `穷人实验室`

关键词: 光盘, 泡水, DVD, 实验, 防水, GNU/Linux


## 图文版

[已发布](./a.md): (5)

+ <https://zhuanlan.zhihu.com/p/709978759>

+ <https://juejin.cn/post/7393313322235904052>

----

首发日期 `2024-07-20`, 以下为原文内容:

----

+ <https://mp.weixin.qq.com/s?__biz=MzkyMDU4ODYwMQ==&mid=2247484154&idx=1&sn=ea4785c7726a6da44470783a66dd79ae&chksm=c191daacf6e653baa7efc09537cd796bcb37c4d084cf6f4375c20e10ca12131dedfb425a1d52&token=1797750552&lang=zh_CN#rd>

+ <https://blog.csdn.net/secext2022/article/details/140583910>

+ <https://www.bilibili.com/read/cv37443770/>


## 更新

+ `2024-07-26` (泡水 7 天后) 测试正常 (读取速度正常, 数据完好).

  泡水时间: `2024-07-18`

  测试记录:

  ```sh
  > dd if=/dev/sr0 of=/dev/null status=progress
  1161150976 字节 (1.2 GB, 1.1 GiB) 已复制，113 s，10.3 MB/s 
  输入了 2291776+0 块记录
  输出了 2291776+0 块记录
  1173389312 字节 (1.2 GB, 1.1 GiB) 已复制，113.951 s，10.3 MB/s
  > sha256sum /dev/sr0
  398dceea2d04767fbb8b61a9e824f2c8f5eacf62b2cb5006fd63321d978d48bc  /dev/sr0
  > dd if=/dev/sr0 of=/dev/null status=progress
  1169539584 字节 (1.2 GB, 1.1 GiB) 已复制，117 s，10.0 MB/s
  输入了 2291776+0 块记录
  输出了 2291776+0 块记录
  1173389312 字节 (1.2 GB, 1.1 GiB) 已复制，117.335 s，10.0 MB/s
  > sha256sum /dev/sr0
  398dceea2d04767fbb8b61a9e824f2c8f5eacf62b2cb5006fd63321d978d48bc  /dev/sr0
  ```

TODO
