import React from 'react';
import { FolderPlus, Lightbulb, BookOpen, Sparkles } from 'lucide-react';

const WelcomeEmptyState = ({ onCreateFolder }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
      <div className="mb-8">
        <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-6">
          <FolderPlus className="w-12 h-12 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
          Welcome to AirPrompts!
        </h1>
        <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-8 max-w-2xl">
          Get started by creating your first folder to organize your templates, workflows, and snippets.
        </p>
        
        <button
          onClick={onCreateFolder}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2 text-lg"
        >
          <FolderPlus className="w-5 h-5" />
          Create Your First Folder
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-2">Templates</h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Create reusable prompt templates with variables for consistent results.
          </p>
        </div>

        <div className="text-center p-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-2">Workflows</h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Chain templates together to create powerful multi-step processes.
          </p>
        </div>

        <div className="text-center p-6">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-2">Snippets</h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Store reusable text snippets and content blocks for quick access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeEmptyState;