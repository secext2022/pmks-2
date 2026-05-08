# 使用 ffmpeg 生成白噪声/粉噪声/棕噪声/蓝噪声/紫噪声/丝绒噪声


使用的 ffmpeg 版本:

```
> ffmpeg -version
ffmpeg version n5.1.2 Copyright (c) 2000-2022 the FFmpeg developers
built with gcc 12.2.0 (GCC)
configuration: --prefix=/usr --disable-debug --disable-static --disable-stripping --enable-amf --enable-avisynth --enable-cuda-llvm --enable-lto --enable-fontconfig --enable-gmp --enable-gnutls --enable-gpl --enable-ladspa --enable-libaom --enable-libass --enable-libbluray --enable-libbs2b --enable-libdav1d --enable-libdrm --enable-libfreetype --enable-libfribidi --enable-libgsm --enable-libiec61883 --enable-libjack --enable-libmfx --enable-libmodplug --enable-libmp3lame --enable-libopencore_amrnb --enable-libopencore_amrwb --enable-libopenjpeg --enable-libopus --enable-libpulse --enable-librav1e --enable-librsvg --enable-libsoxr --enable-libspeex --enable-libsrt --enable-libssh --enable-libsvtav1 --enable-libtheora --enable-libv4l2 --enable-libvidstab --enable-libvmaf --enable-libvorbis --enable-libvpx --enable-libwebp --enable-libx264 --enable-libx265 --enable-libxcb --enable-libxml2 --enable-libxvid --enable-libzimg --enable-nvdec --enable-nvenc --enable-opencl --enable-opengl --enable-shared --enable-version3 --enable-vulkan
libavutil      57. 28.100 / 57. 28.100
libavcodec     59. 37.100 / 59. 37.100
libavformat    59. 27.100 / 59. 27.100
libavdevice    59.  7.100 / 59.  7.100
libavfilter     8. 44.100 /  8. 44.100
libswscale      6.  7.100 /  6.  7.100
libswresample   4.  7.100 /  4.  7.100
libpostproc    56.  6.100 / 56.  6.100
```

![ffmpeg version](../图/20230218-1/ffmpeg-version-20.jpg)


## 生成命令

+ **白噪声**

  ```
  ffmpeg -f lavfi -i anoisesrc=c=0 -t 2s 0.wav
  ```

  示例:

  ```
  > ffmpeg -f lavfi -i anoisesrc=c=0 -t 2s 0.wav
  ffmpeg version n5.1.2 Copyright (c) 2000-2022 the FFmpeg developers
    built with gcc 12.2.0 (GCC)
    configuration: --prefix=/usr --disable-debug --disable-static --disable-stripping --enable-amf --enable-avisynth --enable-cuda-llvm --enable-lto --enable-fontconfig --enable-gmp --enable-gnutls --enable-gpl --enable-ladspa --enable-libaom --enable-libass --enable-libbluray --enable-libbs2b --enable-libdav1d --enable-libdrm --enable-libfreetype --enable-libfribidi --enable-libgsm --enable-libiec61883 --enable-libjack --enable-libmfx --enable-libmodplug --enable-libmp3lame --enable-libopencore_amrnb --enable-libopencore_amrwb --enable-libopenjpeg --enable-libopus --enable-libpulse --enable-librav1e --enable-librsvg --enable-libsoxr --enable-libspeex --enable-libsrt --enable-libssh --enable-libsvtav1 --enable-libtheora --enable-libv4l2 --enable-libvidstab --enable-libvmaf --enable-libvorbis --enable-libvpx --enable-libwebp --enable-libx264 --enable-libx265 --enable-libxcb --enable-libxml2 --enable-libxvid --enable-libzimg --enable-nvdec --enable-nvenc --enable-opencl --enable-opengl --enable-shared --enable-version3 --enable-vulkan
    libavutil      57. 28.100 / 57. 28.100
    libavcodec     59. 37.100 / 59. 37.100
    libavformat    59. 27.100 / 59. 27.100
    libavdevice    59.  7.100 / 59.  7.100
    libavfilter     8. 44.100 /  8. 44.100
    libswscale      6.  7.100 /  6.  7.100
    libswresample   4.  7.100 /  4.  7.100
    libpostproc    56.  6.100 / 56.  6.100
  Input #0, lavfi, from 'anoisesrc=c=0':
    Duration: N/A, start: 0.000000, bitrate: 3072 kb/s
    Stream #0:0: Audio: pcm_f64le, 48000 Hz, mono, dbl, 3072 kb/s
  Stream mapping:
    Stream #0:0 -> #0:0 (pcm_f64le (native) -> pcm_s16le (native))
  Press [q] to stop, [?] for help
  Output #0, wav, to '0.wav':
    Metadata:
      ISFT            : Lavf59.27.100
    Stream #0:0: Audio: pcm_s16le ([1][0][0][0] / 0x0001), 48000 Hz, mono, s16, 768 kb/s
      Metadata:
        encoder         : Lavc59.37.100 pcm_s16le
  size=     188kB time=00:00:02.00 bitrate= 768.3kbits/s speed= 649x    
  video:0kB audio:188kB subtitle:0kB other streams:0kB global headers:0kB muxing overhead: 0.040625%
  ```

+ **粉噪声**

  ```
  ffmpeg -f lavfi -i anoisesrc=c=1 -t 2s 1.wav
  ```

+ **棕噪声**

  ```
  ffmpeg -f lavfi -i anoisesrc=c=2 -t 2s 2.wav
  ```

+ **蓝噪声**

  ```
  ffmpeg -f lavfi -i anoisesrc=c=3 -t 2s 3.wav
  ```

+ **紫噪声**

  ```
  ffmpeg -f lavfi -i anoisesrc=c=4 -t 2s 4.wav
  ```

+ **丝绒噪声**

  ```
  ffmpeg -f lavfi -i anoisesrc=c=5 -t 2s 5.wav
  ```


## 命令参数解释

`ffmpeg -f lavfi -i anoisesrc=c=0 -t 2s 0.wav`

+ `ffmpeg`

  运行 ffmpeg 程序.

+ `-f lavfi`

  使用 libavfilter.
  这个参数是为了使用后面的 `-i anoisesrc`.

+ `-i anoisesrc=c=0`

  使用 `anoisesrc` 生成噪声, 其中 `c=0` 表示噪声类型, `0` 是白噪声.
  修改这个参数还可以生成粉噪声, 棕噪声等.

+ `-t 2s`

  时长, 此处是 2 秒.

+ `0.wav`

  输出文件名, `wav` 后缀表示使用无压缩的声音文件格式.
  ffmpeg 会自动根据文件名后缀选择相应的文件格式.


## 帮助信息

```
> ffmpeg -h filter=anoisesrc
ffmpeg version n5.1.2 Copyright (c) 2000-2022 the FFmpeg developers
  built with gcc 12.2.0 (GCC)
  configuration: --prefix=/usr --disable-debug --disable-static --disable-stripping --enable-amf --enable-avisynth --enable-cuda-llvm --enable-lto --enable-fontconfig --enable-gmp --enable-gnutls --enable-gpl --enable-ladspa --enable-libaom --enable-libass --enable-libbluray --enable-libbs2b --enable-libdav1d --enable-libdrm --enable-libfreetype --enable-libfribidi --enable-libgsm --enable-libiec61883 --enable-libjack --enable-libmfx --enable-libmodplug --enable-libmp3lame --enable-libopencore_amrnb --enable-libopencore_amrwb --enable-libopenjpeg --enable-libopus --enable-libpulse --enable-librav1e --enable-librsvg --enable-libsoxr --enable-libspeex --enable-libsrt --enable-libssh --enable-libsvtav1 --enable-libtheora --enable-libv4l2 --enable-libvidstab --enable-libvmaf --enable-libvorbis --enable-libvpx --enable-libwebp --enable-libx264 --enable-libx265 --enable-libxcb --enable-libxml2 --enable-libxvid --enable-libzimg --enable-nvdec --enable-nvenc --enable-opencl --enable-opengl --enable-shared --enable-version3 --enable-vulkan
  libavutil      57. 28.100 / 57. 28.100
  libavcodec     59. 37.100 / 59. 37.100
  libavformat    59. 27.100 / 59. 27.100
  libavdevice    59.  7.100 / 59.  7.100
  libavfilter     8. 44.100 /  8. 44.100
  libswscale      6.  7.100 /  6.  7.100
  libswresample   4.  7.100 /  4.  7.100
  libpostproc    56.  6.100 / 56.  6.100
Filter anoisesrc
  Generate a noise audio signal.
    Inputs:
        none (source filter)
    Outputs:
       #0: default (audio)
anoisesrc AVOptions:
   sample_rate       <int>        ..F.A...... set sample rate (from 15 to INT_MAX) (default 48000)
   r                 <int>        ..F.A...... set sample rate (from 15 to INT_MAX) (default 48000)
   amplitude         <double>     ..F.A...... set amplitude (from 0 to 1) (default 1)
   a                 <double>     ..F.A...... set amplitude (from 0 to 1) (default 1)
   duration          <duration>   ..F.A...... set duration (default 0)
   d                 <duration>   ..F.A...... set duration (default 0)
   color             <int>        ..F.A...... set noise color (from 0 to 5) (default white)
     white           0            ..F.A......
     pink            1            ..F.A......
     brown           2            ..F.A......
     blue            3            ..F.A......
     violet          4            ..F.A......
     velvet          5            ..F.A......
   colour            <int>        ..F.A...... set noise color (from 0 to 5) (default white)
     white           0            ..F.A......
     pink            1            ..F.A......
     brown           2            ..F.A......
     blue            3            ..F.A......
     violet          4            ..F.A......
     velvet          5            ..F.A......
   c                 <int>        ..F.A...... set noise color (from 0 to 5) (default white)
     white           0            ..F.A......
     pink            1            ..F.A......
     brown           2            ..F.A......
     blue            3            ..F.A......
     violet          4            ..F.A......
     velvet          5            ..F.A......
   seed              <int64>      ..F.A...... set random seed (from -1 to UINT32_MAX) (default -1)
   s                 <int64>      ..F.A...... set random seed (from -1 to UINT32_MAX) (default -1)
   nb_samples        <int>        ..F.A...... set the number of samples per requested frame (from 1 to INT_MAX) (default 1024)
   n                 <int>        ..F.A...... set the number of samples per requested frame (from 1 to INT_MAX) (default 1024)

```

参考文档:

+ <https://ffmpeg.org/ffmpeg.html>


## LICENSE

`CC BY-SA 4.0`

许可: 创意共享-署名-相同方式共享

2023-02-18
