// Import PersonalInfo type from storage
import type { PersonalInfo } from '@/utils/storage';
import type { GetCardData, PaymentCard, CardStatus } from '@/data/types';
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

export interface UsdtAndCreateCardRequest {
  pushToken: string;
  walletAddress: string;
  amount: number;
  userWalletAddress: string;
  transactionSignature: string;
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
  blockhash?: string;
  lastValidBlockHeight?: number;
  error?: string;
}

export interface SubmitTransactionRequest {
  signedTransaction: string; // base64 encoded signed transaction
  blockhash: string;
  lastValidBlockHeight: number;
}

export interface SubmitTransactionResponse {
  success: boolean;
  signature?: string;
  error?: string;
}

/**
 * Get Cashwyre wallet address for USDT deposits
 */
export async function getWalletAddress(): Promise<GetWalletAddressResponse> {
  try {
    const url = `${BASE_BACKEND_URL}/api/cashwyre/wallet-address`;
    console.log('🌐 Calling URL:', url);
    console.log('🔧 BASE_BACKEND_URL:', BASE_BACKEND_URL);
    
    const authHeaders = await AuthService.getAuthHeader();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    const data = await response.json();
    console.log('📊 Response data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching wallet address, check that the backend is running and url is correct:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch wallet address'
    };
  }
}

/**
 * Register USDT transaction for automatic card creation
 */
export async function registerUsdtAndCreateCard(transactionData: UsdtAndCreateCardRequest): Promise<RegisterTransactionResponse> {
  try {
    const authHeaders = await AuthService.getAuthHeader();
    
    const response = await fetch(`${BASE_BACKEND_URL}/api/cashwyre/register-usdt-and-create-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error registering USDT transaction and creating card:', error);
    throw error;
  }
}

/**
 * Prepare token transaction (step 1 - returns unsigned transaction)
 */
export async function prepareTokenTransaction(transactionData: PrepareTransactionRequest): Promise<PrepareTransactionResponse> {
  try {
    const authHeaders = await AuthService.getAuthHeader();
    
    const response = await fetch(`${BASE_BACKEND_URL}/api/transaction/prepare`, {
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
    console.error('Error preparing transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare transaction'
    };
  }
}

/**
 * Submit signed transaction (step 2 - submits signed transaction)
 */
export async function submitSignedTransaction(transactionData: SubmitTransactionRequest): Promise<SubmitTransactionResponse> {
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
      error: error instanceof Error ? error.message : 'Failed to submit transaction'
    };
  }
}

/**
 * Send a test push notification
 */
export async function sendTestNotification(pushToken: string, title: string, body: string): Promise<RegisterTransactionResponse> {
  try {
    const response = await fetch(`${BASE_BACKEND_URL}/api/test/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pushToken, title, body }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notification'
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
  console.log("cardCode", cardCode)
  try {
    const authHeaders = await AuthService.getAuthHeader();
    
    const response = await fetch(`${BASE_BACKEND_URL}/api/cashwyre/card-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ cardCode }),
    });

    const data = await response.json();
    console.log('📊 Card details response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching card details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch card details'
    };
  }
}

/**
 * Get all cards for a customer
 */
export async function getCards(customerCode: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
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
      error: error instanceof Error ? error.message : 'Failed to fetch cards'
    };
  }
}

/**
 * Simulate USDT received webhook (for testing)
 */
export async function simulateUSDTReceived(walletAddress: string, amount: string): Promise<RegisterTransactionResponse> {
  try {
    const response = await fetch(`${BASE_BACKEND_URL}/api/test/simulate-usdt-received`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress, amount }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error simulating USDT received:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to simulate USDT received'
    };
  }
}

/**
 * Simulate card creation webhook (for testing)
 */
export async function simulateCardCreated(email: string, cardCode?: string): Promise<RegisterTransactionResponse & { cardCode?: string }> {
  try {
    const response = await fetch(`${BASE_BACKEND_URL}/api/test/simulate-card-created`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, cardCode }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error simulating card creation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to simulate card creation'
    };
  }
}

/**
 * Create a new user in the backend
 */
export async function createUser(username: string, publicKey: string): Promise<{
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
        publicKey
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status
      };
    }

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    };
  }
}

// Backend API Calls
export async function registerUser(name: string, username: string) {
    const response = await fetch(`${BASE_BACKEND_URL}registerUser`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, username })
    });
}

export async function registerDebit(
    txSignature: string,
    blockhash: string, 
    lastValidBlockHeight: number
) {
    const response = await fetch(`${BASE_BACKEND_URL}registerDebitAttempt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txSignature, blockhash, lastValidBlockHeight })
    });
}

/**
 * Simulate card creation failure webhook (for testing)
 */
export async function simulateCardCreationFailed(email: string, error?: string): Promise<RegisterTransactionResponse> {
  try {
    const response = await fetch(`${BASE_BACKEND_URL}/api/test/simulate-card-failed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: email,
        error: error || 'Test card creation failure'
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error simulating card failure:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to simulate card failure'
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
    isFailed: apiCard.status === 'inactive' || apiCard.status === 'failed' || apiCard.status === 'terminated',
    failureReason: apiCard.status === 'inactive' ? 'Card is inactive' : 
                   apiCard.status === 'failed' ? 'Card creation failed' :
                   apiCard.status === 'terminated' ? 'Card has been terminated' : undefined,
  };
}

// Add these interfaces after the existing interfaces
export interface TokenPriceData {
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  address: string;
  coingeckoId: string;
  decimals: number;
  logoURI: string;
  priceData?: TokenPriceData;
}

export interface HistoricalDataPoint {
  timestamp: number;
  price: number;
  market_cap: number;
  volume: number;
}

export interface HistoricalPricesResponse {
  success: boolean;
  coinId: string;
  days: number;
  data: {
    name: string;
    symbol: string;
    address: string;
    coingeckoId: string;
    decimals: number;
    logoURI: string;
    priceData: TokenPriceData;
    historicalData: {
      prices: [number, number][];
      market_caps: [number, number][];
      total_volumes: [number, number][];
    };
  };
  cached: boolean;
  timestamp: string;
  error?: string;
}

export interface TokenPricesResponse {
  success: boolean;
  data: TokenMetadata[];
  cached: boolean;
  timestamp: string;
  error?: string;
}

/**
 * Get all token prices from the backend
 */
export async function getTokenPrices(): Promise<TokenPricesResponse> {
  try {
    const authHeaders = await AuthService.getAuthHeader();
    
    const response = await fetch(`${BASE_BACKEND_URL}/api/prices/tokens`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return {
      success: false,
      data: [],
      cached: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Failed to fetch token prices'
    };
  }
}

/**
 * Get historical price data for a specific token
 */
export async function getHistoricalPrices(coinId: string, days: number = 90): Promise<HistoricalPricesResponse> {
  try {
    const authHeaders = await AuthService.getAuthHeader();
    
    const response = await fetch(`${BASE_BACKEND_URL}/api/prices/historical?coinId=${coinId}&days=${days}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    return {
      success: false,
      coinId,
      days,
      data: {} as any,
      cached: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Failed to fetch historical prices'
    };
  }
}
