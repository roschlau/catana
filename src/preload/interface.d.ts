import {Node} from '../common/ipc-model'

export interface NodesAPI {
  openNode: () => Promise<Node>,
}

declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    nodesAPI: NodesAPI
  }
}
