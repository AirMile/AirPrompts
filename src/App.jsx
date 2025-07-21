import PromptTemplateSystem from './components/PromptTemplateSystem'
import './App.css'
// Stagewise integration
import { StagewiseToolbar } from '@stagewise/toolbar-react';
import ReactPlugin from '@stagewise-plugins/react';

function App() {
  return (
    <>
      {import.meta.env.DEV && (
        <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
      )}
      <PromptTemplateSystem />
    </>
  )
}

export default App
