import { Transaction, VersionedTransaction } from '@solana/web3.js';
import { WALLET, WSOL_MINT } from '@/services/walletService';
import { registerForPushNotificationsAsync } from '@/services/notificationService';
import {
  prepareTokenTransaction,
  submitSignedTransaction,
  getWalletAddress,
  submitSignedTransactionAndRegisterUsdt,
} from '../services/apis';
import { Buffer } from 'buffer';

const CASHWYRE_FEE_RATE = parseFloat(
  process.env.EXPO_PUBLIC_CASHWYRE_FEE_RATE!,
);

export interface SendTransactionParams {
  amount: string;
  recipient: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  cashwyreData?: {
    pushToken: string;
    cashwyreWalletAddress: string;
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
  };
}

export interface SendTransactionResult {
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

/**
 * Generic function to send tokens (SOL or SPL tokens) to a recipient
 * Now uses secure two-step process: prepare transaction on backend, sign on frontend, submit on backend
 */
export async function sendTokenTransaction(
  params: SendTransactionParams,
): Promise<SendTransactionResult> {
  const {
    amount,
    recipient,
    tokenAddress,
    tokenSymbol,
    tokenDecimals,
    cashwyreData,
  } = params;

  try {
    if (!WALLET) {
      return { success: false, error: 'Wallet is not unlocked' };
    }

    // Step 1: Prepare transaction on backend
    const prepareResult = await prepareTokenTransaction({
      amount,
      recipient,
      tokenAddress,
      tokenSymbol,
      tokenDecimals,
      sendCashwyreFee: !!cashwyreData, // True if cashwyreData exists
      senderPublicKey: WALLET.publicKey.toBase58(),
    });

    if (
      !prepareResult.success ||
      !prepareResult.transaction ||
      !prepareResult.signature
    ) {
      return {
        success: false,
        error: prepareResult.error || 'Failed to prepare transaction',
      };
    }

    // Step 2: Sign transaction on frontend
    const transactionBuffer = Buffer.from(prepareResult.transaction, 'base64');
    const transaction = VersionedTransaction.deserialize(transactionBuffer);
    // Sign the transaction with the wallet
    transaction.sign([WALLET]);
    const signedTransaction = Buffer.from(transaction.serialize()).toString(
      'base64',
    );
    // Step 3: Submit signed transaction to backend
    // If this is a Cashwyre transaction with card creation data, use the combined endpoint
    if (cashwyreData) {
      const submitResult = await submitSignedTransactionAndRegisterUsdt({
        signedTransaction: signedTransaction,
        signature: prepareResult.signature,
        blockhash: prepareResult.blockhash!,
        lastValidBlockHeight: prepareResult.lastValidBlockHeight!,
        pushToken: cashwyreData.pushToken,
        cashwyreWalletAddress: cashwyreData.cashwyreWalletAddress,
        amount: parseFloat(amount),
        userWalletAddress: cashwyreData.userWalletAddress,
        cardCreationData: cashwyreData.cardCreationData,
      });
      return submitResult;
    } else {
      // Use regular transaction submission
      const submitResult = await submitSignedTransaction({
        signedTransaction: signedTransaction,
        signature: prepareResult.signature,
        blockhash: prepareResult.blockhash!,
        lastValidBlockHeight: prepareResult.lastValidBlockHeight!,
      });
      return submitResult;
    }
  } catch (error) {
    console.error('Transaction failed:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Transaction failed. Please try again.';
    return { success: false, error: 'errorMessage' };
  }
}

/**
 * Convenience function specifically for sending USDT
 * Used in card creation process
 */
export async function sendUsdt(
  amount: string,
  recipientAddress: string,
): Promise<SendTransactionResult> {
  return sendTokenTransaction({
    amount,
    recipient: recipientAddress,
    tokenAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT mainnet address
    tokenSymbol: 'USDT',
    tokenDecimals: 6,
  });
}

/**
 * Complete USDT to Cashwyre flow:
 * 1. Get wallet address from Cashwyre
 * 2. Get push token for notifications
 * 3. Send USDT to Cashwyre wallet
 * 4. Register transaction with backend for auto card creation
 */
export async function sendUsdtToCashwyre(
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
  },
): Promise<SendTransactionResult> {
  try {
    // 1. Get wallet address from APIs
    const walletResponse = await getWalletAddress();

    if (!walletResponse.success || !walletResponse.data) {
      return { success: false, error: 'Failed to get Cashwyre wallet address' };
    }

    const walletAddress = walletResponse.data.number;

    // 2. Get push token for notifications
    let pushToken = await registerForPushNotificationsAsync();

    if (!pushToken) {
      console.warn('Failed to get push token, using fallback for development');
      // Use a fallback token for development/testing
      pushToken = `dev_token_${Date.now()}`;
    }

    console.log('Using Cashwyre wallet address:', walletAddress);

    // 3. Send USDT transaction - for production, use the combined flow
    const sendResult = await sendTokenTransaction({
      amount,
      recipient: walletAddress,
      tokenAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT mainnet address
      tokenSymbol: 'USDT',
      tokenDecimals: 6,
      cashwyreData: {
        pushToken: pushToken || '',
        cashwyreWalletAddress: walletAddress,
        userWalletAddress: WALLET?.publicKey.toBase58() || '',
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
          amountInUSD: parseFloat(amount),
        },
      },
    });

    if (!sendResult.success) {
      console.error('Failed to send USDT to cashwyre:', sendResult.error);
      return sendResult;
    }

    console.log('USDT sent successfully. Signature:', sendResult.signature);
    return sendResult;
  } catch (error) {
    console.error('Error in sendUsdtToCashwyre:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to complete USDT transfer',
    };
  }
}
