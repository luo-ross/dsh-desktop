# DSH Desktop

English | [中文](README.zh.md)

`@luo-ross/dsh-desktop` packages the DeepSeek Harness Web host as an unofficial Windows Electron application. It starts the bundled backend on an operating-system-assigned loopback port, waits for a successful HTTP response, and opens the real Harness UI in a sandboxed, context-isolated window.

## Install and start

Download `DSH-Desktop-Windows-x64-Setup-<version>.exe` from the repository's [Releases page](https://github.com/luo-ross/dsh-desktop/releases). The installer and its differential-update blockmap include `Windows-x64` in their filenames so the supported platform and architecture are unambiguous. The NSIS installer supports a custom installation directory and creates desktop and Start menu shortcuts named **DSH Desktop**.

The build is not code-signed. Verify the release SHA-256 before accepting an unknown-publisher warning from Windows SmartScreen. The first launch can take about one minute because the packaged backend must be expanded. Extraction runs in a child process, and a DeepSeek-inspired responsive welcome screen reports extraction, backend startup, and connection phases before opening the main window automatically.

## Updates

Installed builds check the public GitHub Releases feed shortly after startup and every six hours while running. A new stable version downloads in the background; the floating update control reports progress and changes to an immediate update action when the verified installer is ready. Clicking it directly stops the bundled backend, installs the update, and relaunches the application without another confirmation dialog. If the action is not clicked, the downloaded version installs when the application exits or automatically after the following launch detects the same staged version. The same control starts a manual check at any time. Development and unpacked builds do not contact the release feed.

## Configure models and workspaces

The first-run page identifies DSH as DeepSeek Harness and identifies DSH Desktop as an unofficial community edition. Continue to **Settings → Models** and save a DeepSeek API key or another supported provider; the DeepSeek editor links directly to the official API-key page. Add or select a workspace from the sidebar before starting a session. New workspace selection uses Electron's Windows folder dialog and starts in the user's Documents directory.

The renderer is the upstream Harness UI, so its model settings, permission presets, tools, sessions, attachments, plugins, and provider behavior are unchanged. The Codex-inspired desktop stylesheet changes presentation only, while Electron supplies a frameless immersive Windows window, in-app window controls, and the desktop folder-picker bridge.

## Storage and network behavior

Harness state resolves through `DSH_HOME`, then `~/.dsh`. This directory contains settings, managed credentials, profiles, session data, and attachments; reinstalling DSH Desktop does not delete it.

The extracted packaged backend is separate from Harness state. Electron stores it below its per-user application-data directory in `backend-<version>`, and later launches reuse it only when the completion marker and required runtime files are present.

The backend listens only on `127.0.0.1` and chooses a free port. The renderer has Node.js integration disabled, uses context isolation and sandboxing, and sends external HTTP links to the system browser. DSH Desktop adds no telemetry, but the upstream Harness and configured model providers may make their documented network requests.

## Development

Install the repository prerequisites, run `pnpm install`, then execute `pnpm run desktop:dev` from the repository root. The command builds Harness before launching Electron. Development mode uses the checkout's built CLI rather than the packaged backend archive.

## Build the Windows installer

Run `pnpm run desktop:pack` from the repository root. The build performs these operations:

1. Build the Harness host and Web UI.
2. Deploy the production `@deepseek-ai/dsh` dependency closure with a hoisted node linker.
3. Overlay the just-built Web frontend and desktop-modified client plugin bundles into the deployed backend so renderer changes ship with the pinned runtime dependency closure.
4. Create `desktop-backend.tar.gz` so nested dependencies and native files survive Electron Builder packaging.
5. Build the x64 unpacked application, NSIS installer, `latest.yml`, and differential-download blockmap in `dist-desktop/`.

The generated deployment directory, archive, unpacked application, installer, update metadata, and blockmap are ignored by Git. Every GitHub release must publish the installer, `latest.yml`, and matching blockmap together; clients verify the metadata checksum before installing. Release binaries are not committed to the source tree.

## Troubleshooting

**The first launch appears slow.** Wait for the preparation page to finish. Antivirus scanning and backend extraction can make the first launch materially slower than later launches.

**Startup reports a missing module or incomplete backend.** Install the newest release. A correctly packaged build carries `backend.tar.gz` and replaces an incomplete versioned extraction automatically.

**The application reports an HTTP timeout or connection reset.** Close DSH Desktop, confirm no older DSH Desktop process remains, then start it again. Preserve the complete error message when reporting a reproducible failure.

**Selecting a workspace reports a Windows folder-dialog worker error.** Install version 0.1.1 or newer. The desktop renderer uses Electron's native folder dialog instead of the upstream Windows helper while preserving silent cancellation and the existing Web fallback.

**A pinned taskbar shortcut shows an old icon.** Unpin it and pin the installed application again; Windows can retain shortcut icon caches across upgrades.

**Update checking fails.** Confirm that GitHub Releases is reachable and retry from the floating update control. Background network failures do not interrupt Harness work. Automatic updating starts with version 0.1.2; older installations require one final manual installer download.

## Limitations

- The published installer currently targets Windows x64 only.
- The installer and downloaded updates are unsigned, so Windows may continue to identify DSH Desktop as an unknown publisher until release signing is configured.
- First launch requires local disk space and time to extract the packaged backend.
- The wrapper tracks a rapidly changing developer-preview upstream and may require a new desktop release after incompatible upstream changes.
- Uninstalling the application does not remove Harness state under `DSH_HOME` or `~/.dsh`, and old versioned backend extractions are not automatically pruned.

## Attribution

The window, executable, installer, and Windows shortcuts use an ICO derived from the official DeepSeek whale mark at `apps/web/public/favicon.svg`. DSH Desktop is an unofficial community build and is not endorsed by DeepSeek AI. Source is provided under the repository's MIT license, with third-party notices retained at the repository root.
