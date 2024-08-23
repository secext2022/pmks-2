# llama.cpp-b3038/.devops/main-intel.Dockerfile
FROM ubuntu-intel-base as build

WORKDIR /app
COPY llama.cpp-b3038 .

RUN . /opt/intel/oneapi/setvars.sh && \
    cmake -B build -DLLAMA_SYCL=ON -DCMAKE_C_COMPILER=icx -DCMAKE_CXX_COMPILER=icpx -DLLAMA_SYCL_F16=ON && \
    cmake --build build --config Release --target main

# stage 2
FROM ubuntu-intel-base as runtime

COPY --from=build /app/build/bin/main /usr/bin/main

CMD /bin/bash
