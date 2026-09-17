/** Runtime files that must exist before a packaged backend can be reused or archived. */
export const BACKEND_RUNTIME_PATHS: readonly (readonly string[])[]

/** Build the Electron-owned backend command without opening an external browser. */
export function backendLaunchArguments(entry: string): string[]
