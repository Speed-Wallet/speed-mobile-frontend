import AsyncStorage from '@react-native-async-storage/async-storage';
import * as bip39 from 'bip39';
import { Keypair, VersionedTransaction, Connection } from '@solana/web3.js';
import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';

const CONNECTION = new Connection('https://api.devnet.solana.com');
const JUPITER_API_URL = 'https://lite-api.jup.ag/swap/v1/';

const ENCRYPTED_MNEMONIC_KEY = 'solanaEncryptedMnemonic';
const SALT_KEY = 'solanaSalt';
const IV_KEY = 'solanaIV';
const PUBLIC_KEY_KEY = 'solanaPublicKey'; // Keep this as is

const PLATFORM_FEE_ACCOUNT = 'add fee account';
const PLATFORM_FEE_BPS = 20; // 0.2%
let WALLET: SolanaWallet;

interface SolanaWallet {
  mnemonic: string;
  publicKey: string;
}

interface StoredWalletInfo {
  isEncrypted: boolean;
  publicKey: string | null;
}

// --- Encryption/Decryption Helpers ---
const ITERATION_COUNT = 10000; // PBKDF2 iteration count
const KEY_SIZE = 256 / 32; // 256-bit key

const generateSalt = (): string => CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);
const generateIV = (): string => CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);

const deriveKey = (pin: string, salt: string): CryptoJS.lib.WordArray => {
  return CryptoJS.PBKDF2(pin, CryptoJS.enc.Hex.parse(salt), {
    keySize: KEY_SIZE,
    iterations: ITERATION_COUNT,
    hasher: CryptoJS.algo.SHA256
  });
};

const encryptMnemonic = (mnemonic: string, pin: string): { encryptedMnemonic: string, salt: string, iv: string } => {
  const salt = generateSalt();
  const iv = generateIV();
  const key = deriveKey(pin, salt);
  
  const encrypted = CryptoJS.AES.encrypt(mnemonic, key, { 
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC, // CBC is common, GCM is more modern but more complex with crypto-js
    padding: CryptoJS.pad.Pkcs7
  });
  
  return {
    encryptedMnemonic: encrypted.toString(),
    salt,
    iv
  };
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
// --- End Encryption/Decryption Helpers ---

export const generateSolanaWallet = async (): Promise<SolanaWallet> => {
  const mnemonic = bip39.generateMnemonic();
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const keypair = Keypair.fromSeed(Uint8Array.from(seed.subarray(0, 32)));
  
  return {
    mnemonic,
    publicKey: keypair.publicKey.toBase58(),
  };
};

export const saveWalletWithPin = async (mnemonic: string, publicKey: string, pin: string): Promise<void> => {
  try {
    const { encryptedMnemonic, salt, iv } = encryptMnemonic(mnemonic, pin);
    await AsyncStorage.setItem(ENCRYPTED_MNEMONIC_KEY, encryptedMnemonic);
    await AsyncStorage.setItem(SALT_KEY, salt);
    await AsyncStorage.setItem(IV_KEY, iv);
    await AsyncStorage.setItem(PUBLIC_KEY_KEY, publicKey);
  } catch (error) {
    console.error('Failed to save encrypted wallet to AsyncStorage', error);
    throw error;
  }
};

// This function now just checks if a wallet (potentially encrypted) exists
export const checkStoredWallet = async (): Promise<StoredWalletInfo> => {
  try {
    const salt = await AsyncStorage.getItem(SALT_KEY);
    const iv = await AsyncStorage.getItem(IV_KEY);
    const publicKey = await AsyncStorage.getItem(PUBLIC_KEY_KEY);

    if (salt && iv && publicKey) {
      return { isEncrypted: true, publicKey };
    }
    return { isEncrypted: false, publicKey: null };
  } catch (error) {
    console.error('Failed to check stored wallet from AsyncStorage', error);
    return { isEncrypted: false, publicKey: null };
  }
};

export const unlockWalletWithPin = async (pin: string): Promise<SolanaWallet | null> => {
  try {
    const encryptedMnemonic = await AsyncStorage.getItem(ENCRYPTED_MNEMONIC_KEY);
    const salt = await AsyncStorage.getItem(SALT_KEY);
    const iv = await AsyncStorage.getItem(IV_KEY);
    const publicKey = await AsyncStorage.getItem(PUBLIC_KEY_KEY);

    if (!encryptedMnemonic || !salt || !iv || !publicKey) {
      console.log('Encrypted wallet components not found for unlocking.');
      return null;
    }

    const mnemonic = decryptMnemonic(encryptedMnemonic, pin, salt, iv);

    if (mnemonic) {
      // Verify the mnemonic is valid (optional but good)
      if (!bip39.validateMnemonic(mnemonic)) {
        console.warn("Decrypted mnemonic is invalid. PIN might be incorrect or data corrupted.");
        return null;
      }
      WALLET = { mnemonic, publicKey };
      return WALLET;
    }
    return null;
  } catch (error) {
    console.error('Failed to unlock wallet with PIN', error);
    return null;
  }
};

export const clearWallet = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ENCRYPTED_MNEMONIC_KEY);
    await AsyncStorage.removeItem(SALT_KEY);
    await AsyncStorage.removeItem(IV_KEY);
    await AsyncStorage.removeItem(PUBLIC_KEY_KEY);
  } catch (error) {
    console.error('Failed to clear wallet from AsyncStorage', error);
  }
};

export const signAndSendTx = async (tx: VersionedTransaction): Promise<string> => {
  if (!WALLET) {
    throw new Error('Wallet does not exist');
  }

  const seed = await bip39.mnemonicToSeed(WALLET.mnemonic);
  const keypair = Keypair.fromSeed(Uint8Array.from(seed.subarray(0, 32)));

  tx.sign([keypair]);

  try {
    const signature = await CONNECTION.sendRawTransaction(tx.serialize(), {
      maxRetries: 2,
      skipPreflight: true
    });
  
    const confirmation = await CONNECTION.confirmTransaction(signature, "finalized");
  
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}\nhttps://solscan.io/tx/${signature}/`);
    }
  
    return signature;
  } catch (err) {
    throw new Error(`Transaction failed: ${err}/`);
  }
};


export const JupiterQuote = async (
  fromMint: string,
  toMint: string,
  amount: number
): Promise<any> => {
  const quoteQueries = [
    `inputMint=${fromMint}`,
    `outputMint=${toMint}`,
    `amount=${amount}`,
    `platformFeeBps=${PLATFORM_FEE_BPS}`,
    'restrictIntermediateTokens=true',
    'dynamicSlippage=true'
  ];

  return (await fetch(`${JUPITER_API_URL}quote?${quoteQueries.join('&')}`)).json();
};

export const jupiterSwap = async (
  quoteResponse: any,
  walletPubKey: string
) => {
  const swapResponse = await (
    await fetch(`${JUPITER_API_URL}swap?dynamicSlippage=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: walletPubKey,
        feeAccount: PLATFORM_FEE_ACCOUNT,
        
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 1000000,
            global: false,
            priorityLevel: "veryHigh"
          }
        }
      })
    })
  ).json();

  const transactionBase64 = swapResponse.swapTransaction
  const transaction = VersionedTransaction.deserialize(Buffer.from(transactionBase64, 'base64'));
  console.log(transaction);
  const sig = await signAndSendTx(transaction);
  console.log(sig);
};
