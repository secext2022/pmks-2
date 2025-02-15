# 科幻游戏 《外卖员模拟器》 基础任务 (日常玩法) 设计 (草稿)

游戏名称: 《**外卖员模拟器**》 (英文名称: `waimai_se`)
作者: 穷人小水滴 (本游戏属于 超低空科幻流派. )

![胖蜗-200](./图/0-wmj-200.png)

(建模和渲染软件: blender, GIMP) `WMJ-200` 型 自动驾驶送货小车:

+ 主要传感技术:
  摄像头 (8 个), 激光雷达, 超声波雷达, 毫米波雷达, 卫星定位系统,
  5G 基站定位系统, 车路协同.

----

相关文章:

TODO


## 目录

+ 1 基础任务 (日常玩法) 设计

+ 2 基础设施应急抢修 任务类型

+ 3 游戏内时间 (每月) 和现实时间的对应关系

+ 4 信号区域与 5G 基站的关系


## 1 基础任务 (日常玩法) 设计

+ 每月 (游戏内时间) **送外卖** (10 单).
  完成后可以获得基本奖励 (2000 熵).

游戏内设定:

> 以前, 一个外卖员每月至少送 1000 单, AI (自动驾驶) 机器人系统,
> 能够完成 99% 的任务, 所以现在的一个人类外卖员, 一个月只需送 10 单.

----

+ **基础设施应急抢修**: 每周 (现实时间) 2 次, 完成后可以拿到奖金 (1000 熵).
  表现优秀的 (任务计时全服排名前 10%) 可获得额外奖金 (2000 熵).

  每月 (现实时间) 2 次 **高级别任务** (比如 发电厂故障, 全市变电站故障),
  可获得额外奖金 (5000 熵).

  任务类型随机, 任务地点随机, 任务内容随机.

游戏内设定:

> **有水** (自来水), **有电** (国家电网), **有网** (5G), **有快递** (外卖),
> 这就是我们赖以生存的 "四有" 现代化幸福生活.
>
> 这些基础设施非常重要, 平时默默无闻, 一旦故障, 就会让千千万万的人非常难受.
> 意外每天都会发生, 我们能做的, 就是在故障出现后, 争分夺秒, 抓紧时间尽快抢修.


## 2 基础设施应急抢修 任务类型

任务类型 (包括但不限于) 可能有: (标 `*` 的是 高级别任务)

+ (供电) **电网故障 (停电): 入户线路 损坏**.

+ (供电) **电网故障 (停电): 街区变压器 损坏**.

+ (供电) **电网故障 (停电): 高压干线 损坏**.

+ (供电 `*`) **电网故障 (停电): 变电站 损坏**.

+ (供电 `*`) **发电厂 事故**.

+ (供水) **入户水管 损坏**.

+ (供水) **水管主线路 损坏**.

+ (供水 `*`) **海水淡化厂 故障**.

+ (供水) **下水道 损坏** (堵塞).

+ (供水 `*`) **污水处理厂 故障**.

+ (网络) **5G (4G) 基站 损坏**.

+ (网络) **光纤 损坏** (比如 挖掘机挖断了).

+ (网络 `*`) **数据中心 (IDC 机房) 故障** (比如 火灾).

+ (交通) **自动驾驶小车 (外卖/快递) 故障**.

+ (交通) **外卖末端配送 机器人 故障**.

+ (交通) **货运轻轨 损坏**.

+ (交通 `*`) **分捡中心 (仓库) 故障**.

+ (交通) **自动货柜 故障**.

+ (交通) **公交车 故障**.

+ (交通 `*`) **地铁 故障**.


## 3 游戏内时间 (每月) 和现实时间的对应关系

游戏内时间管理: 游戏内时间第 ? 月, 本月剩余 ? 天.

+ **可用下一月** 次数 (? / 5).

规则如下:

+ 玩家在游戏内可主动选择 **下一月** 操作, 消耗一次 "可用下一月" 次数,
  从而结算本月任务奖励, 推进游戏内的时间进程.

+ 游戏内 "网购" (快递) 等方式, 需要下单后第 2 天才能拿到快递.
  每执行一次 **等待明天** 操作, 本月剩余天数 -1. 剩余天数为 0 时,
  将不可执行此操作. 进行 **下一月** 操作后, 将恢复本月剩余天数 (30/31 天).

+ 每周 (现实时间) 游戏内 **可用下一月** 次数 +1, 最多可存储 5,
  存满不再继续增加.

+ 游戏刚开始时, 完成新手教程, 赠送 8 次 "可用下一月" 次数.
  额外赠送的次数不计入上述 (5 次) 的限制, 且优先消耗上面 (5 次) 的次数.

+ 游戏中别的不定奖励 "可用下一月" 次数 (包括邮箱发邮件奖励).

+ 玩家消耗充值道具 (国际货币 信用点), 可购买 "可用下一月" 次数.
  每月 (现实时间) 不超过 4 次.


## 4 信号区域与 5G 基站的关系

5G 基站定位:

+ 城市中心: 5G 信号区 (4 格信号)

+ 城市边缘: 4G 信号区 (3 格信号)

+ 边缘区域: 附近 4G 基站 < 3 个 (2 格信号)

  提示信号弱, 建议返回.

+ 无信号: (1 格信号)

  60 秒之内, 如果不离开无信号区域, 将触发 **迷路** (GAME OVER 类型 404).

TODO
