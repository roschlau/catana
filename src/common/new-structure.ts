
type Node =
  | FileSystemNode
  | InlineNode

type FileSystemNode =
  | CatanaFile
  | File
  | Directory

interface NodeMeta {
  tags: string[],
  properties: Record<string, string>,
  expanded: boolean
}

interface File {
  type: 'file'
  filetype: string,
  path: string,
  meta: NodeMeta, // Loaded from sidecar file
}

interface Directory {
  type: 'directory'
  path: string,
  index: CatanaFile,
  nodes: FileSystemNode[],
}

interface CatanaFile {
  type: 'file'
  filetype: 'catana',
  path: string,
  meta: NodeMeta,
  nodes: InlineNode[]
}

type InlineNode =
  | TextNode

interface TextNode {
  type: 'text'
  content: string
  expanded: boolean
  nodes: InlineNode[]
}
