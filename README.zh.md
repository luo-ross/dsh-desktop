# DSH

[English](README.md) | 中文

DSH 是基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的非官方社区桌面版。它把上游 Web UI 与本地后端封装进 Windows Electron 应用，使用时不需要另外管理终端进程或浏览器标签页。

> DSH 是社区项目，并非 DeepSeek AI 官方产品。DeepSeek Harness 名称和鲸鱼标志归其相应权利人所有。

<a id="run"></a>

## 运行

前往 [GitHub Releases](https://github.com/luo-ross/dsh-desktop/releases/latest) 下载最新版 Windows x64 安装程序。安装时可以选择目标目录，并可创建桌面与开始菜单快捷方式。

首个版本尚未进行代码签名，因此 Windows SmartScreen 可能提示“未知发布者”。运行安装程序前，请核对发行页面公布的 SHA-256 校验值。

## 桌面版增加的功能

- 包含 Harness 后端及其生产依赖的完整 Windows 安装程序。
- 单实例 Electron 窗口，后端仅在操作系统分配的 `127.0.0.1` 端口上运行。
- 采用 DeepSeek 官网视觉语言的启动欢迎页，在本地 Harness 后端准备期间保持响应，完成后自动进入主窗口。
- 受 Codex 启发的浅色桌面皮肤，同时保留上游工作区、会话、模型、设置、工具和权限行为。
- 无原生标题栏的沉浸式 Windows 窗口和应用内窗口控件，以及由 Electron 直接提供的可靠工作目录选择器。
- 应用、安装程序、任务栏和快捷方式统一使用 DeepSeek 鲸鱼图标。
- 通过 GitHub Releases 自动检查稳定版并在后台下载，可一键安装或在下次启动时自动安装。

## 首次运行与配置

首次启动时，应用需要把随安装包分发的后端展开到 Electron 用户数据目录，可能耗时约一分钟。解压在子进程中运行，准备窗口会保持响应并显示当前阶段；后续启动会复用对应版本的解压结果。

启动欢迎页会明确说明 DSH 是 DeepSeek Harness 的非官方社区桌面版，并显示后端准备进度；主界面准备完成后会自动进入，无需再次点击。进入模型配置后，DeepSeek 提供方会给出官方 API Key 页面直达链接，也可以配置其他受支持的模型提供方。然后从侧边栏添加工作区。Harness 设置、凭据、会话和附件沿用上游 Harness 主目录：设置了 `DSH_HOME` 时使用该目录，否则使用 `~/.dsh`。桌面后端启动时以用户的“文档”目录作为初始文件系统位置。

桌面外壳只监听本机回环地址，关闭渲染进程的 Node.js 集成，并使用系统浏览器打开外部 HTTP 链接。外壳本身不增加遥测；安装包内的上游 Harness 和用户配置的模型提供方仍保留各自的网络行为。

安装、存储、构建、故障排查和限制的完整说明参见[桌面版参考文档](apps/desktop/README.zh.md)。

## 从源码运行

安装 Node.js 22.19 或更高版本以及 pnpm 11.7，然后执行：

```sh
git clone https://github.com/luo-ross/dsh-desktop.git
cd dsh-desktop
pnpm install
pnpm run desktop:dev
```

执行 `pnpm run desktop:pack` 可以生成 Windows 安装程序，输出位于 `dist-desktop/`。

## 与上游项目的关系

本仓库保留 DeepSeek Harness 源码树，以便桌面应用构建真实的 Web UI 和后端。桌面版专属代码位于 `apps/desktop`；Harness 行为、模型提供方、插件和开发文档仍以上游项目为准。DeepSeek Harness 仍处于开发者预览阶段，上游可能发生破坏兼容性的变更。

## 许可证与归属

源代码采用 [MIT License](LICENSE) 开源，第三方依赖及其许可证列于 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。MIT 许可证不代表 DeepSeek AI 对本社区版本的认可，也不授予将其宣传为官方产品的权利。
