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
import { ArrowLeft, Plus, CreditCard, DollarSign, User, Eye, EyeOff, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { StorageService, PaymentCard } from '@/utils/storage';
import { sendUSDTToCashwyre } from '@/utils/sendTransaction';
import { setupNotificationListeners } from '@/services/notificationService';
import { getCurrentVerificationLevel } from '@/app/settings/kyc';
import { simulateUSDTReceived, getWalletAddress, simulateCardCreated } from '@/services/apis';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import * as Notifications from 'expo-notifications';


const MIN_KYC_LEVEL = 1; // Minimum KYC level required for virtual cards

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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

    // Set up notification listeners
    const cleanupNotifications = setupNotificationListeners();

    // Set up periodic refresh to catch storage updates from notifications
    const refreshInterval = setInterval(() => {
      loadCards(); // Reload cards from storage every 2 seconds
    }, 2000);

    // Cleanup on unmount
    return () => {
      cleanupNotifications();
      clearInterval(refreshInterval);
    };
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

  const checkKYCLevel = async (minLevel: 1 | 2 | 3) => {
    const verificationLevel = await getCurrentVerificationLevel();
    return verificationLevel.level >= minLevel && verificationLevel.status === 'completed';
  };

  const handleAddCardPress = async () => {
    const isKYCCompliant = await checkKYCLevel(MIN_KYC_LEVEL);

    if (!isKYCCompliant) {
      Alert.alert(
        'KYC Verification Required',
        `You need to complete KYC Level ${MIN_KYC_LEVEL} verification to create virtual cards. Please complete your document verification first.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Complete KYC',
            onPress: () => {
              router.push('/settings/kyc');
            },
          },
        ]
      );
      return;
    }
    setShowAddCard(true);
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
      // Load personal info for card creation
      const personalInfo = await StorageService.loadPersonalInfo();
      if (!personalInfo) {
        throw new Error('Personal information not found. Please complete KYC verification first.');
      }

      // Split the name into first and last name
      const nameParts = personalInfo.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Prepare card data
      const cardData = {
        firstName,
        lastName,
        email: personalInfo.email,
        phoneCode: personalInfo.selectedCountry.dialCode,
        phoneNumber: personalInfo.phoneNumber,
        dateOfBirth: personalInfo.dateOfBirth,
        homeAddressNumber: personalInfo.streetNumber,
        homeAddress: personalInfo.address,
        cardName: cardName.trim(),
        cardBrand: selectedBrand.charAt(0).toUpperCase() + selectedBrand.slice(1).toLowerCase(),
      };

      // Send USDT to Cashwyre and register for auto card creation
      const sendResult = await sendUSDTToCashwyre(cardBalance, cardData);

      if (!sendResult.success) {
        throw new Error(`Failed to send USDT: ${sendResult.error}`);
      }

      console.log('USDT sent successfully:', sendResult.signature);

      // Create a temporary card with loading skeletons for immediate UI feedback
      const tempCard: PaymentCard = {
        id: Date.now().toString(),
        type: 'virtual',
        brand: selectedBrand,
        last4: '••••', // Show loading state for card number
        holder: cardName.trim(),
        expires: '••/••', // Show loading state for expiry
        balance: parseFloat(cardBalance),
        isLoading: true, // Mark as loading to show skeleton states
      };

      const updatedCards = [...cards, tempCard];
      setCards(updatedCards);
      await StorageService.saveCards(updatedCards);

      setShowAddCard(false);
      setCardBalance('');
      setCardName('');
      setIsLoading(false);

      // Capture personal info for dev mode simulation
      const userEmail = personalInfo.email;

      // In development mode, automatically simulate webhook for testing
      if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
        console.log('🧪 DEV MODE: Simulating webhook automatically...');
        try {
          const walletResponse = await getWalletAddress();

          if (walletResponse.success && walletResponse.data) {
            // Delay to show the loading state briefly
            setTimeout(async () => {
              // First simulate USDT received
              await simulateUSDTReceived(walletResponse.data!.number, cardBalance);
              console.log('🎯 DEV: USDT received webhook simulation completed');

              // // Then simulate card creation 5 seconds later
              // setTimeout(async () => {
              //   console.log('🎯 DEV: Starting card creation simulation...');
              //   const result = await simulateCardCreated(userEmail);
              //   console.log('🎯 DEV: Card creation webhook simulation result:', result);
              //   console.log('🎯 DEV: Card creation webhook simulation completed');
              // }, 5000); // 5 seconds after USDT received
            }, 2000); // 2 second delay to show loading skeleton briefly
          }
        } catch (error) {
          console.error('Failed to simulate webhook:', error);
        }
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

  const handleDeleteCard = async (cardId: string) => {
    const updatedCards = cards.filter(card => card.id !== cardId);
    setCards(updatedCards);
    await StorageService.saveCards(updatedCards);
    console.log('🗑️ DEV MODE: Card deleted:', cardId);
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
    const isLoading = card.isLoading;
    const isDevelopment = process.env.EXPO_PUBLIC_APP_ENV === 'development';

    return (
      <View key={card.id} style={[styles.paymentCard, isLoading && styles.loadingCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHolderSection}>
            <View style={styles.userIcon}>
              <User size={14} color="#ffffff" />
            </View>
            <Text style={styles.cardHolderName}>{card.holder}</Text>
            {isLoading && (
              <View style={styles.loadingBadge}>
                <Text style={styles.loadingBadgeText}>Creating...</Text>
              </View>
            )}
          </View>
          <View style={styles.cardHeaderActions}>
            <Image
              source={getBrandLogo(card.brand)}
              style={[styles.brandLogo, isLoading && styles.loadingOpacity]}
              resizeMode="contain"
            />
            {isDevelopment && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteCard(card.id)}
              >
                <X size={16} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.cardNumberSection}>
          {isLoading ? (
            <LoadingSkeleton width="60%" height={22} borderRadius={4} />
          ) : (
            <Text style={styles.cardNumberText}>
              {isVisible ? `•••• •••• •••• ${card.last4}` : '•••• •••• •••• ••••'}
            </Text>
          )}
          <TouchableOpacity
            style={styles.visibilityButton}
            onPress={() => toggleCardVisibility(card.id)}
            disabled={isLoading}
          >
            {isVisible ? (
              <EyeOff size={20} color={isLoading ? "#555555" : "#9ca3af"} />
            ) : (
              <Eye size={20} color={isLoading ? "#555555" : "#9ca3af"} />
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
                disabled={isLoading}
              >
                {isVisible ? (
                  <EyeOff size={16} color={isLoading ? "#555555" : "#10b981"} />
                ) : (
                  <Eye size={16} color={isLoading ? "#555555" : "#10b981"} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.expirySection}>
            <Text style={styles.cardLabel}>EXPIRES</Text>
            {isLoading ? (
              <LoadingSkeleton width={40} height={16} borderRadius={4} />
            ) : (
              <Text style={styles.cardValue}>{card.expires}</Text>
            )}
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
          onPress={handleAddCardPress}
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
  loadingCard: {
    borderColor: '#4a5568',
    borderWidth: 1,
  },
  loadingBadge: {
    backgroundColor: '#3182ce',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  loadingBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingOpacity: {
    opacity: 0.5,
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});