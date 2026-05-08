# 双拼 (自然码) 的简单实现

拼音输入法大致可以分为 2 种: **全拼** 和 **双拼**.
全拼很好理解, 就是输入完整的拼音, 比如 `qiong`.

但是, 这好像有点太长了啊 ?
输入一个拼音居然需要击键 5 次 !
如果对于同样的拼音, 可以只输入 `qs` 就好了,
只需要击键 2 次.
这就是双拼, 对于每一个拼音都只需要击键 2 次.

----

相关文章:

+ 《从 Unicode 标准提取拼音数据》

  TODO


## 目录

+ 1 双拼 (自然码) 简介

+ 2 实现双拼表

+ 3 验证双拼表

+ 4 总结与展望

+ 附录 1 完整代码

+ 附录 2 全拼表 (408 个)

+ 附录 3 双拼表 (自然码)


## 1 双拼 (自然码) 简介

我们先来复习一下小学知识:
一个汉语拼音一般由 2 部分组成, **声母** 和 **韵母**.
(普通话) 声母大约有 23 个, 韵母大约有 34 个.
一个键盘按键对应一个 声母 / 韵母 差不多是可行的.
双拼的一个拼音对应 2 个按键, 一般是第一个按键表示声母,
第二个按键表示韵母.

但是具体如何对应, 哪个按键对应哪个韵母, 就有不同的设计了.
所以存在很多种不同的双拼方案.
本文介绍的 **自然码** 只是其中一种.
这些不同的双拼方案之间在效果上并没有显著的区别,
选择一种自己喜欢的即可.

自然码是上个世纪就已经出现的古老方案.
窝选择自然码的主要理由是, 各平台对自然码的支持比较广泛,
基本上到哪里都是开箱即用, 比较方便.
同时窝觉得自然码的设计也比较合理.

----

由于存在很多种不同的双拼方案, 输入法不应该替用户做选择.
一种比较好的实现方式是, 把双拼做成一个 **双拼表**,
根据用户的输入, 查表得到对应的全拼:

```
用户输入双拼 --(双拼表)--> 全拼
```

这样只需要替换不同的双拼表, 即可支持不同的双拼方案.
理论上可以支持任意一种双拼方案.


## 2 实现双拼表

首先, 我们需要一个全拼表 (详见 附录 2), 就是列出所有全拼 (不带声调):

```
> head pinyin.txt
a
ai
an
ang
ao
ba
bai
ban
bang
bao
```

其中有几个比较有意思的拼音:

+ (1) `ng`

  ```
  > cat pinyin_kTGHZ2013.txt | grep " ng"
  嗯 ng2 ng3 ng4
  ```

  这是啥情况 ?
  怎么好像和小时候学的不太一样啊 .. . (曝露年龄系列)

  ```
  > cat pinyin_kTGHZ2013.txt | grep " en"
  恩 en1
  摁 en4
  蒽 en1
  ```

  又找到了点熟悉的感觉.

  此处的拼音数据来自于 `Unihan_Readings.txt`
  (详见 《从 Unicode 标准提取拼音数据》)
  `kTGHZ2013`.
  也就是 《通用规范汉字表》 (2013 年) 对应的数据.

+ (2) `hng`

  ```
  > cat pinyin_kTGHZ2013.txt | grep "hng"
  哼 heng1 hng
  ```

  这个特殊的拼音也是只用于一个汉字.

+ (3) `m`

  ```
  > cat pinyin_kTGHZ2013.txt | grep -e " m[0-9 ]" -e " m\$"
  呒 m2
  呣 m2 m
  ```

  这个之前也没见过.

----

```js
// 双拼规则
const 声母1 = [
  "b",
  "p",
  "m",
  "f",
  "d",
  "t",
  "n",
  "l",
  "g",
  "k",
  "h",
  "j",
  "q",
  "x",
  "r",
  "z",
  "c",
  "s",
  "y",
  "w",
];

const 声母2 = {
  "v": "zh",
  "i": "ch",
  "u": "sh",
};

const 韵母1 = ["a", "e", "i", "o", "u", "v"];

const 韵母2 = {
  "b": ["ou"],
  "c": ["iao"],
  "d": ["iang", "uang"],
  "f": ["en"],
  "g": ["eng", "ng"],
  "h": ["ang"],
  "j": ["an"],
  "k": ["ao"],
  "l": ["ai"],
  "m": ["ian"],
  "n": ["in"],
  "o": ["uo"],
  "p": ["un"],
  "q": ["iu"],
  "r": ["er", "uan"],
  "s": ["ong", "iong"],
  "t": ["ue", "ve"],
  "v": ["ui"],
  "w": ["ia", "ua"],
  "x": ["ie"],
  "y": ["ing", "uai"],
  "z": ["ei"],
};
```

首先定义双拼规则 (自然码), 也就是原始输入和声母, 韵母的对应关系.

```js
function 生成(全拼) {
  // 声母映射
  const 声母 = {};
  for (const i of 声母1) {
    声母[i] = i;
  }
  for (const i of Object.keys(声母2)) {
    声母[i] = 声母2[i];
  }

  // 韵母映射
  const 韵母 = {};
  for (const i of 韵母1) {
    韵母[i] = [i];
  }
  for (const i of Object.keys(韵母2)) {
    if (韵母[i] != null) {
      韵母[i] = [].concat(韵母[i]).concat(韵母2[i]);
    } else {
      韵母[i] = [].concat(韵母2[i]);
    }
  }

  // 全拼集合
  const p = {};
  for (const i of 全拼) {
    p[i] = 1;
  }
```

为了便于查找, 对这些数据进行一些转换.

```js
  // 组合每一种声母和韵母 (输入)
  for (const i of Object.keys(声母)) {
    for (const j of Object.keys(韵母)) {
      const 输入 = i + j;
      for (const k of 韵母[j]) {
        const 拼音 = 声母[i] + k;
        // 检查是否为有效的拼音
        if (p[拼音]) {
          结果(输入, 拼音);
        }
      }
    }
  }
```

对声母和韵母 (原始输入) 进行组合, 并转换成全拼.
然后查找组合出来的全拼是否在全拼表里, 否则就是无效拼音.
因为不是每一种声母和韵母的组合都有汉字使用.

```js
  // 零声母处理
  for (const i of 韵母1) {
    const 输入 = i + i;
    const 拼音 = i;
    if (p[拼音]) {
      结果(输入, 拼音);
    }
  }
```

零声母就是没有声母, 只有韵母的拼音, 比如 `a`, `o`, `e` 这种.
自然码的规则是, 输入两次, 比如 `aa` 表示 `a`.

```js
  // 如果全拼长度为 2, 保持原样
  for (const i of 全拼) {
    if (i.length == 2) {
      // 特殊拼音 `ng`
      if (i == "ng") {
        continue;
      }

      结果(i, i);
    }
  }
  // 特殊拼音
  结果("oh", "ang");
  结果("om", "m");
  结果("en", "ng");
```

这也是自然码的规则, 如果全拼只有 2 个字母, 那么双拼和全拼保持一致.
此处跳过特殊拼音 `ng`.

最后再补充几个特殊拼音, 比如输入 `oh` 表示 `ang`.


## 3 验证双拼表

上面生成的双拼表, 先别急着使用, 检查一下.

```js
function 验证(全拼, 双拼) {
  const o = {}; // 收集全拼
  for (const i of Object.keys(双拼)) {
    for (const j of 双拼[i]) {
      // 每一种输出都是有效的全拼
      if (全拼.indexOf(j) < 0) {
        throw new Error("无效的全拼 " + j);
      }
      o[j] = 1;
    }
  }
  // 双拼覆盖了所有的全拼
  const m = [];
  for (const i of 全拼) {
    if (!o[i]) {
      m.push(i);
    }
  }
  if (m.length > 0) {
    console.log(m);
    throw new Error("缺失 " + m.length + " 个全拼");
  }
}
```

这里主要验证两条规则:

+ **每一种输出都是有效的全拼**:
  就是防止出现无效的拼音.

+ **双拼覆盖了所有的全拼**:
  重点是这一条, 保证生成的双拼方案, 可以输入所有可能的拼音.

----

然后运行 (完整代码详见 附录 1):

```
> ./gen_2p_zirjma.js pinyin.txt > 2p_zirjma.json
pinyin.txt
重复: en -> en,ng
重复: hg -> heng,hng
重复: lo -> lo,luo
```

此处提示了 3 处重复, 也就是同一个输入对应多个拼音.
但窝觉得这是合理的:

+ `ng` 这个拼音只用于一个汉字 `嗯`:

  ```
  > cat pinyin_kTGHZ2013.txt | grep " ng"
  嗯 ng2 ng3 ng4
  ```

  但是根据输入习惯, `en` 可能更合理一些:

  ```
  > cat pinyin_kTGHZ2013.txt | grep " en"
  恩 en1
  摁 en4
  蒽 en1
  ```

+ `hng` 这个拼音也只用于一个汉字:

  ```
  > cat pinyin_kTGHZ2013.txt | grep "hng"
  哼 heng1 hng
  ```

+ `lo` 这个拼音也只用于一个汉字:

  ```
  > cat pinyin_kTGHZ2013.txt | grep " lo[0-9 ]"
  咯 ge1 ka3 lo luo4
  ```

----

查看生成的文件:

```sh
> head 2p_zirjma.json
{
  "aa": "a",
  "ai": "ai",
  "an": "an",
  "ao": "ao",
  "ba": "ba",
  "bc": "biao",
  "bf": "ben",
  "bg": "beng",
  "bh": "bang",
```

![检查结果](../图/20240215-14/3-t-1.jpg)

随机抽查:

```sh
> cat 2p_zirjma.json | grep -e '"zi"' -e '"rj"' -e '"ma"'
  "ma": "ma",
  "rj": "ran",
  "zi": "zi",
> cat 2p_zirjma.json | grep -e '"qs"' -e '"rf"' -e '"xc"' -e '"uv"' -e '"di"'
  "di": "di",
  "qs": "qiong",
  "rf": "ren",
  "uv": "shui",
  "xc": "xiao",
```

窝觉得自然码设计的挺好的, 双拼和全拼基本上是一一对应关系.
在此很佩服前人的智慧.

(完整的双拼表请见 附录 3)


## 4 总结与展望

本文根据全拼表和自然码的双拼规则, 生成了双拼表,
并对双拼表进行了检查.

有了双拼表之后, 拼音输入法只需要查表即可得到全拼.
并且只需要更换不同的双拼表, 即可支持不同的双拼方案.

本文使用的代码, 经过修改后应该也能用于别的双拼方案.


## 附录 1 完整代码

运行需要安装 `deno`: <https://deno.com/>

+ `gen_2p_zirjma.js`

```js
#!/usr/bin/env -S deno run --allow-read
// pmim-data/tool/gen_2p_zirjma.js
// 生成双拼表 (自然码)
//
// 命令行示例:
// > deno run --allow-read gen_2p_zirjma.js pinyin.txt

// 读取全拼表
async function 全拼表(文件名) {
  const 文本 = await Deno.readTextFile(文件名);
  return 文本.split("\n").map((x) => x.trim()).filter((x) => x.length > 0);
}

// 双拼规则
const 声母1 = [
  "b",
  "p",
  "m",
  "f",
  "d",
  "t",
  "n",
  "l",
  "g",
  "k",
  "h",
  "j",
  "q",
  "x",
  "r",
  "z",
  "c",
  "s",
  "y",
  "w",
];

const 声母2 = {
  "v": "zh",
  "i": "ch",
  "u": "sh",
};

const 韵母1 = ["a", "e", "i", "o", "u", "v"];

const 韵母2 = {
  "b": ["ou"],
  "c": ["iao"],
  "d": ["iang", "uang"],
  "f": ["en"],
  "g": ["eng", "ng"],
  "h": ["ang"],
  "j": ["an"],
  "k": ["ao"],
  "l": ["ai"],
  "m": ["ian"],
  "n": ["in"],
  "o": ["uo"],
  "p": ["un"],
  "q": ["iu"],
  "r": ["er", "uan"],
  "s": ["ong", "iong"],
  "t": ["ue", "ve"],
  "v": ["ui"],
  "w": ["ia", "ua"],
  "x": ["ie"],
  "y": ["ing", "uai"],
  "z": ["ei"],
};

function 生成(全拼) {
  // 声母映射
  const 声母 = {};
  for (const i of 声母1) {
    声母[i] = i;
  }
  for (const i of Object.keys(声母2)) {
    声母[i] = 声母2[i];
  }

  // 韵母映射
  const 韵母 = {};
  for (const i of 韵母1) {
    韵母[i] = [i];
  }
  for (const i of Object.keys(韵母2)) {
    if (韵母[i] != null) {
      韵母[i] = [].concat(韵母[i]).concat(韵母2[i]);
    } else {
      韵母[i] = [].concat(韵母2[i]);
    }
  }

  // 全拼集合
  const p = {};
  for (const i of 全拼) {
    p[i] = 1;
  }

  const o = {};
  function 结果(输入, 拼音) {
    if (o[输入] != null) {
      o[输入].push(拼音);
    } else {
      o[输入] = [拼音];
    }
  }
  // 组合每一种声母和韵母 (输入)
  for (const i of Object.keys(声母)) {
    for (const j of Object.keys(韵母)) {
      const 输入 = i + j;
      for (const k of 韵母[j]) {
        const 拼音 = 声母[i] + k;
        // 检查是否为有效的拼音
        if (p[拼音]) {
          结果(输入, 拼音);
        }
      }
    }
  }

  // 零声母处理
  for (const i of 韵母1) {
    const 输入 = i + i;
    const 拼音 = i;
    if (p[拼音]) {
      结果(输入, 拼音);
    }
  }
  // 如果全拼长度为 2, 保持原样
  for (const i of 全拼) {
    if (i.length == 2) {
      // 特殊拼音 `ng`
      if (i == "ng") {
        continue;
      }

      结果(i, i);
    }
  }
  // 特殊拼音
  结果("oh", "ang");
  结果("om", "m");
  结果("en", "ng");

  for (const i of Object.keys(o)) {
    // 去重
    o[i] = Array.from(new Set(o[i]));
    // 排序
    o[i].sort();
  }
  // 键排序
  const a = {};
  const k = Object.keys(o);
  k.sort();
  for (const i of k) {
    a[i] = o[i];
  }
  return a;
}

function 验证(全拼, 双拼) {
  const o = {}; // 收集全拼
  for (const i of Object.keys(双拼)) {
    for (const j of 双拼[i]) {
      // 每一种输出都是有效的全拼
      if (全拼.indexOf(j) < 0) {
        throw new Error("无效的全拼 " + j);
      }
      o[j] = 1;
    }
  }
  // 双拼覆盖了所有的全拼
  const m = [];
  for (const i of 全拼) {
    if (!o[i]) {
      m.push(i);
    }
  }
  if (m.length > 0) {
    console.log(m);
    throw new Error("缺失 " + m.length + " 个全拼");
  }
}

async function main() {
  const 全拼表文件 = Deno.args[0];
  console.error(全拼表文件);

  const 全拼 = await 全拼表(全拼表文件);
  const 结果 = 生成(全拼);
  验证(全拼, 结果);

  // 清理
  for (const i of Object.keys(结果)) {
    if (结果[i].length == 1) {
      结果[i] = 结果[i][0];
    } else {
      // 提示
      console.error("重复: " + i + " -> " + 结果[i]);
    }
  }

  console.log(JSON.stringify(结果, "", "  "));
}

if (import.meta.main) main();
```


## 附录 2 全拼表 (408 个)

数据来源: `Unihan_Readings.txt`
(详见 《从 Unicode 标准提取拼音数据》)

不带声调.

```
a
ai
an
ang
ao
ba
bai
ban
bang
bao
bei
ben
beng
bi
bian
biao
bie
bin
bing
bo
bu
ca
cai
can
cang
cao
ce
cen
ceng
cha
chai
chan
chang
chao
che
chen
cheng
chi
chong
chou
chu
chuai
chuan
chuang
chui
chun
chuo
ci
cong
cou
cu
cuan
cui
cun
cuo
da
dai
dan
dang
dao
de
dei
den
deng
di
dia
dian
diao
die
ding
diu
dong
dou
du
duan
dui
dun
duo
e
en
er
fa
fan
fang
fei
fen
feng
fo
fou
fu
ga
gai
gan
gang
gao
ge
gei
gen
geng
gong
gou
gu
gua
guai
guan
guang
gui
gun
guo
ha
hai
han
hang
hao
he
hei
hen
heng
hng
hong
hou
hu
hua
huai
huan
huang
hui
hun
huo
ji
jia
jian
jiang
jiao
jie
jin
jing
jiong
jiu
ju
juan
jue
jun
ka
kai
kan
kang
kao
ke
kei
ken
keng
kong
kou
ku
kua
kuai
kuan
kuang
kui
kun
kuo
la
lai
lan
lang
lao
le
lei
leng
li
lia
lian
liang
liao
lie
lin
ling
liu
lo
long
lou
lu
luan
lun
luo
lv
lve
m
ma
mai
man
mang
mao
me
mei
men
meng
mi
mian
miao
mie
min
ming
miu
mo
mou
mu
na
nai
nan
nang
nao
ne
nei
nen
neng
ng
ni
nian
niang
niao
nie
nin
ning
niu
nong
nou
nu
nuan
nuo
nv
nve
o
ou
pa
pai
pan
pang
pao
pei
pen
peng
pi
pian
piao
pie
pin
ping
po
pou
pu
qi
qia
qian
qiang
qiao
qie
qin
qing
qiong
qiu
qu
quan
que
qun
ran
rang
rao
re
ren
reng
ri
rong
rou
ru
ruan
rui
run
ruo
sa
sai
san
sang
sao
se
sen
seng
sha
shai
shan
shang
shao
she
shei
shen
sheng
shi
shou
shu
shua
shuai
shuan
shuang
shui
shun
shuo
si
song
sou
su
suan
sui
sun
suo
ta
tai
tan
tang
tao
te
teng
ti
tian
tiao
tie
ting
tong
tou
tu
tuan
tui
tun
tuo
wa
wai
wan
wang
wei
wen
weng
wo
wu
xi
xia
xian
xiang
xiao
xie
xin
xing
xiong
xiu
xu
xuan
xue
xun
ya
yan
yang
yao
ye
yi
yin
ying
yo
yong
you
yu
yuan
yue
yun
za
zai
zan
zang
zao
ze
zei
zen
zeng
zha
zhai
zhan
zhang
zhao
zhe
zhen
zheng
zhi
zhong
zhou
zhu
zhua
zhuai
zhuan
zhuang
zhui
zhun
zhuo
zi
zong
zou
zu
zuan
zui
zun
zuo
```


## 附录 3 双拼表 (自然码)

```json
{
  "aa": "a",
  "ai": "ai",
  "an": "an",
  "ao": "ao",
  "ba": "ba",
  "bc": "biao",
  "bf": "ben",
  "bg": "beng",
  "bh": "bang",
  "bi": "bi",
  "bj": "ban",
  "bk": "bao",
  "bl": "bai",
  "bm": "bian",
  "bn": "bin",
  "bo": "bo",
  "bu": "bu",
  "bx": "bie",
  "by": "bing",
  "bz": "bei",
  "ca": "ca",
  "cb": "cou",
  "ce": "ce",
  "cf": "cen",
  "cg": "ceng",
  "ch": "cang",
  "ci": "ci",
  "cj": "can",
  "ck": "cao",
  "cl": "cai",
  "co": "cuo",
  "cp": "cun",
  "cr": "cuan",
  "cs": "cong",
  "cu": "cu",
  "cv": "cui",
  "da": "da",
  "db": "dou",
  "dc": "diao",
  "de": "de",
  "df": "den",
  "dg": "deng",
  "dh": "dang",
  "di": "di",
  "dj": "dan",
  "dk": "dao",
  "dl": "dai",
  "dm": "dian",
  "do": "duo",
  "dp": "dun",
  "dq": "diu",
  "dr": "duan",
  "ds": "dong",
  "du": "du",
  "dv": "dui",
  "dw": "dia",
  "dx": "die",
  "dy": "ding",
  "dz": "dei",
  "ee": "e",
  "en": [
    "en",
    "ng"
  ],
  "er": "er",
  "fa": "fa",
  "fb": "fou",
  "ff": "fen",
  "fg": "feng",
  "fh": "fang",
  "fj": "fan",
  "fo": "fo",
  "fu": "fu",
  "fz": "fei",
  "ga": "ga",
  "gb": "gou",
  "gd": "guang",
  "ge": "ge",
  "gf": "gen",
  "gg": "geng",
  "gh": "gang",
  "gj": "gan",
  "gk": "gao",
  "gl": "gai",
  "go": "guo",
  "gp": "gun",
  "gr": "guan",
  "gs": "gong",
  "gu": "gu",
  "gv": "gui",
  "gw": "gua",
  "gy": "guai",
  "gz": "gei",
  "ha": "ha",
  "hb": "hou",
  "hd": "huang",
  "he": "he",
  "hf": "hen",
  "hg": [
    "heng",
    "hng"
  ],
  "hh": "hang",
  "hj": "han",
  "hk": "hao",
  "hl": "hai",
  "ho": "huo",
  "hp": "hun",
  "hr": "huan",
  "hs": "hong",
  "hu": "hu",
  "hv": "hui",
  "hw": "hua",
  "hy": "huai",
  "hz": "hei",
  "ia": "cha",
  "ib": "chou",
  "id": "chuang",
  "ie": "che",
  "if": "chen",
  "ig": "cheng",
  "ih": "chang",
  "ii": "chi",
  "ij": "chan",
  "ik": "chao",
  "il": "chai",
  "io": "chuo",
  "ip": "chun",
  "ir": "chuan",
  "is": "chong",
  "iu": "chu",
  "iv": "chui",
  "iy": "chuai",
  "jc": "jiao",
  "jd": "jiang",
  "ji": "ji",
  "jm": "jian",
  "jn": "jin",
  "jp": "jun",
  "jq": "jiu",
  "jr": "juan",
  "js": "jiong",
  "jt": "jue",
  "ju": "ju",
  "jw": "jia",
  "jx": "jie",
  "jy": "jing",
  "ka": "ka",
  "kb": "kou",
  "kd": "kuang",
  "ke": "ke",
  "kf": "ken",
  "kg": "keng",
  "kh": "kang",
  "kj": "kan",
  "kk": "kao",
  "kl": "kai",
  "ko": "kuo",
  "kp": "kun",
  "kr": "kuan",
  "ks": "kong",
  "ku": "ku",
  "kv": "kui",
  "kw": "kua",
  "ky": "kuai",
  "kz": "kei",
  "la": "la",
  "lb": "lou",
  "lc": "liao",
  "ld": "liang",
  "le": "le",
  "lg": "leng",
  "lh": "lang",
  "li": "li",
  "lj": "lan",
  "lk": "lao",
  "ll": "lai",
  "lm": "lian",
  "ln": "lin",
  "lo": [
    "lo",
    "luo"
  ],
  "lp": "lun",
  "lq": "liu",
  "lr": "luan",
  "ls": "long",
  "lt": "lve",
  "lu": "lu",
  "lv": "lv",
  "lw": "lia",
  "lx": "lie",
  "ly": "ling",
  "lz": "lei",
  "ma": "ma",
  "mb": "mou",
  "mc": "miao",
  "me": "me",
  "mf": "men",
  "mg": "meng",
  "mh": "mang",
  "mi": "mi",
  "mj": "man",
  "mk": "mao",
  "ml": "mai",
  "mm": "mian",
  "mn": "min",
  "mo": "mo",
  "mq": "miu",
  "mu": "mu",
  "mx": "mie",
  "my": "ming",
  "mz": "mei",
  "na": "na",
  "nb": "nou",
  "nc": "niao",
  "nd": "niang",
  "ne": "ne",
  "nf": "nen",
  "ng": "neng",
  "nh": "nang",
  "ni": "ni",
  "nj": "nan",
  "nk": "nao",
  "nl": "nai",
  "nm": "nian",
  "nn": "nin",
  "no": "nuo",
  "nq": "niu",
  "nr": "nuan",
  "ns": "nong",
  "nt": "nve",
  "nu": "nu",
  "nv": "nv",
  "nx": "nie",
  "ny": "ning",
  "nz": "nei",
  "oh": "ang",
  "om": "m",
  "oo": "o",
  "ou": "ou",
  "pa": "pa",
  "pb": "pou",
  "pc": "piao",
  "pf": "pen",
  "pg": "peng",
  "ph": "pang",
  "pi": "pi",
  "pj": "pan",
  "pk": "pao",
  "pl": "pai",
  "pm": "pian",
  "pn": "pin",
  "po": "po",
  "pu": "pu",
  "px": "pie",
  "py": "ping",
  "pz": "pei",
  "qc": "qiao",
  "qd": "qiang",
  "qi": "qi",
  "qm": "qian",
  "qn": "qin",
  "qp": "qun",
  "qq": "qiu",
  "qr": "quan",
  "qs": "qiong",
  "qt": "que",
  "qu": "qu",
  "qw": "qia",
  "qx": "qie",
  "qy": "qing",
  "rb": "rou",
  "re": "re",
  "rf": "ren",
  "rg": "reng",
  "rh": "rang",
  "ri": "ri",
  "rj": "ran",
  "rk": "rao",
  "ro": "ruo",
  "rp": "run",
  "rr": "ruan",
  "rs": "rong",
  "ru": "ru",
  "rv": "rui",
  "sa": "sa",
  "sb": "sou",
  "se": "se",
  "sf": "sen",
  "sg": "seng",
  "sh": "sang",
  "si": "si",
  "sj": "san",
  "sk": "sao",
  "sl": "sai",
  "so": "suo",
  "sp": "sun",
  "sr": "suan",
  "ss": "song",
  "su": "su",
  "sv": "sui",
  "ta": "ta",
  "tb": "tou",
  "tc": "tiao",
  "te": "te",
  "tg": "teng",
  "th": "tang",
  "ti": "ti",
  "tj": "tan",
  "tk": "tao",
  "tl": "tai",
  "tm": "tian",
  "to": "tuo",
  "tp": "tun",
  "tr": "tuan",
  "ts": "tong",
  "tu": "tu",
  "tv": "tui",
  "tx": "tie",
  "ty": "ting",
  "ua": "sha",
  "ub": "shou",
  "ud": "shuang",
  "ue": "she",
  "uf": "shen",
  "ug": "sheng",
  "uh": "shang",
  "ui": "shi",
  "uj": "shan",
  "uk": "shao",
  "ul": "shai",
  "uo": "shuo",
  "up": "shun",
  "ur": "shuan",
  "uu": "shu",
  "uv": "shui",
  "uw": "shua",
  "uy": "shuai",
  "uz": "shei",
  "va": "zha",
  "vb": "zhou",
  "vd": "zhuang",
  "ve": "zhe",
  "vf": "zhen",
  "vg": "zheng",
  "vh": "zhang",
  "vi": "zhi",
  "vj": "zhan",
  "vk": "zhao",
  "vl": "zhai",
  "vo": "zhuo",
  "vp": "zhun",
  "vr": "zhuan",
  "vs": "zhong",
  "vu": "zhu",
  "vv": "zhui",
  "vw": "zhua",
  "vy": "zhuai",
  "wa": "wa",
  "wf": "wen",
  "wg": "weng",
  "wh": "wang",
  "wj": "wan",
  "wl": "wai",
  "wo": "wo",
  "wu": "wu",
  "wz": "wei",
  "xc": "xiao",
  "xd": "xiang",
  "xi": "xi",
  "xm": "xian",
  "xn": "xin",
  "xp": "xun",
  "xq": "xiu",
  "xr": "xuan",
  "xs": "xiong",
  "xt": "xue",
  "xu": "xu",
  "xw": "xia",
  "xx": "xie",
  "xy": "xing",
  "ya": "ya",
  "yb": "you",
  "ye": "ye",
  "yh": "yang",
  "yi": "yi",
  "yj": "yan",
  "yk": "yao",
  "yn": "yin",
  "yo": "yo",
  "yp": "yun",
  "yr": "yuan",
  "ys": "yong",
  "yt": "yue",
  "yu": "yu",
  "yy": "ying",
  "za": "za",
  "zb": "zou",
  "ze": "ze",
  "zf": "zen",
  "zg": "zeng",
  "zh": "zang",
  "zi": "zi",
  "zj": "zan",
  "zk": "zao",
  "zl": "zai",
  "zo": "zuo",
  "zp": "zun",
  "zr": "zuan",
  "zs": "zong",
  "zu": "zu",
  "zv": "zui",
  "zz": "zei"
}
```

----

本文使用 CC-BY-SA 4.0 许可发布.
