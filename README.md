# DSH

English | [中文](README.zh.md)

DSH is an unofficial community desktop edition of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It packages the upstream Web UI and local backend into an Electron application for Windows, so the Harness can run without a separately managed terminal or browser tab.

> DSH is a community project and is not an official DeepSeek AI product. DeepSeek Harness and the whale mark belong to their respective owner.

## Run

Download the latest Windows x64 installer from [GitHub Releases](https://github.com/luo-ross/dsh-desktop/releases/latest). The installer supports a custom destination and creates optional desktop and Start menu shortcuts.

The initial release is not code-signed. Windows SmartScreen may display an unknown-publisher warning; verify the SHA-256 value published with the release before running the installer.

## What the desktop edition adds

- A self-contained Windows installer with the Harness backend and its production dependencies.
- A single-instance Electron window that starts the backend on an operating-system-assigned `127.0.0.1` port.
- A DeepSeek-inspired startup welcome screen that stays responsive while the local Harness backend is prepared, then opens the main window automatically.
- A light, Codex-inspired desktop skin that keeps the upstream workspace, session, model, settings, tools, and permission behavior intact.
- A frameless immersive Windows window with in-app controls, plus an Electron-owned folder picker for reliable workspace selection.
- The DeepSeek whale icon for the application, installer, taskbar, and shortcuts.
- Automatic stable-release checks and background downloads through GitHub Releases; installation starts only after the user clicks the ready update action.

## First run and configuration

The first launch can take about one minute while the bundled backend is expanded into the Electron user-data directory. Extraction runs in a child process so the preparation window remains responsive and reports its current phase. Later launches reuse that versioned extraction.

The startup welcome screen identifies DSH as the unofficial community desktop edition of DeepSeek Harness and reports backend preparation progress. It closes automatically when the main Harness window is ready. In model setup, the DeepSeek provider includes a direct link to the official API-key page, or you can configure another supported provider. Then add a workspace from the sidebar. Harness settings, credentials, sessions, and attachments use the upstream Harness home: `DSH_HOME` when set, otherwise `~/.dsh`. The desktop backend starts with the user's Documents directory as its initial filesystem location.

The wrapper binds only to loopback, disables Node.js integration in the renderer, and opens external HTTP links in the system browser. It adds no telemetry of its own; the bundled upstream Harness and configured model providers retain their own network behavior.

See the [desktop reference](apps/desktop/README.md) for installation, storage, build, troubleshooting, and limitation details.

## Run from source

Install Node.js 22.19 or newer and pnpm 11.7, then run:

```sh
git clone https://github.com/luo-ross/dsh-desktop.git
cd dsh-desktop
pnpm install
pnpm run desktop:dev
```

Build the Windows installer with `pnpm run desktop:pack`. Outputs are written to `dist-desktop/`.

## Upstream relationship

This repository carries the DeepSeek Harness source tree so the desktop application can build the real Web UI and backend. Desktop-specific code lives in `apps/desktop`; the upstream project remains the authority for Harness behavior, providers, plugins, and developer documentation. Compatibility-breaking upstream changes are expected while DeepSeek Harness remains in developer preview.

## License and attribution

Source code is available under the [MIT License](LICENSE). Third-party dependencies and their licenses are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The MIT license does not imply endorsement by DeepSeek AI or grant rights to represent this community build as an official product.
