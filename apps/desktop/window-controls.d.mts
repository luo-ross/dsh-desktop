export const WINDOW_CONTROLS_CSS: string
export function createWindowControlsMarkup(): string
export function applyWindowControl(window: {
  close(): void
  isDestroyed(): boolean
  isMaximized(): boolean
  maximize(): void
  minimize(): void
  unmaximize(): void
}, action: string): { maximized: boolean }
