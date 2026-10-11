#!/bin/sh
# run-vm1.sh
set -u

# 等待 VDE 初始化
while [ ! -f /vde-vm1/ctl ]; do
  echo Waiting /vde-vm1 .. .
  sleep 1
done

MON=/run/vm1/monitor.sock
mkdir -p /run/vm1

# 启动 QEMU 虚拟机 (后台运行)
qemu-system-x86_64 \
  -enable-kvm -m 2048 -cpu host -smp 2 -nographic \
  -drive "if=virtio,file=/vm1/2.qcow2" \
  -fw_cfg name=opt/com.coreos/config,file=/vm1/vfc4.ign \
  -nic vde,sock=/vde-vm1,mac=52:54:00:d6:46:4f \
  -monitor unix:"${MON}",server,nowait &

QPID=$!

# 虚拟机 优雅关机
on_term() {
  echo system_powerdown | socat - unix-connect:${MON}
  wait ${QPID}
  exit 0
}
trap on_term TERM INT

# 虚拟机 主动关机
wait ${QPID}
exit $?
