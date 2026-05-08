// MCP 工具的具体实现 (stool_run)
import { spawn } from "node:child_process";

// async
function 执行命令(command, cwd, env) {
  return new Promise((resolve) => {
    const p = spawn(command[0], command.slice(1), {
      cwd,
      env: { ...process.env, ...env },
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    p.stdout.on("data", (c) => {
      stdout += c;
    });
    p.stderr.on("data", (c) => {
      stderr += c;
    });

    p.on("close", (code) => {
      resolve({
        stdout,
        stderr,
        code,
      });
    });

    p.on("error", (r) => {
      resolve({
        stdout,
        stderr,
        code: -1,
        error: r.message,
      });
    });
  });
}

// 运行本地命令
export async function stool_run(command, cwd, env) {
  const { stdout, stderr, code, error } = await 执行命令(command, cwd, env);

  // 格式化输出结果
  const o = [`==== STDOUT ====
${stdout}
==== STDERR ====
${stderr}
==== EXIT CODE ${code} ====
`];

  if (error) {
    o.push(`==== ERROR ====
${error}`);
  }
  return o.join("\n");
}
