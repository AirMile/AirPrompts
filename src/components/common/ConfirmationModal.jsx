import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * Professional confirmation modal to replace browser confirm dialogs
 * Styled consistently with the application design system
 */
const ConfirmationModal = ({
  isOpen,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "warning" // warning, danger, info
}) => {
  if (!isOpen) return null;

  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-danger-600 dark:text-danger-400',
          confirmButton: 'bg-danger-600 hover:bg-danger-700 text-white',
          border: 'border-danger-200 dark:border-danger-700',
          background: 'bg-danger-50 dark:bg-danger-900/20'
        };
      case 'info':
        return {
          icon: 'text-primary-600 dark:text-primary-400',
          confirmButton: 'bg-primary-600 hover:bg-primary-700 text-white',
          border: 'border-primary-200 dark:border-primary-700',
          background: 'bg-primary-50 dark:bg-primary-900/20'
        };
      default: // warning
        return {
          icon: 'text-amber-600 dark:text-amber-400',
          confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white',
          border: 'border-amber-200 dark:border-amber-700',
          background: 'bg-amber-50 dark:bg-amber-900/20'
        };
    }
  };

  const variantClasses = getVariantClasses();

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-6 h-6 ${variantClasses.icon}`} />
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <div className={`p-4 rounded-lg ${variantClasses.background} ${variantClasses.border} border`}>
            <p className="text-secondary-700 dark:text-secondary-300 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-secondary-700 dark:text-secondary-300 border border-secondary-300 dark:border-secondary-600 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-all duration-200"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${variantClasses.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;