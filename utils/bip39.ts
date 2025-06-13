/*
 * Manual BIP-39 implementation in TypeScript for React Native
 * You'll need to include the English wordlist from the BIP-39 spec
 * Save the wordlist as an array of strings in a separate file (e.g., wordlists/english.ts)
 */

import { TextEncoder } from 'text-encoding';

// Wordlist import (2048 words)
import { englishWordlist as wordlist } from '../assets/wordlists/english';

// Generate cryptographically secure random bytes
function getRandomBytes(size: number): Uint8Array {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return bytes;
  }
  throw new Error('No secure random available');
}

// Convert buffer to binary string
function bytesToBinary(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(2).padStart(8, '0'))
    .join('');
}

// Derive checksum bits from entropy
async function deriveChecksumBits(entropyBuffer: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', entropyBuffer);
  const hash = new Uint8Array(hashBuffer);
  const bits = bytesToBinary(hash);
  const checksumLength = entropyBuffer.length * 8 / 32;
  return bits.slice(0, checksumLength);
}

/**
 * Generate a mnemonic phrase
 * @param strength - entropy bit length (128, 160, 192, 224, 256)
 */
export async function generateMnemonic(strength: number = 128): Promise<string> {
  if (strength % 32 !== 0 || strength < 128 || strength > 256) {
    throw new Error('Strength must be a multiple of 32 between 128 and 256');
  }

  const entropyBytes = getRandomBytes(strength / 8);
  const entropyBits = bytesToBinary(entropyBytes);
  const checksumBits = await deriveChecksumBits(entropyBytes);

  const bits = entropyBits + checksumBits;
  const chunks: string[] = [];
  for (let i = 0; i < bits.length; i += 11) {
    chunks.push(bits.slice(i, i + 11));
  }

  const words = chunks.map((binary) => {
    const index = parseInt(binary, 2);
    return wordlist[index];
  });

  return words.join(' ');
}

/**
 * Validate a mnemonic phrase
 */
export async function validateMnemonic(mnemonic: string): Promise<boolean> {
  const words = mnemonic.split(' ');
  if (![12, 15, 18, 21, 24].includes(words.length)) return false;

  const bits = words
    .map((word) => {
      const index = wordlist.indexOf(word);
      if (index === -1) throw new Error(`Word not in list: ${word}`);
      return index.toString(2).padStart(11, '0');
    })
    .join('');

  const dividerIndex = (bits.length * 32) / 33;
  const entropyBits = bits.slice(0, dividerIndex);
  const checksumBits = bits.slice(dividerIndex);

  const entropyBytes = new Uint8Array(entropyBits.match(/.{1,8}/g)!.map((bin) => parseInt(bin, 2)));
  const newChecksum = await deriveChecksumBits(entropyBytes);
  return newChecksum === checksumBits;
}

/**
 * Convert mnemonic to seed (PBKDF2 with HMAC-SHA512)
 * @param mnemonic - mnemonic phrase
 * @param password - optional passphrase
 */
export async function mnemonicToSeed(
  mnemonic: string,
  password: string = ''
): Promise<Uint8Array> {
  const mnemonicBuffer = new TextEncoder().encode(mnemonic.normalize('NFKD'));
  const saltBuffer = new TextEncoder().encode('mnemonic' + password.normalize('NFKD'));

  const key = await crypto.subtle.importKey(
    'raw',
    mnemonicBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 2048,
      hash: 'SHA-512',
    },
    key,
    512
  );

  return new Uint8Array(derivedBits);
}