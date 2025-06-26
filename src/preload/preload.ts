import {contextBridge, ipcRenderer} from 'electron'
import {CatanaAPI} from './catana-api'
import {SaveFile} from '@/main/workspace-file-schema'

contextBridge.exposeInMainWorld('catanaAPI', {
  openWorkspace: (mode: 'last' | 'pick') => ipcRenderer.invoke('open-workspace', mode) as ReturnType<CatanaAPI['openWorkspace']>,
  saveWorkspace: (content: typeof SaveFile.infer) => ipcRenderer.invoke('save-workspace', content) as ReturnType<CatanaAPI['saveWorkspace']>,
  loadTanaExport: () => ipcRenderer.invoke('load-tana-export') as ReturnType<CatanaAPI['loadTanaExport']>,
} satisfies CatanaAPI)
