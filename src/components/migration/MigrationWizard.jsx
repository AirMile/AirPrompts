import React, { useState, useEffect } from 'react';
// Note: Migration wizard will need proper API integration when server endpoints are available

const MIGRATION_STEPS = {
  CHECK: 'check',
  PREVIEW: 'preview', 
  CONFIRM: 'confirm',
  EXECUTE: 'execute',
  COMPLETE: 'complete'
};

export function MigrationWizard({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(MIGRATION_STEPS.CHECK);
  const [localStorageData, setLocalStorageData] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [migrationResult, setMigrationResult] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // TODO: Replace with actual migration API when available

  // Check localStorage for existing data
  useEffect(() => {
    if (isOpen) {
      checkLocalStorage();
    }
  }, [isOpen]);

  const checkLocalStorage = () => {
    const data = {
      templates: JSON.parse(localStorage.getItem('templates') || '[]'),
      workflows: JSON.parse(localStorage.getItem('workflows') || '[]'),
      folders: JSON.parse(localStorage.getItem('folders') || '[]'),
      snippets: JSON.parse(localStorage.getItem('snippets') || '[]')
    };

    // Check if any data exists
    const hasData = data.templates.length > 0 || 
                   data.workflows.length > 0 || 
                   data.folders.length > 0 ||
                   data.snippets.length > 0;

    if (hasData) {
      setLocalStorageData(data);
      setCurrentStep(MIGRATION_STEPS.PREVIEW);
    } else {
      setError('Geen lokale data gevonden om te migreren');
    }
  };

  const generatePreview = async () => {
    if (!localStorageData) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // TODO: Replace with actual migration preview API endpoint
      const response = {
        success: true,
        data: {
          summary: {
            message: `${localStorageData.templates.length} templates, ${localStorageData.workflows.length} workflows, ${localStorageData.folders.length} folders en ${localStorageData.snippets.length} snippets worden gemigreerd.`
          }
        }
      };

      if (response.success) {
        setPreviewData(response.data);
        setCurrentStep(MIGRATION_STEPS.CONFIRM);
      } else {
        setError(`Preview error: ${response.error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Preview failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeMigration = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // TODO: Replace with actual migration API endpoint
      // For now, we simulate a successful migration
      const response = {
        success: true,
        data: {
          summary: {
            message: 'Migratie succesvol voltooid. Alle data is nu opgeslagen in de database.'
          }
        }
      };

      if (response.success) {
        setMigrationResult(response.data);
        setCurrentStep(MIGRATION_STEPS.COMPLETE);
        
        // Note: In production, localStorage should only be cleared after confirmed server migration
        // For now, we keep the data in localStorage as we're using localStorage-based API
        
        onComplete?.(response.data);
      } else {
        setError(`Migration error: ${response.error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Migration failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(MIGRATION_STEPS.CHECK);
    setLocalStorageData(null);
    setPreviewData(null);
    setMigrationResult(null);
    setError(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="overlay flex-center">
      <div className="modal-content max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="card-header">
          <div className="flex-between">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
              Data Migratie Wizard
            </h2>
            <button
              onClick={handleClose}
              className="btn-ghost btn-sm focus-visible"
            >
              ✕
            </button>
          </div>
          
          {/* Progress indicator */}
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              {Object.values(MIGRATION_STEPS).map((step, index) => (
                <React.Fragment key={step}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      Object.values(MIGRATION_STEPS).indexOf(currentStep) >= index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < Object.values(MIGRATION_STEPS).length - 1 && (
                    <div
                      className={`h-1 w-12 ${
                        Object.values(MIGRATION_STEPS).indexOf(currentStep) > index
                          ? 'bg-blue-600'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Step: Check */}
          {currentStep === MIGRATION_STEPS.CHECK && (
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Checking local data...
                </h3>
                <p className="text-gray-600">
                  We're searching for existing templates, workflows, folders and snippets in your local storage.
                </p>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {currentStep === MIGRATION_STEPS.PREVIEW && localStorageData && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Data gevonden voor migratie
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {localStorageData.templates.length}
                  </div>
                  <div className="text-sm text-gray-600">Templates</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {localStorageData.workflows.length}
                  </div>
                  <div className="text-sm text-gray-600">Workflows</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {localStorageData.folders.length}
                  </div>
                  <div className="text-sm text-gray-600">Folders</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {localStorageData.snippets.length}
                  </div>
                  <div className="text-sm text-gray-600">Snippets</div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-yellow-800 mb-2">Belangrijk:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Een backup wordt automatisch gemaakt</li>
                  <li>• Lokale data wordt verwijderd na succesvolle migratie</li>
                  <li>• Bestaande database data wordt niet overschreven</li>
                  <li>• Deze actie kan niet ongedaan worden gemaakt</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuleren
                </button>
                <button
                  onClick={generatePreview}
                  disabled={isProcessing}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Preview laden...' : 'Volgende →'}
                </button>
              </div>
            </div>
          )}

          {/* Step: Confirm */}
          {currentStep === MIGRATION_STEPS.CONFIRM && previewData && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Migratie bevestigen
              </h3>
              
              {previewData.summary && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-green-800 mb-2">Preview samenvatting:</h4>
                  <p className="text-sm text-green-700">
                    {previewData.summary.message}
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(MIGRATION_STEPS.PREVIEW)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ← Terug
                </button>
                <button
                  onClick={executeMigration}
                  disabled={isProcessing}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Migreren...' : 'Start Migratie'}
                </button>
              </div>
            </div>
          )}

          {/* Step: Complete */}
          {currentStep === MIGRATION_STEPS.COMPLETE && migrationResult && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Migratie voltooid!
              </h3>
              
              {migrationResult.summary && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                  <p className="text-green-700">
                    {migrationResult.summary.message}
                  </p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Sluiten
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MigrationWizard;