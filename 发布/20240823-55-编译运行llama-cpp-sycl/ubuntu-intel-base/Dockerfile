# ubuntu-intel-base (ubuntu 22.04)
FROM quay.io/jitesoft/ubuntu:22.04

# re-install ca-certificates
#RUN apt update && apt install -y ca-certificates
# fix
RUN touch /etc/apt/apt.conf.d/99-verify-peer.conf && echo >>/etc/apt/apt.conf.d/99-verify-peer.conf "Acquire { https::Verify-Peer false }"

# set apt mirror
RUN sed -i 's/http:\/\/archive.ubuntu.com/https:\/\/mirror.sjtu.edu.cn/g' /etc/apt/sources.list
# update system, clean
RUN apt update && apt upgrade -y && apt install -y ca-certificates curl gpg cmake git && apt clean

# add intel apt repo
RUN curl https://apt.repos.intel.com/intel-gpg-keys/GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB | gpg --dearmor > /usr/share/keyrings/oneapi-archive-keyring.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/oneapi-archive-keyring.gpg] https://apt.repos.intel.com/oneapi all main" > /etc/apt/sources.list.d/oneAPI.list
# https://dgpu-docs.intel.com/driver/client/overview.html
RUN curl https://repositories.intel.com/gpu/intel-graphics.key | gpg --dearmor > /usr/share/keyrings/intel-graphics.gpg
RUN echo "deb [arch=amd64,i386 signed-by=/usr/share/keyrings/intel-graphics.gpg] https://repositories.intel.com/gpu/ubuntu jammy client" > /etc/apt/sources.list.d/intel-gpu-jammy.list
RUN apt update

# install gpu driver
RUN apt install -y clinfo hwinfo intel-opencl-icd intel-level-zero-gpu level-zero intel-level-zero-gpu-raytracing mesa-vulkan-drivers intel-igc-cm level-zero-dev && apt clean
# install oneapi
RUN apt install -y intel-oneapi-dpcpp-cpp-2024.2=2024.2.1-1079 intel-oneapi-mkl-devel=2024.2.1-103 intel-oneapi-ccl-devel=2021.13.1-31 && apt clean

CMD /bin/bash
