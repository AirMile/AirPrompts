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
        selectedFolderId: 'home',
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
          selectedFolderId: 'home'
        })
      }),
      {
        name: 'airprompts-ui-storage',
        // Only persist user preferences
        partialize: (state) => ({ 
          viewMode: state.viewMode,
          selectedFolderId: state.selectedFolderId 
        })
      }
    )
  )
);