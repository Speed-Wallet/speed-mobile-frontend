import { PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram } from '@solana/web3.js';
import { createTransferInstruction, getAccount, getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { CONNECTION, WALLET, WSOL_MINT } from '@/services/walletService';

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
