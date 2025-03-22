# 虚拟机显卡透传: x86 KVM/QEMU VFIO-PCI 技术

TODO


## 目录

+ 1 开始: 创建一个普通的 KVM/QEMU 虚拟机 (libvirt / virt-manager)

+ 2 准备: 配置独立显卡使用 vfio-pci 内核驱动

  - 2.1 硬件需求

  - 2.2 查看 PCI 设备的 IOMMU 分组

  - 2.3 内核模块和引导参数配置 (ArchLinux / GRUB)

  - 2.4 验证显卡使用了 vfio-pci 内核驱动

+ 3 透传: 将独立显卡分配给虚拟机

+ 4 测量: CPU 和 GPU 性能测试

  - 4.1 结果

  - 4.2 测量方法

  - 4.3 详细测试过程

+ 5 总结与展望


TODO

----

## TODO

### 1

```sh
s20@SE-ARCH-202005-L ~> lspci -nnk -d 1002:6660
01:00.0 Display controller [0380]: Advanced Micro Devices, Inc. [AMD/ATI] Sun XT [Radeon HD 8670A/8670M/8690M / R5 M330 / M430 / Radeon 520 Mobile] [1002:6660] (rev 83)
	Subsystem: Hewlett-Packard Company Radeon R5 M330 [103c:8136]
	Kernel driver in use: radeon
	Kernel modules: radeon, amdgpu
s20@SE-ARCH-202005-L ~> cat /proc/cmdline
BOOT_IMAGE=/vmlinuz-linux-zen root=UUID=2037c0a5-2d1c-4c9d-997f-0b8c3e49a969 rw rootflags=subvol=@root loglevel=3 quiet intel_iommu=on
s20@SE-ARCH-202005-L ~> uname -a
Linux SE-ARCH-202005-L 6.8.9-zen1-2-zen #1 ZEN SMP PREEMPT_DYNAMIC Tue, 07 May 2024 22:06:02 +0000 x86_64 GNU/Linux
s20@SE-ARCH-202005-L ~> 
```

```sh
s20@SE-ARCH-202005-L ~> sudo dmesg | grep radeon
[sudo] s20 的密码：
[    1.457862] [drm] radeon kernel modesetting enabled.
[    1.458252] radeon 0000:01:00.0: enabling device (0400 -> 0403)
[    1.475713] radeon 0000:01:00.0: VRAM: 2048M 0x0000000000000000 - 0x000000007FFFFFFF (2048M used)
[    1.475718] radeon 0000:01:00.0: GTT: 2048M 0x0000000080000000 - 0x00000000FFFFFFFF
[    1.476668] [drm] radeon: 2048M of VRAM memory ready
[    1.476671] [drm] radeon: 2048M of GTT memory ready.
[    1.486668] [drm] radeon: dpm initialized
[    1.498913] radeon 0000:01:00.0: WB enabled
[    1.498916] radeon 0000:01:00.0: fence driver on ring 0 use gpu addr 0x0000000080000c00
[    1.498920] radeon 0000:01:00.0: fence driver on ring 1 use gpu addr 0x0000000080000c04
[    1.498922] radeon 0000:01:00.0: fence driver on ring 2 use gpu addr 0x0000000080000c08
[    1.498925] radeon 0000:01:00.0: fence driver on ring 3 use gpu addr 0x0000000080000c0c
[    1.498927] radeon 0000:01:00.0: fence driver on ring 4 use gpu addr 0x0000000080000c10
[    1.498929] radeon 0000:01:00.0: radeon: MSI limited to 32-bit
[    1.498984] radeon 0000:01:00.0: radeon: using MSI.
[    1.499002] [drm] radeon: irq initialized.
[    1.695087] [drm] Initialized radeon 2.50.0 20080528 for 0000:01:00.0 on minor 1
[    1.695115] radeon 0000:01:00.0: [drm] No compatible format found
[    1.695118] radeon 0000:01:00.0: [drm] Cannot find any crtc or sizes
[   11.694817] radeon 0000:01:00.0: WB enabled
[   11.694820] radeon 0000:01:00.0: fence driver on ring 0 use gpu addr 0x0000000080000c00
[   11.694822] radeon 0000:01:00.0: fence driver on ring 1 use gpu addr 0x0000000080000c04
[   11.694824] radeon 0000:01:00.0: fence driver on ring 2 use gpu addr 0x0000000080000c08
[   11.694826] radeon 0000:01:00.0: fence driver on ring 3 use gpu addr 0x0000000080000c0c
[   11.694828] radeon 0000:01:00.0: fence driver on ring 4 use gpu addr 0x0000000080000c10
[   30.650241] radeon 0000:01:00.0: WB enabled
[   30.650244] radeon 0000:01:00.0: fence driver on ring 0 use gpu addr 0x0000000080000c00
[   30.650246] radeon 0000:01:00.0: fence driver on ring 1 use gpu addr 0x0000000080000c04
[   30.650248] radeon 0000:01:00.0: fence driver on ring 2 use gpu addr 0x0000000080000c08
[   30.650250] radeon 0000:01:00.0: fence driver on ring 3 use gpu addr 0x0000000080000c0c
[   30.650251] radeon 0000:01:00.0: fence driver on ring 4 use gpu addr 0x0000000080000c10
[   55.421233] radeon 0000:01:00.0: WB enabled
[   55.421235] radeon 0000:01:00.0: fence driver on ring 0 use gpu addr 0x0000000080000c00
[   55.421238] radeon 0000:01:00.0: fence driver on ring 1 use gpu addr 0x0000000080000c04
[   55.421240] radeon 0000:01:00.0: fence driver on ring 2 use gpu addr 0x0000000080000c08
[   55.421242] radeon 0000:01:00.0: fence driver on ring 3 use gpu addr 0x0000000080000c0c
[   55.421243] radeon 0000:01:00.0: fence driver on ring 4 use gpu addr 0x0000000080000c10
s20@SE-ARCH-202005-L ~> 
```

```sh
> ./iommu_group.sh
IOMMU Group 0:
	00:02.0 VGA compatible controller [0300]: Intel Corporation Skylake GT2 [HD Graphics 520] [8086:1916] (rev 07)
IOMMU Group 1:
	00:00.0 Host bridge [0600]: Intel Corporation Xeon E3-1200 v5/E3-1500 v5/6th Gen Core Processor Host Bridge/DRAM Registers [8086:1904] (rev 08)
IOMMU Group 2:
	00:04.0 Signal processing controller [1180]: Intel Corporation Xeon E3-1200 v5/E3-1500 v5/6th Gen Core Processor Thermal Subsystem [8086:1903] (rev 08)
IOMMU Group 3:
	00:14.0 USB controller [0c03]: Intel Corporation Sunrise Point-LP USB 3.0 xHCI Controller [8086:9d2f] (rev 21)
	00:14.2 Signal processing controller [1180]: Intel Corporation Sunrise Point-LP Thermal subsystem [8086:9d31] (rev 21)
IOMMU Group 4:
	00:16.0 Communication controller [0780]: Intel Corporation Sunrise Point-LP CSME HECI #1 [8086:9d3a] (rev 21)
IOMMU Group 5:
	00:17.0 SATA controller [0106]: Intel Corporation Sunrise Point-LP SATA Controller [AHCI mode] [8086:9d03] (rev 21)
IOMMU Group 6:
	00:1c.0 PCI bridge [0604]: Intel Corporation Sunrise Point-LP PCI Express Root Port #1 [8086:9d10] (rev f1)
IOMMU Group 7:
	00:1c.4 PCI bridge [0604]: Intel Corporation Sunrise Point-LP PCI Express Root Port #5 [8086:9d14] (rev f1)
IOMMU Group 8:
	00:1f.0 ISA bridge [0601]: Intel Corporation Sunrise Point-LP LPC Controller [8086:9d48] (rev 21)
	00:1f.2 Memory controller [0580]: Intel Corporation Sunrise Point-LP PMC [8086:9d21] (rev 21)
	00:1f.3 Audio device [0403]: Intel Corporation Sunrise Point-LP HD Audio [8086:9d70] (rev 21)
	00:1f.4 SMBus [0c05]: Intel Corporation Sunrise Point-LP SMBus [8086:9d23] (rev 21)
IOMMU Group 9:
	01:00.0 Display controller [0380]: Advanced Micro Devices, Inc. [AMD/ATI] Sun XT [Radeon HD 8670A/8670M/8690M / R5 M330 / M430 / Radeon 520 Mobile] [1002:6660] (rev 83)
IOMMU Group 10:
	02:00.0 Ethernet controller [0200]: Realtek Semiconductor Co., Ltd. RTL810xE PCI Express Fast Ethernet controller [10ec:8136] (rev 07)
```

### 2

```sh
s20@SE-ARCH-202005-L ~> cat /proc/cmdline
BOOT_IMAGE=/vmlinuz-linux-zen root=UUID=2037c0a5-2d1c-4c9d-997f-0b8c3e49a969 rw rootflags=subvol=@root loglevel=3 quiet intel_iommu=on vfio-pci.ids=1002:6660
s20@SE-ARCH-202005-L ~> lspci -nnk -d 1002:6660
01:00.0 Display controller [0380]: Advanced Micro Devices, Inc. [AMD/ATI] Sun XT [Radeon HD 8670A/8670M/8690M / R5 M330 / M430 / Radeon 520 Mobile] [1002:6660] (rev 83)
	Subsystem: Hewlett-Packard Company Radeon R5 M330 [103c:8136]
	Kernel driver in use: vfio-pci
	Kernel modules: radeon, amdgpu
s20@SE-ARCH-202005-L ~> 
```

```sh
s20@SE-ARCH-202005-L ~> sudo dmesg | grep radeon
[sudo] s20 的密码：
[    1.452494] [drm] radeon kernel modesetting enabled.
s20@SE-ARCH-202005-L ~> 
```

qemu-armbian (fail):

libvirt xml:

```xml
<hostdev mode="subsystem" type="pci" managed="yes">
  <driver name="vfio"/>
  <source>
    <address domain="0x0000" bus="0x01" slot="0x00" function="0x0"/>
  </source>
  <alias name="hostdev0"/>
  <address type="pci" domain="0x0000" bus="0x07" slot="0x00" function="0x0"/>
</hostdev>
```

```sh
a2@uefi-x86:~$ uname -a
Linux uefi-x86 6.6.16-current-x86 #2 SMP PREEMPT_DYNAMIC Mon Feb  5 20:14:39 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux
a2@uefi-x86:~$ cat /proc/cmdline
BOOT_IMAGE=/boot/vmlinuz-6.6.16-current-x86 root=UUID=bd7d3a31-24f8-42fc-b9d8-f44523ae132b ro console=tty1 quiet splash plymouth.ignore-serial-consoles i915.force_probe=* loglevel=3 vt.handoff=7
a2@uefi-x86:~$ lspci -nnk -d 1002:6660
07:00.0 Display controller [0380]: Advanced Micro Devices, Inc. [AMD/ATI] Sun XT [Radeon HD 8670A/8670M/8690M / R5 M330 / M430 / Radeon 520 Mobile] [1002:6660] (rev 83)
	Kernel modules: radeon, amdgpu
a2@uefi-x86:~$ sudo dmesg | grep radeon
[sudo] password for a2: 
[    3.699565] [drm] radeon kernel modesetting enabled.
[    3.701890] radeon 0000:07:00.0: Invalid PCI ROM header signature: expecting 0xaa55, got 0x0000
[    3.703818] radeon 0000:07:00.0: Invalid PCI ROM header signature: expecting 0xaa55, got 0x0000
[    3.704550] [drm:radeon_get_bios [radeon]] *ERROR* Unable to locate a BIOS ROM
[    3.704676] radeon 0000:07:00.0: Fatal error during GPU init
[    3.704685] [drm] radeon: finishing device.
[    3.707623] radeon: probe of 0000:07:00.0 failed with error -22
[    6.147809] amdgpu 0000:07:00.0: amdgpu: SI support provided by radeon.
[    6.147813] amdgpu 0000:07:00.0: amdgpu: Use radeon.si_support=0 amdgpu.si_support=1 to override.
a2@uefi-x86:~$ 
```

TODO
