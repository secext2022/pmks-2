# 自制可调亮度 LED 灯: MOS 管作为压控恒流源

TODO

功率: 5W
供电: 12V (最大 1A)

双色温 (TODO): 6500k (正白), 3500k (暖白)

控制方案: 单片机 PWM -> LC 低通滤波 -> NMOS 压控恒流 -> LED

单片机: ch32v003f4p6 (tssop20)

ADC 采样: 4 通道负反馈调节, NMOS 栅极电压, 电流采样电阻电压

PID 负反馈调节算法 ?

100% 亮度 (限流电阻, 硬件安全设计)

上位机接口: UART

TODO
