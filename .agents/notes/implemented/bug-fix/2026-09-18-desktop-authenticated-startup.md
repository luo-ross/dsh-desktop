# Agent Note: Desktop startup exchanges the Web process token

Status: implemented

English | [中文](2026-09-18-desktop-authenticated-startup.zh.md)

## Problem

The community Electron shell extracted the Web URL only through its port, dropping the one-time `token` query parameter printed by `dsh web`. Its readiness probe then requested the unauthenticated root and received HTTP 401, so a running backend was reported as a 30-second startup failure and the window never reached the application.

## Decision

The shell retains the complete loopback launch URL, including its process token. Readiness accepts the 3xx response produced by the token exchange, then Electron loads that authenticated URL so the Web host sets its browser cookie before serving the clean root page.

## Alternatives considered

**Treat HTTP 401 as ready and load the bare root.** Rejected because the root page requires the process token; readiness would pass while the renderer still receives an unauthorized response.

**Disable Web authentication for the loopback desktop process.** Rejected because the desktop host must keep the same token and cookie protection as the supported browser handoff.

## Consequences

The desktop startup path now follows the same token exchange as the supported browser handoff. A bare root request remains unauthorized; it is not a valid readiness probe.

## Testing

The rebuilt Windows package was launched from `dist-desktop/win-unpacked`. Its Electron page reached `http://127.0.0.1:<port>/` and rendered the main interface text (`新会话`, `工作区`, `设置`, `继续`) after authentication. The community desktop tests passed: 5 files and 21 tests.
