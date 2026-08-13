export function createWelcomePage({ iconDataUrl, version }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DSH Desktop</title>
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
      padding-top: 38px;
      background: #f4f8ff;
    }
    body::before {
      content: '';
      position: fixed;
      z-index: 10;
      inset: 0 138px auto 0;
      height: 38px;
      background: #f4f8ff;
      -webkit-app-region: drag;
    }
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
    .product-card h2 { margin: 92px 0 10px; font-size: 34px; font-weight: 520; letter-spacing: -0.02em; }
    .product-card .edition { margin: 0; color: rgb(255 255 255 / 82%); font-size: 21px; }
    .status-panel {
      position: absolute;
      right: 44px;
      bottom: 44px;
      left: 44px;
      padding-top: 21px;
      border-top: 1px solid rgb(255 255 255 / 24%);
    }
    #startup-status { margin: 0; font-size: 15px; font-weight: 560; }
    #startup-detail { min-height: 20px; margin: 8px 0 0; color: rgb(255 255 255 / 66%); font-size: 13px; }
    .progress { height: 3px; margin-top: 18px; overflow: hidden; border-radius: 3px; background: rgb(255 255 255 / 19%); }
    .progress::after {
      content: '';
      display: block;
      width: 38%;
      height: 100%;
      border-radius: inherit;
      background: #ffffff;
      animation: loading 1.65s ease-in-out infinite;
    }
    footer { display: flex; justify-content: space-between; padding: 0 32px; color: #8b98ad; font-size: 12px; }
    @keyframes loading { 0% { transform: translateX(-120%); } 100% { transform: translateX(300%); } }
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
        <h2>DSH Desktop</h2>
        <p class="edition">共赴智能新境</p>
        <div class="status-panel">
          <p id="startup-status">正在准备桌面环境…</p>
          <p id="startup-detail">首次启动可能需要约一分钟。</p>
          <div class="progress" aria-hidden="true"></div>
        </div>
      </section>
    </main>
    <footer><span>社区维护的非官方桌面版本</span><span>v${version}</span></footer>
  </div>
</body>
</html>`
}
