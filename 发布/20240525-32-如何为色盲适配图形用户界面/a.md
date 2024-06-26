# 如何为色盲适配图形用户界面

答案很简单: 把彩色去掉, 测试.

色盲, 正式名称 色觉异常. 众所周知, 色盲分不清颜色.
如果用户界面设计的不合理, 比如不同项目只使用颜色区分, 而没有形状区分,
那么色盲使用起来就会非常难受, 甚至无法使用.

色盲中最严重的情况称为全色盲, 也就是完全不能分辨颜色, 只能看出亮度.
所以, 要测试一个图形用户界面对色盲的适配情况, 只需以全色盲为标准即可.
如果全色盲使用起来没问题, 那么更轻度的色盲, 使用起来当然也没问题.

一般情况下, 图形用户界面的设计者 (UI 美工) 不可能是色盲,
所以需要有相应的测试方法.
具体的方法是, 把用户界面的彩色完全去掉, 只使用灰度,
也就是类似古老的黑白电视, 或者单色墨水屏的情况.
在这种情况下, 如果软件能够正常使用, 那么测试通过.
否则需要修改设计.


## 目录

+ 1 web 前端 (CSS) 的实现方式

+ 2 胖喵拼音的灰度模式 (禁用彩色)

+ 3 总结与展望


## 1 web 前端 (CSS) 的实现方式

参考资料 (MDN): <https://developer.mozilla.org/en-US/docs/Web/CSS/filter>

使用 CSS 来实现这个效果是非常容易的:

```css
filter: grayscale(100%);
```


## 2 胖喵拼音的灰度模式 (禁用彩色)

胖喵拼音中的相关实现代码:

```js
export function 启用灰度模式() {
  document.body.style.filter = "grayscale(100%)";
}

export function 禁用灰度模式() {
  document.body.style.filter = null;
}
```

![彩色界面](./图/2-t-0.png)

默认情况下, 界面是彩色的.

![启用灰度模式](./图/2-t-1.png)

启用之后, 所有界面都会以灰度显示.

![灰度界面 (1)](./图/2-t-2.png)

![灰度界面 (2)](./图/2-t-3.png)

这是界面以灰度显示的效果.

![手机界面 (1)](./图/2-t-4.png)

![手机界面 (2)](./图/2-t-5.png)

手机上界面的显示效果 (皮肤: 冰蓝).

经过测试, 胖喵拼音的所有界面, 都对色盲很友好.


## 3 总结与展望

在设计图形用户界面, 或者说制作软件的时候, 应该尽量能够适用于更多的人,
努力达到更高的覆盖率.

技术能力可以差, 但是态度一定要好.
希望这个世界多一些方便, 少一些歧视.

----

本文使用 CC-BY-SA 4.0 许可发布.
