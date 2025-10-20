import { Transaction, VersionedTransaction } from '@solana/web3.js';
import { WALLET, WSOL_MINT } from '@/services/walletService';
import { registerForPushNotificationsAsync } from '@/services/notifications';
import {
  prepareTokenTransaction,
  submitSignedTransaction,
  getWalletAddress,
  submitSignedTransactionAndRegisterUsdt,
} from '../services/apis';
import { Buffer } from 'buffer';
import { USDT_ADDRESS } from '@/constants/popularTokens';

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

// Type for prepared send transaction
export interface PreparedSendTransaction {
  signedTransaction: string;
  signature: string;
  blockhash: string;
  lastValidBlockHeight: number;
  userPublicKey: string;
  cashwyreData?: SendTransactionParams['cashwyreData'];
}

/**
 * Prepare send transaction for preview (Step 1: Prepare and Sign)
 * This function is called when 'preview send' is pressed
 */
export async function prepareSendTransaction(
  params: SendTransactionParams,
): Promise<PreparedSendTransaction> {
  const {
    amount,
    recipient,
    tokenAddress,
    tokenSymbol,
    tokenDecimals,
    cashwyreData,
  } = params;

  if (!WALLET) {
    throw new Error('Wallet is not unlocked');
  }

  try {
    console.log('preparing send transaction');
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

    console.log('send transaction prepared: ', prepareResult);
    if (
      !prepareResult.success ||
      !prepareResult.transaction ||
      !prepareResult.signature
    ) {
      throw new Error(prepareResult.error || 'Failed to prepare transaction');
    }

    // Step 2: Sign transaction on frontend
    const transactionBuffer = Buffer.from(prepareResult.transaction, 'base64');
    const transaction = VersionedTransaction.deserialize(transactionBuffer);
    // Sign the transaction with the wallet
    transaction.sign([WALLET]);
    const signedTransaction = Buffer.from(transaction.serialize()).toString(
      'base64',
    );

    return {
      signedTransaction,
      signature: prepareResult.signature,
      blockhash: prepareResult.blockhash!,
      lastValidBlockHeight: prepareResult.lastValidBlockHeight!,
      userPublicKey: WALLET.publicKey.toBase58(),
      cashwyreData,
    };
  } catch (error) {
    console.error('Send transaction preparation error:', error);
    throw error;
  }
}

/**
 * Confirm and submit send transaction (Step 2: Submit)
 * This function is called when 'confirm send' is pressed
 */
export async function confirmSendTransaction(
  preparedTransaction: PreparedSendTransaction,
): Promise<SendTransactionResult> {
  try {
    console.log('confirming send transaction');

    // Step 3: Submit signed transaction to backend
    // If this is a Cashwyre transaction with card creation data, use the combined endpoint
    if (preparedTransaction.cashwyreData) {
      console.log('submitting cashwyre transaction');
      const submitResult = await submitSignedTransactionAndRegisterUsdt({
        signedTransaction: preparedTransaction.signedTransaction,
        signature: preparedTransaction.signature,
        blockhash: preparedTransaction.blockhash,
        lastValidBlockHeight: preparedTransaction.lastValidBlockHeight,
        pushToken: preparedTransaction.cashwyreData.pushToken,
        cashwyreWalletAddress:
          preparedTransaction.cashwyreData.cashwyreWalletAddress,
        amount: parseFloat(
          preparedTransaction.cashwyreData.cardCreationData.amountInUSD.toString(),
        ),
        userWalletAddress: preparedTransaction.cashwyreData.userWalletAddress,
        cardCreationData: preparedTransaction.cashwyreData.cardCreationData,
      });
      console.log('cashwyre transaction submitted: ', submitResult);
      return submitResult;
    } else {
      // Use regular transaction submission
      const submitResult = await submitSignedTransaction({
        signedTransaction: preparedTransaction.signedTransaction,
        signature: preparedTransaction.signature,
        blockhash: preparedTransaction.blockhash,
        lastValidBlockHeight: preparedTransaction.lastValidBlockHeight,
      });
      return submitResult;
    }
  } catch (error) {
    console.error('Send transaction confirmation error:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Transaction failed. Please try again.';
    return { success: false, error: errorMessage };
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
  const preparedTransaction = await prepareSendTransaction({
    amount,
    recipient: recipientAddress,
    tokenAddress: USDT_ADDRESS, // USDT mainnet address
    tokenSymbol: 'USDT',
    tokenDecimals: 6,
  });
  return await confirmSendTransaction(preparedTransaction);
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
    const preparedTransaction = await prepareSendTransaction({
      amount,
      recipient: walletAddress,
      tokenAddress: USDT_ADDRESS, // USDT mainnet address
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

    const sendResult = await confirmSendTransaction(preparedTransaction);

    console.log('sendResult: ', sendResult);

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
