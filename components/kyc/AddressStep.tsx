import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Animated,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { MapPin, Check, X } from 'lucide-react-native';
import colors from '@/constants/colors';
import IntroScreen from '@/components/wallet/IntroScreen';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import { triggerShake } from '@/utils/animations';
import {
  AddressService,
  AddressAutocompleteResult,
} from '@/services/addressService';
import { useDebounce } from '@/hooks/useDebounce';

interface AddressStepProps {
  onNext: (address: string, streetNumber: string) => Promise<void>;
  onBack?: () => void;
  initialAddress?: string;
  initialStreetNumber?: string;
  isLoading?: boolean;
}

const AddressStep: React.FC<AddressStepProps> = ({
  onNext,
  onBack,
  initialAddress = '',
  initialStreetNumber = '',
  isLoading = false,
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [streetNumber, setStreetNumber] = useState(initialStreetNumber);
  const [selectedAddress, setSelectedAddress] =
    useState<AddressAutocompleteResult | null>(null);
  const [addressError, setAddressError] = useState(false);
  const [streetNumberError, setStreetNumberError] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressAutocompleteResult[]>(
    [],
  );
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(
    null,
  );

  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const streetNumberRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);

  // Debounce the address input for autocomplete
  const debouncedAddress = useDebounce(address, 500);

  const validateAddress = (address: string): boolean => {
    return address.trim().length >= 5;
  };

  const hasMinimumAlphaCharacters = (text: string): boolean => {
    const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;
    return alphaCount >= 4;
  };

  const validateStreetNumber = (number: string): boolean => {
    return number.trim().length > 0;
  };

  useEffect(() => {
    // Only fetch suggestions if:
    // 1. Address has at least 4 alphabetic characters
    // 2. User hasn't selected an address yet or has modified it after selection
    // 3. Not already loading
    if (
      hasMinimumAlphaCharacters(debouncedAddress) &&
      !selectedAddress &&
      !isLoadingSuggestions
    ) {
      fetchAddressSuggestions(debouncedAddress);
    } else if (!hasMinimumAlphaCharacters(debouncedAddress)) {
      setSuggestions([]);
      setShowSuggestions(false);
      setAutocompleteError(null);
    }
  }, [debouncedAddress]);

  const fetchAddressSuggestions = async (query: string) => {
    setIsLoadingSuggestions(true);
    setAutocompleteError(null);

    try {
      const response = await AddressService.autocomplete({
        query,
        maxResults: 5,
        country: 'ZAF', // South Africa
        language: 'en',
      });

      setSuggestions(response.results);
      setShowSuggestions(response.results.length > 0);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setAutocompleteError(
        error instanceof Error ? error.message : 'Failed to fetch suggestions',
      );
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleStreetNumberChange = (text: string) => {
    setStreetNumber(text);
    if (streetNumberError) {
      setStreetNumberError(!validateStreetNumber(text));
    }
  };

  const handleAddressChange = (text: string) => {
    setAddress(text);
    setSelectedAddress(null); // Clear selection when user types
    setShowSuggestions(true);

    // Clear error when user starts typing
    if (addressError) {
      setAddressError(!validateAddress(text));
    }
  };

  const handleSelectSuggestion = (result: AddressAutocompleteResult) => {
    // Auto-fill street number if available
    if (result.address.addressNumber && !streetNumber) {
      setStreetNumber(result.address.addressNumber);
    }

    // Use address without the number for cleaner display
    const addressWithoutNumber = getAddressWithoutNumber(result);
    setAddress(addressWithoutNumber);
    setSelectedAddress(result);
    setShowSuggestions(false);
    setSuggestions([]);
    setAddressError(false);
    setStreetNumberError(false);
    Keyboard.dismiss();
  };

  /**
   * Build full address string WITHOUT the street number
   */
  const getAddressWithoutNumber = (
    result: AddressAutocompleteResult,
  ): string => {
    const parts: string[] = [];

    // Skip addressNumber - we want it separate
    if (result.address.street) {
      parts.push(result.address.street);
    }

    if (result.address.locality) {
      parts.push(result.address.locality);
    }

    if (result.address.region) {
      parts.push(result.address.region);
    }

    if (result.address.postalCode) {
      parts.push(result.address.postalCode);
    }

    if (result.address.country) {
      parts.push(result.address.country);
    }

    return parts.join(', ') || result.label || result.title;
  };

  const handleClearAddress = () => {
    setAddress('');
    setSelectedAddress(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setAddressError(false);
    addressRef.current?.focus();
  };

  const handleAddressBlur = () => {
    // Delay to allow suggestion selection
    setTimeout(() => {
      setShowSuggestions(false);
      setAddressError(!validateAddress(address));
    }, 200);
  };

  const handleAddressFocus = () => {
    if (hasMinimumAlphaCharacters(address) && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleContinue = async () => {
    const addressValid = validateAddress(address);
    const streetNumberValid = validateStreetNumber(streetNumber);

    setAddressError(!addressValid);
    setStreetNumberError(!streetNumberValid);

    if (!addressValid || !streetNumberValid) {
      triggerShake(shakeAnimationValue);
      return;
    }

    try {
      // Pass address and street number separately
      await onNext(address, streetNumber.trim());
    } catch (error) {
      console.error('Error in address step:', error);
      triggerShake(shakeAnimationValue);
    }
  };

  const isValid =
    address.trim().length > 0 &&
    validateAddress(address) &&
    streetNumber.trim().length > 0;

  return (
    <IntroScreen
      title="Place of Residence"
      subtitle="Enter your street number and address"
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
      <View style={styles.contentContainer}>
        {/* Street Number Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Street Number *</Text>
          <Animated.View
            style={[
              styles.inputWrapper,
              streetNumberError && styles.inputWrapperError,
              { transform: [{ translateX: shakeAnimationValue }] },
            ]}
          >
            <TextInput
              ref={streetNumberRef}
              style={styles.textInput}
              placeholder="e.g., 14"
              placeholderTextColor="#6b7280"
              value={streetNumber}
              onChangeText={handleStreetNumberChange}
              editable={!isLoading}
              keyboardType="default"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => addressRef.current?.focus()}
            />
          </Animated.View>
          {streetNumberError && (
            <Text style={styles.inputHintError}>
              * Street number is required
            </Text>
          )}
        </View>

        {/* Address Input with Autocomplete */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Street Address *</Text>
          <Animated.View
            style={[
              styles.inputWrapper,
              addressError && styles.inputWrapperError,
              { transform: [{ translateX: shakeAnimationValue }] },
            ]}
          >
            <MapPin size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              ref={addressRef}
              style={styles.textInput}
              placeholder="Enter your address"
              placeholderTextColor="#6b7280"
              value={address}
              onChangeText={handleAddressChange}
              onBlur={handleAddressBlur}
              onFocus={handleAddressFocus}
              editable={!isLoading}
              autoComplete="street-address"
              autoCorrect={false}
              multiline={true}
            />
            {isLoadingSuggestions && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.loadingIcon}
              />
            )}
            {!isLoadingSuggestions &&
              address.trim().length > 0 &&
              !selectedAddress && (
                <TouchableOpacity onPress={handleClearAddress}>
                  <X size={20} color="#9ca3af" style={styles.clearIcon} />
                </TouchableOpacity>
              )}
            {selectedAddress && (
              <Check size={20} color="#10b981" style={styles.validIcon} />
            )}
          </Animated.View>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ScrollView
              style={styles.suggestionsContainer}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.placeId}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                  activeOpacity={0.7}
                >
                  <MapPin
                    size={16}
                    color={colors.textSecondary}
                    style={styles.suggestionIcon}
                  />
                  <View style={styles.suggestionContent}>
                    {/* Show label (with number) as main text, title as secondary */}
                    <Text style={styles.suggestionTitle} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {item.title !== item.label && (
                      <Text style={styles.suggestionLabel} numberOfLines={1}>
                        {item.title}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Error Messages */}
          {addressError && (
            <Text style={styles.inputHintError}>
              * Please enter a valid address (minimum 5 characters)
            </Text>
          )}
          {autocompleteError && !addressError && (
            <Text style={styles.inputHintWarning}>
              Unable to fetch suggestions. You can still enter your address
              manually.
            </Text>
          )}
          {!addressError &&
            !autocompleteError &&
            (address.trim().length === 0 || !validateAddress(address)) && (
              <Text style={styles.inputHint}>
                Start typing for suggestions (e.g., Wherry Rd, Muizenberg)
              </Text>
            )}
        </View>
      </View>
    </IntroScreen>
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#404040',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    minHeight: verticalScale(52),
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    marginRight: scale(12),
    marginTop: verticalScale(2),
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(16),
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    textAlignVertical: 'top',
    minHeight: verticalScale(20),
    maxHeight: verticalScale(80),
  },
  validIcon: {
    marginLeft: scale(8),
  },
  loadingIcon: {
    marginLeft: scale(8),
  },
  clearIcon: {
    marginLeft: scale(8),
  },
  inputHint: {
    fontSize: moderateScale(13),
    color: '#9ca3af',
    marginTop: verticalScale(6),
  },
  inputHintError: {
    fontSize: moderateScale(13),
    color: '#ef4444',
    marginTop: verticalScale(6),
  },
  inputHintWarning: {
    fontSize: moderateScale(13),
    color: '#f59e0b',
    marginTop: verticalScale(6),
  },
  suggestionsContainer: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#404040',
    marginTop: verticalScale(8),
    maxHeight: verticalScale(250),
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  suggestionIcon: {
    marginRight: scale(12),
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: moderateScale(15),
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: verticalScale(2),
  },
  suggestionLabel: {
    fontSize: moderateScale(13),
    color: colors.textSecondary,
  },
});

export default AddressStep;
