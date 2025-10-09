// Import PersonalInfo type from storage
import type { PersonalInfo } from '@/utils/storage';
import type {
  GetCardData,
  PaymentCard,
  CardStatus,
  GetCardsResponse,
} from '@/types/cards';
import type {
  BirdeyeTokenMarketData,
  TokenMarketDataResponse,
  HistoricalPricesResponse,
  TimeframePeriod,
} from '@/types/birdeye';
import { AuthService } from './authService';

// Backend API service functions
const BASE_BACKEND_URL = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;

// Types for API requests/responses
export interface BusinessWalletAccount {
  number: string;
  name: string;
  currency: string;
  balance: number;
  isActive: boolean;
}

export interface GetWalletAddressResponse {
  success: boolean;
  data?: BusinessWalletAccount;
  error?: string;
}

export interface RegisterTransactionResponse {
  success: boolean;
  message?: string;
  error?: string;
  transactionId?: string;
  cardCreation?: {
    success: boolean;
    error?: string;
    [key: string]: any; // For additional Cashwyre response data
  };
}

export interface PrepareTransactionRequest {
  amount: string;
  recipient: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  sendCashwyreFee?: boolean;
  senderPublicKey: string;
}

export interface PrepareTransactionResponse {
  success: boolean;
  transaction?: string; // base64 encoded unsigned transaction
  signature?: string; // base64 encoded transaction signature for verification
  blockhash?: string;
  lastValidBlockHeight?: number;
  error?: string;
}

export interface SubmitTransactionRequest {
  signedTransaction: string; // base64 encoded signed transaction
  signature: string; // base64 encoded transaction signature for verification
  blockhash: string;
  lastValidBlockHeight: number;
}

export interface SubmitTransactionResponse {
  success: boolean;
  signature?: string;
  error?: string;
  errorType?: 'TRANSACTION_SUBMISSION_FAILED' | 'REGISTRATION_FAILED';
  step?: 'transaction_submission' | 'usdt_registration';
  warning?: string;
  registrationError?: string;
  transactionId?: string;
  message?: string;
  details?: string;
}

export interface SubmitTransactionAndRegisterUsdtRequest {
  signedTransaction: string; // base64 encoded signed transaction
  signature: string; // base64 encoded transaction signature for verification
  blockhash: string;
  lastValidBlockHeight: number;
  pushToken: string;
  cashwyreWalletAddress: string;
  amount: number;
  userWalletAddress: string;
  cardCreationData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneCode: string;
    phoneNumber: string;
    dateOfBirth: string;
    homeAddressNumber: string;
    homeAddress: string;
    cardName: string;
    cardBrand: string;
    amountInUSD: number;
  };
}

/**
 * Get Cashwyre wallet address for USDT deposits
 */
export async function getWalletAddress(): Promise<GetWalletAddressResponse> {
  try {
    const url = `${BASE_BACKEND_URL}/api/cashwyre/wallet-address`;
    console.log('🌐 Calling URL:', url);

    const authHeaders = await AuthService.getAuthHeader();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error response body:', errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}. ${errorText}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('💥 Error fetching wallet address:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(
        '🔌 Network error - check if backend is running and URL is correct',
      );
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch wallet address',
    };
  }
}

/**
 * Prepare token transaction (step 1 - returns unsigned transaction)
 */
export async function prepareTokenTransaction(
  transactionData: PrepareTransactionRequest,
): Promise<PrepareTransactionResponse> {
  try {
    const authHeaders = await AuthService.getAuthHeader();
    const url = `${BASE_BACKEND_URL}/api/transaction/prepare`;
    const requestBody = JSON.stringify(transactionData);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: requestBody,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        const errorText = await response.text();
        errorData = { error: errorText };
      }

      const errorMessage =
        errorData?.error ||
        errorData?.message ||
        `HTTP ${response.status}: ${response.statusText}`;

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(
        '🔌 Network error - check if backend is running and URL is correct',
      );
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to prepare token transaction',
    };
  }
}

/**
 * Submit signed transaction (step 2 - submits signed transaction)
 */
export async function submitSignedTransaction(
  transactionData: SubmitTransactionRequest,
): Promise<SubmitTransactionResponse> {
  try {
    const authHeaders = await AuthService.getAuthHeader();
    const response = await fetch(`${BASE_BACKEND_URL}/api/transaction/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(transactionData),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting transaction:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to submit transaction',
    };
  }
}

/**
 * Submit signed transaction and register USDT (combined operation for Cashwyre)
 */
export async function submitSignedTransactionAndRegisterUsdt(
  requestData: SubmitTransactionAndRegisterUsdtRequest,
): Promise<SubmitTransactionResponse> {
  try {
    const authHeaders = await AuthService.getAuthHeader();
    const url = `${BASE_BACKEND_URL}/api/cashwyre/submit-transaction-and-register-usdt`;

    console.log('🌐 Making request to:', url);
    console.log('📋 Request data:', requestData);
    console.log('🔑 Auth headers:', authHeaders);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(requestData),
    });

    console.log('📊 Response status:', response.status);
    const data = await response.json();
    console.log('📊 Response data:', data);
    return data;
  } catch (error) {
    console.error('💥 Network error details:', error);
    // Log the actual error type
    if (error instanceof Error) {
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to submit transaction and register USDT',
    };
  }
}

/**
 * Send a test push notification
 */
export async function sendTestNotification(
  pushToken: string,
  title: string,
  body: string,
): Promise<RegisterTransactionResponse> {
  try {
    const response = await fetch(
      `${BASE_BACKEND_URL}/api/test/send-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pushToken, title, body }),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to send notification',
    };
  }
}

/**
 * Get card details by card code
 */
export async function getCard(cardCode: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  console.log('cardCode', cardCode);
  try {
    const authHeaders = await AuthService.getAuthHeader();

    const response = await fetch(
      `${BASE_BACKEND_URL}/api/cashwyre/card-details`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ cardCode }),
      },
    );

    const data = await response.json();
    console.log('📊 Card details response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching card details:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch card details',
    };
  }
}

/**
 * Get all cards for a customer
 */
export async function getCards(
  customerCode: string,
): Promise<GetCardsResponse> {
  try {
    const authHeaders = await AuthService.getAuthHeader();

    const response = await fetch(`${BASE_BACKEND_URL}/api/cashwyre/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ customerCode }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching cards:', error);
    return {
      success: false,
      message: 'Failed to fetch cards',
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch cards',
    };
  }
}

/**
 * Get pending transactions for a user (cards being created)
 */
export async function getPendingTransactions(email: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const authHeaders = await AuthService.getAuthHeader();

    const response = await fetch(
      `${BASE_BACKEND_URL}/api/cashwyre/pending-transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ email }),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching pending transactions:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch pending transactions',
    };
  }
}

/**
 * Simulate USDT received webhook (for testing)
 */
export async function simulateUSDTReceived(
  walletAddress: string,
  amount: string,
): Promise<RegisterTransactionResponse> {
  try {
    const response = await fetch(
      `${BASE_BACKEND_URL}/api/test/simulate-usdt-received`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress, amount }),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error simulating USDT received:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to simulate USDT received',
    };
  }
}

/**
 * Simulate card creation webhook (for testing)
 */
export async function simulateCardCreated(
  email: string,
  cardCode?: string,
): Promise<RegisterTransactionResponse & { cardCode?: string }> {
  try {
    const response = await fetch(
      `${BASE_BACKEND_URL}/api/test/simulate-card-created`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, cardCode }),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error simulating card creation:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to simulate card creation',
    };
  }
}

/**
 * Create a new user in the backend
 */
export async function createUser(
  username: string,
  publicKey: string,
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
}> {
  try {
    const response = await fetch(`${BASE_BACKEND_URL}/addUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        publicKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
}

// Backend API Calls
export async function registerUser(name: string, username: string) {
  const response = await fetch(`${BASE_BACKEND_URL}/registerUser`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, username }),
  });
}

export async function registerDebit(
  txSignature: string,
  blockhash: string,
  lastValidBlockHeight: number,
) {
  const response = await fetch(`${BASE_BACKEND_URL}/registerDebitAttempt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ txSignature, blockhash, lastValidBlockHeight }),
  });
}

/**
 * Simulate card creation failure webhook (for testing)
 */
export async function simulateCardCreationFailed(
  email: string,
  error?: string,
): Promise<RegisterTransactionResponse> {
  try {
    const response = await fetch(
      `${BASE_BACKEND_URL}/api/test/simulate-card-failed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          error: error || 'Test card creation failure',
        }),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error simulating card failure:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to simulate card failure',
    };
  }
}

/**
 * Convert API card data to PaymentCard format
 */
export function convertApiCardToPaymentCard(apiCard: GetCardData): PaymentCard {
  return {
    id: apiCard.code,
    type: 'virtual',
    brand: apiCard.cardBrand.toLowerCase() as 'mastercard' | 'visa',
    last4: apiCard.last4,
    cardNumber: apiCard.cardNumber,
    cvv: apiCard.cvV2,
    holder: apiCard.cardName,
    expires: apiCard.expiryOnInfo, // Format like "12/27"
    balance: apiCard.cardBalance,
    status: apiCard.status,
    // Set loading/failed states based on status
    isLoading: apiCard.status === 'new' || apiCard.status === 'pending',
    isFailed:
      apiCard.status === 'inactive' ||
      apiCard.status === 'failed' ||
      apiCard.status === 'terminated',
    failureReason:
      apiCard.status === 'inactive'
        ? 'Card is inactive'
        : apiCard.status === 'failed'
          ? 'Card creation failed'
          : apiCard.status === 'terminated'
            ? 'Card has been terminated'
            : undefined,
    createdAt: apiCard.createdOn,
  };
}

// ============================================================
// Re-export Birdeye types for convenience
// ============================================================
export type {
  BirdeyeTokenMarketData,
  TokenMarketDataResponse,
  HistoricalPricesResponse,
  TimeframePeriod,
};

/**
 * Get token market data from Birdeye API for a specific token
 * @param address - Solana token address
 * @returns Token market data including price, market cap, supply, volume, etc.
 */
export async function getTokenMarketData(
  address: string,
): Promise<TokenMarketDataResponse> {
  try {
    const authHeaders = await AuthService.getAuthHeader();

    const response = await fetch(
      `${BASE_BACKEND_URL}/api/birdeye/token-market-data?address=${address}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      },
    );

    if (!response.ok) {
      console.error('Error response from backend:', await response.json());
      throw new Error(`Backend API returned ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching token market data:', error);
    return {
      success: false,
      data: null,
      cached: false,
      timestamp: new Date().toISOString(),
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch token market data',
    };
  }
}

/**
 * Get historical price data for a specific token from Birdeye API
 * @param address - Solana token address
 * @param timeframe - Timeframe period ('1H', '1D', '7D', '1M', '1Y')
 * @returns Historical price data points for the specified timeframe
 */
export async function getHistoricalPrices(
  address: string,
  timeframe: TimeframePeriod = '1D',
): Promise<HistoricalPricesResponse> {
  try {
    const authHeaders = await AuthService.getAuthHeader();

    const response = await fetch(
      `${BASE_BACKEND_URL}/api/birdeye/historical-prices?address=${address}&timeframe=${timeframe}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    return {
      success: false,
      address,
      timeframe,
      data: { items: [] },
      cached: false,
      timestamp: new Date().toISOString(),
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch historical prices',
    };
  }
}
