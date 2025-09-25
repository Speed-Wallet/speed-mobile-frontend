import { AuthService } from './authService';

const BASE_BACKEND_URL = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;
const JUPITER_API_URL = 'https://lite-api.jup.ag/swap/v1/';

// Jupiter API response types
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
}

export interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: null | any;
  priceImpactPct: string;
  routePlan: JupiterRoutePlan[];
  contextSlot: number;
  timeTaken: number;
}

export interface JupiterSwapResponse {
  transaction: string;
  signature: string;
  blockhash: string;
  lastValidBlockHeight: number;
  message: string;
}

export interface SubmitTransactionResponse {
  signature: string;
  status: string;
  message: string;
}

/**
 * Get a quote from Jupiter for a token swap
 */
export const getJupiterQuote = async (
  fromMint: string,
  toMint: string,
  amount: number,
): Promise<JupiterQuoteResponse> => {
  const quoteQueries = [
    `inputMint=${fromMint}`,
    `outputMint=${toMint}`,
    `amount=${amount}`,
    'restrictIntermediateTokens=true',
    'dynamicSlippage=true',
  ];

  const url = `${JUPITER_API_URL}quote?${quoteQueries.join('&')}`;

  const response = await fetch(url);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to get Jupiter quote: ${response.statusText}`);
  }

  return json;
};

/**
 * Prepare a Jupiter swap transaction on the backend
 */
export const prepareJupiterSwap = async (
  quoteResponse: JupiterQuoteResponse,
  platformFee: number,
  userPublicKey: string,
): Promise<JupiterSwapResponse> => {
  const token = await AuthService.getToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${BASE_BACKEND_URL}/api/swap/jupiter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      quoteResponse,
      platformFee,
      userPublicKey,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
        `Failed to prepare Jupiter swap: ${response.statusText}`,
    );
  }

  return response.json();
};

/**
 * Submit a signed transaction to the backend
 */
export const submitSignedTransaction = async (
  signedTransaction: string,
  signature: string,
  blockhash: string,
  lastValidBlockHeight: number,
): Promise<SubmitTransactionResponse> => {
  const token = await AuthService.getToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${BASE_BACKEND_URL}/api/transaction/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      signedTransaction,
      signature,
      blockhash,
      lastValidBlockHeight,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to submit transaction: ${response.statusText}`,
    );
  }

  return response.json();
};
