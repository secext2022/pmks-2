FROM quay.io/jitesoft/alpine:latest

#RUN sed -i 's/ftp.halifax.rwth-aachen.de/mirrors.sjtug.sjtu.edu.cn/g' /etc/apk/repositories
RUN sed -i 's/ftp.halifax.rwth-aachen.de/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories
RUN apk update && apk upgrade && apk add icu-data-full nodejs-current npm && apk cache clean

WORKDIR /app
COPY ./md .

RUN npm config set registry http://registry.npm.taobao.org/
RUN npm i && npm run build:only

EXPOSE 4173

CMD npx vite preview --host
