import {contextBridge, ipcRenderer} from 'electron'
import {NodeGraphFlattened} from '../common/nodeGraphModel'
import {CatanaAPI} from './interface'

contextBridge.exposeInMainWorld('catanaAPI', {
  loadTanaExport: () => ipcRenderer.invoke('load-tana-export') as Promise<{ rootId: string, nodes: NodeGraphFlattened } | null>,
} satisfies CatanaAPI)
