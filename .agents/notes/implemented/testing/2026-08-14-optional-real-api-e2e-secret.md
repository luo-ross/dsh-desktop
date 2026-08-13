# Agent Note: Optional repository secret for real-API e2e

Status: implemented

English | [中文](2026-08-14-optional-real-api-e2e-secret.zh.md)

## Problem

The desktop application receives each user's DeepSeek API key at runtime. A repository fork does not necessarily own a separate CI key, but the dedicated [real-API e2e workflow](../../../../.github/workflows/e2e.yml) treated an absent `DEEPSEEK_API_KEY_EXTERNAL` Actions secret as a configuration error on every trusted push. That made unrelated changes fail even though the application correctly asks its user for credentials. The original workflow and its security model remain documented in [Real-API e2e in CI against the external DeepSeek API](2026-06-19-real-api-e2e-ci.md).

## Decision

The workflow treats `DEEPSEEK_API_KEY_EXTERNAL` as optional repository-owned test infrastructure. Its first step maps the secret, emits an `available` boolean output, and prints a notice when the secret is absent. Checkout, toolchain setup, dependency installation, build, and real-API tests run only when that output is true. Missing-key runs therefore succeed with an explicit skipped-coverage notice; configured repositories retain the complete external-API suite.

The runtime API key entered by a desktop user is separate from GitHub Actions and is never copied into CI. The fork and Dependabot job-level exclusions, `pull_request` rather than `pull_request_target`, step-scoped secret exposure, and read-only token permissions remain unchanged.

## Alternatives considered

- **Require every repository fork to configure a CI key.** Rejected because a maintainer's optional real-API test budget is independent of the desktop user's runtime credential, and missing infrastructure must not make ordinary pushes fail.
- **Remove the real-API workflow.** Rejected because repositories that configure the secret still need live model coverage on trusted events.
- **Accept a key as a workflow-dispatch input.** Rejected because an Actions secret provides the appropriate masking and access controls; ordinary workflow inputs are not a credential store.

## Consequences

Repositories without `DEEPSEEK_API_KEY_EXTERNAL` receive a green workflow result plus a visible notice, but that result does not prove real-API behavior. The keyless CI workflow remains the required quality signal. Repositories that need live coverage configure the secret and retain the original test scope, triggers, timeout, and security restrictions.
