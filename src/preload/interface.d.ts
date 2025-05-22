import {NodeGraphFlattened} from '../common/nodeGraphModel'

export interface CatanaAPI {
  loadTanaExport: () => Promise<{ rootId: string, nodes: NodeGraphFlattened } | null>,
}

declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    catanaAPI: CatanaAPI
  }
}
