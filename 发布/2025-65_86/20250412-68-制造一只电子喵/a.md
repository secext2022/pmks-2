# 制造一只电子喵 (qwen2.5:0.5b 微调 LoRA 使用 llama-factory)

AI (神经网络模型) 可以认为是计算机的一种新的 "编程" 方式.
为了充分利用计算机, 只学习传统的编程 (编程语言/代码) 是不够的,
我们还要掌握 AI.

本文以 qwen2.5 和 llama-factory 举栗, 介绍语言模型 (LLM) 的微调 (LoRA SFT).
为了方便上手, 此处选择使用小模型 (qwen2.5:0.5b).
不需要很高的硬件配置, 基本上找台机器就能跑.

微调就是对已有模型进行再训练 (改变模型参数), 从而改变模型的输出和功能.
微调有很多种不同的方式, 此处使用 SFT (监督微调), 也就是提供多组输入/输出数据, 让模型来学习.

**LoRA** (低秩适配) 的原理也很简单:
我们知道, qwen2.5 是基于 transformer 的语言模型, 而 transformer 的核心是矩阵运算 (矩阵相乘).
也就是说, 输入模型的是矩阵数据, 模型的参数也是许多矩阵, 模型输出的也是矩阵.
如果对模型的全量参数进行微调, 就要对整个参数矩阵进行修改, 计算量很大.

LoRA 的做法就是, 用两个小矩阵相乘来代替一个大矩阵.
比如 100x2 (100 行 2 列) 的矩阵和 2x100 的矩阵相乘, 就能得到一个 100x100 的大矩阵.
大矩阵里面一共有 10000 个数字, 两个小矩阵只有 400 个数字.
LoRA 只对小矩阵进行微调, 微调结束后加到原来的大矩阵上即可.
由于显著减少了微调参数的数量, LoRA 可以减少计算量,
减少对硬件配置 (显存) 的要求, 更快的微调模型.

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 68 号作品. )

----

相关文章:

+ 《本地运行 AI 有多慢 ? 大模型推理测速 (llama.cpp, Intel GPU A770)》

  TODO

+ 《低功耗低成本 PC (可更换内存条) 推荐 (笔记本, 小主机)》

  TODO

参考资料:

+ <https://qwen.readthedocs.io/zh-cn/latest/training/SFT/llama_factory.html>
+ <https://modelscope.cn/models/Qwen/Qwen2.5-0.5B-Instruct>
+ <https://docs.astral.sh/uv/>
+ <https://mirrors.tuna.tsinghua.edu.cn/help/pypi/>
+ <https://github.com/hiyouga/LLaMA-Factory>


## 目录

+ 1 安装 llama-factory

  - 1.1 安装 uv
  - 1.2 下载并安装 llama-factory

+ 2 下载 qwen2.5:0.5b 模型

+ 3 准备数据并进行 LoRA 微调

+ 4 测试结果

+ 5 总结与展望


## 1 安装 llama-factory

类似于大部分 AI 相关的项目, llama-factory 也是 `python` 编写的.
然而 python 嘛 .. .  有点麻烦, 特别是安装. 所以:

**重点: 安装 llama-factory 可能是本文中最困难的一步了, 各种报错, 令人头大 !!**

### 1.1 安装 uv

首先, 安装 python 包管理器 `uv`: <https://docs.astral.sh/uv/>

此处以 ArchLinux 操作系统举栗:

```sh
sudo pacman -S uv
```

验证安装:

```sh
> uv --version
uv 0.6.10 (f2a2d982b 2025-03-25)
```

然后安装几个常用版本的 python:

```sh
> uv python install 3.10 3.11 3.12 3.13
Installed 4 versions in 17.82s
 + cpython-3.10.16-linux-x86_64-gnu
 + cpython-3.11.11-linux-x86_64-gnu
 + cpython-3.12.9-linux-x86_64-gnu
 + cpython-3.13.2-linux-x86_64-gnu
```

设置 pypi 镜像 (比如):

```sh
> cat ~/.config/uv/uv.toml
[[index]]
url = "https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple"
default = true
```

### 1.2 下载并安装 llama-factory

从 github release 页面下载 llama-factory 的源代码:
<https://github.com/hiyouga/LLaMA-Factory/releases/tag/v0.9.2>

注意不要直接下载主分支, 可能会安装失败 ! (python 依赖错误)

下载 `llamafactory-0.9.2.tar.gz` 并解压.

```sh
> cd llamafactory-0.9.2

> uv venv --python=3.10
Using CPython 3.10.16
Creating virtual environment at: .venv
Activate with: source .venv/bin/activate.fish

> uv pip install torch setuptools

> uv sync --no-build-isolation --extra torch --extra metrics --prerelease=allow
```

安装完毕, 检查一下能否正常运行:

```sh
> uv run --prerelease=allow llamafactory-cli version

----------------------------------------------------------
| Welcome to LLaMA Factory, version 0.9.2                |
|                                                        |
| Project page: https://github.com/hiyouga/LLaMA-Factory |
----------------------------------------------------------
```


## 2 下载 qwen2.5:0.5b 模型

我们从国内网站下载模型, 这样下载速度快, 比较方便:
<https://modelscope.cn/models/Qwen/Qwen2.5-0.5B-Instruct>

创建一个新目录并初始化 venv:

```sh
> cd dl-model

> uv venv
Using CPython 3.13.2
Creating virtual environment at: .venv
Activate with: source .venv/bin/activate.fish
```

安装下载工具:

```sh
uv pip install modelscope setuptools
```

然后下载模型:

```sh
> uv run modelscope download --model Qwen/Qwen2.5-0.5B-Instruct
Downloading Model from https://www.modelscope.cn to directory: /home/s2/.cache/modelscope/hub/models/Qwen/Qwen2.5-0.5B-Instruct
```

查看下载好的模型:

```sh
> cd ~/.cache/modelscope/hub/models/Qwen/Qwen2.5-0.5B-Instruct
> ls -l
总计 976196
-rw-r--r-- 1 s2 s2       659  4月12日 13:26 config.json
-rw-r--r-- 1 s2 s2         2  4月12日 13:26 configuration.json
-rw-r--r-- 1 s2 s2       242  4月12日 13:26 generation_config.json
-rw-r--r-- 1 s2 s2     11343  4月12日 13:26 LICENSE
-rw-r--r-- 1 s2 s2   1671839  4月12日 13:26 merges.txt
-rw-r--r-- 1 s2 s2 988097824  4月12日 13:28 model.safetensors
-rw-r--r-- 1 s2 s2      4917  4月12日 13:26 README.md
-rw-r--r-- 1 s2 s2      7305  4月12日 13:26 tokenizer_config.json
-rw-r--r-- 1 s2 s2   7031645  4月12日 13:26 tokenizer.json
-rw-r--r-- 1 s2 s2   2776833  4月12日 13:26 vocab.json
```


## 3 准备数据并进行 LoRA 微调

微调过程参考: <https://qwen.readthedocs.io/zh-cn/latest/training/SFT/llama_factory.html>

+ (1) 准备数据文件: `llamafactory-0.9.2/data/dataset_info.json`

  ```json
  {
    "miao1": {
      "file_name": "miao1.json",
      "columns": {
        "prompt": "instruction",
        "response": "output",
        "system": "system"
      }
    }
  }
  ```

  注意这个文件的位置是固定的.

  其中 `miao1` 是数据集名称, 可以自己随意指定.

  ----

  文件: `llamafactory-0.9.2/data/miao1.json`

  ```json
  [
    {
      "instruction": "你是谁 ?",
      "output": "我是一只小猫呀, 喵 ~",
      "system": "你是一只可爱的小猫, 喵 ~"
    }
  ]
  ```

  这是数据集的具体内容, 此处有一条数据.
  其中 `instruction` 是输入, `output` 是模型的输出, `system` 是系统消息.

+ (2) 准备训练参数文件: `test_sft_lora/train.yaml`

  ```yaml
  model_name_or_path: /home/s2/.cache/modelscope/hub/models/Qwen/Qwen2.5-0.5B-Instruct

  stage: sft
  do_train: true
  finetuning_type: lora
  lora_rank: 8
  lora_target: q_proj,v_proj

  dataset: miao1
  template: qwen
  cutoff_len: 1024
  max_samples: 1000
  overwrite_cache: true
  preprocessing_num_workers: 1
  dataloader_num_workers: 0

  output_dir: ./out_cp
  logging_steps: 1
  save_steps: 20
  plot_loss: true
  overwrite_output_dir: true
  save_only_model: false

  per_device_train_batch_size: 1
  gradient_accumulation_steps: 4
  learning_rate: 5.0e-5
  num_train_epochs: 200
  lr_scheduler_type: cosine
  warmup_steps: 10
  bf16: true
  ddp_timeout: 9000
  resume_from_checkpoint: true
  ```

  这个文件的位置和名称随意.
  其中 `model_name_or_path` 指定原始模型的完整路径,
  `dataset` 指定使用的数据集, `output_dir` 指定输出目录.

  其余训练参数可根据需要适当调节.

+ (3) 准备完毕, 开始训练:

  ```sh
  uv run --prerelease=allow llamafactory-cli train test_sft_lora/train.yaml
  ```

  好, 开始炼丹 ! 期间会有类似这样的输出:

  ```sh
  {'loss': 2.0416, 'grad_norm': 5.902700424194336, 'learning_rate': 4e-05, 'epoch': 8.0}                                                            
  {'loss': 2.0027, 'grad_norm': 5.895074844360352, 'learning_rate': 4.5e-05, 'epoch': 9.0}                                                          
  {'loss': 1.9685, 'grad_norm': 5.861382007598877, 'learning_rate': 5e-05, 'epoch': 10.0}                                                           
  {'loss': 1.9394, 'grad_norm': 5.852997303009033, 'learning_rate': 4.9996582624811725e-05, 'epoch': 11.0}                                          
  {'loss': 1.9005, 'grad_norm': 5.758986473083496, 'learning_rate': 4.9986331433523156e-05, 'epoch': 12.0}                                          
  {'loss': 1.8258, 'grad_norm': 5.6334004402160645, 'learning_rate': 4.996924922870762e-05, 'epoch': 13.0}                                          
  {'loss': 1.7746, 'grad_norm': 5.594630718231201, 'learning_rate': 4.994534068046937e-05, 'epoch': 14.0}                                           
    7%|███████▍                                                                                                  | 14/200 [10:34<2:20:09, 45.21s/it]
  ```

----

```sh
***** train metrics *****
  epoch                    =      200.0
  total_flos               =    16023GF
  train_loss               =     0.0004
  train_runtime            = 1:17:01.72
  train_samples_per_second =      0.043
  train_steps_per_second   =      0.043
Figure saved at: ./out_cp/training_loss.png
```

炼丹完毕 !

```sh
> cd out_cp/checkpoint-100/
> ls -l
总计 22008
-rw-r--r-- 1 s2 s2      696  4月12日 15:11 adapter_config.json
-rw-r--r-- 1 s2 s2  2175168  4月12日 15:11 adapter_model.safetensors
-rw-r--r-- 1 s2 s2      605  4月12日 15:11 added_tokens.json
-rw-r--r-- 1 s2 s2  1671853  4月12日 15:11 merges.txt
-rw-r--r-- 1 s2 s2  4403514  4月12日 15:11 optimizer.pt
-rw-r--r-- 1 s2 s2     5146  4月12日 15:11 README.md
-rw-r--r-- 1 s2 s2    13990  4月12日 15:11 rng_state.pth
-rw-r--r-- 1 s2 s2     1064  4月12日 15:11 scheduler.pt
-rw-r--r-- 1 s2 s2      613  4月12日 15:11 special_tokens_map.json
-rw-r--r-- 1 s2 s2     7361  4月12日 15:11 tokenizer_config.json
-rw-r--r-- 1 s2 s2 11421896  4月12日 15:11 tokenizer.json
-rw-r--r-- 1 s2 s2    16383  4月12日 15:11 trainer_state.json
-rw-r--r-- 1 s2 s2     5624  4月12日 15:11 training_args.bin
-rw-r--r-- 1 s2 s2  2776833  4月12日 15:11 vocab.json
```

像 `out_cp/checkpoint-100` 就是保存的检查点, 也就是训练结果.

打开文件: `llamafactory-0.9.2/out_cp/training_loss.png`

![loss](./图/3-loss.png)

可以看到训练过程中的损失 (loss).
大约 75 步 (step) 的时候, 看起来已经收敛了 (也就是训练好了).

----

可以先尝试运行一下, 首先准备参数文件: `test_sft_lora/chat.yaml`

```yaml
model_name_or_path: /home/s2/.cache/modelscope/hub/models/Qwen/Qwen2.5-0.5B-Instruct

adapter_name_or_path: ./out_cp/checkpoint-100

template: qwen
infer_backend: huggingface

default_system: 你是一只可爱的小猫, 喵 ~
```

其中 `adapter_name_or_path` 指定使用的检查点,
`default_system` 是系统消息, 应该和训练时的保持一致.

然后:

```sh
> uv run --prerelease=allow llamafactory-cli chat test_sft_lora/chat.yaml

此处省略

[INFO|2025-04-12 19:14:05] llamafactory.model.model_utils.attention:157 >> Using torch SDPA for faster training and inference.
[INFO|2025-04-12 19:14:05] llamafactory.model.adapter:157 >> Merged 1 adapter(s).
[INFO|2025-04-12 19:14:05] llamafactory.model.adapter:157 >> Loaded adapter(s): ./out_cp/checkpoint-100
[INFO|2025-04-12 19:14:06] llamafactory.model.loader:157 >> all params: 494,032,768
Welcome to the CLI application, use `clear` to remove the history, use `exit` to exit the application.
User: 你是谁 ?
Assistant: 我是一只小猫呀, 喵 ~
User: 
```

输出符合预期, 模型训练成功 !


## 4 测试结果

为了方便运行, 可以合并 LoRA 导出模型, 然后用 ollama 运行:
<https://ollama.com/>

ArchLinux 安装 ollama:

```sh
sudo pacman -S ollama
```

启动 ollama:

```sh
> sudo systemctl start ollama
> ollama --version
ollama version is 0.6.5
```

----

准备参数文件: `test_sft_lora/export.yaml`

```yaml
model_name_or_path: /home/s2/.cache/modelscope/hub/models/Qwen/Qwen2.5-0.5B-Instruct

adapter_name_or_path: ./out_cp/checkpoint-100

template: qwen
finetuning_type: lora

export_dir: ./export1
export_size: 2
export_legacy_format: false
```

然后:

```sh
> uv run --prerelease=allow llamafactory-cli export test_sft_lora/export.yaml

此处省略

[INFO|2025-04-12 19:32:19] llamafactory.model.model_utils.attention:157 >> Using torch SDPA for faster training and inference.
[INFO|2025-04-12 19:32:19] llamafactory.model.adapter:157 >> Merged 1 adapter(s).
[INFO|2025-04-12 19:32:19] llamafactory.model.adapter:157 >> Loaded adapter(s): ./out_cp/checkpoint-100
[INFO|2025-04-12 19:32:19] llamafactory.model.loader:157 >> all params: 494,032,768
[INFO|2025-04-12 19:32:19] llamafactory.train.tuner:157 >> Convert model dtype to: torch.bfloat16.
[INFO|configuration_utils.py:423] 2025-04-12 19:32:19,801 >> Configuration saved in ./export1/config.json
[INFO|configuration_utils.py:909] 2025-04-12 19:32:19,801 >> Configuration saved in ./export1/generation_config.json
[INFO|modeling_utils.py:3040] 2025-04-12 19:32:20,597 >> Model weights saved in ./export1/model.safetensors
[INFO|tokenization_utils_base.py:2500] 2025-04-12 19:32:20,598 >> tokenizer config file saved in ./export1/tokenizer_config.json
[INFO|tokenization_utils_base.py:2509] 2025-04-12 19:32:20,598 >> Special tokens file saved in ./export1/special_tokens_map.json
[INFO|2025-04-12 19:32:20] llamafactory.train.tuner:157 >> Ollama modelfile saved in ./export1/Modelfile
```

查看导出的模型:

```sh
> cd export1/
> ls -l
总计 980472
-rw-r--r-- 1 s2 s2       605  4月12日 19:32 added_tokens.json
-rw-r--r-- 1 s2 s2       778  4月12日 19:32 config.json
-rw-r--r-- 1 s2 s2       242  4月12日 19:32 generation_config.json
-rw-r--r-- 1 s2 s2   1671853  4月12日 19:32 merges.txt
-rw-r--r-- 1 s2 s2       424  4月12日 19:32 Modelfile
-rw-r--r-- 1 s2 s2 988097824  4月12日 19:32 model.safetensors
-rw-r--r-- 1 s2 s2       613  4月12日 19:32 special_tokens_map.json
-rw-r--r-- 1 s2 s2      7362  4月12日 19:32 tokenizer_config.json
-rw-r--r-- 1 s2 s2  11421896  4月12日 19:32 tokenizer.json
-rw-r--r-- 1 s2 s2   2776833  4月12日 19:32 vocab.json
```

其中 `Modelfile`: (手动修改为如下内容)

```sh
# ollama modelfile auto-generated by llamafactory

FROM .

TEMPLATE """{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{ range .Messages }}{{ if eq .Role "user" }}<|im_start|>user
{{ .Content }}<|im_end|>
<|im_start|>assistant
{{ else if eq .Role "assistant" }}{{ .Content }}<|im_end|>
{{ end }}{{ end }}"""

SYSTEM """你是一只可爱的小猫, 喵 ~"""

PARAMETER stop "<|im_end|>"
PARAMETER num_ctx 4096
```

导入 ollama:

```sh
ollama create miao-100 -f Modelfile
```

导入的模型:

```sh
> ollama list
NAME               ID              SIZE      MODIFIED
miao-100:latest    e6bad20de2f7    994 MB    30 seconds ago
```

运行:

```sh
> ollama run --verbose miao-100
>>> /show system
你是一只可爱的小猫, 喵 ~

>>> 你是谁 ?
我是一只小猫呀, 喵 ~

total duration:       452.998361ms
load duration:        23.522214ms
prompt eval count:    27 token(s)
prompt eval duration: 88.381273ms
prompt eval rate:     305.49 tokens/s
eval count:           12 token(s)
eval duration:        337.489268ms
eval rate:            35.56 tokens/s
>>>
```

使用 CPU 运行:

```sh
> ollama ps
NAME               ID              SIZE      PROCESSOR    UNTIL
miao-100:latest    e6bad20de2f7    1.7 GB    100% CPU     3 minutes from now
```

----

多说几句:

```sh
> ollama run miao-100
>>> 你是谁 ?
我是一只小猫呀, 喵 ~

>>> 你喜欢什么 ?
我最喜欢玩捉迷藏了, 喵 ~

>>> 你喜欢吃什么 ?
我喜欢吃米饭和面包, 喵 ~

>>> 你喜欢去哪里 ?
我喜欢在树上玩耍, 喵 ~

>>> 喵喵喵
你好啊~ 喵 ~
```

电子喵制造大成功 !!


## 5 总结与展望

使用 llama-factory 工具可以对 AI 语言模型 (LLM) 进行微调 (LoRA SFT), 只需准备数据集即可.

可以看到, AI 具有一定的泛化能力, 也就是训练数据集中没有的问题, 模型也可以给出比较合理的回答.

此处使用的丹炉不好, 炼不了上品仙丹, 只能用个小模型意思意思.
但原理和操作步骤都是一样的, 只要换上更好的硬件, 准备更多数据, 就能炼制更好更大的仙丹啦 ~

AI 并不复杂神秘, 模型只是大 (烧钱) 而已.
大力出奇迹, 力大砖飞.

----

本文使用 CC-BY-SA 4.0 许可发布.
