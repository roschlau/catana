import {app, BrowserWindow, dialog, ipcMain} from 'electron'
import path from 'node:path'
import started from 'electron-squirrel-startup'
import {settings} from './settings'
import {loadNode} from './filesystem'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

async function loadLastNodePath(): Promise<string | null> {
  const lastWorkspacePath = settings.get('last-node')
  if (lastWorkspacePath) {
    console.log('Automatically opening last used node')
    return lastWorkspacePath
  }
  console.log('First app start, asking for node to open')
  const openNodeResult = await dialog.showOpenDialog({
    title: 'Open Node',
    buttonLabel: 'Open Node',
    properties: ['openDirectory', 'openFile', 'showHiddenFiles', 'createDirectory', 'promptToCreate'],
  })
  console.log(openNodeResult)
  if (openNodeResult.canceled) {
    return null
  }
  const nodePath = openNodeResult.filePaths[0]
  settings.set('last-node', nodePath)
  return nodePath
}

const createWindow = async () => {
  ipcMain.handle('open-node', async () => {
    const nodePath = await loadLastNodePath()
    console.log('Opening Node', nodePath)
    if (!nodePath) {
      app.quit()
      return
    }
    return loadNode(nodePath)
  })


  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    await mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
