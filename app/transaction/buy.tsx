import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
import { Country } from '@/constants/countries';
import colors from '@/constants/colors';

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
  const countryPickerRef = useRef<CountryPickerBottomSheetRef>(null);
  const [amount, setAmount] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [showPaymentMethodPicker, setShowPaymentMethodPicker] = useState(false);

  const countryInfo = selectedCountry
    ? COUNTRY_PAYMENT_MAP[selectedCountry.code]
    : null;

  const paymentMethods = countryInfo?.paymentMethods || [];
  const hasMultiplePaymentMethods = paymentMethods.length > 1;

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setAmount((prev) => prev.slice(0, -1));
    } else if (key === '.') {
      // Allow decimal point only if not already present
      if (!amount.includes('.')) {
        setAmount((prev) => (prev === '' ? '0.' : prev + '.'));
      }
    } else {
      // Limit to reasonable amount length
      if (amount.length < 10) {
        setAmount((prev) => {
          // Prevent leading zeros
          if (prev === '0' && key !== '.') return key;
          return prev + key;
        });
      }
    }
  };

  const handleBuy = () => {
    // TODO: Implement buy functionality
    console.log('Buy', amount, countryInfo?.currency, selectedPaymentMethod);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    const info = COUNTRY_PAYMENT_MAP[country.code];
    // Always auto-select the first payment method
    if (info && info.paymentMethods.length > 0) {
      setSelectedPaymentMethod(info.paymentMethods[0]);
    } else {
      setSelectedPaymentMethod(null);
    }
    setShowPaymentMethodPicker(false);
  };

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
    setShowPaymentMethodPicker(false);
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScreenHeader title="Buy" onBack={() => router.push('/' as any)} />

      <View style={styles.content}>
        {/* Amount Input Section */}
        <View style={styles.amountSection}>
          <Text style={styles.amountText}>
            {amount || '0'}{' '}
            <Text style={styles.amountCurrency}>
              {countryInfo?.currency || selectedCountry?.currency || 'Currency'}
            </Text>
          </Text>
        </View>

        {/* Keyboard and Button Section */}
        <View style={styles.bottomSection}>
          {/* Selectors Row */}
          <View style={styles.selectorsRow}>
            {/* Payment Method Selector */}
            {selectedCountry && countryInfo && paymentMethods.length > 0 && (
              <View style={styles.paymentMethodContainer}>
                <TouchableOpacity
                  style={styles.paymentMethodSelector}
                  onPress={() =>
                    setShowPaymentMethodPicker(!showPaymentMethodPicker)
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.paymentMethodText}>
                    {selectedPaymentMethod || paymentMethods[0]}
                  </Text>
                  <ChevronDown size={20} color={colors.white} />
                </TouchableOpacity>

                {showPaymentMethodPicker && (
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
            )}

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
                !countryInfo?.buyAvailable
              }
            />
          </View>
        </View>
      </View>

      <CountryPickerBottomSheet
        ref={countryPickerRef}
        onCountrySelect={handleCountrySelect}
        onClose={() => countryPickerRef.current?.dismiss()}
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
    padding: scale(16),
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
    marginTop: verticalScale(24),
  },
});
