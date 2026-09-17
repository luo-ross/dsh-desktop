# Agent Note：桌面启动交换 Web 进程 token

状态：已实现

[English](2026-09-18-desktop-authenticated-startup.md) | 中文

## 问题

社区 Electron 壳层只从 `dsh web` 输出中提取端口，丢弃了 URL 上的一次性 `token` 查询参数。随后就绪探针访问未认证的根路径并收到 HTTP 401，因此把已运行的后端报告为 30 秒启动失败，窗口也无法进入应用。

## 决策

壳层保留包含进程 token 的完整本机 URL。token 交换产生的 3xx 响应被视为就绪，Electron 随后加载该认证 URL，让 Web 主机先设置浏览器 cookie，再提供不带 token 的根页面。

## 备选方案

**将 HTTP 401 直接视为就绪并加载不带 token 的根路径。** 不采用，因为根页面需要进程 token；这样就绪检查虽然通过，渲染器仍会收到未授权响应。

**关闭本机桌面进程的 Web 认证。** 不采用，因为桌面主机必须与受支持的浏览器交接流程保持相同的 token 和 cookie 保护。

## 后果

桌面启动现在遵循受支持的浏览器交接所使用的 token 交换流程。未带 token 的根路径仍然未授权，不能作为就绪探针。

## 测试

重新构建的 Windows 包从 `dist-desktop/win-unpacked` 启动成功。Electron 页面进入 `http://127.0.0.1:<port>/`，认证后渲染了主界面文字（`新会话`、`工作区`、`设置`、`继续`）。社区桌面测试通过：5 个文件、21 个测试。
