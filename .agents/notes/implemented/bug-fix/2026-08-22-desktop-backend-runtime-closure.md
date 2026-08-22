# Agent Note: Complete desktop backend runtime closure

Status: implemented

English | [中文](2026-08-22-desktop-backend-runtime-closure.zh.md)

## Problem

The desktop backend deployment used `@deepseek-ai/dsh` as its only Harness root. The CLI reaches `@deepseek-ai/cordis-plugin-group` through `dsh-app-boot` as a peer dependency, so `pnpm deploy --prod` did not include that package. The archive still passed its narrow file checks and failed only when the installed application started the Loader.

## Decision

The desktop backend manifest mirrors the repository's canonical Python deploy-root dependencies, adds the CLI executable package, and roots the additional peers reachable through the Web application graph. That shared root set supplies every required workspace peer while each product keeps its own entry package. The repository runtime-closure check validates both deploy manifests and traverses application workspaces as well as package workspaces. A shared runtime-path list validates the deployed tree before archive creation and validates an extracted cache before reuse. The Electron application packages that list with its main process. This is the dependency-completeness extension of the [Electron desktop wrapper](../feature/2026-08-13-electron-desktop-wrapper.md).

The contract test pins parity with the canonical deploy roots, the `@deepseek-ai/cordis-plugin-group` archive path, and the Electron packaging entry. The built-artifact check still starts the deployed CLI, which detects additional missing runtime imports.

## Alternatives considered

**Rely on peer auto-installation.** Deployment uses explicit production inputs and must not depend on package-manager peer heuristics that can change with configuration or version.

**Maintain a smaller desktop-only peer list.** The list would duplicate the same recursive closure rules while drifting whenever a shared package changes a required peer.

**Copy the missing package after deployment.** An isolated copy can lose its own dependency structure and bypasses the dependency graph that `pnpm deploy` already knows how to produce.

**Validate only the CLI entry file.** That proves the executable exists but does not prove the Loader modules imported during startup are present.

## Consequences

Desktop packaging fails before Electron Builder runs when a required Loader package is absent. Extracted caches with a completion marker but without a required runtime file are treated as incomplete and replaced. The desktop deploy root grows with the canonical runtime root, including packages used only by another launcher, in exchange for one mechanically checked peer closure.
