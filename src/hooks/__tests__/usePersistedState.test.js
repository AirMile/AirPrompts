import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from '../ui/usePersistedState';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('usePersistedState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with default value when no persisted value', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => 
      usePersistedState('test-key', 'default value')
    );
    
    expect(result.current[0]).toBe('default value');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
  });

  test('should initialize with persisted value when available', () => {
    const persistedValue = { data: 'persisted' };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(persistedValue));
    
    const { result } = renderHook(() => 
      usePersistedState('test-key', 'default')
    );
    
    expect(result.current[0]).toEqual(persistedValue);
  });

  test('should update state and persist to localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => 
      usePersistedState('test-key', 'initial')
    );
    
    act(() => {
      result.current[1]('updated value');
    });
    
    expect(result.current[0]).toBe('updated value');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify('updated value')
    );
  });

  test('should handle function updates', () => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(5));
    
    const { result } = renderHook(() => 
      usePersistedState('counter', 0)
    );
    
    act(() => {
      result.current[1](prev => prev + 1);
    });
    
    expect(result.current[0]).toBe(6);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'counter',
      JSON.stringify(6)
    );
  });

  test('should handle complex objects', () => {
    const complexObject = {
      user: { id: 1, name: 'John' },
      settings: { theme: 'dark', notifications: true },
      data: [1, 2, 3]
    };
    
    mockLocalStorage.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => 
      usePersistedState('complex', complexObject)
    );
    
    act(() => {
      result.current[1]({
        ...result.current[0],
        settings: { ...result.current[0].settings, theme: 'light' }
      });
    });
    
    const expected = {
      ...complexObject,
      settings: { theme: 'light', notifications: true }
    };
    
    expect(result.current[0]).toEqual(expected);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'complex',
      JSON.stringify(expected)
    );
  });

  test('should handle storage errors gracefully', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    const { result } = renderHook(() => 
      usePersistedState('error-key', 'fallback')
    );
    
    expect(result.current[0]).toBe('fallback');
  });

  test('should handle corrupted storage data', () => {
    mockLocalStorage.getItem.mockReturnValue('invalid json{');
    
    const { result } = renderHook(() => 
      usePersistedState('corrupted', 'default')
    );
    
    expect(result.current[0]).toBe('default');
  });

  test('should use custom serializer/deserializer', () => {
    const serializer = jest.fn(value => `custom:${value}`);
    const deserializer = jest.fn(value => value.replace('custom:', ''));
    
    mockLocalStorage.getItem.mockReturnValue('custom:stored');
    
    const { result } = renderHook(() => 
      usePersistedState('custom-key', 'default', { serializer, deserializer })
    );
    
    expect(deserializer).toHaveBeenCalledWith('custom:stored');
    expect(result.current[0]).toBe('stored');
    
    act(() => {
      result.current[1]('new value');
    });
    
    expect(serializer).toHaveBeenCalledWith('new value');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'custom-key',
      'custom:new value'
    );
  });

  test('should sync across multiple hooks with same key', () => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify('shared'));
    
    const { result: result1 } = renderHook(() => 
      usePersistedState('shared-key', 'default')
    );
    
    const { result: result2 } = renderHook(() => 
      usePersistedState('shared-key', 'default')
    );
    
    expect(result1.current[0]).toBe('shared');
    expect(result2.current[0]).toBe('shared');
    
    act(() => {
      result1.current[1]('updated');
    });
    
    // Both hooks should be updated
    expect(result1.current[0]).toBe('updated');
    expect(result2.current[0]).toBe('updated');
  });

  test('should handle storage events from other tabs', () => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify('initial'));
    
    const { result } = renderHook(() => 
      usePersistedState('cross-tab', 'default')
    );
    
    expect(result.current[0]).toBe('initial');
    
    // Simulate storage event from another tab
    act(() => {
      const event = new StorageEvent('storage', {
        key: 'cross-tab',
        newValue: JSON.stringify('from other tab'),
        storageArea: mockLocalStorage
      });
      window.dispatchEvent(event);
    });
    
    expect(result.current[0]).toBe('from other tab');
  });

  test('should remove value when set to undefined', () => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify('value'));
    
    const { result } = renderHook(() => 
      usePersistedState('removable', 'default')
    );
    
    act(() => {
      result.current[1](undefined);
    });
    
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('removable');
    expect(result.current[0]).toBe('default');
  });

  test('should handle storage quota exceeded', () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    
    const { result } = renderHook(() => 
      usePersistedState('quota-test', 'initial')
    );
    
    act(() => {
      result.current[1]('large value');
    });
    
    // State should still update even if storage fails
    expect(result.current[0]).toBe('large value');
  });

  test('should use sessionStorage when specified', () => {
    const mockSessionStorage = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
    
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });
    
    const { result } = renderHook(() => 
      usePersistedState('session-key', 'default', { storage: 'session' })
    );
    
    act(() => {
      result.current[1]('session value');
    });
    
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'session-key',
      JSON.stringify('session value')
    );
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  test('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => 
      usePersistedState('cleanup-test', 'value')
    );
    
    unmount();
    
    // Should not throw errors when storage events occur after unmount
    act(() => {
      const event = new StorageEvent('storage', {
        key: 'cleanup-test',
        newValue: JSON.stringify('new value')
      });
      window.dispatchEvent(event);
    });
  });
});