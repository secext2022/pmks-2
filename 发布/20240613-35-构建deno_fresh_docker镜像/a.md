# 构建 deno/fresh 的 docker 镜像

众所周知, 最近 docker 镜像的使用又出现了新的困难.
但是不怕, 窝们可以使用曲线救国的方法: 自己制作容器镜像 !

下面以 deno/fresh 举栗, 部署一个简单的应用.


## 目录

+ 1 创建 deno/fresh 项目

+ 2 构建 docker 镜像

+ 3 部署和测试

+ 4 总结与展望


## 1 创建 deno/fresh 项目

执行命令:

```sh
deno run -A -r https://fresh.deno.dev
```

初始化 git 仓库并提交:

```sh
> cd test-2406
> git init .
已初始化空的 Git 仓库于 /home/s2/test-2406/.git/
> git add .
> git commit -m " test fresh "
[main（根提交） 2e2084b]  test fresh
 21 files changed, 339 insertions(+)
 create mode 100644 .gitignore
 create mode 100644 .vscode/extensions.json
 create mode 100644 .vscode/settings.json
 create mode 100644 .vscode/tailwind.json
 create mode 100644 README.md
 create mode 100644 components/Button.tsx
 create mode 100644 deno.json
 create mode 100755 dev.ts
 create mode 100644 fresh.config.ts
 create mode 100644 fresh.gen.ts
 create mode 100644 islands/Counter.tsx
 create mode 100644 main.ts
 create mode 100644 routes/_404.tsx
 create mode 100644 routes/_app.tsx
 create mode 100644 routes/api/joke.ts
 create mode 100644 routes/greet/[name].tsx
 create mode 100644 routes/index.tsx
 create mode 100644 static/favicon.ico
 create mode 100644 static/logo.svg
 create mode 100644 static/styles.css
 create mode 100644 tailwind.config.ts
> git status
位于分支 main
无文件要提交，干净的工作区
```


## 2 构建 docker 镜像

创建文件 `Dockerfile`:

```sh
FROM quay.io/jitesoft/alpine:latest

ARG GIT_REVISION
ENV DENO_DEPLOYMENT_ID=${GIT_REVISION}

RUN sed -i 's/ftp.halifax.rwth-aachen.de/mirrors.sjtug.sjtu.edu.cn/g' /etc/apk/repositories
RUN apk update && apk upgrade && apk add curl zstd deno icu-data-full && apk cache clean

WORKDIR /app

COPY . .
RUN deno cache main.ts && deno task build

EXPOSE 8000

CMD ["/usr/bin/deno", "run", "-A", "/app/main.ts"]
```

执行命令:

```sh
docker build --build-arg GIT_REVISION=$(git rev-parse HEAD) -t my-app .
```

构建成功:

```sh
> docker images
REPOSITORY                    TAG             IMAGE ID       CREATED              SIZE
my-app                        latest          83173f90cca5   About a minute ago   227MB
quay.io/jitesoft/alpine       latest          c7ecb923af0e   37 hours ago         7.82MB
```

将构建成功的容器镜像导出为压缩包:

```sh
> docker save my-app | zstd > my-app.tar.zst
> ls -lh my-app.tar.zst
-rw-r--r-- 1 s2 s2 77M  6月13日 10:01 my-app.tar.zst
```


## 3 部署和测试

将压缩包文件 `my-app.tar.zst` 复制到要部署的机器, 导入容器镜像:

```sh
> docker load < my-app.tar.zst
31e29b5ab918: Loading layer [==================================================>]  3.072kB/3.072kB
c83c49512daf: Loading layer [==================================================>]  145.6MB/145.6MB
ff9964444958: Loading layer [==================================================>]  1.536kB/1.536kB
6389ca351a5d: Loading layer [==================================================>]    171kB/171kB
2ca6496c9f8b: Loading layer [==================================================>]  83.91MB/83.91MB
Loaded image: my-app:latest
> docker images
REPOSITORY                    TAG             IMAGE ID       CREATED         SIZE
my-app                        latest          83173f90cca5   2 minutes ago   227MB
```

运行容器:

```sh
> docker run -it -p 8000:8000 my-app
Using snapshot found at /app/_fresh
 🍋 Fresh ready  Local: http://localhost:8000/
```

浏览器打开页面:

![测试页面](./图/3-t-1.png)


## 4 总结与展望

容器是一种很好的技术, 开发, 测试, 部署运行都很方便快速.

窝们应该掌握容器镜像的构建方法, 做到更灵活的运行容器,
从而在复杂多变的网络环境中稳定持久运行.

----

参考资料:

+ <https://deno.com/>

+ <https://fresh.deno.dev/>

+ <https://quay.io/repository/jitesoft/alpine>

+ <https://www.alpinelinux.org/>

+ <https://docs.alpinelinux.org/user-handbook/0.1a/Working/apk.html>

+ <https://mirror.sjtu.edu.cn/docs/alpine>

----

本文使用 CC-BY-SA 4.0 许可发布.
