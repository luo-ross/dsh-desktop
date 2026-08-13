# Agent Note: Portable GitHub workflows for community forks

Status: implemented

English | [中文](2026-08-14-community-fork-github-workflows.zh.md)

## Problem

The upstream workflows assume organization-owned larger runners, self-hosted standby pools, a repository-management GitHub App, and an npm release family containing every application workspace. A community fork has none of those private resources, and this desktop fork also adds application packages under a different npm scope. Pull requests consequently remain queued or fail before their dependency changes are evaluated.

## Decision

Organization-only issue automation and standby jobs run only in `deepseek-ai/deepseek-harness`. Required pull-request jobs keep the upstream runner selection there and use GitHub-hosted `ubuntu-24.04` or `windows-2025` runners in forks. This preserves executable CI rather than treating missing private infrastructure as a product failure.

The dsh npm release family explicitly includes `apps/cli` and `apps/web` alongside `packages/*/*`. Community desktop applications remain workspace members but are packaged and released by their own desktop workflow, so upstream npm verification does not require an `@deepseek-ai` name or the upstream shared version.

## Alternatives considered

**Copy the upstream secrets and runner names into each fork.** Fork maintainers cannot access organization credentials or runner groups, and matching names would not create the underlying infrastructure.

**Disable all inherited CI in forks.** This removes false failures but also removes useful hosted checks from dependency pull requests.

**Include every `apps/*` package in the upstream release family.** This couples independently versioned community products to the upstream npm scope and release tag.

## Consequences

Fork pull requests receive hosted Linux and Windows checks and skip only automation that cannot function outside the upstream repository. New upstream applications must be added explicitly to the dsh release-family pattern. New community applications need their own packaging and publication path.
