import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Plus, CreditCard, DollarSign, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { StorageService } from '@/utils/storage';
import { PaymentCard } from '@/data/types';
import { sendUSDTToCashwyre } from '@/utils/sendTransaction';
import { mockSendUSDTToCashwyre } from '@/utils/mockTransaction';
import { setupNotificationListeners } from '@/services/notificationService';
import { getCurrentVerificationLevel } from '@/utils/verification';
import { simulateUSDTReceived, getWalletAddress, simulateCardCreated, simulateCardCreationFailed, getCards, convertApiCardToPaymentCard } from '@/services/apis';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { SuccessfulPaymentCard, FailedPaymentCard } from '@/components/wallet/PaymentCard';
import { triggerShake } from '@/utils/animations';
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
    cardNumber: '5555555555554242', // Full card number for testing
    cvv: '123', // CVV code for testing
    holder: 'TRISTAN',
    expires: '12/25',
    balance: 2500.00,
  },
];

export default function CardsScreen() {
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<'mastercard' | 'visa'>('visa');
  const [cardBalance, setCardBalance] = useState('');
  const [cardName, setCardName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCards, setVisibleCards] = useState<{ [key: string]: boolean }>({});
  const [showValidationError, setShowValidationError] = useState(false);
  const [showNameValidationError, setShowNameValidationError] = useState(false);
  const [showDevButtons, setShowDevButtons] = useState(true);

  // Animation refs for shake effects
  const createButtonShakeAnim = useRef(new Animated.Value(0)).current;
  const devButton1ShakeAnim = useRef(new Animated.Value(0)).current;
  const devButton2ShakeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      
      // Load cards when screen comes into focus
      loadCards();

      // Set up notification listeners with card refresh callback
      const cleanupNotifications = setupNotificationListeners(() => {
        // Only refresh if component is still mounted and focused
        if (mounted) {
          loadCards();
        }
      });

      // Set up periodic refresh to catch any missed updates
      const refreshInterval = setInterval(() => {
        // Only refresh if component is still mounted and focused
        if (mounted) {
          loadCards();
        }
      }, 10000);

      // Cleanup function called when screen loses focus or unmounts
      return () => {
        mounted = false;
        cleanupNotifications();
        clearInterval(refreshInterval);
      };
    }, [])
  );

  const loadCards = async () => {
    try {
      // Get personal info to get customer email
      const personalInfo = await StorageService.loadPersonalInfo();
      if (!personalInfo) {
        setCards([]);
        return;
      }

      // In development mode, show demo cards if no real cards exist
      if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
        try {
          // Try to fetch real cards first
          const cardsResponse = await getCards(personalInfo.email);
          if (cardsResponse.success && cardsResponse.data && cardsResponse.data.length > 0) {
            const paymentCards = cardsResponse.data.map(convertApiCardToPaymentCard);
            setCards(paymentCards);
            return;
          }
        } catch (error) {
          // If no real cards or API call failed in dev mode, show demo cards
        }
        
        // If no real cards or API call failed in dev mode, show demo cards
        setCards(initialCards);
        return;
      }

      // Production mode: fetch cards from API
      const cardsResponse = await getCards(personalInfo.email);
      if (cardsResponse.success && cardsResponse.data) {
        const paymentCards = cardsResponse.data.map(convertApiCardToPaymentCard);
        setCards(paymentCards);
      } else {
        setCards([]);
      }
    } catch (error) {
      setCards([]);
    }
  };

  const checkKYCLevel = async (minLevel: 1 | 2 | 3) => {
    const verificationLevel = await getCurrentVerificationLevel();
    return verificationLevel >= minLevel;
  };

  const handleAddCardPress = async () => {
    // Show modal immediately for better UX
    setShowAddCard(true);
    
    // Check KYC in the background
    const isKYCCompliant = await checkKYCLevel(MIN_KYC_LEVEL);

    if (!isKYCCompliant) {
      // Close the modal first
      setShowAddCard(false);
      
      // Then show the KYC alert
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
  };

  const simulateCardFailureFlow = async (userEmail: string, cardBalance: string) => {
    try {
      const walletResponse = await getWalletAddress();

      if (walletResponse.success && walletResponse.data) {
        // First simulate USDT received
        setTimeout(async () => {
          await simulateUSDTReceived(walletResponse.data!.number, cardBalance);

          // Then simulate card creation failure using webhook
          setTimeout(async () => {
            await simulateCardCreationFailed(userEmail);
          }, 1000);

        }, 2000);
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const simulateCardSuccessFlow = async (userEmail: string, cardBalance: string) => {
    try {
      const walletResponse = await getWalletAddress();

      if (walletResponse.success && walletResponse.data) {
        // Delay to show the loading state briefly
        setTimeout(async () => {
          // First simulate USDT received
          await simulateUSDTReceived(walletResponse.data!.number, cardBalance);

          setTimeout(async () => {
            // simulate card created
            await simulateCardCreated(userEmail);
          }, 2000); // 2 second delay to show loading skeleton briefly
        }, 2000);
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const handleAddCard = async (simulationType?: 'simulate_usdt_failed' | 'simulate_card_failed') => {
    const balance = parseFloat(cardBalance);

    if (!cardName.trim()) {
      Alert.alert('Error', 'Please enter a card name');
      return;
    }

    if (cardName.trim().length < 4) {
      Alert.alert('Error', 'Card name must be at least 4 characters long');
      return;
    }

    if (!cardBalance || balance <= 0) {
      Alert.alert('Error', 'Please enter a valid balance amount');
      return;
    }

    if (balance < 15 || balance > 2500) {
      setShowValidationError(true);
      Alert.alert('Error', 'Balance must be between $15.00 and $2,500.00');
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

      // Send USDT to Cashwyre and register for auto card creation first
      const sendResult = process.env.EXPO_PUBLIC_APP_ENV === 'development'
        ? await mockSendUSDTToCashwyre({ amount: cardBalance, cardData, simulationType })
        : await sendUSDTToCashwyre(cardBalance, cardData);

      if (!sendResult.success) {
        // USDT transaction failed - show alert and exit gracefully
        setIsLoading(false);
        Alert.alert('💸 Transaction Failed', `Failed to send USDT, please try again: ${sendResult.error}`);
        return;
      }

      // Close the modal and reset form
      setShowAddCard(false);
      setCardBalance('');
      setCardName('');
      setShowValidationError(false);
      setShowNameValidationError(false);
      setIsLoading(false);

      // Refresh cards from API to show any new cards
      await loadCards();

      // Capture personal info for dev mode simulation
      const userEmail = personalInfo.email;

      // Handle different simulation types in development mode
      if (process.env.EXPO_PUBLIC_APP_ENV === 'development' && simulationType === 'simulate_card_failed') {
        await simulateCardFailureFlow(userEmail, cardBalance);
        return;
      }

      if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
        await simulateCardSuccessFlow(userEmail, cardBalance);
        return;
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create card. Please try again.');
    }
  };

  const toggleCardVisibility = (cardId: string) => {
    setVisibleCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const handleDeleteCard = async (cardId: string) => {
    // In development mode, allow deletion for demo purposes
    if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
      const updatedCards = cards.filter(card => card.id !== cardId);
      setCards(updatedCards);
    } else {
      // In production, you might want to call an API to delete the card
      Alert.alert('Info', 'Card deletion is not available in production mode');
    }
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Handler functions for button interactions with shake animation
  const handleCreateCardAttempt = () => {
    const isDisabled = !cardName.trim() || cardName.trim().length < 4 || !cardBalance || parseFloat(cardBalance) <= 0 || isLoading || showValidationError || showNameValidationError;
    if (isDisabled) {
      triggerShake(createButtonShakeAnim);
    } else {
      handleAddCard();
    }
  };

  const handleDevButton1Attempt = () => {
    const isDisabled = !cardName.trim() || cardName.trim().length < 4 || !cardBalance || parseFloat(cardBalance) <= 0 || isLoading || showValidationError || showNameValidationError;
    if (isDisabled) {
      triggerShake(devButton1ShakeAnim);
    } else {
      handleAddCard('simulate_usdt_failed');
    }
  };

  const handleDevButton2Attempt = () => {
    const isDisabled = !cardName.trim() || cardName.trim().length < 4 || !cardBalance || parseFloat(cardBalance) <= 0 || isLoading || showValidationError || showNameValidationError;
    if (isDisabled) {
      triggerShake(devButton2ShakeAnim);
    } else {
      handleAddCard('simulate_card_failed');
    }
  };

  const getBrandLogo = (brand: 'mastercard' | 'visa') => {
    return brand === 'mastercard'
      ? require('@/assets/images/mastercard.svg.png')
      : require('@/assets/images/visa.png');
  };

  const renderPaymentCard = (card: PaymentCard) => {
    const isVisible = visibleCards[card.id] || false;
    const isDevelopment = process.env.EXPO_PUBLIC_APP_ENV === 'development';

    // Determine card state based on status
    const isLoading = card.isLoading || card.status === 'new' || card.status === 'pending';
    const isFailed = card.isFailed || card.status === 'inactive' || card.status === 'failed' || card.status === 'terminated';

    if (isFailed) {
      return (
        <FailedPaymentCard
          key={card.id}
          card={{
            ...card,
            isFailed: true,
            failureReason: card.failureReason || 
                          (card.status === 'inactive' ? 'Card is inactive' :
                           card.status === 'failed' ? 'Card creation failed' :
                           card.status === 'terminated' ? 'Card has been terminated' : 'Unknown error')
          }}
          onDeleteCard={handleDeleteCard}
          getBrandLogo={getBrandLogo}
          styles={styles}
        />
      );
    }

    return (
      <SuccessfulPaymentCard
        key={card.id}
        card={{
          ...card,
          isLoading: isLoading
        }}
        isVisible={isVisible}
        isLoading={isLoading}
        isDevelopment={isDevelopment}
        onToggleVisibility={toggleCardVisibility}
        onDeleteCard={handleDeleteCard}
        formatBalance={formatBalance}
        getBrandLogo={getBrandLogo}
        styles={styles}
      />
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Existing Cards */}
        <View style={styles.cardsContainer}>
          {cards.map(renderPaymentCard)}
        </View>
      </ScrollView>

      {/* Sticky Add New Card Button */}
      <View style={styles.stickyButtonContainer}>
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
      </View>

      {/* Add Card Modal */}
      <Modal
        visible={showAddCard}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <View style={styles.placeholder} />
            <Text style={styles.title}>Create New Card</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowAddCard(false);
                setShowValidationError(false);
                setShowNameValidationError(false);
                setShowDevButtons(true); // Reset dev buttons visibility when closing modal
              }}
            >
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
            {/* Card Brand Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Card Brand</Text>
              <View style={styles.brandSelector}>
                <TouchableOpacity
                  style={[
                    styles.brandOption,
                    styles.brandOptionDisabled,
                    selectedBrand === 'mastercard' && styles.brandOptionSelected
                  ]}
                  disabled={true}
                >
                  <Image
                    source={getBrandLogo('mastercard')}
                    style={[styles.brandOptionLogo, styles.brandOptionLogoDisabled]}
                    resizeMode="contain"
                  />
                  <Text style={[styles.brandOptionText, styles.brandOptionTextDisabled]}>Mastercard</Text>
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
                  onChangeText={(text) => {
                    // Only allow English letters (a-z, A-Z) and spaces
                    const letterRegex = /^[a-zA-Z\s]*$/;
                    
                    // Remove any non-letter characters except spaces
                    const cleanedText = text.replace(/[^a-zA-Z\s]/g, '');
                    
                    // Remove extra consecutive spaces and trim leading spaces
                    const normalizedText = cleanedText.replace(/\s+/g, ' ').replace(/^\s+/, '');
                    
                    // Only update if the text matches our letter pattern
                    if (letterRegex.test(normalizedText)) {
                      setCardName(normalizedText);
                      // Check minimum length validation
                      setShowNameValidationError(normalizedText.length > 0 && normalizedText.length < 4);
                    }
                  }}
                />
              </View>
              <Text style={[
                styles.inputHint,
                showNameValidationError && styles.inputHintError
              ]}>
                {showNameValidationError ? '*' : ''}Minimum 4 characters, letters only{showNameValidationError ? ' *' : ''}
              </Text>
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
                    // Only allow numbers and one decimal point
                    const numericRegex = /^(\d*\.?\d{0,2})$/;
                    
                    // Remove any non-numeric characters except decimal point
                    const cleanedText = text.replace(/[^0-9.]/g, '');
                    
                    // Ensure only one decimal point and max 2 decimal places
                    const parts = cleanedText.split('.');
                    let validText = parts[0];
                    if (parts.length > 1) {
                      validText += '.' + parts[1].substring(0, 2);
                    }
                    
                    // Only update if the text matches our numeric pattern
                    if (numericRegex.test(validText)) {
                      setCardBalance(validText);
                      
                      // Validate the numeric value
                      const balance = parseFloat(validText);
                      if (validText && !isNaN(balance) && balance > 0) {
                        setShowValidationError(balance < 15 || balance > 2500);
                      } else {
                        setShowValidationError(false);
                      }
                    }
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={[
                styles.inputHint,
                showValidationError && styles.inputHintError
              ]}>
                {showValidationError ? '*' : ''}Min: $15.00 • Max: $2,500.00{showValidationError ? ' *' : ''}
              </Text>
            </View>

            {/* Fee Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fee Breakdown</Text>
              <View style={styles.feeBreakdownCard}>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Initial Balance</Text>
                  <Text style={styles.feeValue}>
                    {cardBalance ? formatBalance(parseFloat(cardBalance)) : '$0.00'}
                  </Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Base Fee</Text>
                  <Text style={styles.feeValue}>$4.00</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Processing Fee (1%)</Text>
                  <Text style={styles.feeValue}>
                    {cardBalance ? formatBalance(parseFloat(cardBalance) * 0.01) : '$0.00'}
                  </Text>
                </View>
                <View style={styles.feeDivider} />
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabelTotal}>Total Fee</Text>
                  <Text style={styles.feeValueTotal}>
                    {cardBalance 
                      ? formatBalance(4.00 + (parseFloat(cardBalance) * 0.01))
                      : '$4.00'
                    }
                  </Text>
                </View>
              </View>
            </View>

            {/* Total to Pay */}
            <View style={styles.section}>
              <View style={styles.totalToPayCard}>
                <Text style={styles.totalToPayLabel}>Total to Pay</Text>
                <Text style={styles.totalToPayValue}>
                  {cardBalance 
                    ? formatBalance(parseFloat(cardBalance) + 4.00 + (parseFloat(cardBalance) * 0.01))
                    : '$4.00'
                  }
                </Text>
              </View>
            </View>

            {/* Card Preview - Commented out for now */}
            {/* <View style={styles.section}>
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
                  <View style={styles.previewCvvSection}>
                    <Text style={styles.previewCardLabel}>CVV</Text>
                    <Text style={styles.previewCardValue}>•••</Text>
                  </View>
                  <View style={styles.previewExpirySection}>
                    <Text style={styles.previewCardLabel}>EXPIRES</Text>
                    <Text style={styles.previewCardValue}>••/••</Text>
                  </View>
                </View>
              </View>
            </View> */}
          </ScrollView>

          {/* Sticky Button Container */}
          <View style={styles.modalStickyButtonContainer}>
            {/* Development Mode: Toggle and Simulation Buttons */}
            {process.env.EXPO_PUBLIC_APP_ENV === 'development' && showDevButtons && (
              <View style={styles.devSection}>
                <TouchableOpacity
                  style={styles.devToggleButton}
                  onPress={() => setShowDevButtons(false)}
                >
                  <Text style={styles.devToggleButtonText}>
                    Hide Dev Buttons
                  </Text>
                </TouchableOpacity>

                <View style={styles.devButtonsContainer}>
                  <Animated.View style={{ transform: [{ translateX: devButton1ShakeAnim }] }}>
                    <TouchableOpacity
                      style={[
                        styles.devSimulateButton,
                        (!cardName.trim() || cardName.trim().length < 4 || !cardBalance || parseFloat(cardBalance) <= 0 || isLoading || showValidationError || showNameValidationError) && styles.devSimulateButtonDisabled
                      ]}
                      onPress={handleDevButton1Attempt}
                    >
                      <Text style={[
                        styles.devSimulateButtonText,
                        (!cardName.trim() || cardName.trim().length < 4 || !cardBalance || parseFloat(cardBalance) <= 0 || isLoading || showValidationError || showNameValidationError) && styles.devSimulateButtonTextDisabled
                      ]}>Simulate USDT Send Failed</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View style={{ transform: [{ translateX: devButton2ShakeAnim }] }}>
                    <TouchableOpacity
                      style={[
                        styles.devSimulateButton,
                        (!cardName.trim() || cardName.trim().length < 4 || !cardBalance || parseFloat(cardBalance) <= 0 || isLoading || showValidationError || showNameValidationError) && styles.devSimulateButtonDisabled
                      ]}
                      onPress={handleDevButton2Attempt}
                    >
                      <Text style={[
                        styles.devSimulateButtonText,
                        (!cardName.trim() || cardName.trim().length < 4 || !cardBalance || parseFloat(cardBalance) <= 0 || isLoading || showValidationError || showNameValidationError) && styles.devSimulateButtonTextDisabled
                      ]}>Simulate Card Creation Failed</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>
            )}

            {/* Create Button */}
            <Animated.View style={{ transform: [{ translateX: createButtonShakeAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  (!cardName.trim() || cardName.trim().length < 4 || !cardBalance || parseFloat(cardBalance) <= 0 || isLoading || showValidationError || showNameValidationError) && styles.createButtonDisabled
                ]}
                onPress={handleCreateCardAttempt}
              >
                <CreditCard size={20} color="#ffffff" />
                <Text style={styles.createButtonText}>
                  {isLoading ? 'Creating Card...' : 'Create Virtual Card'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
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
  closeButton: {
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
    alignItems: 'flex-end',
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
  cvvSection: {
    alignItems: 'center',
    minWidth: 60, // Ensure consistent width
    marginHorizontal: 20, // Add spacing from sides
  },
  expirySection: {
    alignItems: 'flex-end',
    flex: 1,
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
  scrollContent: {
    paddingBottom: 100, // Add space for the sticky button
  },
  modalScrollContent: {
    paddingBottom: 160, // Extra space for sticky buttons in modal (dev buttons + create button)
  },
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingBottom: 24, // Extra padding for safe area
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalStickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingBottom: 24, // Extra padding for safe area
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
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
  brandOptionDisabled: {
    backgroundColor: '#0f0f0f',
    opacity: 0.5,
  },
  brandOptionLogoDisabled: {
    opacity: 0.3,
  },
  brandOptionTextDisabled: {
    color: '#666666',
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
    alignItems: 'flex-end',
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
  previewCvvSection: {
    alignItems: 'center',
    minWidth: 60, // Ensure consistent width
    marginHorizontal: 20, // Add spacing from sides
  },
  previewExpirySection: {
    alignItems: 'flex-end',
    flex: 1,
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
  failedCard: {
    borderColor: '#ef4444',
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  loadingBadge: {
    backgroundColor: '#3182ce',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  failedBadge: {
    backgroundColor: '#ef4444',
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
  failedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  failedText: {
    color: '#ef4444',
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
  deleteButtonFailed: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
    marginTop: 16,
  },
  devButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 12,
  },
  devButtonsContainer: {
    gap: 12,
  },
  devSimulateButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  devSimulateButtonDisabled: {
    backgroundColor: '#374151',
    borderColor: '#6b7280',
  },
  devSimulateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  devSimulateButtonTextDisabled: {
    color: '#9ca3af',
  },
  devNormalButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  devNormalButtonText: {
    color: '#10b981',
  },
  devSection: {
    marginBottom: 12,
  },
  devToggleButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  devToggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  feeBreakdownCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  feeLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '400',
  },
  feeValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  feeLabelTotal: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  feeValueTotal: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '700',
  },
  feeDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 6,
  },
  totalToPayCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  totalToPayLabel: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  totalToPayValue: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: '700',
  },
});