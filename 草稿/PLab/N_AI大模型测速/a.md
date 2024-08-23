# 本地运行 AI 有多慢 ? 大模型推理测速 (llama.cpp)

上文说到, **天下苦 N 卡久矣**, 直接使用 CPU 推理又太慢.
那么, 在没有 N 卡的情况下, 本地运行 AI (神经网络) 大模型,
能够达到怎样的速度 ?

----

同志们好, 欢迎来到 胖喵穷人实验室 !
这里专注于 **低成本**, **低难度**, **低风险** 的 "三低" 小实验.

```
胖喵穷人实验室 (PM-PLab-E)

正式名称: 紫腹巨蚊 (Toxorhynchites gravelyi) 系列
  穷人 (Poor people) 实验室
```

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术.

----

相关文章:

+ 《自制神之嘴: fish-speech 容器镜像 (文本转语音 AI 大模型)》

  TODO


## 目录

+ 1 测量方法 (模型选择)

  - 1.1 模型量化
  - 1.2 运行后端
  - 1.3 准备: 下载编译好的 llama.cpp 程序
  - 1.4 准备: 编译 vulkan 版 llama.cpp (Linux)
  - 1.5 准备: 制作 ipex.llm 容器镜像

+ 2 CPU 推理测速 (x86_64/AVX2)

  - 2.1 Intel E5-2650v3 (10C/10T/3.0GHz) (Linux)
  - 2.2 Intel i5-6200U (2C/4T/2.8GHz) (Linux)
  - 2.3 AMD r5-5600g (6C/12T/4.4GHz) (Linux/Windows)

+ 3 iGPU 推理测速 (vulkan)

  - 3.1 Intel HD520 (i5-6200U) (Linux)
  - 3.2 AMD Radeon Vega 7 (r5-5600g) (Linux/Windows)

+ 4 (dGPU) Intel Arc A770 (16GB) 推理测速

  - 4.1 vulkan 推理 (Linux/Windows)
  - 4.2 SYCL 推理 (Windows)
  - 4.3 ipex.llm 推理 (Linux)

+ 5 总结与展望


## 1 测量方法 (模型选择)

TODO


----

ollama:
+ <https://github.com/ollama/ollama>

GPT4All:
+ <https://www.nomic.ai/gpt4all>
+ <https://github.com/nomic-ai/gpt4all>
+ <https://www.nomic.ai/blog/posts/gpt4all-gpu-inference-with-vulkan>

llama.cpp:
+ <https://github.com/ggerganov/llama.cpp>
+ <https://github.com/ggerganov/llama.cpp/blob/master/docs/backend/SYCL.md>
+ <https://github.com/ggerganov/ggml>

+ <https://www.intel.com/content/www/us/en/developer/articles/technical/run-llm-on-all-gpus-using-llama-cpp-artical.html>

+ <https://hf-mirror.com/TheBloke/Llama-2-7B-GGUF>
+ <https://hf-mirror.com/Qwen/Qwen2-7B-Instruct-GGUF>

Intel ipex-llm:
+ <https://github.com/intel-analytics/ipex-llm>
+ <https://github.com/intel-analytics/ipex-llm/blob/main/docs/mddocs/Quickstart/benchmark_quickstart.md>
+ <https://github.com/intel-analytics/ipex-llm/blob/main/docs/mddocs/Overview/FAQ/faq.md>
+ <https://intel.github.io/intel-extension-for-pytorch/xpu/latest/>
+ <https://github.com/intel/intel-extension-for-pytorch>
+ <https://registry.khronos.org/SYCL/specs/sycl-2020/html/sycl-2020.html>

+ <https://github.com/QwenLM/Qwen2>

TODO

```sh
fc-test@MiWiFi-RA74-srv:~/llama-b3600-bin-ubuntu-x64$ ./build/bin/llama-cli -m ./llama-2-7b.Q4_K_M.gguf -p "When I was a little girl, my friend was cute. That was a long story. She " -n 500 > test-1.txt 2>&1
```

TODO

```sh
> sudo pacman -S intel-oneapi-basekit
```

TODO

```sh
> cmake -B build -DGGML_VULKAN=1 -DBUILD_SHARED_LIBS=OFF

> cmake --build build --config Release -j 2
```

TODO

```sh
$ cmake -B build -DGGML_SYCL=ON -DCMAKE_C_COMPILER=icx -DCMAKE_CXX_COMPILER=icpx -DBUILD_SHARED_LIBS=OFF
```

TODO

<https://qwen.readthedocs.io/zh-cn/latest/>

TODO

TODO

<https://dgpu-docs.intel.com/driver/installation.html#ubuntu>
<https://intel.github.io/intel-extension-for-pytorch/index.html#installation?platform=gpu&version=v2.1.40%2bxpu&os=linux%2fwsl2&package=pip>

```sh
> podman run -it --rm --device /dev/dri ubuntu-py310-ipex-xpu
root@4953e3176cc6:/# clinfo -l
Platform #0: Intel(R) OpenCL Graphics
 `-- Device #0: Intel(R) HD Graphics 520
root@4953e3176cc6:/# source /opt/intel/oneapi/setvars.sh 
```

TODO

```sh
root@4953e3176cc6:/# sycl-ls
[opencl:cpu][opencl:0] Intel(R) OpenCL, Intel(R) Core(TM) i5-6200U CPU @ 2.30GHz OpenCL 3.0 (Build 0) [2024.18.7.0.11_160000]
[opencl:gpu][opencl:1] Intel(R) OpenCL Graphics, Intel(R) HD Graphics 520 OpenCL 3.0 NEO  [23.43.27642.52]
[level_zero:gpu][level_zero:0] Intel(R) Level-Zero, Intel(R) HD Graphics 520 1.3 [1.3.27642]
root@4953e3176cc6:/# python -c "import torch; import intel_extension_for_pytorch as ipex; print(torch.__version__); print(ipex.__version__); [print(f'[{i}]: {torch.xpu.get_device_properties(i)}') for i in range(torch.xpu.device_count())];"
2.1.0.post3+cxx11.abi
2.1.40+xpu
[0]: _DeviceProperties(name='Intel(R) HD Graphics 520', platform_name='Intel(R) Level-Zero', dev_type='gpu', driver_version='1.3.27642', has_fp64=1, total_memory=14488MB, max_compute_units=24, gpu_eu_count=24)
root@4953e3176cc6:/# 
```

TODO
