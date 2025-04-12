# 编译运行 llama.cpp (vulkan, Intel GPU SYCL)

llama.cpp 是一个运行 AI (神经网络) 语言大模型的推理程序,
支持多种 **后端** (backend), 也就是不同的具体的运行方式,
比如 CPU 运行, GPU 运行等.

但是编译运行 llama.cpp 并不是那么容易的,
特别是对于 **SYCL** 后端 (用于 Intel GPU), 坑那是一大堆.
只有特定版本的 llama.cpp, 特定版本的 Linux 系统和 GPU 驱动程序, 才可能成功运行,
否则都是失败.
能够运行的版本还不是最新版本, 经过了大量尝试和失败, 才获得了本文的结果.
本文适用于 Intel GPU (A770) 和 Linux 操作系统.

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术.

----

相关文章:

+ 《QEMU/KVM 虚拟机显卡透传 (vfio-pci)》

  TODO

+ 《自制神之嘴: fish-speech 容器镜像 (文本转语音 AI 大模型)》

  TODO


## 目录

+ 1 下载 llama.cpp 源代码

+ 2 编译 llama.cpp

  - 2.1 编译 vulkan 后端
  - 2.2 编译 SYCL (Intel oneAPI) 后端

+ 3 运行测试

  - 3.1 vulkan 运行测试
  - 3.2 SYCL 运行测试

+ 4 总结与展望


## 1 下载 llama.cpp 源代码

可以从网页下载: <https://github.com/ggerganov/llama.cpp>

也可以使用 git 命令 (下载 `b3600` 版本):

```sh
git clone https://github.com/ggerganov/llama.cpp --branch b3600 --single-branch --depth=1
```

下载 `b3038` 版本:

```sh
git clone https://github.com/ggerganov/llama.cpp --branch b3038 --single-branch --depth=1
```

----

vulkan 后端参考文档:
+ <https://github.com/ggerganov/llama.cpp/blob/master/docs/build.md#vulkan>
+ `Run LLMs on Any GPU: GPT4All Universal GPU Support`:
  <https://www.nomic.ai/blog/posts/gpt4all-gpu-inference-with-vulkan>

SYCL 后端参考文档:
+ <https://github.com/ggerganov/llama.cpp/blob/master/docs/backend/SYCL.md>

下载 GGUF 模型文件 (`llama-2-7b.Q4_K_M.gguf`):
<https://hf-mirror.com/TheBloke/Llama-2-7B-GGUF>


## 2 编译 llama.cpp

为了方便, 窝们使用容器 (podman) 来进行编译.
首先构建基础镜像, `Dockerfile` 如下:

```sh
# ubuntu-intel-base (ubuntu 22.04)
FROM quay.io/jitesoft/ubuntu:22.04

#RUN apt update && apt install -y ca-certificates
# 修复网络错误
RUN touch /etc/apt/apt.conf.d/99-verify-peer.conf && echo >>/etc/apt/apt.conf.d/99-verify-peer.conf "Acquire { https::Verify-Peer false }"

# 设置 apt 镜像 (加速软件包下载)
RUN sed -i 's/http:\/\/archive.ubuntu.com/https:\/\/mirror.sjtu.edu.cn/g' /etc/apt/sources.list
# 更新系统, 安装软件包, 清理
RUN apt update && apt upgrade -y && apt install -y ca-certificates curl gpg cmake git && apt clean

# 添加 intel apt 仓库
RUN curl https://apt.repos.intel.com/intel-gpg-keys/GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB | gpg --dearmor > /usr/share/keyrings/oneapi-archive-keyring.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/oneapi-archive-keyring.gpg] https://apt.repos.intel.com/oneapi all main" > /etc/apt/sources.list.d/oneAPI.list
# https://dgpu-docs.intel.com/driver/client/overview.html
RUN curl https://repositories.intel.com/gpu/intel-graphics.key | gpg --dearmor > /usr/share/keyrings/intel-graphics.gpg
RUN echo "deb [arch=amd64,i386 signed-by=/usr/share/keyrings/intel-graphics.gpg] https://repositories.intel.com/gpu/ubuntu jammy client" > /etc/apt/sources.list.d/intel-gpu-jammy.list
RUN apt update

# 安装 GPU 驱动
RUN apt install -y clinfo hwinfo intel-opencl-icd intel-level-zero-gpu level-zero intel-level-zero-gpu-raytracing mesa-vulkan-drivers intel-igc-cm level-zero-dev && apt clean
# 安装 oneAPI
RUN apt install -y intel-oneapi-dpcpp-cpp-2024.2=2024.2.1-1079 intel-oneapi-mkl-devel=2024.2.1-103 intel-oneapi-ccl-devel=2021.13.1-31 && apt clean

CMD /bin/bash
```

执行命令:

```sh
podman build -t ubuntu-intel-base .
```

结果:

```sh
> podman images
REPOSITORY                     TAG       IMAGE ID      CREATED        SIZE
localhost/ubuntu-intel-base    latest    f0991290cd93  5 minutes ago  7.43 GB
```

### 2.1 编译 vulkan 后端

`Dockerfile` 如下:

```sh
# llama.cpp vulkan
FROM ubuntu-intel-base as build

# 安装 vulkan-sdk
RUN curl https://packages.lunarg.com/lunarg-signing-key-pub.asc | apt-key add -
RUN curl -o /etc/apt/sources.list.d/lunarg-vulkan-jammy.list https://packages.lunarg.com/vulkan/lunarg-vulkan-jammy.list
RUN apt update && apt-get install -y vulkan-sdk && apt clean

WORKDIR /app
COPY llama.cpp-b3600 .

RUN cmake -B build -DGGML_VULKAN=1 -DBUILD_SHARED_LIBS=OFF && \
    cmake --build build --config Release --target llama-cli

# 阶段 2
FROM ubuntu-intel-base as runtime

COPY --from=build /app/build/bin/llama-cli /usr/bin/llama-cli

CMD /bin/bash
```

执行命令:

```sh
podman build -t ubuntu-llamacpp-vulkan .
```

结果:

```sh
> podman images
REPOSITORY                          TAG       IMAGE ID      CREATED        SIZE
localhost/ubuntu-llamacpp-vulkan    latest    ee12a2a1e6f0  2 minutes ago  7.44 GB
```

### 2.2 编译 SYCL (Intel oneAPI) 后端

`Dockerfile` 如下:

```sh
# llama.cpp-b3038/.devops/main-intel.Dockerfile
FROM ubuntu-intel-base as build

WORKDIR /app
COPY llama.cpp-b3038 .

RUN . /opt/intel/oneapi/setvars.sh && \
    cmake -B build -DLLAMA_SYCL=ON -DCMAKE_C_COMPILER=icx -DCMAKE_CXX_COMPILER=icpx -DLLAMA_SYCL_F16=ON && \
    cmake --build build --config Release --target main

# 阶段 2
FROM ubuntu-intel-base as runtime

COPY --from=build /app/build/bin/main /usr/bin/main

CMD /bin/bash
```

执行命令:

```sh
podman build -t ubuntu-llamacpp-sycl .
```

结果:

```sh
> podman images
REPOSITORY                        TAG       IMAGE ID      CREATED         SIZE
localhost/ubuntu-llamacpp-sycl    latest    2baacc3bb758  35 seconds ago  7.44 GB
```


## 3 运行测试

由于 Intel SYCL 只能在特定系统的特定驱动版本才能正常运行,
所以使用了虚拟机 GPU 透传 (详见文章 《QEMU/KVM 虚拟机显卡透传 (vfio-pci)》).

在这篇文章的虚拟机的基础上, 需要额外安装软件包:

```sh
sudo apt -y install gawk dkms linux-headers-$(uname -r) libc6-dev
sudo apt install -y intel-i915-dkms
```

**重启虚拟机**. 虚拟机内的相关信息如下:

```sh
a2@a2s:~$ uname -a
Linux a2s 6.8.0-40-generic #40~22.04.3-Ubuntu SMP PREEMPT_DYNAMIC Tue Jul 30 17:30:19 UTC 2 x86_64 x86_64 x86_64 GNU/Linux
a2@a2s:~$ clinfo -l
Platform #0: Intel(R) OpenCL Graphics
 `-- Device #0: Intel(R) Arc(TM) A770 Graphics
a2@a2s:~$ source /opt/intel/oneapi/setvars.sh
 
:: initializing oneAPI environment ...
   -bash: BASH_VERSION = 5.1.16(1)-release
   args: Using "$@" for setvars.sh arguments: 
:: ccl -- latest
:: compiler -- latest
:: debugger -- latest
:: dev-utilities -- latest
:: mkl -- latest
:: mpi -- latest
:: tbb -- latest
:: oneAPI environment initialized ::
 
a2@a2s:~$ sycl-ls
[opencl:cpu][opencl:0] Intel(R) OpenCL, AMD Ryzen 5 5600G with Radeon Graphics          OpenCL 3.0 (Build 0) [2024.18.7.0.11_160000]
[opencl:gpu][opencl:1] Intel(R) OpenCL Graphics, Intel(R) Arc(TM) A770 Graphics OpenCL 3.0 NEO  [24.22.29735.27]
[level_zero:gpu][level_zero:0] Intel(R) Level-Zero, Intel(R) Arc(TM) A770 Graphics 1.3 [1.3.29735]
```

把上面编译的 llama.cpp 程序 (以及 gguf 模型文件) 复制到虚拟机:

```sh
a2@a2s:~$ ls -l
total 11906072
-r--r--r-- 1 a2 a2 4081004224 Aug 21 05:13 llama-2-7b.Q4_K_M.gguf
-rwxr-xr-x 1 a2 a2    5898128 Aug 23 03:39 llama-cli
-rwxr-xr-x 1 a2 a2    6378544 Aug 23 03:39 main
-r--r--r-- 1 a2 a2 8098522912 Aug 21 06:25 qwen2-7b-instruct-q8_0.gguf
a2@a2s:~$ ./llama-cli --version
version: 1 (2fb9267)
built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
a2@a2s:~$ ./main --version
version: 1 (fb76ec3)
built with Intel(R) oneAPI DPC++/C++ Compiler 2024.2.1 (2024.2.1.20240711) for x86_64-unknown-linux-gnu
```

### 3.1 vulkan 运行测试

使用模型 `llama-2-7b.Q4_K_M.gguf`, 生成长度 200:

```sh
a2@a2s:~$ ./llama-cli -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 200 -ngl 33
Log start
main: build = 1 (2fb9267)
main: built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for x86_64-linux-gnu
main: seed  = 1724384928
llama_model_loader: loaded meta data with 19 key-value pairs and 291 tensors from llama-2-7b.Q4_K_M.gguf (version GGUF V2)
llama_model_loader: Dumping metadata keys/values. Note: KV overrides do not apply in this output.
llama_model_loader: - kv   0:                       general.architecture str              = llama
llama_model_loader: - kv   1:                               general.name str              = LLaMA v2
llama_model_loader: - kv   2:                       llama.context_length u32              = 4096
llama_model_loader: - kv   3:                     llama.embedding_length u32              = 4096
llama_model_loader: - kv   4:                          llama.block_count u32              = 32
llama_model_loader: - kv   5:                  llama.feed_forward_length u32              = 11008
llama_model_loader: - kv   6:                 llama.rope.dimension_count u32              = 128
llama_model_loader: - kv   7:                 llama.attention.head_count u32              = 32
llama_model_loader: - kv   8:              llama.attention.head_count_kv u32              = 32
llama_model_loader: - kv   9:     llama.attention.layer_norm_rms_epsilon f32              = 0.000010
llama_model_loader: - kv  10:                          general.file_type u32              = 15
llama_model_loader: - kv  11:                       tokenizer.ggml.model str              = llama
llama_model_loader: - kv  12:                      tokenizer.ggml.tokens arr[str,32000]   = ["<unk>", "<s>", "</s>", "<0x00>", "<...
llama_model_loader: - kv  13:                      tokenizer.ggml.scores arr[f32,32000]   = [0.000000, 0.000000, 0.000000, 0.0000...
llama_model_loader: - kv  14:                  tokenizer.ggml.token_type arr[i32,32000]   = [2, 3, 3, 6, 6, 6, 6, 6, 6, 6, 6, 6, ...
llama_model_loader: - kv  15:                tokenizer.ggml.bos_token_id u32              = 1
llama_model_loader: - kv  16:                tokenizer.ggml.eos_token_id u32              = 2
llama_model_loader: - kv  17:            tokenizer.ggml.unknown_token_id u32              = 0
llama_model_loader: - kv  18:               general.quantization_version u32              = 2
llama_model_loader: - type  f32:   65 tensors
llama_model_loader: - type q4_K:  193 tensors
llama_model_loader: - type q6_K:   33 tensors
llm_load_vocab: special tokens cache size = 3
llm_load_vocab: token to piece cache size = 0.1684 MB
llm_load_print_meta: format           = GGUF V2
llm_load_print_meta: arch             = llama
llm_load_print_meta: vocab type       = SPM
llm_load_print_meta: n_vocab          = 32000
llm_load_print_meta: n_merges         = 0
llm_load_print_meta: vocab_only       = 0
llm_load_print_meta: n_ctx_train      = 4096
llm_load_print_meta: n_embd           = 4096
llm_load_print_meta: n_layer          = 32
llm_load_print_meta: n_head           = 32
llm_load_print_meta: n_head_kv        = 32
llm_load_print_meta: n_rot            = 128
llm_load_print_meta: n_swa            = 0
llm_load_print_meta: n_embd_head_k    = 128
llm_load_print_meta: n_embd_head_v    = 128
llm_load_print_meta: n_gqa            = 1
llm_load_print_meta: n_embd_k_gqa     = 4096
llm_load_print_meta: n_embd_v_gqa     = 4096
llm_load_print_meta: f_norm_eps       = 0.0e+00
llm_load_print_meta: f_norm_rms_eps   = 1.0e-05
llm_load_print_meta: f_clamp_kqv      = 0.0e+00
llm_load_print_meta: f_max_alibi_bias = 0.0e+00
llm_load_print_meta: f_logit_scale    = 0.0e+00
llm_load_print_meta: n_ff             = 11008
llm_load_print_meta: n_expert         = 0
llm_load_print_meta: n_expert_used    = 0
llm_load_print_meta: causal attn      = 1
llm_load_print_meta: pooling type     = 0
llm_load_print_meta: rope type        = 0
llm_load_print_meta: rope scaling     = linear
llm_load_print_meta: freq_base_train  = 10000.0
llm_load_print_meta: freq_scale_train = 1
llm_load_print_meta: n_ctx_orig_yarn  = 4096
llm_load_print_meta: rope_finetuned   = unknown
llm_load_print_meta: ssm_d_conv       = 0
llm_load_print_meta: ssm_d_inner      = 0
llm_load_print_meta: ssm_d_state      = 0
llm_load_print_meta: ssm_dt_rank      = 0
llm_load_print_meta: model type       = 7B
llm_load_print_meta: model ftype      = Q4_K - Medium
llm_load_print_meta: model params     = 6.74 B
llm_load_print_meta: model size       = 3.80 GiB (4.84 BPW) 
llm_load_print_meta: general.name     = LLaMA v2
llm_load_print_meta: BOS token        = 1 '<s>'
llm_load_print_meta: EOS token        = 2 '</s>'
llm_load_print_meta: UNK token        = 0 '<unk>'
llm_load_print_meta: LF token         = 13 '<0x0A>'
llm_load_print_meta: max token length = 48
ggml_vulkan: Found 1 Vulkan devices:
Vulkan0: Intel(R) Arc(tm) A770 Graphics (DG2) (Intel open-source Mesa driver) | uma: 0 | fp16: 1 | warp size: 32
llm_load_tensors: ggml ctx size =    0.27 MiB
llm_load_tensors: offloading 32 repeating layers to GPU
llm_load_tensors: offloading non-repeating layers to GPU
llm_load_tensors: offloaded 33/33 layers to GPU
llm_load_tensors:        CPU buffer size =    70.31 MiB
llm_load_tensors: Intel(R) Arc(tm) A770 Graphics (DG2) buffer size =  3820.93 MiB
..................................................................................................
llama_new_context_with_model: n_ctx      = 4096
llama_new_context_with_model: n_batch    = 2048
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 10000.0
llama_new_context_with_model: freq_scale = 1
llama_kv_cache_init: Intel(R) Arc(tm) A770 Graphics (DG2) KV buffer size =  2048.00 MiB
llama_new_context_with_model: KV self size  = 2048.00 MiB, K (f16): 1024.00 MiB, V (f16): 1024.00 MiB
llama_new_context_with_model: Vulkan_Host  output buffer size =     0.12 MiB
llama_new_context_with_model: Intel(R) Arc(tm) A770 Graphics (DG2) compute buffer size =   296.00 MiB
llama_new_context_with_model: Vulkan_Host compute buffer size =    16.01 MiB
llama_new_context_with_model: graph nodes  = 1030
llama_new_context_with_model: graph splits = 2

system_info: n_threads = 4 / 4 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 1 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 4096, n_batch = 2048, n_predict = 200, n_keep = 1


 hello, this is a very very long story. I'm in 10th grade and I'm a girl.

(此处省略部分输出结果)

llama_print_timings:        load time =    2264.36 ms
llama_print_timings:      sample time =       6.68 ms /   200 runs   (    0.03 ms per token, 29958.06 tokens per second)
llama_print_timings: prompt eval time =     440.55 ms /    10 tokens (   44.05 ms per token,    22.70 tokens per second)
llama_print_timings:        eval time =    7684.85 ms /   199 runs   (   38.62 ms per token,    25.90 tokens per second)
llama_print_timings:       total time =    8149.27 ms /   209 tokens
Log end
```

生成速度约为 `25.90 tokens per second`, 也就是每秒输出 25.9 个字符.

### 3.2 SYCL 运行测试

使用模型 `llama-2-7b.Q4_K_M.gguf`, 生成长度 200:

```sh
a2@a2s:~$ ./main -m llama-2-7b.Q4_K_M.gguf -p "hello, this is a very very long story" -n 200 -ngl 33
Log start
main: build = 1 (fb76ec3)
main: built with Intel(R) oneAPI DPC++/C++ Compiler 2024.2.1 (2024.2.1.20240711) for x86_64-unknown-linux-gnu
main: seed  = 1724384798

(此处省略部分输出结果)

[SYCL] call ggml_init_sycl
ggml_init_sycl: GGML_SYCL_DEBUG: 0
ggml_init_sycl: GGML_SYCL_F16: yes
found 3 SYCL devices:
|  |                   |                                       |       |Max    |        |Max  |Global |                     |
|  |                   |                                       |       |compute|Max work|sub  |mem    |                     |
|ID|        Device Type|                                   Name|Version|units  |group   |group|size   |       Driver version|
|--|-------------------|---------------------------------------|-------|-------|--------|-----|-------|---------------------|
| 0| [level_zero:gpu:0]|                Intel Arc A770 Graphics|    1.3|    512|    1024|   32| 16225M|            1.3.29735|
| 1|     [opencl:gpu:0]|                Intel Arc A770 Graphics|    3.0|    512|    1024|   32| 16225M|       24.22.29735.27|
| 2|     [opencl:cpu:0]|AMD Ryzen 5 5600G with Radeon Graphics         |    3.0|      4|    8192|   64|  8327M|2024.18.7.0.11_160000|
ggml_backend_sycl_set_mul_device_mode: true
detect 1 SYCL GPUs: [0] with top Max compute units:512
get_memory_info: [warning] ext_intel_free_memory is not supported (export/set ZES_ENABLE_SYSMAN=1 to support), use total memory as free memory
llm_load_tensors: ggml ctx size =    0.30 MiB
llm_load_tensors: offloading 32 repeating layers to GPU
llm_load_tensors: offloading non-repeating layers to GPU
llm_load_tensors: offloaded 33/33 layers to GPU
llm_load_tensors:      SYCL0 buffer size =  3820.94 MiB
llm_load_tensors:        CPU buffer size =    70.31 MiB
..................................................................................................
llama_new_context_with_model: n_ctx      = 512
llama_new_context_with_model: n_batch    = 512
llama_new_context_with_model: n_ubatch   = 512
llama_new_context_with_model: flash_attn = 0
llama_new_context_with_model: freq_base  = 10000.0
llama_new_context_with_model: freq_scale = 1
llama_kv_cache_init:      SYCL0 KV buffer size =   256.00 MiB
llama_new_context_with_model: KV self size  =  256.00 MiB, K (f16):  128.00 MiB, V (f16):  128.00 MiB
llama_new_context_with_model:  SYCL_Host  output buffer size =     0.12 MiB
llama_new_context_with_model:      SYCL0 compute buffer size =    70.50 MiB
llama_new_context_with_model:  SYCL_Host compute buffer size =     9.01 MiB
llama_new_context_with_model: graph nodes  = 1030
llama_new_context_with_model: graph splits = 2

system_info: n_threads = 4 / 4 | AVX = 1 | AVX_VNNI = 0 | AVX2 = 1 | AVX512 = 0 | AVX512_VBMI = 0 | AVX512_VNNI = 0 | AVX512_BF16 = 0 | FMA = 1 | NEON = 0 | SVE = 0 | ARM_FMA = 0 | F16C = 1 | FP16_VA = 0 | WASM_SIMD = 0 | BLAS = 1 | SSE3 = 1 | SSSE3 = 1 | VSX = 0 | MATMUL_INT8 = 0 | LLAMAFILE = 1 | 
sampling: 
	repeat_last_n = 64, repeat_penalty = 1.000, frequency_penalty = 0.000, presence_penalty = 0.000
	top_k = 40, tfs_z = 1.000, top_p = 0.950, min_p = 0.050, typical_p = 1.000, temp = 0.800
	mirostat = 0, mirostat_lr = 0.100, mirostat_ent = 5.000
sampling order: 
CFG -> Penalties -> top_k -> tfs_z -> typical_p -> top_p -> min_p -> temperature 
generate: n_ctx = 512, n_batch = 2048, n_predict = 200, n_keep = 1


 hello, this is a very very long story, so i am going to break it up in two parts.
i started out by saying that i am a very good girl. and that i am.

(此处省略部分输出结果)

llama_print_timings:        load time =    1727.57 ms
llama_print_timings:      sample time =       5.67 ms /   200 runs   (    0.03 ms per token, 35248.50 tokens per second)
llama_print_timings: prompt eval time =     377.79 ms /    10 tokens (   37.78 ms per token,    26.47 tokens per second)
llama_print_timings:        eval time =    6517.30 ms /   199 runs   (   32.75 ms per token,    30.53 tokens per second)
llama_print_timings:       total time =    6917.86 ms /   209 tokens
Log end
```

生成速度约为 `30.53 tokens per second`, 也就是每秒输出 30.5 个字符.


## 4 总结与展望

本文使用容器 (podman) 编译了 llama.cpp 的 vulkan 后端和 SYCL 后端,
并成功在 Intel GPU (A770) 运行, 获得了较快的语言模型推理速度.

SYCL 后端比 vulkan 后端稍微快一点, 但不多.
使用的模型 (gguf), 生成长度, 软件驱动版本, 运行参数设置等很多因素,
都可能影响模型推理的速度, 所以本文中的运行速度仅供参考.

SYCL 比 vulkan 快不了多少, **但是使用 SYCL** (Intel oneAPI) **却非常麻烦 !!**
所以, 至少目前为止, 对于 A770 (16GB) 显卡来说, 使用 vulkan 即可,
强行使用 SYCL 的意义不大.

Intel 和 llama.cpp 对于 SYCL 还需要继续努力, 希望能够更方便, 更快速的运行大模型.

----

本文使用 CC-BY-SA 4.0 许可发布.
