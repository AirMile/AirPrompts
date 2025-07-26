import { renderHook, act } from '@testing-library/react';
import { useDebouncedSearch } from '../ui/useDebouncedSearch';

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should return initial values', () => {
    const { result } = renderHook(() => useDebouncedSearch());
    
    expect(result.current.searchTerm).toBe('');
    expect(result.current.debouncedSearchTerm).toBe('');
    expect(result.current.isSearching).toBe(false);
  });

  test('should update search term immediately', () => {
    const { result } = renderHook(() => useDebouncedSearch());
    
    act(() => {
      result.current.setSearchTerm('test');
    });
    
    expect(result.current.searchTerm).toBe('test');
    expect(result.current.isSearching).toBe(true);
  });

  test('should debounce search term updates', () => {
    const { result } = renderHook(() => useDebouncedSearch({ delay: 500 }));
    
    act(() => {
      result.current.setSearchTerm('t');
    });
    
    expect(result.current.debouncedSearchTerm).toBe('');
    
    act(() => {
      result.current.setSearchTerm('te');
    });
    
    expect(result.current.debouncedSearchTerm).toBe('');
    
    act(() => {
      result.current.setSearchTerm('test');
    });
    
    // Still not updated
    expect(result.current.debouncedSearchTerm).toBe('');
    
    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    expect(result.current.debouncedSearchTerm).toBe('test');
    expect(result.current.isSearching).toBe(false);
  });

  test('should use custom delay', () => {
    const { result } = renderHook(() => useDebouncedSearch({ delay: 1000 }));
    
    act(() => {
      result.current.setSearchTerm('test');
    });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Not updated yet
    expect(result.current.debouncedSearchTerm).toBe('');
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Now updated
    expect(result.current.debouncedSearchTerm).toBe('test');
  });

  test('should handle rapid changes', () => {
    const { result } = renderHook(() => useDebouncedSearch({ delay: 300 }));
    
    // Simulate rapid typing
    act(() => {
      result.current.setSearchTerm('t');
    });
    
    act(() => {
      jest.advanceTimersByTime(100);
      result.current.setSearchTerm('te');
    });
    
    act(() => {
      jest.advanceTimersByTime(100);
      result.current.setSearchTerm('tes');
    });
    
    act(() => {
      jest.advanceTimersByTime(100);
      result.current.setSearchTerm('test');
    });
    
    // Should not have updated yet
    expect(result.current.debouncedSearchTerm).toBe('');
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Should only have the final value
    expect(result.current.debouncedSearchTerm).toBe('test');
  });

  test('should clear search', () => {
    const { result } = renderHook(() => useDebouncedSearch());
    
    act(() => {
      result.current.setSearchTerm('test');
    });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(result.current.debouncedSearchTerm).toBe('test');
    
    act(() => {
      result.current.clearSearch();
    });
    
    expect(result.current.searchTerm).toBe('');
    expect(result.current.debouncedSearchTerm).toBe('');
    expect(result.current.isSearching).toBe(false);
  });

  test('should handle empty search term', () => {
    const { result } = renderHook(() => useDebouncedSearch());
    
    act(() => {
      result.current.setSearchTerm('test');
    });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    act(() => {
      result.current.setSearchTerm('');
    });
    
    // Should immediately clear for empty string
    expect(result.current.debouncedSearchTerm).toBe('');
    expect(result.current.isSearching).toBe(false);
  });

  test('should provide search results', () => {
    const items = [
      { id: 1, name: 'Test Item 1' },
      { id: 2, name: 'Another Item' },
      { id: 3, name: 'Test Item 2' }
    ];
    
    const searchFn = (item, term) => 
      item.name.toLowerCase().includes(term.toLowerCase());
    
    const { result } = renderHook(() => 
      useDebouncedSearch({ items, searchFn })
    );
    
    act(() => {
      result.current.setSearchTerm('test');
    });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(result.current.searchResults).toHaveLength(2);
    expect(result.current.searchResults[0].id).toBe(1);
    expect(result.current.searchResults[1].id).toBe(3);
  });

  test('should handle search function errors', () => {
    const items = [{ id: 1, name: 'Test' }];
    const searchFn = () => {
      throw new Error('Search error');
    };
    
    const { result } = renderHook(() => 
      useDebouncedSearch({ items, searchFn })
    );
    
    act(() => {
      result.current.setSearchTerm('test');
    });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.error).toBeDefined();
  });

  test('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useDebouncedSearch());
    
    act(() => {
      result.current.setSearchTerm('test');
    });
    
    unmount();
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Should not cause any errors
  });
});