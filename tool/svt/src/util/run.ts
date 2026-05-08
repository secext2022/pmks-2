// 运行命令, 获取结果

/**
 * 执行一条命令.
 *
 * 检查退出码, 如果不为 0, 抛出错误.
 */
export async function 运行(命令: Array<string>) {
  console.log("  运行: " + 命令.join(" "));

  const c = new Deno.Command(命令[0], {
    args: 命令.slice(1),
    stdin: "null",
    stdout: "inherit",
    stderr: "inherit",
  });
  const p = c.spawn();
  const { code } = await p.status;
  if (0 != code) {
    throw new Error("exit code " + code);
  }
}

/**
 * 执行一条命令, 返回标准输出的内容.
 *
 * 检查退出码, 如果不为 0, 抛出错误.
 */
export async function 运行_结果(命令: Array<string>): Promise<string> {
  const c = new Deno.Command(命令[0], {
    args: 命令.slice(1),
    stdin: "null",
    stdout: "piped",
    stderr: "inherit",
  });

  const o = await c.output();
  if (0 != o.code) {
    throw new Error("exit code " + o.code + " " + JSON.stringify(命令));
  }

  // 解码输出结果 (utf-8)
  const d = new TextDecoder();
  return d.decode(o.stdout);
}
