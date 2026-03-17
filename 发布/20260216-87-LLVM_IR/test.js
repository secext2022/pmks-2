// test.js
//
// deno run --allow-read test.js 6.wasm

// 命令行参数
const [f_wasm] = Deno.args;

console.log("加载", f_wasm);
// 读取 wasm 二进制
const b = await Deno.readFile(f_wasm);

// 编译 wasm 模块
const m = await WebAssembly.compile(b);

// 生成导入数据
function 导入() {
  // 运行内存
  const __linear_memory = new WebAssembly.Memory({ initial: 1024 });

  // 导入函数
  function print_i32(值) {
    console.log("print_i32", 值);
  }

  function print_utf8(偏移, 长度) {
    // 读取二进制数据
    const b = new Uint8Array(__linear_memory.buffer, 偏移, 长度);

    // 字符串 utf8 解码
    const s = new TextDecoder("utf8").decode(b);

    console.log("print_utf8", s);
  }

  return {
    env: {
      __linear_memory,
      print_i32,
      print_utf8,
    },
  };
}

// 实例化模块
const i = new WebAssembly.Instance(m, 导入());

// 调用导出函数
i.exports.main();
