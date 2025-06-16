import { PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram } from '@solana/web3.js';
import { createTransferInstruction, getAccount, getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { CONNECTION, WALLET, WSOL_MINT } from '@/services/walletService';
import { registerForPushNotificationsAsync } from '@/services/notificationService';
import { getWalletAddress, registerUSDTTransaction, sendTestNotification } from '@/services/apis';

export interface SendTransactionParams {
  amount: string;
  recipient: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  showAlert?: boolean;
}

export interface SendTransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}

/**
 * Generic function to send tokens (SOL or SPL tokens) to a recipient
 * Extracted from send.tsx to be reusable across the app
 */
export async function sendCryptoTransaction(params: SendTransactionParams): Promise<SendTransactionResult> {
  const { amount, recipient, tokenAddress, tokenSymbol, tokenDecimals, showAlert = true } = params;

  // Validation
  if (!amount) {
    const error = "Please enter an amount to send.";
    if (showAlert) alert(error);
    return { success: false, error };
  }

  if (!recipient) {
    const error = "Please enter a recipient address.";
    if (showAlert) alert(error);
    return { success: false, error };
  }

  if (!tokenAddress) {
    const error = "Please select a token to send.";
    if (showAlert) alert(error);
    return { success: false, error };
  }

  if (!WALLET) {
    const error = "Wallet is not unlocked. Cannot perform action";
    if (showAlert) alert(error);
    console.error("Wallet is not unlocked. Cannot perform action.");
    return { success: false, error };
  }

  console.log('your wallet address: ', WALLET.publicKey.toBase58());

  try {
    if (showAlert) {
      alert(`Sending ${amount} ${tokenSymbol} to ${recipient}`);
    }

    const recipientPublicKey = new PublicKey(recipient);
    const amountInBaseUnits = Math.floor(parseFloat(amount) * Math.pow(10, tokenDecimals));

    console.log("amount base units", amountInBaseUnits);

    let transferIx;

    if (tokenAddress === WSOL_MINT) {
      // Native SOL transfer
      transferIx = SystemProgram.transfer({
        fromPubkey: WALLET.publicKey,
        toPubkey: recipientPublicKey,
        lamports: amountInBaseUnits,
      });
    } else {
      // SPL Token transfer
      const senderPublicKeyStr = WALLET.publicKey.toBase58();
      const senderPublicKey = new PublicKey(senderPublicKeyStr);

      // 1. Get sender's ATA (must exist)
      const senderATA = await getAssociatedTokenAddress(
        new PublicKey(tokenAddress),
        senderPublicKey
      );
      console.log("senderATA", senderATA.toBase58());
      
      try {
        await getAccount(CONNECTION, senderATA); // throws if doesn't exist
      } catch (e) {
        const error = "You do not have balance of this token in your wallet.";
        if (showAlert) alert(error);
        console.error("Error fetching sender's ATA:", e);
        return { success: false, error };
      }

      const tokenPublicKey = new PublicKey(tokenAddress);

      // 2. Get or create recipient's ATA (creates if missing)
      const recipientATA = await getOrCreateAssociatedTokenAccount(
        CONNECTION,
        WALLET,
        tokenPublicKey,
        recipientPublicKey
      );

      // 3. Create transfer instruction for SPL token
      transferIx = createTransferInstruction(
        senderATA,
        recipientATA.address,
        WALLET.publicKey,
        amountInBaseUnits
      );
    }

    // 4. Send transaction
    const tx = new Transaction().add(transferIx);

    const sig = await sendAndConfirmTransaction(CONNECTION, tx, [WALLET]);
    console.log("Transaction successful. Signature:", sig);
    
    if (showAlert) {
      alert(`✅ Transfer complete. Signature: ${sig}`);
    }

    return { success: true, signature: sig };

  } catch (error) {
    console.error("Transaction failed:", error);
    const errorMessage = "Transaction failed. Please try again.";
    if (showAlert) alert(errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Convenience function specifically for sending USDT
 * Used in card creation process
 */
export async function sendUSDT(amount: string, recipientAddress: string): Promise<SendTransactionResult> {
  return sendCryptoTransaction({
    amount,
    recipient: recipientAddress,
    tokenAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT mainnet address
    tokenSymbol: 'USDT',
    tokenDecimals: 6,
    showAlert: false // Don't show alerts for automated card creation
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
      sendResult = await sendUSDT(amount, walletAddress);
    }
    
    if (!sendResult.success) {
      console.error('Failed to send USDT:', sendResult.error);
      return sendResult;
    }

    console.log('USDT sent successfully. Signature:', sendResult.signature);

    // 4. Register transaction with backend for auto card creation
    const registrationResult = await registerUSDTTransaction({
      pushToken: pushToken || '',
      walletAddress,
      amount: parseFloat(amount),
      userWalletAddress: WALLET?.publicKey.toBase58() || '',
      transactionSignature: sendResult.signature || '',
      cardCreationData: {
        selectedBrand: cardData.cardBrand.toLowerCase(),
        cardName: cardData.cardName,
        personalInfo: {
          name: `${cardData.firstName} ${cardData.lastName}`,
          email: cardData.email,
          phoneNumber: cardData.phoneNumber,
          selectedCountry: {
            code: '', // Not required for card creation
            name: '', // Not required for card creation
            flag: '', // Not required for card creation
            dialCode: cardData.phoneCode
          },
          dateOfBirth: cardData.dateOfBirth,
          streetNumber: cardData.homeAddressNumber,
          address: cardData.homeAddress
        }
      }
    });

    if (!registrationResult.success) {
      console.warn('Failed to register transaction for auto card creation:', registrationResult.error);
      // Don't fail the entire flow if registration fails
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
