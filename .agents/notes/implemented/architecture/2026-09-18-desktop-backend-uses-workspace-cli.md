# Agent Note: Desktop backend deploys the workspace CLI closure

Status: implemented

English | [中文](2026-09-18-desktop-backend-uses-workspace-cli.zh.md)

## Problem

The community desktop deployment resolved `@deepseek-ai/dsh` from the npm registry while the other backend packages came from the current workspace. The published CLI carried an older nested Typert loader, so generated descriptors from the synchronized DeepSeek Harness source failed during startup.

## Decision

`apps/desktop-backend` declares `@deepseek-ai/dsh` as `workspace:^`. The deployment therefore includes the CLI and its runtime closure built from the same workspace revision as the other desktop backend packages. The packaged archive is checked for the required runtime entry points before Electron packaging.

## Alternatives considered

**Keep the registry CLI and copy selected packages over it.** Rejected because the CLI's nested dependency graph can retain older loaders and peer implementations; selectively replacing packages does not establish one coherent runtime revision.

**Relax Typert loader validation.** Rejected because the validation detects a mixed generated-artifact/runtime set and weakening it would defer the failure to Remote calls.

## Consequences

Desktop packaging now follows workspace source and built artifacts for the CLI instead of a registry snapshot. The lockfile no longer needs the duplicate registry closure for that CLI. A desktop package must be rebuilt after workspace changes so the archived backend and generated artifacts stay aligned.
