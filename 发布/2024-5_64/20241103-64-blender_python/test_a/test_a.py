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
