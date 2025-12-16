/**
 * Safe localStorage utility that handles SecurityError and other localStorage issues
 */

class SafeStorage {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  getItem(key: string): string | null {
    if (!this.isAvailable) {
      return null;
    }
    
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Failed to read from localStorage:', e);
      return null;
    }
  }

  setItem(key: string, value: string): boolean {
    if (!this.isAvailable) {
      return false;
    }
    
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('Failed to write to localStorage:', e);
      return false;
    }
  }

  removeItem(key: string): boolean {
    if (!this.isAvailable) {
      return false;
    }
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('Failed to remove from localStorage:', e);
      return false;
    }
  }

  clear(): boolean {
    if (!this.isAvailable) {
      return false;
    }
    
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
      return false;
    }
  }

  get available(): boolean {
    return this.isAvailable;
  }
}

export const safeStorage = new SafeStorage();

/**
 * Hook for safely using localStorage with fallback to memory storage
 */
export function useSafeLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  // Memory fallback for when localStorage is not available
  const memoryStorage = new Map<string, string>();

  const getValue = (): T => {
    try {
      const item = safeStorage.getItem(key) || memoryStorage.get(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Failed to parse localStorage value for key "${key}":`, e);
      return defaultValue;
    }
  };

  const setValue = (value: T): void => {
    try {
      const stringValue = JSON.stringify(value);
      const success = safeStorage.setItem(key, stringValue);
      
      // Fallback to memory storage if localStorage fails
      if (!success) {
        memoryStorage.set(key, stringValue);
      }
    } catch (e) {
      console.warn(`Failed to set localStorage value for key "${key}":`, e);
      // Store in memory as fallback
      try {
        memoryStorage.set(key, JSON.stringify(value));
      } catch (memoryError) {
        console.warn('Failed to store in memory fallback:', memoryError);
      }
    }
  };

  return [getValue(), setValue];
}

export default safeStorage;