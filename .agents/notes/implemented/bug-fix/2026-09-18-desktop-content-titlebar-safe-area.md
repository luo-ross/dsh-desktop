# Agent Note: Keep desktop content below the titlebar controls

Status: implemented

English | [中文](2026-09-18-desktop-content-titlebar-safe-area.zh.md)

## Problem

The desktop shell reserved only 30px while its custom Windows controls occupy 38px. The center header and a visible right Sidebar could therefore sit against or beneath the frameless titlebar controls.

## Decision

The community desktop theme supplies a 44px titlebar safe area. The existing center-column and normal right-Sidebar rules consume that token; fullscreen right-Sidebar mode continues to cover the whole viewport.

## Alternatives considered

Keeping the existing 30px value would leave the first content row inside the 38px frameless control row. Changing the layout rules independently would duplicate the desktop offset instead of preserving the shared theme token.

## Consequences

Desktop content starts below the complete titlebar control row while the web build keeps its own default. Workspace and session secondary-click menus retain the `打开所在位置` action when the desktop path capability is available.

## Testing

The rebuilt Windows executable must reach the main interface, show the center and right-Sidebar roots at or below 44px, and render the left-navigation `打开所在位置` context-menu item.
