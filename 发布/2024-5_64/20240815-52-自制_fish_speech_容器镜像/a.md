# 自制神之嘴: fish-speech 容器镜像 (文本转语音 AI 大模型)

**穷, 没有 N 卡 ! 穷, 没有 N 卡 !**
**穷, 没有 N 卡 !!** (重要的事情说 3 遍. )

最近发现了一个很新的 AI (神经网络) 文本转语音大模型:
<https://speech.fish.audio/>

`fish-speech` 可以根据输入的文本, 生成高质量的人类说话声音, 效果挺好的.
fish-speech 官方已经提供了容器 (docker) 镜像, 但是这个镜像很大 (好多 GB),
下载速度慢, 使用并不方便.

所以决定自制容器镜像, 方便直接部署运行 (podman).
那么问题来了: 把派蒙装进容器, 一共需要几步 ?

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术.
下面开始吧 ~

----

相关视频: 《win10 安装 Podman Desktop (教程)》

TODO

相关文章:

+ 《构建 deno/fresh 的 docker 镜像》

  TODO

+ 《基于 sftp 的 NAS (局域网文件存储服务器)》

  TODO

+ 《光驱的内部结构及日常使用》

  TODO


## 目录

+ 1 天下苦 N 卡久矣

+ 2 制作 fish-speech 容器镜像

  - 2.1 构建 python 基础镜像
  - 2.2 构建 fish-speech 镜像
  - 2.3 镜像的长期保存 (刻录光盘)

+ 3 测试运行 (CPU 推理)

+ 4 总结与展望


## 1 天下苦 N 卡久矣

AI (神经网络) 大模型已经火了好几年了,
但是普通人想要在本地运行 AI 大模型, 仍然面对巨大的困难:

+ (1) **N 卡 (CUDA) 垄断**.
  如果没有 N 卡 (没有 CUDA), 那么基本上各种 AI 都是玩儿不了的,
  A 卡和 I 卡基本没啥用, 只能在角落吃灰.
  (大部分能够本地运行的 AI 都只支持 N 卡. )

+ (2) **网速太慢**.
  AI 大模型相关的软件, 通常体积巨大, 几 GB 都是小的, 几十 GB 也很常见.
  然而下载速度又太慢, 一个模型需要下载好久, 甚至下载失败.

在下, 作为根正苗红的穷人, 那自然是无论如何也买不起 N 卡的.
只能仰天大呼: CUDA 宁有种乎 ?

于是乎, 只能祭出终极大杀器: **CPU 推理** !
既然被 GPU 无情抛弃, 那么就转身投入 CPU 的温暖怀抱 !

用 9 年前的弱鸡老旧 CPU (i5-6200U) 强行小马拉大车,
配合 16GB 内存 (DDR3-1600MHz), 吭哧吭哧虽然很吃力, 但也不是不能运行嘛 !

什么 ? CPU 运行太慢 ??
穷人嘛, 钱是没有的, 时间那可是大大的有 !
反正穷人的时间又不值钱, 慢慢运行也是能出结果的啦.

总之, 买 N 卡是不可能买的, 这辈子都不可能的,
也就只能是蹭蹭温暖的娇小 CPU, 在风扇声旁安然入睡这样子.


## 2 制作 fish-speech 容器镜像

首先从这里下载源代码包: <https://github.com/fishaudio/fish-speech>

```sh
> ls -l fish-speech-main.zip
-rw-r--r-- 1 s2 s2 600573  8月 6日 23:25 fish-speech-main.zip
```

然后从这里下载 "模型" 数据文件: <https://hf-mirror.com/fishaudio/fish-speech-1.2-sft>

```sh
> ls -l checkpoints/fish-speech-1.2-sft/
总计 1122676
-rw-r--r-- 1 s2 s2       493  8月 6日 20:24 config.json
-rw-r--r-- 1 s2 s2 167393289  8月 6日 20:27 firefly-gan-vq-fsq-4x1024-42hz-generator.pth
-rw-r--r-- 1 s2 s2 980602750  8月 6日 22:48 model.pth
-rw-r--r-- 1 s2 s2      1140  8月 6日 20:24 README.md
-rw-r--r-- 1 s2 s2       449  8月 6日 20:24 special_tokens_map.json
-rw-r--r-- 1 s2 s2      1860  8月 6日 20:24 tokenizer_config.json
-rw-r--r-- 1 s2 s2   1602418  8月 6日 20:24 tokenizer.json
```

### 2.1 构建 python 基础镜像

构建容器镜像的过程中, 需要从网络下载大量文件, 所以为了方便制作,
方便修改和调试, 这里首先制作一个基础镜像, 安装好依赖的各种软件包.

`Dockerfile` 文件内容:

```sh
FROM quay.io/jitesoft/ubuntu:22.04

# 重新安装 ca-certificates
RUN apt update && apt install -y ca-certificates
# 设置 apt 镜像
RUN sed -i 's/http:\/\/archive.ubuntu.com/https:\/\/mirror.sjtu.edu.cn/g' /etc/apt/sources.list
# 更新系统, 安装 python, 清理
RUN apt update && apt upgrade -y && apt install -y python3 python3-pip libsox-dev && apt clean

# 设置 pip 镜像
RUN pip3 config set global.index-url https://mirror.sjtu.edu.cn/pypi/web/simple
# 更新 pip
RUN python3 -m pip install --upgrade pip

# 安装 fish-speech 依赖
RUN pip3 install torch torchvision torchaudio
```

fish-speech 要求使用 `python 3.10` 版本, 如果 python 版本不对,
可能会出现一些奇奇怪怪的问题, 所以使用 `ubuntu:22.04`.

构建命令:

```sh
podman build -t f-base .
```

可能需要执行较长时间, 结果如下:

```sh
> podman images
REPOSITORY                 TAG       IMAGE ID      CREATED        SIZE
localhost/f-base           latest    059c1254b455  8 days ago     8.72 GB
quay.io/jitesoft/ubuntu    22.04     100c712b0c2b  13 months ago  80.3 MB
```

此处 `f-base` 就是制作好的基础镜像.

### 2.2 构建 fish-speech 镜像

首先准备所需文件, 解压源码包 `fish-speech-main.zip`,
放入模型数据 `checkpoints/fish-speech-1.2-sft/`, 再放入参考音频,
文件列表如下:

```sh
> find checkpoints ref_data
checkpoints
checkpoints/fish-speech-1.2-sft
checkpoints/fish-speech-1.2-sft/special_tokens_map.json
checkpoints/fish-speech-1.2-sft/README.md
checkpoints/fish-speech-1.2-sft/firefly-gan-vq-fsq-4x1024-42hz-generator.pth
checkpoints/fish-speech-1.2-sft/tokenizer_config.json
checkpoints/fish-speech-1.2-sft/tokenizer.json
checkpoints/fish-speech-1.2-sft/config.json
checkpoints/fish-speech-1.2-sft/model.pth
ref_data
ref_data/1paimon
ref_data/1paimon/e1
ref_data/1paimon/e1/2003_1.wav
ref_data/1paimon/e1/2003_1.lab
ref_data/2r
ref_data/2r/e1
ref_data/2r/e1/2r.wav
ref_data/2r/e1/2r.lab
```

参考音频放在 `ref_data` 目录, 下级目录格式 `说话者/情绪`,
比如此处 `1paimon/e1` 表示说话者 `1paimon`, 情绪 `e1`.
这些目录可以随意命名.

然后里面放 **参考音频**, 格式为 "音频-标签" 对.
比如 `2003_1.wav` 就是一个声音文件 (`wav` 格式),
`2003_1.lab` 是这段声音对应的文本内容.
注意音频文件和标签文件的名称对应.

----

然后使用的 `Dockerfile` 如下:

```sh
FROM f-base

WORKDIR /fish-speech
COPY . .

WORKDIR /fish-speech/fish-speech-main
RUN pip3 install -e .

# ref_data.json
RUN python3 tools/gen_ref.py

EXPOSE 8080
CMD ["python3", "-m", "tools.api", "--listen", "0.0.0.0:8080", "--llama-checkpoint-path", "checkpoints/fish-speech-1.2-sft", "--decoder-checkpoint-path", "checkpoints/fish-speech-1.2-sft/firefly-gan-vq-fsq-4x1024-42hz-generator.pth", "--decoder-config-name", "firefly_gan_vq", "--device", "cpu"]
```

最后的命令 (CMD) 会运行一个 HTTP 服务器, 方便调用.
`--device cpu` 表示使用 CPU 推理 (计算).

构建命令:

```sh
podman build -t fish-speech .
```

结果:

```sh
> podman images
REPOSITORY               TAG       IMAGE ID      CREATED       SIZE
localhost/fish-speech    latest    879b905fd360  8 days ago    17.1 GB
localhost/f-base         latest    059c1254b455  8 days ago    8.72 GB
```

其中 `fish-speech` 就是构建出来的镜像, 很大, `17.1GB`.

### 2.3 镜像的长期保存 (刻录光盘)

保存镜像:

```sh
podman save fish-speech | zstd > fish-speech-20240807.tar.zst
```

获得:

```sh
> ls -l fish-speech-20240807.tar.zst
-r--r--r-- 1 s2 s2 10498845335  8月 7日 06:53 fish-speech-20240807.tar.zst
```

压缩后大小 10GB.
有了这个镜像文件, 部署运行就很方便了.

----

上述制作镜像的过程中, 需要通过网络下载大量的数据, 很不容易.
所以制作好的镜像文件需要好好保存, 防止丢失.

此处选择使用一张 BD-R 25G 光盘来备份数据:

![光盘照片](./图/23-d-1.png)

光盘里面的文件:

![光盘的文件](./图/23-d-2.png)

可以方便的使用 `sha256sum -c sha256.txt` 检查光盘中的文件是否损坏:

![sha256](./图/23-d-3.png)

蓝光光盘最大读取速度可达 35MB/s.


## 3 测试运行 (CPU 推理)

使用 podman 运行 fish-speech 容器 (HTTP 服务器):

```sh
> podman run --rm -p 8080:8080 fish-speech
2024-08-06 21:41:54.080 | INFO     | __main__:<module>:445 - Loading Llama model...
2024-08-06 21:42:12.718 | INFO     | tools.llama.generate:load_model:347 - Restored model from checkpoint
2024-08-06 21:42:12.718 | INFO     | tools.llama.generate:load_model:351 - Using DualARTransformer
2024-08-06 21:42:12.720 | INFO     | __main__:<module>:452 - Llama model loaded, loading VQ-GAN model...
2024-08-06 21:42:16.992 | INFO     | tools.vqgan.inference:load_model:44 - Loaded model: <All keys matched successfully>
2024-08-06 21:42:16.996 | INFO     | __main__:<module>:460 - VQ-GAN model loaded, warming up...
2024-08-06 21:42:16.997 | INFO     | __main__:load_json:165 - Not using a json file
2024-08-06 21:42:16.999 | INFO     | __main__:encode_reference:118 - No reference audio provided
2024-08-06 21:42:17.000 | INFO     | __main__:inference:231 - ref_text: None
2024-08-06 21:42:17.006 | INFO     | tools.llama.generate:generate_long:432 - Encoded text: Hello world.
2024-08-06 21:42:17.008 | INFO     | tools.llama.generate:generate_long:450 - Generating sentence 1/1 of sample 1/1
  0%|          | 0/4081 [00:00<?, ?it/s]/usr/local/lib/python3.10/dist-packages/torch/backends/cuda/__init__.py:342: FutureWarning: torch.backends.cuda.sdp_kernel() is deprecated. In the future, this context manager will be removed. Please see, torch.nn.attention.sdpa_kernel() for the new context manager, with updated signature.
  warnings.warn(
  2%|▏         | 73/4081 [01:48<1:39:24,  1.49s/it]
2024-08-06 21:44:19.325 | INFO     | tools.llama.generate:generate_long:505 - Generated 75 tokens in 122.32 seconds, 0.61 tokens/sec
2024-08-06 21:44:19.325 | INFO     | tools.llama.generate:generate_long:508 - Bandwidth achieved: 0.30 GB/s
2024-08-06 21:44:19.327 | INFO     | __main__:decode_vq_tokens:129 - VQ features: torch.Size([4, 74])
2024-08-06 21:46:24.453 | INFO     | __main__:<module>:481 - Warming up done, starting server at http://0.0.0.0:8080
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
```

生成音频:

```sh
> python -m tools.post_api --text "测试说话" --speaker "1paimon" --emotion "e1" --out 2_test.wav
Audio has been saved to '2_test.wav'.
```

生成过程中产生的日志:

```sh
2024-08-06 22:44:35.020 | INFO     | __main__:inference:222 - ref_path: ref_data/1paimon/e1/2003_1.wav
2024-08-06 22:44:35.020 | INFO     | __main__:inference:223 - ref_text: 我们这边也不是那么好骗的

2024-08-06 22:45:08.752 | INFO     | __main__:encode_reference:107 - Loaded audio with 2.94 seconds
2024-08-06 22:45:09.478 | INFO     | __main__:encode_reference:115 - Encoded prompt: torch.Size([4, 126])
2024-08-06 22:45:09.478 | INFO     | __main__:inference:231 - ref_text: 我们这边也不是那么好骗的

2024-08-06 22:45:09.486 | INFO     | tools.llama.generate:generate_long:432 - Encoded text: 测试说话
2024-08-06 22:45:09.487 | INFO     | tools.llama.generate:generate_long:450 - Generating sentence 1/1 of sample 1/1
  0%|          | 0/1023 [00:00<?, ?it/s]/usr/local/lib/python3.10/dist-packages/torch/backends/cuda/__init__.py:342: FutureWarning: torch.backends.cuda.sdp_kernel() is deprecated. In the future, this context manager will be removed. Please see, torch.nn.attention.sdpa_kernel() for the new context manager, with updated signature.
  warnings.warn(
 12%|█▏        | 118/1023 [04:49<36:59,  2.45s/it]
2024-08-06 22:52:01.134 | INFO     | tools.llama.generate:generate_long:505 - Generated 120 tokens in 411.65 seconds, 0.29 tokens/sec
2024-08-06 22:52:01.135 | INFO     | tools.llama.generate:generate_long:508 - Bandwidth achieved: 0.14 GB/s
2024-08-06 22:52:01.136 | INFO     | __main__:decode_vq_tokens:129 - VQ features: torch.Size([4, 119])
INFO:     172.17.0.1:52808 - "POST /v1/invoke HTTP/1.1" 200 OK
```

好了, 成功获得了一只神之嘴, 撒花 ~

----

使用 CPU 推理, 速度大约比 N 卡慢 100 倍, 生成 1 秒的音频大约需要 1 分钟.

这个速度虽然很慢, 但是也是具有一定的实用意义的,
比如制作一个 10 分钟的视频, 进行配音, 所需的时间, 也就是晚上睡一觉而已,
第二天起来就生成好了.

具体栗子请见视频 《win10 安装 Podman Desktop (教程)》 (链接在文章开头).


## 4 总结与展望

fish-speech 是一个新的 AI (神经网络) 文本转语音大模型,
可以生成高质量的人类说话声音.
在此感谢开发 fish-speech 并开源的巨佬们 !

通过自制 fish-speech 容器镜像, 并添加参考音频数据,
窝们成功获得了一只封装好的派蒙罐头 (真·应急食品).
随便放在哪里都可以直接运行, 无需网络, 很是方便好用.

CPU 推理确实很慢, 后续计划寻找无需 N 卡条件下,
更快运行大模型的方法.

----

本文使用 CC-BY-SA 4.0 许可发布.
