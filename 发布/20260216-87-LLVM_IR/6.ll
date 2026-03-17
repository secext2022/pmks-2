; 6.ll
; 这是注释

; 全局静态 (只读) 数据 (常量), 用来存储要输出的字符串
@.str1 = private unnamed_addr constant [8 x i8] c"test 666", align 1

; 声明外部函数 (API)
; 输出一个 i32 整数
declare void @print_i32(i32) nounwind

; 输出 utf8 字符串 (开始地址, 字节长度)
declare void @print_utf8(ptr, i32) nounwind

; 这是一个可以被外部调用的导出函数 (主函数)
define void @main() nounwind #0 {
  ; 输出 整数
  call void @print_i32(i32 233)

  ; 输出 字符串
  call void @print_utf8(ptr @.str1, i32 8)

  ret void
}

; 标记 wasm 导出名称
attributes #0 = { "wasm-export-name"="main" }
