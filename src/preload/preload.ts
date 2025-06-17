import {contextBridge, ipcRenderer} from 'electron'
import {CatanaAPI} from './catana-api'
import {SaveFile} from '@/main/nodegraph-file-schema'

contextBridge.exposeInMainWorld('catanaAPI', {
  openNodeGraph: (mode: 'last' | 'pick') => ipcRenderer.invoke('open-node-graph', mode) as ReturnType<CatanaAPI['openNodeGraph']>,
  saveNodeGraph: (content: typeof SaveFile.infer) => ipcRenderer.invoke('save-node-graph', content) as ReturnType<CatanaAPI['saveNodeGraph']>,
  loadTanaExport: () => ipcRenderer.invoke('load-tana-export') as ReturnType<CatanaAPI['loadTanaExport']>,
} satisfies CatanaAPI)
