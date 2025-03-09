import {createRoot} from 'react-dom/client'
import {Node} from '../common/ipc-model'

window.nodesAPI.openNode().then(node => {
  console.log('Node opened', node)
  const root = createRoot(document.body)
  root.render(<App node={node}/>)
})

function App({node}: {node: Node}) {
  return (<>
    <h1>{node.title}</h1>
    <h2>Content:</h2>
    <ul>
      {node.content.map(text => <li key={text}>{text}</li>)}
    </ul>
    <h2>Files:</h2>
    <ul>
      {node.fileNodes.map(path => <li key={path}>{path}</li>)}
    </ul>
  </>)
}
