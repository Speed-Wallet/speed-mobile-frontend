// TODO: look at deleting this file
// Wallet Debug Utilities
// This file helps debug and recover wallet issues

import { SecureMMKVStorage } from './mmkvStorage';

// Keys used for wallet storage
const WALLETS_LIST_KEY = 'solanaWalletsList';
const ACTIVE_WALLET_KEY = 'solanaActiveWallet';
const APP_PIN_KEY = 'appPin';
const APP_SALT_KEY = 'appSalt';
const APP_IV_KEY = 'appIV';

// Legacy keys (for backwards compatibility)
const LEGACY_KEYS = [
  'encryptedMnemonic',
  'salt',
  'iv',
  'publicKey'
];

export interface WalletDebugInfo {
  walletsListExists: boolean;
  walletsCount: number;
  activeWalletId: string | null;
  appPinExists: boolean;
  appCryptoExists: boolean;
  legacyDataExists: string[];
  allStorageKeys: string[];
}

/**
 * Get comprehensive debug information about wallet storage
 */
export const getWalletDebugInfo = async (): Promise<WalletDebugInfo> => {
  try {
    // Get all AsyncStorage keys
    const allKeys = SecureMMKVStorage.getAllKeys();
    
    // Check wallets list
    const walletsJson = SecureMMKVStorage.getItem(WALLETS_LIST_KEY);
    const walletsList = walletsJson ? JSON.parse(walletsJson) : [];
    
    // Check active wallet
    const activeWalletId = SecureMMKVStorage.getItem(ACTIVE_WALLET_KEY);
    
    // Check app PIN
    const appPin = SecureMMKVStorage.getItem(APP_PIN_KEY);
    
    // Check app crypto settings
    const appSalt = SecureMMKVStorage.getItem(APP_SALT_KEY);
    const appIV = SecureMMKVStorage.getItem(APP_IV_KEY);
    
    // Check legacy data
    const legacyDataExists: string[] = [];
    for (const key of LEGACY_KEYS) {
      const value = SecureMMKVStorage.getItem(key);
      if (value) {
        legacyDataExists.push(key);
      }
    }
    
    return {
      walletsListExists: !!walletsJson,
      walletsCount: walletsList.length,
      activeWalletId,
      appPinExists: !!appPin,
      appCryptoExists: !!(appSalt && appIV),
      legacyDataExists,
      allStorageKeys: allKeys.filter(key => 
        key.includes('wallet') || 
        key.includes('solana') || 
        key.includes('app') ||
        LEGACY_KEYS.includes(key)
      )
    };
  } catch (error) {
    console.error('Error getting wallet debug info:', error);
    throw error;
  }
};

/**
 * Print debug information to console
 */
export const logWalletDebugInfo = async (): Promise<void> => {
  try {
    const info = await getWalletDebugInfo();
    
    console.log('=== WALLET DEBUG INFO ===');
    console.log('Wallets List Exists:', info.walletsListExists);
    console.log('Wallets Count:', info.walletsCount);
    console.log('Active Wallet ID:', info.activeWalletId);
    console.log('App PIN Exists:', info.appPinExists);
    console.log('App Crypto Settings Exist:', info.appCryptoExists);
    console.log('Legacy Data Found:', info.legacyDataExists);
    console.log('All Wallet-Related Keys:', info.allStorageKeys);
    console.log('========================');
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error logging wallet debug info:', error);
    throw error;
  }
};

/**
 * Get raw wallet list data for inspection
 */
export const getRawWalletData = async (): Promise<any> => {
  try {
    const walletsJson = SecureMMKVStorage.getItem(WALLETS_LIST_KEY);
    if (!walletsJson) {
      return null;
    }
    
    const wallets = JSON.parse(walletsJson);
    console.log('Raw wallet data:', wallets);
    return wallets;
  } catch (error) {
    console.error('Error getting raw wallet data:', error);
    throw error;
  }
};

/**
 * Check if there's any wallet data in AsyncStorage
 */
export const hasAnyWalletData = async (): Promise<boolean> => {
  try {
    const info = await getWalletDebugInfo();
    return info.walletsListExists || 
           info.activeWalletId !== null || 
           info.legacyDataExists.length > 0;
  } catch (error) {
    console.error('Error checking for wallet data:', error);
    return false;
  }
};

/**
 * Recovery function - tries to restore wallets if they exist but aren't loading
 */
export const attemptWalletRecovery = async (): Promise<{
  success: boolean;
  message: string;
  walletsFound: number;
}> => {
  try {
    const info = await getWalletDebugInfo();
    
    if (!info.walletsListExists) {
      return {
        success: false,
        message: 'No wallet list found in storage',
        walletsFound: 0
      };
    }
    
    const rawData = await getRawWalletData();
    if (!rawData || rawData.length === 0) {
      return {
        success: false,
        message: 'Wallet list exists but is empty',
        walletsFound: 0
      };
    }
    
    // Validate wallet data structure
    const validWallets = rawData.filter((wallet: any) => 
      wallet && 
      wallet.id && 
      wallet.name && 
      wallet.publicKey && 
      wallet.encryptedMnemonic
    );
    
    if (validWallets.length === 0) {
      return {
        success: false,
        message: 'Wallet data is corrupted',
        walletsFound: 0
      };
    }
    
    // If no active wallet is set, set the first one
    if (!info.activeWalletId && validWallets.length > 0) {
      SecureMMKVStorage.setItem(ACTIVE_WALLET_KEY, validWallets[0].id);
    }
    
    return {
      success: true,
      message: `Found ${validWallets.length} valid wallet(s)`,
      walletsFound: validWallets.length
    };
    
  } catch (error) {
    console.error('Error during wallet recovery:', error);
    return {
      success: false,
      message: `Recovery failed: ${error}`,
      walletsFound: 0
    };
  }
};

/**
 * Emergency backup of wallet data to console (for manual recovery)
 */
export const backupWalletDataToConsole = async (): Promise<void> => {
  try {
    console.log('=== WALLET BACKUP DATA ===');
    
    const walletsData = SecureMMKVStorage.getItem(WALLETS_LIST_KEY);
    const activeWallet = SecureMMKVStorage.getItem(ACTIVE_WALLET_KEY);
    const appPin = SecureMMKVStorage.getItem(APP_PIN_KEY);
    const appSalt = SecureMMKVStorage.getItem(APP_SALT_KEY);
    const appIV = SecureMMKVStorage.getItem(APP_IV_KEY);
    
    console.log('WALLETS_LIST:', walletsData);
    console.log('ACTIVE_WALLET:', activeWallet);
    console.log('APP_PIN_EXISTS:', !!appPin);
    console.log('APP_SALT:', appSalt);
    console.log('APP_IV:', appIV);
    
    // Check legacy data
    for (const key of LEGACY_KEYS) {
      const value = SecureMMKVStorage.getItem(key);
      if (value) {
        console.log(`LEGACY_${key.toUpperCase()}:`, value);
      }
    }
    
    console.log('=========================');
  } catch (error) {
    console.error('Error backing up wallet data:', error);
  }
};
