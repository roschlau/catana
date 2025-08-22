import {Id, NodeGraphFlattened} from '@/common/nodes'
import {SaveFile} from '@/main/persistence/schema/workspace-file-schema'

export interface CatanaAPI {
  openWorkspace: (mode: 'last' | 'pick') => Promise<OpenWorkspaceResult | 'user-canceled'>
  saveWorkspace: (content: SaveFile) => Promise<void>
  loadTanaExport: () => Promise<{ rootId: Id<'node'>, nodes: NodeGraphFlattened } | null>
  onWorkspaceFileChangedExternally: (callback: () => void) => () => void
}

export interface OpenWorkspaceResult {
  path: string,
  content: SaveFile,
}

declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    catanaAPI: CatanaAPI
  }
}
