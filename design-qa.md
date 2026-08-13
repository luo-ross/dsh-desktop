# Frameless desktop window QA

- Source visual truth: `C:/Users/ADMINI~1/AppData/Local/Temp/codex-clipboard-9cc38e9d-4bb2-46b3-a03b-be38042cf8fa.png`.
- Implementation captures: `.artifacts/design-qa/frameless-welcome-v0.1.4.png` and `.artifacts/design-qa/frameless-main-v0.1.4.png`.
- Source pixels: 1440 x 961 at 1x density.
- Implementation pixels and CSS viewport: 1366 x 720 at device scale factor 1.
- State: packaged Windows `win-unpacked` build, first-run welcome followed by the main Harness window.
- Browser classification: the in-app Browser is available but cannot capture native Electron window chrome; the packaged application was exercised and captured through Windows Computer Use instead.
- Density normalization: both captures were reviewed at native 1x density. The full views retain their original aspect ratios; the focused comparison uses the first 100 logical pixels at the top edge, where the requested frame change occurs.

## Full-view comparison evidence

The source and packaged implementation were opened together in one comparison input. The prior source shows a distinct 38-pixel title-bar row above the sidebar and main surface. In the implementation, the sidebar and main canvas begin at the client area's top edge, while the update action and app-owned window controls float over otherwise unchanged product content. The main surface also reaches the bottom edge without a blank strip.

## Focused region comparison evidence

The top 100-pixel region was checked at native density because it contains the complete requested change. The source separates the product with a solid title-bar band; the implementation has no band, no native caption, and no extra top padding. The DeepSeek logo row begins at y=0 on the left, and the three window controls remain visually and semantically distinct on the right.

## Interaction and runtime evidence

- Startup welcome rendered with live extraction and backend status, then navigated automatically to the Harness main window.
- The maximize button was clicked and changed its accessible name and icon to restore; clicking again returned it to maximize.
- Double-clicking the transparent top drag region maximized the window, proving that the frameless surface still supports native window movement behavior.
- Minimize, maximize/restore, and close controls are exposed through a fixed preload action set; unknown actions are rejected by the tested main-process helper.
- No startup error dialog, framework overlay, or blank render appeared during the packaged run.

## Required fidelity surfaces

- Typography: the existing Harness and welcome-page system fonts, sizes, weights, and wrapping are unchanged; Windows controls use the native Segoe icon font.
- Spacing and layout: the obsolete 38-pixel top reservation is removed, the root occupies the full viewport, and controls do not displace sidebar or composer geometry.
- Colors and tokens: existing Codex-inspired light tokens remain unchanged; window controls are transparent until hover, so no replacement title-bar band is introduced.
- Image and asset quality: the real packaged DeepSeek mark remains intact; no image asset was replaced or approximated.
- Copy and content: product copy is unchanged. Accessible Chinese labels identify minimize, maximize/restore, and close actions.

## Comparison history

1. P1: the source and v0.1.3 implementation reserved a visible 38-pixel Electron title-bar overlay, contradicting the requested immersive treatment. Fixed by using a Windows frameless `BrowserWindow`, removing body top padding, and making the application root fill the viewport.
2. P1: removing the native frame would otherwise remove essential window actions. Fixed with app-owned controls, maximize-state synchronization, a transparent drag region, and a sender-validated IPC action whitelist.
3. Post-fix evidence: the packaged v0.1.4 welcome and main-window captures show no title-bar row; maximize/restore and drag-region interactions passed.

No actionable P0, P1, or P2 findings remain.

final result: passed
