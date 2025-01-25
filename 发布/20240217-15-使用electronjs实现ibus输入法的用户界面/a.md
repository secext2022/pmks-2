# 使用 electronjs 实现 ibus 输入法的用户界面

ibus 输入法框架自带一套用户界面, 比如 (ibus-libpinyin):

![ibus 输入法用户界面](../图/20240217-15/0-ibus-1.jpg)

但是从灵活程度和可扩展的角度考虑, 最好还是另外想办法实现用户界面,
而不是用 ibus 自带的这个.

在桌面 (PC) 平台制作图形用户界面, 有很多很多种具体的技术可供选择.
但是窝觉得, 其中最简单的方式就是使用 electronjs.

本文介绍使用 electronjs 实现 ibus 输入法的用户界面的方法.
(注意: 并非完整实现)

----

相关文章:

+ 《ibus 源代码阅读 (1)》

  TODO


## 目录

+ 1 electronjs 简介

+ 2 实现透明窗口

  - 2.1 无框架窗口

  - 2.2 透明窗口

  - 2.3 不可获得焦点

+ 3 实现光标跟随

  - 3.1 光标位置的获取

  - 3.2 实现页面接口

  - 3.3 窗口的显示和隐藏

+ 4 测试

+ 5 总结与展望

+ 附录 1 electronjs 相关代码


## 1 electronjs 简介

electronjs = chromium + node.js

+ <https://www.electronjs.org/>
+ <https://www.chromium.org/chromium-projects/>
+ <https://nodejs.org/en>
+ <https://v8.dev/>
+ <https://code.visualstudio.com/>

chromium 是一个浏览器内核, 可以显示网页.
node.js 是一个用 JavaScript 开发服务器 (无图形界面) 应用的运行环境.
chromium 使用 v8 引擎 (js 虚拟机), node.js 也用 v8 引擎来执行 js 代码.
node.js 使用 js 编程语言, 网页也用 js 语言开发.

总之, electronjs 就是 chromium 和 node.js 合体后的产物.
使用 electronjs 可以开发桌面 (PC) 应用, 支持 3 个平台:
GNU/Linux, Windows, 苹果 mac.
其中整个应用 (非界面部分) 使用 node.js 的功能,
图形用户界面使用 chromium 显示.

![vscode](../图/20240217-15/1-vscode-1.jpg)

比如文本编辑器 vscode 就基于 electronjs 框架开发.

使用 electronjs 开发应用, 就和开发网页差不多,
主要使用 HTML, CSS, JavaScript 等 web 技术.
也可以使用 vue 等框架.

从非开发者的角度, web 技术的主要优点是, 开发速度快, 低成本.
从开发者的角度, 实现相同的功能 (效果), 大部分情况下, 使用 web 技术,
相比别的图形界面技术, 都要简单容易很多.

web 技术是目前最好 (甚至唯一真正) 的跨平台技术.
跨平台就是一套代码, 可以在多个平台运行,
比如不同的操作系统 (GNU/Linux, Android, Windows),
不同的设备形态 (PC, 手机) 等.
如果不使用跨平台技术, 同一个应用就要分别开发多次,
成本瞬间就增加了很多倍.
毕竟大部分情况下, 低成本才是王道 (看窝网名).

----

一点八卦:

关于 electron 这个命名.
当年 github 做了一个文本编辑器, 叫 Atom (原子).
Atom 使用的框架最初叫 atom-shell (原子外壳),
后来改名叫 electron (电子).
后来微软开发出 vscode, 也基于 electron,
工作原理和 Atom 差不多, 算是直接竞争对手.
再后来, 微软收购了 github, 于是 Atom 死了, 只留下了 electronjs.


## 2 实现透明窗口

根据我们日常的使用习惯, 拼音输入法主要有两个界面:
**固定工具条** 和 **候选框**.

![输入法界面](../图/20240217-15/20-im-1.jpg)

其中固定工具条一般放在屏幕边上, 可以切换一些输入状态,
比如中英文, 全角半角之类的.
候选框跟随光标移动, 里面显示多个候选项.

这些窗口和通常的窗口不同, 比如没有标题栏和关闭按钮.
本章节来实现这样的窗口.

参考文档:

+ <https://www.electronjs.org/docs/latest/api/browser-window>
+ <https://www.electronjs.org/docs/latest/tutorial/window-customization>

### 2.1 无框架窗口

常见的普通窗口是有框架 (frame) 的, 比如标题栏, 关闭按钮等.

创建无框架窗口使用如下代码:

```js
new BrowserWindow({
  //
  frame: false,
})
```

没有了标题栏之后, 窗口就无法移动了.
但是可以创建可拖动的区域, 比如:

```css
img {
  -webkit-app-region: drag;
}
```

在页面中写这样的 CSS 代码, 然后猫猫头就可以拖动了:

![窗口的可拖动区域](../图/20240217-15/21-drag-1.gif)

### 2.2 透明窗口

![圆角窗口](../图/20240217-15/22-w-1.jpg)

仔细观察这个窗口, 是有圆角效果的.
圆角的四个角那里, 仍然是属于窗口的区域, 但是具有透明效果.

```js
new BrowserWindow({

  // 透明窗口
  transparent: true,
})
```

首先需要在 electronjs 设置相应的选项.

```js
new BrowserWindow({

  //backgroundColor: "#FFF3E0",
```

注意此处不能设置 `backgroundColor`.

```css
body {
  background-color: transparent;
}
```

最后在页面中添加 CSS.

### 2.3 不可获得焦点

当前正在输入内容的窗口, 也就是有文本光标的窗口,
是获得焦点 (focus) 的窗口.
同一时间只能有一个窗口获得焦点,
所以候选框这个特殊的窗口, 不能获得焦点.

想象一下, 如果候选框也能获得焦点, 那么:
(1) 在窗口 1 输入拼音;
(2) 弹出候选框窗口;
(3) 候选框获得焦点;
(4) 窗口 1 失去焦点;
(5) 输入取消.

具体表现大约是:
每次输入拼音, 候选框总是闪一下, 然后消失 .. .
奇怪的 BUG !

```js
// im1: 候选框
窗口.im1 = new BrowserWindow({
  width: 800,
  height: 200,
  x: 100,
  y: 300,

  //backgroundColor: "#FFF3E0",
  autoHideMenuBar: true,
  // 不可调整大小
  resizable: false,
  // 置顶窗口
  alwaysOnTop: true,
  // 无边框
  frame: false,
  // 透明窗口
  transparent: true,
  // 默认隐藏窗口
  show: false,
  // 不可获得焦点
  focusable: false,

  webPreferences: {
    preload,
  },
});
```

总结以上种种, 使用这样的代码创建候选框窗口.


## 3 实现光标跟随

候选框窗口需要跟随屏幕上文本光标的位置,
也就是显示在光标旁边.
如果没有光标跟随, 候选框固定在屏幕的一个位置,
用起来就会很难受.

### 3.1 光标位置的获取

+ 源文件: `ibus/src/ibusengine.c`
  (详见 《ibus 源代码阅读 (1)》)

```xml
<node>
  <interface name='org.freedesktop.IBus.Engine'>

    <method name='SetCursorLocation'>
      <arg direction='in'  type='i' name='x' />
      <arg direction='in'  type='i' name='y' />
      <arg direction='in'  type='i' name='w' />
      <arg direction='in'  type='i' name='h' />
    </method>
```

ibus 输入法框架 (`ibus-daemon`) 会通过 D-Bus 接口
`org.freedesktop.IBus.Engine` 方法 `SetCursorLocation`
给输入法发送屏幕上光标的位置.
4 个参数分别为光标的 x, y 位置和宽高.
注意这里的 x, y 是相对整个屏幕的坐标.

参考文档: <https://ibus.github.io/docs/ibus-1.5/IBusEngine.html#IBusEngine-set-cursor-location>

输入法这边的实现代码 (rust):

```rust
#[interface(name = "org.freedesktop.IBus.Engine")]
impl<T: IBusEngine + 'static> Engine<T> {

    async fn set_cursor_location(
        &mut self,
        #[zbus(signal_context)] sc: SignalContext<'_>,
        x: i32,
        y: i32,
        w: i32,
        h: i32,
    ) -> fdo::Result<()> {
        self.e.set_cursor_location(sc, x, y, w, h).await
    }
```

注意: 此处的代码升级到了 `zbus 4.0`
<https://docs.rs/zbus/4.0.1/zbus/index.html>

文章 《ibus 源代码阅读 (1)》 写的时候对应 zbus 3.15 版本.
具体接口有一点变化.

### 3.2 实现页面接口

要实现光标跟随, 就需要移动候选框窗口的位置.
这是 electronjs 的功能.
如果光标跟随的功能在页面上实现, 页面上的代码就需要调用 electronjs.
需要实现相应的页面接口.

```js
const preload = path.join(__dirname, "preload.js");

new BrowserWindow({
  webPreferences: {
    preload,
  },
});
```

创建窗口的时候, 需要加载一个 js 文件, 作为桥接:

```js
// pmim-ibus electronjs preload.js
const { contextBridge, ipcRenderer } = require("electron");

// electronjs 接口桥接
contextBridge.exposeInMainWorld("pmim_ea", {
  electron_version: () => ipcRenderer.invoke("ea:electron_version"),
  read_token: () => ipcRenderer.invoke("ea:read_token"),

  窗口显示0: () => ipcRenderer.invoke("ea:窗口显示0"),
  窗口隐藏0: () => ipcRenderer.invoke("ea:窗口隐藏0"),
  窗口显示: () => ipcRenderer.invoke("ea:窗口显示"),
  窗口隐藏: () => ipcRenderer.invoke("ea:窗口隐藏"),
  窗口长宽: (w, h) => ipcRenderer.invoke("ea:窗口长宽", w, h),
  窗口位置: (x, y) => ipcRenderer.invoke("ea:窗口位置", x, y),
});
```

桥接文件的代码类似这样.

```js
const { app, BrowserWindow, ipcMain } = require("electron");

// 省略

async function 窗口位置(_, x, y) {
  if (null != 窗口.im1) {
    窗口.im1.setPosition(x, y);
  }
}

ipcMain.handle("ea:electron_version", electron_version);
ipcMain.handle("ea:read_token", read_token);

ipcMain.handle("ea:窗口显示0", 窗口显示0);
ipcMain.handle("ea:窗口隐藏0", 窗口隐藏0);
ipcMain.handle("ea:窗口显示", 窗口显示);
ipcMain.handle("ea:窗口隐藏", 窗口隐藏);
ipcMain.handle("ea:窗口长宽", 窗口长宽);
ipcMain.handle("ea:窗口位置", 窗口位置);
```

在 electronjs 主文件里面实现对应的接口.
然后, 页面上的代码就可以这样调用了:

```js
await window.pmim_ea.窗口位置(x, y);
```

### 3.3 窗口的显示和隐藏

```js
function 处理状态() {
  // 状态追踪
  return {
    // 窗口显示状态
    应该显示: false,
    实际显示: false,
    // 光标位置
    光标: [0, 0, 0, 0],
  };
}

// 省略

  // 处理消息 (更新状态)
  if ("s" == 消息.类型) {
    switch (消息.文本) {
      case "focus_in":
        状态.应该显示 = true;
        break;
      case "focus_out":
        状态.应该显示 = false;
        break;
      case "disable":
        状态.应该显示 = false;
        //await 窗口隐藏0();
        break;
      case "enable":
        //await 窗口显示0();
        break;
    }
  } else if ("c" == 消息.类型) {
    // 追踪光标位置
    if ((0 != 消息.x) || (0 != 消息.y)) {
      状态.光标 = [消息.x, 消息.y, 消息.w, 消息.h];
    }
  } else if ("k" == 消息.类型) {
    // 按键处理
    // TODO
  } else if ("t" == 消息.类型) {
    // 更新原始输入
    输入.value = 消息.文本;
  }

  // 处理窗口移动
  if ((0 != 状态.光标[0]) || (0 != 状态.光标[1])) {
    // TODO 优化位置选择
    const x = 状态.光标[0];
    const y = 状态.光标[1] + 状态.光标[3] + 16;

    await 窗口位置(x, y);
  }

  // 处理窗口显示/隐藏
  if (状态.实际显示) {
    if (!状态.应该显示) {
      await 窗口隐藏();
      状态.实际显示 = false;
      return;
    }

    if (输入.value.length < 1) {
      await 窗口隐藏();
      状态.实际显示 = false;
      return;
    }
  } else if (状态.应该显示) {
    if (
      ((0 != 状态.光标[0]) || (0 != 状态.光标[1])) && (输入.value.length > 0)
    ) {
      await 窗口显示();
      状态.实际显示 = true;
      return;
    }
  }
```

这是一段页面上的代码, 随便写了写, 还没来得及整理和优化.
随便看看就好了.

这段代码初步实现了光标跟随的功能.


## 4 测试

又到了激动人心的测试环节.

+ (1) 启动 vue 项目 (开发模式):

  ```
  > npm run dev
  ```

  页面使用 `vue 3.4` (vite) 框架开发.
  这又是另一个故事了 .. .

  <https://vuejs.org/>

+ (2) 运行 electronjs (完整代码详见 附录 1):

  ```
  > electron main.js
  ```

光标跟随功能的测试截图如下:

![测试截图 (1)](../图/20240217-15/4-t-1.jpg)

![测试截图 (2)](../图/20240217-15/4-t-2.jpg)

![测试截图 (3)](../图/20240217-15/4-t-3.jpg)


## 5 总结与展望

可以看到, 使用 electronjs 实现图形界面还是很简单方便的.

相比 ibus 框架自带的用户界面, 灵活程度和可扩展能力都得到了大幅度提高.

在 web 技术的加持之下, 制作输入法就可以放飞自我了.
应该可以容易的做出丰富多样的用户界面.


## 附录 1 electronjs 相关代码

+ `main.js`

```js
// pmim-ibus electronjs
const path = require("node:path");
const { readFile } = require("node:fs/promises");
const { app, BrowserWindow, ipcMain } = require("electron");

const LOGP = "pmim-ibus electronjs";

function logi(t) {
  console.log(LOGP + t);
}

// DEBUG
logi(": main.js");

const 开发地址 = "http://localhost:5173"; // vue `npm run dev`

function 获取加载地址() {
  const 端口 = process.env["PMIM_PORT"];
  if (端口 != null) {
    return `http://127.0.0.1:${端口}`;
  }
  return 开发地址;
}

// 保存创建的窗口
const 窗口 = {
  // 主窗口
  主: null,
  // im0: 常驻工具条
  im0: null,
  // im1: 候选框
  im1: null,
};

function 初始化接口() {
  // 获取 electronjs 版本信息
  async function electron_version() {
    return process.versions;
  }

  // 读取 deno/fresh server http token
  async function read_token() {
    const xrd = process.env["XDG_RUNTIME_DIR"];
    const 口令文件 = path.join(xrd, "pmim/server_token");
    logi(" read token: " + 口令文件);

    return await readFile(口令文件, { encoding: "utf8" });
  }

  async function 窗口显示0() {
    if (null != 窗口.im0) {
      窗口.im0.showInactive();
    }
  }

  async function 窗口隐藏0() {
    if (null != 窗口.im0) {
      窗口.im0.hide();
    }
  }

  async function 窗口显示() {
    if (null != 窗口.im1) {
      窗口.im1.showInactive();
    }
  }

  async function 窗口隐藏() {
    if (null != 窗口.im1) {
      窗口.im1.hide();
    }
  }

  async function 窗口长宽(_, w, h) {
    if (null != 窗口.im1) {
      窗口.im1.setSize(w, h);
    }
  }

  async function 窗口位置(_, x, y) {
    if (null != 窗口.im1) {
      窗口.im1.setPosition(x, y);
    }
  }

  ipcMain.handle("ea:electron_version", electron_version);
  ipcMain.handle("ea:read_token", read_token);

  ipcMain.handle("ea:窗口显示0", 窗口显示0);
  ipcMain.handle("ea:窗口隐藏0", 窗口隐藏0);
  ipcMain.handle("ea:窗口显示", 窗口显示);
  ipcMain.handle("ea:窗口隐藏", 窗口隐藏);
  ipcMain.handle("ea:窗口长宽", 窗口长宽);
  ipcMain.handle("ea:窗口位置", 窗口位置);
}

function 创建窗口() {
  const preload = path.join(__dirname, "preload.js");

  // 主窗口
  窗口.主 = new BrowserWindow({
    width: 400,
    height: 700,

    backgroundColor: "#FFF3E0",
    autoHideMenuBar: true,
    show: false,

    webPreferences: {
      preload,
    },
  });

  // im0: 常驻工具条
  窗口.im0 = new BrowserWindow({
    width: 400,
    height: 100,
    x: 100,
    y: 100,

    //backgroundColor: "#FFF3E0",
    autoHideMenuBar: true,
    // 不可调整大小
    resizable: false,
    // 置顶窗口
    alwaysOnTop: true,
    // 无边框
    frame: false,
    // 透明窗口
    transparent: true,
    // 默认隐藏窗口
    //show: false,

    webPreferences: {
      preload,
    },
  });

  // im1: 候选框
  窗口.im1 = new BrowserWindow({
    width: 800,
    height: 200,
    x: 100,
    y: 300,

    //backgroundColor: "#FFF3E0",
    autoHideMenuBar: true,
    // 不可调整大小
    resizable: false,
    // 置顶窗口
    alwaysOnTop: true,
    // 无边框
    frame: false,
    // 透明窗口
    transparent: true,
    // 默认隐藏窗口
    show: false,
    // 不可获得焦点
    focusable: false,

    webPreferences: {
      preload,
    },
  });
  // DEBUG
  //窗口.im1.webContents.openDevTools();

  // TODO 延迟加载页面
  const url = 获取加载地址();

  const u1 = url + "/index.html";
  logi(" URL: " + u1);
  窗口.主.loadURL(u1);

  const u2 = url + "/im0/index.html";
  logi(" URL: " + u2);
  窗口.im0.loadURL(u2);

  const u3 = url + "/im1/index.html";
  logi(" URL: " + u3);
  窗口.im1.loadURL(u3);
}

app.whenReady().then(() => {
  初始化接口();
  创建窗口();
});

// TODO
app.on("window-all-closed", () => {
  app.quit();
});
```

+ `preload.js`

```js
// pmim-ibus electronjs preload.js
const { contextBridge, ipcRenderer } = require("electron");

// electronjs 接口桥接
contextBridge.exposeInMainWorld("pmim_ea", {
  electron_version: () => ipcRenderer.invoke("ea:electron_version"),
  read_token: () => ipcRenderer.invoke("ea:read_token"),

  窗口显示0: () => ipcRenderer.invoke("ea:窗口显示0"),
  窗口隐藏0: () => ipcRenderer.invoke("ea:窗口隐藏0"),
  窗口显示: () => ipcRenderer.invoke("ea:窗口显示"),
  窗口隐藏: () => ipcRenderer.invoke("ea:窗口隐藏"),
  窗口长宽: (w, h) => ipcRenderer.invoke("ea:窗口长宽", w, h),
  窗口位置: (x, y) => ipcRenderer.invoke("ea:窗口位置", x, y),
});
```

----

本文使用 CC-BY-SA 4.0 许可发布.
