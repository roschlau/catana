import {Id, NodeGraphFlattened} from '../common/nodeGraphModel'

export interface CatanaAPI {
  loadTanaExport: () => Promise<{ rootId: Id<'node'>, nodes: NodeGraphFlattened } | null>,
}

declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    catanaAPI: CatanaAPI
  }
}
