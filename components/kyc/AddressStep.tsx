import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Animated,
  TouchableOpacity,
  FlatList,
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
  const [selectedAddress, setSelectedAddress] =
    useState<AddressAutocompleteResult | null>(null);
  const [addressError, setAddressError] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressAutocompleteResult[]>(
    [],
  );
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(
    null,
  );

  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const addressRef = useRef<TextInput>(null);

  // Debounce the address input for autocomplete
  const debouncedAddress = useDebounce(address, 500);

  const validateAddress = (address: string): boolean => {
    return address.trim().length >= 5;
  };

  useEffect(() => {
    // Only fetch suggestions if:
    // 1. Address has meaningful length (at least 3 characters)
    // 2. User hasn't selected an address yet or has modified it after selection
    // 3. Not already loading
    if (
      debouncedAddress.trim().length >= 3 &&
      !selectedAddress &&
      !isLoadingSuggestions
    ) {
      fetchAddressSuggestions(debouncedAddress);
    } else if (debouncedAddress.trim().length < 3) {
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
    const fullAddress = AddressService.getFullAddress(result);
    setAddress(fullAddress);
    setSelectedAddress(result);
    setShowSuggestions(false);
    setSuggestions([]);
    setAddressError(false);
    Keyboard.dismiss();
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
    if (address.trim().length >= 3 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleContinue = async () => {
    const addressValid = validateAddress(address);

    setAddressError(!addressValid);

    if (!addressValid) {
      triggerShake(shakeAnimationValue);
      return;
    }

    try {
      // Extract street number from selected address or use empty string
      const streetNumber = selectedAddress?.address.addressNumber || '';
      await onNext(address, streetNumber);
    } catch (error) {
      console.error('Error in address step:', error);
      triggerShake(shakeAnimationValue);
    }
  };

  const isValid = address.trim().length > 0 && validateAddress(address);

  const renderSuggestion = ({ item }: { item: AddressAutocompleteResult }) => (
    <TouchableOpacity
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
        <Text style={styles.suggestionTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {item.label !== item.title && (
          <Text style={styles.suggestionLabel} numberOfLines={1}>
            {item.label}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <IntroScreen
      title="Place of Residence"
      subtitle="Start typing your address and select from suggestions"
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
        {/* Address Input with Autocomplete */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Address</Text>
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
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={suggestions}
                renderItem={renderSuggestion}
                keyExtractor={(item) => item.placeId}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Error Messages */}
          {addressError && (
            <Text style={styles.inputHintError}>
              *Please enter a valid address (minimum 5 characters)*
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
                Minimum 5 characters. Start typing for suggestions.
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
    alignItems: 'center',
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
  inputIcon: {
    marginRight: scale(12),
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(16),
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
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
