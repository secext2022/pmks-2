# 编写 blender python 扩展 (extension / addon)

blender 集成了 python 运行环境, 可以通过编写脚本, 来实现一些小工具, 方便进行一些操作.

本文就来编写一个简单的 blender python 扩展, 能够持续旋转被选中的物体.

使用的 blender 版本: 4.3.0 (测试版)

这里是 穷人小水滴, 专注于 穷人友好型 低成本技术. (本文为 64 号作品. )

----

相关文章:

+ 《修复 blender 中文输入 BUG (linux/wayland/GNOME/ibus)》

  TODO

+ 《(科幻) 人形物体的 3D 建模》

  TODO

参考资料:

+ <https://docs.blender.org/manual/en/latest/advanced/scripting/addon_tutorial.html>
+ <https://docs.blender.org/api/current/index.html>
+ <https://docs.blender.org/api/current/bpy.context.html>
+ <https://docs.blender.org/api/current/bpy.types.Object.html>

+ <https://docs.blender.org/api/current/bpy.types.Operator.html#modal-operator>
+ <https://docs.blender.org/api/current/bpy.types.WindowManager.html>
+ <https://docs.blender.org/api/current/bpy.types.Timer.html>
+ <https://blender.stackexchange.com/questions/223169/when-using-an-operator-modal-timer-how-do-i-change-the-time-period-such-that-it>


## 目录

+ 1 安装扩展及效果演示

  - 1.1 python 源代码
  - 1.2 安装扩展
  - 1.3 操作及效果

+ 2 扩展的 python 代码解释

+ 3 总结与展望


## 1 安装扩展及效果演示

### 1.1 python 源代码

首先, 将下列代码保存为 `test_a.py` 文件:

```py
# 测试 blender 扩展 (add-on)

bl_info = {
    "name": "测试旋转物体 (Z)",
    "blender": (4, 2, 0),
    "category": "Object",
}

import math
import bpy

class 测试旋转操作(bpy.types.Operator):
    """沿 Z 轴持续旋转物体, 按 ESC 键停止"""
    bl_idname = "object.test_r"
    bl_label = "test 测试旋转物体 (Z)"
    bl_options = {'REGISTER', 'UNDO'}

    # 用于持续回调
    _定时器 = None

    def modal(self, context, event):
        # 按下 ESC 键, 结束
        if event.type == 'ESC':
            self.cancel(context)
            return {'CANCELLED'}

        # 定时器回调
        if event.type == 'TIMER':
            # 旋转速度: 180 度 / 秒
            速度 = 180.0
            # 角度 转换成 弧度
            角度 = math.radians(速度 * self._定时器.time_duration)

            # 当前选中物体
            物 = context.active_object
            # 物.rotation_mode = 'XYZ'
            物.rotation_euler[2] = 角度  # 修改 Z 轴旋转

        return {'PASS_THROUGH'}

    def execute(self, context):
        print("DEBUG test: execute")

        w = context.window_manager
        # 每 0.1 秒回调一次
        self._定时器 = w.event_timer_add(0.1, window=context.window)

        w.modal_handler_add(self)
        # 操作持续运行
        return {'RUNNING_MODAL'}

    def cancel(self, context):
        w = context.window_manager
        w.event_timer_remove(self._定时器)

def 菜单项(self, context):
    self.layout.operator(测试旋转操作.bl_idname)

# 注册组件类
def register():
    bpy.utils.register_class(测试旋转操作)
    bpy.types.VIEW3D_MT_object.append(菜单项)

    print("DEBUG test: register")

# 清理 (取消注册)
def unregister():
    bpy.utils.unregister_class(测试旋转操作)

if __name__ == "__main__":
    register()
```

文件名任意, 此处只是举栗.

### 1.2 安装扩展

(1) 打开 blender, 点击菜单 编辑 (Edit) -> 选项 (Preferences):

![安装 (1)](./图/12-i-1.png)

(2) 点击左侧 扩展 (Add-ons) -> 右侧 从本地安装 (Install from Disk):

![安装 (2)](./图/12-i-2.png)

(3) 选择之前保存的 `test_a.py` 文件:

![安装 (3)](./图/12-i-3.png)

(4) 然后就会安装好扩展:

![安装 (4)](./图/12-i-4.png)

如果在终端运行 blender, 还会在终端看到输出:

```sh
DEBUG test: register
Modules Installed (test_a) from '/home/s2/test_a/test_a.py' into '/home/s2/.config/blender/4.3/scripts/addons'
```

### 1.3 操作及效果

(1) 选中要操作的物体:

![操作 (1)](./图/13-o-1.png)

(2) 按 F3 键打开搜索框:

![操作 (2)](./图/13-o-2.png)

(3) 点击执行命令:

![效果](./图/13-r-3.gif)

完结撒花 ~

对了, 别忘了按 Esc 键停止操作.


## 2 扩展的 python 代码解释

本文的主要目的是介绍 blender python 扩展如何编写, 上面实现的具体功能不是重点.

```py
bl_info = {
    "name": "测试旋转物体 (Z)",
    "blender": (4, 2, 0),
    "category": "Object",
}
```

定义扩展的名称, 需要的最低 blender 版本号等, 方便 blender 识别.

```py
class 测试旋转操作(bpy.types.Operator):
    """沿 Z 轴持续旋转物体, 按 ESC 键停止"""
    bl_idname = "object.test_r"
    bl_label = "test 测试旋转物体 (Z)"
    bl_options = {'REGISTER', 'UNDO'}
```

定义一个操作 (类), 继承 `bpy.types.Operator`. 此处定义类的唯一 ID, 显示标签名称等.

```py
    def modal(self, context, event):
        # 按下 ESC 键, 结束
        if event.type == 'ESC':
            self.cancel(context)
            return {'CANCELLED'}

        # 定时器回调
        if event.type == 'TIMER':
            # 旋转速度: 180 度 / 秒
            速度 = 180.0
            # 角度 转换成 弧度
            角度 = math.radians(速度 * self._定时器.time_duration)

            # 当前选中物体
            物 = context.active_object
            # 物.rotation_mode = 'XYZ'
            物.rotation_euler[2] = 角度  # 修改 Z 轴旋转

        return {'PASS_THROUGH'}
```

操作可以分为一次性操作 (很快结束), 和持续操作 (持续一段时间). `modal` 是用于持续操作的.
在这里处理回调事件, 对于定时器事件, 计算并修改物体的旋转角度.

```py
    def execute(self, context):
        print("DEBUG test: execute")

        w = context.window_manager
        # 每 0.1 秒回调一次
        self._定时器 = w.event_timer_add(0.1, window=context.window)

        w.modal_handler_add(self)
        # 操作持续运行
        return {'RUNNING_MODAL'}
```

这个函数在执行这个操作时, 会调用. 在这里创建一个定时器, 并持续运行.

```py
# 注册组件类
def register():
    bpy.utils.register_class(测试旋转操作)
    bpy.types.VIEW3D_MT_object.append(菜单项)

    print("DEBUG test: register")

# 清理 (取消注册)
def unregister():
    bpy.utils.unregister_class(测试旋转操作)

if __name__ == "__main__":
    register()
```

最后是初始化注册代码, 注册之后就可以在 blender 里使用了.

代码很简单吧, 喵 ?


## 3 总结与展望

本文编写了一个简单的 blender python 扩展, 实现了持续旋转物体的功能.

blender python 扩展的编写简单方便, 可以用于制作小工具, 提高效率.
也能用于结合别的软件系统, 总之, 发挥和想像的空间很大 !

----

本文使用 CC-BY-SA 4.0 许可发布.
