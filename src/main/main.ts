import {app, BrowserWindow, dialog} from 'electron'
import path from 'node:path'
import started from 'electron-squirrel-startup'
import {settings} from './settings'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

async function loadDefaultWorkspacePath(): Promise<string | null> {
  const lastWorkspacePath = settings.get('last-workspace')
  if (lastWorkspacePath) {
    console.log('Automatically loading last used workspace')
    return lastWorkspacePath
  }
  console.log('First app start, asking for workspace to use')
  const openDirectoryResult = await dialog.showOpenDialog({
    title: 'Open Workspace',
    buttonLabel: 'Open Folder as Workspace',
    properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
  })
  console.log(openDirectoryResult)
  if (openDirectoryResult.canceled) {
    return null
  }
  const workspacePath = openDirectoryResult.filePaths[0]
  settings.set('last-workspace', workspacePath)
  return workspacePath
}

const createWindow = async () => {
  const workspacePath = await loadDefaultWorkspacePath()
  console.log('Opening workspace', workspacePath)
  if (!workspacePath) {
    app.quit()
    return
  }

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
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    void mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
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
