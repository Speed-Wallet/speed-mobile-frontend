// Type for entries directly from cryptos.json
export interface TokenJsonEntry {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  decimalsShown: number; // Changed to be non-optional
  logoURI: string;
  tags?: string[];
  daily_volume?: number;
  created_at: string;
  freeze_authority: string | null;
  mint_authority: string | null;
  permanent_delegate: string | null;
  minted_at: string | null;
  extensions: {
    coingeckoId: string;
  };
}

export interface TokenEntry extends TokenJsonEntry {
  color: string;
  // decimalsShown is inherited from TokenJsonEntry
}

export interface EnrichedTokenEntry extends TokenEntry {
  priceChangePercentage: number;
  balance: number;
  price: number;
  description: string;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  maxSupply?: number;
  // decimalsShown is inherited from TokenEntry -> TokenJsonEntry
}

// Card status types
export type CardStatus =
  | 'new'
  | 'active'
  | 'inactive'
  | 'failed'
  | 'pending'
  | 'terminated';

// Transaction status for pending cards
export type TransactionStatus =
  | 'confirming' // USDT payment pending
  | 'verifying' // KYC verification in progress
  | 'creating' // Card creation in progress
  | 'created' // Card successfully created
  | 'failed'; // Process failed at any step

// Get Card API types (matching backend)
export interface GetCardData {
  code: string;
  customerName: string;
  customerCode: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  cardBrand: string;
  cardType: string;
  reference: string;
  last4: string;
  cardName: string;
  expiryOn: string;
  expiryOnInfo: string;
  expiryOnMaxked: string;
  validMonthYear: string;
  status: CardStatus;
  cardBalance: number;
  cardBalanceInfo: string;
  cardNumber: string;
  cardNumberMaxked: string | null;
  cvV2: string;
  cvV2Maxed: string;
  billingAddressCity: string;
  billingAddressStreet: string;
  billingAddressCountry: string;
  billingAddressZipCode: string;
  billingAddressCountryCode: string;
  createdOn: string;
}

export interface GetCardsResponse {
  success: boolean;
  message: string;
  data: GetCardData[];
  error?: string;
}

// PaymentCard interface for the frontend (maps from GetCardData)
export interface PaymentCard {
  id: string; // Maps to code
  type: 'virtual';
  brand: 'mastercard' | 'visa';
  last4: string;
  cardNumber?: string;
  cvv?: string;
  holder: string; // Maps to cardName
  cardName?: string; // Additional card name property
  expires: string; // Maps to expiryOnInfo
  balance: number; // Maps to cardBalance
  isLoading?: boolean;
  isFailed?: boolean;
  status?: CardStatus;
  transactionStatus?: TransactionStatus; // Status from pending transactions
  failureReason?: string;
  createdAt?: string; // Maps to createdOn from API or createdAt from pending transactions
  creationStep?: number; // Current step in the creation process (1-3) - derived from transactionStatus
}
