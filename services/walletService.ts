import AsyncStorage from '@react-native-async-storage/async-storage';
import * as bip39 from 'bip39';
import { 
  Keypair, 
  PublicKey, 
  VersionedTransaction, 
  Connection, 
  Transaction, 
  TransactionMessage,
  SystemProgram,
  sendAndConfirmTransaction,
  sendAndConfirmRawTransaction,
  MessageAccountKeys,
  ComputeBudgetProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { 
  getAccount,
  getAssociatedTokenAddressSync, 
  TOKEN_PROGRAM_ID, 
  createAssociatedTokenAccountInstruction,
  createInitializeAccountInstruction,
  createSyncNativeInstruction,
  createCloseAccountInstruction,
  getOrCreateAssociatedTokenAccount
} from '@solana/spl-token';
import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';

const CONNECTION = new Connection('https://solana-rpc.publicnode.com');
// const CONNECTION = new Connection('https://api.mainnet-beta.solana.com');
const JUPITER_API_URL = 'https://lite-api.jup.ag/swap/v1/';

const ENCRYPTED_MNEMONIC_KEY = 'solanaEncryptedMnemonic';
const SALT_KEY = 'solanaSalt';
const IV_KEY = 'solanaIV';
export const PUBLIC_KEY_KEY = 'solanaPublicKey'; // Keep this as is

const WSOL_MINT = 'So11111111111111111111111111111111111111112';
const PLATFORM_FEE_ACCOUNT = '7o3QNaG84hrWhCLoAEXuiiyNfKvpGvMAyTwDb3reBram';
const PLATFORM_FEE_BPS = 20; // 0.2%
let WALLET: Keypair;

interface SolanaWallet {
  mnemonic: string;
  publicKey: string;
}

interface PrioritizationFeeData {
  low: number;
  medium: number;
  high: number;
}

export const isWalletUnlocked = (): boolean => {
  return !!WALLET;
};

export const getWalletPublicKey = (): string | null => {
  if (WALLET) {
    return WALLET.publicKey.toBase58();
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

      const seed = await bip39.mnemonicToSeed(mnemonic);
      WALLET = Keypair.fromSeed(Uint8Array.from(seed.subarray(0, 32)));
      return { mnemonic, publicKey };
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

export const signAndSendTx = async (tx: VersionedTransaction | Transaction, wallet: Keypair): Promise<string> => {
  if (tx instanceof Transaction) {
    const microLamports = (await calculatePriorityFee(tx, [wallet])).high;
    const transactionWithFee = new Transaction();

    console.log(`Setting priority fee: ${microLamports}`);
    microLamports > 0 && tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports }));
    transactionWithFee.add(...tx.instructions);

    return sendAndConfirmTransaction(
      CONNECTION,
      transactionWithFee,
      [wallet],
      { maxRetries: 0, skipPreflight: true }
    )
  }

  tx.sign([wallet]);

  const sig = await CONNECTION.sendRawTransaction(tx.serialize(), {
    maxRetries: 2, skipPreflight: true
  });

  const res = await CONNECTION.confirmTransaction(sig);
  console.log(res);

  // const latestBlockHash = await CONNECTION.getLatestBlockhash();
  // const confirmation = await CONNECTION.confirmTransaction({
  //   blockhash: latestBlockHash.blockhash,
  //   lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
  //   signature: sig
  // });

  // console.log(confirmation)

  // if (confirmation.value.err) {
  //   throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}\nhttps://solscan.io/tx/${signature}/`);
  // }

  return sig;
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

export const jupiterSwap = async (quoteResponse: any) => {
  const {inputMint, outputMint} = quoteResponse;
  const inAmount = parseInt(quoteResponse.inAmount);

  if (isNaN(inAmount)) {
    throw new Error(`Invalid inAmount`);
  }

  // if (inputMint === WSOL_MINT) {
  //   console.log('Wrapping Sols');
  //   const tx = new Transaction().add(...await wrapSOL(inAmount, WALLET));
  //   const sig = await signAndSendTx(tx, WALLET);
  //   console.log(`Wrapped Sols\n${sig}`);
  // }

  const outputMintPubKey = new PublicKey(outputMint);
  const ata = getAssociatedTokenAddressSync(
    outputMintPubKey,
    WALLET.publicKey
  );

  if (!await CONNECTION.getAccountInfo(ata)) {
    console.log(`Creating OutAmount ATA`);
    const ix = createAssociatedTokenAccountInstruction(
      WALLET.publicKey,
      ata,
      WALLET.publicKey,
      outputMintPubKey
    );
    const tx = new Transaction().add(ix);
    const sig = await signAndSendTx(tx, WALLET);
    console.log(`OutAmount ATA created\n${sig}`);
  }

  console.log(`Swapping started`);

  const { swapTransaction } = await (
    await fetch(`${JUPITER_API_URL}swap?dynamicSlippage=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: WALLET.publicKey.toBase58(),
        feeAccount: PLATFORM_FEE_ACCOUNT,
        
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
        wrapUnwrapSOL: true,
        prioritizationFeeLamports: 'auto'
        // prioritizationFeeLamports: {
        //   priorityLevelWithMaxLamports: {
        //     maxLamports: 1000000,
        //     priorityLevel: "veryHigh"
        //   }
        // }
      })
    })
  ).json();

  // deserialize the transaction
  const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
  console.log(transaction);
  const sig = await signAndSendTx(transaction, WALLET);
  console.log(sig);
};

async function wrapSOL(amountInLamports: number, wallet: Keypair): Promise<TransactionInstruction[]> {
  const WRAPPED_SOL_MINT = new PublicKey(WSOL_MINT);
  const ata = getAssociatedTokenAddressSync(WRAPPED_SOL_MINT, wallet.publicKey);
  const accInfo = await CONNECTION.getAccountInfo(ata);
  const instructions = [];

  // If WSOL token account doesn't exist, create it.
  if (!accInfo) {
    instructions.push(createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      ata,
      wallet.publicKey,
      WRAPPED_SOL_MINT
    ));
  }

  instructions.push(SystemProgram.transfer({
    fromPubkey: wallet.publicKey,
    toPubkey: ata,
    lamports: amountInLamports
  }));

  instructions.push(createSyncNativeInstruction(ata, TOKEN_PROGRAM_ID));
  return instructions;
}

// Delete on production
(window as any).unwrapWSOL = () => unwrapWSOL(WALLET);

async function unwrapWSOL(wallet: Keypair) {
  const WRAPPED_SOL_MINT = new PublicKey(WSOL_MINT);
  const wsolAccount = getAssociatedTokenAddressSync(WRAPPED_SOL_MINT, wallet.publicKey);

  const closeAccIx = createCloseAccountInstruction(
    wsolAccount,
    wallet.publicKey,
    wallet.publicKey
  );

  const tx = new Transaction().add(closeAccIx);
  const sig = await sendAndConfirmTransaction(CONNECTION, tx, [wallet]);

  console.log('✅ Unwrapped WSOL → SOL');
  console.log('Transaction signature:', sig);
}

// async function createTempWSOLAcc(mint: PublicKey, wallet: Keypair): Promise<PublicKey> {  
//   const ACCOUNT_SIZE = 165; // in bytes (standard SPL token account size)
//   const tokenAccount = Keypair.generate();
//   const rentExemption = await CONNECTION.getMinimumBalanceForRentExemption(ACCOUNT_SIZE);
  
//   const createAccountIx = SystemProgram.createAccount({
//     fromPubkey: wallet.publicKey,
//     newAccountPubkey: tokenAccount.publicKey,
//     lamports: rentExemption,
//     space: ACCOUNT_SIZE,
//     programId: TOKEN_PROGRAM_ID,
//   });
  
//   const initAccountIx = createInitializeAccountInstruction(
//     tokenAccount.publicKey,
//     mint,
//     wallet.publicKey,
//     TOKEN_PROGRAM_ID
//   );
  
//   const tx = new Transaction().add(createAccountIx, initAccountIx);
//   const sig = await sendAndConfirmTransaction(CONNECTION, tx, [wallet, tokenAccount]);
//   console.log()
// }


async function calculatePriorityFee(tx: Transaction, signers: Keypair[])
: Promise<PrioritizationFeeData> {
  const writableAccSet = new Set<string>();
  const lockedWritableAccounts: PublicKey[] = [];
  const simulationPromise = CONNECTION.simulateTransaction(tx, signers, true);

  for (const ix of tx.instructions) {
    for (const accMeta of ix.keys) {
      accMeta.isWritable && writableAccSet.add(accMeta.pubkey.toBase58());
    }
  }

  writableAccSet.forEach(id => lockedWritableAccounts.push(new PublicKey(id)));
  const [basePriorityFees, simulationResult] = await Promise.all([
    CONNECTION.getRecentPrioritizationFees({ lockedWritableAccounts }),
    simulationPromise
  ]);

  console.log(lockedWritableAccounts);
  console.log(basePriorityFees);
  console.log(simulationResult);

  let low = Number.POSITIVE_INFINITY;
  let high = 0;
  let sum = 0;

  for (const { prioritizationFee } of basePriorityFees) {
    if (prioritizationFee < low) low = prioritizationFee;
    if (prioritizationFee > high) high = prioritizationFee;
    sum += prioritizationFee;
  }

  const median = Math.ceil(sum / basePriorityFees.length);
  const cu = simulationResult.value.unitsConsumed || 1;
  return { low: low * cu, medium: median * cu, high: high * cu };
}
