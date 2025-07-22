import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const themeStore = create(
  persist(
    (set, get) => ({
      // Current color scheme (blue, orange, purple, green)
      currentColorScheme: 'blue',
      
      // Dark mode state
      isDarkMode: false,
      
      // Available color schemes with light/dark variants
      colorSchemes: {
        blue: {
          name: 'Modern Blue',
          icon: '💙',
          light: 'theme-blue-light',
          dark: 'theme-blue-dark'
        },
        orange: {
          name: 'Developer Orange',
          icon: '🔥',
          light: 'theme-orange-light', 
          dark: 'theme-orange-dark'
        },
        purple: {
          name: 'Purple Hacker',
          icon: '💜',
          light: 'theme-purple-light',
          dark: 'theme-purple-dark'
        },
        green: {
          name: 'Forest Green',
          icon: '🌿',
          light: 'theme-green-light',
          dark: 'theme-green-dark'
        },
        classic: {
          name: 'Classic Dark',
          icon: '🌙',
          light: 'theme-classic-light',
          dark: 'theme-classic-dark'
        }
      },
      
      // Legacy theme mapping for backwards compatibility
      legacyThemes: {
        default: 'blue',
        purple: 'purple',
        orange: 'orange'
      },
      
      // Custom theme overrides
      customTheme: {
        name: 'Custom',
        className: 'theme-custom',
        variables: {}
      },
      
      // Get current theme class
      getCurrentThemeClass: () => {
        const { currentColorScheme, isDarkMode, colorSchemes } = get();
        const scheme = colorSchemes[currentColorScheme];
        return isDarkMode ? scheme.dark : scheme.light;
      },
      
      // Actions
      setColorScheme: (schemeName) => {
        const scheme = get().colorSchemes[schemeName];
        if (scheme) {
          // Remove all theme classes
          Object.values(get().colorSchemes).forEach(s => {
            document.documentElement.classList.remove(s.light, s.dark);
          });
          
          // Remove legacy classes
          document.documentElement.classList.remove('theme-purple', 'theme-orange');
          
          // Add new theme class based on current mode
          const isDark = get().isDarkMode;
          document.documentElement.classList.add(isDark ? scheme.dark : scheme.light);
          
          // Also update Tailwind dark class
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          
          set({ currentColorScheme: schemeName });
        }
      },
      
      toggleDarkMode: () => {
        const newDarkMode = !get().isDarkMode;
        const { currentColorScheme, colorSchemes } = get();
        const scheme = colorSchemes[currentColorScheme];
        
        // Remove both variants
        document.documentElement.classList.remove(scheme.light, scheme.dark);
        
        // Add the appropriate variant
        document.documentElement.classList.add(newDarkMode ? scheme.dark : scheme.light);
        
        // Also update Tailwind dark class
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        set({ isDarkMode: newDarkMode });
      },
      
      // Set theme directly (for UI that combines scheme + mode)
      setTheme: (schemeName, isDark) => {
        const scheme = get().colorSchemes[schemeName];
        if (scheme) {
          // Remove all theme classes
          Object.values(get().colorSchemes).forEach(s => {
            document.documentElement.classList.remove(s.light, s.dark);
          });
          
          // Add new theme class
          document.documentElement.classList.add(isDark ? scheme.dark : scheme.light);
          
          // Also update Tailwind dark class
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          
          set({ 
            currentColorScheme: schemeName,
            isDarkMode: isDark 
          });
        }
      },
      
      setCustomVariable: (variable, value) => {
        const customTheme = get().customTheme;
        customTheme.variables[variable] = value;
        
        // Apply custom variable to root
        document.documentElement.style.setProperty(`--${variable}`, value);
        
        set({ customTheme: { ...customTheme } });
      },
      
      resetCustomTheme: () => {
        // Remove all custom CSS variables
        const customVars = get().customTheme.variables;
        Object.keys(customVars).forEach(variable => {
          document.documentElement.style.removeProperty(`--${variable}`);
        });
        
        set({
          customTheme: {
            name: 'Custom',
            className: 'theme-custom',
            variables: {}
          }
        });
      },
      
      // Migrate from old theme system
      migrateFromLegacy: (oldThemeName) => {
        const mapping = get().legacyThemes[oldThemeName];
        if (mapping) {
          get().setColorScheme(mapping);
        }
      },
      
      // Initialize theme on mount
      initializeTheme: () => {
        const { currentColorScheme, isDarkMode, colorSchemes } = get();
        const scheme = colorSchemes[currentColorScheme];
        
        if (scheme) {
          // Apply the appropriate theme class
          document.documentElement.classList.add(isDarkMode ? scheme.dark : scheme.light);
          
          // Also apply the dark class for Tailwind CSS
          if (isDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        
        // Apply custom variables
        const customVars = get().customTheme.variables;
        Object.entries(customVars).forEach(([variable, value]) => {
          document.documentElement.style.setProperty(`--${variable}`, value);
        });
        
        // Check for legacy theme in storage and migrate
        const storage = localStorage.getItem('theme-storage');
        if (storage) {
          try {
            const parsed = JSON.parse(storage);
            if (parsed.state?.currentTheme && parsed.state.currentTheme !== 'blue') {
              get().migrateFromLegacy(parsed.state.currentTheme);
            }
          } catch (e) {
            console.error('Error migrating theme:', e);
          }
        }
      }
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Initialize theme when store is rehydrated
        state?.initializeTheme();
      }
    }
  )
);

export default themeStore;