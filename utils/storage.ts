import { MMKVStorage } from './mmkvStorage';

export interface PaymentCard {
  id: string;
  type: 'virtual' | 'physical';
  brand: 'mastercard' | 'visa';
  last4: string;
  cardNumber?: string; // Full card number (optional for backward compatibility)
  cvv?: string; // CVV code (optional for backward compatibility)
  holder: string;
  expires: string;
  balance: number;
  isLoading?: boolean; // Optional loading state for temporary cards
  isFailed?: boolean; // Optional failed state for failed card creation
  failureReason?: string; // Optional failure reason for failed cards
}

export interface PersonalInfo {
  name: string; // This will store the combined first + last name
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  streetNumber: string;
  selectedCountry: {
    code: string;
    name: string;
    flag: string;
    dialCode: string;
  };
}

const STORAGE_KEYS = {
  CARDS: 'payment_cards',
  PERSONAL_INFO: 'personal_info',
};

export const StorageService = {
  // Card operations - now synchronous with MMKV!
  saveCards(cards: PaymentCard[]): void {
    try {
      MMKVStorage.setObject(STORAGE_KEYS.CARDS, cards);
    } catch (error) {
      console.error('Error saving cards:', error);
    }
  },

  loadCards(): PaymentCard[] {
    try {
      return MMKVStorage.getObject<PaymentCard[]>(STORAGE_KEYS.CARDS) || [];
    } catch (error) {
      console.error('Error loading cards:', error);
      return [];
    }
  },

  // Personal info operations - now synchronous with MMKV!
  savePersonalInfo(info: PersonalInfo): void {
    try {
      MMKVStorage.setObject(STORAGE_KEYS.PERSONAL_INFO, info);
    } catch (error) {
      console.error('Error saving personal info:', error);
    }
  },

  loadPersonalInfo(): PersonalInfo | null {
    try {
      return MMKVStorage.getObject<PersonalInfo>(STORAGE_KEYS.PERSONAL_INFO);
    } catch (error) {
      console.error('Error loading personal info:', error);
      return null;
    }
  },
};
