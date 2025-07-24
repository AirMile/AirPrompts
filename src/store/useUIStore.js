import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// UI state blijft client-side
export const useUIStore = create(
  devtools(
    persist(
      (set) => ({
        // View preferences
        viewMode: 'grid',
        searchQuery: '',
        selectedFolderId: 'root',
        activeFilters: {},
        
        // UI actions
        setViewMode: (mode) => set({ viewMode: mode }),
        setSearchQuery: (query) => set({ searchQuery: query }),
        setSelectedFolder: (folderId) => set({ selectedFolderId: folderId }),
        updateFilters: (filters) => set({ activeFilters: filters }),
        
        // Reset UI state
        resetUI: () => set({
          searchQuery: '',
          activeFilters: {},
          selectedFolderId: 'root'
        })
      }),
      {
        name: 'airprompts-ui-storage',
        version: 1,
        // Only persist user preferences
        partialize: (state) => ({ 
          viewMode: state.viewMode,
          selectedFolderId: state.selectedFolderId 
        }),
        // Migrate old 'home' to 'root' 
        migrate: (persistedState, version) => {
          if (version === 0 && persistedState?.selectedFolderId === 'home') {
            persistedState.selectedFolderId = 'root';
          }
          return persistedState;
        }
      }
    )
  )
);