# qemu-alpine
FROM alpine:latest

# 国内镜像
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

RUN apk update && apk upgrade && \
    apk add vde2 qemu-img qemu-tools qemu-system-x86_64 socat && \
    apk cache clean

#CMD /usr/bin/qemu-system-x86_64
CMD /run-vm.sh
