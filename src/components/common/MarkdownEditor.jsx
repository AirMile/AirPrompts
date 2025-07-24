import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

const MarkdownEditor = ({ 
  value, 
  onChange, 
  onSave, 
  onCancel,
  placeholder = "Voeg context en notities toe...",
  isLoading = false,
  showCharCount = true,
  maxLength = 50000
}) => {
  const [activeTab, setActiveTab] = useState('write');

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'write' 
              ? 'bg-white dark:bg-gray-900 border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('write')}
        >
          Bewerken
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'preview' 
              ? 'bg-white dark:bg-gray-900 border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('preview')}
        >
          Voorbeeld
        </button>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        {activeTab === 'write' ? (
          <div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full h-32 sm:h-40 p-2 sm:p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
              rows={8}
            />
            {showCharCount && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
                <span className={value.length > maxLength ? 'text-red-600 dark:text-red-400' : ''}>
                  {value.length.toLocaleString('nl-NL')} / {maxLength.toLocaleString('nl-NL')} tekens
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-32 sm:min-h-40 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            {value ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">Geen inhoud om te tonen</p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 transition-colors"
        >
          Annuleren
        </button>
        <button
          onClick={onSave}
          disabled={isLoading}
          className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>
    </div>
  );
};

export default MarkdownEditor;