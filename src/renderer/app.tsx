import {createRoot} from 'react-dom/client'

const root = createRoot(document.body)
root.render(<App/>)

function App() {
  return <h1>Hello from React!</h1>
}
