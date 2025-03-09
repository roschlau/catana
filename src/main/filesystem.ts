import * as fs from 'fs'
import * as pathModule from 'path'
import {Node} from '../common/ipc-model'

export function loadNode(path: string): Node {
  if (fs.statSync(path).isDirectory()) {
    return loadDirectoryNode(path)
  }
  return loadFileNode(path)
}

function loadFileNode(path: string): Node {
  return {
    path,
    fileNodes: [],
    ...loadNodeFile(path),
  }
}

function loadDirectoryNode(path: string): Node {
  const nodeFilePath = pathModule.join(path, '.node')
  const nodeFile = loadNodeFile(nodeFilePath)
  const filesInDirectory = fs.readdirSync(path).map(file => pathModule.join(path, file))
  return {
    path,
    fileNodes: filesInDirectory,
    title: path,
    content: [],
    ...nodeFile,
  }
}

function loadNodeFile(path: string): Pick<Node, 'title' | 'content'> | null {
  if (!fs.existsSync(path)) {
    return null
  }
  const fileContent = fs.readFileSync(path, 'utf8')
  const [title, contentText] = fileContent.split(/\r?\n\r?\n/)
  const content = contentText
    .trim()
    .split('\n')
    .map(line => {
      if (!line.startsWith('- ')) {
        throw Error('Invalid content line: ' + line)
      }
      return line.substring(2)
    })
  return { title, content }
}
