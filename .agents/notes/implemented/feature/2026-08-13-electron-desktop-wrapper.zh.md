# Agent Note: Electron 桌面外壳

Status: implemented

[English](2026-08-13-electron-desktop-wrapper.md) | 中文

## Problem

DeepSeek Harness 通过 `dsh web` 提供图形界面，用户需要在终端中管理服务，并另外打开浏览器。Windows 桌面发行版需要保留完整的 Host 和浏览器功能，同时不能依赖源码检出目录、单独安装的 Node.js 运行时或固定本机端口。

## Decision

`apps/desktop` 是复用现有本机回环 Web 载体的 Electron 外壳。主进程持有 Electron 单实例锁，立即显示启用沙箱和上下文隔离的准备窗口，并通过 Electron Node 模式及 HMR 服务要求的 `--expose-internals` 参数启动安装包内的 `dsh web` 后端。后端绑定操作系统分配的回环端口。只有后端输出 URL 且 HTTP 请求实际成功后，应用才会替换准备页面，因此 Loader 在输出 URL 后失败时不会跳转到已损坏的服务。再次启动时会聚焦现有窗口，不会重复解压或启动后端。应用退出时会等待后端停止；只有正常关闭未达到静止状态时，才会强制终止该应用拥有的进程树。

Windows 安装包以 gzip tar 归档携带官方 `@deepseek-ai/dsh` 生产依赖闭包。部署根清单固定使用已发布的 `@deepseek-ai/dsh` 版本，不注入工作区成员，因为 pnpm 部署工作区闭包时会遗漏运行期加载的插件软件包。工作区约束只对该部署依赖及其精确版本放行。首次启动会把归档原子解压到 Electron 用户数据目录下的版本化目录。采用归档是因为 Electron Builder 会从普通附加资源中排除嵌套的 `node_modules`，而 Windows 普通用户也无法安全地重新创建 pnpm 符号链接。暂存部署使用 pnpm 的 hoisted node linker，使归档包含真实目录和原生插件文件。只有完成标记、CLI 入口和 YAML 入口文件都存在时，应用才会复用解压目录；后端启动前会替换中断或不完整的解压结果。

此决定部分取代[GUI 分层与 RPC 协议](../architecture/2026-07-19-gui-layering-and-rpc-protocol.md)中针对 Electron 的 IPC 预留。本机回环载体是已交付的桌面传输方式；IPC 仍可作为后续优化，但不再是交付桌面产品的前置条件。

桌面渲染器会在后端页面加载完成后应用仅限 Electron 的 Codex 风格浅色皮肤。该皮肤覆盖设计令牌和面板几何，不替换 Web 组件，因此工作区、会话、模型、设置、输入框和详情功能仍由现有 Harness UI 提供。浏览器中运行的产品保留原有主题行为。Electron 隐藏原生应用菜单以保持桌面界面简洁；标准文本编辑快捷键仍由渲染器处理。社区发行版命名为 DSH Desktop，使用 `@luo-ross/dsh-desktop` 软件包和 `io.github.luoross.dshdesktop` Windows 应用标识，并明确说明它不是 DeepSeek AI 官方产品。桌面工作区清单把源码元数据指向社区仓库，其他上游发行成员仍保留官方仓库 URL。上游页面加载后，DSH Desktop 窗口继续保持产品标题。桌面窗口、可执行文件、安装程序和 Windows 快捷方式使用由 `apps/web/public/favicon.svg` 中 DeepSeek 官方鲸鱼标志生成的 ICO，不再显示 Electron 默认标志。

部署完成后，暂存脚本用当前检出中刚构建的产物替换部署后的 `@deepseek-ai/dsh-web-frontend` 和两个桌面版修改过的客户端插件 bundle，并把欢迎页图像复制进前端资源目录。这样既保留已发布的运行时依赖闭包，也能把桌面渲染器改动交付进同一个安装包。首次启动的归档解压在独立的 Electron Node 模式子进程中执行，不阻塞浏览器窗口事件循环；准备页分别显示解压、后端启动和连接阶段。首次运行界面采用 DeepSeek 的浅蓝色视觉语言，说明 DSH 是 DeepSeek Harness 的简称，并在模型配置前标明这是非官方社区桌面版。

Electron 隐藏原生应用菜单，并用可拖动的覆盖层替代 Windows 标题栏，同时保留原生窗口按钮。隔离的 preload 桥接只向渲染器暴露单目录选择；主进程只接受自有窗口的请求，再打开 Electron 原生文件夹对话框。浏览器客户端继续使用现有 Host 目录选择器。

## Alternatives considered

**直接加载构建后的 Vite 首页。** 浏览器 bundle 不是独立应用：`dsh web` 会注入启动清单，并拥有 API 和 WebSocket 路由，因此 `loadFile()` 无法提供完整产品。

**先实现 Electron IPC 载体。** IPC 可以去掉回环套接字，但会在桌面分发尚未成立前增加重复的传输实现。复用已有安全防护的回环载体可以保持当前行为，并把桌面外壳限制在 `apps/` 中。

**把部署后的 `node_modules` 作为普通附加资源打包。** Electron Builder 会过滤嵌套依赖目录，而保留 pnpm 链接会使 Windows 普通用户得到不可访问的链接。对 hoisted 部署制作单一归档可以提供确定的内容，并在解压后把原生插件保留在真实文件系统中。

## Consequences

桌面应用复用完整 Web 界面及其设置、工作区、会话、工具和模型提供方功能。它只绑定 `127.0.0.1`，选择空闲端口，关闭渲染进程的 Node 集成，并使用系统浏览器打开外部 HTTP 链接。安装包比远程网页外壳更大，首次启动也需要时间展开后端；后续启动会复用版本化解压目录。后端版本变化时会创建新的解压目录；卸载时清理旧版本目录暂不属于当前外壳生命周期。

已验证的 Windows 路径会构建 Harness、暂存生产后端、从暂存后端获得 HTTP 200、生成 NSIS 安装包、完成全新归档解压、通过 Electron 内置 Node 运行时启动打包后端，并显示标题为 `DSH Desktop` 的窗口。
