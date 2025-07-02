import {BrowserWindow} from 'electron'
import {type} from 'arktype'
import {settings} from '@/main/settings'

const WindowPositionData = type({
  x: 'number',
  y: 'number',
  height: 'number',
  width: 'number',
  maximized: 'boolean',
  fullscreen: 'boolean',
})

type WindowPositionData = typeof WindowPositionData.infer

export function getLastWindowPosition(): WindowPositionData | null {
  const last = settings.get('last-window-position')
  return last ? JSON.parse(last) : null
}

export function applyWindowPosition(window: BrowserWindow, position: WindowPositionData) {
  // Applying bounds first, regardless of maximized/fullscreen state, ensures that the window will return to the
  //  previous bounds after maximizing, closing the app, opening it again and then un-maximizing.
  window.setBounds(position)
  if (position.maximized) {
    window.maximize()
  }
  if (position.fullscreen) {
    window.setFullScreen(true)
  }
}

export function startStoringWindowPosition(window: BrowserWindow) {
  const windowChangedHandler = () => {
    saveWindowPosition(window)
  }
  window.on('resize', windowChangedHandler)
  window.on('move', windowChangedHandler)
}

function saveWindowPosition(window: BrowserWindow) {
  if (window.isMinimized()) {
    // We don't want to memoize the window being minimized
    return
  }
  const position: WindowPositionData = {
    ...(window.isMaximized()
      // Keep the previously saved bounds if they exist so that un-maximizing works across app restarts
      ? getLastWindowPosition() ?? window.getBounds()
      : window.getBounds()),
    maximized: window.isMaximized(),
    fullscreen: window.isFullScreen(),
  }
  settings.set('last-window-position', JSON.stringify(position))
}
