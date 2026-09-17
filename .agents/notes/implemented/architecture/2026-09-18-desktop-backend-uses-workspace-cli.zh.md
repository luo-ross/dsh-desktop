# Agent Note: 桌面后端部署工作区 CLI 闭包

Status: implemented

[English](2026-09-18-desktop-backend-uses-workspace-cli.md) | 中文

## 问题

社区桌面版部署曾从 npm registry 解析 `@deepseek-ai/dsh`，而其他后端包来自当前工作区。发布版 CLI 携带旧版嵌套 Typert loader，因此同步后的 DeepSeek Harness 源码生成的描述符会在启动阶段失败。

## 决策

`apps/desktop-backend` 将 `@deepseek-ai/dsh` 声明为 `workspace:^`。这样部署出的 CLI 及其运行时闭包与其他桌面后端包来自同一工作区修订版本。Electron 打包前仍会检查归档中必需的运行时入口。

## 备选方案

**保留 registry CLI，再覆盖选定的包。** 不采用，因为 CLI 的嵌套依赖图仍可能保留旧 loader 与 peer 实现；选择性替换不能保证运行时来自同一修订版本。

**放宽 Typert loader 校验。** 不采用，因为该校验能识别生成产物与运行时混用；放宽校验只会把故障推迟到 Remote 调用。

## 后果

桌面打包现在使用工作区源代码和构建产物中的 CLI，而不是 registry 快照。锁文件不再需要该 CLI 的重复 registry 闭包。工作区变更后必须重新构建桌面包，确保归档后端与生成产物保持一致。
