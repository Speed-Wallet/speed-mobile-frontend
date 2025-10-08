import { PaymentCard, TransactionStatus } from '@/types/cards';

/**
 * Convert transaction status to creation step number
 */
export function getCreationStepFromStatus(status: TransactionStatus): number {
  switch (status) {
    case 'confirming':
      return 1; // Waiting for USDT confirmation
    case 'verifying':
      return 2; // KYC verification in progress
    case 'creating':
      return 3; // Card creation in progress
    case 'created':
      return 4; // Card successfully created (not shown as loading)
    case 'failed':
      return 0; // Failed state
    default:
      return 1;
  }
}

/**
 * Check if transaction is in a loading state
 */
export function isTransactionLoading(status: TransactionStatus): boolean {
  return ['confirming', 'verifying', 'creating'].includes(status);
}

/**
 * Check if transaction has failed
 */
export function isTransactionFailed(status: TransactionStatus): boolean {
  return status === 'failed';
}

// In-memory storage for card creation steps
// In a real app, this could be stored in async storage or managed by the query cache
const cardCreationSteps = new Map<string, number>();

/**
 * Update the creation step for a specific card/transaction
 */
export function updateCardCreationStep(cardId: string, step: number) {
  cardCreationSteps.set(cardId, step);
}

/**
 * Get the current creation step for a card
 */
export function getCardCreationStep(cardId: string): number {
  return cardCreationSteps.get(cardId) || 1;
}

/**
 * Remove creation step tracking for a card (when completed or failed)
 */
export function removeCardCreationStep(cardId: string) {
  cardCreationSteps.delete(cardId);
}

/**
 * Clear all creation steps (for cleanup)
 */
export function clearAllCreationSteps() {
  cardCreationSteps.clear();
}

/**
 * Get all active creation steps (for debugging)
 */
export function getAllCreationSteps() {
  return Object.fromEntries(cardCreationSteps);
}

/**
 * Handle USDT received notification - advance to step 2 (KYC verification)
 */
export function handleUSDTReceived(transactionSignature: string) {
  console.log(
    '📝 USDT received, advancing to step 2 (KYC verification)',
    transactionSignature,
  );
  updateCardCreationStep(transactionSignature, 2);
}

/**
 * Handle KYC verification complete - advance to step 3 (Card creation)
 * For now, this is simulated since KYC webhook isn't implemented yet
 */
export function handleKYCVerificationComplete(transactionSignature: string) {
  console.log(
    '✅ KYC verification complete, advancing to step 3 (Card creation)',
    transactionSignature,
  );
  updateCardCreationStep(transactionSignature, 3);
}

/**
 * Handle card creation complete - remove from tracking
 */
export function handleCardCreationComplete(transactionSignature: string) {
  console.log(
    '🎉 Card creation complete, removing from tracking',
    transactionSignature,
  );
  removeCardCreationStep(transactionSignature);
}

/**
 * Handle card creation failed - remove from tracking
 */
export function handleCardCreationFailed(transactionSignature: string) {
  console.log(
    '❌ Card creation failed, removing from tracking',
    transactionSignature,
  );
  removeCardCreationStep(transactionSignature);
}

/**
 * Simulate KYC verification completion after USDT is received
 * This will be replaced by actual KYC webhook handling
 */
export function simulateKYCVerification(
  transactionSignature: string,
  delayMs: number = 3000,
) {
  console.log('🔄 Simulating KYC verification...', transactionSignature);
  setTimeout(() => {
    handleKYCVerificationComplete(transactionSignature);
  }, delayMs);
}
