# DSH startup timeline card QA

- Source visual truth: `C:/Users/Administrator/.codex/generated_images/019ffb51-047c-75a2-b56e-3d033f5407f9/exec-09bf331d-a59f-409b-880d-44394bb21738.png`.
- Implementation: `.artifacts/design-qa/welcome-timeline-dsh-implementation.jpg` captured from the locally packaged Windows `DSH.exe` with a fresh profile.
- Focused comparison: `.artifacts/design-qa/welcome-timeline-dsh-comparison.jpg` (reference on the left, packaged implementation on the right).
- Progress animation comparison: `.artifacts/design-qa/welcome-progress-shimmer-clipped-comparison.png` (user reference on the left; two packaged-app frames on the right).
- Captured viewport: 1366 x 721 at 1x density.
- Compared card size: 487 x 400 pixels.

## Required fidelity surfaces

- Structure: DeepSeek Harness product mark, product name, tagline, active startup step, progress bar, dashed connector, and pending next step are all present in the same hierarchy as the selected reference.
- Typography: the reference's large product-name treatment is retained while applying the requested shorter `DSH` name.
- Spacing: the card content follows the reference's top-to-bottom rhythm and no text, progress, or timeline elements overlap.
- Color and depth: deep DeepSeek blue, white primary copy, subdued secondary copy, rounded corners, and the soft exterior shadow match the selected direction.
- Copy: service-related startup copy uses `服务`; the product-facing name is `DSH`.
- Assets: the existing DeepSeek whale asset is used at both product-mark positions without distortion.
- Motion: a blue-white highlight continuously sweeps from left to right inside the completed-progress segment only; the unfinished track remains static, and the completed width remains controlled by real startup stages.

## Iteration history

1. The first packaged capture exposed a title/status collision inside the card.
2. The product-name top margin was reduced from 78px to 38px, the app was rebuilt, and the startup state was captured again with a fresh profile.
3. The combined comparison confirms that the revised hierarchy is legible and aligned with the chosen two-stage timeline reference.
4. The initial solid-white moving marker blended into the white completed-progress segment and was not sufficiently visible.
5. It was replaced by a wider blue-white shimmer. Two packaged-app frames captured 287ms apart show the highlight at different positions without changing the real progress value.
6. The shimmer was then clipped to the completed-progress width. A fresh packaged build confirms that its two captured positions remain entirely left of the completed/unfinished boundary.

## Result

- P0 issues: none.
- P1 issues: none.
- P2 issues: none.

final result: passed
