import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, CreditCard, DollarSign, User, Eye, EyeOff } from 'lucide-react-native';
import { router } from 'expo-router';
import { StorageService, PaymentCard } from '@/utils/storage';
import { sendUSDT } from '@/utils/sendTransaction';

// Constants
const BUSINESS_CODE = "C4B20250607000033";
const CASHWYRE_BASE_URL = "https://businessapi.cashwyre.com/api/v1.0";

// API Response Types
interface CreateCardResponse {
  CustomerId: string;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneCode: string;
  PhoneNumber: string;
  Country: string;
  DateOfBirth: string;
  CreatedOn: string;
  Status: string;
  HomeAddressNumber: string;
  HomeAddress: string;
  // Possible card code fields (API might return any of these)
  cardCode?: string;
  code?: string;
  CardCode?: string;
}

interface CardDetailsResponse {
  code: string;
  customerName: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  cardBrand: 'visa' | 'mastercard';
  cardType: 'virtual' | 'physical';
  reference: string;
  last4: string;
  cardName: string;
  expiryOn: string;
  expiryOnInfo: string;
  expiryOnMaxked: string;
  validMonthYear: string;
  status: string;
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

const initialCards: PaymentCard[] = [
  {
    id: '1',
    type: 'virtual',
    brand: 'mastercard',
    last4: '4242',
    holder: 'TRISTAN',
    expires: '12/25',
    balance: 2500.00,
  },
];

const generateRequestId = () => {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
};

const fetchWalletAddress = async () => {
  try {
    const requestBody = {
      appId: BUSINESS_CODE,
      requestId: generateRequestId(),
      businessCode: BUSINESS_CODE,
      currency: "USD",
      assetNetwork: "SOLANA"
    };

    const response = await fetch(`${CASHWYRE_BASE_URL}/Wallet/getFundwalletAccountInfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `bearer ${BUSINESS_CODE}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("response", response)
    const data = await response.json();
    console.log("data", data)
    if (data.success && data.data && data.data.businessWalletAccount) {
      return data.data.businessWalletAccount.number;
    } else {
      throw new Error(data.message || 'Failed to fetch wallet address');
    }
  } catch (error) {
    console.error('Error fetching wallet address:', error);
    throw error;
  }
};

const createCard = async (cardBrand: 'mastercard' | 'visa', amountInUSD: number, customCardName: string): Promise<CreateCardResponse> => {
  try {
    // Load personal info from KYC persistent storage
    const personalInfo = await StorageService.loadPersonalInfo();
    if (!personalInfo) {
      throw new Error('Personal information not found. Please complete KYC verification first.');
    }

    // Split the name into first and last name
    const nameParts = personalInfo.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const requestBody = {
      appId: BUSINESS_CODE,
      requestId: generateRequestId(),
      businessCode: BUSINESS_CODE,
      firstName: firstName,
      lastName: lastName,
      email: personalInfo.email,
      phoneCode: personalInfo.selectedCountry.dialCode,
      phoneNumber: personalInfo.phoneNumber,
      dateOfBirth: personalInfo.dateOfBirth,
      homeAddressNumber: personalInfo.streetNumber,
      homeAddress: personalInfo.address,
      cardName: customCardName, // Use the required custom name
      cardType: "Virtual",
      cardBrand: cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1).toLowerCase(), // Capitalize first letter
      amountInUSD: amountInUSD
    };

    // TODO use tanstack with retries
    const response = await fetch(`${CASHWYRE_BASE_URL}/Card/createCard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `bearer ${BUSINESS_CODE}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("createCard response", response);
    const data = await response.json();
    console.log("createCard data", data);
    
    if (data.success && data.data) {
      return data.data as CreateCardResponse;
    } else {
      throw new Error(data.message || 'Failed to create card');
    }
  } catch (error) {
    console.error('Error creating card:', error);
    throw error;
  }
};

const fetchCardDetails = async (cardCode: string): Promise<CardDetailsResponse> => {
  try {
    const requestBody = {
      appId: BUSINESS_CODE,
      requestId: generateRequestId(),
      cardCode: cardCode,
      businessCode: BUSINESS_CODE
    };

    const response = await fetch(`${CASHWYRE_BASE_URL}/Card/getCardDetails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `bearer ${BUSINESS_CODE}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("fetchCardDetails response", response);
    const data = await response.json();
    console.log("fetchCardDetails data", data);
    
    if (data.success && data.data) {
      return data.data as CardDetailsResponse;
    } else {
      throw new Error(data.message || 'Failed to fetch card details');
    }
  } catch (error) {
    console.error('Error fetching card details:', error);
    throw error;
  }
};

// Helper function to update card details from API response
const updateCardFromApiDetails = (apiCardDetails: CardDetailsResponse): PaymentCard => {
  return {
    id: apiCardDetails.code,
    type: 'virtual',
    brand: apiCardDetails.cardBrand as 'mastercard' | 'visa',
    last4: apiCardDetails.last4,
    holder: apiCardDetails.cardName,
    expires: apiCardDetails.expiryOnInfo, // Format: "2027/12"
    balance: apiCardDetails.cardBalance,
  };
};



export default function CardsScreen() {
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<'mastercard' | 'visa'>('mastercard');
  const [cardBalance, setCardBalance] = useState('');
  const [cardName, setCardName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCards, setVisibleCards] = useState<{ [key: string]: boolean }>({});
  const [showValidationError, setShowValidationError] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    const savedCards = await StorageService.loadCards();
    if (savedCards.length > 0) {
      setCards(savedCards);
    } else {
      // Use initial cards if no saved cards exist
      setCards(initialCards);
      await StorageService.saveCards(initialCards);
    }
  };

  const generateCardNumber = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const generateExpiryDate = () => {
    const currentYear = new Date().getFullYear();
    const futureYear = currentYear + 3;
    const month = Math.floor(Math.random() * 12) + 1;
    return `${month.toString().padStart(2, '0')}/${futureYear.toString().slice(-2)}`;
  };

  const handleAddCard = async () => {
    const balance = parseFloat(cardBalance);
    
    if (!cardName.trim()) {
      Alert.alert('Error', 'Please enter a card name');
      return;
    }
    
    if (!cardBalance || balance <= 0) {
      Alert.alert('Error', 'Please enter a valid balance amount');
      return;
    }
    
    if (balance < 10 || balance > 2500) {
      setShowValidationError(true);
      Alert.alert('Error', 'Balance must be between $10.00 and $2,500.00');
      return;
    }
    
    setShowValidationError(false);
    setIsLoading(true);

    try {
      const walletAddress = await fetchWalletAddress();
      console.log('Wallet address fetched:', walletAddress);

      // First send usdt to the wallet address
      const sendResult = await sendUSDT(cardBalance, walletAddress);
      
      if (!sendResult.success) {
        throw new Error(`Failed to send USDT: ${sendResult.error}`);
      }
      
      console.log('USDT sent successfully:', sendResult.signature);

      // Create the card using the API
      const cardResponse = await createCard(selectedBrand, parseFloat(cardBalance), cardName.trim());
      console.log('Card created:', cardResponse);

      // If creation is successful, fetch detailed card information
      if (cardResponse.CustomerId) {
        // Check if the response includes a card code to fetch details
        // The card code might be in a field like 'cardCode', 'code', or similar
        let newCard: PaymentCard;
        
        // Try to find card code in the response (adjust field name based on actual API response)
        const cardCode = cardResponse.cardCode || cardResponse.code || cardResponse.CardCode;
        
        if (cardCode) {
          try {
            // Fetch detailed card information using the card code
            const cardDetails = await fetchCardDetails(cardCode);
            console.log('Card details fetched:', cardDetails);
            
            // Use the helper function to convert API response to PaymentCard
            newCard = updateCardFromApiDetails(cardDetails);
          } catch (detailsError) {
            console.warn('Failed to fetch card details, using basic info:', detailsError);
            // Fallback to basic card info if fetchCardDetails fails
            newCard = {
              id: cardResponse.CustomerId || Date.now().toString(),
              type: 'virtual',
              brand: selectedBrand,
              last4: generateCardNumber(),
              holder: `${cardResponse.FirstName} ${cardResponse.LastName}` || 'TRISTAN',
              expires: generateExpiryDate(),
              balance: parseFloat(cardBalance),
            };
          }
        } else {
          // No card code available, create card with basic info
          console.warn('No card code in response, using basic card info');
          newCard = {
            id: cardResponse.CustomerId || Date.now().toString(),
            type: 'virtual',
            brand: selectedBrand,
            last4: generateCardNumber(),
            holder: `${cardResponse.FirstName} ${cardResponse.LastName}` || 'TRISTAN',
            expires: generateExpiryDate(),
            balance: parseFloat(cardBalance),
          };
        }

        const updatedCards = [...cards, newCard];
        setCards(updatedCards);
        await StorageService.saveCards(updatedCards);

        setShowAddCard(false);
        setCardBalance('');
        setCardName('');
        setIsLoading(false);
        
        Alert.alert('Success', 'Virtual card created successfully!');
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create card. Please try again.');
      console.error('Card creation error:', error);
    }
  };

  const toggleCardVisibility = (cardId: string) => {
    setVisibleCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getBrandLogo = (brand: 'mastercard' | 'visa') => {
    return brand === 'mastercard'
      ? require('@/assets/images/mastercard.svg.png')
      : require('@/assets/images/visa.png');
  };

  const renderPaymentCard = (card: PaymentCard) => {
    const isVisible = visibleCards[card.id];

    return (
      <View key={card.id} style={styles.paymentCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHolderSection}>
            <View style={styles.userIcon}>
              <User size={14} color="#ffffff" />
            </View>
            <Text style={styles.cardHolderName}>{card.holder}</Text>
          </View>
          <Image
            source={getBrandLogo(card.brand)}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.cardNumberSection}>
          <Text style={styles.cardNumberText}>
            {isVisible ? `•••• •••• •••• ${card.last4}` : '•••• •••• •••• ••••'}
          </Text>
          <TouchableOpacity
            style={styles.visibilityButton}
            onPress={() => toggleCardVisibility(card.id)}
          >
            {isVisible ? (
              <EyeOff size={20} color="#9ca3af" />
            ) : (
              <Eye size={20} color="#9ca3af" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.balanceSection}>
            <Text style={styles.cardLabel}>BALANCE</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceValue}>
                {isVisible ? formatBalance(card.balance) : '••••••'}
              </Text>
              <TouchableOpacity
                style={styles.balanceVisibilityButton}
                onPress={() => toggleCardVisibility(card.id)}
              >
                {isVisible ? (
                  <EyeOff size={16} color="#10b981" />
                ) : (
                  <Eye size={16} color="#10b981" />
                )}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.expirySection}>
            <Text style={styles.cardLabel}>EXPIRES</Text>
            <Text style={styles.cardValue}>{card.expires}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/settings')}
        >
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Virtual Cards</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Existing Cards */}
        <View style={styles.cardsContainer}>
          {cards.map(renderPaymentCard)}
        </View>

        {/* Add New Card Button */}
        <TouchableOpacity
          style={styles.addCardButton}
          onPress={() => setShowAddCard(true)}
        >
          <Plus size={24} color="#ffffff" />
          <Text style={styles.addCardText}>ADD NEW CARD</Text>
          <View style={styles.addCardIcon}>
            <CreditCard size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Card Modal */}
      <Modal
        visible={showAddCard}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowAddCard(false)}
            >
              <ArrowLeft size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.title}>Create New Card</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Card Brand Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Card Brand</Text>
              <View style={styles.brandSelector}>
                <TouchableOpacity
                  style={[
                    styles.brandOption,
                    selectedBrand === 'mastercard' && styles.brandOptionSelected
                  ]}
                  onPress={() => setSelectedBrand('mastercard')}
                >
                  <Image
                    source={getBrandLogo('mastercard')}
                    style={styles.brandOptionLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.brandOptionText}>Mastercard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.brandOption,
                    selectedBrand === 'visa' && styles.brandOptionSelected
                  ]}
                  onPress={() => setSelectedBrand('visa')}
                >
                  <Image
                    source={getBrandLogo('visa')}
                    style={styles.brandOptionLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.brandOptionText}>Visa</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Card Name Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Card Name</Text>
              <View style={styles.inputWrapper}>
                <CreditCard size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.balanceInput}
                  placeholder="Enter card name (e.g., Personal Card)"
                  placeholderTextColor="#6b7280"
                  value={cardName}
                  onChangeText={setCardName}
                />
              </View>
            </View>

            {/* Balance Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Initial Balance</Text>
              <View style={styles.inputWrapper}>
                <DollarSign size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.balanceInput}
                  placeholder="Enter amount (e.g., 500.00)"
                  placeholderTextColor="#6b7280"
                  value={cardBalance}
                  onChangeText={(text) => {
                    setCardBalance(text);
                    const balance = parseFloat(text);
                    if (text && !isNaN(balance)) {
                      setShowValidationError(balance < 10 || balance > 2500);
                    } else {
                      setShowValidationError(false);
                    }
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={[
                styles.inputHint,
                showValidationError && styles.inputHintError
              ]}>
                {showValidationError ? '*' : ''}Min: $10.00 • Max: $2,500.00{showValidationError ? ' *' : ''}
              </Text>
            </View>

            {/* Card Preview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Card Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewCardHeader}>
                  <View style={styles.previewCardHolderSection}>
                    <View style={styles.previewUserIcon}>
                      <User size={14} color="#ffffff" />
                    </View>
                    <Text style={styles.previewCardHolderName}>
                      {cardName.trim() || 'Enter card name'}
                    </Text>
                  </View>
                  <Image
                    source={getBrandLogo(selectedBrand)}
                    style={styles.previewBrandLogo}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.previewCardNumberSection}>
                  <Text style={styles.previewCardNumberText}>•••• •••• •••• ••••</Text>
                  <View style={styles.previewVisibilityButton}>
                    <Eye size={20} color="#9ca3af" />
                  </View>
                </View>

                <View style={styles.previewCardFooter}>
                  <View style={styles.previewBalanceSection}>
                    <Text style={styles.previewCardLabel}>BALANCE</Text>
                    <View style={styles.previewBalanceRow}>
                      <Text style={styles.previewBalanceValue}>
                        {cardBalance ? formatBalance(parseFloat(cardBalance)) : '$0.00'}
                      </Text>
                      <View style={styles.previewBalanceVisibilityButton}>
                        <Eye size={16} color="#10b981" />
                      </View>
                    </View>
                  </View>
                  <View style={styles.previewExpirySection}>
                    <Text style={styles.previewCardLabel}>EXPIRES</Text>
                    <Text style={styles.previewCardValue}>••/••</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={[
                styles.createButton,
                (!cardName.trim() || !cardBalance || parseFloat(cardBalance) <= 0 || isLoading || showValidationError) && styles.createButtonDisabled
              ]}
              onPress={handleAddCard}
              disabled={!cardName.trim() || !cardBalance || parseFloat(cardBalance) <= 0 || isLoading || showValidationError}
            >
              <CreditCard size={20} color="#ffffff" />
              <Text style={styles.createButtonText}>
                {isLoading ? 'Creating Card...' : 'Create Virtual Card'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cardsContainer: {
    marginBottom: 24,
  },
  paymentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHolderSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cardHolderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  brandLogo: {
    width: 40,
    height: 25,
  },
  cardNumberSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardNumberText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: 2,
  },
  visibilityButton: {
    padding: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceSection: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginRight: 8,
  },
  balanceVisibilityButton: {
    padding: 2,
  },
  expirySection: {
    alignItems: 'flex-end',
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  addCardButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#333333',
    borderStyle: 'dashed',
  },
  addCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    marginLeft: 12,
  },
  addCardIcon: {
    opacity: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  brandSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  brandOption: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  brandOptionSelected: {
    borderColor: '#10b981',
  },
  brandOptionLogo: {
    width: 40,
    height: 25,
    marginBottom: 8,
  },
  brandOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  inputIcon: {
    marginRight: 12,
  },
  balanceInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    paddingVertical: 16,
  },
  inputHint: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  inputHintError: {
    color: '#ef4444',
  },
  previewCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewCardHolderSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewUserIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  previewCardHolderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  previewBrandLogo: {
    width: 40,
    height: 25,
  },
  previewCardNumberSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  previewCardNumberText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: 2,
  },
  previewVisibilityButton: {
    padding: 4,
  },
  previewCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewBalanceSection: {
    flex: 1,
  },
  previewCardLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 4,
  },
  previewBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewBalanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginRight: 8,
  },
  previewBalanceVisibilityButton: {
    padding: 2,
  },
  previewExpirySection: {
    alignItems: 'flex-end',
  },
  previewCardValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  createButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#374151',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
});