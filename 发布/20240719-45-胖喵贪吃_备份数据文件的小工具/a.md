# 胖喵贪吃: 备份数据文件的小工具

感谢国家 !
这边最高水位, 还差 10 厘米, 水没有进屋, 太好了 !
最近几天下大雨, 门口的公路被水淹了 (现在已经恢复正常).
昨天紧急用光盘备份重要数据, 用半天时间写了个备份小工具, 然后半天时间刻录光盘.
现在数据已经落盘为安啦, 撒花 ~

```
胖喵贪吃 (PMBB): 备份数据文件的辅助小工具

正式名称: 紫腹巨蚊 (Toxorhynchites gravelyi) 系列
  脂肪细胞 (Fat cell) 工具
```

----

相关文章:

+ 《基于 sftp 的 NAS (局域网文件存储服务器)》

  TODO

+ 《穷人如何备份数据 ? 常见存储设备简单总结》

  TODO

+ 《光驱的内部结构及日常使用》

  TODO


## 目录

+ 1 主要问题

+ 2 手搓备份小工具

  - 2.1 sha256sum 和 du 命令
  - 2.2 分层贪心装箱 (背包问题)

+ 3 备份数据的实际过程

  - 3.1 创建 btrfs 快照
  - 3.2 在服务器上进行文件扫描
  - 3.3 装箱计划
  - 3.4 刻录光盘 (srv2)
  - 3.5 落盘为安
  - 3.6 备份 sd2 文件

+ 4 总结与展望


## 1 主要问题

单层蓝光光盘 (BD-R) 容量只有 25GB (实际容量 23.3GB, 23866MB), 比较小.
多层蓝光光盘 (BD-R DL, BD-R XL) 容量有 50GB 和 100GB, 但是比单层贵很多, 不优先考虑.

备份的数据量通常较大, 一次备份需要使用多张光盘.
如何把这一大堆文件, 分别装进不同的光盘, 是个问题.
同时为了方便使用光盘中的文件, 还有这些要求:

+ (1) **单个文件不能分割**.
  每个数据文件, 必须完整的存放在一张光盘上, 不能分散位于多张光盘.

  如果一张光盘损坏/丢失了, 那么一个文件要么完好, 要么完全丢失,
  不会出现丢失一半的情况.
  大部分文件, 丢失一半就没法用了, 和完全丢失相比差不多.

+ (2) **单个目录尽量不拆分**.
  一个目录 (及下级目录) 中的所有文件, 尽量存放在同一张光盘上.

  一个目录中的文件, 关系比较密切, 通常是关于同一个主题的.
  这个要求也是为了避免出现文件丢失一半的情况.
  当然这个要求并不总是能够满足, 因为一张光盘的容量有限,
  有的目录总的大小太大, 无法放进一张光盘, 从而必须拆分.

+ (3) 方便文件管理.
  需要方便的知道, 一次备份中有哪些文件, 每个文件分别位于哪张光盘,
  并且能够方便的验证文件的完整性 (检查文件数据是否损坏).

由于光盘备份文件比较冷门, 在窝的知识储备中, 并没有现成的工具,
可以很好的满足上述要求 (也可能有, 但是窝还不知道).

并且由于时间紧 (当时正在涨水, 不知道啥时候水就进屋, 被淹了),
查找/学习使用/尝试使用新的工具 (软件) 同样需要不少时间,
所以窝就直接手搓了一个用于文件备份的小工具, 用时半天.


## 2 手搓备份小工具

为了尽可能快的开发, 选择了 `TypeScript` 编程语言, 以及 `deno` 运行环境.

相关链接: <https://deno.com/>

### 2.1 sha256sum 和 du 命令

GNU/Linux 系统中的 `sha256sum` 命令可以用来计算文件的 `sha256` 值, 比如:

```sh
s2@S2L ~/pmbb (main)> type sha256sum
sha256sum is /usr/bin/sha256sum
s2@S2L ~/pmbb (main)> pacman -Qo sha256sum
/usr/bin/sha256sum 由 coreutils 9.5-1 所拥有
s2@S2L ~/pmbb (main)> sha256sum LICENSE
3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986  LICENSE
```

sha256 是一种很强的 hash 算法, 只要输入数据有一点点改变, 计算结果就会有很大差别.
可以认为, 如果两个文件的 sha256 一样, 那么其中的数据就完全一样.

`du` 命令可以列出文件的大小 (占用的存储空间), 比如:

```sh
s2@S2L ~/pmbb (main)> type du
du is /usr/bin/du
s2@S2L ~/pmbb (main)> pacman -Qo du
/usr/bin/du 由 coreutils 9.5-1 所拥有
s2@S2L ~/pmbb (main)> du -ab src
660	src/bb/mod.ts
2404	src/bb/run.ts
242	src/bb/time.ts
1548	src/bb/size.ts
37	src/bb/util.ts
1938	src/bb/file.ts
47	src/bb/t.ts
277	src/bb/conf.ts
128	src/bb/log.ts
2362	src/bb/read.ts
8144	src/bb/box.ts
17787	src/bb
0	src/bin/pmbb.ts
1069	src/bin/pmbb-gen.ts
1192	src/bin/pmbb-box.ts
0	src/bin/pmbb-delta.ts
1449	src/bin/pmbb-same.ts
1043	src/bin/pmbb-scan.ts
4753	src/bin
22540	src
```

编写的备份小工具会基于这两个命令.

### 2.2 分层贪心装箱 (背包问题)

把一大堆文件, 装入几个容量固定的光盘, 这很明显就是一个 **背包问题** 嘛.

背包问题:
有一大堆东西, 每个东西有不同的重量. 有几个背包, 每个背包有最大重量限制.
问: 怎么装 ?

然而, 背包问题是 NPC 问题, 也就是最困难的那一种问题.
最优解只能枚举, 时间复杂度 `O(2^N)`, 显然这是不可接受的
(比如有 1 万个文件, 那么就要计算 2 的 1 万次方步, 这算到黑洞蒸发都算不完).
所以, 随便求个次优解就得了.

贪心: 就是每次装东西的时候, 优先装最大的那个.
这种算法的时间复杂度是 `O(NM)`, 其中 N 是光盘个数, M 是文件个数.
比如 10 张光盘, 1 万个文件, 大约只需计算 10 万步即可.

分层: 要备份的文件不是零散的, 各自孤立的, 前面有 **单个目录尽量不拆分** 的要求.
所以在进行贪心装箱的时候, 首先把一个目录 (以及其下级的所有文件) 作为一个整体,
尝试装箱, 如果实在装不下, 再考虑拆分, 把这个目录的直接下级文件/目录分别考虑.

关键实现代码如下:

```ts
/**
 * 树形 du 结构的单个节点
 */
interface 节点du {
  /**
   * 节点路径
   */
  p: string;
  /**
   * 节点名称 (路径的最后一部分)
   */
  n: string;

  /**
   * 节点总大小 (字节)
   */
  s: number;

  /**
   * 下级节点.
   *
   * null 表示普通文件, 否则表示目录.
   */
  c: null | Map<string, 节点du>;

  /**
   * 包含的文件个数
   */
  cn: number;
}

function 分层贪心装箱(输入: 节点du, 箱: Array<number>): Array<节点du> {
  // 创建箱列表
  const o = [] as Array<节点du>;
  for (let i = 0; i < 箱.length; i += 1) {
    o.push({
      p: ".",
      // 箱的名称
      n: "box-" + (i + 1) + "_" + 箱.length,

      // 箱剩余容量 (字节)
      s: 箱[i],
      c: new Map(),
      cn: 0,
    });
  }

  // 剩余未装箱列表
  let 剩余 = [] as Array<节点du>;
  // 初始化填充剩余列表
  for (const i of 输入.c!.values()) {
    剩余.push(i);
  }

  // 无法装箱列表
  const 无法装箱 = [] as Array<节点du>;
  // 防止装箱死循环
  while ((无法装箱.length < 1) && (剩余.length > 0)) {
    // 对剩余列表按照从大到小排序 (降序)
    剩余.sort((a, b) => b.s - a.s);

    // 对每个箱进行贪心装箱
    for (const i of o) {
      // 存放本箱无法装下的东西
      const 暂存 = [] as Array<节点du>;
      // 对每个剩余项, 尝试装箱
      for (const j of 剩余) {
        if (j.s > i.s) {
          // 容量不足, 无法装箱
          暂存.push(j);
        } else {
          // 容量够, 可以装箱
          i.s -= j.s;
          i.c!.set(j.n, j);
        }
      }
      剩余 = 暂存;
    }

    // 处理剩余列表
    if (剩余.length > 0) {
      const 暂存 = [] as Array<节点du>;
      for (const i of 剩余) {
        if (null != i.c) {
          // 目录, 拆分 (分别处理每个下级)
          for (const j of i.c.values()) {
            暂存.push(j);
          }
        } else {
          // 普通文件, 无法装箱
          无法装箱.push(i);
        }
      }
      剩余 = 暂存;
    }
  }
  // 检查装箱失败
  if (无法装箱.length > 0) {
    log1("错误: 装箱失败 !");
    console.debug(无法装箱);

    throw new Error("box fail");
  }
  // 更新每箱的总大小
  for (const i of o) {
    const 下级 = Array.from(i.c!.values());
    i.s = 下级.reduce((x, y) => x + y.s, 0);
    i.cn = 下级.reduce((x, y) => x + y.cn, 0);
  }
  return o;
}
```

其中 `节点du` 是一个树形结构, 输入的每个文件/目录都对应一个节点.

函数 `分层贪心装箱` 的输入数据, 是一个需要分装的树形结构 (一堆文件).
`箱` 是每个箱的容量 (单位: 字节).
输出是已经分装好的文件, 每个结果用一个树形结构来表示.

首先初始化 "输出结果列表", "剩余列表", "无法装箱" 列表.
然后进行循环装箱 (`while` 循环).
为了保证贪心 (优先装最大的), 首先对剩余文件列表进行从大到小排序.
对每个箱, 都进行贪心尝试 (外层 `for i` 循环).
贪心时, 对每个剩余文件都尝试装箱 (内层 `for j` 循环).

对所有箱都贪心一遍后, 剩余未装箱的文件, 说明太大装不下, 需要对目录进行拆分,
单独考虑每个直接下级文件/目录.
如果是普通文件, 因为不允许分割, 所以装箱失败.

在装箱过程中, 为了方便计算, 箱的大小记录的是剩余容量 (字节数).
装箱完毕之后, 为了方便后续处理, 箱的大小改成里面所有文件的总大小.

计算完毕, 返回结果.


## 3 备份数据的实际过程

胖喵贪吃 (PMBB) 主要实现了这些命令:

+ `pmbb-scan`: 使用 sha256sum 和 du 命令扫描要备份的文件,
  获取文件大小 (字节) 和 sha256 值.

+ `pmbb-same`: 根据 sha256 查找重复文件 (内容完全相同).

+ `pmbb-box`: 根据 `pmbb-scan` 扫描的结果, 使用分层贪心装箱,
  计算生成 **装箱计划** 文件.

+ `pmbb-gen`: 根据装箱计划, 进行实际的文件复制.

### 3.1 创建 btrfs 快照

要备份的数据文件存储在局域网 NAS 服务器上
(详见文章 《基于 sftp 的 NAS (局域网文件存储服务器)》),
分为 `srv2` (可以公开), `sd2` (不能公开) 类别.
还有允许丢失的文件 (`srv1`, `sd1`), 不需要备份, 此处忽略.

此处使用 btrfs 快照进行备份, 也就是先创建 (只读) 快照, 然后对快照进行备份.
这样比较方便, 因为快照中的文件是固定不变的, 可以避免出现一些奇奇怪怪的问题.

```sh
core@MiWiFi-RA74-srv:/mnt/data/bf2s/@fct$ pwd
/mnt/data/bf2s/@fct
core@MiWiFi-RA74-srv:/mnt/data/bf2s/@fct$ ls -al
total 16
drwxr-xr-x. 1 fc-test fc-test  86 Jul 15 03:48 .
drwxr-xr-x. 1 root    root     32 Jun 30 09:38 ..
drwxr-x---. 1 root    root    362 Jul 17 04:31 .snapshots
drwxr-xr-x. 1 fc-test fc-test  40 Jul 15 03:48 backup_scan
drwxr-xr-x. 1 root    root     40 Jul 15 03:44 backup-snapshot
drwx------. 1 fc-test fc-test  92 Jul  4 12:24 sd2
drwxr-xr-x. 1 fc-test fc-test 132 Jul  4 12:25 srv2
core@MiWiFi-RA74-srv:/mnt/data/bf2s/@fct$ 
```

这里是需要备份的数据, 其中 `backup-snapshot` 是一个 subvol,
专门用来存放备份用的快照.

```sh
core@MiWiFi-RA74-srv:/mnt/data/bf2s/@fct$ sudo btrfs subvol snapshot -r . backup-snapshot/backup-test-20240717
Create readonly snapshot of '.' in 'backup-snapshot/backup-test-20240717'
core@MiWiFi-RA74-srv:/mnt/data/bf2s/@fct$ ls -l backup-snapshot/

drwxr-xr-x. 1 fc-test fc-test 86 Jul 15 03:48 backup-test-20240717
```

使用 `btrfs subvol snapshot` 命令创建快照, `-r` 选项表示创建 **只读** 快照.
然后可以看到 `backup-test-20240717` 就是新创建的快照.

```sh
fc-test@MiWiFi-RA74-srv:/mnt/data/bf2s/@fct/backup-snapshot/backup-test-20240717$ pwd
/mnt/data/bf2s/@fct/backup-snapshot/backup-test-20240717
fc-test@MiWiFi-RA74-srv:/mnt/data/bf2s/@fct/backup-snapshot/backup-test-20240717$ ls -al
total 0
drwxr-xr-x. 1 fc-test fc-test  86 Jul 15 03:48 .
drwxr-xr-x. 1 root    root     80 Jul 17 04:33 ..
drwxr-xr-x. 1 fc-test fc-test   0 Jul 17 04:34 .snapshots
drwxr-xr-x. 1 fc-test fc-test  40 Jul 15 03:48 backup_scan
drwxr-xr-x. 1 fc-test fc-test   0 Jul 17 04:34 backup-snapshot
drwx------. 1 fc-test fc-test  92 Jul  4 12:24 sd2
drwxr-xr-x. 1 fc-test fc-test 132 Jul  4 12:25 srv2
fc-test@MiWiFi-RA74-srv:/mnt/data/bf2s/@fct/backup-snapshot/backup-test-20240717$ 
```

可以看到, 快照里面的文件和原来的文件是一模一样的.

### 3.2 在服务器上进行文件扫描

`pmbb-scan` 命令最好在服务器上执行, 这样服务器直接读取本机硬盘中的文件,
无需通过网络传输文件的数据, 可以加快速度, 提高效率.

在 Fedora CoreOS 中运行 deno 的简单方法是, 通过 toolbox 运行 ArchLinux:

```sh
fc-test@MiWiFi-RA74-srv:~$ toolbox --version
toolbox version 0.0.99.5
fc-test@MiWiFi-RA74-srv:~$ toolbox create -d arch
Image required to create toolbox container.
Download quay.io/toolbx/arch-toolbox:latest ( ... MB)? [y/N]: y
Created container: arch-toolbox-latest
Enter with: toolbox enter arch-toolbox-latest
fc-test@MiWiFi-RA74-srv:~$ toolbox enter arch-toolbox-latest
[fc-test@toolbox ~]$ 
```

然后用 pacman 安装 deno:

```sh
[fc-test@toolbox ~]$ sudo pacman -S deno
resolving dependencies...
looking for conflicting packages...

Package (1)  New Version  Net Change  Download Size

extra/deno   1.44.1-1      95.44 MiB      30.73 MiB

Total Download Size:   30.73 MiB
Total Installed Size:  95.44 MiB

:: Proceed with installation? [Y/n] 
:: Retrieving packages...
 deno-1.44.1-1-x86_64 downloading...
checking keyring...
checking package integrity...
loading package files...
checking for file conflicts...
:: Processing package changes...
installing deno...
:: Running post-transaction hooks...
(1/1) Arming ConditionNeedsUpdate...
[fc-test@toolbox ~]$ type deno
deno is /usr/sbin/deno
[fc-test@toolbox ~]$ deno --version
deno 1.44.1 (release, x86_64-unknown-linux-gnu)
v8 12.6.228.3
typescript 5.4.5
[fc-test@toolbox ~]$ 
```

有了 deno 就可以运行胖喵贪吃小工具了, 先把代码复制过去:

```sh
[fc-test@toolbox pmbb]$ pwd
/var/home/fc-test/pmbb
[fc-test@toolbox pmbb]$ ls -l
total 4
-rw-r--r-- 1 fc-test fc-test 351 Jul 16 13:15 deno.json
drwxr-xr-x 1 fc-test fc-test  10 Jul 15 03:02 src
```

----

然后执行文件扫描:

```sh
[fc-test@toolbox backup-test-20240717]$ pwd
/mnt/data/bf2s/@fct/backup-snapshot/backup-test-20240717
[fc-test@toolbox backup-test-20240717]$ deno run -A ~/pmbb/src/bin/pmbb-scan.ts ./srv2 ~/pmbb/scan-srv2
pmbb-scan pmbb v0.1.0-a1: 20240717_044422
扫描目录: ./srv2
  运行: du -ab ./srv2 > /var/home/fc-test/pmbb/scan-srv2/du-20240717_044422.txt
  运行: find ./srv2 -type f -print0 | xargs -0 sha256sum > /var/home/fc-test/pmbb/scan-srv2/sha256-20240717_044422.txt
[fc-test@toolbox backup-test-20240717]$ 
```

此处胖喵贪吃分别调用 `du` 和 `sha256sum` 命令对文件进行扫描, 并保存结果.
这一步可能会比较慢, 因为需要把所有文件读取一遍.
如果文件在硬盘上, 那么读取速度大约 100 ~ 200MB/s, 根据具体的数据量,
可能需要几分钟或者更久.

因为 `srv2` 和 `sd2` 是不同的数据级别, 所以分开备份, 分别管理.
此处以备份 `srv2` 文件举栗.

### 3.3 装箱计划

有了上一步的扫描结果之后, 接下来的操作就不需要在服务器上进行了.
把扫描结果复制到本机, 在本机计算装箱计划:

```sh
> deno run -A src/bin/pmbb-box.ts tmp/scan-srv2 tmp/box-srv2
pmbb-box: pmbb v0.1.0-a1
  读取: tmp/scan-srv2/sha256-20240717_044422.txt
  读取: tmp/scan-srv2/du-20240717_044422.txt
总文件数 6341
  目录数 537
空目录 6 个
需要装箱的文件总大小: 29.0GB
  箱总数 1
  箱大小: 22.0GB
  箱总大小: 22.0GB
错误: 装箱失败, 箱总容量太小 !
error: Uncaught (in promise) Error: box err
    throw new Error("box err");
          ^
    at 分装 (file:///home/s2/pmbb/src/bb/box.ts:335:11)
    at pmbb_box (file:///home/s2/pmbb/src/bin/pmbb-box.ts:48:9)
    at eventLoopTick (ext:core/01_core.js:168:7)
```

胖喵贪吃默认使用 1 张蓝光光盘, 因为容量不足, 装箱失败.

使用 `PMBB_BN=` 指定使用多少张光盘, 重新装箱:

```sh
> env PMBB_BN=2 deno run -A src/bin/pmbb-box.ts tmp/scan-srv2 tmp/box-srv2
pmbb-box: pmbb v0.1.0-a1
  读取: tmp/scan-srv2/sha256-20240717_044422.txt
  读取: tmp/scan-srv2/du-20240717_044422.txt
总文件数 6341
  目录数 537
空目录 6 个
需要装箱的文件总大小: 29.0GB
  箱总数 2
  箱大小: 22.0GB, 22.0GB
  箱总大小: 44.0GB
开始计算装箱 .. .
装箱结果:
box-1_2: 22.0GB (6060 个文件)  23599237364
box-2_2: 7.0GB (281 个文件)  7524583624

  tmp/box-srv2/box-1_2/bb_plan-box-1_2-20240717_044422-sha256.txt
  tmp/box-srv2/box-2_2/bb_plan-box-2_2-20240717_044422-sha256.txt

详细清单:

box-1_2: 22.0GB (6060 个文件)  23599237364
  17.3GB (400)  srv2/pdf
  4.1GB (5508)  srv2/txt
  372.2MB (72)  srv2/z2024
  94.3MB (4)  srv2/iso
  69.6MB (47)  srv2/txt-c
  52.8MB (20)  srv2/fc-server
  185.5KB (2)  srv2/p
  57.3KB (7)  srv2/smartctl_log

box-2_2: 7.0GB (281 个文件)  7524583624
  6.1GB (149)  srv2/apk
  977.4MB (132)  srv2/vs
```

装箱成功, 生成了 **装箱计划文件** (`bb_plan`) 并显示详细的装箱清单.
这一步的计算很快就能完成, 通常只需要几秒.

### 3.4 刻录光盘 (srv2)

装箱计划没问题之后, 就可以刻录光盘了.
刻录光盘在本机进行, 所以需要把服务器上的相应文件下载下来.
备份 `srv2` 文件一共需要刻录 2 张光盘, 此处以刻录第一张举栗.

+ (1) 使用 `pmbb-gen` 命令 (省略部分结果):

  ```sh
  > deno run -A src/bin/pmbb-gen.ts box-srv2/box-1_2/ /run/user/1000/gvfs/sftp:host=fc-server/var/mnt/data/bf2s/@fct/backup-snapshot/backup-test-20240717 box-srv2/box-1_2/gen
  pmbb-gen: pmbb v0.1.0-a1
    读取: box-srv2/box-1_2/bb_plan-box-1_2-20240717_044422-sha256.txt
  mkdir -p box-srv2/box-1_2/gen/srv2/fc-server/20240614-hp-z440-bios-202205
  ```

  胖喵贪吃会根据装箱计划, 复制需要的文件, 放入 `box-1_2/gen` 目录.
  这一步需要从服务器下载文件, 速度受限于局域网的网速.
  如果是千兆以太网, 那么下载速度大约 100MB/s.
  根据具体的数据量, 可能需要几分钟或更久.

+ (2) 验证下载的文件.
  胖喵贪吃的装箱计划文件的格式, 与 `sha256sum` 命令的输出格式相同.
  所以可以直接使用 `sha256sum` 命令来检查文件 (省略部分结果):

  ```sh
  > pwd
  /home/s2/pmbb/box-srv2/box-1_2/gen
  > sha256sum -c ../bb_plan-box-1_2-20240717_044422-sha256.txt 
  srv2/fc-server/20240614-hp-z440-bios-202205/c04582559.pdf: 成功
  srv2/fc-server/20240614-hp-z440-bios-202205/sp140179.tgz: 成功
  ```

+ (3) 打包 `tar` 文件:

  ```sh
  tar -cvf - gen | split --bytes=4GB - srv2-box-1_2.tar.
  ```

  由于 Linux 对 `UDF` 文件系统的支持不好, 所以此处选择使用 `iso9660` 文件系统
  (以后有时间再去尝试 UDF).
  但是 iso9660 因为比较古老, 各方面的限制比较大, 比如文件名长度限制,
  单个文件大小不能超过 4GB 等.
  所以此处选择对要备份的文件使用 `tar` 进行打包.

  tar 是 50 年前 UNIX 开始使用的古老打包格式, 最初设计用于磁带存储.
  tar 打包格式非常简单, 有许多工具都支持, 至今仍然广泛使用.

  注意, 此处只进行了打包, **没有使用压缩** !
  这是为了, 如果光盘上的数据损坏了一小块, 可以尽量减少丢失的文件.
  如果使用了压缩, 并且数据损坏了一小块, 那么很有可能丢失全部文件
  (数据损坏一点就会导致所有文件无法解压).

  使用 tar 打包出来的文件很大, iso9660 不支持, 所以又使用 `split`
  切分成几个较小的文件.

  参考资料: <https://linuxconfig.org/how-to-split-tar-archive-into-multiple-blocks-of-a-specific-size>

  打包之后的文件如下:

  ```sh
  > ls -l
  总计 23054624
  -r--r--r-- 1 s2 s2     908541  7月17日 14:14 bb_plan-box-1_2-20240717_044422-sha256.txt
  -r--r--r-- 1 s2 s2        906  7月17日 14:14 box-srv2-20240717.txt
  -r--r--r-- 1 s2 s2     617409  7月17日 14:14 du-20240717_044422.txt
  -r--r--r-- 1 s2 s2     954831  7月17日 14:14 sha256-20240717_044422.txt
  -rw-r--r-- 1 s2 s2 4000000000  7月17日 15:35 srv2-box-1_2.tar.aa
  -rw-r--r-- 1 s2 s2 4000000000  7月17日 15:36 srv2-box-1_2.tar.ab
  -rw-r--r-- 1 s2 s2 4000000000  7月17日 15:37 srv2-box-1_2.tar.ac
  -rw-r--r-- 1 s2 s2 4000000000  7月17日 15:38 srv2-box-1_2.tar.ad
  -rw-r--r-- 1 s2 s2 4000000000  7月17日 15:38 srv2-box-1_2.tar.ae
  -rw-r--r-- 1 s2 s2 3605432320  7月17日 15:39 srv2-box-1_2.tar.af
  ```

+ (4) 生成 `iso` 光盘镜像:

  ```sh
  > xorrisofs -V "BOX_SRV2_1_2_20240717" -J -o box_1_2.iso box-1_2/
  ```

  命令 `xorrisofs` 来自 `libisoburn` 软件包.
  `-V` 指定光盘的名称 (文件系统的卷标, label), `-o` 指定输出的文件名.
  生成的文件如下:

  ```sh
  s2@a2 ~/p/box-srv2> ls -l
  drwxr-xr-x 1 s2 s2         450  7月17日 15:39 box-1_2/
  -rw-r--r-- 1 s2 s2 23608293376  7月17日 15:44 box_1_2.iso
  drwxr-xr-x 1 s2 s2         272  7月17日 15:24 box-2_2/
  ```

  这个 iso 文件可以直接使用 GNOME 文件管理器挂载, 方便检查验证.

  ```sh
  > sha256sum *
  31e9d9d8e165755b03f1cc62dff8c77ac391fea11c3a699d65b11b7b787d47d4  bb_plan-box-1_2-20240717_044422-sha256.txt
  1dbeb82b08f1ae162e365e5d7af396183064494f7cd016b4fb7ceb2f3d7b145e  box-srv2-20240717.txt
  38fb49e1e10445f3a3465c1180d96976f0a7159504bb10dd277696c15f71799c  du-20240717_044422.txt
  b717fe4acefb7aa0c6eba3cd7dc8978c5b0a468ad80ab942a2199609242950d2  sha256-20240717_044422.txt
  17fa76ff3d790225a0060b0a1b431e38c118200e82e646ce7e28a2460a72e49f  srv2-box-1_2.tar.aa
  f9962071ad323de10c368358b660ddd3b731abe4d9930f027b6230e480b4b6f0  srv2-box-1_2.tar.ab
  f09a6047eda77bbed33838f78c34159946d031d5a7a9b1fc9b4e40ab0e235bf7  srv2-box-1_2.tar.ac
  e043e8e35652ce2ef0eddc763003f24c290376376b58e583a62ebc4d793351e7  srv2-box-1_2.tar.ad
  a3fa18b2600432658323e544201d0213c4f558e840d4719f1b602251eb26f46d  srv2-box-1_2.tar.ae
  1840464e8a9c6e322878375521519c58acb9579fa6e566d57d92c2c6c76dcdc8  srv2-box-1_2.tar.af
  ```

  挂载 iso 之后, 使用 sha256sum 命令计算所有文件, 方便刻录光盘之后的验证.

  ```sh
  cat srv2-box-1_2.tar.* | tar -tf -
  ```

  这个命令可以使用 tar 列出所有打包的文件.

+ (5) 刻录光盘 (详见文章 《光驱的内部结构及日常使用》):

  ```sh
  > cdrskin dev=/dev/sr0 -v -minfo
  cdrskin 1.5.6 : limited cdrecord compatibility wrapper for libburn
  cdrskin: verbosity level : 1
  cdrskin: NOTE : greying out all drives besides given dev='/dev/sr0'
  cdrskin: scanning for devices ...
  cdrskin: ... scanning for devices done
  cdrskin: pseudo-atip on drive 0
  cdrskin: status 1 burn_disc_blank "The drive holds a blank disc"
  scsidev: '/dev/sr0'
  Device type    : Removable CD-ROM
  Vendor_info    : 'PIONEER'
  Identifikation : 'BD-RW BDR-207D'
  Revision       : '1.21'
  Drive id       : 'LGDL050745WL'
  Driver flags   : BURNFREE
  Supported modes: TAO SAO
  cdrskin: burn_drive_get_write_speed = 44950  (10.0x)
  Current: BD-R sequential recording
  Profile: 0x0043 (BD-RE)
  Profile: 0x0042 (BD-R random recording)
  Profile: 0x0041 (BD-R sequential recording) (current)
  Profile: 0x0040 (BD-ROM)
  Profile: 0x002B (DVD+R/DL)
  Profile: 0x001A (DVD+RW)
  Profile: 0x001B (DVD+R)
  Profile: 0x0016 (DVD-R/DL layer jump recording)
  Profile: 0x0015 (DVD-R/DL sequential recording)
  Profile: 0x0013 (DVD-RW restricted overwrite)
  Profile: 0x0014 (DVD-RW sequential recording)
  Profile: 0x0011 (DVD-R sequential recording)
  Profile: 0x0002 (Removable disk)
  Profile: 0x0010 (DVD-ROM)
  Profile: 0x000A (CD-RW)
  Profile: 0x0009 (CD-R)
  Profile: 0x0008 (CD-ROM)
  Mounted Media: 41h, BD-R sequential recording
  Product Id:    RITEK/BR2/0
  Producer:      Ritek Corp
  Manufacturer:       'RITEK'
  Media type:         'BR2'

  Mounted media class:      BD
  Mounted media type:       BD-R sequential recording
  Disk Is not erasable
  disk status:              empty
  session status:           empty
  first track:              1
  number of sessions:       1
  first track in last sess: 1
  last track in last sess:  1
  Disk Is unrestricted
  Disk type: DVD, HD-DVD or BD

  Track  Sess Type   Start Addr End Addr   Size
  ==============================================
      1     1 Blank  0          12219391   12219392  

  Next writable address:              0         
  Remaining writable size:            12219392  
  ```

  这个是要刻录的空白 BD-R 光盘, 总容量 23866MB (23.3GB).

  ```sh
  > cdrskin dev=/dev/sr0 -v box_1_2.iso
  cdrskin 1.5.6 : limited cdrecord compatibility wrapper for libburn
  cdrskin: verbosity level : 1
  cdrskin: NOTE : greying out all drives besides given dev='/dev/sr0'
  cdrskin: scanning for devices ...
  cdrskin: ... scanning for devices done
  cdrskin: beginning to burn disc
  cdrskin: status 1 burn_disc_blank "The drive holds a blank disc"
  Current: BD-R sequential recording
  Track 01: data  22514 MB        
  Total size:    22514 MB (2561:41.82) = 11527487 sectors
  Lout start:    22514 MB (2561:43/82) = 11527637 sectors
  Starting to write CD/DVD at speed MAX in real SAO mode for single session.
  Last chance to quit, starting real write in   0 seconds. Operation starts.
  Waiting for reader process to fill input buffer ... input buffer ready.
  Starting new track at sector: 0
  Track 01: 22514 of 22514 MB written (fifo 100%) [buf  84%]   0.1x.            
  Fixating...

  cdrskin: working post-track (burning since 911 seconds)        
  Track 01: Total bytes read/written: 23608293376/23608295424 (11527488 sectors).
  Writing  time:  912.252s
  Cdrskin: fifo had 11527487 puts and 11527487 gets.
  Cdrskin: fifo was 0 times empty and 404539 times full, min fill was 99%.
  Min drive buffer fill was 11%
  cdrskin: burning done
  ```

  平均写入速度 24.6MB/s, 不算太慢 (16 分钟刻录一张).

### 3.5 落盘为安

这些就是备份光盘中的文件:

![备份光盘中的文件](./图/3-d-1.png)

做好标记:

![备份光盘的照片](./图/3-d-2.png)

其中 `box-.txt` 文件是装箱清单,
`du-.txt` 是这一批备份文件的 du 命令输出结果,
`sha256-.txt` 是这一批备份文件的 sha256sum 命令输出结果.
这 3 个文件在每张备份光盘之中都有一份.

`bb_plan--sha256.txt` 是这张光盘的装箱计划.
`tar` 文件是实际的备份文件打包.

这样的文件结构实现了:

+ (1) **完整的文件列表**.
  通过一次备份之中的任意一张光盘, 就能知道这次备份里面都有哪些文件.

+ (2) **文件分布情况**.
  根据装箱清单, 可以快速找到一个文件位于哪张光盘.
  并且装箱清单文件在每张光盘都有一份.

+ (3) **尽量减少文件丢失**.
  如果一张光盘损坏/丢失, 不会影响别的光盘, 只会丢失这张光盘中的文件.
  如果一张光盘的其中一小块数据损坏, 只会影响少量文件, 其余文件仍然能够正常读取.

+ (4) **符合广泛使用的标准**.
  装箱计划文件 (`bb_plan`) 的格式与 sha256sum 输出格式相同,
  可以直接使用 `sha256sum -c` 命令检查文件数据是否正确.
  而 sha256sum 命令几乎哪里都有.

### 3.6 备份 sd2 文件

上面介绍了备份 `srv2` 文件的过程, `sd2` 的备份是类似的.
此处展示一下装箱情况 (省略部分结果):

```sh
> env PMBB_BN=4 deno run -A src/bin/pmbb-box.ts tmp/scan-sd2 tmp/box-sd2
pmbb-box: pmbb v0.1.0-a1
  读取: tmp/scan-sd2/sha256-20240717_044907.txt
  读取: tmp/scan-sd2/du-20240717_044907.txt
总文件数 58126
  目录数 3855
空目录 672 个
需要装箱的文件总大小: 85.4GB
  箱总数 4
  箱大小: 22.0GB, 22.0GB, 22.0GB, 22.0GB
  箱总大小: 88.0GB
开始计算装箱 .. .
装箱结果:
box-1_4: 22.0GB (28932 个文件)  23622320089
box-2_4: 22.0GB (22026 个文件)  23622319778
box-3_4: 22.0GB (2600 个文件)  23622320040
box-4_4: 19.4GB (4568 个文件)  20810880647

  tmp/box-sd2/box-1_4/bb_plan-box-1_4-20240717_044907-sha256.txt
  tmp/box-sd2/box-2_4/bb_plan-box-2_4-20240717_044907-sha256.txt
  tmp/box-sd2/box-3_4/bb_plan-box-3_4-20240717_044907-sha256.txt
  tmp/box-sd2/box-4_4/bb_plan-box-4_4-20240717_044907-sha256.txt

详细清单:

box-1_4: 22.0GB (28932 个文件)  23622320089
  6.9GB (200)  sd2/old202407/_v
  6.6GB (942)  sd2/old202407/_s
  3.7GB (803)  sd2/old202407/r
```

sd2 有 5.8 万个文件, 使用了 4 张蓝光光盘.

可以看到, 贪心装箱的结果还不错, 几乎都装满了.


## 4 总结与展望

胖喵贪吃 (PMBB) 小工具已经开源, 在以下 5 个平台发布源代码 (1 个主站 + 4 个镜像):

+ <https://github.com/fm-elpac/pmbb>
+ <https://bitbucket.org/fm-elpac/pmbb/>
+ <https://codeberg.org/fm-elpac/pmbb>
+ <https://notabug.org/fm-elpac/pmbb>
+ <https://gitlab.com/fm-elpac/pmbb>

插播热知识: 避免数据丢失的唯一方法就是多备份, 所以源代码就要到处发啦 ~

----

通过一个几百行代码的小工具, 实现了比较好的光盘备份和文件管理.
胖喵贪吃可以把大量要备份的文件, 自动分装到不同的光盘.
单个目录尽量不拆分, 存放在同一张光盘上, 尽量减少文件丢失.
拿到任意一张光盘, 就能知道这次备份都有哪些文件, 以及哪个文件在哪张光盘上.
能够方便的使用 sha256sum 命令验证文件数据.
胖喵贪吃可以实现在 NAS 服务器上扫描文件, 然后在本机计算装箱计划, 并刻录光盘,
从而避免不必要的文件传输, 提高效率.

然而由于时间很短, 这个小工具还很简陋, 很多地方不完善.
后续可以考虑这些方向:

+ (1) 提高自动化程度.
  目前备份文件的很多步骤还需要手动操作, 比较麻烦.
  可以将更多步骤整合集成进小工具.

+ (2) 重复文件处理.
  目前仅实现了查找重复的文件, 并没有方便删除重复文件的功能:

  ```sh
  > deno run -A src/bin/pmbb-same.ts tmp/scan-sd2
  pmbb-same: pmbb v0.1.0-a1
    读取: tmp/scan-sd2/sha256-20240717_044907.txt
  文件总数 58126
    唯一文件数 46201
    重复文件数 11925 (4201)

  e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 (179)
    ./sd2/sd2_20240701
  ```

  额 .. .  有 1.1 万个重复文件.
  手动删除重复的文件, 不仅麻烦, 而且有很高的误删除文件造成数据丢失的风险.
  考虑提供一个界面, 可以方便的选择保留其中一个文件, 删除其余重复的,
  从而避免误删除.

+ (3) 增量备份支持.
  目前仅实现了全量备份的功能.
  但是基于 sha256 可以很方便的实现增量备份 (只备份新增/修改的文件).

+ (4) 图形用户界面 (GUI).
  命令行界面 (CLI) 虽然开发速度很快, 但是使用起来不够简单方便.
  可以增加一个图形界面 (基于 electronjs).

+ (5) 学习别的数据备份工具.
  因为时间少, 并没有对现有的备份工具做足够的了解.
  还需要努力学习 !

+ (6) 基于 AI 的辅助文件整理功能.
  比如, 通过 AI 识别图片的内容, 对图片进行自动的分类整理,
  从而减轻手动整理文件的工作量.

----

本文使用 CC-BY-SA 4.0 许可发布.
