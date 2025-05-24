import AsyncStorage from '@react-native-async-storage/async-storage';
import * as bip39 from 'bip39';
import {
  Keypair,
  PublicKey,
  VersionedTransaction,
  Connection,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
  TransactionInstruction,
  AddressLookupTableAccount,
  TransactionMessage
} from '@solana/web3.js';
import {
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  createSyncNativeInstruction,
  createCloseAccountInstruction,
} from '@solana/spl-token';
import CryptoJS from 'crypto-js';
import { Key, useEffect, useState } from 'react';

import { Buffer } from 'buffer';
global.Buffer = Buffer; // Polyfill global Buffer

export const CONNECTION = new Connection('https://solana-rpc.publicnode.com');
// const CONNECTION = new Connection('https://api.mainnet-beta.solana.com');
const JUPITER_API_URL = 'https://lite-api.jup.ag/swap/v1/';

const ENCRYPTED_MNEMONIC_KEY = 'solanaEncryptedMnemonic';
const SALT_KEY = 'solanaSalt';
const IV_KEY = 'solanaIV';
export const PUBLIC_KEY_KEY = 'solanaPublicKey'; // Keep this as is

export const PLATFORM_FEE_RATE = 0.001;
const PLATFORM_FEE_ACCOUNT = new PublicKey('7o3QNaG84hrWhCLoAEXuiiyNfKvpGvMAyTwDb3reBram');
const WSOL_MINT = 'So11111111111111111111111111111111111111112';
const PLATFORM_FEE_BPS = 20; // 0.2%
let WALLET: Keypair | null = null; // Initialize WALLET to null

interface SolanaWallet {
  mnemonic: string;
  publicKey: string;
}

// Listener pattern for wallet state changes
type WalletStateListener = (publicKey: string | null) => void;
const walletStateListeners: Set<WalletStateListener> = new Set();

const notifyWalletStateChange = () => {
  const currentPublicKey = WALLET ? WALLET.publicKey.toBase58() : null;
  walletStateListeners.forEach(listener => listener(currentPublicKey));
};

interface PrioritizationFeeData {
  low: number;
  medium: number;
  high: number;
}

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

const isWalletUnlocked = (): boolean => {
  return !!WALLET; // Relies on the module-level WALLET
};

const getWalletPublicKey = (): string | null => {
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
    const storedPublicKey = await AsyncStorage.getItem(PUBLIC_KEY_KEY);

    if (!encryptedMnemonic || !salt || !iv || !storedPublicKey) {
      console.log('Encrypted wallet components not found for unlocking.');
      if (WALLET) { // If a wallet was loaded and now components are missing
          WALLET = null;
          notifyWalletStateChange();
      }
      return null;
    }

    const mnemonic = decryptMnemonic(encryptedMnemonic, pin, salt, iv);

    if (mnemonic) {
      // Verify the mnemonic is valid (optional but good)
      if (!bip39.validateMnemonic(mnemonic)) {
        console.warn("Decrypted mnemonic is invalid. PIN might be incorrect or data corrupted.");
        if (WALLET) {
            WALLET = null;
            notifyWalletStateChange();
        }
        return null;
      }

      const seed = await bip39.mnemonicToSeed(mnemonic);
      const keypair = Keypair.fromSeed(Uint8Array.from(seed.subarray(0, 32)));
      
      if (keypair.publicKey.toBase58() !== storedPublicKey) {
          console.warn("Decrypted wallet's public key does not match stored public key. PIN might be incorrect or data corrupted.");
          if (WALLET) {
              WALLET = null;
              notifyWalletStateChange();
          }
          return null;
      }

      WALLET = keypair;
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
    if (WALLET) { // Clear in-memory wallet on any error
        WALLET = null;
        notifyWalletStateChange();
    }
    return null;
  }
};

export const clearWallet = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ENCRYPTED_MNEMONIC_KEY);
    await AsyncStorage.removeItem(SALT_KEY);
    await AsyncStorage.removeItem(IV_KEY);
    await AsyncStorage.removeItem(PUBLIC_KEY_KEY);
    if (WALLET) {
      WALLET = null;
      notifyWalletStateChange(); // Notify listeners
    }
    console.log('Wallet cleared from AsyncStorage and memory.');
  } catch (error) {
    console.error('Failed to clear wallet from AsyncStorage', error);
  }
};

// Add a function to lock the wallet (clear from memory, but not from AsyncStorage)
export const lockWallet = (): void => {
  if (WALLET) {
    WALLET = null;
    notifyWalletStateChange(); // Notify listeners
    console.log("Wallet locked: Keypair cleared from memory.");
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
    // `platformFeeBps=${PLATFORM_FEE_BPS}`,
    'restrictIntermediateTokens=true',
    'dynamicSlippage=true'
  ];

  return (await fetch(`${JUPITER_API_URL}quote?${quoteQueries.join('&')}`)).json();
};

export const jupiterSwap = async (quoteResponse: any, platformFee: number): Promise<string> => {
  if (!WALLET) throw 'No wallet found';

  const inAmount = parseInt(quoteResponse.inAmount);

  if (isNaN(inAmount)) {
    throw new Error(`Invalid inAmount`);
  }

  const { inputMint, outputMint } = quoteResponse;
  const instructions: TransactionInstruction[] = [];

  // Wallet fee instruction
  if (inputMint === WSOL_MINT) {
    instructions.push(SystemProgram.transfer({
      fromPubkey: WALLET.publicKey,
      toPubkey: PLATFORM_FEE_ACCOUNT,
      lamports: platformFee
    }));
  } else {
    const inputMintPubKey = new PublicKey(inputMint);
    const [walletATA, platformFeeATA] = await Promise.all([
      getAssociatedTokenAddress(inputMintPubKey, WALLET.publicKey),
      getAssociatedTokenAddress(inputMintPubKey, PLATFORM_FEE_ACCOUNT)
    ]);

    instructions.push(createTransferInstruction(
      walletATA,
      platformFeeATA,
      WALLET.publicKey,
      platformFee
    ));
  }

  // Create output mint ata for the user if it's not available
  if (outputMint !== WSOL_MINT) {
    const outputMintPubKey = new PublicKey(outputMint);
    const ata = await getAssociatedTokenAddress(outputMintPubKey, WALLET.publicKey);

    if (!await CONNECTION.getAccountInfo(ata)) {
      console.log(`Creating output mint ATA`);

      instructions.push(createAssociatedTokenAccountInstruction(
        WALLET.publicKey,
        ata,
        WALLET.publicKey,
        outputMintPubKey
      ));
    }
  }

  const jupiterInstructionsResponse = await (
    await fetch(`${JUPITER_API_URL}swap-instructions?dynamicSlippage=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: WALLET.publicKey.toBase58(),
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
        wrapUnwrapSOL: true,
        prioritizationFeeLamports: 'auto'
      })
    })
  ).json();

  const {
      setupInstructions,
      swapInstruction,
      cleanupInstruction,
      tokenLedgerInstruction,
      addressLookupTableAddresses,
      prioritizationFeeLamports,
      computeUnitLimit
  } = jupiterInstructionsResponse;


  // Add token ledger instruction if present
  if (tokenLedgerInstruction) {
      instructions.push(deserializeInstruction(tokenLedgerInstruction));
  }

  // Add setup instructions (e.g., create ATAs)
  if (setupInstructions) {
      instructions.push(...setupInstructions.map(deserializeInstruction));
  }

  // Add the main swap instruction
  instructions.push(deserializeInstruction(swapInstruction));

  // Add cleanup instructions (e.g., close ATAs)
  if (cleanupInstruction) {
      instructions.push(deserializeInstruction(cleanupInstruction));
  }

  // Deserialize Address Lookup Table Accounts
  const deserializedAddressLookupTableAccounts: AddressLookupTableAccount[] = await Promise.all(
    addressLookupTableAddresses.map(
      (address: string) => CONNECTION
        .getAddressLookupTable(new PublicKey(address))
        .then(res => res.value)
    )
  );

  // const txForSimulation = (await composeAndSignTransaction(
  //   instructions,
  //   deserializedAddressLookupTableAccounts,
  //   WALLET
  // ))[0];

  // try {
  //   console.log('Simulating tranaction');
  //   const simResult = await CONNECTION.simulateTransaction(txForSimulation);
  //   const cus = simResult.value.unitsConsumed;
  //   console.log(simResult);

  //   if (!cus) throw new Error('Simulated compute units is "undefined"');

  //   instructions.unshift(ComputeBudgetProgram.setComputeUnitLimit({ units: cus }));
  // } catch (err) {
  //   throw new Error(`Transaction simulation error: ${err}`)
  // }

  const computeUnitPrice = Math.round(prioritizationFeeLamports * 1e6 / computeUnitLimit);
  instructions.unshift(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: computeUnitPrice }));

  console.log('Simulating successful, sending actual transaction...');
  const [realTransaction, lastValidBlockHeight] = await composeAndSignTransaction(
    instructions,
    deserializedAddressLookupTableAccounts,
    WALLET
  );

  const sig = await CONNECTION.sendRawTransaction(realTransaction.serialize(), {
    maxRetries: 2, skipPreflight: true
  });

  const res = await CONNECTION.confirmTransaction({
    signature: sig,
    blockhash: realTransaction.message.recentBlockhash,
    lastValidBlockHeight
  }, 'finalized');

  if (res.value.err) {
    console.error(res.value.err);
    throw new Error('Swap failed');
  }
  
  return sig;
}

async function composeAndSignTransaction(
  instructions: TransactionInstruction[],
  ltas: AddressLookupTableAccount[],
  wallet: Keypair
): Promise<[VersionedTransaction, number]> {
  const { blockhash, lastValidBlockHeight } = await CONNECTION.getLatestBlockhash('finalized');
  const messageV0 = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: blockhash,
    instructions: instructions
  }).compileToV0Message(ltas);

  const transaction = new VersionedTransaction(messageV0);
  transaction.sign([wallet]);
  return [transaction, lastValidBlockHeight];
}

function deserializeInstruction(instructionPayload: any): TransactionInstruction {
  return new TransactionInstruction({
    programId: new PublicKey(instructionPayload.programId),
    keys: instructionPayload.accounts.map((acc: any) => ({
        pubkey: new PublicKey(acc.pubkey),
        isSigner: acc.isSigner,
        isWritable: acc.isWritable,
    })),
    data: Buffer.from(instructionPayload.data, 'base64'),
  });
}

async function calculateBasePriorityFees(instructions: TransactionInstruction[])
  : Promise<PrioritizationFeeData> {
  const writableAccSet = new Set<string>();
  const lockedWritableAccounts: PublicKey[] = [];

  for (const ix of instructions) {
    for (const accMeta of ix.keys) {
      accMeta.isWritable && writableAccSet.add(accMeta.pubkey.toBase58());
    }
  }

  writableAccSet.forEach(id => lockedWritableAccounts.push(new PublicKey(id)));
  const basePriorityFees = await CONNECTION.getRecentPrioritizationFees({ lockedWritableAccounts });

  let low = Number.POSITIVE_INFINITY;
  let high = 0;
  let sum = 0;

  for (const { prioritizationFee } of basePriorityFees) {
    if (prioritizationFee === 0) continue;
    if (prioritizationFee < low) low = prioritizationFee;
    if (prioritizationFee > high) high = prioritizationFee;
    sum += prioritizationFee;
  }

  return { 
    low: low === Number.POSITIVE_INFINITY ? 0 : low, 
    medium: Math.ceil(sum / basePriorityFees.length), 
    high 
  };
}
