import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { CreditCard } from 'lucide-react-native';
import { router } from 'expo-router';
import ScreenContainer from '@/components/ScreenContainer';
import ScreenHeader from '@/components/ScreenHeader';
import { StorageService } from '@/utils/storage';
import { PaymentCard } from '@/types/cards';
import { sendUsdtToCashwyre } from '@/utils/sendTransaction';
import { mockSendUsdtToCashwyre } from '@/utils/mockTransaction';
import { setupNotificationListeners } from '@/services/notificationService';
import { getCurrentVerificationLevel } from '@/utils/verification';
import {
  simulateUSDTReceived,
  getWalletAddress,
  simulateCardCreated,
  simulateCardCreationFailed,
} from '@/services/apis';
import { LoadingCard } from '@/components/cards/LoadingCard';
import { SuccessCard } from '@/components/cards/SuccessCard';
import { FailedCard } from '@/components/cards/FailedCard';
import * as Notifications from 'expo-notifications';
import { useCards } from '@/hooks/useCards';
import { useQueryClient } from '@tanstack/react-query';
import { useConfig } from '@/hooks/useConfig';
import CustomAlert from '@/components/CustomAlert';
import { useTokenAsset } from '@/hooks/useTokenAsset';
import { USDT_ADDRESS } from '@/constants/popularTokens';
import colors from '@/constants/colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomActionContainer from '@/components/BottomActionContainer';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import CreateCardBottomSheet, {
  CreateCardBottomSheetRef,
} from '@/components/bottom-sheets/CreateCardBottomSheet';
// Note: cardCreationSteps service simplified since we now use status-based polling

const MIN_KYC_LEVEL = 1; // Minimum KYC level required for virtual cards

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function CardsScreen() {
  const [selectedBrand, setSelectedBrand] = useState<'mastercard' | 'visa'>(
    'visa',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCards, setVisibleCards] = useState<{ [key: string]: boolean }>(
    {},
  );

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  // TanStack Query client for cache invalidation
  const queryClient = useQueryClient();

  // Get config values - this is critical data that must be loaded
  const {
    data: config,
    isLoading: isConfigLoading,
    error: configError,
  } = useConfig();
  const virtualCardCreationFee = config?.virtualCardCreationFee;
  const cashwyreBaseFee = config?.cashwyreBaseFee;

  // Get USDT balance for validation
  const { balance: usdtBalance } = useTokenAsset(USDT_ADDRESS);

  // Use TanStack Query for cards data
  const {
    data: cards = [],
    isLoading: isLoadingCards,
    refetch: refetchCards,
  } = useCards(userEmail);

  // Bottom sheet ref
  const addCardBottomSheetRef = useRef<CreateCardBottomSheetRef>(null);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      // Load user email when screen comes into focus
      const loadUserEmail = async () => {
        try {
          const personalInfo = await StorageService.loadPersonalInfo();
          if (mounted && personalInfo) {
            setUserEmail(personalInfo.email);
          }
        } catch (error) {
          console.error('Error loading user email:', error);
        }
      };

      loadUserEmail();

      // Set up notification listeners with card refresh callback
      const cleanupNotifications = setupNotificationListeners(() => {
        // Only refresh if component is still mounted and focused
        if (mounted && userEmail) {
          queryClient.invalidateQueries({ queryKey: ['cards', userEmail] });
          refetchCards();
        }
      });

      // Cleanup function called when screen loses focus or unmounts
      return () => {
        mounted = false;
        cleanupNotifications();
      };
    }, [refetchCards]),
  );

  const checkKYCLevel = async (minLevel: 1 | 2 | 3) => {
    const verificationLevel = await getCurrentVerificationLevel();
    return verificationLevel >= minLevel;
  };

  const showCustomAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>,
  ) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      type,
      buttons,
    });
  };

  const hideCustomAlert = () => {
    setCustomAlert((prev) => ({ ...prev, visible: false }));
  };

  const isInsufficientFundsError = (error: string, details?: string) => {
    const errorText = (error + ' ' + (details || '')).toLowerCase();
    return (
      errorText.includes('insufficient funds') ||
      errorText.includes('insufficient balance') ||
      errorText.includes('program log: error: insufficient funds')
    );
  };

  const validateCardBalance = (balance: string) => {
    if (!balance || !virtualCardCreationFee || !cashwyreBaseFee) return false;

    const amount = parseFloat(balance);
    if (isNaN(amount) || amount <= 0) return false;

    const totalRequired =
      amount + virtualCardCreationFee * amount + cashwyreBaseFee;
    return totalRequired > usdtBalance;
  };

  const handleCloseAddCard = () => {
    addCardBottomSheetRef.current?.close();
  };

  const handleAddCardPress = async () => {
    // Check KYC first
    const isKYCCompliant = await checkKYCLevel(MIN_KYC_LEVEL);

    if (!isKYCCompliant) {
      // Show the KYC alert
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
        ],
      );
      return;
    }

    // Open bottom sheet
    addCardBottomSheetRef.current?.expand();
  };

  const simulateCardFailureFlow = async (
    userEmail: string,
    cardBalance: string,
  ) => {
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

  const simulateCardSuccessFlow = async (
    userEmail: string,
    cardBalance: string,
  ) => {
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

  const handleAddCard = async (
    cardName: string,
    cardBalance: string,
    simulationType?: 'simulate_usdt_failed' | 'simulate_card_failed',
  ) => {
    const balance = parseFloat(cardBalance);

    // Check if user has sufficient USDT balance
    if (validateCardBalance(cardBalance)) {
      showCustomAlert(
        '💰 Insufficient USDT Balance',
        `You need at least ${formatBalance(
          balance +
            (virtualCardCreationFee || 0) * balance +
            (cashwyreBaseFee || 0),
        )} USDT to create this card (including fees). You currently have ${usdtBalance.toFixed(2)} USDT.`,
        'warning',
        [
          {
            text: 'Add USDT',
            onPress: () => {
              hideCustomAlert();
              router.push('/transaction/receive');
            },
            style: 'default',
          },
          {
            text: 'Cancel',
            onPress: hideCustomAlert,
            style: 'cancel',
          },
        ],
      );
      return;
    }

    setIsLoading(true);

    try {
      // Load personal info for card creation
      const personalInfo = await StorageService.loadPersonalInfo();
      if (!personalInfo) {
        throw new Error(
          'Personal information not found. Please complete KYC verification first.',
        );
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
        cardBrand:
          selectedBrand.charAt(0).toUpperCase() +
          selectedBrand.slice(1).toLowerCase(),
      };

      // Calculate total amount including fees (same as displayed to user)
      const totalAmount =
        virtualCardCreationFee && cashwyreBaseFee
          ? parseFloat(cardBalance) +
            virtualCardCreationFee * parseFloat(cardBalance) +
            cashwyreBaseFee
          : parseFloat(cardBalance);

      // Send USDT to Cashwyre and register for auto card creation first
      const sendResult =
        process.env.EXPO_PUBLIC_APP_ENV === 'development'
          ? await mockSendUsdtToCashwyre({
              amount: totalAmount.toString(),
              cardData,
              simulationType,
            })
          : await sendUsdtToCashwyre(totalAmount.toString(), cardData);

      if (!sendResult.success) {
        // USDT transaction failed - show specific error based on failure type
        setIsLoading(false);

        // Check for insufficient funds error
        if (
          sendResult.errorType === 'TRANSACTION_SUBMISSION_FAILED' &&
          isInsufficientFundsError(sendResult.error || '', sendResult.details)
        ) {
          showCustomAlert(
            '💰 Insufficient USDT Balance',
            `You don't have enough USDT to create this card. You need ${formatBalance(totalAmount)} total (including fees), but your wallet has insufficient funds.`,
            'warning',
            [
              {
                text: 'Add USDT',
                onPress: () => {
                  hideCustomAlert();
                  router.push('/transaction/receive');
                },
                style: 'default',
              },
              {
                text: 'Cancel',
                onPress: hideCustomAlert,
                style: 'cancel',
              },
            ],
          );
          return;
        }

        let errorTitle = '💸 Transaction Failed';
        let errorMessage = `Failed to send USDT: ${sendResult.error}`;

        // Provide more specific error messages based on the failure type
        if (sendResult.errorType === 'TRANSACTION_SUBMISSION_FAILED') {
          errorTitle = '💸 Transaction Submission Failed';
          errorMessage = `Failed to submit transaction to blockchain. Please try again: ${sendResult.error}`;
        } else if (sendResult.errorType === 'REGISTRATION_FAILED') {
          console.log(sendResult);
          errorTitle = '⚠️ Transaction Sent, Registration Failed';
          errorMessage = `USDT transaction was sent successfully, but failed to register for card creation. Please contact support. Transaction signature: ${sendResult.signature}}`;
        }

        showCustomAlert(errorTitle, errorMessage, 'error');
        return;
      }

      // Check if there was a registration warning (transaction succeeded but registration failed)
      if (
        sendResult.warning &&
        sendResult.errorType === 'REGISTRATION_FAILED'
      ) {
        setIsLoading(false);
        showCustomAlert(
          '⚠️ Partial Success',
          `Transaction sent successfully but card registration failed. Please contact support with this transaction signature: ${sendResult.signature}`,
          'warning',
          [
            {
              text: 'Copy Signature',
              onPress: async () => {
                if (sendResult.signature) {
                  await Clipboard.setStringAsync(sendResult.signature);
                  hideCustomAlert();
                  showCustomAlert(
                    'Copied',
                    'Transaction signature copied to clipboard',
                    'success',
                  );
                }
              },
              style: 'default',
            },
            {
              text: 'OK',
              onPress: hideCustomAlert,
              style: 'cancel',
            },
          ],
        );
        return;
      }

      // Close the bottom sheet and reset form
      addCardBottomSheetRef.current?.close();

      setIsLoading(false);

      // Refresh cards from API to show any new cards
      queryClient.invalidateQueries({
        queryKey: ['cards', personalInfo.email],
      });
      await refetchCards();

      // Capture personal info for dev mode simulation
      const userEmail = personalInfo.email;

      // Handle different simulation types in development mode
      if (
        process.env.EXPO_PUBLIC_APP_ENV === 'development' &&
        simulationType === 'simulate_card_failed'
      ) {
        await simulateCardFailureFlow(userEmail, cardBalance);
        return;
      }

      if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
        await simulateCardSuccessFlow(userEmail, cardBalance);
        return;
      }
    } catch (error) {
      setIsLoading(false);
      showCustomAlert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to create card. Please try again.',
        'error',
      );
    }
  };

  const toggleCardVisibility = (cardId: string) => {
    setVisibleCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const handleDeleteCard = async (cardId: string) => {
    // In development mode, allow deletion for demo purposes
    if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
      Alert.alert(
        'Info',
        'Card deleted in dev mode. Data will refresh automatically.',
      );
      // Trigger a refetch to update the UI
      refetchCards();
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

  const getBrandLogo = (brand: 'mastercard' | 'visa') => {
    return brand === 'mastercard'
      ? require('@/assets/images/mastercard.svg.png')
      : require('@/assets/images/visa.png');
  };

  // Development functions for simulating creation steps
  // Note: With status-based polling, these now trigger backend simulation APIs
  const devSimulateUSDTReceived = (cardId: string) => {
    console.log('🧪 [DEV] Simulating USDT received for card:', cardId);
    // This would trigger a backend API to simulate USDT received
    refetchCards();
  };

  const advanceCreationStep = async (cardId: string) => {
    console.log('🧪 [DEV] Advancing creation step for card:', cardId);

    // Find the card being advanced
    const cardToAdvance = cards.find((c) => c.id === cardId);
    if (!cardToAdvance) {
      console.log('🚫 Card not found for advancement:', cardId);
      return;
    }

    // For development, simulate step advancement by updating the card locally
    // In production, this would call a backend API to advance the step
    try {
      // Try to call simulateCardCreated if we're on step 2 or higher
      const currentStep = cardToAdvance.creationStep || 2;

      if (currentStep >= 2 && userEmail) {
        console.log(
          '🚀 Simulating card creation completion for step:',
          currentStep,
        );
        await simulateCardCreated(userEmail, cardId);

        // Wait a bit then refetch to see the changes
        setTimeout(() => {
          refetchCards();
        }, 1000);
      } else {
        console.log('📝 Just refetching cards for step:', currentStep);
        refetchCards();
      }
    } catch (error) {
      console.error('❌ Error in advance creation step:', error);
      // Fallback to just refetching
      refetchCards();
    }
  };

  const resetCreationStep = (cardId: string) => {
    console.log('🧪 [DEV] Resetting creation step for card:', cardId);
    // This would trigger a backend API to reset the status
    refetchCards();
  };

  const renderPaymentCard = (card: PaymentCard) => {
    const isVisible = visibleCards[card.id] || false;

    // Determine if user has existing cards (non-loading cards)
    const hasExistingCards = cards.some(
      (c) =>
        c.id !== card.id && // Don't count current card
        !(c.isLoading || c.status === 'new' || c.status === 'pending') && // Not loading
        !(
          c.isFailed ||
          c.status === 'inactive' ||
          c.status === 'failed' ||
          c.status === 'terminated'
        ), // Not failed
    );

    // Determine card state based on status
    const isLoading =
      card.isLoading || card.status === 'new' || card.status === 'pending';
    const isFailed =
      card.isFailed ||
      card.status === 'inactive' ||
      card.status === 'failed' ||
      card.status === 'terminated';

    // Failed state
    if (isFailed) {
      return (
        <FailedCard
          key={card.id}
          card={{
            ...card,
            isFailed: true,
            failureReason:
              card.failureReason ||
              (card.status === 'inactive'
                ? 'Card is inactive'
                : card.status === 'failed'
                  ? 'Card creation failed'
                  : card.status === 'terminated'
                    ? 'Card has been terminated'
                    : 'Unknown error'),
          }}
          onDeleteCard={handleDeleteCard}
          getBrandLogo={getBrandLogo}
        />
      );
    }

    // Loading state
    if (isLoading) {
      return (
        <LoadingCard
          key={card.id}
          card={card}
          onDeleteCard={handleDeleteCard}
          getBrandLogo={getBrandLogo}
          hasExistingCards={hasExistingCards}
          onSimulateUSDTReceived={devSimulateUSDTReceived}
          onAdvanceCreationStep={advanceCreationStep}
          onResetCreationStep={resetCreationStep}
        />
      );
    }

    // Success state (fully created and ready)
    return (
      <SuccessCard
        key={card.id}
        card={card}
        isVisible={isVisible}
        onToggleVisibility={toggleCardVisibility}
        onDeleteCard={handleDeleteCard}
        formatBalance={formatBalance}
        getBrandLogo={getBrandLogo}
      />
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScreenContainer edges={['top']}>
        <ScreenHeader
          title="Virtual Cards"
          onBack={() => router.push('/' as any)}
        />

        {/* Config Loading/Error States */}
        {isConfigLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : configError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Configuration Error</Text>
            <Text style={styles.errorText}>
              Failed to load app configuration. Please check your connection and
              try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                // Invalidate the config query to trigger a refetch
                queryClient.invalidateQueries({ queryKey: ['app-config'] });
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : virtualCardCreationFee === undefined ||
          cashwyreBaseFee === undefined ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Configuration Missing</Text>
            <Text style={styles.errorText}>
              Required configuration data is missing. Please contact support.
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Existing Cards */}
              <View style={styles.cardsContainer}>
                {isLoadingCards ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10b981" />
                    <Text style={styles.loadingText}>
                      Loading your cards...
                    </Text>
                  </View>
                ) : cards.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <CreditCard size={48} color="#6b7280" />
                    <Text style={styles.emptyTitle}>No Cards Yet</Text>
                    <Text style={styles.emptyText}>
                      Create your first virtual card to get started
                    </Text>
                  </View>
                ) : (
                  cards.map(renderPaymentCard)
                )}
              </View>
            </ScrollView>

            {/* Add New Card Button */}
            <BottomActionContainer>
              <PrimaryActionButton
                title="ADD NEW CARD"
                onPress={handleAddCardPress}
              />
            </BottomActionContainer>

            {/* Create Card Bottom Sheet */}
            <CreateCardBottomSheet
              ref={addCardBottomSheetRef}
              onCreateCard={handleAddCard}
              onClose={() => {}}
              isLoading={isLoading}
            />
          </>
        )}

        {/* Custom Alert */}
        <CustomAlert
          title={customAlert.title}
          message={customAlert.message}
          type={customAlert.type}
          visible={customAlert.visible}
          onDismiss={hideCustomAlert}
          buttons={customAlert.buttons}
        />
      </ScreenContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  cardsContainer: {
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#ffffff',
    marginTop: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#a1a1aa',
    marginBottom: 6,
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
  inputWrapperError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  inputIcon: {
    marginRight: 12,
  },
  balanceInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    height: 48,
    paddingVertical: 0,
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
    padding: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  errorTitle: {
    fontSize: 20,
    color: '#ef4444',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
