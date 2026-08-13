# Agent Note: Electron desktop wrapper

Status: implemented

English | [中文](2026-08-13-electron-desktop-wrapper.zh.md)

## Problem

DeepSeek Harness exposes its graphical product through `dsh web`, which requires a terminal-managed server and a separate browser. A Windows desktop distribution must preserve the complete Host and browser behavior without depending on a source checkout, a separately installed Node.js runtime, or a fixed local port.

## Decision

`apps/desktop` is an Electron shell over the existing loopback Web carrier. Its main process holds Electron's single-instance lock, immediately shows a sandboxed and context-isolated preparation window, and starts the packaged `dsh web` backend through Electron's Node mode with the `--expose-internals` flag required by the HMR service. The backend binds an operating-system-assigned loopback port. The preparation page is replaced only after the backend prints its URL and an HTTP request returns successfully, so a URL printed immediately before a later Loader failure never becomes a broken navigation. A second launch focuses the existing window instead of starting another extraction or backend. Closing the application waits for backend termination and force-stops the owned process tree only when graceful shutdown does not reach quiescence.

The Windows installer carries the official `@deepseek-ai/dsh` production dependency closure as a gzip tar archive. The deployment-root manifest pins the published `@deepseek-ai/dsh` version instead of injecting the workspace member because pnpm's deployed workspace closure omits runtime-loaded plugin packages. The workspace constraint permits only that named deployment dependency and exact version. First launch extracts the archive atomically into the versioned Electron user-data directory because Electron Builder excludes nested `node_modules` from ordinary extra resources and Windows cannot safely recreate pnpm symbolic links without elevated link privileges. The staging deployment uses pnpm's hoisted node linker so the archive contains real directories and native addon files. The application reuses an extraction only when its completion marker and required CLI and YAML entry files all exist; an interrupted or incomplete extraction is replaced before the backend starts.

This decision partially supersedes the Electron-specific IPC reservation in [GUI layering and the RPC protocol](../architecture/2026-07-19-gui-layering-and-rpc-protocol.md). The loopback carrier is the shipped desktop transport; an IPC carrier remains a compatible future optimization rather than a prerequisite for a desktop product.

The renderer receives an Electron-only Codex-inspired light skin after the backend page loads. The skin overrides design tokens and panel geometry without replacing Web components, so workspace, session, model, settings, composer, and details behavior remain owned by the existing Harness UI. The browser-hosted product retains its normal theme behavior. Electron hides the native application menu to keep desktop chrome minimal; standard text-editing shortcuts remain renderer behavior. The community distribution is named DSH Desktop, uses the `@luo-ross/dsh-desktop` package and `io.github.luoross.dshdesktop` Windows application identity, and states that it is not an official DeepSeek AI product. Desktop workspace manifests point their source metadata to the community repository while every upstream release member retains the official repository URL. The DSH Desktop window keeps its product title after the upstream page loads. Its window, executable, installer, and Windows shortcuts use an ICO derived from the official DeepSeek whale mark at `apps/web/public/favicon.svg` instead of Electron's default mark.

## Alternatives considered

**Load the built Vite index directly.** The browser bundle is not a standalone application: `dsh web` injects its boot manifest and owns API and WebSocket routes, so `loadFile()` cannot provide the product.

**Implement an Electron IPC carrier first.** IPC could remove the loopback socket, but it would duplicate transport work before establishing desktop distribution. Reusing the security-fenced loopback carrier preserves current behavior and keeps the wrapper local to `apps/`.

**Package the deployed `node_modules` directory as ordinary extra resources.** Electron Builder filters nested dependency directories, and preserving pnpm links produces inaccessible links for ordinary Windows users. A single archive over a hoisted deployment is deterministic and keeps native addons on a real filesystem after extraction.

## Consequences

The desktop application reuses the entire Web surface and its settings, workspace, session, tool, and provider behavior. It binds only to `127.0.0.1`, chooses a free port, disables renderer Node integration, and opens external HTTP links in the system browser. The installer is larger than a remote-site wrapper, and first launch spends time expanding the bundled backend, but later launches reuse the versioned extraction. A backend version change creates a new extraction directory; uninstall-time cleanup of old version directories remains outside the wrapper's current lifecycle.

The verified Windows path builds the Harness, stages the production backend, receives HTTP 200 from the staged backend, builds the NSIS installer, completes a fresh archive extraction, starts the packaged backend through Electron's embedded Node runtime, and presents the `DSH Desktop` window.
