# 使用 Web Components 实现输入法更换皮肤 (vue)

更换皮肤 (界面外观) 是拼音输入法的常见功能.

要实现更换皮肤, 有许多种不同的具体技术方案可以使用.
本文选择 Web Components 技术 (vue) 来实现这个功能.


## 目录

+ 1 效果展示

  - 1.1 发布新版本

+ 2 Web Components 简介

+ 3 vue 使用 Web Components

  - 3.1 使用 vue 实现 Web Components 组件
  - 3.2 使用 Web Components 组件

+ 4 坑

  - 4.1 vue 动态元素名称
  - 4.2 修复 vuetify
  - 4.3 修复 fontface 加载字体文件 (custom element)
  - 4.4 修复 vite lib 编译
  - 4.5 最终结果

+ 5 总结与展望


## 1 效果展示

这个拼音输入法的皮肤分为 3 个部分:

![皮肤 im0](./图/1-nc-1.png)

im0: PC 固定工具条窗口.

![皮肤 im1](./图/1-nc-2.png)

im1: PC 候选框窗口.

![皮肤 im2](./图/1-nc-3.png)

im2: 手机软键盘界面.

![皮肤 暖橙](./图/1-nc-4.png)

上面是拼音输入法的默认皮肤 (暖橙), 目前有两个内置皮肤:

![皮肤列表](./图/1-uis-1.png)

下面是新皮肤 (冰蓝):

![冰蓝 im0](./图/1-bl-1.png)

![冰蓝 im1](./图/1-bl-2.png)

![冰蓝 im2 (1)](./图/1-bl-3.png)

![冰蓝 im2 (2)](./图/1-bl-4.png)

![冰蓝 im2 (3)](./图/1-bl-5.png)

### 1.1 发布新版本

flatpak 的新版本 (v0.1.7) 已经准备好了, 但是由于从昨天开始,
flathub buildbot 故障, 导致正式版本无法发布.

相关链接:
<https://buildbot.flathub.org/>
<https://discourse.flathub.org/t/commit-stage-of-flathub-app-build-failing/6409/>

然而, 测试版 (beta) 是可以正常发布的, 安装测试版的命令是:

```sh
flatpak remote-add flathub-beta https://flathub.org/beta-repo/flathub-beta.flatpakrepo
```

添加 `flathub-beta` 仓库, 然后:

```sh
flatpak install flathub-beta io.github.fm_elpac.pmim_ibus
```

然后就可以愉快的运行新版本啦 ~~

使用 `flathub-beta` 的主要缺点是, 没有国内镜像加速, 下载速度比较慢.

----

Android 版也同步进行了更新:

![Android 版本](./图/1-android-1.jpg)

![Android 数据库](./图/1-android-2.png)


## 2 Web Components 简介

相关链接: <https://developer.mozilla.org/en-US/docs/Web/API/Web_Components>

本拼音输入法的图形用户界面基于 web 技术 (网页),
所以要在 web 技术的范围内选择解决方案.
在 web 技术之中, 也有多种方法可用于实现皮肤功能,
比如可以考虑 `iframe`.

此处希望皮肤是一个相对独立的模块 (组件),
和主程序不要有太多的耦合 ("高内聚低耦合" 原则).
皮肤和主程序之间使用定义清晰的简单接口, 皮肤可以单独安装和替换.

----

Web Components 是一种实现相对独立组件的技术,
使用 Web Components 技术实现的组件, 可以放入任意一个网页中使用.

Web Components 主要包括 **自定义元素** (custom elements) 和
**阴影文档对象模型** (Shadow DOM) 两大技术.

HTML 规范已经定义了许多元素, 比如 `<p>` 表示段落, `<a>` 表示超链接,
`<img>` 表示图片等.
custom element 技术允许自定义新的元素, 比如 `<pmim-uis>`.
这样新的自定义元素就可以作为一个相对独立的组件在网页中使用.

一个组件一般使用多个 HTML 元素实现, 也就是形成一棵树形结构 (DOM).
shadow DOM 技术对组件的内部实现细节进行隔离和封装,
避免组件和所在的页面之间互相干扰.


## 3 vue 使用 Web Components

相关链接: <https://vuejs.org/guide/extras/web-components.html>

vue 对 Web Components 的支持是比较好的.
可以很方便的使用 vue 来实现 Web Components 组件,
也可以在 vue 项目中引用和使用 Web Components 组件.

### 3.1 使用 vue 实现 Web Components 组件

此处以默认皮肤 **暖橙** (pmim-uis-nc) 举栗进行说明.

皮肤是一个单独的 vue 项目, 使用 vite 编译.
文件 `pmim-ibus/uis/pmim-uis-nc/vite.config.js`:

```js
import { fileURLToPath, URL } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// vuetify
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import Unfonts from "unplugin-fonts/vite";

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    vuetify(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  build: {
    lib: {
      entry: resolve(__dirname, "src/main.js"),
      name: "PmimUisNc",
      fileName: "pmim-uis-nc",
      formats: ["es"],
    },
    rollupOptions: {},
  },
});
```

这是 vite 的配置文件, 重点是 `build.lib` 部分,
这样项目编译后会生成 `pmim-uis-nc.js` 文件.

入口源代码文件 `pmim-ibus/uis/pmim-uis-nc/src/main.js`:

```js
import "@mdi/font/css/materialdesignicons.css";

import { defineCustomElement } from "vue";
import im0 from "./im0/im0.ce.vue";
import im1 from "./im1/im1.ce.vue";
import im2 from "./im2/im2.ce.vue";
import conf from "./conf/conf.ce.vue";

const CeIm0 = defineCustomElement(im0);
const CeIm1 = defineCustomElement(im1);
const CeIm2 = defineCustomElement(im2);
const CeConf = defineCustomElement(conf);

customElements.define("pmim-uis-nc-im0", CeIm0);
customElements.define("pmim-uis-nc-im1", CeIm1);
customElements.define("pmim-uis-nc-im2", CeIm2);
customElements.define("pmim-uis-nc-conf", CeConf);
```

使用 vue 实现 Web Components 主要分为 3 步:

+ (1) 导入 vue 组件 (单文件组件, SFC):

  ```js
  import im0 from "./im0/im0.ce.vue";
  ```

  注意这个组件的文件名后缀应该是 `.ce.vue`,
  这样 vue 会针对 Web Components 做特殊处理.

+ (2) 定义自定义元素:

  ```js
  const CeIm0 = defineCustomElement(im0);
  ```

  使用 vue 的 `defineCustomElement()` 函数.

+ (3) 注册自定义元素:

  ```js
  customElements.define("pmim-uis-nc-im0", CeIm0);
  ```

  这样使用这个组件的页面, 就能够以 HTML 元素
  `<pmim-uis-nc-im0>` 来使用了.

----

作为 Web Components 的 vue 组件, 和普通的 vue 组件一样,
比如 (源文件 `pmim-ibus/uis/pmim-uis-nc/src/im0/im0.ce.vue`, 有省略):

```html
<script setup>
import { onMounted } from "vue";

const p = defineProps({
  "data-ce": String,
});

const emit = defineEmits(["加载", "显示主窗口"]);

onMounted(() => emit("加载"));
```

vue 会自动对 props 和 emit 做针对 Web Components 的处理.

### 3.2 使用 Web Components 组件

在 vue 中, 使用 Web Components 组件基本和使用普通的 vue 组件一样,
比如 (源文件 `pmim-ibus/ui-vue/src/im0/App.vue`, 有省略):

```html
<script setup>
import { 显示主窗口 } from "@/api/ea/mod.js";
import c皮肤 from "../c/皮肤.js";
</script>

<template>
  <div class="app">
    <c皮肤
      能力="im0"
      @显示主窗口="显示主窗口"
    />
  </div>
</template>
```

这个是 PC 固定工具条窗口 (im0).
其中 `皮肤.js` 是对使用皮肤的封装 (后面有详细介绍).

----

源文件 `pmim-ibus/ui-vue/src/im1/候选框/渲染候选框.vue` (有省略):

```html
<script setup>
import { computed } from "vue";
import { use输入 } from "./hook.js";
import c皮肤 from "@/c/皮肤.js";

const 显示 = use输入();

const 页码 = computed(() => 显示.页码.value);
const 总页数 = computed(() => 显示.总页数.value);
const 拼音上 = computed(() => 显示.拼音上.value);
const 拼音下 = computed(() => 显示.拼音下.value);
const 候选 = computed(() => 显示.候选.value);
</script>

<template>
  <c皮肤
    能力="im1"
    :页码="页码"
    :总页数="总页数"
    :拼音上="拼音上"
    :拼音下="拼音下"
    :候选="候选"
  />
</template>
```

这个是 PC 候选框窗口 (im1) 和皮肤的接口.

----

源文件 `pmim-ibus/ui-vue/src/im2/软键盘/渲染软键盘.vue` (有省略):

```html
<script setup>
import { use输入 } from "./hook.js";
import c皮肤 from "@/c/皮肤.js";

const {
  拼音,
  键盘,
  符号列表,
  扩展列表,
  拼音上,
  拼音下,
  候选,
  设键盘,
  关闭键盘,
  按键点击,
  输入,
} = use输入();

// 省略

function 设键盘1(e) {
  设键盘(e.detail[0]);
}

async function 按键点击1(e) {
  await 按键点击(e.detail[0], e.detail[1]);
}

async function 输入1(e) {
  await 输入(e.detail[0]);
}
</script>

<template>
  <c皮肤
    v-if="已加载"
    能力="im2"
    :双拼方案="双拼方案"
    :键盘布局="键盘布局"
    :拼音="拼音"
    :键盘="键盘"
    :符号列表="符号列表"
    :扩展列表="扩展列表"
    :拼音上="拼音上"
    :拼音下="拼音下"
    :候选="候选"
    @设键盘="设键盘1"
    @关闭键盘="关闭键盘"
    @按键点击="按键点击1"
    @输入="输入1"
  />
</template>
```

这个是手机软键盘界面 (im2) 和皮肤的接口.

注意在 Web Components 里面使用 `emit()` 报告的事件,
在 Web Components 外面会以 `CustomEvent` 接收,
其中事件具体的参数会通过 `e.detail` 进行传递.
此处需要进行一些简单的转换.

----

借助 Web Components 的隔离和抽象,
主程序和皮肤组件之间定义了清晰简单的接口.


## 4 坑

坑很大, 水很深.
窝发现, 经常很容易就能遭遇技术的边界, 或者说人类探索的边界:
也就是某些技术问题, 或者功能需求, 目前还没人做,
或者还没做好的情况.

比如 香橙派硬件 (h618 处理器) 不支持 HDMI DDC/CI 功能,
比如 ibus 不支持在用户级别安装新的输入法 (只能在系统级别安装),
比如 flathub 不支持显示非英文,
比如 vite 编译生成的文件无法直接在本地用浏览器打开 (必须用 HTTP 服务器),
比如 deno 不支持 Android, 比如 deno vendor 不支持 npm 前缀 .. .

如今又遇到了:
vuetify 组件库不支持在 Web Components (custom element) 中使用,
vite 的 lib 编译模式不支持不在 CSS 中以 base64 嵌入字体文件.

这难道是 班尼特 同款体质 ??
到处都是坑, 不遇到坑才不正常呢.
不过, 乐观的想, 这也方便水文章不是,
永远不用担心缺素材没东西写,
因为素材它会迫不及待的主动找上门 !
哈哈 ~

----

最近特别火的不是 AI 取代程序员嘛.
对此窝想说的是, 在 **正常** 写代码方面能够替代人类, 这并不算很厉害.
要想彻底取代人类, AI 至少需要能够解决这些各种坑.
加油吧, AI !

### 4.1 vue 动态元素名称

vue 框架的一个特点就是, 在大部分简单功能的场景,
vue 框架通常比别的框架更简单.
但是遇到需要较高动态, 更高灵活度的场景, vue 反而会比较麻烦.

因为皮肤可以动态更换和加载,
所以皮肤组件对应的 HTML 元素名称 (custom element),
在写代码的时候 (编译时) 是不知道的, 只有到了运行时,
通过用户的配置动态加载, 才能知道.
所以, 需要 vue 能够动态渲染 HTML 元素的名称.

这个功能, 窝在 vue 单文件组件 (SFC, 也就是 `.vue` 文件, `<template>` 部分)
之中是没有找到的.
虽然 vue 提供了很多动态功能, 比如动态属性名称, 动态 slot 名称,
但就是没有动态元素名称.
尝试了在 `<template>` 中写 `<component :is="元素名称">`, 但是失败了.

不过没关系, 并不是 vue 框架没有这个能力, 只是需要用更加麻烦的方式来实现:
手写渲染函数 (render).
源代码文件 `pmim-ibus/ui-vue/src/c/皮肤.js`:

```js
// vue 组件: 用于加载皮肤 (动态 custom element, Web Components)
import { h } from "vue";
import { 使用皮肤 } from "../皮肤/hook.js";

export default {
  props: {
    能力: String,
    on加载: Function,
  },
  setup(props, { attrs }) {
    const 皮肤 = 使用皮肤(props.能力);

    async function on加载(e) {
      await 皮肤.加载(e.srcElement);

      if (null != props.on加载) {
        await props.on加载(e);
      }
    }

    // 渲染函数 (render): 动态传递所有属性和事件
    return () =>
      皮肤.已加载.value
        ? h(皮肤.组件名称.value, {
          "data-ce": 皮肤.组件名称.value,
          key: 皮肤.组件名称.value,
          on加载,

          ...attrs,
        })
        : h("div", { class: "to-load" });
  },
};
```

没错, 这也是一个 vue 组件, 只不过是手写的
(平时常用的 单文件组件 `.vue` 是由编译器来转换成类似的代码).
其 `setup()` 函数最后返回的是一个渲染函数.

在渲染函数中使用 `h()` 来实现动态 HTML 元素名称.
同时动态传递所有属性 (props) 和事件 (emit).
动态传递的意思是, 这个组件不知道上级组件会给它什么属性和事件,
但是要全部原样传递给下级组件 (Web Components).

### 4.2 修复 vuetify

相关链接:
+ <https://vuetifyjs.com/>
+ <https://github.com/vuetifyjs/vuetify/issues/5054>
+ <https://stackoverflow.com/questions/69808113/how-to-use-vue-router-and-vuex-inside-custom-element-from-root/69820280>

vuetify 是一个 vue 框架的 Material Design 风格的组件库.
也就是有一些 按钮, 选择器, 卡片 等常用的用户界面组件,
可以简单容易的组装出来比较美观的用户界面.
选择 Material Design (而不是 ant design) 的主要理由是,
Material Design 同时适用于 PC 和手机 (ant design 不适用于手机),
也就更容易实现跨平台的用户界面
(一套代码, PC 和手机都能用, 并且基本上不需要费力适配).

然而, vuetify 不支持在 Web Components (custom element) 中使用 (详见 #5054),
github issue 都 6 年了, 这个问题没解决.
官方不给力, 那么只能想办法自力更生啦.

参考了网上找到的解决方案, 源代码文件 `pmim-ibus/uis/pmim-uis-nc/src/util/fixVuetify.js`:

```js
// 修复在 Web Components (vue customElement) 中使用 vuetify 的 BUG
// (方法 2)
import { createApp, getCurrentInstance } from "vue";
import vuetify from "../plugin/vuetify.js";

// setup()
export function fixVuetify() {
  // 插件列表
  const plugins = [
    vuetify,
  ];

  // 创建假的 app 实例, 并安装插件
  const app = createApp();
  // 不要把 vuetify theme 直接放到 <head> 中
  // 摸拟 unhead 接口
  app._context.provides.usehead = {
    push(head) {
      // TODO
      return {
        patch(head) {
          // TODO
        },
      };
    },
  };

  // 安装插件
  plugins.forEach(app.use);
  // 复制插件
  const i = getCurrentInstance();
  Object.assign(i.appContext, app._context);
  Object.assign(i.provides, app._context.provides);
}
```

vuetify 使用的时候, 要求安装 vue 插件,
但是 vue custom element 不支持这个功能.
所以就创建一个假的 vue app 实例, 通过欺骗 vuetify 完成初始化,
然后把结果复制给当前组件.

vuetify 还有一个不适合 Web Components 的行为,
就是直接在 `<head>` 中插入 CSS 样式 (`<style>`).
对于 Web Components 来说, `<style>` 应该放到 `shadowRoot` 中.
所以此处通过模拟 `unhead` 的接口,
再次欺骗 vuetify 避免它把 CSS 样式放到 `<head>` 中.
(赢两次 !!
撒花 ~~)

### 4.3 修复 fontface 加载字体文件 (custom element)

相关链接:
+ <https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face>
+ <https://developer.mozilla.org/en-US/docs/Web/API/FontFace>
+ <https://www.npmjs.com/package/@mdi/font>
+ <https://github.com/mdn/interactive-examples/issues/887>
+ <https://github.com/w3c/csswg-drafts/issues/1995>
+ <https://github.com/WICG/webcomponents/issues/925>
+ <https://github.com/web-platform-tests/interop/issues/212>
+ <https://github.com/open-pioneer/trails-starter/issues/83>

CSS 的 `@font-face` 可以用于加载自定义字体文件.
此处使用了 npm 包 `@mdi/font`,
也就是 "Webfont distribution for the Material Design Icons".
也就是使用自定义字体来显示界面上的各种图标,
这是 web 前端很常用的一种技术.

Web Components 目前来说, 还是一种不太成熟的技术.
在 Web Components (shadowRoot) 中, 不支持 `@font-face` 加载自定义字体文件.
这是一个 chromium 浏览器的 10 年前 (2014) 的 BUG, 到现在没修好.

目前的临时解决方法是, 在页面中加载字体文件, 然后供 Web Components 使用.
也就是说, Web Components 里面无法加载字体文件, 只能在外面加载.

源代码文件 `pmim-ibus/ui-vue/src/皮肤/util.js` (有省略):

```js
export function onLoad(e) {
  return new Promise((resolve, reject) => {
    e.addEventListener("load", resolve);
    e.addEventListener("error", reject);
  });
}

export async function 加载js(插件) {
  const 入口 = 插件.描述.皮肤.入口;
  // 修复 js 运行环境
  window.process = {
    env: {},
  };

  const e = document.createElement("script");
  e.src = `/plugin/${插件.id}/${入口}`;
  document.head.appendChild(e);

  // 加载字体
  const fontface = 插件.描述.皮肤.fontface;
  if (null != fontface) {
    for (let i of fontface) {
      // 替换路径
      const src = i.src.split("static/").join(`/plugin/${插件.id}/`);

      const f = new FontFace(i.family, src, i.desc);
      document.fonts.add(f);
    }
  }
  // 等待 js 加载
  await onLoad(e);
}
```

比如, 加载皮肤 (暖橙) 时, 首先创建 `<script src="xxx">`
来加载皮肤的 `pmim-uis-nc.js` 代码文件.
然后通过 `new FontFace()` 以及 `document.fonts.add()`
来加载皮肤所需的字体文件.

----

正常情况下, 本应该在 Web Components 里面加载字体文件,
这样就不会影响到外面的页面.

但是现在因为 chromium 浏览器的 BUG, 不得不在外面加载字体文件,
这就会造成一个问题:
如果 Web Components 需要的字体文件, 和页面使用的字体文件重名
(`font-family` 名称冲突) 了, 那就故障了.

所以, 还需要额外重命名字体, 来避免名称冲突.
源代码文件 `pmim-ibus/uis/patch/fix_font_name.js`:

```js
// pmim-ibus/uis/patch/fix_font_name.js
//
// 命令行示例:
// > deno run -A fix_font_name.js node_modules/@mdi/font/css/materialdesignicons.css pmim-ui

const N = "Material Design Icons";

const 文件 = Deno.args[0];
const 名称 = Deno.args[1];
const 内容 = await Deno.readTextFile(文件);

const 文本 = 内容.split(N).join(名称 + " " + N);
await Deno.writeTextFile(文件, 文本);
```

这个脚本会修改文件 `node_modules/@mdi/font/css/materialdesignicons.css`, 修改前:

```css
@font-face {
  font-family: "Material Design Icons";
```

修改后:

```css
@font-face {
  font-family: "pmim-ui Material Design Icons";
```

通过脚本 (命令行) 在编译过程中自动修改相应的文件.

----

然后又顺便发现了另一个问题:
`@mdi/font` 打包字体文件的大小.

```sh
> ls -lh node_modules/@mdi/font/fonts
总计 3.5M
-rw-r--r-- 1 s2 s2 1.3M  3月20日 19:16 materialdesignicons-webfont.eot
-rw-r--r-- 1 s2 s2 1.3M  3月20日 19:16 materialdesignicons-webfont.ttf
-rw-r--r-- 1 s2 s2 575K  3月20日 19:16 materialdesignicons-webfont.woff
-rw-r--r-- 1 s2 s2 394K  3月20日 19:16 materialdesignicons-webfont.woff2
```

可以看到, `@mdi/font` 自带了多种格式的字体文件,
其中 `woff2` 格式的字体文件是最小的.
这几个字体文件的内容是完全一样的, 只是格式不同, 也就是只需要一个即可.

默认情况下, 编译打包的时候, 会把这些字体文件全部打包进去,
这是为了浏览器兼容.
但是对于本拼音输入法这种场景, 这是完全没有必要的.
因为可以确定 chromium (electronjs) 浏览器支持 woff2 字体文件,
不需要考虑别的浏览器 (版本).
所以全部打包只会增加大小, 完全没用.

文件 `pmim-ibus/uis/patch/1.patch`:

```patch
diff '--color=auto' -ru tmp/0 tmp/1
--- tmp/0/materialdesignicons.css	2024-03-20 15:18:08.264132544 +0800
+++ tmp/1/materialdesignicons.css	2024-03-20 15:18:45.035411188 +0800
@@ -1,8 +1,7 @@
 /* MaterialDesignIcons.com */
 @font-face {
   font-family: "Material Design Icons";
-  src: url("../fonts/materialdesignicons-webfont.eot?v=7.4.47");
-  src: url("../fonts/materialdesignicons-webfont.eot?#iefix&v=7.4.47") format("embedded-opentype"), url("../fonts/materialdesignicons-webfont.woff2?v=7.4.47") format("woff2"), url("../fonts/materialdesignicons-webfont.woff?v=7.4.47") format("woff"), url("../fonts/materialdesignicons-webfont.ttf?v=7.4.47") format("truetype");
+  src: url("../fonts/materialdesignicons-webfont.woff2?v=7.4.47") format("woff2");
   font-weight: normal;
   font-style: normal;
 }
```

所以在编译之前应用这个 patch, 把别的字体文件都去掉, 只留下 `woff2`.

### 4.4 修复 vite lib 编译

相关链接: <https://github.com/vitejs/vite/issues/4454>

vite 以 lib 模式编译 (详见 3.1 章节) 时,
会生成一个 js 文件和一个 css 文件:

```sh
> find uis/pmim-uis-nc/dist
uis/pmim-uis-nc/dist
uis/pmim-uis-nc/dist/pmim-uis-nc.js
uis/pmim-uis-nc/dist/style.css
```

此时会把引用的所有资源文件, 都通过 base64 编码之后,
内嵌到 js 和 css 文件之中.
比如 CSS 中通过 `@font-face` 引用的字体文件, 也会以 base64 编码内嵌.
如果不想让 vite 内嵌字体文件呢 ?
啊, 那不好意思, 不支持.
这个是 vite 的 issue (#4454), 3 年了没有解决.

此处的需求是, 必须不能内嵌字体文件.
上面已经说了, `@font-face` 在 Web Components 之中无法加载字体文件,
这个是 chromium 浏览器的 BUG.
所以这里 vite 内嵌的字体文件完全没用, 加载不了.

解决方案如下 (文件 `pmim-ibus/uis/patch/2.patch`):

```patch
diff '--color=auto' -ru tmp/0 tmp/2
--- tmp/0/materialdesignicons.css	2024-03-20 15:18:08.264132544 +0800
+++ tmp/2/materialdesignicons.css	2024-03-20 15:20:00.784062762 +0800
@@ -1,8 +1,6 @@
 /* MaterialDesignIcons.com */
 @font-face {
   font-family: "Material Design Icons";
-  src: url("../fonts/materialdesignicons-webfont.eot?v=7.4.47");
-  src: url("../fonts/materialdesignicons-webfont.eot?#iefix&v=7.4.47") format("embedded-opentype"), url("../fonts/materialdesignicons-webfont.woff2?v=7.4.47") format("woff2"), url("../fonts/materialdesignicons-webfont.woff?v=7.4.47") format("woff"), url("../fonts/materialdesignicons-webfont.ttf?v=7.4.47") format("truetype");
   font-weight: normal;
   font-style: normal;
 }
```

没错, 把 `src` 全部删掉, 这样就没有了对字体文件的引用,
vite 编译后的 css 文件也就不会再内嵌字体文件 !
等会儿, 没有 `src` 这不太正常吧 ?
所以 (文件 `pmim-ibus/uis/patch/fix_css_font.js`):

```js
// pmim-ibus/uis/patch/fix_css_font.js
//
// 命令行示例:
// > deno run -A fix_css_font.js dist/style.css

const A = `@font-face{`;
//const A = `font-family:Material Design Icons;`;
const B =
  `src: url("./materialdesignicons-webfont.woff2?v=7.4.47") format("woff2");`;

const 文件 = Deno.args[0];
//const 名称 = Deno.args[1];
const 内容 = await Deno.readTextFile(文件);

const 文本 = 内容.split(A).join(A + B);
await Deno.writeTextFile(文件, 文本);
```

嗯, 编译之后再把 `src` 给添加回去 !
完美绕过 vite (撒花 ~~)

### 4.5 最终结果

处理了上面一系列糖葫芦串一样的奇怪大坑之后,
我们可爱的皮肤终于能够正常运行了.

自动化编译脚本 (文件 `pmim-ibus/Makefile`):

```makefile
# pmim-ibus/Makefile

# 完整的编译过程
.PHONY: build
build: install_patch build_ui build_lo build_uis_nc build_uis_bl

# npm install 并且修改依赖的代码
.PHONY: install_patch
install_patch: install_patch_ui install_patch_uis_nc install_patch_uis_bl

.PHONY: install_patch_ui
install_patch_ui:
	cd ui-vue && npm install
	cd ui-vue/node_modules/@mdi/font/css && patch -p2 < ../../../../../uis/patch/1.patch
	deno run -A uis/patch/fix_font_name.js ui-vue/node_modules/@mdi/font/css/materialdesignicons.css pmim-ui

.PHONY: install_patch_uis_nc
install_patch_uis_nc:
	cd uis/pmim-uis-nc && npm install
	cd uis/pmim-uis-nc/node_modules/@mdi/font/css && patch -p2 < ../../../../../patch/2.patch
	deno run -A uis/patch/fix_font_name.js uis/pmim-uis-nc/node_modules/@mdi/font/css/materialdesignicons.css pmim-uis-nc

.PHONY: install_patch_uis_bl
install_patch_uis_bl:
	cd uis/pmim-uis-bl && npm install
	cd uis/pmim-uis-bl/node_modules/@mdi/font/css && patch -p2 < ../../../../../patch/2.patch
	deno run -A uis/patch/fix_font_name.js uis/pmim-uis-bl/node_modules/@mdi/font/css/materialdesignicons.css pmim-uis-bl

.PHONY: build_ui
build_ui:
	cd ui-vue && npm run build

.PHONY: build_lo
build_lo:
	cd ui-vue/dist && ln -s assets/lo1-*.js lo1.js
	cd ui-vue && npx webpack
	rm ui-vue/dist/lo1.js
	cd ui-vue && deno run --allow-read lo/fix.js dist/lo1/index.html > dist/lo/index.html

.PHONY: build_uis_nc
build_uis_nc:
	cd uis/pmim-uis-nc && npm run build
	cp uis/pmim-uis-nc/node_modules/@mdi/font/fonts/materialdesignicons-webfont.woff2 uis/pmim-uis-nc/dist
	deno run -A uis/patch/fix_css_font.js uis/pmim-uis-nc/dist/style.css

.PHONY: build_uis_bl
build_uis_bl:
	cd uis/pmim-uis-bl && npm run build
	cp uis/pmim-uis-bl/node_modules/@mdi/font/fonts/materialdesignicons-webfont.woff2 uis/pmim-uis-bl/dist
	deno run -A uis/patch/fix_css_font.js uis/pmim-uis-bl/dist/style.css

# 复制插件文件
.PHONY: plugin
plugin:
	mkdir -p plugin/pmim-uis-nc/static && cp -r uis/pmim-uis-nc/dist/* plugin/pmim-uis-nc/static
	mkdir -p plugin/pmim-uis-bl/static && cp -r uis/pmim-uis-bl/dist/* plugin/pmim-uis-bl/static
```

编译之后的皮肤文件 (暖橙):

```sh
> find uis/pmim-uis-nc/dist
uis/pmim-uis-nc/dist
uis/pmim-uis-nc/dist/pmim-uis-nc.js
uis/pmim-uis-nc/dist/style.css
uis/pmim-uis-nc/dist/materialdesignicons-webfont.woff2
```

动态加载的皮肤信息 (文件 `pmim-ibus/plugin/pmim-uis-nc/pmimp.json`):

```json
{
  "pmim_version": "0.1.0",
  "插件信息": {
    "名称": "暖橙 (胖喵拼音内置皮肤)",
    "描述": "冬日里的一缕温暖 ~~",
    "版本": "0.1.0",
    "URL": "https://github.com/fm-elpac/pmim-ibus"
  },
  "默认启用": 1,

  "皮肤": {
    "入口": "pmim-uis-nc.js",
    "名称": "pmim-uis-nc",
    "能力": ["im0", "im1", "im2", "conf"],

    "css": ["style.css"],
    "fontface": [
      {
        "family": "pmim-uis-nc Material Design Icons",
        "src": "url(\"static/materialdesignicons-webfont.woff2?v=7.4.47\") format(\"woff2\")",
        "desc": {
          "weight": "normal",
          "style": "normal"
        }
      }
    ]
  }
}
```

加载皮肤的时候, 根据用户配置选择相应的皮肤, 加载皮肤信息.
然后首先加载 js 代码文件 (`pmim-uis-nc.js`),
紧接着加载字体文件 (`materialdesignicons-webfont.woff2`),
最后加载 css 样式文件 (`style.css`).
然后相应的皮肤就显示出来啦 !
撒花 ~


## 5 总结与展望

本来是挺简单的事情, 但是因为坑太多, 导致整个过程曲折了很多
(也导致本文长了很多).
选择 Web Components 技术, 在享受 Web Components 好处的同时,
也付出了相应的代价.
谁能想到, chromium 的老 BUG 历经 10 年还没修好,
vuetify 的问题 6 年没解决, vite 的问题 3 年没解决,
这些又扎堆儿一起出现 !
不知道为什么, 一大堆 BUG 它围绕着窝.
每天浸泡在 BUG 的海洋之中, 这或许也是一种生活方式吧.

有了 Web Components 的隔离和封装, 皮肤成为了相对独立的模块,
可以单独安装替换, 动态加载.
基于 Web Components 定义了皮肤和主程序之间的清晰简单的接口.
Web Components 并不限制具体的技术栈,
也就是说, 可以不必使用 vue 框架来制作皮肤,
使用别的框架也可以, 甚至完全不使用框架 (只使用 js, css) 也行.
所以在制作皮肤方面就有了很大的灵活度.
目前皮肤本身的能力也很大, 皮肤模块可以完全决定显示的外观,
甚至决定一部分交互逻辑.
在 web 技术的基础上, 有很大的想像空间.

未来将支持用户自行安装使用新的皮肤, 并且想办法进一步简化皮肤的制作.

----

本文使用 CC-BY-SA 4.0 许可发布.
