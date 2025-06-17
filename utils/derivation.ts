import { Keypair } from '@solana/web3.js';
import { mnemonicToSeed } from './bip39';

/**
 * Generate BIP44 derivation path for Solana
 * m/44'/501'/account'/change'
 * 
 * @param accountIndex The account index (0, 1, 2, etc.)
 * @param change Optional change index (default: 0)
 * @returns Solana BIP44 derivation path
 */
export function getSolanaDerivationPath(accountIndex: number, change: number = 0): string {
  return `m/44'/501'/${accountIndex}'/${change}'`;
}

/**
 * Derive a private key from a BIP44 derivation path
 * This is a simplified implementation that uses the account index to derive different keys
 * 
 * @param seed The master seed from mnemonic
 * @param accountIndex The account index
 * @returns A derived seed for creating the keypair
 */
export function deriveKeyFromPath(seed: Uint8Array, accountIndex: number): Uint8Array {
  // Simple derivation: Use the account index to modify the seed
  // This creates different keys from the same seed phrase
  const derivedSeed = new Uint8Array(32);
  
  // Copy the first 32 bytes of the master seed
  for (let i = 0; i < 32; i++) {
    derivedSeed[i] = seed[i];
  }
  
  // Modify the seed based on account index to create unique keys
  // XOR the account index into the seed at different positions
  const accountBytes = new Uint8Array(4);
  accountBytes[0] = (accountIndex >>> 24) & 0xFF;
  accountBytes[1] = (accountIndex >>> 16) & 0xFF;
  accountBytes[2] = (accountIndex >>> 8) & 0xFF;
  accountBytes[3] = accountIndex & 0xFF;
  
  // XOR account bytes at different positions in the seed
  for (let i = 0; i < 4; i++) {
    derivedSeed[i] ^= accountBytes[i];
    derivedSeed[i + 8] ^= accountBytes[i];
    derivedSeed[i + 16] ^= accountBytes[i];
    derivedSeed[i + 24] ^= accountBytes[i];
  }
  
  return derivedSeed;
}

/**
 * Create a Solana keypair from mnemonic and derivation path
 * 
 * @param mnemonic The master mnemonic phrase
 * @param accountIndex The account index for derivation (0, 1, 2, etc.)
 * @returns A Solana Keypair
 */
export async function createKeypairFromMnemonic(mnemonic: string, accountIndex: number = 0): Promise<Keypair> {
  const seed = await mnemonicToSeed(mnemonic);
  const derivedSeed = deriveKeyFromPath(seed, accountIndex);
  return Keypair.fromSeed(derivedSeed);
}

/**
 * Get the next available account index for a master mnemonic
 * 
 * @param existingWallets Array of existing wallet items
 * @param masterMnemonic The master mnemonic to check against
 * @returns The next available account index
 */
export function getNextAccountIndex(existingWallets: any[], masterMnemonic: string): number {
  // Filter wallets that use the same master mnemonic
  const relatedWallets = existingWallets.filter(wallet => 
    wallet.masterMnemonic === masterMnemonic || 
    (wallet.derivationPath && wallet.derivationPath.startsWith("m/44'/501'/"))
  );
  
  if (relatedWallets.length === 0) {
    return 0; // First wallet
  }
  
  // Find the highest account index
  let maxIndex = -1;
  relatedWallets.forEach(wallet => {
    if (wallet.accountIndex !== undefined) {
      maxIndex = Math.max(maxIndex, wallet.accountIndex);
    }
  });
  
  return maxIndex + 1;
}
