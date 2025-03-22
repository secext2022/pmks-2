# 光盘 RAID: 允许丢失损坏的备份数据

**RAID** (廉价磁盘冗余阵列) 通常由多块硬盘组成, 主要作用有两个:
(1) 提高性能: 多块硬盘同时读写, 速度更快.
(2) 防止数据丢失: 允许一部分硬盘损坏, 仍然能够恢复数据.

光盘 RAID, 也就是多张光盘组成的 "阵列", 主要不是为了高性能,
而是为了应对光盘的丢失损坏.
比如使用 **纠删码** 的 5 张光盘组成 3+2 阵列 (3 张 数据光盘 + 2 张 恢复光盘),
允许任意丢失/损坏 2 张光盘, 仍然能够恢复完整的数据.

----

相关文章:

+ 《胖喵贪吃: 备份数据文件的小工具》

  TODO

+ 《光盘文件系统 (iso9660) 格式解析》

  TODO

+ 《光盘防水嘛 ? DVD+R 刻录光盘泡水实验》

  TODO

+ 《光驱的内部结构及日常使用》

  TODO

+ 《逻辑卷管理器 (LVM) 简介》

  TODO


## 目录

+ 1 概述

+ 2 制作光盘 RAID

  - 2.1 使用 pmbb 打包文件
  - 2.2 使用 pmbb-ec 生成冗余数据
  - 2.3 制作数据光盘 iso 镜像文件
  - 2.4 制作恢复光盘
  - 2.5 刻录光盘并验证

+ 3 数据恢复

  - 3.1 恢复元数据
  - 3.2 恢复打包文件

+ 4 数据完整性检查验证

+ 5 总结与展望


## 1 概述

**纠删码** (Erasure Code, EC) 是一种数据编码方法,
RS 码 (Reed Solomon) 是一种具体的纠删码.
比如 M+N 的 RS 码, 通过 M 块原始数据, 计算出 N 块冗余数据,
然后允许 **任意丢失** 最多 N 块数据.
RS 码的主要原理是矩阵计算, 此处不详细介绍, 感兴趣的读者请自行查找相关资料.

胖喵贪吃 (PMBB) 小工具最近新增了光盘 RAID 功能 (`pmbb-ec`),
把原始数据分成 4MB 的小块 (与 LVM 默认 PE 大小相同),
通过 RS 码计算出冗余块, 从而提供数据恢复的能力.

需要注意的是, 纠删码只能在数据块丢失的情况下, 通过计算恢复数据,
但是本身并不能检测数据块是否损坏 (其中的数据是否改变).
pmbb-ec 通过计算每个 4MB 数据块的 `sha256`, 来判断其中的数据是否完好.

pmbb-ec 需要大量计算 (RS 和 sha256), 所以使用 rust 编程语言编写 (性能很接近 C),
代码有点复杂, 此处不详细介绍.
感兴趣的读者可以自己去阅读源代码 (已开源): <https://crates.io/crates/pmbb-ec>

----

硬盘 RAID 对于冗余数据块, 有两种存储方案:
(1) 集中存储: 使用一块 (或多块) 硬盘, 单独存储冗余数据.
(2) 分散存储: 冗余数据分散存储在每块硬盘上 (比如 RAID 5).
对于硬盘来说, 通常分散存储更好.

但是光盘 RAID 更适合使用 **集中存储** 方案,
也就是 **数据光盘** (原始数据) 和 **恢复光盘** (冗余数据) 分开.
因为光盘主要用于数据 **备份**, 在这种情况下, 一张光盘丢失/损坏的可能性较小.
使用集中存储方案, 大部分情况下 (光盘没有丢失/损坏), 只需使用数据光盘即可,
无需使用恢复光盘, 这样可以减少需要读取的光盘总张数, 显著改善用户体验.


## 2 制作光盘 RAID

此处以一次具体的数据备份举栗 (操作系统 ArchLinux).
一共 6 张 DVD+R 光盘, 组成 4+2 的阵列.

### 2.1 使用 pmbb 打包文件

参考文章: 《胖喵贪吃: 备份数据文件的小工具》

+ (1) 首先有这些数据需要备份:

  ```sh
  > du -h .
  2.0G	./2021照片
  4.0G	./2022照片
  5.1G	./2023照片
  3.8G	./2024照片
  15G	.
  ```

  文件一共 15GB, 是近几年的照片 (分类 `sd2`).

+ (2) 使用 `pmbb-scan` 扫描:

  ```sh
  > deno run -A src/bin/pmbb-scan.ts p2 tmp/scan-p2
  pmbb-scan pmbb v0.1.0-a3: 20240801_215026
  扫描目录: p2
    运行: du -ab p2 > tmp/scan-p2/du-20240801_215026.txt
    运行: find p2 -type f -print0 | xargs -0 sha256sum > tmp/scan-p2/sha256-20240801_215026.txt
  > deno run -A src/bin/pmbb-same.ts tmp/scan-p2
  pmbb-same: pmbb v0.1.0-a3
    读取: tmp/scan-p2/sha256-20240801_215026.txt
  文件总数 2551
    唯一文件数 2551
    重复文件数 0 (0)
  ```

  使用 `pmbb-same` 检查重复文件, 没有重复, 很好.

+ (3) 使用 `pmbb-box` 进行分装 (省略部分结果):

  ```sh
  > env PMBB_BS=3.9GB PMBB_BN=4 deno run -A src/bin/pmbb-box.ts tmp/scan-p2 tmp/box-p2
  pmbb-box: pmbb v0.1.0-a3
    读取: tmp/scan-p2/sha256-20240801_215026.txt
    读取: tmp/scan-p2/du-20240801_215026.txt
  总文件数 2551
    目录数 5
  空目录 0 个
  需要装箱的文件总大小: 14.7GB
    箱总数 4
    箱大小: 3.9GB, 3.9GB, 3.9GB, 3.9GB
    箱总大小: 15.6GB
  开始计算装箱 .. .
  装箱结果:
  box-1_4: 3.9GB (787 个文件)  4187591786
  box-2_4: 3.9GB (572 个文件)  4187562164
  box-3_4: 3.9GB (587 个文件)  4187578224
  box-4_4: 3.0GB (605 个文件)  3167927421

    tmp/box-p2/box-1_4/bb_plan-box-1_4-20240801_215026-sha256.txt
    tmp/box-p2/box-2_4/bb_plan-box-2_4-20240801_215026-sha256.txt
    tmp/box-p2/box-3_4/bb_plan-box-3_4-20240801_215026-sha256.txt
    tmp/box-p2/box-4_4/bb_plan-box-4_4-20240801_215026-sha256.txt

  详细清单:

  box-1_4: 3.9GB (787 个文件)  4187591786
    3.8GB (775)  p2/2024照片
    14.7MB (1)  p2/2023照片/IMG_20230125_022245.jpg
    14.6MB (1)  p2/2023照片/IMG_20230125_022241.jpg
    14.5MB (1)  p2/2023照片/IMG_20230125_022243.jpg
    14.3MB (1)  p2/2023照片/IMG_20230125_022230.jpg
    13.6MB (1)  p2/2023照片/IMG_20230125_022547.jpg
    13.5MB (1)  p2/2023照片/IMG_20230125_022544.jpg
    13.3MB (1)  p2/2023照片/IMG_20230125_022542.jpg
    11.0MB (1)  p2/2022照片/IMG_20220219_111519.jpg
    10.7MB (1)  p2/2022照片/IMG_20220222_091438.jpg
    10.5MB (1)  p2/2022照片/IMG_20220709_000810.jpg
    10.0MB (1)  p2/2022照片/IMG_20220219_111653.jpg
    7.7MB (1)  p2/2022照片/IMG_20220112_142055.jpg

  box-2_4: 3.9GB (572 个文件)  4187562164
    1.9GB (317)  p2/2021照片
    10.0MB (1)  p2/2022照片/IMG_20220709_035728.jpg
    9.7MB (1)  p2/2022照片/IMG_20220918_202637.jpg
    9.6MB (1)  p2/2023照片/IMG_20230919_113811.jpg

  ```

  使用 `PMBB_BN=4` 指定使用 4 张光盘,
  使用 `PMBB_BS=3.9GB` 指定每张光盘最多装 3.9GB 文件.
  因为 iso9660 光盘文件系统的限制, 文件超过 4GB 需要切分, 比较麻烦.

  装箱结果看起来挺不错, 2024 和 2021 的文件都位于一张光盘上 (没有拆分),
  2023 和 2022 因为太大, 一张光盘装不下, 进行了拆分.

+ (4) 打包文件: 首先使用 `pmbb-gen` (省略部分结果):

  ```sh
  > deno run -A src/bin/pmbb-gen.ts tmp/box-p2/box-1_4 . tmp/box-p2/box-1_4/gen
  pmbb-gen: pmbb v0.1.0-a3
    读取: tmp/box-p2/box-1_4/bb_plan-box-1_4-20240801_215026-sha256.txt
  mkdir -p tmp/box-p2/box-1_4/gen/p2/2022照片
  cp p2/2022照片/IMG_20220112_142055.jpg tmp/box-p2/box-1_4/gen/p2/2022照片/IMG_20220112_142055.jpg
  cp p2/2022照片/IMG_20220219_111519.jpg tmp/box-p2/box-1_4/gen/p2/2022照片/IMG_20220219_111519.jpg
  cp p2/2022照片/IMG_20220219_111653.jpg tmp/box-p2/box-1_4/gen/p2/2022照片/IMG_20220219_111653.jpg
  cp p2/2022照片/IMG_20220222_091438.jpg tmp/box-p2/box-1_4/gen/p2/2022照片/IMG_20220222_091438.jpg
  cp p2/2022照片/IMG_20220709_000810.jpg tmp/box-p2/box-1_4/gen/p2/2022照片/IMG_20220709_000810.jpg
  mkdir -p tmp/box-p2/box-1_4/gen/p2/2023照片
  cp p2/2023照片/IMG_20230125_022230.jpg tmp/box-p2/box-1_4/gen/p2/2023照片/IMG_20230125_022230.jpg

  ```

  然后使用 `tar` 打包 (省略部分结果):

  ```sh
  > tar -cvf box-1_4-gen.tar p2
  p2/
  p2/2022照片/
  p2/2022照片/IMG_20220112_142055.jpg
  p2/2022照片/IMG_20220219_111519.jpg
  p2/2022照片/IMG_20220219_111653.jpg
  p2/2022照片/IMG_20220222_091438.jpg
  p2/2022照片/IMG_20220709_000810.jpg
  p2/2023照片/
  p2/2023照片/IMG_20230125_022230.jpg
  p2/2023照片/IMG_20230125_022241.jpg
  p2/2023照片/IMG_20230125_022243.jpg
  p2/2023照片/IMG_20230125_022245.jpg
  p2/2023照片/IMG_20230125_022542.jpg
  p2/2023照片/IMG_20230125_022544.jpg
  p2/2023照片/IMG_20230125_022547.jpg
  p2/2024照片/
  p2/2024照片/IMG_20240101_202913.jpg
  p2/2024照片/IMG_20240101_202918.jpg

  ```

+ (5) 重复上述操作, 对每张光盘的文件打包, 得到这样的结果:

  ```sh
  > tree box-p2
  box-p2
  ├── box-1_4
  │   ├── bb_plan-box-1_4-20240801_215026-sha256.txt
  │   ├── box-p2-20240801.txt
  │   ├── du-20240801_215026.txt
  │   ├── gen
  │   │   └── box-1_4-gen.tar
  │   └── sha256-20240801_215026.txt
  ├── box-2_4
  │   ├── bb_plan-box-2_4-20240801_215026-sha256.txt
  │   ├── box-p2-20240801.txt
  │   ├── du-20240801_215026.txt
  │   ├── gen
  │   │   └── box-2_4-gen.tar
  │   └── sha256-20240801_215026.txt
  ├── box-3_4
  │   ├── bb_plan-box-3_4-20240801_215026-sha256.txt
  │   ├── box-p2-20240801.txt
  │   ├── du-20240801_215026.txt
  │   ├── gen
  │   │   └── box-3_4-gen.tar
  │   └── sha256-20240801_215026.txt
  ├── box-4_4
  │   ├── bb_plan-box-4_4-20240801_215026-sha256.txt
  │   ├── box-p2-20240801.txt
  │   ├── du-20240801_215026.txt
  │   ├── gen
  │   │   └── box-4_4-gen.tar
  │   └── sha256-20240801_215026.txt
  └── box-p2-20240801.txt

  9 directories, 21 files
  ```

  把这些文件简单移动 (复制) 一下, 得到:

  ```sh
  > tree box-p2
  box-p2
  ├── box-1_4
  │   ├── 1meta
  │   │   ├── bb_plan-box-1_4-20240801_215026-sha256.txt
  │   │   ├── box-p2-20240801.txt
  │   │   ├── du-20240801_215026.txt
  │   │   └── sha256-20240801_215026.txt
  │   └── 2tar
  │        └── box-1_4-gen.tar
  ├── box-2_4
  │   ├── 1meta
  │   │   ├── bb_plan-box-2_4-20240801_215026-sha256.txt
  │   │   ├── box-p2-20240801.txt
  │   │   ├── du-20240801_215026.txt
  │   │   └── sha256-20240801_215026.txt
  │   └── 2tar
  │        └── box-2_4-gen.tar
  ├── box-3_4
  │   ├── 1meta
  │   │   ├── bb_plan-box-3_4-20240801_215026-sha256.txt
  │   │   ├── box-p2-20240801.txt
  │   │   ├── du-20240801_215026.txt
  │   │   └── sha256-20240801_215026.txt
  │   └── 2tar
  │        └── box-3_4-gen.tar
  ├── box-4_4
  │   ├── 1meta
  │   │   ├── bb_plan-box-4_4-20240801_215026-sha256.txt
  │   │   ├── box-p2-20240801.txt
  │   │   ├── du-20240801_215026.txt
  │   │   └── sha256-20240801_215026.txt
  │   └── 2tar
  │        └── box-4_4-gen.tar
  └── box-p2-20240801.txt
  ```

### 2.2 使用 pmbb-ec 生成冗余数据

+ (1) 安装 pmbb-ec. 推荐使用国内镜像: <https://rsproxy.cn/>

  pmbb-ec 已经发布到 crates-io,
  只需使用 `cargo install` 安装即可 (省略部分结果):

  ```sh
  > cargo install pmbb-ec@0.1.0-a1
      Updating `rsproxy-sparse` index
    Downloaded pmbb-ec v0.1.0-a1 (registry `rsproxy-sparse`)
    Downloaded 1 crate (24.2 KB) in 0.38s
    Installing pmbb-ec v0.1.0-a1
      Updating `rsproxy-sparse` index
      Locking 113 packages to latest compatible versions
        Adding ahash v0.7.8 (latest: v0.8.11)

        Adding windows-sys v0.52.0 (latest: v0.59.0)
    Downloaded relative-path v1.9.3 (registry `rsproxy-sparse`)

    Downloaded reed-solomon-erasure v6.0.0 (registry `rsproxy-sparse`)
    Downloaded 23 crates (1.2 MB) in 0.42s
    Compiling version_check v0.9.5

    Compiling pmbb-ec v0.1.0-a1
      Finished `release` profile [optimized] target(s) in 23.64s
    Installing /home/s2/.cargo/bin/pmbb-ec
    Installed package `pmbb-ec v0.1.0-a1` (executable `pmbb-ec`)
  ```

  安装之后:

  ```sh
  > type pmbb-ec
  pmbb-ec is /home/s2/.cargo/bin/pmbb-ec
  > pmbb-ec --version
  pmbb-ec version 0.1.0-a1 (x86_64-unknown-linux-gnu, default, simd)
  ```

+ (2) 使用 `pmbb-ec c2` 进行计算 (省略部分结果):

  ```sh
  > env RUST_LOG=debug PMBB_EC=RS_4_2_4MB pmbb-ec c2 1meta ec-p2-20240801_pmbb_ec.json box-1_4/2tar/box-1_4-gen.tar box-2_4/2tar/box-2_4-gen.tar box-3_4/2tar/box-3_4-gen.tar box-4_4/2tar/box-4_4-gen.tar ec-1_2_6/3ec/ec-1_2_6.ec ec-2_2_6/3ec/ec-2_2_6.ec
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::c2] PMBB_EC=EC参数 { 原始: "RS_4_2_4MB", 切分: ["RS", "4", "2", "4MB"], 名称: "RS", 原始块数: 4, 冗余块数: 2, 块长: 4194304 }
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::c2]   "1meta/ec-p2-20240801_pmbb_ec.json"
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::util] write 1meta/box-1_4-gen.tar_sha256.txt
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::util] write 1meta/box-2_4-gen.tar_sha256.txt
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::util] write 1meta/box-3_4-gen.tar_sha256.txt
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::util] write 1meta/box-4_4-gen.tar_sha256.txt
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::c2] read box-1_4/2tar/box-1_4-gen.tar
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::c2] read box-2_4/2tar/box-2_4-gen.tar
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::c2] read box-3_4/2tar/box-3_4-gen.tar
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::c2] read box-4_4/2tar/box-4_4-gen.tar
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::util] write ec-1_2_6/3ec/ec-1_2_6.ec
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::util] write 1meta/ec-1_2_6.ec_sha256.txt
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::util] write ec-2_2_6/3ec/ec-2_2_6.ec
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::util] write 1meta/ec-2_2_6.ec_sha256.txt
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::c2]   0
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::c2]   4
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::c2]   8
  [2024-08-01T14:17:41Z DEBUG pmbb_ec::ec::c2]   12

  [2024-08-01T14:18:37Z DEBUG pmbb_ec::ec::c2]   3996
  [2024-08-01T14:18:37Z DEBUG pmbb_ec::ec::c2]   4000
  [2024-08-01T14:18:37Z DEBUG pmbb_ec::ec::util] write 1meta/ec-p2-20240801_pmbb_ec.json
  ```

  其中 `PMBB_EC=RS_4_2_4MB` 表示使用 4+2 的 RS 码 (原始数据 4 块, 冗余数据 2 块),
  块大小 4MB (目前只支持 4MB).

----

目前已经获得这些文件:

```sh
> tree box-p2
box-p2
├── 1meta
│   ├── box-1_4-gen.tar_sha256.txt
│   ├── box-2_4-gen.tar_sha256.txt
│   ├── box-3_4-gen.tar_sha256.txt
│   ├── box-4_4-gen.tar_sha256.txt
│   ├── ec-1_2_6.ec_sha256.txt
│   ├── ec-2_2_6.ec_sha256.txt
│   └── ec-p2-20240801_pmbb_ec.json
├── box-1_4
│   ├── 1meta
│   │   ├── bb_plan-box-1_4-20240801_215026-sha256.txt
│   │   ├── box-p2-20240801.txt
│   │   ├── du-20240801_215026.txt
│   │   └── sha256-20240801_215026.txt
│   └── 2tar
│        └── box-1_4-gen.tar
├── box-2_4
│   ├── 1meta
│   │   ├── bb_plan-box-2_4-20240801_215026-sha256.txt
│   │   ├── box-p2-20240801.txt
│   │   ├── du-20240801_215026.txt
│   │   └── sha256-20240801_215026.txt
│   └── 2tar
│        └── box-2_4-gen.tar
├── box-3_4
│   ├── 1meta
│   │   ├── bb_plan-box-3_4-20240801_215026-sha256.txt
│   │   ├── box-p2-20240801.txt
│   │   ├── du-20240801_215026.txt
│   │   └── sha256-20240801_215026.txt
│   └── 2tar
│        └── box-3_4-gen.tar
├── box-4_4
│   ├── 1meta
│   │   ├── bb_plan-box-4_4-20240801_215026-sha256.txt
│   │   ├── box-p2-20240801.txt
│   │   ├── du-20240801_215026.txt
│   │   └── sha256-20240801_215026.txt
│   └── 2tar
│        └── box-4_4-gen.tar
├── box-p2-20240801.txt
├── ec-1_2_6
│   └── 3ec
│       └── ec-1_2_6.ec
└── ec-2_2_6
    └── 3ec
        └── ec-2_2_6.ec
```

其中 EC 元数据:

```sh
> jq . ec-p2-20240801_pmbb_ec.json
{
  "pmbb": "pmbb-ec 0.1.0-a1",
  "pmbb_ec": "RS_4_2_4MB",
  "file": [
    {
      "p": "../box-1_4/2tar/box-1_4-gen.tar",
      "b": 4188200960,
      "sha256": "box-1_4-gen.tar_sha256.txt",
      "ec": null
    },
    {
      "p": "../box-2_4/2tar/box-2_4-gen.tar",
      "b": 4188006400,
      "sha256": "box-2_4-gen.tar_sha256.txt",
      "ec": null
    },
    {
      "p": "../box-3_4/2tar/box-3_4-gen.tar",
      "b": 4188037120,
      "sha256": "box-3_4-gen.tar_sha256.txt",
      "ec": null
    },
    {
      "p": "../box-4_4/2tar/box-4_4-gen.tar",
      "b": 3168409600,
      "sha256": "box-4_4-gen.tar_sha256.txt",
      "ec": null
    },
    {
      "p": "../ec-1_2_6/3ec/ec-1_2_6.ec",
      "b": 0,
      "sha256": "ec-1_2_6.ec_sha256.txt",
      "ec": 1
    },
    {
      "p": "../ec-2_2_6/3ec/ec-2_2_6.ec",
      "b": 0,
      "sha256": "ec-2_2_6.ec_sha256.txt",
      "ec": 1
    }
  ],
  "_last_update": "2024-08-01T14:18:37.103664Z"
}
```

### 2.3 制作数据光盘 iso 镜像文件

+ (1) 打包元数据:

  ```sh
  > pwd
  /home/s2/pmbb/tmp/box-p2/box-1_4
  > find . -type f -print0 | xargs -0 sha256sum > ../sha256.txt
  > mv ../sha256.txt 1meta
  ```

  此处生成 `1meta/sha256.txt` 文件, 方便检查数据.

  ```sh
  > tar -cvf 4meta_1.tar 1meta
  1meta/
  1meta/bb_plan-box-1_4-20240801_215026-sha256.txt
  1meta/box-p2-20240801.txt
  1meta/du-20240801_215026.txt
  1meta/sha256-20240801_215026.txt
  1meta/box-1_4-gen.tar_sha256.txt
  1meta/box-2_4-gen.tar_sha256.txt
  1meta/box-3_4-gen.tar_sha256.txt
  1meta/box-4_4-gen.tar_sha256.txt
  1meta/ec-1_2_6.ec_sha256.txt
  1meta/ec-2_2_6.ec_sha256.txt
  1meta/ec-p2-20240801_pmbb_ec.json
  1meta/sha256.txt
  ```

  目录 `1meta` 之中是一堆元数据文件, 将其打包为 `4meta_1.tar` 文件.

+ (2) 生成全盘 `sha256.txt` 文件:

  ```sh
  > pwd
  /home/s2/pmbb/tmp/box-p2/box-1_4
  > find . -type f -print0 | xargs -0 sha256sum > ../sha256.txt
  > mv ../sha256.txt .
  ```

  此时第 1 张数据光盘 (box-1_4) 里面的文件有:

  ```sh
  > tree box-1_4
  box-1_4
  ├── 1meta
  │   ├── bb_plan-box-1_4-20240801_215026-sha256.txt
  │   ├── box-1_4-gen.tar_sha256.txt
  │   ├── box-2_4-gen.tar_sha256.txt
  │   ├── box-3_4-gen.tar_sha256.txt
  │   ├── box-4_4-gen.tar_sha256.txt
  │   ├── box-p2-20240801.txt
  │   ├── du-20240801_215026.txt
  │   ├── ec-1_2_6.ec_sha256.txt
  │   ├── ec-2_2_6.ec_sha256.txt
  │   ├── ec-p2-20240801_pmbb_ec.json
  │   ├── sha256-20240801_215026.txt
  │   └── sha256.txt
  ├── 2tar
  │   └── box-1_4-gen.tar
  ├── 4meta_1.tar
  └── sha256.txt

  3 directories, 15 files
  ```

  其中 `1meta` 是元数据, `2tar` 是打包的备份文件, `4meta_1.tar` 是元数据的备份,
  `sha256.txt` 记录了全盘文件的 sha256.

+ (3) 生成 iso 光盘镜像文件:

  ```sh
  > xorrisofs -V "BOX_P2_1_4_20240801" -J -o box_1_4.iso box-1_4/
  xorriso 1.5.6 : RockRidge filesystem manipulator, libburnia project.

  Drive current: -outdev 'stdio:box_1_4.iso'
  Media current: stdio file, overwriteable
  Media status : is blank
  Media summary: 0 sessions, 0 data blocks, 0 data, 59.0g free
  Added to ISO image: directory '/'='/home/s2/pmbb/tmp/box-p2/box-1_4'
  xorriso : UPDATE :      17 files added in 1 seconds
  xorriso : UPDATE :      17 files added in 1 seconds
  xorriso : UPDATE :  5.64% done
  xorriso : UPDATE :  34.86% done
  xorriso : UPDATE :  50.91% done, estimate finish Thu Aug 01 22:57:33 2024
  xorriso : UPDATE :  71.85% done, estimate finish Thu Aug 01 22:57:33 2024
  xorriso : UPDATE :  88.19% done
  xorriso : UPDATE :  89.59% done
  xorriso : UPDATE :  95.33% done
  ISO image produced: 2046110 sectors
  Written to medium : 2046110 sectors at LBA 0
  Writing to 'stdio:box_1_4.iso' completed successfully.
  ```

  重复操作, 获得:

  ```sh
  > ls -l
  drwxr-xr-x 1 s2 s2          0  8月 1日 23:00 1meta/
  -rw-r--r-- 1 s2 s2 4190433280  8月 1日 23:01 box_1_4.iso
  -rw-r--r-- 1 s2 s2 4190197760  8月 1日 23:03 box_2_4.iso
  -rw-r--r-- 1 s2 s2 4190228480  8月 1日 23:05 box_3_4.iso
  -rw-r--r-- 1 s2 s2 3170603008  8月 1日 23:06 box_4_4.iso
  drwxr-xr-x 1 s2 s2         16  8月 1日 22:32 ec-1_2_6/
  drwxr-xr-x 1 s2 s2         16  8月 1日 22:32 ec-2_2_6/
  > pwd
  /home/s2/pmbb/tmp/box-p2
  ```

+ (4) 生成 iso 的文件列表:

  ```sh
  > env PMBB_SORT=1 deno run -A src/bin/pmbb-iso.ts ls tmp/box-p2/box_1_4.iso > tmp/box-p2/1meta/box_1_4_iso.txt
  ```

----

```sh
> cat box_1_4_iso.txt
25 (2.0KB 2048) /
26 (2.0KB 2048) /1meta/
27 (2.0KB 2048) /2tar/
33 (79.9KB 81850) /1meta/bb_plan-box-1_4-20240801_215026-sha256.txt
73 (63.4KB 64935) /1meta/box-1_4-gen.tar_sha256.txt
105 (63.4KB 64935) /1meta/box-2_4-gen.tar_sha256.txt
137 (63.4KB 64935) /1meta/box-3_4-gen.tar_sha256.txt
169 (48.0KB 49140) /1meta/box-4_4-gen.tar_sha256.txt
193 (73.8KB 75542) /1meta/box-p2-20240801.txt
230 (114.8KB 117559) /1meta/du-20240801_215026.txt
288 (63.5KB 65000) /1meta/ec-1_2_6.ec_sha256.txt
320 (63.5KB 65000) /1meta/ec-2_2_6.ec_sha256.txt
352 (682B 682) /1meta/ec-p2-20240801_pmbb_ec.json
353 (1.2KB 1198) /1meta/sha256.txt
354 (259.2KB 265447) /1meta/sha256-20240801_215026.txt
484 (3.9GB 4188200960) /2tar/box-1_4-gen.tar
2045504 (910.0KB 931840) /4meta_1.tar
2045959 (1.3KB 1363) /sha256.txt
```

可以看到, 元数据 (`1meta`) 位于光盘内圈 (扇区编号 33 ~ 354).
然后是打包的备份文件 (`2tar`, 扇区编号 484).
元数据的备份 (`4meta_1.tar`) 位于光盘外圈 (扇区编号 2045504).

一张光盘的元数据一共存储 2 份, 分别位于光盘的内圈和外圈.
只有光盘的内圈和外圈都损坏了, 元数据才会丢失.

### 2.4 制作恢复光盘

上面使用 pmbb-ec 对打包的备份文件数据 (`2tar`) 进行了冗余保护,
元数据同样可以使用 RS 码进行保护:

```sh
> env RUST_LOG=debug PMBB_EC=RS_4_2_4MB pmbb-ec c2 1meta meta-ec-20240801_pmbb_ec.json box-1_4/4meta_1.tar box-2_4/4meta_2.tar box-3_4/4meta_3.tar box-4_4/4meta_4.tar ec-1_2_6/2ec/meta-1_2_6.ec ec-2_2_6/2ec/meta-2_2_6.ec
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::c2] PMBB_EC=EC参数 { 原始: "RS_4_2_4MB", 切分: ["RS", "4", "2", "4MB"], 名称: "RS", 原始块数: 4, 冗余块数: 2, 块长: 4194304 }
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::c2]   "1meta/meta-ec-20240801_pmbb_ec.json"
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::util] write 1meta/4meta_1.tar_sha256.txt
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::util] write 1meta/4meta_2.tar_sha256.txt
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::util] write 1meta/4meta_3.tar_sha256.txt
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::util] write 1meta/4meta_4.tar_sha256.txt
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::c2] read box-1_4/4meta_1.tar
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::c2] read box-2_4/4meta_2.tar
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::c2] read box-3_4/4meta_3.tar
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::c2] read box-4_4/4meta_4.tar
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::util] write ec-1_2_6/2ec/meta-1_2_6.ec
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::util] write 1meta/meta-1_2_6.ec_sha256.txt
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::util] write ec-2_2_6/2ec/meta-2_2_6.ec
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::util] write 1meta/meta-2_2_6.ec_sha256.txt
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::c2]   0
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::c2]   4
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::c2]   8
[2024-08-01T14:49:54Z DEBUG pmbb_ec::ec::util] write 1meta/meta-ec-20240801_pmbb_ec.json
```

此时恢复光盘 (`ec-1_2_6`) 的文件有:

```sh
> tree ec-1_2_6/
ec-1_2_6/
├── 1meta
│   ├── 4meta_1.tar_sha256.txt
│   ├── 4meta_2.tar_sha256.txt
│   ├── 4meta_3.tar_sha256.txt
│   ├── 4meta_4.tar_sha256.txt
│   ├── bb_plan-box-1_4-20240801_215026-sha256.txt
│   ├── bb_plan-box-2_4-20240801_215026-sha256.txt
│   ├── bb_plan-box-3_4-20240801_215026-sha256.txt
│   ├── bb_plan-box-4_4-20240801_215026-sha256.txt
│   ├── box-1_4-gen.tar_sha256.txt
│   ├── box_1_4_iso.txt
│   ├── box-2_4-gen.tar_sha256.txt
│   ├── box_2_4_iso.txt
│   ├── box-3_4-gen.tar_sha256.txt
│   ├── box_3_4_iso.txt
│   ├── box-4_4-gen.tar_sha256.txt
│   ├── box_4_4_iso.txt
│   ├── box-p2-20240801.txt
│   ├── du-20240801_215026.txt
│   ├── ec-1_2_6.ec_sha256.txt
│   ├── ec-2_2_6.ec_sha256.txt
│   ├── ec-p2-20240801_pmbb_ec.json
│   ├── meta-1_2_6.ec_sha256.txt
│   ├── meta-2_2_6.ec_sha256.txt
│   ├── meta-ec-20240801_pmbb_ec.json
│   ├── sha256-20240801_215026.txt
│   └── sha256.txt
├── 2ec
│   ├── ec-1_2_6.ec
│   └── meta-1_2_6.ec
├── 4meta_5.tar
└── sha256.txt

3 directories, 30 files
```

类似的, 生成恢复光盘的 iso 镜像文件, 得到:

```sh
> tree box-p2
box-p2
├── 1meta
│   ├── box-p2-20240801.txt
│   ├── ec_1_2_6_iso.txt
│   └── ec_2_2_6_iso.txt
├── box_1_4.iso
├── box_2_4.iso
├── box_3_4.iso
├── box_4_4.iso
├── ec_1_2_6.iso
└── ec_2_2_6.iso

2 directories, 9 files
> ls -l box-p2
总计 23586084
drwxr-xr-x 1 s2 s2        102  8月 1日 23:23 1meta/
-rw-r--r-- 1 s2 s2 4190433280  8月 1日 23:01 box_1_4.iso
-rw-r--r-- 1 s2 s2 4190197760  8月 1日 23:03 box_2_4.iso
-rw-r--r-- 1 s2 s2 4190228480  8月 1日 23:05 box_3_4.iso
-rw-r--r-- 1 s2 s2 3170603008  8月 1日 23:06 box_4_4.iso
-rw-r--r-- 1 s2 s2 4205342720  8月 1日 23:19 ec_1_2_6.iso
-rw-r--r-- 1 s2 s2 4205342720  8月 1日 23:20 ec_2_2_6.iso
```

### 2.5 刻录光盘并验证

6 张光盘的镜像文件已经制作好了, 接下来刻录到光盘:

```sh
> cdrskin dev=/dev/sr0 -v box_1_4.iso 
cdrskin 1.5.6 : limited cdrecord compatibility wrapper for libburn
cdrskin: verbosity level : 1
cdrskin: NOTE : greying out all drives besides given dev='/dev/sr0'
cdrskin: scanning for devices ...
cdrskin: ... scanning for devices done
cdrskin: beginning to burn disc
cdrskin: status 1 burn_disc_blank "The drive holds a blank disc"
Current: DVD+R
Track 01: data  3996 MB        
Total size:     3996 MB (454:43.46) = 2046110 sectors
Lout start:     3996 MB (454:45/46) = 2046260 sectors
Starting to write CD/DVD at speed MAX in real SAO mode for single session.
Last chance to quit, starting real write in   0 seconds. Operation starts.
Waiting for reader process to fill input buffer ... input buffer ready.
Starting new track at sector: 0
Track 01: 3996 of 3996 MB written (fifo 100%) [buf  96%]   8.8x.        
cdrskin: thank you for being patient for 346 seconds                     
Fixating...
cdrskin: working post-track (burning since 356 seconds)        
Track 01: Total bytes read/written: 4190433280/4190437376 (2046112 sectors).
Writing  time:  356.839s
Cdrskin: fifo had 2046110 puts and 2046110 gets.
Cdrskin: fifo was 0 times empty and 142204 times full, min fill was 99%.
Min drive buffer fill was 93%
cdrskin: burning done
```

使用记号笔在光盘印刷面做好标记, 装入光盘袋:

![刻录好的光盘](./图/25-d-1.png)

----

将光盘放入光驱:

![光盘的文件 (1)](./图/25-d-2.png)

使用 `sha256sum -c` 验证光盘中的文件:

```sh
s2@a2 /r/m/s/BOX_P2_1_4_20240801> sha256sum -c sha256.txt
./1meta/bb_plan-box-1_4-20240801_215026-sha256.txt: 成功
./1meta/box-p2-20240801.txt: 成功
./1meta/du-20240801_215026.txt: 成功
./1meta/sha256-20240801_215026.txt: 成功
./1meta/box-1_4-gen.tar_sha256.txt: 成功
./1meta/box-2_4-gen.tar_sha256.txt: 成功
./1meta/box-3_4-gen.tar_sha256.txt: 成功
./1meta/box-4_4-gen.tar_sha256.txt: 成功
./1meta/ec-1_2_6.ec_sha256.txt: 成功
./1meta/ec-2_2_6.ec_sha256.txt: 成功
./1meta/ec-p2-20240801_pmbb_ec.json: 成功
./1meta/sha256.txt: 成功
./2tar/box-1_4-gen.tar: 成功
./4meta_1.tar: 成功
s2@a2 /r/m/s/BOX_P2_1_4_20240801> 
```

对所有刻录的光盘进行验证.

![光盘的文件 (2)](./图/25-d-3.png)


## 3 数据恢复

上面使用 6 张光盘制作了 4+2 的阵列,
也就是最多允许丢失/损坏任意 2 张光盘.
下面就来实际测试一下.

```sh
> ls -lh
总计 23G
drwxr-xr-x 1 s2 s2  102  8月 1日 23:23 1meta/
-rw-r--r-- 1 s2 s2 4.0G  8月 1日 23:01 box_1_4.iso
-rw-r--r-- 1 s2 s2 4.0G  8月 1日 23:03 box_2_4.iso
-rw-r--r-- 1 s2 s2 4.0G  8月 1日 23:05 box_3_4.iso
-rw-r--r-- 1 s2 s2 3.0G  8月 1日 23:06 box_4_4.iso
-rw-r--r-- 1 s2 s2 4.0G  8月 1日 23:19 ec_1_2_6.iso
-rw-r--r-- 1 s2 s2 4.0G  8月 1日 23:20 ec_2_2_6.iso
> rm box_1_4.iso box_3_4.iso
```

使用 `rm` 命令删除第 1, 3 张数据光盘, 模拟光盘丢失.
然后创建恢复数据所需的文件目录结构:

```sh
> pwd
/home/s2/pmbb/tmp/box-p2/recovery
> mkdir -p box-1_4/2tar
> mkdir -p box-2_4/2tar
> mkdir -p box-3_4/2tar
> mkdir -p box-4_4/2tar
> mkdir -p ec-1_2_6/2ec
> mkdir -p ec-2_2_6/2ec
```

使用没有丢失的文件, 创建以下目录结构:

```sh
> tree recovery
recovery
├── 1meta
│   ├── 4meta_1.tar_sha256.txt
│   ├── 4meta_2.tar_sha256.txt
│   ├── 4meta_3.tar_sha256.txt
│   ├── 4meta_4.tar_sha256.txt
│   ├── bb_plan-box-1_4-20240801_215026-sha256.txt
│   ├── bb_plan-box-3_4-20240801_215026-sha256.txt
│   ├── box-1_4-gen.tar_sha256.txt
│   ├── box-2_4-gen.tar_sha256.txt
│   ├── box-3_4-gen.tar_sha256.txt
│   ├── box-4_4-gen.tar_sha256.txt
│   ├── ec-1_2_6.ec_sha256.txt
│   ├── ec-2_2_6.ec_sha256.txt
│   ├── ec-p2-20240801_pmbb_ec.json
│   ├── meta-1_2_6.ec_sha256.txt
│   ├── meta-2_2_6.ec_sha256.txt
│   └── meta-ec-20240801_pmbb_ec.json
├── box-1_4
│   └── 2tar
├── box-2_4
│   ├── 2tar
│   │   └── box-2_4-gen.tar
│   └── 4meta_2.tar
├── box-3_4
│   └── 2tar
├── box-4_4
│   ├── 2tar
│   │   └── box-4_4-gen.tar
│   └── 4meta_4.tar
├── ec-1_2_6
│   └── 2ec
│       ├── ec-1_2_6.ec
│       └── meta-1_2_6.ec
├── ec-2_2_6
│   └── 2ec
│       ├── ec-2_2_6.ec
│       └── meta-2_2_6.ec
├── out
└── out_meta

16 directories, 24 files
```

创建要恢复的文件的空白占位文件:

```sh
> touch box-1_4/2tar/box-1_4-gen.tar
> touch box-3_4/2tar/box-3_4-gen.tar
> touch box-1_4/4meta_1.tar
> touch box-3_4/4meta_3.tar
```

### 3.1 恢复元数据

准备完毕, 首先使用 `pmbb-ec r2` 命令恢复第 1, 3 张数据光盘的元数据:

```sh
> env RUST_LOG=debug pmbb-ec r2 1meta/meta-ec-20240801_pmbb_ec.json out_meta
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2]   1meta/meta-ec-20240801_pmbb_ec.json
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::util] read 1meta/meta-ec-20240801_pmbb_ec.json
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] read /home/s2/pmbb/tmp/box-p2/recovery/1meta/4meta_1.tar_sha256.txt
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] read /home/s2/pmbb/tmp/box-p2/recovery/1meta/4meta_2.tar_sha256.txt
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] read /home/s2/pmbb/tmp/box-p2/recovery/1meta/4meta_3.tar_sha256.txt
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] read /home/s2/pmbb/tmp/box-p2/recovery/1meta/4meta_4.tar_sha256.txt
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] read /home/s2/pmbb/tmp/box-p2/recovery/1meta/meta-1_2_6.ec_sha256.txt
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] read /home/s2/pmbb/tmp/box-p2/recovery/1meta/meta-2_2_6.ec_sha256.txt
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] read /home/s2/pmbb/tmp/box-p2/recovery/1meta/../box-1_4/4meta_1.tar
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] read /home/s2/pmbb/tmp/box-p2/recovery/1meta/../box-2_4/4meta_2.tar
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] read /home/s2/pmbb/tmp/box-p2/recovery/1meta/../box-3_4/4meta_3.tar
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] read /home/s2/pmbb/tmp/box-p2/recovery/1meta/../box-4_4/4meta_4.tar
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] read /home/s2/pmbb/tmp/box-p2/recovery/1meta/../ec-1_2_6/2ec/meta-1_2_6.ec
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] read /home/s2/pmbb/tmp/box-p2/recovery/1meta/../ec-2_2_6/2ec/meta-2_2_6.ec
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] write out_meta/4meta_1.tar
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] write out_meta/4meta_2.tar
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] write out_meta/4meta_3.tar
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] write out_meta/4meta_4.tar
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2]   0
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] [None, Some(4194304), None, Some(4194304), Some(4194304), Some(4194304)]
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2]   4
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] [Some(4194304), Some(4194304), Some(4194304), Some(4194304), Some(4194304), Some(4194304)]
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2]   8
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2] [Some(4194304), Some(4194304), Some(4194304), Some(4194304), Some(4194304), Some(4194304)]
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2]   12
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2]   931840
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2]   911360
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2]   911360
[2024-08-01T17:46:05Z DEBUG pmbb_ec::ec::c2]   911360
```

然后就获得了这些文件:

```sh
> pwd
/home/s2/pmbb/tmp/box-p2/recovery/out_meta
> ls -l
总计 3588
-rw-r--r-- 1 s2 s2 931840  8月 2日 01:46 4meta_1.tar
-rw-r--r-- 1 s2 s2 911360  8月 2日 01:46 4meta_2.tar
-rw-r--r-- 1 s2 s2 911360  8月 2日 01:46 4meta_3.tar
-rw-r--r-- 1 s2 s2 911360  8月 2日 01:46 4meta_4.tar
```

其中 `4meta_1.tar`, `4meta_3.tar` 就分别是第 1, 3 张数据光盘的元数据.

使用 `tar` 解包即可获得丢失的元数据:

```sh
> mkdir 1
> cd 1
> tar -xvf ../4meta_1.tar
1meta/
1meta/bb_plan-box-1_4-20240801_215026-sha256.txt
1meta/box-p2-20240801.txt
1meta/du-20240801_215026.txt
1meta/sha256-20240801_215026.txt
1meta/box-1_4-gen.tar_sha256.txt
1meta/box-2_4-gen.tar_sha256.txt
1meta/box-3_4-gen.tar_sha256.txt
1meta/box-4_4-gen.tar_sha256.txt
1meta/ec-1_2_6.ec_sha256.txt
1meta/ec-2_2_6.ec_sha256.txt
1meta/ec-p2-20240801_pmbb_ec.json
1meta/sha256.txt
```

### 3.2 恢复打包文件

接下来恢复打包文件 (省略部分结果):

```sh
> env RUST_LOG=debug pmbb-ec r2 1meta/ec-p2-20240801_pmbb_ec.json out
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2]   1meta/ec-p2-20240801_pmbb_ec.json
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::util] read 1meta/ec-p2-20240801_pmbb_ec.json
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] read /home/s2311/pmbb/tmp/box-p2/recovery/1meta/box-1_4-gen.tar_sha256.txt
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] read /home/s2311/pmbb/tmp/box-p2/recovery/1meta/box-2_4-gen.tar_sha256.txt
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] read /home/s2311/pmbb/tmp/box-p2/recovery/1meta/box-3_4-gen.tar_sha256.txt
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] read /home/s2311/pmbb/tmp/box-p2/recovery/1meta/box-4_4-gen.tar_sha256.txt
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] read /home/s2311/pmbb/tmp/box-p2/recovery/1meta/ec-1_2_6.ec_sha256.txt
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] read /home/s2311/pmbb/tmp/box-p2/recovery/1meta/ec-2_2_6.ec_sha256.txt
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] read /home/s2311/pmbb/tmp/box-p2/recovery/1meta/../box-1_4/2tar/box-1_4-gen.tar
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] read /home/s2311/pmbb/tmp/box-p2/recovery/1meta/../box-2_4/2tar/box-2_4-gen.tar
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] read /home/s2311/pmbb/tmp/box-p2/recovery/1meta/../box-3_4/2tar/box-3_4-gen.tar
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] read /home/s2311/pmbb/tmp/box-p2/recovery/1meta/../box-4_4/2tar/box-4_4-gen.tar
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] read /home/s2311/pmbb/tmp/box-p2/recovery/1meta/../ec-1_2_6/3ec/ec-1_2_6.ec
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] read /home/s2311/pmbb/tmp/box-p2/recovery/1meta/../ec-2_2_6/3ec/ec-2_2_6.ec
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] write out/box-1_4-gen.tar
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] write out/box-2_4-gen.tar
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] write out/box-3_4-gen.tar
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] write out/box-4_4-gen.tar
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2]   0
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] [None, Some(4194304), None, Some(4194304), Some(4194304), Some(4194304)]
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2]   4
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] [None, Some(4194304), None, Some(4194304), Some(4194304), Some(4194304)]
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2]   8
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] [None, Some(4194304), None, Some(4194304), Some(4194304), Some(4194304)]
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2]   12
[2024-08-01T17:53:40Z DEBUG pmbb_ec::ec::c2] [None, Some(4194304), None, Some(4194304), Some(4194304), Some(4194304)]

[2024-08-01T17:55:29Z DEBUG pmbb_ec::ec::c2]   3988
[2024-08-01T17:55:29Z DEBUG pmbb_ec::ec::c2] [None, Some(4194304), None, Some(4194304), Some(4194304), Some(4194304)]
[2024-08-01T17:55:29Z DEBUG pmbb_ec::ec::c2]   3992
[2024-08-01T17:55:29Z DEBUG pmbb_ec::ec::c2] [None, Some(4194304), None, Some(4194304), Some(4194304), Some(4194304)]
[2024-08-01T17:55:29Z DEBUG pmbb_ec::ec::c2]   3996
[2024-08-01T17:55:29Z DEBUG pmbb_ec::ec::c2] [Some(4194304), Some(4194304), Some(4194304), Some(4194304), Some(4194304), Some(4194304)]
[2024-08-01T17:55:29Z DEBUG pmbb_ec::ec::c2]   4000
[2024-08-01T17:55:29Z DEBUG pmbb_ec::ec::c2] [Some(4194304), Some(4194304), Some(4194304), Some(4194304), Some(4194304), Some(4194304)]
[2024-08-01T17:55:29Z DEBUG pmbb_ec::ec::c2]   4004
[2024-08-01T17:55:29Z DEBUG pmbb_ec::ec::c2]   4188200960
[2024-08-01T17:55:29Z DEBUG pmbb_ec::ec::c2]   4188006400
[2024-08-01T17:55:29Z DEBUG pmbb_ec::ec::c2]   4188037120
[2024-08-01T17:55:29Z DEBUG pmbb_ec::ec::c2]   3168409600
```

然后就获得了:

```sh
> ls -lh
总计 15G
-rw-r--r-- 1 s2 s2 4.0G  8月 2日 01:55 box-1_4-gen.tar
-rw-r--r-- 1 s2 s2 4.0G  8月 2日 01:55 box-2_4-gen.tar
-rw-r--r-- 1 s2 s2 4.0G  8月 2日 01:55 box-3_4-gen.tar
-rw-r--r-- 1 s2 s2 3.0G  8月 2日 01:55 box-4_4-gen.tar
> pwd
/home/s2/pmbb/tmp/box-p2/recovery/out
```

其中 `box-1_4-gen.tar`, `box-3_4-gen.tar` 就是恢复出来的数据文件.

----

把上面获得的文件简单组合一下, 就恢复了第 1 张数据光盘:

```sh
> tree box-1_4
box-1_4
├── 1meta
│   ├── bb_plan-box-1_4-20240801_215026-sha256.txt
│   ├── box-1_4-gen.tar_sha256.txt
│   ├── box-2_4-gen.tar_sha256.txt
│   ├── box-3_4-gen.tar_sha256.txt
│   ├── box-4_4-gen.tar_sha256.txt
│   ├── box-p2-20240801.txt
│   ├── du-20240801_215026.txt
│   ├── ec-1_2_6.ec_sha256.txt
│   ├── ec-2_2_6.ec_sha256.txt
│   ├── ec-p2-20240801_pmbb_ec.json
│   ├── sha256-20240801_215026.txt
│   └── sha256.txt
├── 2tar
│   └── box-1_4-gen.tar
└── 4meta_1.tar

3 directories, 14 files
```

使用 `sha256sum -c` 验证一下:

```sh
> pwd
/home/s2/pmbb/tmp/box-p2/recovery/box-1_4
> sha256sum -c 1meta/sha256.txt
./1meta/bb_plan-box-1_4-20240801_215026-sha256.txt: 成功
./1meta/box-p2-20240801.txt: 成功
./1meta/du-20240801_215026.txt: 成功
./1meta/sha256-20240801_215026.txt: 成功
./1meta/box-1_4-gen.tar_sha256.txt: 成功
./1meta/box-2_4-gen.tar_sha256.txt: 成功
./1meta/box-3_4-gen.tar_sha256.txt: 成功
./1meta/box-4_4-gen.tar_sha256.txt: 成功
./1meta/ec-1_2_6.ec_sha256.txt: 成功
./1meta/ec-2_2_6.ec_sha256.txt: 成功
./1meta/ec-p2-20240801_pmbb_ec.json: 成功
./2tar/box-1_4-gen.tar: 成功
```

类似的, 恢复出来的第 3 张数据光盘:

```sh
> pwd
/home/s2/pmbb/tmp/box-p2/recovery/box-3_4
> sha256sum -c 1meta/sha256.txt
./1meta/bb_plan-box-3_4-20240801_215026-sha256.txt: 成功
./1meta/box-p2-20240801.txt: 成功
./1meta/du-20240801_215026.txt: 成功
./1meta/sha256-20240801_215026.txt: 成功
./1meta/box-1_4-gen.tar_sha256.txt: 成功
./1meta/box-2_4-gen.tar_sha256.txt: 成功
./1meta/box-3_4-gen.tar_sha256.txt: 成功
./1meta/box-4_4-gen.tar_sha256.txt: 成功
./1meta/ec-1_2_6.ec_sha256.txt: 成功
./1meta/ec-2_2_6.ec_sha256.txt: 成功
./1meta/ec-p2-20240801_pmbb_ec.json: 成功
./2tar/box-3_4-gen.tar: 成功
```

文件完好无损, 撒花 ~


## 4 数据完整性检查验证

俗话说, 没有检查验证的备份, 就相当于没有备份.
做的数据备份, 应该定期 (比如几个月, 每年) 拿出来检查一下,
看看备份的数据是否损坏.

+ (1) **全盘数据验证** (详见 2.5 章节).

  将光盘放入光驱, 使用 `sha256sum -c`
  命令读取并计算光盘上所有文件的 sha256.
  光盘根目录的 `sha256.txt` 文件记录了光盘上所有文件的 sha256 值.

  ```sh
  > sha256sum -c sha256.txt
  ./1meta/bb_plan-box-1_4-20240801_215026-sha256.txt: 成功
  ./1meta/box-p2-20240801.txt: 成功
  ./1meta/du-20240801_215026.txt: 成功
  ./1meta/sha256-20240801_215026.txt: 成功
  ./1meta/box-1_4-gen.tar_sha256.txt: 成功
  ./1meta/box-2_4-gen.tar_sha256.txt: 成功
  ./1meta/box-3_4-gen.tar_sha256.txt: 成功
  ./1meta/box-4_4-gen.tar_sha256.txt: 成功
  ./1meta/ec-1_2_6.ec_sha256.txt: 成功
  ./1meta/ec-2_2_6.ec_sha256.txt: 成功
  ./1meta/ec-p2-20240801_pmbb_ec.json: 成功
  ./1meta/sha256.txt: 成功
  ./2tar/box-1_4-gen.tar: 成功
  ./4meta_1.tar: 成功
  ```

+ (2) 验证打包的文件.

  一般情况下, 上面的全盘数据验证已经足够.
  然而如果需要, 还可以验证打包的每一个备份文件 (`2tar`).

  首先安装 `tar-sha256` 程序 (省略部分结果):
  <https://crates.io/crates/tar-sha256>

  ```sh
  > cargo install tar-sha256@0.1.0-a2
      Updating `rsproxy-sparse` index
    Downloaded tar-sha256 v0.1.0-a2 (registry `rsproxy-sparse`)
    Downloaded 1 crate (7.9 KB) in 0.55s
    Installing tar-sha256 v0.1.0-a2
      Updating `rsproxy-sparse` index
       Locking 82 packages to latest compatible versions
        Adding bitflags v1.3.2 (latest: v2.6.0)

        Adding windows-sys v0.52.0 (latest: v0.59.0)
    Downloaded time-macros v0.2.18 (registry `rsproxy-sparse`)

    Downloaded linux-raw-sys v0.4.14 (registry `rsproxy-sparse`)
    Downloaded 67 crates (6.3 MB) in 30.99s (largest was `linux-raw-sys` at 1.8 MB)
     Compiling proc-macro2 v1.0.86

     Compiling tar-sha256 v0.1.0-a2
      Finished `release` profile [optimized] target(s) in 48.66s
    Installing /home/s2/.cargo/bin/tar-sha256
     Installed package `tar-sha256 v0.1.0-a2` (executable `tar-sha256`)
  ```

  然后可以在 **不解包** tar 文件的情况下,
  计算里面文件的 sha256 (省略部分结果):

  ```sh
  > pwd
  /home/s2/pmbb/tmp/box-p2/recovery/box-1_4/2tar
  > type tar-sha256
  tar-sha256 is /home/s2/.cargo/bin/tar-sha256
  > tar-sha256 --version
  tar-sha256 version 0.1.0-a2 (x86_64-unknown-linux-gnu, default)
  > tar-sha256 box-1_4-gen.tar 
  81606177efda22433488aadcead800f7501386d96aa502ded489495ac59638f8  p2/2022照片/IMG_20220112_142055.jpg
  ca7b65c03520dc8302ad34fba37bccf981842d0c586087ef04534267eb1b6da5  p2/2022照片/IMG_20220219_111519.jpg
  49aea051884c05937edfaee11b566331c851cd68e075aad164dce95ea2396d90  p2/2022照片/IMG_20220219_111653.jpg
  71b42b9c6c2b559a7040983daf8203065aed32d5abe26f4d7340b0938786b2c6  p2/2022照片/IMG_20220222_091438.jpg
  1bef3c438b8644bcc798fc9da43682eb872e8c6c61d6c1c2bb6ae606d45dfae4  p2/2022照片/IMG_20220709_000810.jpg
  a7274f9b6d6ddb75075314e13e226cfe72978b5c499d9c0f3f0e94505a3c456f  p2/2023照片/IMG_20230125_022230.jpg
  61cda443793da8df5f3345a18f9387c017ecbca29f202a5b304a2880c3cdc9df  p2/2023照片/IMG_20230125_022241.jpg
  6d04e79b1929565c3e69f49718ed3f6a19ce25ee761ed65e120b1b1076ec4ece  p2/2023照片/IMG_20230125_022243.jpg
  7ec9f48515b33a57773c98675f454309b647ef2462b237e5b1a53eaa3f74fa98  p2/2023照片/IMG_20230125_022245.jpg
  95d5daf1b03422992b8fb74c5b29ed52d1b721204431ccbb120809094dac3ca5  p2/2023照片/IMG_20230125_022542.jpg
  cfc6a4820b19e79398584140b41fe1c20855b2b198e1d5f0dfda452f5de7578f  p2/2023照片/IMG_20230125_022544.jpg
  436cf3735a7e56e6e427a67aa5ba0a3479559655035f64c117eb3614fb3b2c4b  p2/2023照片/IMG_20230125_022547.jpg
  d69cb66429268b22c0af47b9d9c86643f1bd17d5ee18590053c30450018890fe  p2/2024照片/IMG_20240101_202913.jpg
  d16e789cc12a98ee2104f90ccf6aec15b0fb4872bfea0410796a72d965b5bc3f  p2/2024照片/IMG_20240101_202918.jpg
  ```

----

如果已经解包了 tar 文件, 可以直接使用装箱计划 (`bb_plan`) 文件来验证, 比如:

```sh
> pwd
/home/s2/pmbb/tmp/box-p2/box-1_4/gen
> sha256sum -c ../bb_plan-box-1_4-20240801_215026-sha256.txt 
p2/2022照片/IMG_20220112_142055.jpg: 成功
p2/2022照片/IMG_20220219_111519.jpg: 成功
p2/2022照片/IMG_20220219_111653.jpg: 成功
p2/2022照片/IMG_20220222_091438.jpg: 成功
p2/2022照片/IMG_20220709_000810.jpg: 成功
p2/2023照片/IMG_20230125_022230.jpg: 成功
p2/2023照片/IMG_20230125_022241.jpg: 成功
p2/2023照片/IMG_20230125_022243.jpg: 成功
p2/2023照片/IMG_20230125_022245.jpg: 成功
p2/2023照片/IMG_20230125_022542.jpg: 成功
p2/2023照片/IMG_20230125_022544.jpg: 成功
p2/2023照片/IMG_20230125_022547.jpg: 成功
p2/2024照片/IMG_20240101_202913.jpg: 成功
p2/2024照片/IMG_20240101_202918.jpg: 成功
```


## 5 总结与展望

光盘用来备份数据, 本身就是比较靠谱的,
因为光盘 **耐摔**, **防水**, **只读**, 读写分离, 结构简单, 等等, 优点很多.
比如, 根据 iso9660 文件系统获得的扇区编号,
窝们可以直接计算出某个文件在光盘上的具体存储位置, 位于半径多少厘米的地方,
因为光盘扇区在光盘上是近似均匀分布的.

胖喵贪吃 (pmbb-ec) 基于纠删码 (RS) 实现的光盘 RAID 功能,
进一步提高了光盘备份的可靠程度.
M+N 的 RS 码, 最多允许任意丢失/损坏 N 块数据,
用户可以根据需要设定 M 和 N 的具体数值.
pmbb-ec 支持的 M+N 的最大值是 256, 也就是支持最多 256 张光盘制作一个阵列.

光盘比较便宜, 对穷人很友好.
硬盘 RAID 虽好, 但是需要 4 块及以上硬盘, 才能有比较好的效果.
这么多块大容量硬盘, 不是穷人能够轻易买的起的.
但是光盘就不一样了, 10 元成本做个 RAID, 不再是遥不可及的梦想.
单张光盘 **容量小**, 备份一次数据需要很多张光盘, 这确实是光盘的一大缺点.
但是, 多张光盘正好适合做 RAID, 这个缺点反而就变成优点了 ! (狗头)

pmbb-ec 使用的数据块大小是 4MB, 单独计算每个数据块的 sha256.
所以, 除了整张光盘的丢失/损坏这种情况, 还可能应对所有光盘全部部分损坏,
也就是说, 每张光盘都损坏一部分, 没有一张是完好的.
这种情况下, 如果不同光盘损坏的部分 **不重叠**
(比如, 第 1 张光盘第 100 个数据块损坏, 第 2 张光盘第 50 个数据块损坏,
第 3 张光盘第 300 个数据块损坏),
那么通过使用每张光盘中完好的数据块, 仍然可能恢复全部数据.
所以通过添加恢复光盘, 可以显著提高光盘数据的恢复能力.

每张光盘的元数据, 在 **光盘内圈** 和 **光盘外圈** 各存储一份,
从而减少元数据丢失的可能, 使整体的光盘备份更加可靠.

胖喵贪吃并没有创造新的文件格式, 而是利用已有的, 广泛使用的格式, 比如
tar, sha256, JSON, iso9660.
即使没有 pmbb-ec, 备份的数据仍然是可用的.

----

窝曾经看到这样一条评论, 大意是:

> RAR 压缩包可以添加 "恢复记录", 在文件部分损坏的情况下恢复数据.

现在 pmbb-ec 也实现了类似的功能, 并且 `胖喵贪吃` 是开源的.

----

此处只是初步验证了光盘 RAID 的可行性, 制作光盘 RAID 的很多步骤还是手动操作的,
比较麻烦.
后续计划通过完善代码, 提高自动化程度, 最好加上图形用户界面 (GUI), 方便使用.

除了多张光盘组成的冗余阵列, 单张光盘也是能够添加冗余数据块的,
也就是类似于 RAR 压缩包的 "恢复记录", 可以应对单张光盘局部损坏的情况.

----

本文使用 CC-BY-SA 4.0 许可发布.
