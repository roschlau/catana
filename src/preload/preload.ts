import {contextBridge, ipcRenderer} from 'electron'
import {Node} from '../common/ipc-model'
import {NodesAPI} from './interface'

contextBridge.exposeInMainWorld('nodesAPI', {
  openNode: (mode: 'openDirectory' | 'openFile') => ipcRenderer.invoke('open-node', mode) as Promise<Node | null>,
} satisfies NodesAPI)
