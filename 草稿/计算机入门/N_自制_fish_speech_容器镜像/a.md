# 自制 fish-speech 容器镜像: 文本转语音 AI 大模型 (CPU 推理)

TODO

<https://github.com/fishaudio/fish-speech>

<https://speech.fish.audio/>

TODO

```sh
> docker pull quay.io/jitesoft/debian
Using default tag: latest
latest: Pulling from jitesoft/debian
9a47157d6de8: Pull complete 
Digest: sha256:6c2c11a122e6379708854245bb34cd14d13c8ba24131222872e4ba4816f344fd
Status: Downloaded newer image for quay.io/jitesoft/debian:latest
quay.io/jitesoft/debian:latest
> docker pull quay.io/jitesoft/debian:latest-slim
latest-slim: Pulling from jitesoft/debian
6da0395e8863: Pull complete 
Digest: sha256:61bd6f8075f71f66336a99101eb60ea04e3df8bb2c89b6a10a5df3925ec4b6a2
Status: Downloaded newer image for quay.io/jitesoft/debian:latest-slim
quay.io/jitesoft/debian:latest-slim
> docker images
REPOSITORY                                TAG             IMAGE ID       CREATED        SIZE
quay.io/jitesoft/debian                   latest-slim     437e15117c4a   5 weeks ago    74.8MB
quay.io/jitesoft/debian                   latest          536eabe0b951   5 weeks ago    117MB
```

TODO

<https://mirror.sjtu.edu.cn/docs/debian>

TODO

```sh
> docker pull quay.io/jitesoft/ubuntu:22.04
22.04: Pulling from jitesoft/ubuntu
0313c0652f66: Pull complete 
562320aefb66: Pull complete 
Digest: sha256:d6e979270e859efa6d2976e315944816b0c1c5a93c901a5f67f9a58e54edcd54
Status: Downloaded newer image for quay.io/jitesoft/ubuntu:22.04
quay.io/jitesoft/ubuntu:22.04
> docker images
REPOSITORY                TAG     IMAGE ID       CREATED         SIZE
quay.io/jitesoft/ubuntu   22.04   100c712b0c2b   13 months ago   77.8MB
```

TODO

```sh
> docker build -t f-base .

> docker images
REPOSITORY            TAG     IMAGE ID       CREATED          SIZE
f-base                latest  059c1254b455   9 minutes ago    8.69GB
```

TODO

```sh
> ls -l

-rw-r--r-- 1 s2 s2 600573  8月 6日 23:25 fish-speech-main.zip
> find checkpoints ref_data
checkpoints
checkpoints/fish-speech-1.2-sft
checkpoints/fish-speech-1.2-sft/special_tokens_map.json
checkpoints/fish-speech-1.2-sft/README.md
checkpoints/fish-speech-1.2-sft/firefly-gan-vq-fsq-4x1024-42hz-generator.pth
checkpoints/fish-speech-1.2-sft/tokenizer_config.json
checkpoints/fish-speech-1.2-sft/tokenizer.json
checkpoints/fish-speech-1.2-sft/config.json
checkpoints/fish-speech-1.2-sft/.gitattributes
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

TODO

<https://hf-mirror.com/fishaudio/fish-speech-1.2-sft>

TODO

```sh
> docker build -t fish-speech .

> docker images
REPOSITORY            TAG     IMAGE ID       CREATED             SIZE
fish-speech           latest  904d551ad139   42 seconds ago      17GB
f-base                latest  059c1254b455   24 minutes ago      8.69GB
```

TODO

```sh
> docker run --rm -p 8090:8080 fish-speech
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

TODO

```sh
> docker save fish-speech | zstd > fish-speech-20240807.tar.zst
> ls -l

-rw-r--r-- 1 s2 s2 10498845335  8月 7日 06:53 fish-speech-20240807.tar.zst
```

TODO

```sh
> python -m tools.post_api --url http://localhost:8090/v1/invoke --text "测试说话" --speaker "1paimon" --emotion "e1" --out 2_test.wav
Audio has been saved to '2_test.wav'.
```

TODO

```sh
2024-08-06 22:44:35.020 | INFO     | __main__:inference:222 - ref_path: ref_data/1paimon/e1/2003_1.wav
2024-08-06 22:44:35.020 | INFO     | __main__:inference:223 - ref_text: 不过, 我们这边也不是那么好骗的

2024-08-06 22:45:08.752 | INFO     | __main__:encode_reference:107 - Loaded audio with 2.94 seconds
2024-08-06 22:45:09.478 | INFO     | __main__:encode_reference:115 - Encoded prompt: torch.Size([4, 126])
2024-08-06 22:45:09.478 | INFO     | __main__:inference:231 - ref_text: 不过, 我们这边也不是那么好骗的

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

TODO

TODO
