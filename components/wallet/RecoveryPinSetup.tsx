import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import PinInputSection from '@/components/PinInputSection';
import { triggerShake } from '@/utils/animations';

type Step = 'new' | 'confirm';

interface RecoveryPinSetupProps {
  onPinSet: (pin: string) => void;
}

export default function RecoveryPinSetup({ onPinSet }: RecoveryPinSetupProps) {
  const [step, setStep] = useState<Step>('new');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;

  const getTitle = () => {
    if (error) {
      return error;
    }

    switch (step) {
      case 'new':
        return 'Set New PIN';
      case 'confirm':
        return 'Confirm New PIN';
      default:
        return '';
    }
  };

  const getCurrentPin = () => {
    switch (step) {
      case 'new':
        return newPin;
      case 'confirm':
        return confirmPin;
      default:
        return '';
    }
  };

  const handleKeyPress = (key: string) => {
    setError(null);

    if (key === 'backspace') {
      switch (step) {
        case 'new':
          setNewPin((prev) => prev.slice(0, -1));
          break;
        case 'confirm':
          setConfirmPin((prev) => prev.slice(0, -1));
          break;
      }
    } else if (key >= '0' && key <= '9') {
      switch (step) {
        case 'new':
          if (newPin.length < 6) {
            const updatedPin = newPin + key;
            setNewPin(updatedPin);
            if (updatedPin.length === 6) {
              handleSetNewPin(updatedPin);
            }
          }
          break;
        case 'confirm':
          if (confirmPin.length < 6) {
            const updatedPin = confirmPin + key;
            setConfirmPin(updatedPin);
            if (updatedPin.length === 6) {
              handleConfirmNewPin(updatedPin);
            }
          }
          break;
      }
    }
  };

  const handleSetNewPin = (pinToSet?: string) => {
    const pin = pinToSet || newPin;
    if (pin.length < 6) {
      setError('PIN must be 6 digits');
      triggerShake(shakeAnimationValue);
      return;
    }

    // Move to confirmation step
    setStep('confirm');
  };

  const handleConfirmNewPin = (pinToConfirm?: string) => {
    const pin = pinToConfirm || confirmPin;
    if (pin.length < 6) {
      setError('PIN must be 6 digits');
      triggerShake(shakeAnimationValue);
      return;
    }

    if (pin !== newPin) {
      setError('PINs do not match');
      setConfirmPin('');
      triggerShake(shakeAnimationValue);
      return;
    }

    // PIN is set, call the callback
    onPinSet(newPin);
  };

  return (
    <View style={styles.container}>
      <PinInputSection
        title={getTitle()}
        pin={getCurrentPin()}
        onKeyPress={handleKeyPress}
        maxLength={6}
        shakeAnimation={shakeAnimationValue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
});
