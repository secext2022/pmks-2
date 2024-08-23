# GNOME 如何关闭显示输出 ? (wayland / mutter / KMS / DRI) (源代码阅读)

GNOME 设置里面有这样一个功能: 鼠标/键盘无操作几分钟之后,
自动关闭显示输出, 具体表现为显示器黑屏, 进入休眠模式.
按一下鼠标/键盘, 恢复显示.

![设置界面](./图/0-s-1.png)

这是一个很常见的功能, 但是需要等待一段时间.
于是窝就想, 可不可以用一种简单的方式, 比如 **执行一条命令**,
随时随地直接进入这样的黑屏模式, 而无需等待几分钟 ?

本来窝以为, 这应该是一个很简单的问题, 网上随便一搜就能找到答案.
然而, 却突然掉进了一个 **大坑** !

网上搜索半天, 查看了很多资料, 都不行, 没有答案.
无耐, 只能去 **阅读源代码**, 看看这个功能具体是如何实现的:
gnome-control-center, gsettings, gnome-session, gnome-shell,
gnome-screensaver, gnome-screenshield, gnome-settings-daemon,
gnome-desktop, mutter, KMS, mesa/libdrm.
终于, 在绕了这么一大圈之后, 把这里搞明白了.

窝们开始冒险吧 ~

----

相关文章:

+ 《ibus 源代码阅读 (1)》

  TODO


## 目录

+ 1 问题背景

  - 1.1 KMS 简介
  - 1.2 wayland 简介

+ 2 阅读源代码

  - 2.1 gnome-control-center
  - 2.2 gnome-session
  - 2.3 gnome-shell
  - 2.4 gnome-settings-daemon
  - 2.5 gnome-desktop
  - 2.6 mutter
  - 2.7 libdrm

+ 3 关闭命令

+ 4 总结与展望


## 1 问题背景

本文涉及到 GNU/Linux 操作系统的图形/显示功能, 包括 GPU 以及显示器输出,
所以此处先介绍一点背景知识, 帮助理解.

----

本文使用的主要软件版本: 操作系统 ArchLinux, Linux 6.10, GNOME 46.

```sh
> uname -a
Linux S2L 6.10.2-zen1-2-zen #1 ZEN SMP PREEMPT_DYNAMIC Sat, 03 Aug 2024 18:22:59 +0000 x86_64 GNU/Linux
> gnome-shell --version
GNOME Shell 46.4
> cat /etc/os-release
NAME="Arch Linux"
PRETTY_NAME="Arch Linux"
ID=arch
BUILD_ID=rolling
ANSI_COLOR="38;2;23;147;209"
HOME_URL="https://archlinux.org/"
DOCUMENTATION_URL="https://wiki.archlinux.org/"
SUPPORT_URL="https://bbs.archlinux.org/"
BUG_REPORT_URL="https://gitlab.archlinux.org/groups/archlinux/-/issues"
PRIVACY_POLICY_URL="https://terms.archlinux.org/docs/privacy-policy/"
LOGO=archlinux-logo
```

### 1.1 KMS 简介

GNU/Linux 系统主要可以分为两大部分: 底层是 Linux 内核 (内核空间,
kernel space), 上层是 **用户空间** (user space) 的各种软件.

**DRI** (直接渲染框架, Direct Rendering Infrastructure)
是 Linux 系统使用的图形技术, 其内核部分有 **DRM** (直接渲染管理器,
Direct Rendering Manager) 和 **KMS** (内核模式设置, Kernel Mode Setting).

其中 **DRM** 主要用于 GPU 硬件加速渲染 (比如 OpenGL / vulkan 等 3D
功能), **KMS** 用来控制显示输出, 把渲染好的画面送到显示器.

参考资料: <https://www.kernel.org/doc/html/latest/gpu/drm-kms.html>
<https://dri.freedesktop.org/wiki/>

![来源 https://www.kernel.org/doc/html/latest/gpu/drm-kms.html](./图/1-kms-1.png)

如图, 这是 KMS 的主要结构:
最上面是用户空间的 **帧缓冲区** (`drm_framebuffer`),
里面是渲染好的一张图片 (一帧画面),
然后是 **显示平面** (`drm_plane`), **显示控制器** (`drm_crtc`).
每个显示平面可以包含一帧画面, 可能有多个显示平面,
送入同一个显示控制器进行合成.
接下来是 **编码器** (`drm_encoder`), 这是一个历史遗留的结构, 现在已经没什么用了.
最后是 **连接器** (`drm_connector`), 表示和显示器的物理连接.
下面这些都是在内核空间的, 用户空间送来的一帧画面, 经过这样的流程,
就能送到显示器了.

### 1.2 wayland 简介

上面介绍了内核空间的东西, 那么用户空间的软件是怎样的呢 ?

大部分情况下, 窝们不会让一个程序独占一个显示输出, 而是同时运行多个程序,
所以就有了 **窗口** (window), 多个程序可以使用窗口来共享屏幕的输出.

那么系统中就要有一个东西, 对所有的窗口进行管理和协调.
这个东西之前是 X11, 但是 X11 已经是几十年前的古老技术了, 功能差, 性能差,
安全性差, 总之各种不好.
于是现在使用新的替代技术 **wayland**.
参考资料: <https://wayland.freedesktop.org/>

wayland **合成器** (compositor) 就是这里的大管家,
各个程序负责绘制自己窗口里面的东西, 画好之后, 发送给合成器,
由合成器统一合成之后, 再通过 KMS 输出到显示器.

在 GNOME 桌面环境之中, `gnome-shell` 就是 wayland 合成器,
具体功能由 `mutter` 库来实现.

```sh
> echo $WAYLAND_DISPLAY
wayland-0
> echo $XDG_RUNTIME_DIR
/run/user/1000
> cd /run/user/1000
> ls -l wayland*
srwxr-xr-x 1 s2 s2 0  8月12日 06:22 wayland-0=
-rw-r----- 1 s2 s2 0  8月12日 06:22 wayland-0.lock
```

比如这个栗子, wayland 合成器和普通程序 (需要显示窗口),
通过 `wayland-0` 文件 (UNIX socket) 发送消息,
使用 **环境变量** `WAYLAND_DISPLAY` 指定接口文件名.


## 2 阅读源代码

获取相关源代码的网址如下:

+ `gnome-control-center`: <https://gitlab.gnome.org/GNOME/gnome-control-center>
+ `gnome-session`: <https://gitlab.gnome.org/GNOME/gnome-session>
+ `gnome-shell`: <https://gitlab.gnome.org/GNOME/gnome-shell>
+ `gnome-settings-daemon`: <https://gitlab.gnome.org/GNOME/gnome-settings-daemon>
+ `gnome-desktop`: <https://gitlab.gnome.org/GNOME/gnome-desktop>
+ `mutter`: <https://gitlab.gnome.org/GNOME/mutter>
+ `mesa/libdrm`: <https://gitlab.freedesktop.org/mesa/drm>

### 2.1 gnome-control-center

既然网上找不到资料 (现成的答案), 那么就只能去阅读终极资料:
**源代码** (source code) 了.
既然这个功能都实现出来了, 那么具体怎么做的, 源代码里面肯定有.

但是, 从哪里开始呢 ?

![英文界面](./图/21-s-1.png)

这个功能的设置在这个界面, 那么就直接从这个界面开始吧.
首先将界面设置成英文, 方便搜索源代码.

```sh
> type gnome-control-center
gnome-control-center is /usr/bin/gnome-control-center
```

这个界面对应的软件是 `gnome-control-center`, 那么就把源代码下载下来,
搜索界面上的关键词.

然后就找到了文件 `gnome-control-center/panels/power/cc-power-panel.ui`:

```xml
<object class="CcNumberRow" id="blank_screen_row">
  <property name="title" translatable="yes">Screen _Blank</property>
  <property name="subtitle" translatable="yes">Turn the screen off after a period of inactivity</property>
  <property name="use-underline">True</property>
  <property name="values">[60, 120, 180, 240, 300, 480, 600, 720, 900]</property>
  <property name="special-value">
    <object class="CcNumberObject">
      <property name="value">0</property>
      <property name="string" translatable="yes" comments="Translators: Idle time">Never</property>
      <property name="order">last</property>
    </object>
  </property>
  <property name="value-type">seconds</property>
</object>
```

这段代码, 和上面的界面完全对应.
然后这个文件旁边还有一个文件 `gnome-control-center/panels/power/cc-power-panel.c`:

```c
  cc_number_row_bind_settings (self->blank_screen_row, self->session_settings, "idle-delay");
```

这行代码是说, 上面界面中的设置项 (`blank_screen_row`) 对应 `idle-delay` 和 `self->session_settings`.
那么 `session_settings` 又是啥 ?
在同一个文件中搜索, 找到了:

```c
  self->session_settings = g_settings_new ("org.gnome.desktop.session");
```

也就是说, 这个设置项对应 `org.gnome.desktop.session` 以及 `idle-delay`.
GNOME 使用 gsettings 保存配置数据, 窝们可以尝试一下 (打开终端执行命令):

```sh
> gsettings get org.gnome.desktop.session idle-delay
uint32 900
```

获得值 900 (秒), 正好对应上面设置的 15 分钟.
为了验证这个结论, 窝们在上面的界面中修改设置 (比如改成 10 分钟),
再次执行这条命令, 获取保存的值.

好了, 现在窝们已经知道这个设置项是怎么保存的了.

### 2.2 gnome-session

那么, 接下来就要寻找哪里读取和使用了上面保存的设置值.
经过一些尝试之后, 窝们找到了文件 `gnome-session/gnome-session/gsm-manager.c`:

```c
#define SESSION_SCHEMA            "org.gnome.desktop.session"
#define KEY_IDLE_DELAY            "idle-delay"

/* 省略 */

  priv->presence = gsm_presence_new ();

/* 省略 */

  g_settings_bind_with_mapping (priv->session_settings,
                                KEY_IDLE_DELAY,
                                priv->presence,
                                "idle-timeout",
                                G_SETTINGS_BIND_GET,
                                idle_timeout_get_mapping,
                                NULL,
                                NULL, NULL);
```

这里关联了 `gsm_presence`, 于是找到文件 `gnome-session/gnome-session/gsm-presence.c`:

```c
#define GSM_PRESENCE_DBUS_IFACE "org.gnome.SessionManager.Presence"
#define GSM_PRESENCE_DBUS_PATH "/org/gnome/SessionManager/Presence"

#define GS_NAME      "org.gnome.ScreenSaver"
#define GS_PATH      "/org/gnome/ScreenSaver"
#define GS_INTERFACE "org.gnome.ScreenSaver"

/* 省略 */

  presence->priv->screensaver_proxy = g_dbus_proxy_new_sync (presence->priv->connection,
                                                             G_DBUS_PROXY_FLAGS_DO_NOT_AUTO_START |
                                                             G_DBUS_PROXY_FLAGS_DO_NOT_LOAD_PROPERTIES,
                                                             NULL,
                                                             GS_NAME,
                                                             GS_PATH,
                                                             GS_INTERFACE,
                                                             NULL, &error);
```

窝们找到 `org.gnome.ScreenSaver`:

```sh
> cat /usr/share/dbus-1/services/org.gnome.ScreenSaver.service
[D-BUS Service]
Name=org.gnome.ScreenSaver
Exec=/usr/bin/gjs -m /usr/share/gnome-shell/org.gnome.ScreenSaver
> cat /usr/share/gnome-shell/org.gnome.ScreenSaver
import {programInvocationName, programArgs} from 'system';

imports.package.init({
    name: 'gnome-shell',
    prefix: '/usr',
    libdir: '/usr/lib',
});
const {main} = await import(`${imports.package.moduledir}/main.js`);
await main([programInvocationName, ...programArgs]);
```

然后:

```sh
> pacman -Qo /usr/share/gnome-shell/org.gnome.ScreenSaver
/usr/share/gnome-shell/org.gnome.ScreenSaver 由 gnome-shell 1:46.4-1 所拥有
```

### 2.3 gnome-shell

找到文件 `gnome-shell/js/dbusServices/screensaver/main.js`:

```js
import {DBusService} from './dbusService.js';
import {ScreenSaverService} from './screenSaverService.js';

/** @returns {void} */
export async function main() {
    const service = new DBusService(
        'org.gnome.ScreenSaver',
        new ScreenSaverService());
    await service.runAsync();
}
```

文件 `gnome-shell/js/dbusServices/screensaver/screenSaverService.js`:

```js
  this._proxy = new ScreenSaverProxy(Gio.DBus.session,
      'org.gnome.Shell.ScreenShield',
      '/org/gnome/ScreenSaver',
      (proxy, error) => {
          if (error)
              log(error.message);
      });

  this._proxy.connectSignal('ActiveChanged',
      (proxy, sender, params) => {
          this._dbusImpl.emit_signal('ActiveChanged',
              new GLib.Variant('(b)', params));
      });
```

窝们找到 `org.gnome.Shell.ScreenShield`, 文件 `gnome-shell/js/ui/shellDBus.js`:

```js
export class ScreenSaverDBus {
    constructor(screenShield) {
        this._screenShield = screenShield;
        screenShield.connect('active-changed', shield => {
            this._dbusImpl.emit_signal('ActiveChanged', GLib.Variant.new('(b)', [shield.active]));
        });
        screenShield.connect('wake-up-screen', () => {
            this._dbusImpl.emit_signal('WakeUpScreen', null);
        });

        this._dbusImpl = Gio.DBusExportedObject.wrapJSObject(ScreenSaverIface, this);
        this._dbusImpl.export(Gio.DBus.session, '/org/gnome/ScreenSaver');

        Gio.DBus.session.own_name('org.gnome.Shell.ScreenShield',
            Gio.BusNameOwnerFlags.NONE, null, null);
    }
```

这里实现的是 GNOME 的锁屏界面, GNOME 锁屏之后会关闭显示输出, 所以这里应该有一些线索.
文件 `gnome-shell/js/ui/screenShield.js`:

```js
  // This is because when we emit ActiveChanged(true),
  // gnome-settings-daemon blanks the screen, and we don't want
  // blank during the animation.
```

在这段注释中写着 `gnome-settings-daemon` 负责关闭显示输出.

### 2.4 gnome-settings-daemon

找到文件 `gnome-settings-daemon/plugins/power/gsd-power-manager.c`:

```c
static void
backlight_disable (GsdPowerManager *manager)
{
        gboolean ret;
        GError *error = NULL;

        iio_proxy_claim_light (manager, FALSE);
        ret = gnome_rr_screen_set_dpms_mode (manager->rr_screen,
                                             GNOME_RR_DPMS_OFF,
                                             &error);
        if (!ret) {
                g_warning ("failed to turn the panel off: %s",
                           error->message);
                g_error_free (error);
        }

        g_debug ("TESTSUITE: Blanked screen");
}
```

也就是调用 `gnome_rr_screen_set_dpms_mode` 函数,
传入参数 `GNOME_RR_DPMS_OFF` 来实现关闭显示输出.

### 2.5 gnome-desktop

找到文件 `gnome-desktop/libgnome-desktop/gnome-rr.c`:

```c
/**
 * gnome_rr_screen_set_dpms_mode:
 *
 * This method also disables the DPMS timeouts.
 **/
gboolean
gnome_rr_screen_set_dpms_mode (GnomeRRScreen    *screen,
                               GnomeRRDpmsMode   mode,
                               GError          **error)
{
    MetaPowerSave power_save;

    g_return_val_if_fail (error == NULL || *error == NULL, FALSE);

    switch (mode) {
    case GNOME_RR_DPMS_UNKNOWN:
        power_save = META_POWER_SAVE_UNKNOWN;
        break;
    case GNOME_RR_DPMS_ON:
        power_save = META_POWER_SAVE_ON;
        break;
    case GNOME_RR_DPMS_STANDBY:
	power_save = META_POWER_SAVE_STANDBY;
        break;
    case GNOME_RR_DPMS_SUSPEND:
	power_save = META_POWER_SAVE_SUSPEND;
        break;
    case GNOME_RR_DPMS_OFF:
	power_save = META_POWER_SAVE_OFF;
        break;
    default:
        g_assert_not_reached ();
        break;
    }

    meta_dbus_display_config_set_power_save_mode (screen->priv->proxy, power_save);

    return TRUE;
}
```

关键就是调用了 `meta_dbus_display_config_set_power_save_mode` 函数.
从这个函数名可以看出, 是通过 DBus 调用的, 所以被调用的位于另一个地方.

### 2.6 mutter

找到文件 `mutter/src/backends/meta-display-config-shared.h`:

```c
typedef enum
{
  META_POWER_SAVE_UNSUPPORTED = -1,
  META_POWER_SAVE_ON = 0,
  META_POWER_SAVE_STANDBY,
  META_POWER_SAVE_SUSPEND,
  META_POWER_SAVE_OFF,
} MetaPowerSave;
```

文件 `mutter/src/backends/native/meta-monitor-manager-native.c`:

```c
static void
meta_monitor_manager_native_set_power_save_mode (MetaMonitorManager *manager,
                                                 MetaPowerSave       mode)
{
  MetaBackend *backend = meta_monitor_manager_get_backend (manager);
  GList *l;

  for (l = meta_backend_get_gpus (backend); l; l = l->next)
    {
      MetaGpuKms *gpu_kms = l->data;

      switch (mode)
        {
        case META_POWER_SAVE_ON:
        case META_POWER_SAVE_UNSUPPORTED:
          break;
        case META_POWER_SAVE_STANDBY:
        case META_POWER_SAVE_SUSPEND:
        case META_POWER_SAVE_OFF:
          {
            meta_kms_device_disable (meta_gpu_kms_get_kms_device (gpu_kms));
            break;
          }
        }
    }
}
```

函数调用 `meta_monitor_manager_native_set_power_save_mode` -> `meta_kms_device_disable`,
找到文件 `mutter/src/backends/native/meta-kms-device.c`:

```c
void
meta_kms_device_disable (MetaKmsDevice *device)
{
  meta_assert_not_in_kms_impl (device->kms);

  meta_kms_run_impl_task_sync (device->kms, disable_device_in_impl,
                               device->impl_device,
                               NULL);
}

/* 省略 */

static gpointer
disable_device_in_impl (MetaThreadImpl  *thread_impl,
                        gpointer         user_data,
                        GError         **error)
{
  MetaKmsImplDevice *impl_device = user_data;

  meta_kms_impl_device_disable (impl_device);

  return GINT_TO_POINTER (TRUE);
}
```

函数调用 `meta_kms_device_disable` -> `disable_device_in_impl` -> `meta_kms_impl_device_disable`,
找到文件 `mutter/src/backends/native/meta-kms-impl-device.c`:

```c
void
meta_kms_impl_device_disable (MetaKmsImplDevice *impl_device)
{
  MetaKmsImplDevicePrivate *priv =
    meta_kms_impl_device_get_instance_private (impl_device);
  MetaKmsImpl *kms_impl = meta_kms_impl_device_get_impl (impl_device);
  MetaThreadImpl *thread_impl = META_THREAD_IMPL (kms_impl);
  MetaThread *thread = meta_thread_impl_get_thread (thread_impl);
  MetaKmsImplDeviceClass *klass = META_KMS_IMPL_DEVICE_GET_CLASS (impl_device);

  if (!priv->device_file)
    return;

  meta_kms_impl_device_hold_fd (impl_device);
  meta_thread_inhibit_realtime_in_impl (thread);
  klass->disable (impl_device);
  meta_thread_uninhibit_realtime_in_impl (thread);
  g_list_foreach (priv->crtcs,
                  (GFunc) meta_kms_crtc_disable_in_impl, NULL);
  g_list_foreach (priv->connectors,
                  (GFunc) meta_kms_connector_disable_in_impl, NULL);
  meta_kms_impl_device_unhold_fd (impl_device);
}
```

此处的关键代码是 `klass->disable (impl_device)`, 上面有:

```c
  MetaKmsImplDeviceClass *klass = META_KMS_IMPL_DEVICE_GET_CLASS (impl_device);
```

也就是说, `kms-impl-device` 有多种具体的实现:

![源代码文件](./图/26-c-1.png)

比如, 源代码里面有 `meta-kms-impl-device.c`, `meta-kms-impl-device-dummy.c`, `meta-kms-impl-device-simple.c`, `meta-kms-impl-device-atomic.c` 等文件.

在这里, 可以先怀疑一下, 真正的实现是 `atomic`, 然后再去验证.
因为 `dummy` 是空实现, 用于测试, `simple` 使用的是旧的 KMS 接口.
所以最可疑的就是 `atomic`, 使用新的 **原子** KMS 接口.

文件 `mutter/src/backends/native/meta-kms-impl-device-atomic.c`:

```c
static void
meta_kms_impl_device_atomic_disable (MetaKmsImplDevice *impl_device)
{
  g_autoptr (GError) error = NULL;
  drmModeAtomicReq *req;
  int fd;
  int ret;

  meta_topic (META_DEBUG_KMS, "[atomic] Disabling '%s'",
              meta_kms_impl_device_get_path (impl_device));

  req = drmModeAtomicAlloc ();
  if (!req)
    {
      g_set_error (&error, G_IO_ERROR, G_IO_ERROR_FAILED,
                   "Failed to create atomic transaction request: %s",
                   g_strerror (errno));
      goto err;
    }

  if (!disable_connectors (impl_device, req, &error))
    goto err;
  if (!disable_planes (impl_device, req, &error))
    goto err;
  if (!disable_crtcs (impl_device, req, &error))
    goto err;

  meta_topic (META_DEBUG_KMS, "[atomic] Committing disable-device transaction");

  fd = meta_kms_impl_device_get_fd (impl_device);
  ret = drmModeAtomicCommit (fd, req, DRM_MODE_ATOMIC_ALLOW_MODESET, impl_device);
  drmModeAtomicFree (req);
  if (ret < 0)
    {
      g_set_error (&error, G_IO_ERROR, g_io_error_from_errno (-ret),
                   "drmModeAtomicCommit: %s", g_strerror (-ret));
      goto err;
    }

  return;

err:
  g_warning ("[atomic] Failed to disable device '%s': %s",
             meta_kms_impl_device_get_path (impl_device),
             error->message);
}
```

这里的 `meta_topic (META_DEBUG_KMS` 比较有趣, 看起来像是打印调试日志信息.
那么, 怎么把这些调试信息显示出来呢 ?

文件 (文档) `mutter/doc/debugging.md`:

> ## Mutter debug topics
>
> It's possible to make Mutter much more verbose by turning on some debugging topics with the `MUTTER_DEBUG` environment variable.
>
> The different topics are defined in `src/core/util.c` as `meta_debug_keys`. It's possible to enable multiple topics:
> ```sh
> MUTTER_DEBUG="focus,stack" dbus-run-session mutter --wayland --nested
> ```

也就是使用环境变量 `MUTTER_DEBUG` 来设置需要显示的调试信息.

----

GNOME 桌面使用 `systemd --user` 来运行 GNOME shell,
gnome-shell 里面包含了 mutter:

```sh
> systemctl --user cat org.gnome.Shell@wayland.service
# /usr/lib/systemd/user/org.gnome.Shell@wayland.service
[Unit]
Description=GNOME Shell on Wayland
# On wayland, force a session shutdown
OnFailure=org.gnome.Shell-disable-extensions.service gnome-session-shutdown.target
OnFailureJobMode=replace-irreversibly
CollectMode=inactive-or-failed
RefuseManualStart=on
RefuseManualStop=on

After=gnome-session-manager.target

Requisite=gnome-session-initialized.target
PartOf=gnome-session-initialized.target
Before=gnome-session-initialized.target

ConditionEnvironment=XDG_SESSION_TYPE=%I

[Service]
Slice=session.slice
Type=notify
ExecStart=/usr/bin/gnome-shell
# Exit code 1 means we are probably *not* dealing with an extension failure
SuccessExitStatus=1

# unset some environment variables that were set by the shell and won't work now that the shell is gone
ExecStopPost=-/bin/sh -c 'test "$SERVICE_RESULT" != "exec-condition" && systemctl --user unset-environment GNOME_SETUP_DISPLAY WAY>

# On wayland we cannot restart
Restart=no
# Kill any stubborn child processes after this long
TimeoutStopSec=5

# Lower down gnome-shell's OOM score to avoid being killed by OOM-killer too early
OOMScoreAdjust=-1000
```

可以看到, 这里使用 systemd 服务 `/usr/lib/systemd/user/org.gnome.Shell@wayland.service` 来运行 gnome-shell.
窝们可以添加一个 "drop-in" 文件来设置环境变量 (这是 systemd 的功能):

```sh
> cat ~/.config/systemd/user/org.gnome.Shell@wayland.service.d/10-mutter-debug.conf 
[Service]
Environment=MUTTER_DEBUG=kms
```

**注销**, 重新登录, 这样就会重新运行 gnome-shell.

然后记录相应的调试日志输出:

```sh
journalctl --user -xefu org.gnome.Shell@wayland.service > mutter-debug.log
```

然后使用下文 (章节 3) 的方法, 关闭显示输出, 就能获得调试日志:

```sh
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Disabling '/dev/dri/card1'
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting connector 99 (/dev/dri/card1) property 'CRTC_ID' (20) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting connector 107 (/dev/dri/card1) property 'CRTC_ID' (20) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 32 (/dev/dri/card1) property 'CRTC_ID' (20) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 32 (/dev/dri/card1) property 'FB_ID' (17) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 40 (/dev/dri/card1) property 'CRTC_ID' (20) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 40 (/dev/dri/card1) property 'FB_ID' (17) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 48 (/dev/dri/card1) property 'CRTC_ID' (20) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 48 (/dev/dri/card1) property 'FB_ID' (17) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 54 (/dev/dri/card1) property 'CRTC_ID' (20) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 54 (/dev/dri/card1) property 'FB_ID' (17) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 62 (/dev/dri/card1) property 'CRTC_ID' (20) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 62 (/dev/dri/card1) property 'FB_ID' (17) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 70 (/dev/dri/card1) property 'CRTC_ID' (20) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 70 (/dev/dri/card1) property 'FB_ID' (17) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 76 (/dev/dri/card1) property 'CRTC_ID' (20) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 76 (/dev/dri/card1) property 'FB_ID' (17) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 84 (/dev/dri/card1) property 'CRTC_ID' (20) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 84 (/dev/dri/card1) property 'FB_ID' (17) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 92 (/dev/dri/card1) property 'CRTC_ID' (20) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting plane 92 (/dev/dri/card1) property 'FB_ID' (17) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting CRTC 53 (/dev/dri/card1) property 'ACTIVE' (22) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting CRTC 53 (/dev/dri/card1) property 'MODE_ID' (23) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting CRTC 75 (/dev/dri/card1) property 'ACTIVE' (22) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting CRTC 75 (/dev/dri/card1) property 'MODE_ID' (23) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting CRTC 97 (/dev/dri/card1) property 'ACTIVE' (22) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Setting CRTC 97 (/dev/dri/card1) property 'MODE_ID' (23) to 0
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Committing disable-device transaction
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: [atomic] Page flip callback for CRTC (75, /dev/dri/card1), data: 0x7f1d30006660
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: Setting page flip timings for CRTC (75, /dev/dri/card1), sequence: 1186472, sec: 24587, usec: 793462
Aug 12 05:58:40 S2L gnome-shell[65229]: KMS: Awaiting flush on CRTC 75 (/dev/dri/card1)
```

很明显, 使用的确实是 `atomic` 实现, 并且清晰的显示了关闭显示输出的具体过程.
也就是说上面的猜测是正确的.

### 2.7 libdrm

在上一节的最后, mutter 代码调用了 `drmModeAtomicCommit` 函数, 进行具体的操作.
这个函数在 `libdrm` 里面.

`libdrm` 这个库对内核的 DRM 调用进行了封装, 方便上层软件使用.

找到文件 `mesa/drm/xf86drmMode.c`:

```c
drm_public int drmModeAtomicCommit(int fd, const drmModeAtomicReqPtr req,
                                   uint32_t flags, void *user_data)
{
	drmModeAtomicReqPtr sorted;
	struct drm_mode_atomic atomic;
	uint32_t *objs_ptr = NULL;
	uint32_t *count_props_ptr = NULL;
	uint32_t *props_ptr = NULL;
	uint64_t *prop_values_ptr = NULL;
	uint32_t last_obj_id = 0;
	uint32_t i;
	int obj_idx = -1;
	int ret = -1;

	if (!req)
		return -EINVAL;

	if (req->cursor == 0)
		return 0;

	sorted = drmModeAtomicDuplicate(req);
	if (sorted == NULL)
		return -ENOMEM;

	memclear(atomic);

	/* Sort the list by object ID, then by property ID. */
	qsort(sorted->items, sorted->cursor, sizeof(*sorted->items),
	      sort_req_list);

	/* Now the list is sorted, eliminate duplicate property sets. */
	for (i = 0; i < sorted->cursor; i++) {
		if (sorted->items[i].object_id != last_obj_id) {
			atomic.count_objs++;
			last_obj_id = sorted->items[i].object_id;
		}

		if (i == sorted->cursor - 1)
			continue;

		if (sorted->items[i].object_id != sorted->items[i + 1].object_id ||
		    sorted->items[i].property_id != sorted->items[i + 1].property_id)
			continue;

		memmove(&sorted->items[i], &sorted->items[i + 1],
			(sorted->cursor - i - 1) * sizeof(*sorted->items));
		sorted->cursor--;
	}

	for (i = 0; i < sorted->cursor; i++)
		sorted->items[i].cursor = i;

	objs_ptr = drmMalloc(atomic.count_objs * sizeof objs_ptr[0]);
	if (!objs_ptr) {
		errno = ENOMEM;
		goto out;
	}

	count_props_ptr = drmMalloc(atomic.count_objs * sizeof count_props_ptr[0]);
	if (!count_props_ptr) {
		errno = ENOMEM;
		goto out;
	}

	props_ptr = drmMalloc(sorted->cursor * sizeof props_ptr[0]);
	if (!props_ptr) {
		errno = ENOMEM;
		goto out;
	}

	prop_values_ptr = drmMalloc(sorted->cursor * sizeof prop_values_ptr[0]);
	if (!prop_values_ptr) {
		errno = ENOMEM;
		goto out;
	}

	for (i = 0, last_obj_id = 0; i < sorted->cursor; i++) {
		if (sorted->items[i].object_id != last_obj_id) {
			obj_idx++;
			objs_ptr[obj_idx] = sorted->items[i].object_id;
			last_obj_id = objs_ptr[obj_idx];
		}

		count_props_ptr[obj_idx]++;
		props_ptr[i] = sorted->items[i].property_id;
		prop_values_ptr[i] = sorted->items[i].value;

	}

	atomic.flags = flags;
	atomic.objs_ptr = VOID2U64(objs_ptr);
	atomic.count_props_ptr = VOID2U64(count_props_ptr);
	atomic.props_ptr = VOID2U64(props_ptr);
	atomic.prop_values_ptr = VOID2U64(prop_values_ptr);
	atomic.user_data = VOID2U64(user_data);

	ret = DRM_IOCTL(fd, DRM_IOCTL_MODE_ATOMIC, &atomic);

out:
	drmFree(objs_ptr);
	drmFree(count_props_ptr);
	drmFree(props_ptr);
	drmFree(prop_values_ptr);
	drmModeAtomicFree(sorted);

	return ret;
}
```

函数 `drmModeAtomicCommit` 对数据进行了一顿排列组合, 最后调用 `DRM_IOCTL`.

同一个文件中:

```c
static inline int DRM_IOCTL(int fd, unsigned long cmd, void *arg)
{
	int ret = drmIoctl(fd, cmd, arg);
	return ret < 0 ? -errno : ret;
}
```

找到文件 `mesa/drm/xf86drm.c`:

```c
/**
 * Call ioctl, restarting if it is interrupted
 */
drm_public int
drmIoctl(int fd, unsigned long request, void *arg)
{
    int ret;

    do {
        ret = ioctl(fd, request, arg);
    } while (ret == -1 && (errno == EINTR || errno == EAGAIN));
    return ret;
}
```

函数 `drmIoctl` 调用了 `ioctl`.
至此, 用户空间的代码分析完毕.

----

`ioctl()` 是一个 **内核调用** (syscall), 具体实现的代码在 Linux 内核里面.

结合上面的调试日志, 窝们就能知道上层应用使用 KMS 的整个过程, 比如:

+ (1) Linux 内核提供 DRI 设备文件:

  ```sh
  > ls -l /dev/dri
  总计 0
  drwxr-xr-x  2 root root         80  8月11日 23:09 by-path/
  crw-rw----+ 1 root video  226,   1  8月12日 03:06 card1
  crw-rw-rw-  1 root render 226, 128  8月12日 03:06 renderD128
  ```

+ (2) 上层应用使用 `open()` 内核调用打开文件 `/dev/dri/card1`.

+ (3) 上层应用对这个文件使用 `ioctl()` 内核调用, 进行 KMS 操作.


## 3 关闭命令

好了, 现在阅读了相关源代码, 了解了整个过程.
是时候找出关闭显示输出的命令了.

找到文件 `mutter/data/dbus-interfaces/org.gnome.Mutter.DisplayConfig.xml`:

```xml
<!DOCTYPE node PUBLIC
'-//freedesktop//DTD D-BUS Object Introspection 1.0//EN'
'http://www.freedesktop.org/standards/dbus/1.0/introspect.dtd'>
<node>
  <!--
      org.gnome.Mutter.DisplayConfig:
      @short_description: display configuration interface

      This interface is used by mutter and gnome-settings-daemon
      to apply multiple monitor configuration.
  -->

  <interface name="org.gnome.Mutter.DisplayConfig">

<!-- 省略 -->

    <!--
        PowerSaveMode:

	Contains the current power saving mode for the screen, and
	allows changing it.

        Possible values:
	- 0: on
	- 1: standby
	- 2: suspend
	- 3: off
	- -1: unknown (unsupported)

        A client should not attempt to change the powersave mode
	from -1 (unknown) to any other value, and viceversa.
	Note that the actual effects of the different values
	depend on the hardware and the kernel driver in use, and
	it's perfectly possible that all values different than on
	have the same effect.
	Also, setting the PowerSaveMode to 3 (off) may or may
	not have the same effect as disabling all outputs by
	setting no CRTC on them with ApplyConfiguration(), and
	may or may not cause a configuration change.

        Also note that this property might become out of date
	if changed through different means (for example using the
	XRandR interface directly).
    -->
    <property name="PowerSaveMode" type="i" access="readwrite" />
```

参考资料: <https://unix.stackexchange.com/questions/275327/configure-gnome-wayland-display-configuration-from-command-line>

**警告: 这些命令可能导致一直黑屏, 无法操作 ! 请小心使用 !! !**
如果无法操作, 可以考虑重启计算机.

**警告: 请先做好重启的准备, 再执行下述命令. 此处极易误操作 !!**

强烈建议首先执行保持屏幕开启的命令:

```sh
> gdbus call --session --dest=org.gnome.Mutter.DisplayConfig --object-path /org/gnome/Mutter/DisplayConfig --method org.freedesktop.DBus.Properties.Set org.gnome.Mutter.DisplayConfig PowerSaveMode "<0>"
()
```

执行完毕, 没有任何反应, 这是 **正常** 的, 因为屏幕原来就是开启的.
这条命令是通过 DBus 调用 mutter.

**警告: 强烈建议先把这一章节的内容读完, 然后再尝试执行下述命令 !!**

然后执行黑屏命令:

```sh
> gdbus call --session --dest=org.gnome.Mutter.DisplayConfig --object-path /org/gnome/Mutter/DisplayConfig --method org.freedesktop.DBus.Properties.Set org.gnome.Mutter.DisplayConfig PowerSaveMode "<1>"
()
```

也就是将上面命令的 `0` 换成 `1`.
执行这条命令会 **立即黑屏**, 然后显示器进入休眠模式.

**恢复方法**: 连续按 2 次键盘的编辑键区的 **向上箭头** (↑) 按键,
然后再按 **回车键** (Enter).

恢复原理解释: 在 shell 中, 按向上箭头会调出上一次执行的命令,
按一次箭头获得上面 `1` 结尾的命令 (黑屏),
按两次箭头获得上面 `0` 结尾的命令 (开启屏幕),
然后再按回车键执行命令.
所以上面建议先执行 `0` 结尾的命令,
否则就难以恢复了 (除非很熟练无屏幕盲打).

恢复过程中, 操作一旦出错, 比如按错了按键, 因为一直黑屏, 就很难恢复了,
所以说 **极易误操作**.

至此, 终于完成了文章开头希望的 "简单" 功能 (太不容易了).


## 4 总结与展望

找不到现成答案的时候, 阅读源代码是最后一条退路, 这也是开源的重要意义之一.

可以看到, 图形界面的软件比较复杂, "几分钟后自动黑屏" 这样的小功能,
都要绕这么一大圈, 涉及一大堆组件, 阅读半天源代码才终于搞清楚.
GNOME 的源代码包括 C 语言 (GObject), DBus 和 JavaScript (gjs),
阅读起来比较费劲.

现代 GNU/Linux 使用 wayland, KMS 等图形技术,
本文对其中的用户空间部分进行了粗略介绍.
再向下的底层就是内核中的硬件驱动代码了, 内核的难度远远高于用户空间.

GNOME 关闭显示输出的代码, 和 **锁屏** (lock) 代码是在一起的,
如果要对 GNOME 的安全性进行评估, 也会涉及到锁屏这部分的代码.
希望本文能够对阅读 GNOME 代码提供一些小小的帮助.

人工阅读大量源代码, 费时费力, 如果可以使用 AI 大模型进行辅助阅读, 就好了.

----

本文使用 CC-BY-SA 4.0 许可发布.
