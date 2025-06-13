import AsyncStorage from '@react-native-async-storage/async-storage';

// Ensure crypto is available before importing bip39
// const ensureCryptoReady = () => {
//   if (!global.crypto || !global.crypto.getRandomValues) {
//     throw new Error('Crypto polyfill not ready. Make sure react-native-quick-crypto is properly installed.');
//   }
//   if (!global.Buffer) {
//     throw new Error('Buffer polyfill not ready. Make sure @craftzdog/react-native-buffer is properly set up.');
//   }
// };
// ensureCryptoReady();

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
  TransactionMessage
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from '@solana/spl-token';
import CryptoJS from 'crypto-js';
import { useEffect, useState } from 'react';
import { registerSwapAttempt } from './apis';
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from '@/utils/bip39';

export const CONNECTION = new Connection(`https://mainnet.helius-rpc.com/?api-key=${process.env.EXPO_PUBLIC_HELIUS_API_KEY}`);
const JUPITER_API_URL = 'https://lite-api.jup.ag/swap/v1/';

const ENCRYPTED_MNEMONIC_KEY = 'solanaEncryptedMnemonic';
const SALT_KEY = 'solanaSalt';
const IV_KEY = 'solanaIV';
export const PUBLIC_KEY_KEY = 'solanaPublicKey'; // Keep this as is

export const PLATFORM_FEE_RATE = 0.001;
export const WSOL_MINT = 'So11111111111111111111111111111111111111112';
const PLATFORM_FEE_ACCOUNT = new PublicKey('7o3QNaG84hrWhCLoAEXuiiyNfKvpGvMAyTwDb3reBram');
export let WALLET: Keypair | null = null; // Initialize WALLET to null

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

type ErrorType = {
  code: number,
  text: string
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
  const mnemonic = await generateMnemonic();
  const seed = await mnemonicToSeed(mnemonic);
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
      if (!validateMnemonic(mnemonic)) {
        console.warn("Decrypted mnemonic is invalid. PIN might be incorrect or data corrupted.");
        if (WALLET) {
            WALLET = null;
            notifyWalletStateChange();
        }
        return null;
      }

      const seed = await mnemonicToSeed(mnemonic);
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
  const AddIxPromises: Promise<any>[] = [];
  const walletPubkey = WALLET.publicKey;

  // Wallet fee instruction
  if (inputMint === WSOL_MINT) {
    instructions.push(SystemProgram.transfer({
      fromPubkey: WALLET.publicKey,
      toPubkey: PLATFORM_FEE_ACCOUNT,
      lamports: platformFee
    }));
  } else {
    const inputMintPubKey = new PublicKey(inputMint);
    const walletFeeIxPromise = Promise.all([
      getAssociatedTokenAddress(inputMintPubKey, WALLET.publicKey),
      getAssociatedTokenAddress(inputMintPubKey, PLATFORM_FEE_ACCOUNT)
    ])
    .then(([walletATA, platformFeeATA]) => instructions.push(
      createTransferInstruction(
        walletATA,
        platformFeeATA,
        walletPubkey,
        platformFee
      )
    ));

    AddIxPromises.push(walletFeeIxPromise);
  }

  // Create output mint ata for the user if it's not available.
  // The only exception is when the ouput mint is WSOL. This is
  // because we assume WSOL means native SOL.
  if (outputMint !== WSOL_MINT) {
    const outputMintPubKey = new PublicKey(outputMint);
    const outputATAPromise = getAssociatedTokenAddress(outputMintPubKey, WALLET.publicKey)
    .then(async ata => {
      const ataInfo = await CONNECTION.getAccountInfo(ata, 'finalized');
      if (!ataInfo) {
        console.log(`Creating output mint ATA`);
    
        instructions.push(createAssociatedTokenAccountInstruction(
          walletPubkey,
          ata,
          walletPubkey,
          outputMintPubKey
        ));
      }
    });
  
    AddIxPromises.push(outputATAPromise);
  }

  await Promise.all(AddIxPromises);

  const [CUsForPrimaryProcessing, jupiterInstructionsResponse] = await Promise.all([
    getCUsForTransaction(instructions, WALLET),
    fetch(`${JUPITER_API_URL}swap-instructions?dynamicSlippage=true`, {
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
    }).then(res => res.json())
  ]);

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

  const computeUnitPrice = Math.round(prioritizationFeeLamports * 1e6 / computeUnitLimit);
  const totalComputeUnits = CUsForPrimaryProcessing + computeUnitLimit;

  instructions.unshift(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: computeUnitPrice }));
  instructions.unshift(ComputeBudgetProgram.setComputeUnitLimit({ units: totalComputeUnits }));

  const [swapTx, lastValidBlockHeight] = await composeAndSignTransaction(
    instructions,
    WALLET,
    deserializedAddressLookupTableAccounts
  );

  // Transaction signature is the first signature in the "signatures" list.
  const sig = bs58.encode(swapTx.signatures[0]);
  const txSendPromise = CONNECTION.sendRawTransaction(swapTx.serialize(), { 
    maxRetries: 2, 
    skipPreflight: false, 
    preflightCommitment: 'finalized' 
  });
  const registerSwapAttemptPromise = registerSwapAttempt(sig);

  try {
    await Promise.all([txSendPromise, registerSwapAttemptPromise]);
  } catch (err) {
    throw parseError(err);
  }

  const res = await CONNECTION.confirmTransaction({
    signature: sig,
    blockhash: swapTx.message.recentBlockhash,
    lastValidBlockHeight
  }, 'finalized');

  if (res.value.err) {
    console.error(res.value.err);
    throw new Error('Swap failed');
  }
  
  return sig;
}

async function getCUsForTransaction(instructions: TransactionInstruction[], wallet: Keypair)
: Promise<number> {
  const tx = (await composeAndSignTransaction(instructions, wallet))[0];

  try {
    console.log('Simulating tranaction');
    const simResult = await CONNECTION.simulateTransaction(tx);

    if (simResult.value.err) {
      throw parseSimulationError(simResult);
    }

    if (simResult.value.unitsConsumed === undefined) {
      throw new Error('Simulated compute units is "undefined"');
    }

    // Return with extra 10% for error tolerance.
    return Math.ceil(simResult.value.unitsConsumed * 1.1);
  } catch (err) {
    // This catch block would handle network errors or malformed transaction errors
    throw new Error(`Transaction simulation error: ${err}`)
  }
}

async function composeAndSignTransaction(
  instructions: TransactionInstruction[],
  wallet: Keypair,
  lutAccounts?: AddressLookupTableAccount[]
): Promise<[VersionedTransaction, number]> {
  const { blockhash, lastValidBlockHeight } = await CONNECTION.getLatestBlockhash('finalized');
  const messageV0 = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: blockhash,
    instructions: instructions
  }).compileToV0Message(lutAccounts);

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

function parseError(error: any): ErrorType {
  if (error.message.includes('Transaction simulation failed:')) {
    const rentError = { code: 1, text: 'INSUFFICIENT_SOL_FOR_RENT' };
    const feeError = { code: 2, text: 'INSUFFICIENT_SOL_FOR_FEES' };
    const tokenBalanceError = { code: 3, text: 'INSUFFICIENT_TOKEN_BALANCE' };

    if (error.message.includes('InsufficientFundsForFee')) {
      console.error('ERROR: Your wallet has insufficient SOL balance to pay for transaction fees.');
      console.error('Action: Please deposit more SOL into your wallet.');
      return feeError
    }
    
    if (error.message.includes('insufficient funds for rent')) {
      // This usually means creating a new ATA would make SOL balance go below rent exemption
      console.error('ERROR: Insufficient SOL balance for rent exemption for a new token account.');
      console.error('Action: Ensure you have enough SOL to cover transaction fees AND rent for new token accounts.');
      return rentError;
    }
    
    if (error.message.includes('custom program error: 0x1') || error.message.includes('InsufficientFunds')) {
      // This is the tricky part - if preflight *does* run instructions
      // or if the error is from the *on-chain* execution (if skipPreflight was true)
      console.error('ERROR: Insufficient balance of the TOKEN you are trying to swap FROM.');
      console.error('Action: Ensure you have enough of the input token (e.g., USDC if swapping USDC for SOL).');
      return tokenBalanceError;
    }
    
    // Other simulation failures (e.g., invalid arguments, compute budget exceeded)
    console.error('Transaction simulation failed for another reason:', error.message);
    return { code: 4, text: 'TRANSACTION_SIMULATION_FAILED' };
  }
  
  // Errors not from simulation (e.g., network issues, RPC node errors)
  console.error('An unexpected error occurred during transaction sending:', error.message);
  return { code: 4, text: 'NETWORK_OR_RPC_ERROR' };
}

function parseSimulationError(simulationResult: any): ErrorType {
  const rentError = { code: 1, text: 'INSUFFICIENT_SOL_FOR_RENT' };
  const feeError = { code: 2, text: 'INSUFFICIENT_SOL_FOR_FEES' };
  const tokenBalanceError = { code: 3, text: 'INSUFFICIENT_TOKEN_BALANCE' };

  console.error('Transaction simulation failed:');
  console.error(JSON.stringify(simulationResult.value.err, null, 2));

  const error = simulationResult.value.err;
  const logs = simulationResult.value.logs || [];

  // Check for general 'insufficient funds' in logs
  if (logs.some((log: any) => log.includes('insufficient funds') || log.includes('insufficient lamports'))) {
    console.error('Identified: General insufficient funds/lamports error in logs.');
    return feeError;
  }

  // Specific program errors
  if (typeof error === 'object' && 'InstructionError' in error) {
    const instructionError = error.InstructionError;
    const instructionIndex = instructionError[0];
    const programError = instructionError[1];

    console.error(`Error occurred in instruction at index ${instructionIndex}.`);

    if (typeof programError === 'object' && 'Custom' in programError) {
      // Custom program error (e.g., from SystemProgram for insufficient SOL)
      // The System Program's insufficient funds error is typically 0x1
      if (programError.Custom === 1) {
        console.error('Identified: Custom program error 0x1 (often insufficient SOL).');
        return tokenBalanceError;
      }
      
      return { code: 4, text: `Identified: Custom program error code: ${programError.Custom}` };
    }
    
    if (typeof programError === 'string' && programError.includes('insufficient funds for rent')) {
      // Rent exemption error
      console.error('Identified: Insufficient funds for rent exemption.');
      return rentError;
    }
    
    if (typeof programError === 'string' && programError.includes('insufficient lamports')) {
      // Direct lamports error
      console.error('Identified: Insufficient lamports for transfer.');
      return feeError
    }
    
    return { code: 4, text: 'GENERIC ERROR' };
  }
  
  if (typeof error === 'string' && error.includes('insufficient funds for fee')) {
    console.error('Identified: Insufficient SOL for transaction fees.');
    return feeError;
  }

  // Add more generic checks if the error structure is different
  if (JSON.stringify(error).includes('insufficient funds') || JSON.stringify(error).includes('lack of balance')) {
    console.error('Identified: Generic insufficient funds/lack of balance in error object.');
    return feeError;
  }

  return { code: 4, text: 'GENERIC ERROR' };
}
