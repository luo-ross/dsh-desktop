# Agent Note: 完整的桌面后端运行时闭包

Status: implemented

[English](2026-08-22-desktop-backend-runtime-closure.md) | 中文

## Problem

桌面后端部署只把 `@deepseek-ai/dsh` 作为 Harness 根依赖。CLI 通过 `dsh-app-boot` 的 peer 依赖使用 `@deepseek-ai/cordis-plugin-group`，因此 `pnpm deploy --prod` 没有包含该包。归档仍能通过原先范围过窄的文件检查，直到已安装应用启动 Loader 时才失败。

## Decision

桌面后端 manifest 镜像仓库规范的 Python 部署根依赖，额外加入 CLI 可执行包，并为 Web 应用依赖图可达的其他 peer 提供根依赖。这组共享根依赖会提供所有必要的 workspace peer，而每个产品仍保留自己的入口包。仓库运行时闭包检查会同时校验两个部署 manifest，并遍历应用工作区与软件包工作区。共享的运行时路径列表会在创建归档前校验部署目录，也会在复用解压缓存前校验缓存。Electron 应用会把这份列表与主进程一起打包。这是对 [Electron 桌面外壳](../feature/2026-08-13-electron-desktop-wrapper.zh.md)依赖完整性的扩展。

契约测试固定桌面部署根与规范根的一致性、`@deepseek-ai/cordis-plugin-group` 的归档必要路径和 Electron 打包入口。构建产物检查仍会启动部署后的 CLI，以发现其他缺失的运行时导入。

## Alternatives considered

**依赖 peer 自动安装。** 部署使用明确的生产输入，不能依赖可能随配置或版本变化的包管理器 peer 推断行为。

**维护一份更小的桌面专用 peer 列表。** 这会重复同一套递归闭包规则，并在共享包改变必要 peer 时发生漂移。

**部署后单独复制缺失包。** 孤立复制可能丢失该包自身的依赖结构，也会绕过 `pnpm deploy` 已经掌握的依赖图。

**只校验 CLI 入口文件。** 这只能证明可执行文件存在，不能证明启动期间 Loader 导入的模块齐全。

## Consequences

缺少必要 Loader 包时，桌面打包会在 Electron Builder 运行前失败。即使解压缓存带有完成标记，只要缺少必要运行文件，也会被视为不完整并重新替换。桌面部署根会随规范运行时根一起增长，可能包含只由其他启动器使用的包；代价换来的是一套由机器校验的 peer 闭包。
