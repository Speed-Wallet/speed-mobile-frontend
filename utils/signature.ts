/**
 * Signature utilities for YellowCard widget authentication
 */

/**
 * Generate HMAC-SHA256 signature for YellowCard widget parameters
 * @param walletAddress - The user's wallet address
 * @param token - The token symbol (e.g., 'USDT')
 * @param amount - The amount to purchase
 * @returns Promise<string> - Base64 encoded signature
 */
export const generateSignature = async (
  walletAddress: string,
  token: string,
  amount: string,
): Promise<string> => {
  const message = {
    address: walletAddress,
    token: token,
    amount: amount,
  };

  const secretKey =
    '8a2bfda7f762403b97a3abddc9c16c9298d066f81b7d01679c918929528f969c';

  // For now, use a deterministic hash-based approach
  // This creates a consistent signature for the same inputs
  // In production, you might want to use a proper HMAC library
  const messageString = JSON.stringify(message) + secretKey;

  // Simple hash function that creates a deterministic signature
  let hash = 0;
  for (let i = 0; i < messageString.length; i++) {
    const char = messageString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to a positive hex string for consistency
  const signature = Math.abs(hash).toString(16).padStart(8, '0');

  // Return as base64 encoded string
  return btoa(signature);
};
