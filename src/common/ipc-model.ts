export interface Node {
  path: NodePath
  title: string
  content: string[]
  fileNodes: NodePath[]
}

type NodePath = string
