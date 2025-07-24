import React from 'react';
import { AlertTriangle, Trash2, Shield } from 'lucide-react';
import { useUserPreferences } from '../../hooks/domain/useUserPreferences';

const ConfirmActionsSettings = () => {
  const { confirmActions, updateConfirmActions } = useUserPreferences();

  const handleToggle = (actionType) => {
    updateConfirmActions({
      ...confirmActions,
      [actionType]: !confirmActions[actionType]
    });
  };

  const confirmationOptions = [
    {
      key: 'deleteFolder',
      label: 'Mappen verwijderen',
      description: 'Vraag bevestiging voordat een map wordt verwijderd',
      icon: Trash2,
      color: 'text-red-500'
    },
    {
      key: 'deleteTemplate',
      label: 'Templates verwijderen',
      description: 'Vraag bevestiging voordat een template wordt verwijderd',
      icon: Trash2,
      color: 'text-red-500'
    },
    {
      key: 'deleteWorkflow',
      label: 'Workflows verwijderen',
      description: 'Vraag bevestiging voordat een workflow wordt verwijderd',
      icon: Trash2,
      color: 'text-red-500'
    },
    {
      key: 'deleteSnippet',
      label: 'Snippets verwijderen',
      description: 'Vraag bevestiging voordat een snippet wordt verwijderd',
      icon: Trash2,
      color: 'text-red-500'
    },
    {
      key: 'deleteTodo',
      label: "Todo's verwijderen",
      description: "Vraag bevestiging voordat een todo wordt verwijderd",
      icon: Trash2,
      color: 'text-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            Bevestiging acties
          </h2>
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
            Configureer wanneer je een bevestiging wilt zien voor belangrijke acties
          </p>
        </div>
      </div>

      {/* Warning notice */}
      <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-orange-800 dark:text-orange-200">
            Let op
          </p>
          <p className="text-orange-700 dark:text-orange-300 mt-1">
            Als je bevestigingen uitschakelt, worden acties direct uitgevoerd zonder waarschuwing. 
            Dit kan niet ongedaan worden gemaakt.
          </p>
        </div>
      </div>

      {/* Confirmation options */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
          Verwijderacties
        </h3>
        
        <div className="space-y-3">
          {confirmationOptions.map((option) => {
            const Icon = option.icon;
            const isEnabled = confirmActions[option.key];
            
            return (
              <div
                key={option.key}
                className="flex items-center justify-between p-4 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-750 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 ${option.color} flex-shrink-0 mt-0.5`} />
                  <div>
                    <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
                      {option.label}
                    </h4>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => handleToggle(option.key)}
                    className="sr-only peer"
                  />
                  <div className={`
                    relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out
                    ${isEnabled 
                      ? 'bg-primary-600 dark:bg-primary-500' 
                      : 'bg-secondary-300 dark:bg-secondary-600'
                    }
                    peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800
                  `}>
                    <div className={`
                      absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-transform duration-200 ease-in-out
                      ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                    `} />
                  </div>
                  <span className="ml-3 text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {isEnabled ? 'Aan' : 'Uit'}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional info */}
      <div className="mt-8 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
        <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
          Over bevestigingen
        </h4>
        <ul className="text-sm text-secondary-600 dark:text-secondary-400 space-y-1">
          <li>• Bevestigingen helpen ongewenste acties te voorkomen</li>
          <li>• Je kunt deze instellingen altijd weer wijzigen</li>
          <li>• Voor mappen met submappen wordt altijd een extra waarschuwing getoond</li>
        </ul>
      </div>
    </div>
  );
};

export default ConfirmActionsSettings;