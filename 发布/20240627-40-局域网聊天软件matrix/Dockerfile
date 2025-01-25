FROM quay.io/jitesoft/alpine:latest

RUN sed -i 's/ftp.halifax.rwth-aachen.de/mirrors.sjtug.sjtu.edu.cn/g' /etc/apk/repositories
RUN apk update && apk upgrade && apk add synapse curl icu-data-full && apk cache clean

EXPOSE 8008/tcp 8009/tcp 8448/tcp

ENTRYPOINT ["/usr/bin/synapse_homeserver"]

HEALTHCHECK --start-period=5s --interval=15s --timeout=5s \
  CMD curl -fSs http://localhost:8008/health || exit 1

#CMD ["/bin/ash"]
