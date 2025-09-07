import {app, BrowserWindow, dialog, ipcMain, session, shell} from 'electron'
import path from 'node:path'
import started from 'electron-squirrel-startup'
import installExtension, {REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS} from 'electron-devtools-installer'
import fs from 'node:fs'
import {loadTanaExport} from '@/common/conversion/tanaImport'
import {CatanaAPI} from '@/preload/catana-api'
import {registerStorageApi} from '@/main/persistence/storage-api'
import * as os from 'node:os'
import {applyWindowPosition, getLastWindowPosition, startStoringWindowPosition} from '@/main/window-management'
import {updateElectronApp} from 'update-electron-app'

export const environment = MAIN_WINDOW_VITE_DEV_SERVER_URL ? 'dev' : 'prod'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
} else {
  updateElectronApp()
  if (environment === 'dev') {
    app.whenReady().then(() => {
      installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
        .then(([redux, react]) => console.log(`Added Extensions:  ${redux.name}, ${react.name}`))
        .catch((err) => console.log('An error occurred: ', err))
    })
  }
  app.whenReady().then(createWindow)

  app.on('window-all-closed', () => {
    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow()
    }
  })
}

async function createWindow() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [`default-src 'self'; style-src 'self' 'unsafe-inline' file:`],
      },
    })
  })

  const lastWindowPosition = getLastWindowPosition()
  const mainWindow = new BrowserWindow({
    title: 'Catana',
    icon: `src/renderer/assets/app-icon/${environment === 'dev' ? 'dev_' : ''}catana.png`,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      enableBlinkFeatures: 'SmoothScrolling',
    },
  })
  mainWindow.setMenu(null)
  if (lastWindowPosition) {
    applyWindowPosition(mainWindow, lastWindowPosition)
  }
  startStoringWindowPosition(mainWindow)

  const platform = os.platform()
  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + `?os=${platform}`)
  } else {
    await mainWindow.loadURL('file://' + path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`) + `?os=${platform}`)
  }

  registerStorageApi(ipcMain)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  ipcMain.handle('load-tana-export', async (): ReturnType<CatanaAPI['loadTanaExport']> => {
    const openNodeResult = await dialog.showOpenDialog({
      title: 'Select Tana Export',
      buttonLabel: 'Load Export',
      properties: ['openFile'],
      filters: [
        { name: 'Tana Export', extensions: ['json'] },
      ],
    })
    if (openNodeResult.canceled || openNodeResult.filePaths.length === 0) {
      return null
    }
    const nodePath = openNodeResult.filePaths[0]
    const fileContent = fs.readFileSync(nodePath, 'utf8')
    return loadTanaExport(fileContent)
  })

  if (environment === 'dev') {
    // Open the DevTools.
    mainWindow.webContents.openDevTools()
  }
}
