# Desktop welcome and viewport QA

- Source visual truth: `https://www.deepseek.com/` and the user-provided startup/main-window screenshots.
- Source capture: `.artifacts/design-qa/deepseek-home-reference.png` (1265 x 710 px).
- Implementation captures: `.artifacts/design-qa/welcome-v0.1.3.png` and `.artifacts/design-qa/main-window-v0.1.3.png` (1366 x 720 px).
- Viewport: packaged Windows Electron window at 1366 x 720 logical pixels, device scale factor 1.
- State: first backend extraction welcome screen, followed by the automatically loaded main Harness window.
- Density normalization: both source and implementation captures were reviewed at their native 1x logical-pixel density; the full-view comparison aligned them by height without resampling either source.

## Full-view comparison evidence

The combined comparison at `.artifacts/design-qa/welcome-comparison.png` shows the official reference on the left and the packaged welcome screen on the right. The implementation preserves the reference's pale blue field, blue DeepSeek brand, left-aligned exploration headline, two light feature cards, and a large dark-blue right card while replacing website navigation and recruiting content with desktop startup status.

## Focused region evidence

The right product card and its status panel were checked in the full-resolution packaged capture because the text, spacing, progress indicator, and corner radius are readable at 1x. The main-window capture was checked at its bottom edge: the sidebar and root application surface now extend to the client boundary without the previous 38-pixel blank strip.

## Required fidelity surfaces

- Typography: Segoe UI/PingFang/system fallbacks, restrained weights, large tracked Chinese headline, and readable startup detail match the source hierarchy.
- Spacing and layout: two-column hero, paired feature cards, product-card proportions, and footer maintain the source rhythm across the desktop window.
- Colors and tokens: pale blue base, DeepSeek blue accents, white translucent cards, and a deep-blue status panel reproduce the reference balance.
- Image and asset quality: the packaged DeepSeek application icon is reused for every visible brand mark; no placeholder or code-drawn logo is used.
- Copy and content: all text identifies DeepSeek Harness, explains local preparation, and states that the main window opens automatically.

## Comparison history

1. P1: the prior startup page was a generic centered spinner and did not communicate the DeepSeek product identity. Fixed with the DeepSeek-inspired welcome composition and live startup status panel.
2. P1: the main application root subtracted the 38-pixel title-bar height after the body had already reserved it, leaving a bottom strip. Fixed by making the root consume the body's full content height.
3. P1: the first packaged validation omitted `build/icon.png`, causing the welcome screen to fail before rendering. Fixed by including the real icon asset in the Electron package and rebuilding.

No actionable P0, P1, or P2 differences remain. The implementation intentionally substitutes desktop startup content for the website's recruitment imagery and links.

final result: passed
