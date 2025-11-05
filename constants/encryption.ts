/**
 * Encryption constants for wallet security
 * These values are shared across all wallet-related encryption/decryption operations
 */

// PBKDF2 iteration count - optimized for mobile performance while maintaining security
// 2,500 iterations provides good security for 6-digit PINs on mobile devices
// while offering ~2x faster encryption/decryption compared to 5,000 iterations
export const PBKDF2_ITERATION_COUNT = 2500;

// AES key size in words (256-bit key = 8 words of 32 bits each)
export const AES_KEY_SIZE = 256 / 32; // 8 words = 256 bits
