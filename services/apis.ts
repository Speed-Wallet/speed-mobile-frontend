// Import PersonalInfo type from storage
import type { PersonalInfo } from '@/utils/storage';
import type { GetCardData, PaymentCard, CardStatus } from '@/data/types';

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

export interface USDTTransactionRequest {
  pushToken: string;
  walletAddress: string;
  amount: number;
  userWalletAddress: string;
  transactionSignature: string;
  cardCreationData?: {
    selectedBrand: string;
    cardName: string;
    personalInfo?: PersonalInfo;
  };
}

export interface RegisterTransactionResponse {
  success: boolean;
  message?: string;
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
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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
export async function registerUSDTTransaction(transactionData: USDTTransactionRequest): Promise<RegisterTransactionResponse> {
  try {
    const response = await fetch(`${BASE_BACKEND_URL}/api/cashwyre/register-usdt-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error registering USDT transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register transaction'
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
    const response = await fetch(`${BASE_BACKEND_URL}/api/cashwyre/card-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    const response = await fetch(`${BASE_BACKEND_URL}/api/cashwyre/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

export async function registerSwap(
    signature: string,
    blockHash: string, 
    lastValidBlockHeight: number
) {
    try {
        await fetch(`${BASE_BACKEND_URL}registerSwap`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ signature, blockHash, lastValidBlockHeight })
        });
    } catch (err) {
        // todo 
        // retry logic
    }
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
