import React, { useCallback, useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, TouchableOpacity } from 'react-native';
import { scale, moderateScale } from 'react-native-size-matters';
import { RotateCcw } from 'lucide-react-native';
import colors from '@/constants/colors';
import ScreenContainer from '@/components/ScreenContainer';
import PinInputSection from '@/components/PinInputSection';
import { triggerShake } from '@/utils/animations';

type PinStep = 'create' | 'confirm';

interface CreatePinStepProps {
  pin: string;
  onPinChange: (pin: string) => void;
  onNext: () => void;
  onBack?: () => void;
  isLoading: boolean;
}

const CreatePinStep: React.FC<CreatePinStepProps> = ({
  pin,
  onPinChange,
  onNext,
  onBack,
  isLoading,
}) => {
  const [pinStep, setPinStep] = useState<PinStep>('create');
  const [createdPin, setCreatedPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;

  // Auto-validate when 6th digit is entered
  useEffect(() => {
    if (pinStep === 'create' && pin.length === 6) {
      // Auto-proceed to confirm step
      setCreatedPin(pin);
      setPinStep('confirm');
      onPinChange(''); // Clear the PIN input for confirmation
    }
  }, [pin, pinStep, onPinChange]);

  useEffect(() => {
    if (
      pinStep === 'confirm' &&
      pin.length === 6 &&
      !isValidating &&
      !isLoading
    ) {
      setIsValidating(true);

      // Use requestAnimationFrame to ensure the UI updates (6th dot fills) before validation
      requestAnimationFrame(() => {
        if (pin === createdPin) {
          // PIN matches, proceed immediately
          onNext();
          setIsValidating(false);
        } else {
          // PIN doesn't match, show the dot briefly then shake and reset
          setTimeout(() => {
            triggerShake(shakeAnimationValue);
            onPinChange('');
            setIsValidating(false);
          }, 200); // Brief delay to see the 6th dot before shake
        }
      });
    }
  }, [
    pin,
    createdPin,
    pinStep,
    isValidating,
    isLoading,
    onNext,
    onPinChange,
    shakeAnimationValue,
  ]);

  const handleKeyPress = useCallback(
    (key: string) => {
      // Don't allow input while validating or loading
      if (isValidating || isLoading) return;

      if (key === 'backspace') {
        onPinChange(pin.slice(0, -1));
      } else if (key >= '0' && key <= '9' && pin.length < 6) {
        onPinChange(pin + key);
      }
    },
    [pin, onPinChange, isValidating, isLoading],
  );

  const getTitle = () => {
    return pinStep === 'create' ? 'Create Your PIN' : 'Confirm Your PIN';
  };

  const handleReset = () => {
    // Reset to create step with empty PIN
    setPinStep('create');
    setCreatedPin('');
    setConfirmPin('');
    onPinChange('');
    setIsValidating(false);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Retry Button - Absolutely Positioned */}
      <TouchableOpacity
        style={styles.retryButton}
        onPress={handleReset}
        activeOpacity={0.7}
      >
        <RotateCcw size={scale(20)} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.container}>
        {/* First Section: Centered content (Title + PIN Dots + Keyboard) */}
        <PinInputSection
          title={getTitle()}
          pin={pin}
          onKeyPress={handleKeyPress}
          maxLength={6}
          shakeAnimation={shakeAnimationValue}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
  retryButton: {
    position: 'absolute',
    top: scale(16),
    right: scale(20),
    zIndex: 1000,
    padding: scale(8),
  },
});

export default CreatePinStep;
