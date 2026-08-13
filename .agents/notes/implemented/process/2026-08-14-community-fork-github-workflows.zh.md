# Agent Note：社区 Fork 的可移植 GitHub 工作流

Status: implemented

[English](2026-08-14-community-fork-github-workflows.md) | 中文

## 问题

上游工作流依赖组织专属的大规格 Runner、自托管待命池、仓库管理 GitHub App，并假定 npm 发布家族包含所有应用工作区。社区 Fork 没有这些私有资源，而这个桌面 Fork 还在另一个 npm scope 下增加了应用包。因此，拉取请求会长期排队，或者在真正验证依赖变更前失败。

## 决策

组织专属的 Issue 自动化和待命任务只在 `deepseek-ai/deepseek-harness` 中运行。必要的拉取请求任务在上游仓库继续使用原有 Runner，在 Fork 中则使用 GitHub 托管的 `ubuntu-24.04` 或 `windows-2025` Runner。这样能保留可执行的 CI，而不会把私有基础设施缺失误报成产品故障。

dsh npm 发布家族明确包含 `apps/cli`、`apps/web` 和 `packages/*/*`。社区桌面应用仍是工作区成员，但由自己的桌面工作流打包和发布，因此上游 npm 校验不要求它们使用 `@deepseek-ai` 名称或共享上游版本。

## 考虑过的替代方案

**把上游密钥和 Runner 名称复制到每个 Fork。** Fork 维护者无法访问组织凭据或 Runner 组，复制名称也不会创建对应的基础设施。

**在 Fork 中禁用所有继承的 CI。** 这能消除误报，但也会移除依赖拉取请求仍可使用的托管检查。

**把所有 `apps/*` 包都加入上游发布家族。** 这会把独立版本的社区产品绑定到上游 npm scope 和发布标签。

## 后果

Fork 的拉取请求会获得托管 Linux 和 Windows 检查，只跳过无法在上游仓库之外运行的自动化。新增上游应用必须明确加入 dsh 发布家族模式；新增社区应用需要拥有自己的打包和发布路径。
