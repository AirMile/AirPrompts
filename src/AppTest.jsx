import PromptTemplateSystem from './components/PromptTemplateSystem'
import PromptTemplateSystemNew from './components/PromptTemplateSystemNew'
import './App.css'
// Stagewise integration
import { StagewiseToolbar } from '@stagewise/toolbar-react';
import ReactPlugin from '@stagewise-plugins/react';

function AppTest() {
  // Toggle to test new vs old version
  const useNewVersion = true;
  
  return (
    <>
      {import.meta.env.DEV && (
        <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
      )}
      {useNewVersion ? (
        <div>
          <div className="bg-green-500 text-white p-2 text-center">
            Testing NEW State Management (Zustand + TanStack Query)
          </div>
          <PromptTemplateSystemNew />
        </div>
      ) : (
        <div>
          <div className="bg-blue-500 text-white p-2 text-center">
            Using OLD State Management
          </div>
          <PromptTemplateSystem />
        </div>
      )}
    </>
  )
}

export default AppTest