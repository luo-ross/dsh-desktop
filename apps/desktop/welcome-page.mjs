import { createWindowControlsMarkup, WINDOW_CONTROLS_CSS } from './window-controls.mjs'

export function createWelcomePage({ cachedBackend = false, frameless, iconDataUrl, version }) {
  const startupStatus = cachedBackend ? '正在快速启动 DeepSeek Harness…' : '正在准备桌面环境…'
  const startupDetail = cachedBackend
    ? '已复用本机运行环境，无需重复初始化。'
    : '首次启动可能需要约一分钟。'
  const startupProgress = cachedBackend ? 62 : 18

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DSH</title>
  <style>
    :root {
      color-scheme: light;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      background: #f4f8ff;
      color: #17233d;
    }
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
    body {
      position: relative;
      background: #f4f8ff;
    }
    ${frameless ? `body::before {
      content: '';
      position: fixed;
      z-index: 10;
      inset: 0 300px auto 0;
      height: 32px;
      -webkit-app-region: drag;
    }
    ${WINDOW_CONTROLS_CSS}` : ''}
    .shell {
      display: grid;
      grid-template-rows: auto 1fr auto;
      width: min(1240px, calc(100% - 112px));
      height: 100%;
      margin: 0 auto;
      padding: 24px 0 32px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #3978ed;
      font-size: 23px;
      font-weight: 650;
      letter-spacing: -0.5px;
    }
    .brand img { width: 29px; height: 29px; filter: invert(45%) sepia(91%) saturate(1858%) hue-rotate(202deg) brightness(98%); }
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
      align-items: center;
      gap: clamp(48px, 7vw, 104px);
      padding: 24px 32px 10px;
    }
    .eyebrow {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 30px;
      color: #71809a;
      font-size: 15px;
    }
    .eyebrow img { width: 18px; height: 18px; opacity: 0.68; }
    h1 {
      margin: 0;
      color: #17233d;
      font-size: clamp(43px, 4vw, 66px);
      font-weight: 420;
      letter-spacing: 0.18em;
      line-height: 1.16;
    }
    .subtitle {
      max-width: 590px;
      margin: 24px 0 0;
      color: #5d6d87;
      font-size: 16px;
      line-height: 1.8;
    }
    .feature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 38px; }
    .feature {
      min-height: 126px;
      padding: 24px 26px;
      border: 1px solid rgb(117 151 207 / 18%);
      border-radius: 24px;
      background: rgb(255 255 255 / 72%);
      box-shadow: 0 18px 50px rgb(70 111 177 / 8%);
    }
    .feature strong { display: block; margin-bottom: 12px; color: #316cd8; font-size: 18px; }
    .feature span { color: #63718a; font-size: 14px; line-height: 1.65; }
    .product-card {
      position: relative;
      min-height: 400px;
      overflow: hidden;
      padding: 48px 44px;
      border-radius: 28px;
      background: #20549a;
      color: #ffffff;
      box-shadow: 0 28px 70px rgb(25 74 143 / 24%);
    }
    .product-mark { display: flex; align-items: center; gap: 12px; color: rgb(255 255 255 / 78%); font-size: 14px; }
    .product-mark img { width: 32px; height: 32px; filter: invert(1); }
    .product-card h2 { margin: 38px 0 8px; font-size: 42px; font-weight: 560; letter-spacing: -0.03em; }
    .product-card .edition { margin: 0; color: rgb(255 255 255 / 82%); font-size: 21px; }
    .status-panel {
      position: absolute;
      right: 44px;
      bottom: 38px;
      left: 44px;
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr);
      column-gap: 16px;
    }
    .status-rail {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 2px;
    }
    .status-dot {
      width: 22px;
      height: 22px;
      border: 2px solid rgb(255 255 255 / 95%);
      border-radius: 50%;
      box-shadow: inset 0 0 0 5px #ffffff;
      background: rgb(255 255 255 / 22%);
    }
    .status-line {
      width: 0;
      height: 48px;
      margin: 6px 0;
      border-left: 2px dashed rgb(255 255 255 / 48%);
    }
    .status-dot.pending {
      border-color: rgb(255 255 255 / 48%);
      box-shadow: none;
      background: transparent;
    }
    .status-content { min-width: 0; }
    #startup-status { margin: 0; font-size: 16px; font-weight: 620; line-height: 1.45; }
    #startup-detail { min-height: 20px; margin: 5px 0 0; color: rgb(255 255 255 / 70%); font-size: 13px; line-height: 1.5; }
    .progress-wrap {
      position: relative;
      height: 4px;
      margin-top: 13px;
      overflow: hidden;
      border-radius: 999px;
      background: rgb(255 255 255 / 18%);
    }
    .progress {
      display: block;
      width: 100%;
      height: 4px;
      overflow: hidden;
      border: 0;
      border-radius: 999px;
      appearance: none;
      background: transparent;
    }
    .progress::-webkit-progress-bar { border-radius: inherit; background: transparent; }
    .progress::-webkit-progress-value {
      border-radius: inherit;
      background: #ffffff;
      transition: width 280ms ease-out;
    }
    .progress-effects {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      overflow: hidden;
      border-radius: inherit;
      transition: width 280ms ease-out;
      pointer-events: none;
    }
    .progress-pulse {
      position: absolute;
      top: 0;
      bottom: 0;
      left: -28%;
      width: 28%;
      border-radius: inherit;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgb(100 169 255 / 18%) 18%,
        #64a9ff 42%,
        #ffffff 58%,
        rgb(142 197 255 / 42%) 76%,
        transparent 100%
      );
      box-shadow: 0 0 10px rgb(112 181 255 / 62%);
      animation: progress-sweep 1.25s linear infinite;
    }
    @keyframes progress-sweep {
      from { left: -28%; }
      to { left: 100%; }
    }
    .next-step { margin-top: 25px; color: rgb(255 255 255 / 48%); }
    .next-step strong { display: block; font-size: 14px; font-weight: 560; line-height: 1.45; }
    .next-step span { display: block; margin-top: 4px; font-size: 12px; line-height: 1.5; }
    @media (prefers-reduced-motion: reduce) {
      .progress::-webkit-progress-value { transition: none; }
      .progress-effects { transition: none; }
    }
    footer { display: flex; justify-content: space-between; padding: 0 32px; color: #8b98ad; font-size: 12px; }
    @media (max-width: 980px) {
      .shell { width: min(860px, calc(100% - 48px)); }
      .hero { grid-template-columns: 1fr; gap: 28px; padding: 20px 16px; }
      .left { text-align: center; }
      .eyebrow { justify-content: center; margin-bottom: 18px; }
      .subtitle { margin-right: auto; margin-left: auto; }
      .feature-row { margin-top: 24px; }
      .product-card { min-height: 250px; padding: 30px 34px; text-align: left; }
      .product-card h2 { margin-top: 34px; }
      .status-panel { right: 34px; bottom: 28px; left: 34px; }
    }
  </style>
</head>
<body>
  ${frameless ? createWindowControlsMarkup() : ''}
  <div class="shell">
    <header class="brand"><img src="${iconDataUrl}" alt=""><span>deepseek</span></header>
    <main class="hero">
      <section class="left">
        <p class="eyebrow"><img src="${iconDataUrl}" alt="">DeepSeek Harness 社区桌面版</p>
        <h1>探索未至之境</h1>
        <p class="subtitle">在原生 Windows 窗口中使用 DeepSeek Harness。应用正在准备本地运行环境，完成后将直接进入主窗口。</p>
        <div class="feature-row">
          <div class="feature"><strong>本地桌面体验</strong><span>内置 DeepSeek Harness 服务<br>无需手动启动网页版</span></div>
          <div class="feature"><strong>即开即用</strong><span>工作区、模型与会话能力<br>准备完成后自动进入</span></div>
        </div>
      </section>
      <section class="product-card" aria-live="polite">
        <div class="product-mark"><img src="${iconDataUrl}" alt=""><span>DEEPSEEK HARNESS</span></div>
        <h2>DSH</h2>
        <p class="edition">共赴智能新境</p>
        <div class="status-panel">
          <div class="status-rail" aria-hidden="true">
            <span class="status-dot"></span>
            <span class="status-line"></span>
            <span class="status-dot pending"></span>
          </div>
          <div class="status-content">
            <p id="startup-status">${startupStatus}</p>
            <p id="startup-detail">${startupDetail}</p>
            <div class="progress-wrap">
              <progress id="startup-progress" class="progress" max="100" value="${startupProgress}" aria-label="启动进度"></progress>
              <span id="startup-progress-effects" class="progress-effects" style="width: ${startupProgress}%" aria-hidden="true">
                <span class="progress-pulse"></span>
              </span>
            </div>
            <div class="next-step"><strong>初始化应用运行环境</strong><span>正在加载服务与资源</span></div>
          </div>
        </div>
      </section>
    </main>
    <footer><span>社区维护的非官方桌面版本</span><span>v${version}</span></footer>
  </div>
</body>
</html>`
}
