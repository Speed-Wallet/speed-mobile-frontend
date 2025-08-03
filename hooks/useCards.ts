import { useQuery } from '@tanstack/react-query';
import { getCards, getPendingTransactions, convertApiCardToPaymentCard } from '@/services/apis';
import { PaymentCard } from '@/data/types';
import { getCardCreationStep } from '@/services/cardCreationSteps';

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
    balance: 2500.00,
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
    balance: 500.00,
    isLoading: true,
    creationStep: 2, // Show KYC verification step
    createdAt: new Date().toISOString(),
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
          getPendingTransactions(email)
        ]);
        
        let allCards: PaymentCard[] = [];
        
        // Add completed cards (only active ones)
        if (cardsResponse.success && cardsResponse.data) {
          const paymentCards = cardsResponse.data
            .filter(card => card.status === 'active')
            .map(convertApiCardToPaymentCard);
          allCards = paymentCards;
        }
        
        // Add pending cards (loading state) with creation steps
        if (pendingResponse.success && pendingResponse.data) {
          const pendingCardsWithSteps = pendingResponse.data.map((card: PaymentCard) => ({
            ...card,
            creationStep: getCardCreationStep(card.id)
          }));
          allCards = [...allCards, ...pendingCardsWithSteps];
        }
        
        // In development mode, show demo cards if no real cards exist
        if (process.env.EXPO_PUBLIC_APP_ENV === 'development' && allCards.length === 0) {
          allCards = initialCards;
        }
        
        // Sort cards: pending/loading cards first, then by createdAt (newest first)
        allCards.sort((a, b) => {
          // Pending cards should come first
          if (a.isLoading && !b.isLoading) return -1;
          if (!a.isLoading && b.isLoading) return 1;
          
          // If both are same type, sort by createdAt (newest first)
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          
          // Fallback to balance if no createdAt
          return (b.balance || 0) - (a.balance || 0);
        });
        
        return allCards;
      } catch (error) {
        console.error('Error fetching cards:', error);
        // In development mode, show demo cards if API fails
        if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
          return initialCards;
        }
        return [];
      }
    },
    enabled: !!email, // Only run query if email is provided
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};
