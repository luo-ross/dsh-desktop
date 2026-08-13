export const WINDOW_CONTROLS_CSS = `
#dsh-window-controls {
  position: fixed;
  z-index: 2147483647;
  top: 0;
  right: 0;
  display: flex;
  height: 38px;
  -webkit-app-region: no-drag;
}

#dsh-window-controls button {
  display: grid;
  width: 46px;
  height: 38px;
  margin: 0;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #34383d;
  font: 10px/1 "Segoe MDL2 Assets", "Segoe Fluent Icons", sans-serif;
  cursor: default;
}

#dsh-window-controls button:hover {
  background: rgb(15 23 42 / 8%);
}

#dsh-window-controls button:focus-visible {
  outline: 2px solid #4f8cff;
  outline-offset: -2px;
}

#dsh-window-controls button[data-window-action="close"]:hover {
  background: #c42b1c;
  color: #ffffff;
}
`

export function createWindowControlsMarkup() {
  return `<div id="dsh-window-controls" aria-label="窗口控件">
    <button type="button" data-window-action="minimize" aria-label="最小化"><span aria-hidden="true">&#xE921;</span></button>
    <button type="button" data-window-action="toggle-maximize" aria-label="最大化"><span aria-hidden="true">&#xE922;</span></button>
    <button type="button" data-window-action="close" aria-label="关闭"><span aria-hidden="true">&#xE8BB;</span></button>
  </div>`
}

export function applyWindowControl(window, action) {
  if (action === 'minimize') window.minimize()
  else if (action === 'toggle-maximize') {
    if (window.isMaximized()) window.unmaximize()
    else window.maximize()
  } else if (action === 'close') window.close()
  else if (action !== 'get-state') throw new Error(`unknown window control action: ${String(action)}`)
  return { maximized: !window.isDestroyed() && window.isMaximized() }
}
