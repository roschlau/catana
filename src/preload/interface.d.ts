import {DocGraphFlattened, Id} from '@/common/docs'

export interface CatanaAPI {
  loadTanaExport: () => Promise<{ rootId: Id<'node'>, nodes: DocGraphFlattened } | null>,
}

declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    catanaAPI: CatanaAPI
  }
}
