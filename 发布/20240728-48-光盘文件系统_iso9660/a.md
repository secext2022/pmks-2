# 光盘文件系统 (iso9660) 格式解析

**越简单的系统, 越可靠**, 越不容易出问题.
光盘文件系统 (`iso9660`) 十分简单, 只需不到 200 行代码,
即可实现定位读取其中的文件.

参考资料: <https://wiki.osdev.org/ISO_9660>

----

相关文章:

+ 《光盘防水嘛 ? DVD+R 刻录光盘泡水实验》

  TODO

+ 《光驱的内部结构及日常使用》

  TODO

+ 《胖喵贪吃: 备份数据文件的小工具》

  TODO

+ 《穷人如何备份数据 ? 常见存储设备简单总结》

  TODO


## 目录

+ 1 概述

  - 1.1 Joliet 扩展

+ 2 卷描述符

+ 3 目录项

  - 3.1 目录项结构
  - 3.2 递归遍历目录树
  - 3.3 文件在光盘上的存储位置

+ 4 tar 文件格式

+ 5 总结与展望

+ 附录 1 完整源代码


## 1 概述

大部分光盘都是 **只读** 的,
比如工厂直接压制的光盘 (CD-ROM, DVD-ROM, BD-ROM), 在塑料基板上压出凹坑,
类似于在石头上刻字, 制造过程中就已经写好了数据.
一次性刻录光盘 (CD-R, DVD-R, DVD+R, BD-R), 使用激光烧灼记录层的化学染料,
类似于在纸上写字, 在刻录数据之后也是无法修改的.
也有使用相变材料, 作为记录层的可擦写光盘 (CD-RW, DVD-RW, DVD+RW, BD-RE),
不常用 (写入速度太慢, 价格贵).

与之相反, 大部分常见的存储设备, 比如硬盘, SSD (闪存), 都可以随时修改数据.
所以光盘的只读特性, 很大程度上影响了光盘文件系统的设计, 也让光盘文件系统很简单.
比如硬盘上使用的文件系统, 单个文件的数据可能在硬盘上分开存储在多个不同的位置,
**不连续**, 也就是著名的 **磁盘碎片**.
这是因为, 随着不断的新增/删除数据, 硬盘上的存储空间会出现碎片.
比如, 首先在硬盘上写入一大堆小文件, 然后删除其中的一部分文件.
此时, 删除一堆小文件后, 在硬盘上释放出来的空闲空间, 是不连续的, 也就是一堆碎片.
如果再写入一个大文件, 很可能会出现总的空闲空间足够, 但是没有连续的大片空间,
也就不得不把这个大文件切分开, 塞到一堆小的碎片空间之中.
磁盘碎片就产生了.

`iso9660` (也叫 `CDFS`) 是从古老的 CD 光盘 (约 40 年前) 开始使用的古老文件系统,
后来更先进的 DVD 光盘 (30 年前) 和 BD 蓝光光盘 (20 年前) 也能使用.
因为光盘的只读特点, iso9660 之中的文件是 **连续存储** 的.
对, 光盘没有文件碎片 !!
通常使用工具软件 (比如 `xorrisofs`) 生成 iso9660 格式的 **光盘镜像文件**,
然后再把光盘镜像文件整个刻录到光盘 (比如使用 `cdrskin` 工具软件).

----

从物理结构上来说, 光盘中的数据存储在 **轨道** 上, 从光盘接近中心的部分开始记录,
一圈圈圆形 (螺旋) 扩展到光盘边缘.
对于上层应用来说, 光盘是一个 **块设备** (光驱屏蔽了底层编码和物理实现细节),
也就是由许多可以随机寻址的数据块 (**扇区**, sector) 构成.
上层应用可以通过指定扇区编号, 指挥光驱读取单个扇区.

扇区从头到尾连续编号, **每个扇区容量 2KB** (2048 字节), 第一个扇区是 0 扇区.
单层 DVD+R 光盘通常具有 2295104 个扇区 (容量 4.37GB).
单层 BD-R 光盘通常具有 12219392 个扇区 (容量 23.3GB, 23866MB).

在 iso9660 文件系统之中主要有两种数据结构:
**卷描述符** (Volume Descriptor) 和 **目录项** (directory record).
卷描述符包含了关于整个光盘的描述信息, 比如 **卷标** (label, 也就是光盘名称),
**根目录** (实际上是一个目录项) 等.
目录项包含文件名, 文件类型 (比如目录),
文件在光盘上的位置 (扇区编号), 文件大小 (字节) 等.

在 iso9660 文件系统之中, 所有文件 (普通文件和目录文件) 都独占扇区, 连续存储.
也就是说, 一个扇区最多存储一个文件, 哪怕这个文件只有一个字节.

关于 iso9660 文件系统的数据格式的具体细节,
请见 osdev 的参考资料 (链接在本文开头位置).

----

除了古老的 `iso9660`, 还有另一种较新的光盘文件系统 `UDF`,
功能更丰富, 但是也更复杂, 本文不讨论.

### 1.1 Joliet 扩展

最原始的, 基本的 iso9660 文件系统, 对文件名的限制很严格,
类似于 DOS 的 "8.3" 文件名, 也就是说文件名最多使用 8 个 ASCII 字符,
也就是不支持中文.

这很不方便, 于是就有了 `Joliet` 扩展, 使用 "UCS-2" 编码 (`utf-16be`),
也就是 Unicode 字符集, 同时也能使用更长的文件名了.


## 2 卷描述符

光盘最开始的 16 个扇区 (0 ~ 15) 是保留区域,
**卷描述符** 从 16 号扇区开始.
每个卷描述符占用一个扇区, 有多个类型, 使用不同的数字区分:

```ts
// 卷描述符类型代码 Volume Descriptor Type Codes
// Boot Record
export const 卷描述符类型_启动记录 = 0;
// Primary Volume Descriptor
export const 卷描述符类型_主卷描述符 = 1;
// Supplementary Volume Descriptor
export const 卷描述符类型_次卷描述符 = 2;
// Volume Partition Descriptor
export const 卷描述符类型_卷分区描述符 = 3;
// Volume Descriptor Set Terminator
export const 卷描述符类型_结束 = 255;
```

窝们的主要任务目标是定位并读取光盘中的文件,
所以对 `1`, `2` 类型的卷描述符感兴趣, 因为其中包含了 **根目录**.
其中 `1` 没有使用 Joliet 扩展, `2` 使用了 Joliet 扩展, 其余格式相同.
显然窝们对 `2` 更感兴趣.

定义一下卷描述符包含的数据:

```ts
// Volume Descriptor
export interface 卷描述符 {
  // Type
  类型: number;
  // Identifier
  标识: string;
  // Version
  版本: number;

  主?: 主卷描述符;
  启动?: 启动记录;
}

// Boot Record
export interface 启动记录 {
  // Boot System Identifier
  启动系统标识: string;
  // Boot Identifier
  启动标识: string;
}

// Primary Volume Descriptor
export interface 主卷描述符 {
  // System Identifier
  系统标识: string;
  // Volume Identifier
  卷标: string;
  // Volume Space Size
  卷空间块: number;
  // Volume Set Size
  逻辑卷集大小: number;
  // Volume Sequence Number
  逻辑卷集序号: number;
  // Logical Block Size
  逻辑块大小: number;

  // Directory entry for the root directory
  根目录: 目录项;
}
```

卷描述符之中还有一些别的信息, 但是窝们不关心, 忽略.
此处的代码还可以继续简化, 其中最重要的就是根目录.

----

为了方便的读取光盘 (光盘镜像文件) 之中的数据, 窝们定义几个辅助工具函数:

```ts
// 光盘扇区大小
export const 扇区 = 2048;

// 读取文件的一部分数据
async function 读文件(
  f: Deno.FsFile,
  偏移: number,
  长度: number,
): Promise<[Uint8Array, number | null]> {
  await f.seek(偏移, Deno.SeekMode.Start);
  const b = new Uint8Array(长度);
  return [b, await f.read(b)];
}

// 读取一个光盘扇区
//
// 编号: 扇区编号
async function 读扇区(f: Deno.FsFile, 编号: number): Promise<Uint8Array> {
  const r = await 读文件(f, 编号 * 扇区, 扇区);
  // TODO 检查读取失败
  return r[0];
}

// 读取从某个扇区开始的数据
async function 读数据(
  f: Deno.FsFile,
  编号: number,
  长度: number,
): Promise<Uint8Array> {
  const r = await 读文件(f, 编号 * 扇区, 长度);
  // TODO 检查读取失败
  return r[0];
}

// 读取数据块的指定字节, 转换为文本
function 读文本(数据: Uint8Array, 偏移: number, 长度: number): string {
  const b = 数据.slice(偏移, 偏移 + 长度);
  const d = new TextDecoder();
  return d.decode(b);
}

// Joliet: UCS-2
function 读文本2(数据: Uint8Array, 偏移: number, 长度: number): string {
  const b = 数据.slice(偏移, 偏移 + 长度);
  const d = new TextDecoder("utf-16be");
  return d.decode(b);
}

function 读文本_2(
  数据: Uint8Array,
  偏移: number,
  长度: number,
  joliet: boolean = false,
): string {
  return joliet ? 读文本2(数据, 偏移, 长度) : 读文本(数据, 偏移, 长度);
}
```

其中 `读文件` 按照偏移 (字节) 和长度 (字节) 读取文件中的一块数据.
`读扇区` 读取指定编号的一个扇区数据.
`读数据` 按照扇区编号和长度 (字节) 进行读取, 适合一次读取多个连续扇区.
`读文本` 按照偏移 (字节) 和长度 (字节) 读取文本, 按照 ASCII (utf-8) 解码.
`读文本2` 类似, 但是使用 `utf-16be` 解码.
`读文本_2` 按照 Joliet 扩展是否启用, 分别选择不同的文本解码方式.

注意读取文件的操作, 涉及到 IO, 所以是异步 (async/await) 函数.
内存中的数据操作, 是同步 (普通) 函数.

参考资料:

+ `Deno.FsFile`: <https://docs.deno.com/api/deno/~/Deno.FsFile>
+ `Uint8Array`: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array>
+ `DataView`: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView>
+ `ArrayBuffer`: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer>
+ `TextDecoder`: <https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder>

----

然后就可以解析单个卷描述符了:

```ts
// 解析 Volume Descriptor
function 解析卷描述符(b: Uint8Array): 卷描述符 {
  const v = new DataView(b.buffer);
  const o: 卷描述符 = {
    类型: b[0],
    标识: 读文本(b, 1, 5),
    版本: b[6],
  };
  const joliet = 卷描述符类型_次卷描述符 == o.类型;

  switch (o.类型) {
    case 卷描述符类型_主卷描述符:
    case 卷描述符类型_次卷描述符:
      {
        o.主 = {
          系统标识: 读文本_2(b, 8, 32, joliet),
          卷标: 读文本_2(b, 40, 32, joliet),
          卷空间块: v.getUint32(80, true),
          逻辑卷集大小: v.getUint16(120, true),
          逻辑卷集序号: v.getUint16(124, true),
          逻辑块大小: v.getUint16(128, true),

          根目录: 解析目录项(b.slice(156, 156 + 34), joliet),
        };
      }
      break;
    case 卷描述符类型_启动记录:
      o.启动 = {
        启动系统标识: 读文本(b, 7, 32),
        启动标识: 读文本(b, 39, 32),
      };
      break;
  }
  return o;
}
```

单个卷描述符对应一个扇区的数据, 各项数据都是固定的偏移和长度,
按照标准读取即可.
比如类型就是第一个字节 (偏移 0, 长度 1).
然后根据不同的类型分别处理.

卷标偏移 40, 长度 32. 根目录偏移 156, 长度 34 字节.
目录项的解析后文再说.

```ts
// 输入: 光盘镜像文件 (iso)
export async function 解析iso(文件名: string) {
  // 打开光盘镜像文件
  const f = await Deno.open(文件名);

  // 解析卷描述符, 从 16 扇区开始
  let vdi = 16;
  let vd继续 = true;
  // 保存根目录
  let 根目录: 目录项 | undefined;

  while (vd继续) {
    const 扇区 = await 读扇区(f, vdi);
    const vd = 解析卷描述符(扇区);
    // debug
    console.log(vdi, vd);

    if (卷描述符类型_结束 == vd.类型) {
      vd继续 = false;
    } else if (卷描述符类型_次卷描述符 == vd.类型) {
      根目录 = vd.主!.根目录;
    }
    // 继续读取下一个卷描述符
    vdi += 1;
  }
```

从头解析 iso 文件:
首先打开文件, 然后从 16 扇区开始, 依次读取卷描述符.
卷描述符可能有多个, 直到遇到结束标记.

----

测试文件是 ArchLinux 安装光盘镜像, 下载地址: <https://archlinux.org/download/>

```sh
> deno run -A src/bin/pmbb-iso.ts ls tmp/archlinux-2024.07.01-x86_64.iso
pmbb-iso: pmbb v0.1.0-a2
16 {
  "类型": 1,
  "标识": "CD001",
  "版本": 1,
  "主": {
    "系统标识": "                                ",
    "卷标": "ARCH_202407                     ",
    "卷空间块": 572944,
    "逻辑卷集大小": 1,
    "逻辑卷集序号": 1,
    "逻辑块大小": 2048,
    "根目录": {
      "长度": 34,
      "扩展属性长度": 0,
      "位置": 35,
      "数据长度": 2048,
      "文件标志": 2,
      "_目录": true,
      "交错模式文件单元大小": 0,
      "交错模式文件间隔大小": 0,
      "卷序号": 1,
      "文件名长度": 1,
      "文件名": "\x00",
      "_文件名": Uint8Array(1) [ 0 ],
      _: true
    }
  }
}
17 {
  "类型": 0,
  "标识": "CD001",
  "版本": 1,
  "启动": {
    "启动系统标识": "EL TORITO SPECIFICATION\x00\x00\x00\x00\x00\x00\x00\x00\x00",
    "启动标识": "\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
  }
}
18 {
  "类型": 2,
  "标识": "CD001",
  "版本": 1,
  "主": {
    "系统标识": "                ",
    "卷标": "ARCH_202407     ",
    "卷空间块": 488448,
    "逻辑卷集大小": 1,
    "逻辑卷集序号": 1,
    "逻辑块大小": 2048,
    "根目录": {
      "长度": 34,
      "扩展属性长度": 0,
      "位置": 77,
      "数据长度": 2048,
      "文件标志": 2,
      "_目录": true,
      "交错模式文件单元大小": 0,
      "交错模式文件间隔大小": 0,
      "卷序号": 1,
      "文件名长度": 1,
      "文件名": "�",
      "_文件名": Uint8Array(1) [ 0 ],
      _: true
    }
  }
}
19 { "类型": 255, "标识": "CD001", "版本": 1 }

```

运行上述代码, 可以看到, 这个光盘镜像具有多个卷描述符.
其中 16 扇区类型 1, 也就是传统的短文件名.
17 扇区类型 0, 这是一个启动记录, 用来从光盘启动系统.

18 扇区类型 2, 也就是 Joliet 扩展的长文件名, 窝们主要关心这个.
从这个卷描述符窝们知道, 光盘名称 `ARCH_202407`, 根目录位于 77 扇区.

19 扇区类型 255, 表示卷描述符结束.


## 3 目录项

除了卷描述符, **目录项** 是 iso9660 中的另一个重要数据结构了.

### 3.1 目录项结构

首先定义目录项之中包含的数据:

```ts
export const 文件标志_目录 = 2;

// Directory entry, directory record
export interface 目录项 {
  // Length of Directory Record
  长度: number;
  // Extended Attribute Record length
  扩展属性长度: number;
  // Location of extent (LBA)
  位置: number;
  // Data length (size of extent)
  数据长度: number;

  // File flags
  文件标志: number;
  _目录: boolean;

  // File unit size for files recorded in interleaved mode
  交错模式文件单元大小: number;
  // Interleave gap size for files recorded in interleaved mode
  交错模式文件间隔大小: number;

  // Volume sequence number
  卷序号: number;
  // Length of file identifier (file name)
  文件名长度: number;
  // File identifier
  文件名: string;
  // 原始文件名
  _文件名?: Uint8Array;
  // 标记 . 和 .. 目录
  _?: boolean;
}
```

其中的重要数据有:
`长度` 就是目录项自己的长度 (字节),
根据这个可以找到下一个目录项的位置.
`位置` 就是目录项指向的内容 (文件) 的扇区编号.
`数据长度` 是目录项指向的文件的长度 (字节).

`文件标志` 是一个位标志, 其中第 2 位 (值为 2) 的含义是,
这个目录项指向的文件是一个目录 (下级目录).

然后就是 `文件名长度` (字节) 和 `文件名`.
因为文件名的长度是变化的, 所以整个目录项的总长度也是变化的.

```ts
function 解析目录项(b: Uint8Array, joliet: boolean = false): 目录项 {
  const v = new DataView(b.buffer);
  const 文件标志 = b[25];
  const 文件名长度 = b[32];
  const 文件名 = 读文本_2(b, 33, 文件名长度, joliet);
  const _文件名 = b.slice(33, 33 + 文件名长度);

  return {
    长度: b[0],
    扩展属性长度: b[1],
    位置: v.getUint32(2, true),
    数据长度: v.getUint32(10, true),

    文件标志,
    _目录: (文件标志 & 文件标志_目录) != 0,

    交错模式文件单元大小: b[26],
    交错模式文件间隔大小: b[27],
    卷序号: v.getUint16(28, true),
    文件名长度,
    文件名,
    _文件名,
    // 检查 . 和 .. 目录
    _: (1 == 文件名长度) && ((0 == _文件名[0]) || (1 == _文件名[0])),
  };
}
```

然后就可以来解析单个目录项了.
目录项中的不同数据, 也是位于固定的偏移和长度, 直接读取即可.

`长度` 偏移 0, 长度 1.
`位置` 偏移 2, 长度 4 字节.
所以光盘最多可以有 `2^32` (2 的 32 次方) 个扇区,
因为每个扇区 2KB, 所以最大总容量为 8TB.
目前最大容量的光盘远远小于这个大小.

`数据长度` 偏移 10, 长度 4 字节.
所以单个文件最大 `2^32` - 1 字节, 也就是不到 4GB.
这个限制就比较严重了, 现在很多大文件都可以轻松超过 4GB 大小.

`文件标志` 偏移 25, 长度 1.
需要检查这个数据, 来确定目录项指向的是一个普通文件,
还是一个下级目录.

`文件名长度` 偏移 32, 长度 1. `文件名` 偏移 33, 长度可变.
所以一个目录项的长度至少 33 字节.

### 3.2 递归遍历目录树

一个目录 (含有多个目录项) 可以包含普通文件, 也可以包含下级目录,
所以从根目录开始, 文件和目录形成一个树形结构.

要想访问树的每一个节点 (文件), 一种常用的方法是递归遍历:

```ts
// 递归遍历目录
async function 遍历目录(f: Deno.FsFile, 上级: 目录项, 路径: string) {
  // 防止死循环: 跳过 . 和 .. 目录
  if (上级._) {
    return;
  }
  const p = 路径 + (上级._目录 ? "/" : "");
  // 输出扇区编号 (数据长度) 和路径
  const 大小 = "(" + 显示大小(上级.数据长度) + " " + 上级.数据长度 + ")";
  console.log(上级.位置, 大小, p);
  // 如果不是目录, 结束递归
  if (!上级._目录) {
    return;
  }
  //console.log(上级);

  // 读取目录文件
  const b = await 读数据(f, 上级.位置, 上级.数据长度);

  // 当前目录项开始字节的位置
  let i = 0;
  // 循环解析每一个目录项
  while (i < b.length) {
    // 目录项长度
    const 长度 = b[i];
    // 单个目录项长度至少为 33 字节
    if (长度 > 33) {
      const 项 = 解析目录项(b.slice(i, i + 长度), true);
      // 递归遍历
      await 遍历目录(f, 项, 路径 + "/" + 项.文件名);
    } else if (0 == 长度) {
      // 当前目录解析完毕
      return;
    } else {
      // TODO
      console.log("长度 = " + 长度);
    }
    // 读取下一个目录项
    i += 长度;
  }
}
```

为了防止 **死循环**, 需要特别注意递归的结束条件:
如果遇到下级目录, 递归访问, 如果遇到普通文件, 结束.

此处需要特别注意两个大坑: `.` 和 `..` 文件
(也就是文件名是 1 个点, 2 个点的文件).
其中 `.` 文件表示当前目录 (目录自己), `..` 文件表示上级目录.

iso9660 的每个目录之中的前两个目录项, 就是 `.` 和 `..`
(并且文件名还不是直接表示的).
递归过程中, 需要特别注意, 跳过这两个文件.
否则就一直死循环出不来了 !

目录项在目录文件之中连续存放, 所以依次读取即可.
但是目录文件占用整个扇区 (也就是大小是 2KB 的整数倍),
在扇区的后面会有空闲空间, 遇到 0 就表示目录结束了.

### 3.3 文件在光盘上的存储位置

好了, 现在万事具备, 只欠开始递归:

```ts
export async function 解析iso(文件名: string) {
  // 省略

  if (null != 根目录) {
    // 消除根目录标记
    根目录._ = false;

    console.log("");
    // 从根目录开始, 遍历目录树
    await 遍历目录(f, 根目录, "");
  }
}
```

运行上述代码, 窝们可以获得 (省略开头的部分结果, 见前面):

```sh
77 (2.0KB 2048) /
78 (2.0KB 2048) /EFI/
79 (2.0KB 2048) /EFI/BOOT/
487360 (108.5KB 111104) /EFI/BOOT/BOOTIA32.EFI
487415 (102.0KB 104448) /EFI/BOOT/BOOTx64.EFI
80 (2.0KB 2048) /arch/
81 (2.0KB 2048) /arch/boot/
82 (2.0KB 2048) /arch/boot/x86_64/
134 (141.3MB 148176712) /arch/boot/x86_64/initramfs-linux.img
72486 (12.6MB 13238784) /arch/boot/x86_64/vmlinuz-linux
78951 (1.0KB 1024) /arch/grubenv
78952 (7.8KB 7964) /arch/pkglist.x86_64.txt
78956 (11B 11) /arch/version
83 (2.0KB 2048) /arch/x86_64/
78957 (795.7MB 834379776) /arch/x86_64/airootfs.sfs
486370 (698B 698) /arch/x86_64/airootfs.sfs.cms.sig
486369 (143B 143) /arch/x86_64/airootfs.sha512
84 (2.0KB 2048) /boot/
113 (0B 0) /boot/2024-07-01-18-09-00-00.uuid
85 (2.0KB 2048) /boot/grub/
486371 (1.0KB 1024) /boot/grub/grubenv
486372 (2.7KB 2788) /boot/grub/loopback.cfg
86 (2.0KB 2048) /boot/memtest86+/
486374 (16.9KB 17337) /boot/memtest86+/LICENSE
486383 (144.3KB 147744) /boot/memtest86+/memtest
486456 (145.5KB 148992) /boot/memtest86+/memtest.efi
87 (6.0KB 6144) /boot/syslinux/
486529 (817B 817) /boot/syslinux/archiso_head.cfg
486531 (1.1KB 1171) /boot/syslinux/archiso_pxe-linux.cfg
486530 (82B 82) /boot/syslinux/archiso_pxe.cfg
486533 (803B 803) /boot/syslinux/archiso_sys-linux.cfg
486532 (110B 110) /boot/syslinux/archiso_sys.cfg
486534 (748B 748) /boot/syslinux/archiso_tail.cfg
114 (2.0KB 2048) /boot/syslinux/boot.cat
486535 (1.8KB 1840) /boot/syslinux/cat.c32
486536 (24.6KB 25164) /boot/syslinux/chain.c32
486549 (1.4KB 1480) /boot/syslinux/cmd.c32
486550 (3.8KB 3900) /boot/syslinux/cmenu.c32
486552 (1.7KB 1720) /boot/syslinux/config.c32
486553 (4.4KB 4504) /boot/syslinux/cptime.c32
486556 (4.6KB 4732) /boot/syslinux/cpu.c32
486559 (2.0KB 2000) /boot/syslinux/cpuid.c32
486560 (2.9KB 3000) /boot/syslinux/cpuidtest.c32
486562 (1.8KB 1816) /boot/syslinux/debug.c32
486563 (4.2KB 4304) /boot/syslinux/dhcp.c32
486566 (3.1KB 3188) /boot/syslinux/dir.c32
486568 (2.2KB 2248) /boot/syslinux/disk.c32
486570 (8.8KB 8992) /boot/syslinux/dmi.c32
486575 (12.3KB 12572) /boot/syslinux/dmitest.c32
486582 (3.4KB 3512) /boot/syslinux/elf.c32
486584 (2.9KB 2980) /boot/syslinux/ethersel.c32
486586 (10.2KB 10440) /boot/syslinux/gfxboot.c32
486592 (1.8KB 1828) /boot/syslinux/gpxecmd.c32
90 (2.0KB 2048) /boot/syslinux/hdt/
486593 (164.3KB 168196) /boot/syslinux/hdt/modalias.gz
486676 (325.6KB 333428) /boot/syslinux/hdt/pciids.gz
486839 (160.8KB 164660) /boot/syslinux/hdt.c32
486920 (3.8KB 3924) /boot/syslinux/hexdump.c32
486922 (2.0KB 2040) /boot/syslinux/host.c32
486923 (4.3KB 4356) /boot/syslinux/ifcpu.c32
486926 (2.0KB 2048) /boot/syslinux/ifcpu64.c32
486927 (4.4KB 4540) /boot/syslinux/ifmemdsk.c32
486930 (2.1KB 2156) /boot/syslinux/ifplop.c32
486932 (432B 432) /boot/syslinux/isohdpfx.bin
91 (2.0KB 2048) /loader/
92 (2.0KB 2048) /loader/entries/
487466 (220B 220) /loader/entries/01-archiso-x86_64-linux.conf
487467 (249B 249) /loader/entries/02-archiso-x86_64-speech-linux.conf
487468 (70B 70) /loader/entries/03-archiso-x86_64-memtest86+.conf
487469 (56B 56) /loader/loader.conf
487470 (919.0KB 941056) /shellia32.efi
487930 (1023.9KB 1048448) /shellx64.efi
```

看, 窝们获得了光盘中的文件列表, 以及每个文件在光盘上的存储位置 !

```sh
134 (141.3MB 148176712) /arch/boot/x86_64/initramfs-linux.img
```

比如这一行, 表示文件 `/arch/boot/x86_64/initramfs-linux.img` 位于
134 扇区, 长度 148176712 字节.

有了这个表, 窝们就可以把劳什子 iso9660 给扔掉了,
直接指定偏移 (扇区编号) 和长度 (字节), 就可以读取对应的文件啦 !!
撒花 ~

为了方便查找, 还可以把上述文件列表, 按照在光盘上的开始位置 (扇区编号) 排序:

```sh
> sort -k 1 -g 2.txt
77 (2.0KB 2048) /
78 (2.0KB 2048) /EFI/
79 (2.0KB 2048) /EFI/BOOT/
80 (2.0KB 2048) /arch/
81 (2.0KB 2048) /arch/boot/
82 (2.0KB 2048) /arch/boot/x86_64/
83 (2.0KB 2048) /arch/x86_64/
84 (2.0KB 2048) /boot/
85 (2.0KB 2048) /boot/grub/
86 (2.0KB 2048) /boot/memtest86+/
87 (6.0KB 6144) /boot/syslinux/
90 (2.0KB 2048) /boot/syslinux/hdt/
91 (2.0KB 2048) /loader/
92 (2.0KB 2048) /loader/entries/
113 (0B 0) /boot/2024-07-01-18-09-00-00.uuid
114 (2.0KB 2048) /boot/syslinux/boot.cat
134 (141.3MB 148176712) /arch/boot/x86_64/initramfs-linux.img
72486 (12.6MB 13238784) /arch/boot/x86_64/vmlinuz-linux
78951 (1.0KB 1024) /arch/grubenv
78952 (7.8KB 7964) /arch/pkglist.x86_64.txt
78956 (11B 11) /arch/version
78957 (795.7MB 834379776) /arch/x86_64/airootfs.sfs
486369 (143B 143) /arch/x86_64/airootfs.sha512
486370 (698B 698) /arch/x86_64/airootfs.sfs.cms.sig
486371 (1.0KB 1024) /boot/grub/grubenv
486372 (2.7KB 2788) /boot/grub/loopback.cfg
486374 (16.9KB 17337) /boot/memtest86+/LICENSE
486383 (144.3KB 147744) /boot/memtest86+/memtest
486456 (145.5KB 148992) /boot/memtest86+/memtest.efi
486529 (817B 817) /boot/syslinux/archiso_head.cfg
486530 (82B 82) /boot/syslinux/archiso_pxe.cfg
486531 (1.1KB 1171) /boot/syslinux/archiso_pxe-linux.cfg
486532 (110B 110) /boot/syslinux/archiso_sys.cfg
486533 (803B 803) /boot/syslinux/archiso_sys-linux.cfg
486534 (748B 748) /boot/syslinux/archiso_tail.cfg
486535 (1.8KB 1840) /boot/syslinux/cat.c32
486536 (24.6KB 25164) /boot/syslinux/chain.c32
486549 (1.4KB 1480) /boot/syslinux/cmd.c32
486550 (3.8KB 3900) /boot/syslinux/cmenu.c32
486552 (1.7KB 1720) /boot/syslinux/config.c32
486553 (4.4KB 4504) /boot/syslinux/cptime.c32
486556 (4.6KB 4732) /boot/syslinux/cpu.c32
486559 (2.0KB 2000) /boot/syslinux/cpuid.c32
486560 (2.9KB 3000) /boot/syslinux/cpuidtest.c32
486562 (1.8KB 1816) /boot/syslinux/debug.c32
486563 (4.2KB 4304) /boot/syslinux/dhcp.c32
486566 (3.1KB 3188) /boot/syslinux/dir.c32
486568 (2.2KB 2248) /boot/syslinux/disk.c32
486570 (8.8KB 8992) /boot/syslinux/dmi.c32
486575 (12.3KB 12572) /boot/syslinux/dmitest.c32
486582 (3.4KB 3512) /boot/syslinux/elf.c32
486584 (2.9KB 2980) /boot/syslinux/ethersel.c32
486586 (10.2KB 10440) /boot/syslinux/gfxboot.c32
486592 (1.8KB 1828) /boot/syslinux/gpxecmd.c32
486593 (164.3KB 168196) /boot/syslinux/hdt/modalias.gz
486676 (325.6KB 333428) /boot/syslinux/hdt/pciids.gz
486839 (160.8KB 164660) /boot/syslinux/hdt.c32
486920 (3.8KB 3924) /boot/syslinux/hexdump.c32
486922 (2.0KB 2040) /boot/syslinux/host.c32
486923 (4.3KB 4356) /boot/syslinux/ifcpu.c32
486926 (2.0KB 2048) /boot/syslinux/ifcpu64.c32
486927 (4.4KB 4540) /boot/syslinux/ifmemdsk.c32
486930 (2.1KB 2156) /boot/syslinux/ifplop.c32
486932 (432B 432) /boot/syslinux/isohdpfx.bin
487360 (108.5KB 111104) /EFI/BOOT/BOOTIA32.EFI
487415 (102.0KB 104448) /EFI/BOOT/BOOTx64.EFI
487466 (220B 220) /loader/entries/01-archiso-x86_64-linux.conf
487467 (249B 249) /loader/entries/02-archiso-x86_64-speech-linux.conf
487468 (70B 70) /loader/entries/03-archiso-x86_64-memtest86+.conf
487469 (56B 56) /loader/loader.conf
487470 (919.0KB 941056) /shellia32.efi
487930 (1023.9KB 1048448) /shellx64.efi
```


## 4 tar 文件格式

iso9660 的格式已经很简单了, 但是在此顺便说一下,
一种格式更简单的文件打包格式 **tar**.

传说中, tar 是上古时期 UNIX 最初用于磁带存储的格式.

tar 的数据块大小为 **512 字节**, 也就是按照 512 字节对齐.
每个文件 (普通文件或者目录) 有一个 512 字节的头部,
含有文件名, 文件类型, 文件长度等信息.
然后, 如果文件大小不是 0 字节,
就会有 1 个或多个数据块存储文件数据, 连续存储.

完毕. tar 格式就是这么简单 !!

----

tar 可以把一堆文件打包存储成一个文件, 目前仍然广泛使用.
tar 的格式有 USTAR (UNIX 标准 tar) 和 PAX (一种更新的格式).

从上面可以看到, iso9660 对文件名和文件大小有比较严格的限制.
所以如果用光盘存储很多文件, 首先使用 tar 进行打包是个好方法.
光盘的一个扇区大小 2KB,
所以 iso9660 之中的一个文件或目录至少占用 2KB 存储空间.
而在 tar 之中, 一个目录占用 512 字节, 一个小文件至少占用 1KB,
如果文件很多的话, 就可以减少一点空间浪费.

另外, tar 的文件名 (512 字节头部) 等元数据,
就存储在文件数据的前面, 紧挨着文件数据.
而 iso9660 的目录 (文件名) 集中存储在光盘内圈.
如果光盘内圈损坏, iso9660 会丢失所有的文件名数据,
也就无法区分和定位哪个文件在哪里.
但是如果使用 tar, 光盘外圈仍然可以找到 tar 头部,
不会丢失文件名等数据.

也就是说, tar 格式的抗损坏能力比 iso9660 更强.


## 5 总结与展望

越简单的系统, 越可靠, 越不容易出问题.
iso9660 之中的文件在光盘上连续存储, 以扇区 (2KB) 对齐,
格式很简单. 只需要解析 卷描述符, 目录项 这两种简单的数据结构,
即可定位并读取文件.
代码只需要不到 200 行, 并且仍然有很大的简化空间.

光盘的价格较低, 只读, 读写分离, 具有很强的耐摔, 防水能力,
用来备份数据的优势很明显.
如果光盘部分损坏, 进行数据恢复可能是难度最低, 最不贵的.
相比之下, 硬盘的开盘数据恢复, 以及 SSD (闪存) 的数据恢复, 都很贵.

如果提前保存了光盘的文件列表 (文件名, 扇区编号, 长度),
那么即使光盘的内圈损坏 (目录数据丢失), 仍然能够读取没损坏的部分.

TODO 图


## 附录 1 完整源代码

使用 `deno` 运行环境: <https://deno.com/>

+ `pmbb/src/bb/iso/parse.ts`:

```ts
// 解析 iso9660 文件列表.
//
// 参考资料: <https://wiki.osdev.org/ISO_9660>

import { 显示大小 } from "../size.ts";

// 光盘扇区大小
export const 扇区 = 2048;

// 读取文件的一部分数据
async function 读文件(
  f: Deno.FsFile,
  偏移: number,
  长度: number,
): Promise<[Uint8Array, number | null]> {
  await f.seek(偏移, Deno.SeekMode.Start);
  const b = new Uint8Array(长度);
  return [b, await f.read(b)];
}

// 读取一个光盘扇区
//
// 编号: 扇区编号
async function 读扇区(f: Deno.FsFile, 编号: number): Promise<Uint8Array> {
  const r = await 读文件(f, 编号 * 扇区, 扇区);
  // TODO 检查读取失败
  return r[0];
}

// 读取从某个扇区开始的数据
async function 读数据(
  f: Deno.FsFile,
  编号: number,
  长度: number,
): Promise<Uint8Array> {
  const r = await 读文件(f, 编号 * 扇区, 长度);
  // TODO 检查读取失败
  return r[0];
}

// 读取数据块的指定字节, 转换为文本
function 读文本(数据: Uint8Array, 偏移: number, 长度: number): string {
  const b = 数据.slice(偏移, 偏移 + 长度);
  const d = new TextDecoder();
  return d.decode(b);
}

// Joliet: UCS-2
function 读文本2(数据: Uint8Array, 偏移: number, 长度: number): string {
  const b = 数据.slice(偏移, 偏移 + 长度);
  const d = new TextDecoder("utf-16be");
  return d.decode(b);
}

function 读文本_2(
  数据: Uint8Array,
  偏移: number,
  长度: number,
  joliet: boolean = false,
): string {
  return joliet ? 读文本2(数据, 偏移, 长度) : 读文本(数据, 偏移, 长度);
}

export const 文件标志_目录 = 2;

// Directory entry, directory record
export interface 目录项 {
  // Length of Directory Record
  长度: number;
  // Extended Attribute Record length
  扩展属性长度: number;
  // Location of extent (LBA)
  位置: number;
  // Data length (size of extent)
  数据长度: number;

  // File flags
  文件标志: number;
  _目录: boolean;

  // File unit size for files recorded in interleaved mode
  交错模式文件单元大小: number;
  // Interleave gap size for files recorded in interleaved mode
  交错模式文件间隔大小: number;

  // Volume sequence number
  卷序号: number;
  // Length of file identifier (file name)
  文件名长度: number;
  // File identifier
  文件名: string;
  // 原始文件名
  _文件名?: Uint8Array;
  // 标记 . 和 .. 目录
  _?: boolean;
}

function 解析目录项(b: Uint8Array, joliet: boolean = false): 目录项 {
  const v = new DataView(b.buffer);
  const 文件标志 = b[25];
  const 文件名长度 = b[32];
  const 文件名 = 读文本_2(b, 33, 文件名长度, joliet);
  const _文件名 = b.slice(33, 33 + 文件名长度);

  return {
    长度: b[0],
    扩展属性长度: b[1],
    位置: v.getUint32(2, true),
    数据长度: v.getUint32(10, true),

    文件标志,
    _目录: (文件标志 & 文件标志_目录) != 0,

    交错模式文件单元大小: b[26],
    交错模式文件间隔大小: b[27],
    卷序号: v.getUint16(28, true),
    文件名长度,
    文件名,
    _文件名,
    // 检查 . 和 .. 目录
    _: (1 == 文件名长度) && ((0 == _文件名[0]) || (1 == _文件名[0])),
  };
}

// Primary Volume Descriptor
export interface 主卷描述符 {
  // System Identifier
  系统标识: string;
  // Volume Identifier
  卷标: string;
  // Volume Space Size
  卷空间块: number;
  // Volume Set Size
  逻辑卷集大小: number;
  // Volume Sequence Number
  逻辑卷集序号: number;
  // Logical Block Size
  逻辑块大小: number;

  // Directory entry for the root directory
  根目录: 目录项;
}

// Boot Record
export interface 启动记录 {
  // Boot System Identifier
  启动系统标识: string;
  // Boot Identifier
  启动标识: string;
}

// Volume Descriptor
export interface 卷描述符 {
  // Type
  类型: number;
  // Identifier
  标识: string;
  // Version
  版本: number;

  主?: 主卷描述符;
  启动?: 启动记录;
}

// 卷描述符类型代码 Volume Descriptor Type Codes
// Boot Record
export const 卷描述符类型_启动记录 = 0;
// Primary Volume Descriptor
export const 卷描述符类型_主卷描述符 = 1;
// Supplementary Volume Descriptor
export const 卷描述符类型_次卷描述符 = 2;
// Volume Partition Descriptor
export const 卷描述符类型_卷分区描述符 = 3;
// Volume Descriptor Set Terminator
export const 卷描述符类型_结束 = 255;

// 解析 Volume Descriptor
function 解析卷描述符(b: Uint8Array): 卷描述符 {
  const v = new DataView(b.buffer);
  const o: 卷描述符 = {
    类型: b[0],
    标识: 读文本(b, 1, 5),
    版本: b[6],
  };
  const joliet = 卷描述符类型_次卷描述符 == o.类型;

  switch (o.类型) {
    case 卷描述符类型_主卷描述符:
    case 卷描述符类型_次卷描述符:
      {
        o.主 = {
          系统标识: 读文本_2(b, 8, 32, joliet),
          卷标: 读文本_2(b, 40, 32, joliet),
          卷空间块: v.getUint32(80, true),
          逻辑卷集大小: v.getUint16(120, true),
          逻辑卷集序号: v.getUint16(124, true),
          逻辑块大小: v.getUint16(128, true),

          根目录: 解析目录项(b.slice(156, 156 + 34), joliet),
        };
      }
      break;
    case 卷描述符类型_启动记录:
      o.启动 = {
        启动系统标识: 读文本(b, 7, 32),
        启动标识: 读文本(b, 39, 32),
      };
      break;
  }
  return o;
}

// 递归遍历目录
async function 遍历目录(f: Deno.FsFile, 上级: 目录项, 路径: string) {
  // 防止死循环: 跳过 . 和 .. 目录
  if (上级._) {
    return;
  }
  const p = 路径 + (上级._目录 ? "/" : "");
  // 输出扇区编号 (数据长度) 和路径
  const 大小 = "(" + 显示大小(上级.数据长度) + " " + 上级.数据长度 + ")";
  console.log(上级.位置, 大小, p);
  // 如果不是目录, 结束递归
  if (!上级._目录) {
    return;
  }
  //console.log(上级);

  // 读取目录文件
  const b = await 读数据(f, 上级.位置, 上级.数据长度);

  // 当前目录项开始字节的位置
  let i = 0;
  // 循环解析每一个目录项
  while (i < b.length) {
    // 目录项长度
    const 长度 = b[i];
    // 单个目录项长度至少为 33 字节
    if (长度 > 33) {
      const 项 = 解析目录项(b.slice(i, i + 长度), true);
      // 递归遍历
      await 遍历目录(f, 项, 路径 + "/" + 项.文件名);
    } else if (0 == 长度) {
      // 当前目录解析完毕
      return;
    } else {
      // TODO
      console.log("长度 = " + 长度);
    }
    // 读取下一个目录项
    i += 长度;
  }
}

// 输入: 光盘镜像文件 (iso)
export async function 解析iso(文件名: string) {
  // 打开光盘镜像文件
  const f = await Deno.open(文件名);

  // 解析卷描述符, 从 16 扇区开始
  let vdi = 16;
  let vd继续 = true;
  // 保存根目录
  let 根目录: 目录项 | undefined;

  while (vd继续) {
    const 扇区 = await 读扇区(f, vdi);
    const vd = 解析卷描述符(扇区);
    // debug
    console.log(vdi, vd);

    if (卷描述符类型_结束 == vd.类型) {
      vd继续 = false;
    } else if (卷描述符类型_次卷描述符 == vd.类型) {
      根目录 = vd.主!.根目录;
    }
    // 继续读取下一个卷描述符
    vdi += 1;
  }

  if (null != 根目录) {
    // 消除根目录标记
    根目录._ = false;

    console.log("");
    // 从根目录开始, 遍历目录树
    await 遍历目录(f, 根目录, "");
  }
}
```

----

本文使用 CC-BY-SA 4.0 许可发布.
