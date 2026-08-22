# Agent Note: 真实 API e2e 使用可选的仓库密钥

Status: implemented

[English](2026-08-14-optional-real-api-e2e-secret.md) | 中文

## 问题

桌面应用在运行时接收每位用户的 DeepSeek API Key。仓库 fork 不一定另有 CI 密钥，但专用的[真实 API e2e 工作流](../../../../.github/workflows/e2e.yml)会把缺少 `DEEPSEEK_API_KEY_EXTERNAL` Actions secret 视为每次可信 push 的配置错误。这会让无关改动失败，尽管应用会正确地向用户请求凭证。原工作流及其安全模型仍记录在[针对外部 DeepSeek API 的 CI 真实 API e2e](2026-06-19-real-api-e2e-ci.zh.md)中。

## 决策

工作流将 `DEEPSEEK_API_KEY_EXTERNAL` 视为可选的仓库自有测试基础设施。首个步骤映射 secret、输出 `available` 布尔值，并在缺少 secret 时打印 notice。只有该输出为 true 时，工作流才会执行 checkout、工具链设置、依赖安装、构建和真实 API 测试。因此，无密钥运行会在明确提示覆盖已跳过后成功结束；配置了密钥的仓库仍会运行完整的外部 API 套件。

桌面用户在运行时输入的 API Key 与 GitHub Actions 相互独立，绝不会复制到 CI。针对 fork 和 Dependabot 的 job 级排除、使用 `pull_request` 而非 `pull_request_target`、步骤级 secret 暴露以及只读 token 权限均保持不变。

## 曾考虑的替代方案

- **要求每个仓库 fork 配置 CI 密钥。** 否决，因为维护者可选的真实 API 测试预算与桌面用户的运行时凭证相互独立，缺少基础设施不应导致普通 push 失败。
- **删除真实 API 工作流。** 否决，因为配置了 secret 的仓库仍需要在可信事件上获得线上模型覆盖。
- **将密钥作为 workflow dispatch 输入。** 否决，因为 Actions secret 提供适当的掩码和访问控制；普通工作流输入不是凭证存储。

## 后果

未配置 `DEEPSEEK_API_KEY_EXTERNAL` 的仓库会得到绿色工作流结果和可见 notice，但该结果不能证明真实 API 行为。无密钥 CI 工作流仍是必需的质量信号。需要线上覆盖的仓库配置 secret 后，会保留原有测试范围、触发条件、超时和安全限制。
