# alpine-qemu-libvirt
FROM quay.io/jitesoft/alpine:latest

RUN sed -i 's/ftp.halifax.rwth-aachen.de/mirrors.sjtug.sjtu.edu.cn/g' /etc/apk/repositories

RUN apk update && apk upgrade && \
    apk add curl bridge-utils \
            qemu qemu-block-curl qemu-block-ssh qemu-bridge-helper qemu-img qemu-system-x86_64 qemu-tools \
            libvirt libvirt-daemon libvirt-qemu && \
    apk cache clean

RUN cp /etc/libvirt/libvirtd.conf /etc/libvirt/libvirtd.conf.old && \
    cp /etc/libvirt/qemu.conf /etc/libvirt/qemu.conf.old
COPY ./libvirtd.conf /etc/libvirt/libvirtd.conf
COPY ./qemu.conf /etc/libvirt/qemu.conf

# default port
EXPOSE 16509

# VOLUME /var/lib/libvirt/images

CMD /usr/sbin/virtlogd -d && /usr/sbin/libvirtd -l
#CMD /bin/ash
