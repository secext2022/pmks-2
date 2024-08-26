# llama.cpp SYCL
FROM ubuntu-intel-base as build

WORKDIR /app
COPY llama.cpp-b3617 .

RUN . /opt/intel/oneapi/setvars.sh && \
    cmake -B build -DGGML_SYCL=ON -DGGML_SYCL_F16=ON -DCMAKE_C_COMPILER=icx -DCMAKE_CXX_COMPILER=icpx -DBUILD_SHARED_LIBS=OFF && \
    cmake --build build --config Release --target llama-cli

# stage 2
FROM ubuntu-intel-base as runtime

COPY --from=build /app/build/bin/llama-cli /usr/bin/llama-cli

CMD /bin/bash
