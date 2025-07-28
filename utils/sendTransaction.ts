import { Transaction } from '@solana/web3.js';
import { WALLET, WSOL_MINT } from '@/services/walletService';
import { registerForPushNotificationsAsync } from '@/services/notificationService';
import { 
  prepareTokenTransaction, 
  submitSignedTransaction, 
  registerUsdtAndCreateCard,
  getWalletAddress 
} from '../services/apis';
import { Buffer } from 'buffer';

const CASHWYRE_FEE_RATE = parseFloat(process.env.EXPO_PUBLIC_CASHWYRE_FEE_RATE!)

export interface SendTransactionParams {
  amount: string;
  recipient: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  sendCashwyreFee?: boolean; // Whether to deduct platform fee from the amount
}

export interface SendTransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}

/**
 * Generic function to send tokens (SOL or SPL tokens) to a recipient
 * Now uses secure two-step process: prepare transaction on backend, sign on frontend, submit on backend
 */
export async function sendTokenTransaction(params: SendTransactionParams): Promise<SendTransactionResult> {
  const { amount, recipient, tokenAddress, tokenSymbol, tokenDecimals, sendCashwyreFee = false } = params;

  try {
    if (!WALLET) {
      return { success: false, error: "Wallet is not unlocked" };
    }

    // Step 1: Prepare transaction on backend
    const prepareResult = await prepareTokenTransaction({
      amount,
      recipient,
      tokenAddress,
      tokenSymbol,
      tokenDecimals,
      sendCashwyreFee,
      senderPublicKey: WALLET.publicKey.toBase58()
    });

    if (!prepareResult.success || !prepareResult.transaction) {
      return { success: false, error: prepareResult.error || "Failed to prepare transaction" };
    }

    // Step 2: Sign transaction on frontend
    const transactionBuffer = Buffer.from(prepareResult.transaction, 'base64');
    const transaction = Transaction.from(transactionBuffer);
    
    // Sign the transaction with the wallet
    transaction.sign(WALLET);

    // Step 3: Submit signed transaction to backend
    const submitResult = await submitSignedTransaction({
      signedTransaction: transaction.serialize().toString('base64'),
      blockhash: prepareResult.blockhash!,
      lastValidBlockHeight: prepareResult.lastValidBlockHeight!
    });

    return submitResult;

  } catch (error) {
    console.error("Transaction failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Transaction failed. Please try again.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Convenience function specifically for sending USDT
 * Used in card creation process
 */
export async function sendUSDT(amount: string, recipientAddress: string, sendCashwyreFee: boolean = false): Promise<SendTransactionResult> {
  return sendTokenTransaction({
    amount,
    recipient: recipientAddress,
    tokenAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT mainnet address
    tokenSymbol: 'USDT',
    tokenDecimals: 6,
    sendCashwyreFee // Whether to deduct platform fee from the amount
  });
}

/**
 * Complete USDT to Cashwyre flow:
 * 1. Get wallet address from Cashwyre
 * 2. Get push token for notifications
 * 3. Send USDT to Cashwyre wallet
 * 4. Register transaction with backend for auto card creation
 */
export async function sendUSDTToCashwyre(
  amount: string,
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
  }
): Promise<SendTransactionResult> {
  try {
    // 1. Get wallet address from APIs
    const walletResponse = await getWalletAddress();
    
    if (!walletResponse.success || !walletResponse.data) {
      console.log(walletResponse)
      return { success: false, error: 'Failed to get Cashwyre wallet address' };
    }

    const walletAddress = walletResponse.data.number;

    console.log('Cashwyre wallet address:', walletAddress);

    // 2. Get push token for notifications
    let pushToken = await registerForPushNotificationsAsync();
    
    if (!pushToken) {
      console.warn('Failed to get push token, using fallback for development');
      // Use a fallback token for development/testing
      pushToken = `dev_token_${Date.now()}`;
    }

    console.log('Using Cashwyre wallet address:', walletAddress);
    console.log('Using push token:', pushToken);

    // 3. Send USDT transaction
    let sendResult: SendTransactionResult;

    if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
      // Mock successful transaction for development
      console.log('🚧 DEV MODE: Using mock USDT transaction');
      sendResult = {
        success: true,
        signature: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } else {
      // Real transaction for production
      sendResult = await sendUSDT(amount, walletAddress, true);
    }
    
    if (!sendResult.success) {
      console.error('Failed to send USDT:', sendResult.error);
      return sendResult;
    }

    console.log('USDT sent successfully. Signature:', sendResult.signature);

    // 4. Register transaction with backend for auto card creation
    const registrationResult = await registerUsdtAndCreateCard({
      pushToken: pushToken || '',
      walletAddress,
      amount: parseFloat(amount),
      userWalletAddress: WALLET?.publicKey.toBase58() || '',
      transactionSignature: sendResult.signature || '',
      cardCreationData: {
        firstName: cardData.firstName,
        lastName: cardData.lastName,
        email: cardData.email,
        phoneCode: cardData.phoneCode,
        phoneNumber: cardData.phoneNumber,
        dateOfBirth: cardData.dateOfBirth,
        homeAddressNumber: cardData.homeAddressNumber,
        homeAddress: cardData.homeAddress,
        cardName: cardData.cardName,
        cardBrand: cardData.cardBrand.toLowerCase(),
        amountInUSD: parseFloat(amount)
      }
    });

    if (!registrationResult.success) {
      console.warn('Failed to register transaction for auto card creation:', registrationResult.error);
      // Don't fail the entire flow if registration fails
    } else {
      console.log('✅ Transaction registered successfully');
      if (registrationResult.cardCreation) {
        if (registrationResult.cardCreation.success) {
          console.log('🏦 Card created successfully:', registrationResult.cardCreation);
        } else {
          console.warn('⚠️ Card creation failed:', registrationResult.cardCreation.error);
        }
      }
    }

    return sendResult;
  } catch (error) {
    console.error('Error in sendUSDTToCashwyre:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to complete USDT transfer'
    };
  }
}
