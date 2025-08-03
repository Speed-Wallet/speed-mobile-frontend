// Notification types for push notifications

export interface USDTReceivedEventData {
  id: string;
  fees: string;
  hash: string;
  type: "receive";
  chain: string;
  action: "deposit";
  amount: string;
  address: string;
  channel: string;
  centFees: string;
  provider: string;
  companyId: string;
  reference: string;
  centAmount: string;
  description: string;
  confirmations: number;
}

export interface VirtualCardEventData {
  id: string;
  cardCode: string;
  CustomerFirstName: string;
  CustomerLastName: string;
  CustomerEmail: string;
  CardBrand: string;
  CardType: string;
  Reference: string;
  Last4: string;
  CardName: string;
  ExpiryOn: string;
  ValidMonthYear: string;
  Status: string;
  CardBalance: number;
  CardNumber: string;
  CVV2: string;
  BillingAddressCity: string;
  BillingAddressStreet: string;
  BillingAddressCountry: string;
  BillingAddressZipCode: string;
  BillingAddressCountryCode: string;
}

export interface KYCEventData {
  Code: string;
  CardEmail: string;
  CardFirstName: string;
  CardLastName: string;
  Country: string;
  HouseAddressNumber: string;
  HouseAddressline: string;
  DateOfBirth: string;
  Status: string;
  NumberOfCards: number;
}

export interface NotificationData {
  type: 'usdt_received' | 'card_created' | 'card_creation_failed' | 'kyc_verified' | 'kyc_failed';
  eventType: string;
  cardCode?: string; // Available for card_created notifications
  eventData?: USDTReceivedEventData | KYCEventData;
  cardData?: VirtualCardEventData;
  error?: string; // Available for card_creation_failed and kyc_failed notifications
  transactionSignature?: string; // Transaction signature for tracking creation steps
}

export interface PushNotificationContent {
  title: string;
  body: string;
  data?: NotificationData;
}