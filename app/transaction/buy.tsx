import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import ScreenHeader from '@/components/ScreenHeader';
import ScreenContainer from '@/components/ScreenContainer';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import CircularNumericKeyboard from '@/components/keyboard/CircularNumericKeyboard';
import CountryPickerBottomSheet, {
  CountryPickerBottomSheetRef,
} from '@/components/bottom-sheets/CountryPickerBottomSheet';
import { Country, countries } from '@/constants/countries';
import colors from '@/constants/colors';
import { formatNumber } from '@/utils/formatters';
import { useWalletPublicKey } from '@/services/walletService';
import { generateSignature } from '@/utils/signature';
import {
  useCountryPaymentMethods,
  useActiveYellowCardChannels,
} from '@/hooks/useYellowCardChannels';
import type { YellowCardChannel } from '@/services/yellowcardApi';

interface CountryPaymentInfo {
  currency: string;
  buyAvailable: boolean;
  paymentMethods: string[];
}

const COUNTRY_PAYMENT_MAP: Record<string, CountryPaymentInfo> = {
  NG: {
    currency: 'NGN',
    buyAvailable: true,
    paymentMethods: ['Instant Bank Transfer'],
  },
  GH: {
    currency: 'GHS',
    buyAvailable: false,
    paymentMethods: ['Mobile Money (momo)'],
  },
  KE: {
    currency: 'KES',
    buyAvailable: false,
    paymentMethods: ['Mobile Money (momo)'],
  },
  ZA: { currency: 'ZAR', buyAvailable: true, paymentMethods: ['Instant EFT'] },
  CM: {
    currency: 'XAF',
    buyAvailable: true,
    paymentMethods: ['Mobile Money (momo)'],
  },
  ZM: {
    currency: 'ZMW',
    buyAvailable: true,
    paymentMethods: ['Bank Transfer', 'Mobile Money (momo)'],
  },
  BW: {
    currency: 'BWP',
    buyAvailable: true,
    paymentMethods: ['Bank Transfer'],
  },
  RW: {
    currency: 'RWF',
    buyAvailable: true,
    paymentMethods: ['Bank Transfer'],
  },
  MW: {
    currency: 'MWK',
    buyAvailable: true,
    paymentMethods: ['Bank Transfer', 'Mobile Money (momo)'],
  },
  CI: {
    currency: 'XOF',
    buyAvailable: false,
    paymentMethods: ['Mobile Money (momo)'],
  },
  SN: {
    currency: 'XOF',
    buyAvailable: false,
    paymentMethods: ['Mobile Money (momo)'],
  },
  TZ: {
    currency: 'TZS',
    buyAvailable: true,
    paymentMethods: ['Bank Transfer', 'Mobile Money (momo)'],
  },
  UG: {
    currency: 'UGX',
    buyAvailable: true,
    paymentMethods: ['Bank Transfer'],
  },
  BJ: {
    currency: 'XOF',
    buyAvailable: false,
    paymentMethods: ['Mobile Money (momo)'],
  },
  CG: {
    currency: 'XAF',
    buyAvailable: false,
    paymentMethods: ['Bank Transfer'],
  },
  CD: {
    currency: 'CDF',
    buyAvailable: false,
    paymentMethods: ['Mobile Money (momo)'],
  },
  GA: {
    currency: 'XAF',
    buyAvailable: true,
    paymentMethods: ['Bank Transfer'],
  },
  TG: {
    currency: 'XOF',
    buyAvailable: true,
    paymentMethods: ['Mobile Money (momo)'],
  },
  ML: {
    currency: 'XOF',
    buyAvailable: false,
    paymentMethods: ['Mobile Money (momo)'],
  },
  BF: {
    currency: 'XOF',
    buyAvailable: false,
    paymentMethods: ['Mobile Money (momo)'],
  },
};

export default function BuyScreen() {
  const router = useRouter();
  const walletAddress = useWalletPublicKey();
  const countryPickerRef = useRef<CountryPickerBottomSheetRef>(null);
  const [amount, setAmount] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [selectedChannel, setSelectedChannel] =
    useState<YellowCardChannel | null>(null);
  const [showPaymentMethodPicker, setShowPaymentMethodPicker] = useState(false);

  const countryInfo = selectedCountry
    ? COUNTRY_PAYMENT_MAP[selectedCountry.code]
    : null;

  // Get all active channels to determine which countries are available
  const { data: allChannelsData } = useActiveYellowCardChannels();

  // Filter countries to only show those with active channels
  const availableCountries = React.useMemo(() => {
    if (!allChannelsData?.channels) return [];

    const countriesWithChannels = new Set(
      allChannelsData.channels.map((channel) => channel.country),
    );

    return countries.filter((country) =>
      countriesWithChannels.has(country.code),
    );
  }, [allChannelsData]);

  // Fetch filtered channels and payment methods for selected country
  const {
    channels: availableChannels,
    paymentMethods: paymentMethodTypes,
    isLoading: isLoadingChannels,
  } = useCountryPaymentMethods(selectedCountry?.code, countryInfo?.currency);

  // Helper function to map channelType to display name
  const getPaymentMethodName = (channelType: string): string => {
    if (channelType === 'momo') return 'Mobile Money (momo)';
    if (channelType === 'eft') return 'EFT';
    return channelType.charAt(0).toUpperCase() + channelType.slice(1);
  };

  // Map channel types to display names
  const paymentMethods = paymentMethodTypes.map(getPaymentMethodName);

  // Auto-select first channel when available channels change
  useEffect(() => {
    if (availableChannels.length > 0) {
      // Auto-select the first available channel
      const firstChannel = availableChannels[0];
      setSelectedChannel(firstChannel);

      // Auto-select the first payment method
      const methodName = getPaymentMethodName(firstChannel.channelType);
      setSelectedPaymentMethod(methodName);
    } else {
      setSelectedChannel(null);
      setSelectedPaymentMethod(null);
    }
    setShowPaymentMethodPicker(false);
  }, [availableChannels]);

  // Get min/max limits from selected channel
  const minAmount = selectedChannel?.widgetMin ?? selectedChannel?.min ?? 0;
  const maxAmount = selectedChannel?.widgetMax ?? selectedChannel?.max ?? 0;
  const currentAmount = amount ? parseFloat(amount) : 0;
  const isAmountTooLow = currentAmount > 0 && currentAmount < minAmount;
  const isAmountTooHigh = maxAmount > 0 && currentAmount > maxAmount;

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setAmount((prev) => prev.slice(0, -1));
    } else {
      // Limit to reasonable amount length (no decimals)
      if (amount.length < 10) {
        setAmount((prev) => {
          // Prevent leading zeros
          if (prev === '0') return key;
          return prev + key;
        });
      }
    }
  };

  const handleBuy = async () => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_YELLOWCARD_API_KEY;

      if (!apiKey) {
        console.error('YellowCard API key not found');
        alert('Configuration error. Please try again later.');
        return;
      }

      if (!walletAddress) {
        console.error('Wallet address not found');
        alert('Wallet not initialized. Please try again.');
        return;
      }

      if (!countryInfo?.currency) {
        console.error('Currency not selected');
        alert('Please select a country first.');
        return;
      }

      if (!selectedChannel) {
        console.error('No payment channel selected');
        alert('No payment method available for this country.');
        return;
      }

      // Generate signature for wallet address and token
      const signature = await generateSignature(walletAddress, 'SOL');

      // Build query parameters
      const params = new URLSearchParams({
        walletAddress: walletAddress,
        currencyAmount: amount,
        token: 'SOL',
        network: 'SOL',
        localCurrency: countryInfo.currency,
        signature: signature,
        txType: 'buy',
        channelId: selectedChannel.id,
      });

      const url = `https://sandbox--payments-widget.netlify.app/landing/${apiKey}?${params.toString()}`;

      console.log('Opening YellowCard widget URL:', url);
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening YellowCard widget:', error);
      alert('Failed to open payment widget. Please try again.');
    }
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    // Channel selection is handled automatically by useEffect
  };

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);

    // Find the channel matching this payment method
    const matchingChannel = availableChannels.find(
      (channel) => getPaymentMethodName(channel.channelType) === method,
    );

    if (matchingChannel) {
      setSelectedChannel(matchingChannel);
    }

    setShowPaymentMethodPicker(false);
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScreenHeader
        title="Buy"
        onBack={() => router.push('/' as any)}
        showBackButton={false}
      />

      <View style={styles.content}>
        {/* Amount Input Section */}
        <View style={styles.amountSection}>
          <Text style={styles.amountText}>
            {amount ? formatNumber(parseFloat(amount), 0) : '0'}
            {(countryInfo?.currency || selectedCountry?.currency) && (
              <>
                {' '}
                <Text style={styles.amountCurrency}>
                  {countryInfo?.currency || selectedCountry?.currency}
                </Text>
              </>
            )}
          </Text>
          {selectedChannel && minAmount > 0 && (
            <View style={styles.limitsContainer}>
              <Text style={styles.limitsText}>
                Min:{' '}
                <Text
                  style={[
                    styles.limitValue,
                    isAmountTooLow && styles.limitViolated,
                  ]}
                >
                  {formatNumber(minAmount, 0)}
                </Text>
                {maxAmount > 0 && (
                  <>
                    {' • Max: '}
                    <Text
                      style={[
                        styles.limitValue,
                        isAmountTooHigh && styles.limitViolated,
                      ]}
                    >
                      {formatNumber(maxAmount, 0)}
                    </Text>
                  </>
                )}
              </Text>
              {selectedChannel.estimatedSettlementTime && (
                <Text style={styles.estimatedTimeText}>
                  ≈ {selectedChannel.estimatedSettlementTime} mins
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Keyboard and Button Section */}
        <View style={styles.bottomSection}>
          {/* Selectors Row */}
          <View style={styles.selectorsRow}>
            {/* Payment Method Selector */}
            <View style={styles.paymentMethodContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodSelector,
                  !selectedCountry && styles.paymentMethodSelectorDisabled,
                ]}
                onPress={() =>
                  selectedCountry &&
                  setShowPaymentMethodPicker(!showPaymentMethodPicker)
                }
                activeOpacity={0.7}
                disabled={!selectedCountry}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    !selectedCountry && styles.paymentMethodTextDisabled,
                  ]}
                >
                  {selectedPaymentMethod ||
                    paymentMethods[0] ||
                    'Select Payment Method'}
                </Text>
                <ChevronDown
                  size={20}
                  color={selectedCountry ? colors.white : colors.textSecondary}
                />
              </TouchableOpacity>

              {showPaymentMethodPicker && paymentMethods.length > 0 && (
                <View style={styles.paymentMethodDropdownWrapper}>
                  <View style={styles.paymentMethodDropdown}>
                    {paymentMethods.map((method) => (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.paymentMethodOption,
                          selectedPaymentMethod === method &&
                            styles.selectedPaymentMethodOption,
                        ]}
                        onPress={() => handlePaymentMethodSelect(method)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.paymentMethodOptionText}>
                          {method}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Country Selector */}
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => countryPickerRef.current?.present()}
              activeOpacity={0.7}
            >
              <Text style={styles.countryFlag}>
                {selectedCountry?.flag || '🌍'}
              </Text>
              <ChevronDown size={16} color={colors.white} />
            </TouchableOpacity>
          </View>

          <CircularNumericKeyboard onKeyPress={handleKeyPress} />

          <View style={styles.buttonContainer}>
            <PrimaryActionButton
              title="Buy"
              onPress={handleBuy}
              disabled={
                !amount ||
                amount === '0' ||
                !selectedCountry ||
                !countryInfo?.buyAvailable ||
                isAmountTooLow ||
                isAmountTooHigh
              }
            />
          </View>
        </View>
      </View>

      <CountryPickerBottomSheet
        ref={countryPickerRef}
        countries={availableCountries}
        onCountrySelect={handleCountrySelect}
        onClose={() => countryPickerRef.current?.dismiss()}
        showDialCode={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: scale(16),
    gap: 10,
  },
  amountSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    // padding: scale(16),
  },
  amountText: {
    fontSize: moderateScale(40),
    fontFamily: 'Inter-Bold',
    color: colors.white,
    textAlign: 'center',
  },
  amountCurrency: {
    fontSize: moderateScale(40),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  limitsContainer: {
    marginTop: verticalScale(8),
  },
  limitsText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  limitValue: {
    fontFamily: 'Inter-SemiBold',
    color: colors.textSecondary,
  },
  limitViolated: {
    color: '#FF6B6B',
  },
  estimatedTimeText: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: verticalScale(4),
  },
  selectorsRow: {
    flexDirection: 'row',
    gap: scale(12),
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(16),
    height: verticalScale(56),
    gap: scale(4),
  },
  countryFlag: {
    fontSize: moderateScale(28),
  },
  bottomSection: {
    paddingBottom: verticalScale(16),
  },
  paymentMethodContainer: {
    flex: 1,
  },
  paymentMethodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    height: verticalScale(56),
  },
  paymentMethodText: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-Medium',
    color: colors.white,
  },
  paymentMethodSelectorDisabled: {
    opacity: 0.5,
  },
  paymentMethodTextDisabled: {
    color: colors.textSecondary,
  },
  paymentMethodDropdownWrapper: {
    position: 'absolute',
    top: verticalScale(60),
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  paymentMethodDropdown: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: scale(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  paymentMethodOption: {
    padding: scale(12),
    borderRadius: 8,
  },
  selectedPaymentMethodOption: {
    backgroundColor: '#2A2A2A',
  },
  paymentMethodOptionText: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-Medium',
    color: colors.white,
  },
  buttonContainer: {
    // marginTop: verticalScale(24),
  },
});
