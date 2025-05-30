import {contextBridge, ipcRenderer} from 'electron'
import {Id, NodeGraphFlattened} from '@/common/nodeGraphModel'
import {CatanaAPI} from './interface'

contextBridge.exposeInMainWorld('catanaAPI', {
  loadTanaExport: () => ipcRenderer.invoke('load-tana-export') as Promise<{ rootId: Id<'node'>, nodes: NodeGraphFlattened } | null>,
} satisfies CatanaAPI)
