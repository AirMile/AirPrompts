import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

/**
 * Onboarding flow component for new users
 */
export const OnboardingFlow = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const steps = [
    {
      title: 'Welcome to AirPrompts!',
      description:
        "Your intelligent prompt template management system. Let's get you started with a quick tour.",
      image: '/onboarding/welcome.svg',
      features: [
        'Create and manage prompt templates',
        'Build complex workflows',
        'Organize with folders and tags',
        'Share and collaborate',
      ],
    },
    {
      title: 'Create Your First Template',
      description:
        'Templates are reusable prompts with dynamic variables. Perfect for repetitive tasks.',
      demo: 'template',
      tips: [
        'Use {variables} for dynamic content',
        'Add descriptions for clarity',
        'Organize with categories and tags',
      ],
    },
    {
      title: 'Build Powerful Workflows',
      description: 'Chain templates together to create complex, multi-step processes.',
      demo: 'workflow',
      tips: [
        'Link templates in sequence',
        'Pass outputs between steps',
        'Save time on complex tasks',
      ],
    },
    {
      title: 'Stay Organized',
      description: 'Use folders, tags, and search to keep everything tidy and accessible.',
      demo: 'organization',
      features: [
        'Nested folder structure',
        'Custom tags and colors',
        'Advanced search filters',
        'Favorites for quick access',
      ],
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete?.();
    }, 300);
  };

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      onSkip?.();
    }, 300);
  };

  const step = steps[currentStep];

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${isExiting ? 'animate-fadeOut' : 'animate-fadeIn'}`}
    >
      <div
        className={`bg-white dark:bg-secondary-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl ${isExiting ? 'animate-fadeOut' : 'animate-scaleIn'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
              Getting Started
            </h2>
          </div>
          <button
            onClick={handleSkip}
            className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
              {step.title}
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400">{step.description}</p>
          </div>

          {/* Features or Tips */}
          {step.features && (
            <div className="bg-secondary-50 dark:bg-secondary-900/50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
                Key Features:
              </h4>
              <ul className="space-y-2">
                {step.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
                    <span className="text-secondary-700 dark:text-secondary-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step.tips && (
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-primary-900 dark:text-primary-100 mb-3">
                Pro Tips:
              </h4>
              <ul className="space-y-2">
                {step.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary-600 dark:text-primary-400 mt-1">💡</span>
                    <span className="text-primary-800 dark:text-primary-200">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Demo Area */}
          {step.demo && (
            <div className="bg-secondary-100 dark:bg-secondary-900 rounded-lg p-8 mb-6 text-center">
              <p className="text-secondary-500">Interactive demo would go here</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-primary-600'
                    : index < currentStep
                      ? 'w-2 bg-primary-400'
                      : 'w-2 bg-secondary-300 dark:bg-secondary-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={handleSkip}
              className="px-4 py-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 transition-colors"
            >
              Skip Tour
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                'Get Started'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Onboarding tooltip for specific features
 */
export const OnboardingTooltip = ({ title, description, position = 'bottom', onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show tooltip after a short delay
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <div
      className={`
        absolute ${positionClasses[position]} z-50
        ${isVisible ? 'animate-fadeIn' : 'animate-fadeOut'}
      `}
    >
      <div className="bg-primary-600 text-white rounded-lg p-4 shadow-xl max-w-xs">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold">{title}</h3>
          <button
            onClick={handleDismiss}
            className="text-primary-200 hover:text-white flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-primary-100">{description}</p>

        {/* Arrow */}
        <div
          className={`
            absolute w-0 h-0 border-8 border-transparent
            ${position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-primary-600' : ''}
            ${position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-primary-600' : ''}
            ${position === 'left' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-l-primary-600' : ''}
            ${position === 'right' ? 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-r-primary-600' : ''}
          `}
        />
      </div>
    </div>
  );
};

export default OnboardingFlow;
