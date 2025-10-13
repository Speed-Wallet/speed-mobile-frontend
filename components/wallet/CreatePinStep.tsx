import React, { useCallback, useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { scale } from 'react-native-size-matters';
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

  return (
    <ScreenContainer edges={['top', 'bottom']}>
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
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
});

export default CreatePinStep;
