import {app, BrowserWindow, dialog, ipcMain} from 'electron'
import path from 'node:path'
import started from 'electron-squirrel-startup'
import installExtension, {REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS} from 'electron-devtools-installer'
import fs from 'node:fs'
import {loadTanaExport} from './tanaImport'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

app.whenReady().then(() => {
  installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
    .then(([redux, react]) => console.log(`Added Extensions:  ${redux.name}, ${react.name}`))
    .catch((err) => console.log('An error occurred: ', err));
});

const createWindow = async () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1800,
    height: 1000,
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

  ipcMain.handle('load-tana-export', async () => {
    const openNodeResult = await dialog.showOpenDialog({
      title: 'Select Tana Export',
      buttonLabel: 'Load Export',
      properties: ['openFile'],
      filters: [
        { name: 'Tana Export', extensions: ['json'] },
      ]
    })
    if (openNodeResult.canceled || openNodeResult.filePaths.length === 0) {
      return null
    }
    const nodePath = openNodeResult.filePaths[0]
    const fileContent = fs.readFileSync(nodePath, 'utf8')
    return loadTanaExport(fileContent)
  })

  mainWindow.maximize()

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
