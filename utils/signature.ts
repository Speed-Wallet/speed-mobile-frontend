/**
 * Signature utilities for YellowCard widget authentication
 * Uses manual HMAC-SHA256 implementation for compatibility
 */

/**
 * Manual HMAC-SHA256 implementation using only SHA-256 (compatible with react-native-quick-crypto)
 * This produces the exact same result as Node.js crypto.createHmac('sha256', key).update(message).digest('base64')
 */
async function createHmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  const messageBytes = encoder.encode(message);

  // HMAC constants
  const blockSize = 64; // SHA-256 block size is 64 bytes
  const ipad = 0x36;
  const opad = 0x5c;

  // Prepare key: if key is longer than blockSize, hash it first
  let processedKey: Uint8Array;
  if (keyBytes.length > blockSize) {
    const hashedKey = await crypto.subtle.digest(
      'SHA-256',
      keyBytes.buffer as ArrayBuffer,
    );
    processedKey = new Uint8Array(hashedKey);
  } else {
    processedKey = keyBytes;
  }

  // Pad key to blockSize with zeros
  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(processedKey);

  // Create inner and outer padded keys
  const innerKey = new Uint8Array(blockSize);
  const outerKey = new Uint8Array(blockSize);

  for (let i = 0; i < blockSize; i++) {
    innerKey[i] = paddedKey[i] ^ ipad;
    outerKey[i] = paddedKey[i] ^ opad;
  }

  // Inner hash: SHA256(innerKey + message)
  const innerInput = new Uint8Array(innerKey.length + messageBytes.length);
  innerInput.set(innerKey);
  innerInput.set(messageBytes, innerKey.length);
  const innerHash = await crypto.subtle.digest(
    'SHA-256',
    innerInput.buffer as ArrayBuffer,
  );

  // Outer hash: SHA256(outerKey + innerHash)
  const outerInput = new Uint8Array(outerKey.length + innerHash.byteLength);
  outerInput.set(outerKey);
  outerInput.set(new Uint8Array(innerHash), outerKey.length);
  const finalHash = await crypto.subtle.digest(
    'SHA-256',
    outerInput.buffer as ArrayBuffer,
  );

  // Convert to base64
  const hashArray = new Uint8Array(finalHash);
  let binaryString = '';
  for (let i = 0; i < hashArray.length; i++) {
    binaryString += String.fromCharCode(hashArray[i]);
  }

  return btoa(binaryString);
}

/**
 * Generate HMAC-SHA256 signature for YellowCard widget parameters
 * @param walletAddress - The user's wallet address
 * @param token - The token symbol (e.g., 'USDT')
 * @param amount - The amount to purchase (optional - removed from message if not provided)
 * @returns Promise<string> - URL-encoded base64 signature
 */
export const generateSignature = async (
  walletAddress: string,
  token: string,
): Promise<string> => {
  const message = {
    address: walletAddress,
    token: token,
  };
  const secretKey = process.env.EXPO_PUBLIC_YELLOWCARD_SECRET_KEY;

  if (!secretKey) {
    throw new Error('YellowCard secret key not configured');
  }

  try {
    // Use manual HMAC implementation
    const base64Signature = await createHmacSha256(
      secretKey,
      JSON.stringify(message),
    );

    // Return URL-encoded signature (as in your Node.js example)
    return encodeURIComponent(base64Signature);
  } catch (error) {
    console.error('Failed to generate HMAC signature:', error);
    throw new Error('Signature generation failed');
  }
};
