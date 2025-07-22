import { MMKV } from 'react-native-mmkv';

// Create a default MMKV instance
export const storage = new MMKV();

// Create a secure MMKV instance for sensitive data like auth tokens and wallet keys
export const secureStorage = new MMKV({
  id: 'secure-storage',
  encryptionKey: 'speed-wallet-secure-key-2024'
});

// Utility functions to maintain compatibility with AsyncStorage API
export const MMKVStorage = {
  // Basic string operations
  setItem: (key: string, value: string): void => {
    storage.set(key, value);
  },

  getItem: (key: string): string | null => {
    return storage.getString(key) ?? null;
  },

  removeItem: (key: string): void => {
    storage.delete(key);
  },

  // Object operations (JSON serialization)
  setObject: (key: string, value: any): void => {
    storage.set(key, JSON.stringify(value));
  },

  getObject: <T>(key: string): T | null => {
    const value = storage.getString(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch (error) {
        console.error(`Error parsing JSON for key ${key}:`, error);
        return null;
      }
    }
    return null;
  },

  // Multi-operations for batch removal
  multiRemove: (keys: string[]): void => {
    keys.forEach(key => storage.delete(key));
  },

  // Check if key exists
  contains: (key: string): boolean => {
    return storage.contains(key);
  },

  // Get all keys
  getAllKeys: (): string[] => {
    return storage.getAllKeys();
  },

  // Clear all data
  clearAll: (): void => {
    storage.clearAll();
  }
};

// Secure storage utilities for sensitive data
export const SecureMMKVStorage = {
  setItem: (key: string, value: string): void => {
    secureStorage.set(key, value);
  },

  getItem: (key: string): string | null => {
    return secureStorage.getString(key) ?? null;
  },

  removeItem: (key: string): void => {
    secureStorage.delete(key);
  },

  setObject: (key: string, value: any): void => {
    secureStorage.set(key, JSON.stringify(value));
  },

  getObject: <T>(key: string): T | null => {
    const value = secureStorage.getString(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch (error) {
        console.error(`Error parsing JSON for key ${key}:`, error);
        return null;
      }
    }
    return null;
  },

  multiRemove: (keys: string[]): void => {
    keys.forEach(key => secureStorage.delete(key));
  },

  contains: (key: string): boolean => {
    return secureStorage.contains(key);
  },

  getAllKeys: (): string[] => {
    return secureStorage.getAllKeys();
  },

  clearAll: (): void => {
    secureStorage.clearAll();
  }
};

// Export storage instances for direct use
export { storage as mmkv, secureStorage as secureMMKV };
