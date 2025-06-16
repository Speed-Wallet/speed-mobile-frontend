import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PaymentCard {
  id: string;
  type: 'virtual' | 'physical';
  brand: 'mastercard' | 'visa';
  last4: string;
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
  // Card operations
  async saveCards(cards: PaymentCard[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    } catch (error) {
      console.error('Error saving cards:', error);
    }
  },

  async loadCards(): Promise<PaymentCard[]> {
    try {
      const cardsJson = await AsyncStorage.getItem(STORAGE_KEYS.CARDS);
      return cardsJson ? JSON.parse(cardsJson) : [];
    } catch (error) {
      console.error('Error loading cards:', error);
      return [];
    }
  },

  // Personal info operations
  async savePersonalInfo(info: PersonalInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PERSONAL_INFO, JSON.stringify(info));
    } catch (error) {
      console.error('Error saving personal info:', error);
    }
  },

  async loadPersonalInfo(): Promise<PersonalInfo | null> {
    try {
      const infoJson = await AsyncStorage.getItem(STORAGE_KEYS.PERSONAL_INFO);
      return infoJson ? JSON.parse(infoJson) : null;
    } catch (error) {
      console.error('Error loading personal info:', error);
      return null;
    }
  },
};
