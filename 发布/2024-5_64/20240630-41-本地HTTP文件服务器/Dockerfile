FROM quay.io/jitesoft/alpine:latest

RUN sed -i 's/ftp.halifax.rwth-aachen.de/mirrors.sjtug.sjtu.edu.cn/g' /etc/apk/repositories
RUN apk update && apk upgrade && apk add curl zstd deno icu-data-full && apk cache clean

WORKDIR /srv

RUN deno install -g --allow-net --allow-read --allow-sys jsr:@std/http/file-server

EXPOSE 4507

CMD ["/root/.deno/bin/file-server", "."]
