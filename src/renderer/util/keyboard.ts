/**
 * On Apple devices, returns true if Cmd is pressed. On all other devices, returns true for the Ctrl key instead.
 */
export function modKey(e: { metaKey: boolean, ctrlKey: boolean }): boolean {
  return isAppleDevice() ? e.metaKey : e.ctrlKey
}

export function isAppleDevice(): boolean {
  const match = location.search.match(/os=([^&]+)/)
  if (!match) return false
  const os = match[1] as NodeJS.Platform
  return os === 'darwin'
}
