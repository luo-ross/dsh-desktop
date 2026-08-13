# Frameless title-bar safe-area QA

- Source visual truth: `.artifacts/design-qa/titlebar-overlap-reference-v0.1.7.png` (user-provided packaged-app screenshot).
- Implementation capture: `.artifacts/design-qa/titlebar-safe-area-v0.1.7.png` (packaged Windows `win-unpacked` v0.1.7 build).
- Combined comparison: `.artifacts/design-qa/titlebar-safe-area-comparison-v0.1.7.png`.
- Source viewport: 1450 × 457 pixels at 1x density.
- Implementation viewport: 1366 × 720 pixels at 1x density; the comparison uses the first 430 pixels at the top edge, where the reported collision occurs.
- Capture path: the in-app Browser cannot include native Electron window chrome, so the packaged application was exercised and captured through Windows Computer Use.

## Visual comparison

The reference and packaged implementation were placed together in one comparison input. In the reference, session metadata and the `Session log` action occupy the same top-right strip as the app-owned minimize, maximize, and close controls. In v0.1.7, the center column begins below a 38-pixel safe area matching the controls' height. The sidebar remains flush with the top edge, preserving the immersive layout, while the update action remains isolated in the title-bar strip. The details column receives the same safe area plus its existing 12-pixel inset.

## Runtime evidence

- The packaged application launched successfully and stayed responsive through first-run extraction and backend startup.
- The welcome screen transitioned automatically to the live Harness main window.
- The main window rendered without a native title bar, startup error, blank strip, or framework overlay.
- Minimize, maximize, and close controls remained visible and distinct in the reserved top-right strip.
- Main content starts below the window controls and continues to the bottom edge.

## Required fidelity surfaces

- Typography, colors, assets, and upstream Harness component behavior are unchanged.
- Only Electron's center and details layout geometry changes; browser-hosted Harness clients are unaffected.
- The 38-pixel inset matches the app-owned control height and does not introduce a visible title-bar band.
- Sidebar branding and navigation remain aligned to the window's top edge.

## Findings

1. P1: app-owned window controls could cover session actions and metadata in the top-right of the center column. Fixed with a 38-pixel center-column safe area.
2. P1: details content could enter the same control strip when the inspector was open. Fixed with the same safe area while retaining the existing 12-pixel card inset.
3. Post-fix packaged evidence shows the title-bar strip and main content as separate, non-overlapping regions.

No actionable P0, P1, or P2 findings remain.

final result: passed
