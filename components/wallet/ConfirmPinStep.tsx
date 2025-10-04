import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { triggerShake } from '@/utils/animations';
import UnsafeScreenContainer from '@/components/UnsafeScreenContainer';
import BackButton from '@/components/buttons/BackButton';
import PinInputSection from '@/components/PinInputSection';

interface ConfirmPinStepProps {
  confirmPin: string;
  originalPin: string; // Add original PIN to compare against
  onConfirmPinChange: (pin: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const ConfirmPinStep: React.FC<ConfirmPinStepProps> = ({
  confirmPin,
  originalPin,
  onConfirmPinChange,
  onConfirm,
  onBack,
  isLoading,
}) => {
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const [isValidating, setIsValidating] = useState(false);

  // Auto-validate PIN when 6th digit is entered
  useEffect(() => {
    if (confirmPin.length === 6 && !isValidating && !isLoading) {
      setIsValidating(true);

      // Use requestAnimationFrame to ensure the UI updates (6th dot fills) before validation
      requestAnimationFrame(() => {
        if (confirmPin === originalPin) {
          // PIN matches, proceed immediately
          onConfirm();
          setIsValidating(false);
        } else {
          // PIN doesn't match, show the dot briefly then shake
          setTimeout(() => {
            triggerShake(shakeAnimationValue);
            onConfirmPinChange('');
            setIsValidating(false);
          }, 200); // Brief delay to see the 6th dot before shake
        }
      });
    }
  }, [
    confirmPin,
    originalPin,
    isValidating,
    isLoading,
    onConfirm,
    onConfirmPinChange,
    shakeAnimationValue,
  ]);

  const handleKeyPress = useCallback(
    (key: string) => {
      // Don't allow input while validating or loading
      if (isValidating || isLoading) return;

      if (key === 'backspace') {
        onConfirmPinChange(confirmPin.slice(0, -1));
      } else if (key >= '0' && key <= '9' && confirmPin.length < 6) {
        onConfirmPinChange(confirmPin + key);
      }
    },
    [confirmPin, onConfirmPinChange, isValidating, isLoading],
  );

  return (
    <UnsafeScreenContainer>
      {/* Development Back Button */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' && (
        <BackButton onPress={onBack} style={styles.devBackButton} />
      )}

      <View style={styles.container}>
        {/* First Section: Centered content (Title + PIN Dots + Keyboard) */}
        <PinInputSection
          title="Confirm Your PIN"
          pin={confirmPin}
          onKeyPress={handleKeyPress}
          maxLength={6}
          shakeAnimation={shakeAnimationValue}
        />

        {/* Second Section: Bottom button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>Back to Create PIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </UnsafeScreenContainer>
  );
};

const styles = StyleSheet.create({
  devBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? verticalScale(50) : verticalScale(20),
    left: scale(20),
    zIndex: 1000,
    backgroundColor: '#FFB800',
    borderRadius: moderateScale(20),
  },
  container: {
    flex: 1,
    paddingHorizontal: scale(20),
    justifyContent: 'space-between',
  },
  bottomSection: {
    paddingBottom:
      Platform.OS === 'ios' ? verticalScale(34) : verticalScale(24),
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: verticalScale(12),
  },
  backButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default ConfirmPinStep;
