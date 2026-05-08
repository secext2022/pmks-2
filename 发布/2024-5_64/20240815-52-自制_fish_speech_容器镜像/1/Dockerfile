FROM quay.io/jitesoft/ubuntu:22.04

# re-install ca-certificates
RUN apt update && apt install -y ca-certificates
# set apt mirror
RUN sed -i 's/http:\/\/archive.ubuntu.com/https:\/\/mirror.sjtu.edu.cn/g' /etc/apt/sources.list
# update system, install python, clean
RUN apt update && apt upgrade -y && apt install -y python3 python3-pip libsox-dev && apt clean

# set pip mirror
RUN pip3 config set global.index-url https://mirror.sjtu.edu.cn/pypi/web/simple
# update pip
RUN python3 -m pip install --upgrade pip

# install dep of fish-speech
RUN pip3 install torch torchvision torchaudio
