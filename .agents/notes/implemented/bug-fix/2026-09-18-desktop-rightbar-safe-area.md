# Agent Note: Keep the desktop right Sidebar below the titlebar

Status: implemented

English | [中文](2026-09-18-desktop-rightbar-safe-area.zh.md)

## Problem

The current client replaced the old `details` column with `rightbar`, but the community desktop skin still targeted the old class names. The right Sidebar therefore started at the window edge and could sit beneath the frameless titlebar controls.

## Decision

The right Sidebar panel starts at `--dsh-desktop-titlebar-safe-area` in normal mode and keeps `inset: 0` in fullscreen mode. The desktop skin targets the new rightbar column and panel attributes.

## Consequences

Normal right Sidebar tabs and content remain readable below the native window controls. Fullscreen right Sidebar presentation is unchanged, and web builds retain their zero-offset default.

## Testing

The rebuilt `dist-desktop/win-unpacked/DSH.exe` reached the main interface. The right Sidebar opened with its panel below the 30px titlebar safe area, and workspace/session secondary-click menus rendered their `打开所在位置` action.
