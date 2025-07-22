import React, { useState } from 'react';
import { Database, X, AlertCircle, ArrowRight, Loader } from 'lucide-react';
import { useMigrationDetection } from '../../hooks/domain/useMigrationDetection';

/**
 * Smart migration banner dat automatisch verschijnt wanneer localStorage data wordt gedetecteerd
 * Biedt een intuïtieve manier om de migration wizard te openen
 */
const MigrationBanner = ({ onStartMigration, className = '' }) => {
  const [dismissed, setDismissed] = useState(false);
  const {
    migrationNeeded,
    localDataStats,
    isChecking,
    getMigrationPriority,
    getMigrationMessage
  } = useMigrationDetection();

  // Don't show banner if dismissed, no migration needed, or still checking
  if (dismissed || !migrationNeeded || isChecking) {
    return null;
  }

  const priority = getMigrationPriority();
  const message = getMigrationMessage();

  // Priority-based styling
  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return {
          containerClass: 'bg-danger-50 border-danger-200 dark:bg-danger-900/20 dark:border-danger-800',
          iconClass: 'text-danger-600 dark:text-danger-400',
          textClass: 'text-danger-800 dark:text-danger-200',
          buttonClass: 'btn-danger'
        };
      case 'medium':
        return {
          containerClass: 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800',
          iconClass: 'text-primary-600 dark:text-primary-400',
          textClass: 'text-primary-800 dark:text-primary-200',
          buttonClass: 'btn-primary'
        };
      default:
        return {
          containerClass: 'bg-secondary-50 border-secondary-200 dark:bg-secondary-800/50 dark:border-secondary-700',
          iconClass: 'text-secondary-600 dark:text-secondary-400',
          textClass: 'text-secondary-800 dark:text-secondary-200',
          buttonClass: 'btn-secondary'
        };
    }
  };

  const styles = getPriorityStyles();

  const handleStartMigration = () => {
    setDismissed(true); // Auto-dismiss when starting migration
    onStartMigration?.();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className={`animate-slide-in ${className}`}>
      <div className={`border rounded-xl p-4 shadow-soft transition-smooth ${styles.containerClass}`}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 ${styles.iconClass}`}>
            {priority === 'high' ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <Database className="w-6 h-6" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`font-medium text-sm mb-1 ${styles.textClass}`}>
                  {priority === 'high' 
                    ? 'Veel lokale data gevonden!' 
                    : 'Lokale data beschikbaar voor migratie'
                  }
                </h3>
                <p className={`text-xs leading-relaxed ${styles.textClass.replace('800', '700').replace('200', '300')}`}>
                  {message}
                </p>
                
                {/* Data stats preview */}
                {localDataStats && (
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    {localDataStats.templates > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                        {localDataStats.templates} templates
                      </span>
                    )}
                    {localDataStats.workflows > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                        {localDataStats.workflows} workflows
                      </span>
                    )}
                    {localDataStats.snippets > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-secondary-500 rounded-full"></span>
                        {localDataStats.snippets} snippets
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={handleStartMigration}
                  className={`${styles.buttonClass} btn-sm focus-visible flex items-center gap-1 animate-pulse-soft`}
                >
                  <span>Migreer Nu</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={handleDismiss}
                  className="btn-ghost btn-sm focus-visible p-1"
                  title="Verbergen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicator for high priority */}
        {priority === 'high' && (
          <div className="mt-3 pt-3 border-t border-current border-opacity-20">
            <div className="flex items-center justify-between text-xs">
              <span className={styles.textClass.replace('800', '600').replace('200', '400')}>
                Aanbevolen: Migreer deze data om ruimte vrij te maken en betere prestaties te krijgen
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrationBanner;