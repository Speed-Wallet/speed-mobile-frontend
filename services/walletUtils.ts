import { SecureMMKVStorage } from '../utils/mmkvStorage';
import { Keypair } from '@solana/web3.js';
import CryptoJS from 'crypto-js';
import { validateMnemonic } from '@/utils/bip39';
import { createKeypairFromMnemonic } from '@/utils/derivation';

// Storage keys
const WALLETS_LIST_KEY = 'solanaWalletsList'; // Key for storing wallet list
const APP_SALT_KEY = 'appSalt'; // Key for storing app-level salt
const APP_IV_KEY = 'appIV'; // Key for storing app-level IV

// Encryption constants
const ITERATION_COUNT = 10000; // PBKDF2 iteration count
const KEY_SIZE = 256 / 32; // 256-bit key

interface StoredWalletItem {
  id: string;
  name: string;
  publicKey: string;
  encryptedMnemonic: string;
  createdAt: number;
  accountIndex?: number; // For BIP44 derivation
  derivationPath?: string; // The full derivation path
  isMasterWallet?: boolean; // True for the first wallet with the master mnemonic
}

// Store the app PIN temporarily in memory for seamless wallet switching
// This is cleared when the app is closed or locked
let TEMP_APP_PIN: string | null = null;

const deriveKey = (pin: string, salt: string): CryptoJS.lib.WordArray => {
  return CryptoJS.PBKDF2(pin, CryptoJS.enc.Hex.parse(salt), {
    keySize: KEY_SIZE,
    iterations: ITERATION_COUNT,
    hasher: CryptoJS.algo.SHA256
  });
};

const decryptMnemonic = (encryptedMnemonic: string, pin: string, salt: string, iv: string): string | null => {
  try {
    const key = deriveKey(pin, salt);
    const decrypted = CryptoJS.AES.decrypt(encryptedMnemonic, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) { // Decryption might "succeed" but produce empty string if key is wrong
      console.warn('Decryption resulted in empty string, likely incorrect PIN.');
      return null;
    }
    return decryptedText;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

export const getAppCrypto = async (): Promise<{ salt: string, iv: string } | null> => {
  try {
    const salt = SecureMMKVStorage.getItem(APP_SALT_KEY);
    const iv = SecureMMKVStorage.getItem(APP_IV_KEY);
    
    if (!salt || !iv) {
      return null;
    }
    
    return { salt, iv };
  } catch (error) {
    console.error('Error getting app crypto:', error);
    return null;
  }
};

export const getAllStoredWallets = async (): Promise<StoredWalletItem[]> => {
  try {
    const walletsJson = SecureMMKVStorage.getItem(WALLETS_LIST_KEY);
    if (walletsJson) {
      return JSON.parse(walletsJson);
    }
    return [];
  } catch (error) {
    console.error('Failed to load wallets list:', error);
    return [];
  }
};

// Getter for TEMP_APP_PIN (read-only access for external modules)
export const getTempAppPin = (): string | null => {
  return TEMP_APP_PIN;
};

// Setter for TEMP_APP_PIN (only to be used by walletService.ts)
export const setTempAppPin = (pin: string | null): void => {
  TEMP_APP_PIN = pin;
};

/**
 * Get the master wallet keypair (used for authentication)
 * This requires the app to be unlocked (TEMP_APP_PIN to be set)
 */
export const getMasterWalletKeypair = async (): Promise<Keypair> => {
  try {
    if (!TEMP_APP_PIN) {
      throw new Error('App must be unlocked to get master wallet keypair');
    }

    const wallets = await getAllStoredWallets();
    const masterWallet = wallets.find(wallet => wallet.isMasterWallet);
    
    if (!masterWallet) {
      throw new Error('Master wallet not found');
    }

    const appCrypto = await getAppCrypto();
    if (!appCrypto) {
      throw new Error('App crypto not found');
    }

    // Decrypt the master wallet's mnemonic
    const mnemonic = decryptMnemonic(
      masterWallet.encryptedMnemonic,
      TEMP_APP_PIN,
      appCrypto.salt,
      appCrypto.iv
    );

    if (!mnemonic || !await validateMnemonic(mnemonic)) {
      throw new Error('Failed to decrypt master wallet mnemonic');
    }

    // Create keypair using BIP44 derivation path (m/44'/501'/accountIndex'/0')
    const accountIndexToUse = masterWallet.accountIndex !== undefined ? masterWallet.accountIndex : 0;
    const keypair = await createKeypairFromMnemonic(mnemonic, accountIndexToUse);
    
    return keypair;
  } catch (error) {
    console.error('Failed to get master wallet keypair:', error);
    throw error;
  }
};
