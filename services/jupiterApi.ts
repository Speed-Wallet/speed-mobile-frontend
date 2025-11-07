import { AuthService } from './authService';

const BASE_BACKEND_URL = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;
const JUPITER_ULTRA_API = 'https://lite-api.jup.ag/ultra/v1';

// Fee configuration for Speed Wallet integrator fees
const REFERRAL_ACCOUNT = '7PK4moyxtH8wLCNtJAwXb3EmhEkAna3SzstcPNDAN3Ca'; // Speed Wallet referral account

// How Jupiter Ultra Integrator Fees Work:
// 1. Without integrator fees: Jupiter charges 5-10 bps base fee
// 2. WITH integrator fees:
//    - User pays exactly what you set as referralFee (e.g., 50 bps = 0.5%)
//    - Jupiter takes 20% of that (e.g., 10 bps = 0.1%)
//    - Speed Wallet receives 80% of that (e.g., 40 bps = 0.4%)
//    - NO additional Jupiter base fee is charged
//
// IMPORTANT: referralFee must be between 50-255 bps (0.5% - 2.55%)
// Fees accumulate in referral account and can be claimed to multisig: 3m2faWg4GnRehXzBEHCq5hKACVr6yH6fDC1odKzEAcWN

// Jupiter Ultra API response types
interface JupiterSwapInfo {
  ammKey: string;
  label: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  feeAmount: string;
  feeMint: string;
}

interface JupiterRoutePlan {
  swapInfo: JupiterSwapInfo;
  percent: number;
  bps: number;
}

export interface JupiterOrderResponse {
  mode: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: JupiterRoutePlan[];
  feeMint: string;
  feeBps: number;
  taker: string;
  gasless: boolean;
  signatureFeeLamports: number;
  transaction: string;
  prioritizationFeeLamports: number;
  rentFeeLamports: number;
  inputMint: string;
  outputMint: string;
  swapType: string;
  router: string;
  requestId: string;
  inUsdValue?: number;
  outUsdValue?: number;
  priceImpact?: number;
  swapUsdValue?: number;
  totalTime?: number;
  // Error fields
  errorCode?: number;
  errorMessage?: string;
  error?: string;
}

// Keep old interface for backwards compatibility during migration
export interface JupiterQuoteResponse extends JupiterOrderResponse {}

export interface JupiterSwapResponse {
  transaction: string;
  signature: string;
  requestId: string;
  message: string;
}

/**
 * Get an order (quote) from Jupiter Ultra API
 * This replaces the old getJupiterQuote function
 */
export const getJupiterQuote = async (
  fromMint: string,
  toMint: string,
  amount: number,
  userPublicKey: string, // Required: user's wallet address for balance validation
  referralFeeBps: number, // Required: referral fee in basis points (e.g., 50 = 0.5%)
): Promise<JupiterOrderResponse> => {
  // Ensure amount is an integer to avoid floating point issues
  const amountInt = Math.round(amount);

  const url =
    `${JUPITER_ULTRA_API}/order` +
    `?inputMint=${fromMint}` +
    `&outputMint=${toMint}` +
    `&amount=${amountInt}` +
    `&slippageBps=50` +
    `&gasless=true` +
    `&referralAccount=${REFERRAL_ACCOUNT}` +
    `&referralFee=${referralFeeBps}`;

  const response = await fetch(url);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to get Jupiter order: ${response.statusText}`);
  }

  // Check for error codes in response
  if (json.error || json.errorCode) {
    console.error('Jupiter order error:', json);
    return json; // Return error response for handling
  }

  return json;
};

export interface JupiterSwapResponse {
  transaction: string;
  signature: string;
  requestId: string;
  message: string;
}

export interface JupiterExecuteResponse {
  status: 'Success' | 'Failed' | 'Pending';
  signature?: string;
  error?: string;
  message?: string;
  slot?: string;
  code?: number;
}

/**
 * Prepare a Jupiter swap transaction via backend (gets order from Jupiter Ultra API)
 */
export const prepareJupiterSwap = async (
  quoteResponse: JupiterOrderResponse,
  platformFee: number,
  userPublicKey: string,
): Promise<JupiterSwapResponse> => {
  const token = await AuthService.getToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  // Get fresh order from backend with correct user public key
  const response = await fetch(`${BASE_BACKEND_URL}/api/jupiter/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      inputMint: quoteResponse.inputMint,
      outputMint: quoteResponse.outputMint,
      amount: parseInt(quoteResponse.inAmount),
      userPublicKey,
      slippageBps: quoteResponse.slippageBps,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to get Jupiter order: ${response.statusText}`,
    );
  }

  const orderResponse = await response.json();
  console.log('Order received from backend');
  console.log('  Request ID:', orderResponse.requestId);
  console.log('  Transaction present:', !!orderResponse.transaction);

  // Return the order response directly - it contains the transaction
  return {
    transaction: orderResponse.transaction,
    signature: '', // Will be filled after signing
    requestId: orderResponse.requestId,
    message: 'Order prepared successfully',
  };
};

/**
 * Submit a signed transaction via backend (which calls Jupiter Ultra API execute endpoint)
 */
export const submitSignedTransaction = async (
  signedTransaction: string,
  requestId: string,
): Promise<JupiterExecuteResponse> => {
  const token = await AuthService.getToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  console.log('Submitting signed transaction via backend...');
  console.log('  Request ID:', requestId);

  const response = await fetch(`${BASE_BACKEND_URL}/api/jupiter/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      signedTransaction,
      requestId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Create a more descriptive error with Jupiter error details
    const error: any = new Error(
      errorData.error || `Failed to submit transaction: ${response.statusText}`,
    );

    // Attach error metadata for better error handling
    error.details = errorData.details;
    error.code = errorData.code;
    error.status = errorData.status;

    throw error;
  }

  const result = await response.json();
  console.log('Jupiter execute response:', result);

  return result;
};
