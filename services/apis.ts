// Backend API service functions
const BASE_BACKEND_URL = process.env.BASE_BACKEND_URL || 'http://localhost:3000';

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
  cardData: {
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
  };
}

export interface RegisterTransactionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function registerSwapAttempt(txSig: string) {
    return;

    // todo
    const response = await fetch(`${BASE_BACKEND_URL}/registerSwapAttempt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({

        })
    });
}

/**
 * Get Cashwyre wallet address for USDT deposits
 */
export async function getWalletAddress(): Promise<GetWalletAddressResponse> {
  try {
    const response = await fetch(`${BASE_BACKEND_URL}/api/cashwyre/wallet-address`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching wallet address:', error);
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
export async function getCardDetails(cardCode: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const response = await fetch(`${BASE_BACKEND_URL}/api/cashwyre/card-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cardCode }),
    });

    const data = await response.json();
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
