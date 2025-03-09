import {contextBridge, ipcRenderer} from 'electron'
import {Node} from '../common/ipc-model'
import {NodesAPI} from './interface'

contextBridge.exposeInMainWorld('nodesAPI', {
  openNode: () => ipcRenderer.invoke('open-node') as Promise<Node>,
} satisfies NodesAPI)
