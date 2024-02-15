# 20240213-13

标题:
**从 Unicode 标准提取拼音数据**

索引: `计算机编程入门`

关键词: unicode, unihan, 拼音, 输入法, python


## 图文版

[已发布](./a.md): (3)

+ <https://blog.csdn.net/secext2022/article/details/136110314>
+ <https://zhuanlan.zhihu.com/p/682228507>
+ <https://www.bilibili.com/read/cv31310500/>


## 修正

+ 修正:
  `Unihan_Readings.txt` 数据中, 除了 `kMandarin` (普通话汉语拼音),
  还有一种重要数据 `kTGHZ2013`,
  这是 2013 年国家发布的 《通用规范汉字表》,
  共收录汉字 8105 个.

  虽然这个拼音数据的覆盖范围小一些, 但是准确性和规范性都很高,
  建议优先使用.

  拼音数据对比:
  `kMandarin` 有 41419 个汉字, `kTGHZ2013` 有 8105 个汉字.
  相比 `kMandarin`, `kTGHZ2013` 新增 0 个汉字, 缺失 33314 个汉字.
  其中 7304 个拼音相同, 801 个拼音不同.
  `kTGHZ2013` 增加了许多 多音字.

TODO
