import React, { useState } from 'react';
import { X, Palette, Settings as SettingsIcon } from 'lucide-react';
import ThemeSelector from '../ui/ThemeSelector.jsx';

const SettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('appearance');

  if (!isOpen) return null;

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
              <h2 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
                Settings
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
            >
              <X className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex h-[calc(90vh-88px)]">
            {/* Sidebar */}
            <div className="w-64 border-r border-secondary-200 dark:border-secondary-700 p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                        ${activeTab === tab.id 
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' 
                          : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'appearance' && (
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                    Appearance Settings
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                    Customize how AirPrompts looks and feels.
                  </p>
                  
                  <ThemeSelector />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsModal;