# 使用 WebRTC 实现局域网投屏: PC (GNOME ArchLinux) -> 平板 (Android)

**投屏** (screen cast) 就是把屏幕内容显示到另一个设备上.
比如在 手机/平板 上查看 PC 屏幕的显示内容, 通常在 **局域网** 中使用.

另一个接近的概念是 "远程桌面", 也涉及到查看屏幕内容.
区别是, 投屏只涉及显示屏幕内容 (输出), 而没有 **控制输入** (比如通过 鼠标/键盘 去进行操作).
所以投屏在技术上更简单一些.

**WebRTC** 是一套 **浏览器** 自带的功能 (API).
使用 WebRTC 来实现投屏比较简单, 无需安装额外的软件 (只需 浏览器 即可). 并且只要写大约 300 行 js 代码即可实现.

这里是 (希望消除 稀缺 的) 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 89 号作品. )

----

相关文章:

+ 《在 Android 设备上写代码 (Termux, code-server)》

  TODO

+ 《低功耗低成本 PC (可更换内存条) 推荐 (笔记本, 小主机)》

  TODO

+ 《小水滴系列文章目录 (整理)》

  TODO

参考资料:

+ <https://webrtcforthecurious.com/>
+ <https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API>
+ <https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia>
+ <https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints>
+ <https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection>
+ <https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpSender>
+ <https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpSender/getParameters>
+ <https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpSender/setParameters>
+ <https://webrtc.github.io/samples/>
+ <https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/>
+ <https://webrtc.github.io/samples/src/content/peerconnection/channel/>
+ <https://docs.deno.com/runtime/fundamentals/http_server/>
+ <https://www.gnome.org/zh-CN/>
+ <https://download.cnet.com/microsoft-remote-desktop/3000-2064_4-76128624.html>


## 目录

+ 1 WebRTC 简介

+ 2 软件的主要设计

  - 2.1 信令服务器
  - 2.2 web 页面 (浏览器网页)

+ 3 测试运行

  - 3.1 浏览器调试工具

+ 4 总结与展望

+ 附录 1 完整源代码

+ 附录 2 另一种投屏方式: GNOME RDP + 微软远程桌面 (免费软件)


## 1 WebRTC 简介

**WebRTC** (Web Real-Time Communication) 是一套通过 **浏览器** 收发 **实时** 音频/视频 等数据的技术.
WebRTC 没有自己从头再弄一套新的技术, 而是充分利用了当时已经存在的技术, 通过一大堆技术 "搭积木" 的方式, 最终组装出来了一套满足需求的技术.

WebRTC 使用 (包含) 的技术 (网络通讯协议) 有:

+ **SDP** (Session Description Protocol) 会话描述协议.

  这个用于 **信令** (signal) 交换阶段. WebRTC 是 2 端建立连接, 互相发送 音/视频. SDP 就是具体描述一下每一端的情况, 比如要发送几个视频流, 几个音频流, 几个 **数据通道** (data channel), 支持的音视频编解码格式, IP 地址 等, 方便建立连接.

+ **ICE** (Interactive Connectivity Establishment) 交互连接建立.

  WebRTC 希望 2 端可以尽量 **直接** 建立连接, 数据不需要经过中间服务器的转发.
  但是现实网络环境十分复杂, 特别是 IPv4 网络可能使用了很多层的 NAT, 很多设备没有公网地址, 只有内网地址, 此时 2 端直接连接就很困难.
  ICE 就是用来解决这个复杂问题的, 配合 STUN/TURN, ICE 将尝试 2 端建立连接的各种可能情况, 直到发现一条最佳连接通路.

+ **STUN** (Session Traversal Utilities for NAT) 用于 NAT 的会话穿越工具, 其中:
  **NAT** (Network Address Translation) 网络地址转换.

  如果 2 端都在 NAT 后面, 都没有公网 IP 地址, 那么 TCP 直接连接是不可能的.
  但如果有一个公网地址的 STUN 服务器, 可以尝试进行 UDP "打洞".
  2 端都向 STUN 服务器发送请求, STUN 服务器返回 "反射" 地址, 也就是从 STUN 服务器看到的公网 IP 地址和 UDP 端口号, 然后尝试连接.

  NAT 有多种不同的具体类型 (配置), 有些可以有些不可以, 所以 STUN "打洞" 不一定能成功.

+ **TURN** (Traversal Using Relays around NAT) 对 NAT 使用中继的穿越.

  如果 STUN 尝试 "打洞" 失败了, 此时还剩一种不得已的最后连接方式: 通过服务器转发数据. 这就是 TURN.

+ **DTLS** (Datagram Transport Layer Security) 数据报传输层安全.

  保障数据安全的加密协议. TLS 协议用于 TCP 连接的加密 (比如 HTTPS), 类似的, DTLS 用于 UDP 数据的加密.

+ **SRTP** (Secure Real-Time Transport Protocol) 安全实时传输协议.

  对 RTP 加密的协议.

+ **RTP** (Real-time Transport Protocol) 实时传输协议.

  用来传输 音频/视频 数据, 为 **实时** 工作状况优化, 确保低延迟.

+ **RTCP** (RTP Control Protocol) RTP 控制协议.

  RTP 本身只负责承载 音频/视频 数据, 相关的控制数据需要通过 RTCP 来传输.
  RTCP 一般和 RTP 同时使用.

+ **SCTP** (Stream Control Transmission Protocol) 流控制传输协议.

  上面的 SRTP/RTP/RTCP 只能用来传输 音频/视频 数据, 为了实时, 所以是 **不可靠** 传输的, 也就是允许丢包, 不保证数据一定送达. 因为超出时间 (实时) 限制的数据, 比如 10 秒之前的视频画面, 没有意义.

  而 SCTP 用于 WebRTC 的 **可靠** 数据传输, 也就是 数据通道 (data channel) 的数据.

----

可以看到, WebRTC 里面有这么多一大堆东西, 所以还是比较复杂的.
有点像各种手脚嘴眼胡乱拼接起来的克苏鲁丧尸.
此处不再介绍每种协议里面的具体细节, 如果感兴趣可以自行深入了解.

推荐学习资料: <https://webrtcforthecurious.com/>


## 2 软件的主要设计

本文希望实现局域网内的投屏功能, 更具体的说, 是
PC (操作系统 ArchLinux, 桌面环境 GNOME) -> 平板 (Android) 的投屏.

WebRTC 是浏览器内置的功能, 所以首先要写一个 web 页面, 用 js 实现大部分主要功能. 发送端 (PC, Chromium 浏览器) 是一个网页, 接收端 (Android) 也是一个网页.

WebRTC 会用到 **信令** (signal) 服务器, 所以还需要写一个服务端.

### 2.1 信令服务器

信令数据, 也就是 SDP 具体如何发送, WebRTC 没有定义, 可以自己选择具体的方式. 比如可以使用 WebSocket.

但是为了更简单, 此处选择通过 HTTP 实现一个简单的 消息队列.
服务端使用 deno 运行环境, 代码也是 js.

消息队列的实现如下:

```js
// 消息队列: 名称(str) -> [ 数据(str) ]
const Q = new Map();

// 读取 POST 请求发送的数据
async function body(req) {
  if (req.body) {
    return await req.text();
  }
}

// 返回 405
function r405() {
  return new Response("405", {
    status: 405,
  });
}

// POST/PUT /q
// 清空(读)/追加(写) 模拟 消息队列
async function aQ(req, method, q) {
  if ("POST" == method) {
    // 读取 (清空消息队列)
    if (Q.has(q)) {
      const v = Q.get(q);
      Q.set(q, []);

      return new Response(JSON.stringify(v));
    }
    return new Response(JSON.stringify([]));
  } else if ("PUT" == method) {
    // 写入 (追加)
    if (!Q.has(q)) {
      Q.set(q, []);
    }
    const o = Q.get(q);

    const v = await body(req);
    o.push(v);
    return new Response(o.length);
  }

  return r405();
}
```

用 `PUT` 请求向消息队列写入数据, 用 `POST` 请求从消息队列读取.
每条消息只能读取一次.

支持多个消息队列, 用名称 (URL 参数 `q`) 区分.

HTTP 服务端的路由如下:

```js
// 启动 deno HTTP 服务器
Deno.serve(async (req) => {
  const { method, url } = req;
  const r = new URL(url);
  const p = r.pathname;

  // 请求日志
  console.log(method, p);

  // 路由
  if ("/q" == p) {
    return await aQ(req, method, r.searchParams.get("q"));
  } else if ("/stun" == p) {
    return await aStun(req, method);
  } else if (null != F[p]) {
    return await rFile(F[p]);
  }

  return r404();
});
```

为了简单, 没有使用服务端框架, 只使用了 deno 内置的 API.

### 2.2 web 页面 (浏览器网页)

这个页面没有使用前端框架 (比如 vue), 只使用了原始的 HTML + js.

HTML 部分很简单:

```html
  <body>
    <div class="v-box">
      <video id="v1" controls autoplay></video>
    </div>

    <div class="b-box">
      <button type="button" id="b1">连接</button>
    </div>

    <script src="./1.js"></script>
  </body>
```

一个 `<video>` 标签, 一个 `连接` 按钮, 以及使用 `<script>` 引入主要代码 (js).

这个 `<video>` 标签用来显示 WebRTC 传输过来的视频, 也就是投屏的内容. `autoplay` 启用自动播放. `controls` 启用浏览器自带的视频播放控件, 这样就可以使用 `全屏` 功能.

嗯, 一切为了简单.

----

接下来是主要代码 (js), 在这里实现 WebRTC 投屏功能.

首先对服务端 (信令服务器) 的 消息队列 功能进行封装, 方便使用:

```js
  // 浏览器页面 URL /?send=1
  // 判断是否 发送端
  function getSend() {
    const q = new URLSearchParams(location.search);
    console.log("q", q);

    return 1 == q.get("send");
  }

  // 消息队列 (封装)
  function makeQ(isSend) {
    // 消息队列名称
    const [local, remote] = isSend ? ["send", "recv"] : ["recv", "send"];

    // 追加 (写入)
    async function aQ1(q, body) {
      const r = await fetch("/q?q=" + q, {
        method: "PUT",
        body,
      });
      return await r.text();
    }

    // 清空 (读取)
    async function aQ2(q) {
      const r = await fetch("/q?q=" + q, {
        method: "POST",
      });
      const o = await r.text();
      return JSON.parse(o);
    }

    // 写入一条数据
    async function add(data) {
      // DEBUG
      console.log("q.add", data);

      await aQ1(local, JSON.stringify(data));
    }

    // 读取所有数据, 并清空
    async function clear() {
      const r = await aQ2(remote);
      const o = r.map(JSON.parse);

      // DEBUG
      for (const i of o) {
        console.log("q.remote", i);
      }

      return o;
    }

    // 清空 自己队列的所有数据 (页面初始化)
    async function self() {
      await aQ2(local);
    }

    return {
      add,
      clear,
      self,
    };
  }
```

代码根据 发送端 / 接收端 分别进行不同的处理.
一共使用 2 个消息队列, 发送端 发出的消息放入 `send` 队列, 接收端 发出的消息放入 `recv` 队列.

读取的时候, 读取对方的消息队列.
也就是实现了 2 端互相发送消息的功能.

----

然后是 发送端 的特殊处理:

```js
  // 捕获屏幕画面
  async function getScreenVideo() {
    console.log("getScreenVideo()");

    const s = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always",
        //frameRate: 60,
        frameRate: 100,
      },
      audio: true,
    });
    console.log("s", s);

    return s;
  }
```

通过调用浏览器的 `navigator.mediaDevices.getDisplayMedia` API 来请求捕获屏幕内容.

其中 `cursor: "always"` 表示捕获的视频流里面显示 鼠标指针.

`frameRate: 100` 用来指定请求捕获的帧率, 如果不指定, 默认帧率是 30fps.
这边的显示器是 100Hz 刷新率, 因为希望投屏高帧率, 所以此处指定为 100.

----

接下来对 WebRTC 进行初始化:

```js
  async function initRTC(q) {
    const urls = "stun:" + await aStun();
    console.log("initRTC", urls);

    const pc = new RTCPeerConnection({
      iceCandidatePoolSize: 16,
      iceServers: [{
        urls,
      }],
    });

    // 必需处理
    pc.onicecandidate = async (event) => {
      console.log("pc.onicecandidate", event);

      const m = ["candidate", event.candidate];
      await q.add(m);
    };

    pc.onicegatheringstatechange = async (event) => {
      console.log("pc.onicegatheringstatechange", event);

      // 省略
    };

    // 省略

    return pc;
  }
```

首先创建 `RTCPeerConnection`, 这是一个很重要的 WebRTC API, 后续的很多操作都要用到这个. 创建时可以指定使用的 STUN 服务器的地址 (对于 局域网 也可以不使用).

然后, 当收到 `icecandidate` 事件时, 通过 信令服务器 (消息队列) 把 `candidate` 数据发送给对方.

注意, 这一步 **非常重要** ! 如果缺少这个, WebRTC 的 2 端可能一直连接不上 (超时失败). (当时调试了这个 BUG 很久)

----

初始化大约就这些, 然后是点击 `连接` 按钮后才执行的代码:

```js
  const v1 = document.getElementById("v1");
  const b1 = document.getElementById("b1");

  const isSend = getSend();
  const q = makeQ(isSend);
  const pc = await initRTC(q);

  async function connect() {
    console.log("connect()");

    // 禁用 按钮
    b1.disabled = true;

    if (isSend) {
      await startSend();
    } else {
      await startRecv();
    }
  }

  // 清空 可能遗留的数据
  await q.self();

  // 启动按钮
  b1.addEventListener("click", connect);
```

点击按钮之后, 根据 发送端 / 接收端 分别进行不同的处理.

----

发送端 代码如下:

```js
  async function startSend() {
    console.log("startSend()");

    const s = await getScreenVideo();
    // 本地回显
    v1.srcObject = s;

    // 发送视频
    s.getTracks().forEach((i) => {
      debugTrack(i);

      pc.addTrack(i, s);
    });

    // 省略

    // offer
    const offer = await pc.createOffer();
    await q.add(["offer", offer]);

    await pc.setLocalDescription(offer);

    //setupTimer();
    await pullRemote(pc, q);
  }
```

首先请求捕获屏幕的视频流, 成功之后, 在自己的 `<video>` 标签上回显 (方便调试).

然后调用 `pc.addTrack` 通过 WebRTC 发送视频流.

设置好之后, 调用 `pc.createOffer` 创建 发送端 的 SDP, 并通过 信令服务器 发送给对方.

然后调用 `pc.setLocalDescription` 完成初始化.
然后进入 "主事件循环", 等待并处理对方 (通过 信令服务器) 发来的消息.

----

接收端 代码如下:

```js
  async function startRecv() {
    console.log("startRecv()");

    // 接收视频
    pc.ontrack = (event) => {
      console.log("pc.ontrack", event, event.streams);

      v1.srcObject = event.streams[0];
    };

    debugCodec();
    //setupTimer();
    await pullRemote(pc, q);
  }
```

接收端 的处理更简单, 当收到 `track` 事件时, 表示对方通过 WebRTC 发来了视频流, 就在自己的 `<video>` 标签上显示出来.

----

然后就是 "主事件循环", 接收对方 (通过 信令服务器) 发来的消息, 并进行处理:

```js
  // async
  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  // 响应对方发出的消息
  async function pullRemote(pc, q) {
    console.log("pullRemote()");

    while (true) {
      const r = await q.clear();
      for (const [t, i] of r) {
        if ("candidate" == t) {
          await pc.addIceCandidate(i);
        } else if ("offer" == t) {
          // 发送方 发来 SDP
          await pc.setRemoteDescription(i);

          const answer = await pc.createAnswer();
          await q.add(["answer", answer]);

          await pc.setLocalDescription(answer);
        } else if ("answer" == t) {
          // 接收方 发来 SDP
          await pc.setRemoteDescription(i);
        }
      }

      await sleep(1000);
    }
  }
```

为了简单, 整体上使用 HTTP **轮询** (poll) 来实现.

一共有 3 种消息:

+ (1) 收到 `candidate` 时, 调用 `pc.addIceCandidate`. 这个其实是告诉 ICE 对方可能的地址, 用于建立连接.

+ (2) 收到 `offer` 时, 调用 `pc.setRemoteDescription` 设置 发送端 的 SDP, 然后调用 `pc.createAnswer` 创建自己的 SDP, 并发送给对方. 最后调用 `pc.setLocalDescription` 完成初始化. 这段代码只有 接收端 才可能执行.

+ (3) 收到 `answer` 时, 调用 `pc.setRemoteDescription`. 这段代码只有 发送端 才可能执行.

----

最后, 还有一段设置 发送端 视频 **码率** 的代码:

```js
    pc.onicegatheringstatechange = async (event) => {
      console.log("pc.onicegatheringstatechange", event);

      if ("complete" == pc.iceGatheringState) {
        for (const s of pc.getSenders()) {
          if (s.track && ("video" == s.track.kind)) {
            // DEBUG
            const p = s.getParameters();

            console.log("video sender", s, JSON.parse(JSON.stringify(p)));

            // set video encode param
            for (const i of p.encodings) {
              // 50Mbps
              i.maxBitrate = 50_000_000;
              // 100fps
              i.maxFramerate = 100;
              // high
              i.priority = "high";
              i.networkPriority = "high";
            }
            // TODO
            console.log("video p (0)", p);

            await s.setParameters(p);

            // TODO
            console.log("video p (1)", s.getParameters());
          }
        }
      }
    };
```

此处通过 `getParameters` 和 `setParameters` 成对的 API 来修改视频编码器的参数.

通过其中 `encodings.maxBitrate` 设置最大码率为 50Mbps.
注: 这边的局域网是 1Gbps (1000Mbps) 带宽, 所以设置这个码率绰绰有余.

其中 `encodings.maxFramerate` 设置最大帧率为 100fps.
且通过 `priority` 设置优先级为高.

至少能够确认这里的代码是 **部分** 生效的:
添加这段代码前, Chromium 浏览器发送的视频最大码率为 2.5Mbps, 添加这段代码后, 增加到 5Mbps.


## 3 测试运行

好了, 代码写好了, 下面可以尝试运行啦 !~~

首先, 安装所需软件包 (操作系统 ArchLinux):

```sh
sudo pacman -S chromium deno coturn
```

各主要软件的版本如下:

```sh
> uname -a
Linux S2L 6.19.8-zen1-1-zen #1 ZEN SMP PREEMPT_DYNAMIC Sat, 14 Mar 2026 01:07:31 +0000 x86_64 GNU/Linux
> gnome-shell --version
GNOME Shell 49.5
> chromium --version
Chromium 146.0.7680.153 Arch Linux
> turnserver --version
4.9.0
> deno --version
deno 2.7.7 (stable, release, x86_64-unknown-linux-gnu)
v8 14.6.202.9-rusty
typescript 5.9.2
```

----

启动 STUN 服务器:

```sh
turnserver -S -L 192.168.3.222 --log-file stdout
```

启动 信令服务器:

```sh
> env STUN=192.168.3.222 deno run --allow-net --allow-read --allow-env server.js
Listening on http://0.0.0.0:8000/ (http://localhost:8000/)
```

其中 `192.168.3.222` 是 PC (发送端) 的局域网 IP 地址.

----

然后在 PC 浏览器打开页面: `http://localhost:8000/?send=1`

![测试 (1)](./图/3-t-1.png)

点击 `连接` 按钮, 会弹出选择界面, 选择整个屏幕.
然后屏幕内容就会显示出来:

![测试 (2)](./图/3-t-2.png)

----

然后在平板 (Android) 浏览器打开页面: `http://192.168.3.222:8000`

![测试 (3)](./图/3-t-3.png)

点击 `连接` 按钮:

![测试 (4)](./图/3-t-4.png)

点击右下角的 "全屏" 按钮:

![测试 (5)](./图/3-t-5.png)

成功 ! 撒花 ~~ 这个就是用 WebRTC 实现的局域网投屏.

### 3.1 浏览器调试工具

在浏览器打开: `chrome://webrtc-internals/`

![测试 (31)](./图/31-t-1.png)

这里就能看到很多 WebRTC 的工作参数.

----

通过这个调试工具, 可以发现目前这个投屏实现的问题 (BUG):

虽然上面代码中, 设置了最大码率 50Mbps, 最大帧率 100fps.
但是 WebRTC 实际的发送码率, 只有大约 5Mbps, 发送帧率只有大约 50fps.

也就是说, 无法实现 **高码率**, **高帧率**.

主观使用体验: 延迟高 (卡), 画质差 (糊).

所以, 本文通过 WebRTC + 浏览器 实现的局域网投屏, 虽然实现简单, 也能用, 但并不好用, 只是属于勉强凑合能用的级别.


## 4 总结与展望

本文通过 WebRTC 和浏览器实现了简单的局域网投屏, 包括一个 HTML 页面, 和一个信令服务器 (deno).
一共只有大约 300 行 js 代码.

虽然这样实现的投屏, 简单, 也凑合能用, 但是画质差, 延迟高, 卡, 体验很不好.
属于一次 **失败** 的尝试.

虽然窝无法实现 高帧率, 高码率, 低延迟, 但是这并不能说明 WebRTC 和浏览器就做不到, 也可能是窝的问题.
窝并没有彻底弄清楚, 这到底是为什么 ?
如果有知道的网友, 还请多多指教 !

于是窝放弃了这个技术方案, 去尝试别的投屏技术了.


## 附录 1 完整源代码

文件 `webrtc-remote-screen/server.js`:

```js
// server.js
// webrtc-remote-screen deno HTTP 服务端
//
// env STUN=192.168.3.222 deno run --allow-net --allow-read --allow-env server.js

// 消息队列: 名称(str) -> [ 数据(str) ]
const Q = new Map();

// 静态文件列表
const F = {
  // URL (path): [本地文件路径, MIME 类型]
  "/": ["./test.html", "text/html; charset=utf-8"],
  "/test.html": ["./test.html", "text/html; charset=utf-8"],

  "/1.js": ["./1.js", "text/javascript; charset=utf-8"],
};

// 读取 POST 请求发送的数据
async function body(req) {
  if (req.body) {
    return await req.text();
  }
}

// 返回 404
function r404() {
  return new Response("404", {
    status: 404,
  });
}

// 返回 405
function r405() {
  return new Response("405", {
    status: 405,
  });
}

// 返回静态文件
async function rFile([path, mime]) {
  const f = await Deno.open(path, { read: true });

  return new Response(f.readable, {
    headers: {
      "content-type": mime,
    },
  });
}

// POST/PUT /q
// 清空(读)/追加(写) 模拟 消息队列
async function aQ(req, method, q) {
  if ("POST" == method) {
    // 读取 (清空消息队列)
    if (Q.has(q)) {
      const v = Q.get(q);
      Q.set(q, []);

      return new Response(JSON.stringify(v));
    }
    return new Response(JSON.stringify([]));
  } else if ("PUT" == method) {
    // 写入 (追加)
    if (!Q.has(q)) {
      Q.set(q, []);
    }
    const o = Q.get(q);

    const v = await body(req);
    o.push(v);
    return new Response(o.length);
  }

  return r405();
}

// GET /stun
// 读取环境变量 STUN 的值
async function aStun(req, method) {
  if ("GET" == method) {
    const v = Deno.env.get("STUN");
    return new Response(v);
  }

  return r405();
}

// 启动 deno HTTP 服务器
Deno.serve(async (req) => {
  const { method, url } = req;
  const r = new URL(url);
  const p = r.pathname;

  // 请求日志
  console.log(method, p);

  // 路由
  if ("/q" == p) {
    return await aQ(req, method, r.searchParams.get("q"));
  } else if ("/stun" == p) {
    return await aStun(req, method);
  } else if (null != F[p]) {
    return await rFile(F[p]);
  }

  return r404();
});
```

文件 `webrtc-remote-screen/test.html`:

```html
<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="utf-8" />
    <title>webrtc-remote-screen</title>
    <style type="text/css">
      body {
        background-color: #ddd;
      }

      .v-box, .b-box {
        margin: 32px;
      }

      .v-box {
        width: 1280px;
        height: 720px;

        border: solid 8px lightgreen;
        border-radius: 8px;

        background-color: black;

        position: relative;
        top: 0;
        left: 0;
      }

      .v-box video {
        width: 100%;
        height: 100%;
      }

      .v-box #t1 {
        position: absolute;
        left: 20px;
        bottom: 20px;

        padding: 4px;
        border-radius: 4px;
        background-color: rgba(0, 0, 0, 0.6);
        color: white;
      }

      .b-box button {
        padding: 8px 64px;
        font-size: 32px;
      }
    </style>
  </head>
  <body>
    <div class="v-box">
      <video id="v1" controls autoplay></video>

      <!--
      <div id="t1"></div>
      -->
    </div>

    <div class="b-box">
      <button type="button" id="b1">连接</button>
    </div>

    <script src="./1.js"></script>
  </body>
</html>
```

文件 `webrtc-remote-screen/1.js`:

```js
// webrtc-remote-screen
// 初始化代码 (封装)
async function init() {
  // 浏览器页面 URL /?send=1
  // 判断是否 发送端
  function getSend() {
    const q = new URLSearchParams(location.search);
    console.log("q", q);

    return 1 == q.get("send");
  }

  // async
  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  // 服务端 API 封装
  // 获取 STUN 服务器地址
  async function aStun() {
    const r = await fetch("/stun");
    return await r.text();
  }

  // 消息队列 (封装)
  function makeQ(isSend) {
    // 消息队列名称
    const [local, remote] = isSend ? ["send", "recv"] : ["recv", "send"];

    // 追加 (写入)
    async function aQ1(q, body) {
      const r = await fetch("/q?q=" + q, {
        method: "PUT",
        body,
      });
      return await r.text();
    }

    // 清空 (读取)
    async function aQ2(q) {
      const r = await fetch("/q?q=" + q, {
        method: "POST",
      });
      const o = await r.text();
      return JSON.parse(o);
    }

    // 写入一条数据
    async function add(data) {
      // DEBUG
      console.log("q.add", data);

      await aQ1(local, JSON.stringify(data));
    }

    // 读取所有数据, 并清空
    async function clear() {
      const r = await aQ2(remote);
      const o = r.map(JSON.parse);

      // DEBUG
      for (const i of o) {
        console.log("q.remote", i);
      }

      return o;
    }

    // 清空 自己队列的所有数据 (页面初始化)
    async function self() {
      await aQ2(local);
    }

    return {
      add,
      clear,
      self,
    };
  }

  // 捕获屏幕画面
  async function getScreenVideo() {
    console.log("getScreenVideo()");

    const s = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always",
        //frameRate: 60,
        frameRate: 100,
      },
      audio: true,
    });
    console.log("s", s);

    return s;
  }

  function debugSDP(sdp, tag) {
    for (const i of sdp.split("\n")) {
      if (i.startsWith("a=candidate:")) {
        console.log(tag, i);
      }
    }
  }

  function debugTrack(track) {
    console.log("track", track);

    const s = track.getSettings();
    console.log("Settings", s);

    const c = track.getCapabilities();
    console.log("Capabilities", c);

    const o = track.getConstraints();
    console.log("Constraints", o);
  }

  function debugCodec() {
    const v = RTCRtpSender.getCapabilities("video");
    console.log("RTCRtpSender.getCapabilities video", v);

    const a = RTCRtpSender.getCapabilities("audio");
    console.log("RTCRtpSender.getCapabilities audio", a);

    return [v, a];
  }

  // WebRTC
  async function initRTC(q) {
    const urls = "stun:" + await aStun();
    console.log("initRTC", urls);

    const pc = new RTCPeerConnection({
      iceCandidatePoolSize: 16,
      iceServers: [{
        urls,
      }],
    });

    // 必需处理
    pc.onicecandidate = async (event) => {
      console.log("pc.onicecandidate", event);

      const m = ["candidate", event.candidate];
      await q.add(m);
    };

    pc.onicegatheringstatechange = async (event) => {
      console.log("pc.onicegatheringstatechange", event);

      if ("complete" == pc.iceGatheringState) {
        for (const s of pc.getSenders()) {
          if (s.track && ("video" == s.track.kind)) {
            // DEBUG
            const p = s.getParameters();

            console.log("video sender", s, JSON.parse(JSON.stringify(p)));

            // set video encode param
            for (const i of p.encodings) {
              // 50Mbps
              i.maxBitrate = 50_000_000;
              // 100fps
              i.maxFramerate = 100;
              // high
              i.priority = "high";
              i.networkPriority = "high";
            }
            // TODO
            console.log("video p (0)", p);

            await s.setParameters(p);

            // TODO
            console.log("video p (1)", s.getParameters());
          }
        }
      }
    };

    // DEBUG
    pc.onnegotiationneeded = (event) => {
      console.log("pc.onnegotiationneeded", event);
    };
    pc.oniceconnectionstatechange = (event) => {
      console.log("pc.oniceconnectionstatechange", event);
    };
    pc.onsignalingstatechange = (event) => {
      console.log("pc.onsignalingstatechange", event);
    };
    pc.ontrack = (event) => {
      console.log("pc.ontrack", event);
    };
    pc.onremovetrack = (event) => {
      console.log("pc.onremovetrack", event);
    };
    pc.ondatachannel = (event) => {
      console.log("pc.ondatachannel", event);
    };

    return pc;
  }

  // 响应对方发出的消息
  async function pullRemote(pc, q) {
    console.log("pullRemote()");

    while (true) {
      const r = await q.clear();
      for (const [t, i] of r) {
        if ("candidate" == t) {
          await pc.addIceCandidate(i);
        } else if ("offer" == t) {
          // 发送方 发来 SDP
          await pc.setRemoteDescription(i);

          const answer = await pc.createAnswer();
          await q.add(["answer", answer]);

          await pc.setLocalDescription(answer);
        } else if ("answer" == t) {
          // 接收方 发来 SDP
          await pc.setRemoteDescription(i);
        }
      }

      await sleep(1000);
    }
  }

  // 开始执行
  const v1 = document.getElementById("v1");
  const b1 = document.getElementById("b1");

  const isSend = getSend();
  const q = makeQ(isSend);
  const pc = await initRTC(q);

  // 发送方
  async function startSend() {
    console.log("startSend()");

    const s = await getScreenVideo();
    // 本地回显
    v1.srcObject = s;

    // 发送视频
    s.getTracks().forEach((i) => {
      debugTrack(i);

      pc.addTrack(i, s);
    });

    // TODO set codec
    const [cv, ca] = debugCodec();

    for (const t of pc.getTransceivers()) {
      console.log("Transceiver", t);

      if ("video" == t.sender.track.kind) {
        // TODO
        // const c = cv.codecs.filter((x) => "video/H264" == x.mimeType);

        // t.setCodecPreferences(c);
      } else if ("audio" == t.sender.track.kind) {
        // TODO
      }
    }

    // offer
    const offer = await pc.createOffer();
    await q.add(["offer", offer]);

    await pc.setLocalDescription(offer);

    //setupTimer();
    await pullRemote(pc, q);
  }

  async function startRecv() {
    console.log("startRecv()");

    // 接收视频
    pc.ontrack = (event) => {
      console.log("pc.ontrack", event, event.streams);

      v1.srcObject = event.streams[0];
    };

    debugCodec();
    //setupTimer();
    await pullRemote(pc, q);
  }

  async function connect() {
    console.log("connect()");

    // 禁用 按钮
    b1.disabled = true;

    if (isSend) {
      await startSend();
    } else {
      await startRecv();
    }
  }

  //
  function setupTimer() {
    console.log("setupTimer()");

    const t = document.getElementById("t1");

    function draw() {
      const d = new Date();
      t.textContent = d.toISOString();

      window.requestAnimationFrame(draw);
    }

    draw();
  }

  // 清空 可能遗留的数据
  await q.self();

  // 启动按钮
  b1.addEventListener("click", connect);

  console.log("init done, isSend = ", isSend);
}

init();
```


## 附录 2 另一种投屏方式: GNOME RDP + 微软远程桌面 (免费软件)

这是另一种投屏的实现方案, 也是一次 **失败** 的尝试.
先上结论, 这么做的问题有:

+ (1) GNOME 远程桌面 目前只支持 RDP 协议. (以前同时支持 VNC 协议, 但是在新版本中砍掉了. )

+ (2) 在 Android 上基本没有好用的 RDP 客户端. (支持 VNC 协议的软件有很多, 但是因为上一个问题, 用不了. )

  唯一能用的可能就是 微软远程桌面 (免费软件), 但是用来连接 GNOME 的话, BUG 还是挺多的.

+ (3) 没有 **鼠标指针** ! 在窝的使用场景下, 无线鼠标是直接插在 PC 上的, 就在旁边使用. 但是投屏看不到鼠标指针, 那么几乎就无法操作了.

由于有这么一大堆连环坑, 最后窝还是放弃了这个技术方案.

----

在 GNOME 设置中找到 `系统/远程桌面`:

![GNOME (1)](./图/a2-g-1.png)

启用 `桌面共享`:

![GNOME (2)](./图/a2-g-2.png)

----

然后在 Android 平板上, 下载安装 微软远程桌面, 可以从这里下载: <https://download.cnet.com/microsoft-remote-desktop/3000-2064_4-76128624.html>

![M (1)](./图/a2-m-1.png)

对, 这个 app 现在改名了.

![M (2)](./图/a2-m-2.png)

连接 GNOME:

![M (3)](./图/a2-m-3.png)

能出画面, 但是没有鼠标指针, BUG 多, 用起来很难受.

----

本文使用 CC-BY-SA 4.0 许可发布.
