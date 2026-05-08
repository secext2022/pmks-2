# llama.cpp vulkan
FROM ubuntu-intel-base as build

# install vulkan-sdk
RUN curl https://packages.lunarg.com/lunarg-signing-key-pub.asc | apt-key add -
RUN curl -o /etc/apt/sources.list.d/lunarg-vulkan-jammy.list https://packages.lunarg.com/vulkan/lunarg-vulkan-jammy.list
RUN apt update && apt-get install -y vulkan-sdk && apt clean

WORKDIR /app
COPY llama.cpp-b3617 .

RUN cmake -B build -DGGML_VULKAN=1 -DBUILD_SHARED_LIBS=OFF && \
    cmake --build build --config Release --target llama-cli

# stage 2
FROM ubuntu-intel-base as runtime

COPY --from=build /app/build/bin/llama-cli /usr/bin/llama-cli

CMD /bin/bash
