# 从 Unicode 标准提取拼音数据

对于一个拼音输入法来说, 最重要也最基础的数据,
就是拼音和汉字的对应关系, 或者说拼音和汉字的对照表.

获取拼音数据有多种方法, 本文介绍其中的一种:
从 Unicode 标准 (Unihan 数据库) 获取拼音数据.


## 目录

+ 1 Unihan 数据库

+ 2 读取拼音数据

+ 3 处理拼音数据

+ 4 测试

+ 5 总结与展望

+ 附录 1 完整代码


## 1 Unihan 数据库

<https://home.unicode.org/>

Unicode 是一种编码方式 (encoding, 比如 `utf-8`),
也是一种字符集 (charset).
Unicode 的目标是收集地球上所有语言使用的字符.

Unihan 数据库是一个关于汉字的数据库, 收录了几万个汉字,
包含多种数据.

<https://www.unicode.org/charts/unihan.html>

此处我们只关心拼音数据, 先把这个数据库下载下来:

```sh
wget "https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip"
```

然后解压:

```sh
unzip Unihan.zip
```

解压后可以看到几个文件:

```
> ls
Unihan_DictionaryIndices.txt   Unihan_OtherMappings.txt
Unihan_DictionaryLikeData.txt  Unihan_RadicalStrokeCounts.txt
Unihan_IRGSources.txt          Unihan_Readings.txt
Unihan_NumericValues.txt       Unihan_Variants.txt
```

其中 `Unihan_Readings.txt` 就包含了汉字的读音 (拼音) 数据.


## 2 读取拼音数据

打开 `Unihan_Readings.txt` 文件 (这个文件有点大, 有 265481 行), 可以看到:

```
#
# Unihan_Readings.txt
# Date: 2023-07-15 00:00:00 GMT [KL]
# Unicode version: 15.1.0
#
# Unicode Character Database
# © 2023 Unicode®, Inc.
# Unicode and the Unicode Logo are registered trademarks of Unicode, Inc. in the U.S. and other countries.
# For terms of use, see http://www.unicode.org/terms_of_use.html
# For documentation, see http://www.unicode.org/reports/tr38/
#
# This file contains data on the following fields from the Unihan database:
#	kCantonese
#	kDefinition
#	kHangul
#	kHanyuPinlu
#	kHanyuPinyin
#	kJapanese
#	kJapaneseKun
#	kJapaneseOn
#	kKorean
#	kMandarin
#	kSMSZD2003Readings
#	kTang
#	kTGHZ2013
#	kVietnamese
#	kXHC1983
#
# For details on the file format, see http://www.unicode.org/reports/tr38/
#
U+3400	kCantonese	jau1
U+3400	kDefinition	(same as U+4E18 丘) hillock or mound
U+3400	kJapanese	キュウ おか
U+3400	kMandarin	qiū
U+3401	kDefinition	to lick; to taste, a mat, bamboo bark
U+3401	kHanyuPinyin	10019.020:tiàn
U+3401	kJapanese	テン
U+3401	kMandarin	tiàn
U+3402	kDefinition	(J) non-standard form of U+559C 喜, to like, love, enjoy; a joyful thing
U+3402	kJapanese	キ よろこぶ
U+3403	kCantonese	zim1
U+3404	kCantonese	kwaa1
U+3404	kJapanese	カ ケ
U+3404	kMandarin	kuà
U+3405	kCantonese	ng5
U+3405	kDefinition	(an ancient form of U+4E94 五) five
U+3405	kJapanese	ゴ
U+3405	kMandarin	wǔ
```

以 `#` 开头的行是注释.
其中 `kMandarin` 表示汉语拼音 (普通话), 比如:

```
U+3400	kMandarin	qiū
```

这一行有 3 列, 之间以制表符 (tab) 分隔.
其中 `U+3400` 是字符编码, `qiū` 是拼音.

----

弄清楚文件格式之后, 就可以写代码 (python) 来读取拼音数据了:

```py
# 读取 Unihan_Readings.txt
def 读取数据(文件名):
    print(文件名)

    文本 = 读文件(文件名)
    o = []
    for i in 文本.split("\n"):
        # 忽略注释
        if i.startswith("#"):
            continue
        # 忽略空行
        if len(i.strip()) < 1:
            continue

        # 处理 kMandarin
        p = i.split("	")  # 分隔符: 制表符 (tab)
        # 汉语拼音 (普通话)
        if p[1] == "kMandarin":
            汉字 = chr(int(p[0][2:], 16))
            o.append([汉字, p[2]])
    return o
```

读取整个文件, 依次处理每一行.
忽略注释和空行, 然后只关心 `kMandarin` 所在的行.
将 `U+` 的格式转换成对应的字符.


## 3 处理拼音数据

上面获得的拼音是带有声调的, 比如 `qióng`.
一般拼音输入法是不带声调的, 因此要进行转换处理.

```py
# 统计拼音中出现的字符
def 统计拼音(数据):
    o = {}
    for i in 数据:
        for c in i[1]:
            if (ord(c) > ord("z")) or (ord(c) < ord("a")):
                o[c] = 1
    字符 = list(o.keys())
    字符.sort()

    print(字符)
```

我们先来看看拼音中有哪些字符.
上面这段代码找出拼音中除 `a` ~ `z` 之外的所有字符.

```py
def main():
    # 获取命令行参数
    输入 = sys.argv[1]
    输出 = sys.argv[2] if len(sys.argv) > 2 else None

    数据 = 读取数据(输入)

    if 输出 != None:
        结果 = 处理拼音(数据)
        写文件(输出, 结果)
    else:
        统计拼音(数据)

if __name__ == "__main__":
    main()
```

主函数这么写, 然后运行一下:

```
> python unihan_readings.py Unihan_Readings.txt
Unihan_Readings.txt
[' ', 'à', 'á', 'è', 'é', 'ì', 'í', 'ò', 'ó', 'ù', 'ú', 'ü', 'ā', 'ē', 'ě', 'ī', 'ń', 'ň', 'ō', 'ū', 'ǎ', 'ǐ', 'ǒ', 'ǔ', 'ǘ', 'ǚ', 'ǜ', 'ǹ', 'ḿ']
```

我们就得到了所有需要特殊处理的字符, 写一个对照表:

```py
# 拼音字符对照表 (声调)
拼音表 = {
    "ā": ("a", 1),
    "á": ("a", 2),
    "ǎ": ("a", 3),
    "à": ("a", 4),

    "ē": ("e", 1),
    "é": ("e", 2),
    "ě": ("e", 3),
    "è": ("e", 4),

    "ī": ("i", 1),
    "í": ("i", 2),
    "ǐ": ("i", 3),
    "ì": ("i", 4),

    "ō": ("o", 1),
    "ó": ("o", 2),
    "ǒ": ("o", 3),
    "ò": ("o", 4),

    "ū": ("u", 1),
    "ú": ("u", 2),
    "ǔ": ("u", 3),
    "ù": ("u", 4),

    "ü": ("v", 0),
    "ǘ": ("v", 2),
    "ǚ": ("v", 3),
    "ǜ": ("v", 4),

    "ń": ("n", 2),
    "ň": ("n", 3),
    "ǹ": ("n", 4),

    "ḿ": ("m", 2),
}
```

然后就可以对单个拼音进行处理:

```py
# 对拼音的每个字符进行处理
def 处理单个拼音(文本):
    声调 = 0
    o = ""

    for c in 文本:
        if ord(c) > ord("z"):
            数据 = 拼音表[c]
            声调 = 数据[1]
            o += 数据[0]
        else:
            o += c
    # 标注声调
    if 声调 > 0:
        o += str(声调)
    return o
```

检查拼音中的每个字符, 如果是特殊字符, 就按照上表转换处理.

```py
# 对原始拼音数据进行处理
def 处理拼音(数据):
    o = {}
    # 集中每个汉字的所有拼音
    for i in 数据:
        # 多音字
        拼音列表 = i[1].split(" ")
        for j in 拼音列表:
            拼音 = 处理单个拼音(j)
            汉字 = i[0]
            if o.get(汉字) == None:
                o[汉字] = [拼音]
            else:
                o[汉字].append(拼音)
    # 转换输出数据格式
    输出 = []
    列表 = list(o.keys())
    列表.sort()
    for i in 列表:
        行 = [i] + o[i]
        # DEBUG
        if len(o[i]) > 1:
            print(行)

        输出.append((" ").join(行))
    return ("\n").join(输出) + "\n"
```

对所有拼音进行处理, 然后保存结果.


## 4 测试

```
> python unihan_readings.py unihan/Unihan_Readings.txt pinyin.txt
unihan/Unihan_Readings.txt
['㪅', 'geng4', 'geng1']
['万', 'wan4', 'mo4']
['乾', 'qian2', 'gan1']
['俾', 'bi3', 'bi4']
['剋', 'kei1', 'ke4']
['剖', 'pou1', 'po3']
['剽', 'piao1', 'piao4']
['卜', 'bo', 'bu3']
['叚', 'xia2', 'jia3']
['嘸', 'fu3', 'wu3']
['噠', 'da1', 'da2']
['地', 'de', 'di4']
['堤', 'di1', 'ti2']
['差', 'cha4', 'cha1']
['帆', 'fan1', 'fan2']
['徵', 'zhi3', 'zheng1']
['擘', 'bai1', 'bo4']
['斗', 'dou4', 'dou3']
['杓', 'biao1', 'shao2']
['柏', 'bai3', 'bo2']
['氾', 'fan2', 'fan4']
['沈', 'shen3', 'chen2']
['沓', 'da2', 'ta4']
['甸', 'dian1', 'dian4']
['瞭', 'liao4', 'liao3']
['筽', 'ou1', 'wu2']
['繃', 'beng3', 'beng1']
['耙', 'ba4', 'pa2']
['舍', 'she3', 'she4']
['薄', 'bao2', 'bo2']
['袷', 'qia1', 'jia2']
['誰', 'shui2', 'shei2']
['諞', 'pian3', 'pian2']
['諷', 'feng3', 'feng4']
['識', 'shi2', 'shi4']
['讽', 'feng3', 'feng4']
['识', 'shi2', 'shi4']
['跌', 'die1', 'die2']
['蹣', 'pan2', 'man2']
['蹬', 'deng1', 'deng4']
['适', 'shi4', 'kuo4']
['都', 'dou1', 'du1']
['醱', 'fa1', 'po4']
['釐', 'xi1', 'li2']
['陂', 'bei1', 'pi2']
['隄', 'di1', 'ti2']
['隗', 'kui2', 'wei3']
['頗', 'po1', 'po3']
['髪', 'fa4', 'fa3']
['髮', 'fa4', 'fa3']
['麃', 'pao2', 'biao1']
['𪟝', 'ji4', 'ji1']
```

这里输出的是所有的多音字.

我们检查一下结果文件 `pinyin.txt`:

```
> wc -l pinyin.txt
41419 pinyin.txt
```

一共有 41419 个汉字.

```
> head pinyin.txt
㐀 qiu1
㐁 tian4
㐄 kua4
㐅 wu3
㐆 yin3
㐌 yi2
㐖 xie2
㐜 chou2
㐡 nuo4
㐤 dan1
```

结果的前几行看起来是正确的.

```
> cat pinyin.txt | grep "[穷人小水滴]"
人 ren2
小 xiao3
水 shui3
滴 di1
穷 qiong2
```

随机抽查, 发现都获取了拼音.

![随机抽查](../图/20240213-13/t-1.jpg)


## 5 总结与展望

Unihan 是 Unicode 标准中的数据库,
这些数据开源开放, 使用起来没有版权问题.
同时这个数据库的覆盖率较高, 收录了 4 万多个汉字的拼音.

但是这个数据的准确度和完整度是很值的怀疑的,
后续还需要手动修正.


## 附录 1 完整代码

+ `unihan_readings.py`

```py
#!/usr/bin/env python
# pmim-data/tool/unicode/unihan_readings.py
#
# > python --version
# Python 3.11.7
#
# 命令行格式 (举例):
# > python unihan_readings.py Unihan_Readings.txt pinyin.txt
import sys
import io

# 读取文本文件
def 读文件(文件名):
    with io.open(文件名, "r", encoding="utf-8") as f:
        return f.read()

# 写文本文件
def 写文件(文件名, 文本):
    with io.open(文件名, "w", encoding="utf-8") as f:
        f.write(文本)

# 读取 Unihan_Readings.txt
def 读取数据(文件名):
    print(文件名)

    文本 = 读文件(文件名)
    o = []
    for i in 文本.split("\n"):
        # 忽略注释
        if i.startswith("#"):
            continue
        # 忽略空行
        if len(i.strip()) < 1:
            continue

        # 处理 kMandarin
        p = i.split("	")  # 分隔符: 制表符 (tab)
        # 汉语拼音 (普通话)
        if p[1] == "kMandarin":
            汉字 = chr(int(p[0][2:], 16))
            o.append([汉字, p[2]])
    return o

# 统计拼音中出现的字符
def 统计拼音(数据):
    o = {}
    for i in 数据:
        for c in i[1]:
            if (ord(c) > ord("z")) or (ord(c) < ord("a")):
                o[c] = 1
    字符 = list(o.keys())
    字符.sort()

    print(字符)

# 拼音字符对照表 (声调)
拼音表 = {
    "ā": ("a", 1),
    "á": ("a", 2),
    "ǎ": ("a", 3),
    "à": ("a", 4),

    "ē": ("e", 1),
    "é": ("e", 2),
    "ě": ("e", 3),
    "è": ("e", 4),

    "ī": ("i", 1),
    "í": ("i", 2),
    "ǐ": ("i", 3),
    "ì": ("i", 4),

    "ō": ("o", 1),
    "ó": ("o", 2),
    "ǒ": ("o", 3),
    "ò": ("o", 4),

    "ū": ("u", 1),
    "ú": ("u", 2),
    "ǔ": ("u", 3),
    "ù": ("u", 4),

    "ü": ("v", 0),
    "ǘ": ("v", 2),
    "ǚ": ("v", 3),
    "ǜ": ("v", 4),

    "ń": ("n", 2),
    "ň": ("n", 3),
    "ǹ": ("n", 4),

    "ḿ": ("m", 2),
}

# 对拼音的每个字符进行处理
def 处理单个拼音(文本):
    声调 = 0
    o = ""

    for c in 文本:
        if ord(c) > ord("z"):
            数据 = 拼音表[c]
            声调 = 数据[1]
            o += 数据[0]
        else:
            o += c
    # 标注声调
    if 声调 > 0:
        o += str(声调)
    return o

# 对原始拼音数据进行处理
def 处理拼音(数据):
    o = {}
    # 集中每个汉字的所有拼音
    for i in 数据:
        # 多音字
        拼音列表 = i[1].split(" ")
        for j in 拼音列表:
            拼音 = 处理单个拼音(j)
            汉字 = i[0]
            if o.get(汉字) == None:
                o[汉字] = [拼音]
            else:
                o[汉字].append(拼音)
    # 转换输出数据格式
    输出 = []
    列表 = list(o.keys())
    列表.sort()
    for i in 列表:
        行 = [i] + o[i]
        # DEBUG
        if len(o[i]) > 1:
            print(行)

        输出.append((" ").join(行))
    return ("\n").join(输出) + "\n"

def main():
    # 获取命令行参数
    输入 = sys.argv[1]
    输出 = sys.argv[2] if len(sys.argv) > 2 else None

    数据 = 读取数据(输入)

    if 输出 != None:
        结果 = 处理拼音(数据)
        写文件(输出, 结果)
    else:
        统计拼音(数据)

if __name__ == "__main__":
    main()
```

----

本文使用 CC-BY-SA 4.0 许可发布.
