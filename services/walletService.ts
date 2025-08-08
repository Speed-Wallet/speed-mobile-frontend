import { SecureMMKVStorage } from '../utils/mmkvStorage';
import bs58 from 'bs58';
import {
  Keypair,
  PublicKey,
  VersionedTransaction,
  Connection,
  SystemProgram,
  ComputeBudgetProgram,
  TransactionInstruction,
  AddressLookupTableAccount,
  TransactionMessage,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from '@solana/spl-token';
import CryptoJS from 'crypto-js';
import { useEffect, useState } from 'react';
import {
  getJupiterQuote,
  prepareJupiterSwap,
  submitSignedTransaction,
  type JupiterQuoteResponse,
} from './jupiterApi';
import {
  generateMnemonic,
  mnemonicToSeed,
  validateMnemonic,
} from '@/utils/bip39';
import {
  createKeypairFromMnemonic,
  getSolanaDerivationPath,
  getNextAccountIndex,
} from '@/utils/derivation';
import { AuthService } from './authService';
import {
  getAppCrypto,
  getAllStoredWallets,
  getTempAppPin,
  setTempAppPin,
} from './walletUtils';

export const CONNECTION = new Connection(
  `https://mainnet.helius-rpc.com/?api-key=${process.env.EXPO_PUBLIC_HELIUS_API_KEY}`,
  'confirmed',
);

const WALLETS_LIST_KEY = 'solanaWalletsList'; // Key for storing wallet list
const ACTIVE_WALLET_KEY = 'solanaActiveWallet'; // Key for active wallet ID
const APP_PIN_KEY = 'appPin'; // Key for storing app-level PIN hash
const APP_SALT_KEY = 'appSalt'; // Key for storing app-level salt
const APP_IV_KEY = 'appIV'; // Key for storing app-level IV
const MASTER_MNEMONIC_KEY = 'masterMnemonic'; // Key for storing encrypted master mnemonic

export const PLATFORM_FEE_RATE = parseFloat(
  process.env.EXPO_PUBLIC_SWAP_FEE_RATE!,
);
export const WSOL_MINT = 'So11111111111111111111111111111111111111112';
export let WALLET: Keypair | null = null; // Initialize WALLET to null

// Helper function to set up AuthService with current wallet
const setupAuthService = () => {
  AuthService.setWalletProvider(() => WALLET);
};

// Initialize AuthService wallet provider
setupAuthService();

interface SolanaWallet {
  mnemonic: string;
  publicKey: string;
}

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

// Listener pattern for wallet state changes
type WalletStateListener = (publicKey: string | null) => void;
const walletStateListeners: Set<WalletStateListener> = new Set();

const notifyWalletStateChange = () => {
  const currentPublicKey = WALLET ? WALLET.publicKey.toBase58() : null;
  walletStateListeners.forEach((listener) => listener(currentPublicKey));
};

type ErrorType = {
  code: number;
  text: string;
};

export function useWalletPublicKey() {
  // Initialize state with the current wallet public key from the module-level WALLET
  const [publicKey, setPublicKey] = useState<string | null>(() => {
    return WALLET ? WALLET.publicKey.toBase58() : null;
  });

  useEffect(() => {
    // Define the listener function
    const listener: WalletStateListener = (newPublicKey) => {
      setPublicKey(newPublicKey);
    };

    // Add the listener
    walletStateListeners.add(listener);

    // Optional: Re-check and set state in case WALLET changed between initial useState and useEffect.
    // This ensures the hook reflects the very latest state upon subscription.
    const currentKeyOnEffect = WALLET ? WALLET.publicKey.toBase58() : null;
    if (publicKey !== currentKeyOnEffect) {
      setPublicKey(currentKeyOnEffect);
    }

    // Cleanup: remove the listener when the component unmounts
    return () => {
      walletStateListeners.delete(listener);
    };
  }, []); // Empty dependency array: subscribe on mount, unsubscribe on unmount

  return publicKey;
}

export const isWalletUnlocked = (): boolean => {
  return !!WALLET; // Relies on the module-level WALLET
};

export const getWalletPublicKey = (): string | null => {
  if (WALLET) {
    return WALLET.publicKey.toBase58(); // Relies on the module-level WALLET
  }
  return null;
};

interface StoredWalletInfo {
  isEncrypted: boolean;
  publicKey: string | null;
}

// --- Encryption/Decryption Helpers ---
const ITERATION_COUNT = 10000; // PBKDF2 iteration count
const KEY_SIZE = 256 / 32; // 256-bit key

const generateSalt = (): string =>
  CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);
const generateIV = (): string =>
  CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);

const deriveKey = (pin: string, salt: string): CryptoJS.lib.WordArray => {
  return CryptoJS.PBKDF2(pin, CryptoJS.enc.Hex.parse(salt), {
    keySize: KEY_SIZE,
    iterations: ITERATION_COUNT,
    hasher: CryptoJS.algo.SHA256,
  });
};

const encryptMnemonic = (
  mnemonic: string,
  pin: string,
  salt?: string,
  iv?: string,
): { encryptedMnemonic: string; salt: string; iv: string } => {
  // Use provided salt/IV or generate new ones
  const finalSalt = salt || generateSalt();
  const finalIV = iv || generateIV();
  const key = deriveKey(pin, finalSalt);

  const encrypted = CryptoJS.AES.encrypt(mnemonic, key, {
    iv: CryptoJS.enc.Hex.parse(finalIV),
    mode: CryptoJS.mode.CBC, // CBC is common, GCM is more modern but more complex with crypto-js
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    encryptedMnemonic: encrypted.toString(),
    salt: finalSalt,
    iv: finalIV,
  };
};

const decryptMnemonic = (
  encryptedMnemonic: string,
  pin: string,
  salt: string,
  iv: string,
): string | null => {
  try {
    const key = deriveKey(pin, salt);
    const decrypted = CryptoJS.AES.decrypt(encryptedMnemonic, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
      // Decryption might "succeed" but produce empty string if key is wrong
      console.warn(
        'Decryption resulted in empty string, likely incorrect PIN.',
      );
      return null;
    }
    return decryptedText;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};
// --- End Encryption/Decryption Helpers ---

// --- App-Level PIN Management (Independent of Wallets) ---

export const createAppPin = async (pin: string): Promise<void> => {
  const salt = generateSalt();
  const iv = generateIV();

  // Store the PIN hash, salt, and IV for app-level authentication
  const pinHash = CryptoJS.SHA256(pin + salt).toString();

  SecureMMKVStorage.setItem(APP_PIN_KEY, pinHash);
  SecureMMKVStorage.setItem(APP_SALT_KEY, salt);
  SecureMMKVStorage.setItem(APP_IV_KEY, iv);

  // Store temporarily for immediate use
  setTempAppPin(pin);

  console.log('App-level PIN created successfully');
};

export const verifyAppPin = async (pin: string): Promise<boolean> => {
  try {
    const storedHash = SecureMMKVStorage.getItem(APP_PIN_KEY);
    const salt = SecureMMKVStorage.getItem(APP_SALT_KEY);

    if (!storedHash || !salt) {
      console.log('No app PIN set up');
      return false;
    }

    const pinHash = CryptoJS.SHA256(pin + salt).toString();
    const isValid = pinHash === storedHash;

    if (isValid) {
      setTempAppPin(pin);
      console.log('App PIN verified successfully');
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying app PIN:', error);
    return false;
  }
};

export const hasAppPin = async (): Promise<boolean> => {
  try {
    const pinHash = SecureMMKVStorage.getItem(APP_PIN_KEY);
    return !!pinHash;
  } catch (error) {
    return false;
  }
};

export const clearAppPin = async (): Promise<void> => {
  try {
    SecureMMKVStorage.removeItem(APP_PIN_KEY);
    SecureMMKVStorage.removeItem(APP_SALT_KEY);
    SecureMMKVStorage.removeItem(APP_IV_KEY);
    setTempAppPin(null);
    console.log('App PIN cleared');
  } catch (error) {
    console.error('Error clearing app PIN:', error);
  }
};

export const lockApp = (): void => {
  setTempAppPin(null);
  if (WALLET) {
    WALLET = null;
    notifyWalletStateChange();
  }
  console.log('App locked - temporary PIN cleared');
};

export const isAppUnlocked = (): boolean => {
  return !!getTempAppPin();
};
// --- End App-Level PIN Management ---

export const generateSolanaWallet = async (): Promise<SolanaWallet> => {
  const mnemonic = await generateMnemonic();
  const keypair = await createKeypairFromMnemonic(mnemonic, 0);

  return {
    mnemonic,
    publicKey: keypair.publicKey.toBase58(),
  };
};

// === Master Mnemonic and Derivation Functions ===

/**
 * Store the master mnemonic encrypted with app PIN
 */
export const storeMasterMnemonic = async (mnemonic: string): Promise<void> => {
  const tempPin = getTempAppPin();
  if (!tempPin) {
    throw new Error('App not unlocked - no temporary PIN available');
  }

  const appCrypto = await getAppCrypto();
  if (!appCrypto) {
    throw new Error('Failed to get app crypto settings');
  }

  const encryption = encryptMnemonic(
    mnemonic,
    tempPin,
    appCrypto.salt,
    appCrypto.iv,
  );
  SecureMMKVStorage.setItem(MASTER_MNEMONIC_KEY, encryption.encryptedMnemonic);
};

/**
 * Get the master mnemonic decrypted
 */
export const getMasterMnemonic = async (): Promise<string | null> => {
  const tempPin = getTempAppPin();
  if (!tempPin) {
    throw new Error('App not unlocked - no temporary PIN available');
  }

  const appCrypto = await getAppCrypto();
  if (!appCrypto) {
    return null;
  }

  const encryptedMnemonic = SecureMMKVStorage.getItem(MASTER_MNEMONIC_KEY);
  if (!encryptedMnemonic) {
    return null;
  }

  return decryptMnemonic(
    encryptedMnemonic,
    tempPin,
    appCrypto.salt,
    appCrypto.iv,
  );
};

/**
 * Check if master mnemonic exists
 */
export const hasMasterMnemonic = async (): Promise<boolean> => {
  const encryptedMnemonic = SecureMMKVStorage.getItem(MASTER_MNEMONIC_KEY);
  return !!encryptedMnemonic;
};

/**
 * Generate a new wallet using the master mnemonic and next available derivation path
 * This version requires the app to be unlocked (temporary PIN available)
 */
export const generateSolanaWalletFromMaster = async (): Promise<
  SolanaWallet & { accountIndex: number; derivationPath: string }
> => {
  const masterMnemonic = await getMasterMnemonic();
  if (!masterMnemonic) {
    // If no master mnemonic exists, create one and store it
    const newMasterMnemonic = await generateMnemonic();
    await storeMasterMnemonic(newMasterMnemonic);

    // Create the first wallet (account index 0)
    const keypair = await createKeypairFromMnemonic(newMasterMnemonic, 0);
    const derivationPath = getSolanaDerivationPath(0);

    return {
      mnemonic: newMasterMnemonic,
      publicKey: keypair.publicKey.toBase58(),
      accountIndex: 0,
      derivationPath,
    };
  }

  // Get existing wallets to determine next account index
  const existingWallets = await getAllStoredWallets();
  const nextAccountIndex = getNextAccountIndex(existingWallets, masterMnemonic);

  // Create wallet with next derivation path
  const keypair = await createKeypairFromMnemonic(
    masterMnemonic,
    nextAccountIndex,
  );
  const derivationPath = getSolanaDerivationPath(nextAccountIndex);

  return {
    mnemonic: masterMnemonic,
    publicKey: keypair.publicKey.toBase58(),
    accountIndex: nextAccountIndex,
    derivationPath,
  };
};

/**
 * Generate the first wallet during initial setup (doesn't require app to be unlocked)
 * This is used during the initial wallet setup flow when no PIN exists yet
 */
export const generateInitialSolanaWallet = async (): Promise<
  SolanaWallet & { accountIndex: number; derivationPath: string }
> => {
  // Check if we already have wallets stored (which would mean this isn't really initial setup)
  const existingWallets = await getAllStoredWallets();
  if (existingWallets.length > 0) {
    throw new Error(
      'Wallets already exist. Use generateSolanaWalletFromMaster instead.',
    );
  }

  // Check if master mnemonic exists but no wallets are stored
  // This can happen if initial setup was interrupted
  const hasMaster = await hasMasterMnemonic();
  if (hasMaster) {
    console.log(
      'Master mnemonic exists but no wallets found. Clearing master mnemonic for fresh start.',
    );
    // Clear the master mnemonic so we can start fresh
    SecureMMKVStorage.removeItem(MASTER_MNEMONIC_KEY);
  }

  // Generate new master mnemonic for the first wallet
  const newMasterMnemonic = await generateMnemonic();

  // Create the first wallet (account index 0)
  const keypair = await createKeypairFromMnemonic(newMasterMnemonic, 0);
  const derivationPath = getSolanaDerivationPath(0);

  return {
    mnemonic: newMasterMnemonic,
    publicKey: keypair.publicKey.toBase58(),
    accountIndex: 0,
    derivationPath,
  };
};

/**
 * Clear any incomplete wallet setup state (useful for debugging or recovering from interrupted setup)
 */
export const clearIncompleteSetup = async (): Promise<void> => {
  try {
    const wallets = await getAllStoredWallets();
    const hasAppPinSet = await hasAppPin();

    // If no wallets exist but we have a master mnemonic or app PIN, clear them
    if (wallets.length === 0) {
      if (await hasMasterMnemonic()) {
        SecureMMKVStorage.removeItem(MASTER_MNEMONIC_KEY);
        console.log('Cleared orphaned master mnemonic');
      }

      if (hasAppPinSet) {
        await clearAppPin();
        console.log('Cleared orphaned app PIN');
      }

      // Clear any temporary state
      setTempAppPin(null);
      if (WALLET) {
        WALLET = null;
        notifyWalletStateChange();
      }

      console.log('Incomplete setup state cleared');
    } else {
      console.log('Wallets exist, no cleanup needed');
    }
  } catch (error) {
    console.error('Error clearing incomplete setup:', error);
  }
};

export const saveWalletWithPin = async (
  mnemonic: string,
  publicKey: string,
  pin: string,
): Promise<void> => {
  // This function is kept for compatibility with the new multi-wallet system
  // It's called internally by saveWalletToList to maintain legacy storage format
  console.log(
    'saveWalletWithPin called for compatibility - wallet saved via multi-wallet system',
  );
};

// Check if a wallet exists in the multi-wallet system
export const checkStoredWallet = async (): Promise<StoredWalletInfo> => {
  try {
    const wallets = await getAllStoredWallets();
    const activeWalletId = await getActiveWalletId();

    if (wallets.length > 0) {
      const activeWallet =
        wallets.find((w) => w.id === activeWalletId) || wallets[0];
      return { isEncrypted: true, publicKey: activeWallet.publicKey };
    }

    return { isEncrypted: false, publicKey: null };
  } catch (error) {
    console.error('Failed to check stored wallet from AsyncStorage', error);
    return { isEncrypted: false, publicKey: null };
  }
};

export const unlockWalletWithPin = async (
  pin: string,
): Promise<SolanaWallet | null> => {
  try {
    // Verify app PIN first
    if (!(await verifyAppPin(pin))) {
      console.log('Invalid app PIN');
      return null;
    }

    // Get app-level crypto settings
    const appCrypto = await getAppCrypto();
    if (!appCrypto) {
      console.log('No app crypto settings found');
      return null;
    }

    // Get active wallet from multi-wallet system
    const wallets = await getAllStoredWallets();
    const activeWalletId = await getActiveWalletId();

    if (wallets.length === 0) {
      console.log('No wallets found');
      return null;
    }

    const activeWallet =
      wallets.find((w) => w.id === activeWalletId) || wallets[0];

    const mnemonic = decryptMnemonic(
      activeWallet.encryptedMnemonic,
      pin,
      appCrypto.salt,
      appCrypto.iv,
    );

    if (mnemonic) {
      // Verify the mnemonic is valid
      if (!(await validateMnemonic(mnemonic))) {
        console.warn(
          'Decrypted mnemonic is invalid. PIN might be incorrect or data corrupted.',
        );
        if (WALLET) {
          WALLET = null;
          notifyWalletStateChange();
        }
        return null;
      }

      // Create keypair using derivation path (default to accountIndex 0 for legacy wallets)
      const accountIndex =
        activeWallet.accountIndex !== undefined ? activeWallet.accountIndex : 0;
      const keypair = await createKeypairFromMnemonic(mnemonic, accountIndex);

      if (keypair.publicKey.toBase58() !== activeWallet.publicKey) {
        console.warn(
          "Decrypted wallet's public key does not match stored public key. PIN might be incorrect or data corrupted.",
        );
        if (WALLET) {
          WALLET = null;
          notifyWalletStateChange();
        }
        return null;
      }

      WALLET = keypair;
      // Store PIN temporarily for seamless wallet switching
      setTempAppPin(pin);
      console.log('🔐 PIN stored temporarily for seamless wallet switching');
      notifyWalletStateChange(); // Notify listeners about the new wallet state
      return { mnemonic, publicKey: WALLET.publicKey.toBase58() };
    } else {
      // Decryption failed
      if (WALLET) {
        WALLET = null;
        notifyWalletStateChange();
      }
      return null;
    }
  } catch (error) {
    console.error('Failed to unlock wallet with PIN', error);
    if (WALLET) {
      // Clear in-memory wallet on any error
      WALLET = null;
      notifyWalletStateChange();
    }
    return null;
  }
};

export const clearWallet = async (): Promise<void> => {
  try {
    SecureMMKVStorage.removeItem(WALLETS_LIST_KEY);
    SecureMMKVStorage.removeItem(ACTIVE_WALLET_KEY);
    SecureMMKVStorage.removeItem(APP_PIN_KEY);
    SecureMMKVStorage.removeItem(APP_SALT_KEY);
    SecureMMKVStorage.removeItem(APP_IV_KEY);

    // Also remove any legacy keys (just in case)
    SecureMMKVStorage.removeItem('encryptedMnemonic');
    SecureMMKVStorage.removeItem('salt');
    SecureMMKVStorage.removeItem('iv');
    SecureMMKVStorage.removeItem('publicKey');

    if (WALLET) {
      WALLET = null;
      notifyWalletStateChange(); // Notify listeners
    }

    // Clear temporary PIN from memory
    setTempAppPin(null);

    console.log('🗑️ All wallet data cleared from AsyncStorage and memory.');
  } catch (error) {
    console.error('Failed to clear wallet from AsyncStorage', error);
  }
};

// Add a function to lock the wallet (clear from memory, but not from AsyncStorage)
export const lockWallet = (): void => {
  if (WALLET) {
    WALLET = null;
    notifyWalletStateChange(); // Notify listeners
    console.log('Wallet locked: Keypair cleared from memory.');
  }
  // Clear temporary PIN from memory when locking
  setTempAppPin(null);
  console.log('Temporary PIN cleared from memory.');
};

// Re-export Jupiter functions from the new API service
export {
  getJupiterQuote as JupiterQuote,
  type JupiterQuoteResponse,
} from './jupiterApi';

// Re-export wallet utils for compatibility
export {
  getMasterWalletKeypair,
  getAllStoredWallets,
  getAppCrypto,
} from './walletUtils';

// Type for prepared Jupiter swap transaction
export interface PreparedJupiterSwap {
  signedTransaction: string;
  signature: string;
  blockhash: string;
  lastValidBlockHeight: number;
  userPublicKey: string;
}

/**
 * Prepare Jupiter swap transaction for preview (Step 1: Prepare and Sign)
 * This function is called when 'preview swap' is pressed
 */
export const prepareJupiterSwapTransaction = async (
  quoteResponse: JupiterQuoteResponse,
  platformFee: number,
): Promise<PreparedJupiterSwap> => {
  if (!WALLET) {
    throw new Error('No wallet found');
  }

  try {
    // Step 1: Prepare the swap transaction on the backend
    const { transaction, signature, blockhash, lastValidBlockHeight } =
      await prepareJupiterSwap(
        quoteResponse,
        platformFee,
        WALLET.publicKey.toBase58(),
      );
    // Step 2: Deserialize and sign the transaction locally
    const transactionBuffer = Buffer.from(transaction, 'base64');
    const versionedTransaction =
      VersionedTransaction.deserialize(transactionBuffer);

    // Sign the transaction with the user's wallet
    versionedTransaction.sign([WALLET]);

    // Serialize the signed transaction
    const signedTransactionBuffer = Buffer.from(
      versionedTransaction.serialize(),
    );
    const signedTransaction = signedTransactionBuffer.toString('base64');

    return {
      signedTransaction,
      signature,
      blockhash,
      lastValidBlockHeight,
      userPublicKey: WALLET.publicKey.toBase58(),
    };
  } catch (error) {
    console.error('Jupiter swap preparation error:', error);
    throw error;
  }
};

/**
 * Confirm and submit Jupiter swap transaction (Step 2: Submit)
 * This function is called when 'confirm swap' is pressed
 */
export const confirmJupiterSwap = async (
  preparedSwap: PreparedJupiterSwap,
): Promise<string> => {
  try {
    // Submit the signed transaction to the backend
    const { signature } = await submitSignedTransaction(
      preparedSwap.signedTransaction,
      preparedSwap.signature,
      preparedSwap.blockhash,
      preparedSwap.lastValidBlockHeight,
    );

    return signature;
  } catch (error) {
    console.error('Jupiter swap confirmation error:', error);
    throw error;
  }
};

/**
 * Legacy jupiterSwap function that uses the backend API
 * This maintains the same interface as the old function for compatibility
 * @deprecated Use prepareJupiterSwapTransaction and confirmJupiterSwap instead
 */
export const jupiterSwap = async (
  quoteResponse: JupiterQuoteResponse,
  platformFee: number,
): Promise<string> => {
  const preparedSwap = await prepareJupiterSwapTransaction(
    quoteResponse,
    platformFee,
  );
  return await confirmJupiterSwap(preparedSwap);
};

export const importWalletFromMnemonic = async (
  mnemonic: string,
): Promise<SolanaWallet> => {
  // Validate the mnemonic first
  const isValid = await validateMnemonic(mnemonic);
  if (!isValid) {
    throw new Error('Invalid mnemonic phrase');
  }

  // Use the same BIP44 derivation as wallet generation (m/44'/501'/0'/0')
  const keypair = await createKeypairFromMnemonic(mnemonic, 0);

  return {
    mnemonic,
    publicKey: keypair.publicKey.toBase58(),
  };
};

// === Multiple Wallet Management Functions ===

export const saveWalletToList = async (
  id: string,
  name: string,
  mnemonic: string,
  publicKey: string,
  pin: string,
  accountIndex?: number,
  derivationPath?: string,
): Promise<void> => {
  try {
    // Check if app PIN exists, if not create it
    if (!(await hasAppPin())) {
      await createAppPin(pin);
    } else {
      // Verify the PIN matches the app PIN
      if (!(await verifyAppPin(pin))) {
        throw new Error('PIN does not match app PIN');
      }
    }

    // Get app-level crypto settings
    const appCrypto = await getAppCrypto();
    if (!appCrypto) {
      throw new Error('Failed to get app crypto settings');
    }

    // Check if this is the first wallet
    const existingWallets = await getAllStoredWallets();
    const isMasterWallet = existingWallets.length === 0;

    // Store master mnemonic if this is the first wallet (and it doesn't exist already)
    if (isMasterWallet && !(await hasMasterMnemonic())) {
      // Store the master mnemonic encrypted with the app PIN
      const masterEncryption = encryptMnemonic(
        mnemonic,
        pin,
        appCrypto.salt,
        appCrypto.iv,
      );
      SecureMMKVStorage.setItem(
        MASTER_MNEMONIC_KEY,
        masterEncryption.encryptedMnemonic,
      );
      console.log('Master mnemonic stored during initial wallet creation');
    }

    // Encrypt with app-level salt/IV
    const encryption = encryptMnemonic(
      mnemonic,
      pin,
      appCrypto.salt,
      appCrypto.iv,
    );
    const walletItem: StoredWalletItem = {
      id,
      name,
      publicKey,
      encryptedMnemonic: encryption.encryptedMnemonic,
      createdAt: Date.now(),
      accountIndex,
      derivationPath,
      isMasterWallet,
    };

    const updatedWallets = [...existingWallets, walletItem];

    SecureMMKVStorage.setItem(WALLETS_LIST_KEY, JSON.stringify(updatedWallets));

    // Set as active wallet
    await setActiveWallet(id);

    // Load wallet into memory immediately (default to accountIndex 0 for legacy wallets)
    const walletAccountIndex = accountIndex !== undefined ? accountIndex : 0;
    const keypair = await createKeypairFromMnemonic(
      mnemonic,
      walletAccountIndex,
    );
    WALLET = keypair;
    notifyWalletStateChange();
  } catch (error) {
    console.error('Failed to save wallet to list:', error);
    throw error;
  }
};

export const removeWalletFromList = async (walletId: string): Promise<void> => {
  try {
    const wallets = await getAllStoredWallets();
    const updatedWallets = wallets.filter((w) => w.id !== walletId);
    SecureMMKVStorage.setItem(WALLETS_LIST_KEY, JSON.stringify(updatedWallets));

    const activeWalletId = await getActiveWalletId();
    if (activeWalletId === walletId) {
      // If removing the active wallet, clear it from memory and set new active if available
      if (WALLET) {
        WALLET = null;
        notifyWalletStateChange();
      }

      if (updatedWallets.length > 0) {
        await setActiveWallet(updatedWallets[0].id);
      } else {
        // No wallets left, clear the active wallet key
        SecureMMKVStorage.removeItem(ACTIVE_WALLET_KEY);
      }
    }
  } catch (error) {
    console.error('Failed to remove wallet from list:', error);
    throw error;
  }
};

export const getActiveWalletId = async (): Promise<string | null> => {
  try {
    return SecureMMKVStorage.getItem(ACTIVE_WALLET_KEY);
  } catch (error) {
    console.error('Failed to get active wallet ID:', error);
    return null;
  }
};

export const setActiveWallet = async (walletId: string): Promise<void> => {
  try {
    SecureMMKVStorage.setItem(ACTIVE_WALLET_KEY, walletId);
  } catch (error) {
    console.error('Failed to set active wallet:', error);
    throw error;
  }
};

export const switchToWallet = async (
  walletId: string,
  pin: string,
): Promise<boolean> => {
  try {
    // Verify app PIN first
    if (!(await verifyAppPin(pin))) {
      throw new Error('Invalid PIN');
    }

    const wallets = await getAllStoredWallets();
    const targetWallet = wallets.find((w) => w.id === walletId);

    if (!targetWallet) {
      throw new Error('Wallet not found');
    }

    // Get app-level crypto settings
    const appCrypto = await getAppCrypto();
    if (!appCrypto) {
      throw new Error('App crypto settings not found');
    }

    const mnemonic = decryptMnemonic(
      targetWallet.encryptedMnemonic,
      pin,
      appCrypto.salt,
      appCrypto.iv,
    );

    if (!mnemonic) {
      throw new Error('Failed to decrypt wallet');
    }

    // Verify mnemonic and create keypair
    if (!(await validateMnemonic(mnemonic))) {
      throw new Error('Invalid mnemonic in stored wallet');
    }

    // Create keypair using BIP44 derivation path (m/44'/501'/accountIndex'/0')
    const walletAccountIndex =
      targetWallet.accountIndex !== undefined ? targetWallet.accountIndex : 0;
    const keypair = await createKeypairFromMnemonic(
      mnemonic,
      walletAccountIndex,
    );

    if (keypair.publicKey.toBase58() !== targetWallet.publicKey) {
      throw new Error('Public key mismatch');
    }

    // Update active wallet
    await setActiveWallet(walletId);

    // Update in-memory wallet
    WALLET = keypair;
    notifyWalletStateChange();

    return true;
  } catch (error) {
    console.error('Failed to switch wallet:', error);
    return false;
  }
};

// Function to switch wallets seamlessly using app PIN (when already unlocked)
export const switchToWalletWithAppPin = async (
  walletId: string,
  appPin: string,
): Promise<boolean> => {
  try {
    // Verify app PIN first
    if (!(await verifyAppPin(appPin))) {
      throw new Error('Invalid PIN');
    }

    const wallets = await getAllStoredWallets();
    const targetWallet = wallets.find((w) => w.id === walletId);

    if (!targetWallet) {
      throw new Error('Wallet not found');
    }

    // Get app-level crypto settings
    const appCrypto = await getAppCrypto();
    if (!appCrypto) {
      throw new Error('App crypto settings not found');
    }

    const mnemonic = decryptMnemonic(
      targetWallet.encryptedMnemonic,
      appPin,
      appCrypto.salt,
      appCrypto.iv,
    );

    if (!mnemonic) {
      throw new Error('Failed to decrypt wallet');
    }

    // Verify mnemonic and create keypair
    if (!(await validateMnemonic(mnemonic))) {
      throw new Error('Invalid mnemonic in stored wallet');
    }

    // Create keypair using BIP44 derivation path (m/44'/501'/accountIndex'/0')
    const walletAccountIndex =
      targetWallet.accountIndex !== undefined ? targetWallet.accountIndex : 0;
    const keypair = await createKeypairFromMnemonic(
      mnemonic,
      walletAccountIndex,
    );

    if (keypair.publicKey.toBase58() !== targetWallet.publicKey) {
      throw new Error('Public key mismatch');
    }

    // Update active wallet
    await setActiveWallet(walletId);

    // Update in-memory wallet
    WALLET = keypair;
    notifyWalletStateChange();

    return true;
  } catch (error) {
    console.error('Failed to switch wallet with app PIN:', error);
    return false;
  }
};

// New function for switching wallets when app is already unlocked
export const switchToWalletUnlocked = async (
  walletId: string,
): Promise<boolean> => {
  try {
    // Use the stored temporary PIN for seamless switching if available
    const tempPin = getTempAppPin();
    if (tempPin) {
      console.log('Using temporary PIN for seamless wallet switching');
      return await switchToWalletWithAppPin(walletId, tempPin);
    }

    // Fallback: If no temporary PIN available, require unlock
    // This should not happen in normal flow, but provides safety
    console.warn('No temporary PIN available for seamless switching');

    const wallets = await getAllStoredWallets();
    const targetWallet = wallets.find((w) => w.id === walletId);

    if (!targetWallet) {
      throw new Error('Wallet not found');
    }

    // Update active wallet setting
    await setActiveWallet(walletId);

    // Clear current wallet from memory - user will need to re-unlock
    // This maintains security by requiring PIN re-entry for wallet switching
    WALLET = null;
    notifyWalletStateChange();

    return true;
  } catch (error) {
    console.error('Failed to switch wallet:', error);
    return false;
  }
};

// === End Multiple Wallet Management Functions ===

// Debug function to check if temporary PIN is available
export const hasTempAppPin = (): boolean => {
  return !!getTempAppPin();
};

// Save wallet using the current app PIN (for seamless wallet creation)
export const saveWalletWithAppPin = async (
  id: string,
  name: string,
  mnemonic: string,
  publicKey: string,
  accountIndex?: number,
  derivationPath?: string,
): Promise<void> => {
  try {
    const tempPin = getTempAppPin();
    if (!tempPin) {
      throw new Error('App not unlocked - no temporary PIN available');
    }

    // Get app-level crypto settings
    const appCrypto = await getAppCrypto();
    if (!appCrypto) {
      throw new Error('Failed to get app crypto settings');
    }

    // Check if this is the first wallet
    const existingWallets = await getAllStoredWallets();
    const isMasterWallet = existingWallets.length === 0;

    // Encrypt with app-level salt/IV using the temporary PIN
    const encryption = encryptMnemonic(
      mnemonic,
      tempPin,
      appCrypto.salt,
      appCrypto.iv,
    );
    const walletItem: StoredWalletItem = {
      id,
      name,
      publicKey,
      encryptedMnemonic: encryption.encryptedMnemonic,
      createdAt: Date.now(),
      accountIndex,
      derivationPath,
      isMasterWallet,
    };

    const updatedWallets = [...existingWallets, walletItem];

    SecureMMKVStorage.setItem(WALLETS_LIST_KEY, JSON.stringify(updatedWallets));

    // Set as active wallet
    await setActiveWallet(id);

    // Load wallet into memory immediately
    const accountIndexToUse = accountIndex !== undefined ? accountIndex : 0;
    const keypair = await createKeypairFromMnemonic(
      mnemonic,
      accountIndexToUse,
    );

    WALLET = keypair;
    notifyWalletStateChange();

    console.log('Wallet saved with app PIN successfully');
  } catch (error) {
    console.error('Failed to save wallet with app PIN:', error);
    throw error;
  }
};

// Simplified app unlock function - just verifies PIN and loads active wallet
export const unlockApp = async (pin: string): Promise<boolean> => {
  try {
    // Verify app PIN
    if (!(await verifyAppPin(pin))) {
      console.log('Invalid app PIN');
      return false;
    }

    // Get wallets and load active one if available
    const wallets = await getAllStoredWallets();
    if (wallets.length === 0) {
      console.log('No wallets found - app unlocked but no wallets to load');
      return true; // App is unlocked, just no wallets yet
    }

    const activeWalletId = await getActiveWalletId();
    const activeWallet =
      wallets.find((w) => w.id === activeWalletId) || wallets[0];

    // Get app crypto settings
    const appCrypto = await getAppCrypto();
    if (!appCrypto) {
      console.log('No app crypto settings found');
      return false;
    }

    // Decrypt and load the active wallet
    const mnemonic = decryptMnemonic(
      activeWallet.encryptedMnemonic,
      pin,
      appCrypto.salt,
      appCrypto.iv,
    );

    if (!mnemonic || !(await validateMnemonic(mnemonic))) {
      console.error('Failed to decrypt active wallet');
      return false;
    }

    // Create keypair using BIP44 derivation path (m/44'/501'/accountIndex'/0')
    const accountIndexToUse =
      activeWallet.accountIndex !== undefined ? activeWallet.accountIndex : 0;
    const keypair = await createKeypairFromMnemonic(
      mnemonic,
      accountIndexToUse,
    );

    // Load wallet into memory
    WALLET = keypair;
    notifyWalletStateChange();

    console.log('App unlocked and active wallet loaded');
    return true;
  } catch (error) {
    console.error('Failed to unlock app:', error);
    return false;
  }
};

/**
 * Get the master wallet's public key
 * This is used for authentication to ensure consistency across wallet switches
 */
export const getMasterWalletPublicKey = async (): Promise<string> => {
  try {
    const wallets = await getAllStoredWallets();
    const masterWallet = wallets.find((wallet) => wallet.isMasterWallet);

    if (!masterWallet) {
      throw new Error('Master wallet not found');
    }

    return masterWallet.publicKey;
  } catch (error) {
    console.error('Failed to get master wallet public key:', error);
    throw error;
  }
};
