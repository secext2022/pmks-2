# 原神 声音资源解包

使用工具:

+ QuickBMS
  <https://aluigi.altervista.org/quickbms.htm>

+ `wavescan.bms`
  <https://github.com/Vextil/Wwise-Unpacker>

  `.pck` -> `.wem`

+ vgmstream
  <https://github.com/vgmstream/vgmstream>

  `.wem` -> `.wav`


## 命令

(`fish`)

+ `.pck` -> `.wem`

  ```sh
  for i in (ls ../AudioAssets/*.pck); echo $i; ./quickbms wavescan.bms $i wem > log/AudioAssets/$i.txt 2>&1; end
  ```

+ `.wem` -> `.wav`

  ```sh
  for i in (ls wem); echo $i; ./vgmstream-cli -o wav/$i.wav wem/$i; end
  ```


TODO
