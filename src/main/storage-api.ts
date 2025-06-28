import {settings} from '@/main/settings'
import {readOrCreateFile} from '@/main/utils/file-system'
import {gitCommitWorkspace, gitInitializeWorkspace} from '@/main/utils/git'
import {emptySaveFile, SaveFile} from '@/main/workspace-file-schema'
import {CatanaAPI} from '@/preload/catana-api'
import {type} from 'arktype'
import {dialog} from 'electron'
import fs from 'node:fs'
import path from 'node:path'

export const workspaceFileName = '.catana'

/** Stores the location of the node graph that is currently opened. */
let openedGraphDirectory: string | null = null

export function registerStorageApi(ipcMain: Electron.IpcMain) {
  ipcMain.handle('open-workspace', async (
    _event,
    mode: 'last' | 'pick',
  ): ReturnType<CatanaAPI['openWorkspace']> => {
    let directory = openedGraphDirectory ?? settings.get('last-graph-location')
    if (mode === 'pick' || !directory) {
      directory = await promptForGraphDirectory()
      if (!directory) {
        console.warn('User aborted opening node graph')
        return null
      }
    }

    const filePath = path.join(directory, workspaceFileName)
    console.log('Loading node graph:', filePath)
    const fileContent = await readOrCreateFile(filePath, () => JSON.stringify(emptySaveFile))
    const saveFile = SaveFile(JSON.parse(fileContent))
    if (saveFile instanceof type.errors) {
      console.error(`Save File ${filePath} could not be loaded: `, saveFile)
      throw Error(saveFile.summary)
    }
    settings.set('last-graph-location', directory)
    openedGraphDirectory = directory

    await gitInitializeWorkspace(directory)

    return { path: directory, content: saveFile }
  })

  ipcMain.handle('save-workspace', async (
    _event,
    content: typeof SaveFile.infer,
  ): ReturnType<CatanaAPI['saveWorkspace']> => {
    if (!openedGraphDirectory) {
      console.log('No node graph location opened, asking user to pick')
      openedGraphDirectory = await promptForGraphDirectory()
    }
    if (!openedGraphDirectory) {
      console.warn('User aborted saving node graph')
      return
    }
    settings.set('last-graph-location', openedGraphDirectory)
    const parsedSaveFile = SaveFile(content)
    if (parsedSaveFile instanceof type.errors) {
      throw Error(parsedSaveFile.summary)
    }
    const filePath = path.join(openedGraphDirectory, workspaceFileName)
    console.log('Saving node graph:', filePath)
    await fs.promises.writeFile(filePath, JSON.stringify(parsedSaveFile, null, 2), 'utf8')

    // Commit the workspace file to git
    try {
      await gitCommitWorkspace(openedGraphDirectory)
    } catch (error) {
      console.error('Failed to commit workspace file to git:', error)
      throw Error('Failed to commit workspace file to git')
    }
  })
}

export async function promptForGraphDirectory(): Promise<string | null> {
  const pickFileResult = await dialog.showOpenDialog({
    title: 'Open Node Graph',
    defaultPath: settings.get('last-graph-location') ?? undefined,
    buttonLabel: 'Open Node Graph',
    properties: ['openDirectory'],
  })
  if (pickFileResult.canceled || pickFileResult.filePaths.length === 0) {
    return null
  }
  return pickFileResult.filePaths[0]
}
