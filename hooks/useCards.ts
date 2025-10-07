import { useQuery } from '@tanstack/react-query';
import {
  getCards,
  getPendingTransactions,
  convertApiCardToPaymentCard,
} from '@/services/apis';
import { PaymentCard } from '@/data/types';
import {
  getCreationStepFromStatus,
  isTransactionLoading,
  isTransactionFailed,
} from '@/utils/cardCreationSteps';
import { CACHE_TIME } from '@/constants/cache';

// Demo cards for development mode
const initialCards: PaymentCard[] = [
  {
    id: '1',
    type: 'virtual',
    brand: 'mastercard',
    last4: '4242',
    cardNumber: '5555555555554242', // Full card number for testing
    cvv: '123', // CVV code for testing
    holder: 'TRISTAN',
    cardName: 'Personal Card',
    expires: '12/25',
    balance: 2500.0,
    createdAt: new Date().toISOString(),
  },
  // Add a loading card for demo purposes
  {
    id: 'demo-loading',
    type: 'virtual',
    brand: 'visa',
    last4: '0000',
    holder: 'DEMO USER',
    cardName: 'Demo Loading Card',
    expires: '12/25',
    balance: 500.0,
    isLoading: true,
    creationStep: 2, // Show KYC verification step
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  // Add a failed card for demo purposes
  {
    id: 'demo-failed',
    type: 'virtual',
    brand: 'mastercard',
    last4: '0000',
    holder: 'DEMO USER',
    cardName: 'Demo Failed Card',
    expires: '12/25',
    balance: 100.0,
    isFailed: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // Failed 10 minutes ago
  },
];

export const useCards = (email: string | null) => {
  return useQuery({
    queryKey: ['cards', email],
    queryFn: async (): Promise<PaymentCard[]> => {
      if (!email) {
        return [];
      }

      try {
        // Fetch both completed and pending cards in parallel
        const [cardsResponse, pendingResponse] = await Promise.all([
          getCards(email),
          getPendingTransactions(email),
        ]);

        let allCards: PaymentCard[] = [];

        // Add completed cards (only active ones)
        if (cardsResponse.success && cardsResponse.data) {
          const paymentCards = cardsResponse.data
            .filter((card) => card.status === 'active')
            .map(convertApiCardToPaymentCard);
          allCards = paymentCards;
        }

        // Add pending cards (loading state) with creation steps based on status
        if (pendingResponse.success && pendingResponse.data) {
          const pendingCardsWithSteps = pendingResponse.data.map(
            (card: any) => ({
              ...card,
              transactionStatus: card.status, // Use status from backend
              isLoading: isTransactionLoading(card.status),
              isFailed: isTransactionFailed(card.status),
              creationStep: getCreationStepFromStatus(card.status),
            }),
          );
          allCards = [...allCards, ...pendingCardsWithSteps];
        }

        // In development mode, show demo cards if no real cards exist
        if (
          process.env.EXPO_PUBLIC_APP_ENV === 'development' &&
          allCards.length === 0
        ) {
          allCards = initialCards;
        }

        // Sort cards by recency (most recent at the top), regardless of status
        allCards.sort((a, b) => {
          // Use updatedAt if available (for status changes), otherwise fall back to createdAt
          const timeA = a.updatedAt || a.createdAt;
          const timeB = b.updatedAt || b.createdAt;

          if (timeA && timeB) {
            return new Date(timeB).getTime() - new Date(timeA).getTime();
          }

          // If one has a time and the other doesn't, prioritize the one with time
          if (timeA && !timeB) return -1;
          if (!timeA && timeB) return 1;

          // Fallback to balance if no timestamps
          return (b.balance || 0) - (a.balance || 0);
        });

        return allCards;
      } catch (error) {
        console.error('Error fetching cards:', error);
        return [];
      }
    },
    enabled: !!email, // Only run query if email is provided
    staleTime: CACHE_TIME.CARDS.STALE_TIME,
    gcTime: CACHE_TIME.CARDS.GC_TIME,
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchInterval: CACHE_TIME.CARDS.REFETCH_INTERVAL,
  });
};
