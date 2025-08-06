import { Keypair } from '@solana/web3.js';
import { mnemonicToSeed } from './bip39';
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha2';

/**
 * Generate BIP44 derivation path for Solana (Phantom/Solflare compatible)
 * m/44'/501'/0'/walletIndex'
 *
 * @param walletIndex The wallet index (0, 1, 2, etc.) - increments the last digit
 * @returns Solana BIP44 derivation path compatible with Phantom/Solflare
 */
export function getSolanaDerivationPath(walletIndex: number = 0): string {
  return `m/44'/501'/0'/${walletIndex}'`;
}

/**
 * Custom BIP44 key derivation implementation using HMAC-SHA512
 * This is a complete implementation that matches standard BIP44 behavior
 *
 * @param seed The master seed from mnemonic
 * @param path The derivation path components [44, 501, accountIndex, change]
 * @returns A derived private key for creating the keypair
 */
export function deriveKeyFromPath(
  seed: Uint8Array,
  walletIndex: number,
): Uint8Array {
  // Phantom/Solflare compatible path: m/44'/501'/0'/walletIndex'
  // All levels are hardened derivation

  const path = [
    0x8000002c, // 44' (44 + 0x80000000 for hardened)
    0x800001f5, // 501' (501 + 0x80000000 for hardened)
    0x80000000, // 0' (0 + 0x80000000 for hardened)
    0x80000000 + walletIndex, // walletIndex' (walletIndex + 0x80000000 for hardened)
  ];

  // Start with master key generation
  let key = hmacSha512(Buffer.from('ed25519 seed', 'utf8'), seed);
  let chainCode = new Uint8Array(key.slice(32));
  let privateKey = new Uint8Array(key.slice(0, 32));

  // Derive through the path
  for (const index of path) {
    const result = deriveChild(privateKey, chainCode, index);
    privateKey = new Uint8Array(result.key);
    chainCode = new Uint8Array(result.chainCode);
  }

  return privateKey;
}

/**
 * Derive a child key from parent key and chain code
 */
function deriveChild(
  parentKey: Uint8Array,
  chainCode: Uint8Array,
  index: number,
): { key: Uint8Array; chainCode: Uint8Array } {
  const isHardened = (index & 0x80000000) !== 0;

  let data: Uint8Array;
  if (isHardened) {
    // Hardened derivation: use 0x00 + parent_private_key + index
    data = new Uint8Array(37);
    data[0] = 0x00;
    data.set(parentKey, 1);
    data.set(indexToBytes(index), 33);
  } else {
    // Non-hardened derivation: use public_key + index
    // For ed25519, we need to derive the public key from private key
    const publicKey = getPublicKeyFromPrivate(parentKey);
    data = new Uint8Array(37);
    data.set(publicKey, 0);
    data.set(indexToBytes(index), 33);
  }

  const hmac = hmacSha512(chainCode, data);
  const childKey = new Uint8Array(hmac.slice(0, 32));
  const childChainCode = new Uint8Array(hmac.slice(32));

  return {
    key: childKey,
    chainCode: childChainCode,
  };
}

/**
 * HMAC-SHA512 implementation using @noble/hashes
 */
function hmacSha512(key: Uint8Array | Buffer, data: Uint8Array): Uint8Array {
  return hmac(sha512, key, data);
}

/**
 * Convert 32-bit index to 4-byte array (big-endian)
 */
function indexToBytes(index: number): Uint8Array {
  const bytes = new Uint8Array(4);
  bytes[0] = (index >>> 24) & 0xff;
  bytes[1] = (index >>> 16) & 0xff;
  bytes[2] = (index >>> 8) & 0xff;
  bytes[3] = index & 0xff;
  return bytes;
}

/**
 * Get public key from private key for ed25519
 * This is a simplified version that works with Solana's key format
 */
function getPublicKeyFromPrivate(privateKey: Uint8Array): Uint8Array {
  // Create a temporary keypair to get the public key
  // This leverages Solana's built-in ed25519 implementation
  const tempKeypair = Keypair.fromSeed(privateKey);
  return tempKeypair.publicKey.toBytes();
}

/**
 * Create a Solana keypair from mnemonic and derivation path
 *
 * @param mnemonic The master mnemonic phrase
 * @param walletIndex The wallet index for derivation (0, 1, 2, etc.) - increments last digit
 * @returns A Solana Keypair
 */
export async function createKeypairFromMnemonic(
  mnemonic: string,
  walletIndex: number = 0,
): Promise<Keypair> {
  const seed = await mnemonicToSeed(mnemonic);
  const derivedKey = deriveKeyFromPath(seed, walletIndex);
  return Keypair.fromSeed(derivedKey);
}

/**
 * Get the next available wallet index for a master mnemonic
 *
 * @param existingWallets Array of existing wallet items
 * @param masterMnemonic The master mnemonic to check against
 * @returns The next available wallet index (for last digit of derivation path)
 */
export function getNextAccountIndex(
  existingWallets: any[],
  masterMnemonic: string,
): number {
  // Filter wallets that use the same master mnemonic or have derivation paths
  const relatedWallets = existingWallets.filter(
    (wallet) =>
      wallet.masterMnemonic === masterMnemonic ||
      (wallet.derivationPath &&
        wallet.derivationPath.startsWith("m/44'/501'/0'/")),
  );

  if (relatedWallets.length === 0) {
    return 0; // First wallet (m/44'/501'/0'/0')
  }

  // Find the highest wallet index (last digit in path)
  let maxIndex = -1;
  relatedWallets.forEach((wallet) => {
    if (wallet.accountIndex !== undefined) {
      maxIndex = Math.max(maxIndex, wallet.accountIndex);
    }
  });

  return maxIndex + 1;
}
