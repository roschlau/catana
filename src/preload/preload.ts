import {contextBridge, ipcRenderer} from 'electron'
import {CatanaAPI} from './interface'
import {DocGraphFlattened, Id} from '@/common/docs'

contextBridge.exposeInMainWorld('catanaAPI', {
  loadTanaExport: () => ipcRenderer.invoke('load-tana-export') as Promise<{ rootId: Id<'node'>, nodes: DocGraphFlattened } | null>,
} satisfies CatanaAPI)
