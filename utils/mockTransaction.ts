import { SendTransactionResult } from './sendTransaction';
import { getWalletAddress } from '@/services/apis';
import { registerForPushNotificationsAsync } from '@/services/notifications';
import { WALLET } from '@/services/walletService';

export interface MockSendUsdtParams {
  amount: string;
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
  simulationType?: 'simulate_usdt_failed' | 'simulate_card_failed';
  cardBalance?: number; // The card balance amount (used to calculate 1% fee)
}

/**
 * Mock USDT send function for development mode
 * Handles all development-specific logic including simulation types
 * Also handles wallet address fetching and transaction registration
 */
export async function mockSendUsdtToCashwyre(
  params: MockSendUsdtParams,
): Promise<SendTransactionResult> {
  const { amount, cardData, simulationType } = params;

  console.log('🧪 DEV MODE: Mock USDT transaction starting...');
  console.log('📋 Simulation type:', simulationType || 'normal');

  try {
    // 1. Get wallet address from APIs (same as production)
    const walletResponse = await getWalletAddress();

    if (!walletResponse.success || !walletResponse.data) {
      console.log(walletResponse);
      return { success: false, error: 'Failed to get Cashwyre wallet address' };
    }

    const walletAddress = walletResponse.data.number;
    console.log('🧪 DEV: Using Cashwyre wallet address:', walletAddress);

    // 2. Get push token for notifications (same as production)
    let pushToken = await registerForPushNotificationsAsync();

    if (!pushToken) {
      console.warn('Failed to get push token, using fallback for development');
      pushToken = `dev_token_${Date.now()}`;
    }

    console.log('🧪 DEV: Using push token:', pushToken);

    // 3. Simulate USDT transaction failure if requested
    if (simulationType === 'simulate_usdt_failed') {
      console.log('🧪 DEV MODE: Simulating USDT send failure...');
      return {
        success: false,
        error: 'Simulated USDT transaction failure',
        signature: undefined,
      };
    }

    // For all other cases (normal flow and card creation failure),
    // simulate successful USDT transaction
    console.log('🧪 DEV MODE: Simulating successful USDT transaction...');

    // Generate mock signature
    const mockSignature = `dev_mock_signature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(
      '🧪 DEV: Mock USDT sent successfully. Signature:',
      mockSignature,
    );

    // 4. In development, we'll skip the registration for now since the user said not to worry about dev flow
    console.log('🧪 DEV: Skipping registration in development mode for now');

    return {
      success: true,
      signature: mockSignature,
      error: undefined,
    };
  } catch (error) {
    console.error('🧪 DEV: Error in mock USDT transaction:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to complete mock USDT transfer',
    };
  }
}
