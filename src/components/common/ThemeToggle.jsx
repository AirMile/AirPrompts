import { Sun, Moon } from 'lucide-react';
import themeStore from '../../store/themeStore';

const ThemeToggle = ({ size = 'sm', showLabel = false }) => {
  const { isDarkMode, toggleDarkMode } = themeStore();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  };

  return (
    <button
      onClick={toggleDarkMode}
      className={`${buttonSizeClasses[size]} hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded-md transition-colors flex items-center gap-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100`}
      title={isDarkMode ? 'Schakel naar licht modus' : 'Schakel naar donker modus'}
    >
      {isDarkMode ? (
        <Sun className={sizeClasses[size]} />
      ) : (
        <Moon className={sizeClasses[size]} />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {isDarkMode ? 'Licht' : 'Donker'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;