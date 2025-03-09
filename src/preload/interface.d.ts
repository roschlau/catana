import {Node} from '../common/ipc-model'

export interface NodesAPI {
  openNode: (mode: 'openDirectory' | 'openFile') => Promise<Node | null>,
}

declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    nodesAPI: NodesAPI
  }
}
