# wx-md

<https://github.com/doocs/md>

制作容器镜像:

```sh
git clone --single-branch --depth=1 "https://github.com/doocs/md"

podman build -t wx-md-20260926 .
```

启动运行:

```sh
podman run --rm -p 8080:8080 wx-md-20260926
```

---

```sh
> podman images
REPOSITORY                                 TAG         IMAGE ID      CREATED        SIZE
localhost/wx-md-20260926                   latest      2dcf98f79db2  9 minutes ago  29.8 MB
```

TODO
