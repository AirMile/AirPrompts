import React from 'react';
import { Tag } from 'lucide-react';
import { extractAllVariables } from '../../types/template.types.js';
import { useItemColors } from '../../hooks/useItemColors.js';

/**
 * Custom fields specific to the Template editor
 * Shows preview and detected variables
 */
export const TemplateCustomFields = ({ formData }) => {
  const { getColorClasses } = useItemColors();
  const { variables, snippetVariables } = extractAllVariables(formData.content || '');

  return (
    <div className="space-y-4">
      {/* Template Preview */}
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">Preview</h3>
        <div className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-4 border border-secondary-300 dark:border-secondary-600">
          <div className="prose prose-sm max-w-none text-secondary-900 dark:text-secondary-100">
            {(formData.content || '').split(/(\{[^}]+\})/).map((part, index) => (
              <span key={index}>
                {part.match(/\{[^}]+\}/) ? (
                  <span 
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      part.includes('insert:') 
                        ? getColorClasses('snippet', 'tag')
                        : getColorClasses('template', 'tag')
                    }`}
                  >
                    {part}
                  </span>
                ) : (
                  part
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Variables Found */}
      {variables.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
            Variables Found ({variables.length})
          </h3>
          <div className="space-y-2">
            {variables.map((variable, index) => (
              <div key={index} className={`flex items-center gap-2 p-2 rounded-lg ${getColorClasses('template', 'background')}`}>
                <Tag className={`w-4 h-4 ${getColorClasses('template', 'icon')}`} />
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">{variable}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snippet Variables Found */}
      {snippetVariables.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
            Insert Variables Found ({snippetVariables.length})
          </h3>
          <div className="space-y-2">
            {snippetVariables.map((snippetVar, index) => (
              <div key={index} className={`flex items-center gap-2 p-2 rounded-lg ${getColorClasses('snippet', 'background')}`}>
                <Tag className={`w-4 h-4 ${getColorClasses('snippet', 'icon')}`} />
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {snippetVar.placeholder} → tag: "{snippetVar.tag}"
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateCustomFields;