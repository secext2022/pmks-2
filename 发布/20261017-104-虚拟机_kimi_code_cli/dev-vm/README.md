# 开发环境 (虚拟机) 说明

AI agent 可以按需修改本文件.

每次 AI agent 开始工作时, 都会优先读取此文件 (在给 AI agent
的提示词里面会这样写), 所以此文件也可以写一些重要且简短的注意事项, 以方便 AI
agent 工作.

此目录 (`~/dev-vm/`) 只存放关于 开发环境 的文档.

当前用户 主目录 位于:

```sh
[kc1@arch-ai-agent-202610 ~]$ id
uid=1001(kc1) gid=1001(kc1) groups=1001(kc1)
[kc1@arch-ai-agent-202610 ~]$ pwd
/home/@u/kc1
[kc1@arch-ai-agent-202610 ~]$ echo $HOME
/home/@u/kc1
```

## 专用虚拟机

本虚拟机 (VirtualBox) 是专门为 AI agent 准备的, 用来让 AI agent 干活的 (只用于
AI agent). 由于 虚拟机 已经进行了很强的安全隔离, 所以 AI agent 请放心操作,
除非发生 虚拟机逃逸 等特殊情况, 应该不会造成太大危害.

AI agent 只作为 普通 Linux 用户 运行, 所以权限受限. root 权限只有 (人类) 管理员
有, 用来维护系统.

所以 AI agent 不能安装新的系统软件包. 关于已经安装的软件包,
以及预先提供的只读数据, 详见: **只读数据 (开发环境) 说明**
`/home/@u/ro/README.md`

## 外部 git 服务器

在本地 局域网 有一台 gitea 服务器 (另一台机器), 开发环境 (AI agent 运行的 Linux
用户) 已经配置好了 SSH 连接, 可以直接推送 git 提交.

```sh
[kc1@arch-ai-agent-202610 ~]$ ssh -T git@local_gitea
Hi there, kc1! You've successfully authenticated with the SSH key named kc1-local-gitea-20261017.
Gitea does not provide shell access. If this is unexpected, please setup Gitea under another SSH user or use container to deploy.
```

TODO AI agent 可按需补充更多内容

---

`2026-10-17`
