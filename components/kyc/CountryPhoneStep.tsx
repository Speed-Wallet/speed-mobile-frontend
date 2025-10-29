import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { ChevronDown, Check } from 'lucide-react-native';
import colors from '@/constants/colors';
import IntroScreen from '@/components/wallet/IntroScreen';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import CountryPickerBottomSheet, {
  CountryPickerBottomSheetRef,
} from '@/components/bottom-sheets/CountryPickerBottomSheet';
import { Country } from '@/constants/countries';
import { triggerShake } from '@/utils/animations';

interface CountryPhoneStepProps {
  onNext: (country: Country, phoneNumber: string) => Promise<void>;
  onBack?: () => void;
  initialCountry?: Country;
  initialPhoneNumber?: string;
  isLoading?: boolean;
}

const CountryPhoneStep: React.FC<CountryPhoneStepProps> = ({
  onNext,
  onBack,
  initialCountry,
  initialPhoneNumber = '',
  isLoading = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(
    initialCountry || null,
  );
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [phoneNumberError, setPhoneNumberError] = useState(false);
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const countryPickerRef = useRef<CountryPickerBottomSheetRef>(null);

  const validatePhoneNumber = (phone: string): boolean => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return cleanPhone.length >= 8;
  };

  const handlePhoneChange = (phone: string) => {
    // Only allow numbers and spaces
    const numericText = phone.replace(/[^0-9\s]/g, '');
    setPhoneNumber(numericText);
    // Clear error when user starts typing
    if (phoneNumberError) {
      setPhoneNumberError(!validatePhoneNumber(numericText));
    }
  };

  const handlePhoneBlur = () => {
    setPhoneNumberError(!validatePhoneNumber(phoneNumber));
  };

  const handleCountrySelect = () => {
    countryPickerRef.current?.present();
  };

  const handleCountryPicked = (country: Country) => {
    setSelectedCountry(country);
  };

  const handleContinue = async () => {
    if (!selectedCountry) {
      // Trigger shake if no country selected
      triggerShake(shakeAnimationValue);
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneNumberError(true);
      triggerShake(shakeAnimationValue);
      return;
    }

    try {
      await onNext(selectedCountry, phoneNumber);
    } catch (error) {
      console.error('Error in country/phone step:', error);
      triggerShake(shakeAnimationValue);
    }
  };

  const isValid =
    selectedCountry !== null &&
    phoneNumber.trim().length > 0 &&
    validatePhoneNumber(phoneNumber);

  return (
    <>
      <IntroScreen
        title="Contact Information"
        subtitle="Select your country and enter your phone number"
        footer={
          <PrimaryActionButton
            title={isLoading ? 'Loading...' : 'Continue'}
            onPress={handleContinue}
            disabled={!isValid || isLoading}
            loading={isLoading}
            variant="primary"
          />
        }
      >
        {/* Development Back Button */}
        {/* Removed - back button not needed in KYC flow */}

        <View style={styles.contentContainer}>
          {/* Country Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Country</Text>
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={handleCountrySelect}
            >
              {selectedCountry ? (
                <>
                  <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryName}>{selectedCountry.name}</Text>
                </>
              ) : (
                <Text style={styles.countryPlaceholder}>Select a country</Text>
              )}
              <ChevronDown size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <Animated.View
              style={[
                styles.phoneInputWrapper,
                phoneNumberError && styles.inputWrapperError,
                { transform: [{ translateX: shakeAnimationValue }] },
              ]}
            >
              <View style={styles.phoneInputContainer}>
                {selectedCountry && (
                  <View style={styles.dialCodeContainer}>
                    <Text style={styles.countryFlag}>
                      {selectedCountry.flag}
                    </Text>
                    <Text style={styles.dialCode}>
                      {selectedCountry.dialCode}
                    </Text>
                  </View>
                )}
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#6b7280"
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  keyboardType="phone-pad"
                  editable={!isLoading}
                />
                {!phoneNumberError &&
                  phoneNumber.trim().length > 0 &&
                  validatePhoneNumber(phoneNumber) && (
                    <Check size={20} color="#10b981" style={styles.validIcon} />
                  )}
              </View>
            </Animated.View>
            {(phoneNumberError || phoneNumber.trim().length === 0) && (
              <Text
                style={[
                  styles.inputHint,
                  phoneNumberError && styles.inputHintError,
                ]}
              >
                {phoneNumberError ? '*' : ''}Minimum 8 digits
                {phoneNumberError ? ' *' : ''}
              </Text>
            )}
          </View>
        </View>
      </IntroScreen>

      {/* Country Picker Bottom Sheet */}
      <CountryPickerBottomSheet
        ref={countryPickerRef}
        onCountrySelect={handleCountryPicked}
        onClose={() => {}}
      />
    </>
  );
};

const styles = StyleSheet.create({
  devBackButton: {
    position: 'absolute',
    top: verticalScale(20),
    left: scale(20),
    zIndex: 100,
  },
  contentContainer: {
    gap: verticalScale(20),
  },
  inputContainer: {
    marginBottom: verticalScale(4),
  },
  inputLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: verticalScale(8),
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#404040',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
  },
  countryFlag: {
    fontSize: moderateScale(22),
    marginRight: scale(12),
  },
  countryName: {
    flex: 1,
    fontSize: moderateScale(16),
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  countryPlaceholder: {
    flex: 1,
    fontSize: moderateScale(16),
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  phoneInputWrapper: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#404040',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dialCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: scale(12),
    marginRight: scale(12),
    borderRightWidth: 1,
    borderRightColor: '#404040',
  },
  dialCode: {
    fontSize: moderateScale(16),
    color: colors.textPrimary,
    fontFamily: 'Inter-Medium',
  },
  phoneInput: {
    flex: 1,
    fontSize: moderateScale(16),
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
  },
  validIcon: {
    marginLeft: scale(8),
  },
  inputHint: {
    fontSize: moderateScale(13),
    color: '#9ca3af',
    marginTop: verticalScale(6),
  },
  inputHintError: {
    color: '#ef4444',
  },
});

export default CountryPhoneStep;
