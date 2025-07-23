import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const themeStore = create(
  persist(
    (set, get) => ({
      // Separate color schemes for light and dark modes
      lightModeScheme: 'blue',
      darkModeScheme: 'blue',
      
      // Dark mode state
      isDarkMode: false,
      
      // Current color scheme (computed getter function)
      getCurrentColorScheme: () => {
        return get().isDarkMode ? get().darkModeScheme : get().lightModeScheme;
      },
      
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
        },
        grey: {
          name: 'Grey',
          icon: '⚪',
          light: 'theme-grey-light',
          dark: 'theme-grey-dark'
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
        const { isDarkMode, lightModeScheme, darkModeScheme, colorSchemes } = get();
        const currentScheme = isDarkMode ? darkModeScheme : lightModeScheme;
        const scheme = colorSchemes[currentScheme];
        return isDarkMode ? scheme.dark : scheme.light;
      },
      
      // Actions
      setColorScheme: (schemeName) => {
        const scheme = get().colorSchemes[schemeName];
        if (scheme) {
          get().applyThemeWithTransition(() => {
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
            
            // Update the appropriate scheme based on current mode
            if (isDark) {
              set({ darkModeScheme: schemeName });
            } else {
              set({ lightModeScheme: schemeName });
            }
          });
        }
      },
      
      // Set light mode scheme
      setLightModeScheme: (schemeName) => {
        const scheme = get().colorSchemes[schemeName];
        if (scheme) {
          set({ lightModeScheme: schemeName });
          
          // If currently in light mode, apply the theme immediately
          if (!get().isDarkMode) {
            get().applyThemeWithTransition(() => {
              get().applyCurrentTheme();
            });
          }
        }
      },
      
      // Set dark mode scheme
      setDarkModeScheme: (schemeName) => {
        const scheme = get().colorSchemes[schemeName];
        if (scheme) {
          set({ darkModeScheme: schemeName });
          
          // If currently in dark mode, apply the theme immediately
          if (get().isDarkMode) {
            get().applyThemeWithTransition(() => {
              get().applyCurrentTheme();
            });
          }
        }
      },
      
      // Apply current theme based on mode
      applyCurrentTheme: () => {
        const { isDarkMode, lightModeScheme, darkModeScheme, colorSchemes } = get();
        const currentScheme = isDarkMode ? darkModeScheme : lightModeScheme;
        const scheme = colorSchemes[currentScheme];
        
        if (scheme) {
          // Remove all theme classes
          Object.values(colorSchemes).forEach(s => {
            document.documentElement.classList.remove(s.light, s.dark);
          });
          
          // Remove legacy classes
          document.documentElement.classList.remove('theme-purple', 'theme-orange');
          
          // Add appropriate theme class
          document.documentElement.classList.add(isDarkMode ? scheme.dark : scheme.light);
          
          // Update Tailwind dark class
          if (isDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
      
      toggleDarkMode: () => {
        const newDarkMode = !get().isDarkMode;
        
        get().applyThemeWithTransition(() => {
          set({ isDarkMode: newDarkMode });
          
          // Apply the correct theme for the new mode
          get().applyCurrentTheme();
        });
      },
      
      // Set theme directly (for UI that combines scheme + mode)
      setTheme: (schemeName, isDark) => {
        const scheme = get().colorSchemes[schemeName];
        if (scheme) {
          get().applyThemeWithTransition(() => {
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
      
      // Modern theme transition with View Transitions API
      applyThemeWithTransition: (applyThemeFunction) => {
        // Simple check for View Transitions support
        if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          applyThemeFunction();
          return;
        }
        
        // Mark as transitioning to disable conflicting animations
        document.documentElement.setAttribute('data-theme-transitioning', 'true');
        
        // Use View Transitions API
        console.log('[Theme] Starting view transition');
        const transition = document.startViewTransition(() => {
          console.log('[Theme] Applying theme changes');
          applyThemeFunction();
        });
        
        // Clean up after transition
        transition.finished.finally(() => {
          console.log('[Theme] View transition completed');
          document.documentElement.removeAttribute('data-theme-transitioning');
        });
      },

      // Initialize theme on mount
      initializeTheme: () => {
        // Apply current theme
        get().applyCurrentTheme();
        
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