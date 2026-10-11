# vde2-alpine
FROM alpine:latest

# 国内镜像
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

RUN apk update && apk upgrade && \
    apk add vde2 && \
    apk cache clean

CMD /usr/bin/vde_switch
