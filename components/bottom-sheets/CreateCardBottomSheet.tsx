import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated as RNAnimated,
} from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { CreditCard } from 'lucide-react-native';
import SettingsHeader from '@/components/SettingsHeader';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import TokenLogo from '@/components/TokenLogo';
import colors from '@/constants/colors';
import { useConfig } from '@/hooks/useConfig';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { USDT_ADDRESS } from '@/constants/tokens';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

// USDT Logo URI
const USDT_LOGO_URI = 'local://usdt-logo.png';

interface CreateCardBottomSheetProps {
  onCreateCard: (
    cardName: string,
    cardBalance: string,
    simulationType?: 'simulate_usdt_failed' | 'simulate_card_failed',
  ) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export interface CreateCardBottomSheetRef {
  expand: () => void;
  close: () => void;
}

const CreateCardBottomSheet = forwardRef<
  CreateCardBottomSheetRef,
  CreateCardBottomSheetProps
>(({ onCreateCard, onClose, isLoading = false }, ref) => {
  const [cardName, setCardName] = useState('');
  const [cardBalance, setCardBalance] = useState('');
  const [showValidationError, setShowValidationError] = useState(false);
  const [cardNameError, setCardNameError] = useState(false);
  const [cardBalanceError, setCardBalanceError] = useState(false);
  const [cardNameTouched, setCardNameTouched] = useState(false);
  const [cardBalanceTouched, setCardBalanceTouched] = useState(false);
  const [showDevButtons, setShowDevButtons] = useState(true);

  const bottomSheetRef = useRef<BottomSheet>(null);

  // TextInput refs for focusing on errors
  const cardNameRef = useRef<TextInput>(null);
  const cardBalanceRef = useRef<TextInput>(null);

  // Animation refs for shake effects
  const createButtonShakeAnim = useRef(new RNAnimated.Value(0)).current;
  const devButton1ShakeAnim = useRef(new RNAnimated.Value(0)).current;
  const devButton2ShakeAnim = useRef(new RNAnimated.Value(0)).current;

  // Get config values
  const { data: config } = useConfig();
  const virtualCardCreationFee = config?.virtualCardCreationFee;
  const cashwyreBaseFee = config?.cashwyreBaseFee;

  // Get USDT balance for validation
  const { balance: usdtBalance } = useTokenBalance(USDT_ADDRESS);

  useImperativeHandle(ref, () => ({
    expand: () => {
      // Reset form state when opening
      setCardName('');
      setCardBalance('');
      setShowValidationError(false);
      setCardNameError(false);
      setCardBalanceError(false);
      setCardNameTouched(false);
      setCardBalanceTouched(false);
      setShowDevButtons(true);
      bottomSheetRef.current?.expand();
    },
    close: () => bottomSheetRef.current?.close(),
  }));

  const validateCardBalance = (balance: string) => {
    if (!balance || !virtualCardCreationFee || !cashwyreBaseFee) return false;

    const amount = parseFloat(balance);
    if (isNaN(amount) || amount <= 0) return false;

    const totalRequired =
      amount + virtualCardCreationFee * amount + cashwyreBaseFee;
    return totalRequired > usdtBalance;
  };

  const handleBalanceChange = (text: string) => {
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

      // Only validate if already in error state (like KYC)
      if (cardBalanceError) {
        const balance = parseFloat(validText);
        if (validText && !isNaN(balance) && balance > 0) {
          const isInvalid =
            balance < 5 || balance > 2500 || validateCardBalance(validText);
          setCardBalanceError(isInvalid);
        }
      }

      // Validate the numeric value for range (5-2500)
      const balance = parseFloat(validText);
      if (validText && !isNaN(balance) && balance > 0) {
        if (balance < 5 || balance > 2500) {
          setShowValidationError(true);
        } else {
          setShowValidationError(false);
        }
      } else {
        setShowValidationError(false);
      }
    }
  };

  const handleBalanceBlur = () => {
    // Always validate on blur like KYC pattern
    setCardBalanceTouched(true);
    const balance = parseFloat(cardBalance);
    if (cardBalance && !isNaN(balance) && balance > 0) {
      const isInvalid =
        balance < 5 || balance > 2500 || validateCardBalance(cardBalance);
      setCardBalanceError(isInvalid);
    } else {
      setCardBalanceError(false);
    }
  };

  const handleClose = () => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const triggerShake = (animValue: RNAnimated.Value) => {
    RNAnimated.sequence([
      RNAnimated.timing(animValue, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      RNAnimated.timing(animValue, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      RNAnimated.timing(animValue, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      RNAnimated.timing(animValue, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Focus first invalid field similar to KYC
  const focusFirstInvalidField = () => {
    // First blur all inputs to ensure we can refocus properly
    [cardNameRef, cardBalanceRef].forEach((ref) => {
      if (ref.current) {
        ref.current.blur();
      }
    });

    // Use setTimeout to ensure blur completes before focusing
    setTimeout(() => {
      // Check card name first
      if (
        !cardName.trim() ||
        (cardName.trim().length > 0 && cardName.trim().length < 4)
      ) {
        if (cardNameRef.current) {
          cardNameRef.current.focus();
          // Position cursor at end of text
          setTimeout(() => {
            const textLength = cardName.length;
            cardNameRef.current?.setSelection(textLength, textLength);
          }, 50);
          return;
        }
      }
      // Then check balance
      if (
        !cardBalance ||
        parseFloat(cardBalance) <= 0 ||
        parseFloat(cardBalance) < 5 ||
        parseFloat(cardBalance) > 2500
      ) {
        if (cardBalanceRef.current) {
          cardBalanceRef.current.focus();
          // Position cursor at end of text
          setTimeout(() => {
            const textLength = cardBalance.length;
            cardBalanceRef.current?.setSelection(textLength, textLength);
          }, 50);
          return;
        }
      }
    }, 100);
  };

  // Handler functions for button interactions with shake animation
  const handleCreateCardAttempt = () => {
    const isDisabled =
      !cardName.trim() ||
      cardName.trim().length < 4 ||
      !cardBalance ||
      parseFloat(cardBalance) <= 0 ||
      isLoading ||
      showValidationError ||
      cardNameError ||
      cardBalanceError;

    if (isDisabled) {
      // Trigger shake animation and focus first invalid field
      triggerShake(createButtonShakeAnim);
      focusFirstInvalidField();
    } else {
      onCreateCard(cardName, cardBalance);
    }
  };

  const handleDevButton1Attempt = () => {
    const isDisabled =
      !cardName.trim() ||
      cardName.trim().length < 4 ||
      !cardBalance ||
      parseFloat(cardBalance) <= 0 ||
      isLoading ||
      showValidationError ||
      cardNameError ||
      cardBalanceError;

    if (isDisabled) {
      triggerShake(devButton1ShakeAnim);
    } else {
      onCreateCard(cardName, cardBalance, 'simulate_usdt_failed');
    }
  };

  const handleDevButton2Attempt = () => {
    const isDisabled =
      !cardName.trim() ||
      cardName.trim().length < 4 ||
      !cardBalance ||
      parseFloat(cardBalance) <= 0 ||
      isLoading ||
      showValidationError ||
      cardNameError ||
      cardBalanceError;

    if (isDisabled) {
      triggerShake(devButton2ShakeAnim);
    } else {
      onCreateCard(cardName, cardBalance, 'simulate_card_failed');
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enableDynamicSizing={true}
      enablePanDownToClose={true}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.bottomSheetHandle}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.4}
        />
      )}
      onClose={handleClose}
    >
      <BottomSheetView style={styles.bottomSheetContent}>
        <SettingsHeader title="Create New Card" onClose={handleClose} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Card Name Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Card Name</Text>
            <View
              style={[
                styles.inputWrapper,
                cardNameError && styles.inputWrapperError,
              ]}
            >
              <CreditCard size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                ref={cardNameRef}
                style={styles.balanceInput}
                placeholder="Enter card name"
                placeholderTextColor="#6b7280"
                value={cardName}
                onChangeText={(text) => {
                  // Only allow English letters (a-z, A-Z) and spaces
                  const letterRegex = /^[a-zA-Z\s]*$/;

                  // Remove any non-letter characters except spaces
                  const cleanedText = text.replace(/[^a-zA-Z\s]/g, '');

                  // Remove extra consecutive spaces and trim leading spaces
                  const normalizedText = cleanedText
                    .replace(/\s+/g, ' ')
                    .replace(/^\s+/, '');

                  // Only update if the text matches our letter pattern
                  if (letterRegex.test(normalizedText)) {
                    setCardName(normalizedText);
                    // Only check error state on text change if already in error state (like KYC)
                    if (cardNameError) {
                      setCardNameError(
                        normalizedText.length > 0 && normalizedText.length < 4,
                      );
                    }
                  }
                }}
                onBlur={() => {
                  // Always check error state on blur (like KYC)
                  setCardNameTouched(true);
                  setCardNameError(
                    cardName.trim().length > 0 && cardName.trim().length < 4,
                  );
                }}
              />
            </View>
            {cardNameTouched &&
              (cardNameError || cardName.trim().length === 0) && (
                <Text
                  style={[
                    styles.inputHint,
                    cardNameError && styles.inputHintError,
                  ]}
                >
                  {cardNameError ? '*' : ''}Minimum 4 characters, letters only
                  {cardNameError ? ' *' : ''}
                </Text>
              )}
          </View>

          {/* Balance Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Initial Balance</Text>
            <View
              style={[
                styles.inputWrapper,
                cardBalanceError && styles.inputWrapperError,
              ]}
            >
              <TokenLogo
                logoURI={USDT_LOGO_URI}
                size={20}
                style={styles.inputIcon}
              />
              <TextInput
                ref={cardBalanceRef}
                style={styles.balanceInput}
                placeholder="Enter amount"
                placeholderTextColor="#6b7280"
                value={cardBalance}
                onChangeText={handleBalanceChange}
                onBlur={handleBalanceBlur}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Balance range helper - always show since range is important */}
            <Text
              style={[
                styles.inputHint,
                cardBalanceError && styles.inputHintError,
              ]}
            >
              {cardBalanceError ? '*' : ''}Range: $5 - $2,500 USDT
              {cardBalanceError ? ' *' : ''}
            </Text>
          </View>

          {/* Fee Breakdown */}
          <View style={styles.section}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Total Fee</Text>
              <Text style={styles.feeValue}>
                {cardBalance && virtualCardCreationFee && cashwyreBaseFee
                  ? formatBalance(
                      virtualCardCreationFee * parseFloat(cardBalance) +
                        cashwyreBaseFee,
                    )
                  : formatBalance(cashwyreBaseFee || 0)}
              </Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.totalToPayLabel}>Total to Pay</Text>
              <Text style={styles.totalToPayValue}>
                {cardBalance && virtualCardCreationFee && cashwyreBaseFee
                  ? formatBalance(
                      parseFloat(cardBalance) +
                        virtualCardCreationFee * parseFloat(cardBalance) +
                        cashwyreBaseFee,
                    )
                  : formatBalance(cashwyreBaseFee || 0)}
              </Text>
            </View>
          </View>

          {/* Development Mode: Toggle and Simulation Buttons */}
          {process.env.EXPO_PUBLIC_APP_ENV === 'development' &&
            showDevButtons && (
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
                  <RNAnimated.View
                    style={{
                      transform: [{ translateX: devButton1ShakeAnim }],
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.devSimulateButton,
                        (!cardName.trim() ||
                          cardName.trim().length < 4 ||
                          !cardBalance ||
                          parseFloat(cardBalance) <= 0 ||
                          isLoading ||
                          showValidationError ||
                          cardNameError ||
                          cardBalanceError) &&
                          styles.devSimulateButtonDisabled,
                      ]}
                      onPress={handleDevButton1Attempt}
                    >
                      <Text
                        style={[
                          styles.devSimulateButtonText,
                          (!cardName.trim() ||
                            cardName.trim().length < 4 ||
                            !cardBalance ||
                            parseFloat(cardBalance) <= 0 ||
                            isLoading ||
                            showValidationError ||
                            cardNameError ||
                            cardBalanceError) &&
                            styles.devSimulateButtonTextDisabled,
                        ]}
                      >
                        Simulate USDT Send Failed
                      </Text>
                    </TouchableOpacity>
                  </RNAnimated.View>

                  <RNAnimated.View
                    style={{
                      transform: [{ translateX: devButton2ShakeAnim }],
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.devSimulateButton,
                        (!cardName.trim() ||
                          cardName.trim().length < 4 ||
                          !cardBalance ||
                          parseFloat(cardBalance) <= 0 ||
                          isLoading ||
                          showValidationError ||
                          cardNameError ||
                          cardBalanceError) &&
                          styles.devSimulateButtonDisabled,
                      ]}
                      onPress={handleDevButton2Attempt}
                    >
                      <Text
                        style={[
                          styles.devSimulateButtonText,
                          (!cardName.trim() ||
                            cardName.trim().length < 4 ||
                            !cardBalance ||
                            parseFloat(cardBalance) <= 0 ||
                            isLoading ||
                            showValidationError ||
                            cardNameError ||
                            cardBalanceError) &&
                            styles.devSimulateButtonTextDisabled,
                        ]}
                      >
                        Simulate Card Creation Failed
                      </Text>
                    </TouchableOpacity>
                  </RNAnimated.View>
                </View>
              </View>
            )}
        </ScrollView>

        {/* Create Card Button */}
        <View style={styles.createButtonContainer}>
          <RNAnimated.View
            style={{ transform: [{ translateX: createButtonShakeAnim }] }}
          >
            <PrimaryActionButton
              title={isLoading ? 'Creating Card...' : 'Create Virtual Card'}
              onPress={handleCreateCardAttempt}
              disabled={isLoading} // Only disable when loading
              loading={isLoading}
            />
          </RNAnimated.View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});

CreateCardBottomSheet.displayName = 'CreateCardBottomSheet';

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: colors.backgroundDark,
  },
  bottomSheetHandle: {
    backgroundColor: colors.textSecondary,
  },
  bottomSheetContent: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scrollContent: {
    paddingHorizontal: 15,
    gap: verticalScale(4), // Match KYC inputsContainer gap
  },
  section: {
    marginBottom: verticalScale(1), // Match KYC inputContainer marginBottom
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#a1a1aa',
    marginBottom: 6,
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
    marginTop: 2,
  },
  inputHintError: {
    color: '#ef4444',
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
  createButtonContainer: {
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 24,
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
});

export default CreateCardBottomSheet;
