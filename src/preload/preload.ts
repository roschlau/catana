import {contextBridge, ipcRenderer} from 'electron'
import {CatanaAPI} from './interface'
import {Id, NodeGraphFlattened} from '@/common/nodes'

contextBridge.exposeInMainWorld('catanaAPI', {
  loadTanaExport: () => ipcRenderer.invoke('load-tana-export') as Promise<{ rootId: Id<'node'>, nodes: NodeGraphFlattened } | null>,
} satisfies CatanaAPI)
