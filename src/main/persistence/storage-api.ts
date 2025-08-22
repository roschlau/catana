import {settings} from '@/main/settings'
import {readOrCreateFile} from '@/main/utils/file-system'
import {gitCommitWorkspace, gitInitializeWorkspace} from '@/main/utils/git'
import {emptySaveFile, loadSaveFile, SaveFile} from '@/main/persistence/schema/workspace-file-schema'
import {CatanaAPI} from '@/preload/catana-api'
import {type} from 'arktype'
import {dialog} from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import chokidar, {FSWatcher} from 'chokidar'

export const workspaceFileName = '.catana'

/** Stores the location of the node graph that is currently opened. */
let openedGraphDirectory: string | null = null

let isSaving = false
let fileWatcher: FSWatcher | null = null

export function registerStorageApi(ipcMain: Electron.IpcMain) {
  ipcMain.handle('open-workspace', async (
    _event,
    mode: 'last' | 'pick',
  ): ReturnType<CatanaAPI['openWorkspace']> => {
    let directory = openedGraphDirectory ?? settings.get('last-workspace-location')
    if (mode === 'pick' || !directory) {
      directory = await promptForWorkspaceDirectory()
      if (!directory) {
        console.warn('User aborted opening node graph')
        return 'user-canceled'
      }
    }

    const filePath = path.join(directory, workspaceFileName)
    console.log('Loading node graph:', filePath)
    const fileContent = await readOrCreateFile(filePath, () => JSON.stringify(emptySaveFile))
    const saveFile = loadSaveFile(fileContent)
    if (saveFile instanceof type.errors) {
      console.error(`Save File ${filePath} could not be loaded: `, saveFile)
      throw Error(saveFile.summary)
    }
    settings.set('last-workspace-location', directory)
    openedGraphDirectory = directory

    await gitInitializeWorkspace(directory)

    fileWatcher?.close()
    fileWatcher = chokidar.watch(filePath)
      .on('change', (event) => {
        if (isSaving) {
          return
        }
        console.log('Node graph file changed', event)
        _event.sender.send('workspace-file-changed-externally')
      })

    return { path: directory, content: saveFile }
  })

  ipcMain.handle('save-workspace', async (
    _event,
    content: typeof SaveFile.infer,
  ): ReturnType<CatanaAPI['saveWorkspace']> => {
    if (!openedGraphDirectory) {
      console.log('No node graph location opened, asking user to pick')
      openedGraphDirectory = await promptForWorkspaceDirectory()
    }
    if (!openedGraphDirectory) {
      console.warn('User aborted saving node graph')
      return
    }
    settings.set('last-workspace-location', openedGraphDirectory)
    const parsedSaveFile = SaveFile(content)
    if (parsedSaveFile instanceof type.errors) {
      console.error(parsedSaveFile)
      throw Error(parsedSaveFile.summary)
    }
    const filePath = path.join(openedGraphDirectory, workspaceFileName)
    console.log('Saving node graph:', filePath)
    isSaving = true
    await fs.promises.writeFile(filePath, JSON.stringify(parsedSaveFile, null, 2), 'utf8')
    isSaving = false

    // Commit the workspace file to git
    try {
      await gitCommitWorkspace(openedGraphDirectory)
    } catch (error) {
      console.error('Failed to commit workspace file to git:', error)
      throw Error('Failed to commit workspace file to git')
    }
  })
}

export async function promptForWorkspaceDirectory(): Promise<string | null> {
  const pickFileResult = await dialog.showOpenDialog({
    title: 'Select Workspace Folder',
    defaultPath: settings.get('last-workspace-location') ?? undefined,
    buttonLabel: 'Open Folder',
    properties: ['openDirectory', 'createDirectory'],
  })
  if (pickFileResult.canceled || pickFileResult.filePaths.length === 0) {
    return null
  }
  return pickFileResult.filePaths[0]
}
