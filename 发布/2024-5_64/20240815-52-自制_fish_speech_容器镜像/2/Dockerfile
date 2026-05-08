FROM f-base

WORKDIR /fish-speech
COPY . .

WORKDIR /fish-speech/fish-speech-main
RUN pip3 install -e .

# ref_data.json
RUN python3 tools/gen_ref.py

EXPOSE 8080
CMD ["python3", "-m", "tools.api", "--listen", "0.0.0.0:8080", "--llama-checkpoint-path", "checkpoints/fish-speech-1.2-sft", "--decoder-checkpoint-path", "checkpoints/fish-speech-1.2-sft/firefly-gan-vq-fsq-4x1024-42hz-generator.pth", "--decoder-config-name", "firefly_gan_vq", "--device", "cpu"]
