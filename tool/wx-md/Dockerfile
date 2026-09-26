FROM alpine:latest AS builder

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

RUN apk update && apk upgrade && \
    apk add icu-data-full nodejs-current pnpm && \
    apk cache clean

WORKDIR /app
COPY ./md .

RUN pnpm config set registry https://registry.npmmirror.com

RUN pnpm i
RUN pnpm web build

# 阶段 2
FROM alpine:latest

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

RUN apk update && apk upgrade && \
    apk add miniserve && \
    apk cache clean

WORKDIR /app
COPY --from=builder /app/apps/web/dist /app/md

EXPOSE 8080

CMD miniserve /app
