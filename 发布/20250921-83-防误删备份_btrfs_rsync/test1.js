// 每 10 秒向文件 test202509.txt 写入当前时间, 模拟频繁修改文件

async function 写测试文件() {
  const 当前时间 = new Date().toISOString();
  // 方便调试
  console.log(当前时间);

  // 写入文件
  await Deno.writeTextFile("test202509.txt", 当前时间);
}

// 每 10 秒执行一次
setInterval(写测试文件, 10 * 1000);

// 启动后立即写一次
写测试文件();
