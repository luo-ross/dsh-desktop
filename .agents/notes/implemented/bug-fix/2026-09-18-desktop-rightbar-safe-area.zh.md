# Agent Note：桌面右侧 Sidebar 保持在标题栏下方

状态：已实现

[English](2026-09-18-desktop-rightbar-safe-area.md) | 中文

## 问题

当前客户端已将旧的 `details` 栏替换为 `rightbar`，但社区桌面主题仍使用旧类名。右侧 Sidebar 因此从窗口边缘开始绘制，内容可能被无边框窗口的标题栏控件遮住。

## 决策

普通模式下右侧 Sidebar 面板从 `--dsh-desktop-titlebar-safe-area` 开始；全屏模式继续使用 `inset: 0`。桌面主题改为匹配新的 rightbar 栏和面板属性。

## 备选方案

保留旧的 `details` 选择器会让右侧 Sidebar 继续从窗口边缘开始。给所有模式都增加偏移会改变现有全屏显示，因此只在普通模式使用共享令牌。

## 后果

普通右侧 Sidebar 的 tab 和内容会显示在原生窗口控件下方，全屏右侧 Sidebar 行为保持不变，网页构建仍使用零偏移默认值。

## 测试

重新构建的 `dist-desktop/win-unpacked/DSH.exe` 已进入主界面。右侧 Sidebar 打开后面板位于 30px 标题栏安全区下方，工作区和会话的右键菜单均显示了“打开所在位置”。
