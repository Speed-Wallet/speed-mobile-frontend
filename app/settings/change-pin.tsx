import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import ScreenContainer from '@/components/ScreenContainer';
import ScreenHeader from '@/components/ScreenHeader';
import PinInputSection from '@/components/PinInputSection';
import { verifyAppPin, createAppPin } from '@/services/walletService';
import { triggerShake } from '@/utils/animations';
import colors from '@/constants/colors';
import { useAlert } from '@/providers/AlertProvider';

type Step = 'current' | 'new' | 'confirm';

export default function ChangePinScreen() {
  const router = useRouter();
  const { success, alert } = useAlert();

  const [step, setStep] = useState<Step>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shakeAnimationValue = useRef(new Animated.Value(0)).current;

  const handleClose = () => {
    router.back();
  };

  const getTitle = () => {
    if (error) {
      return error;
    }

    switch (step) {
      case 'current':
        return 'Enter Current PIN';
      case 'new':
        return 'Enter New PIN';
      case 'confirm':
        return 'Confirm New PIN';
      default:
        return '';
    }
  };

  const getSubtitle = () => {
    return undefined;
  };

  const getCurrentPin = () => {
    switch (step) {
      case 'current':
        return currentPin;
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
        case 'current':
          setCurrentPin((prev) => prev.slice(0, -1));
          break;
        case 'new':
          setNewPin((prev) => prev.slice(0, -1));
          break;
        case 'confirm':
          setConfirmPin((prev) => prev.slice(0, -1));
          break;
      }
    } else if (key >= '0' && key <= '9') {
      switch (step) {
        case 'current':
          if (currentPin.length < 6) {
            const newCurrentPin = currentPin + key;
            setCurrentPin(newCurrentPin);
            if (newCurrentPin.length === 6) {
              // Auto-verify when 6 digits entered
              handleVerifyCurrentPin(newCurrentPin);
            }
          }
          break;
        case 'new':
          if (newPin.length < 6) {
            const newNewPin = newPin + key;
            setNewPin(newNewPin);
            if (newNewPin.length === 6) {
              // Auto-proceed when 6 digits entered
              handleSetNewPin(newNewPin);
            }
          }
          break;
        case 'confirm':
          if (confirmPin.length < 6) {
            const newConfirmPin = confirmPin + key;
            setConfirmPin(newConfirmPin);
            if (newConfirmPin.length === 6) {
              // Auto-confirm when 6 digits entered
              handleConfirmNewPin(newConfirmPin);
            }
          }
          break;
      }
    }
  };

  const handleVerifyCurrentPin = async (pinToVerify?: string) => {
    const pin = pinToVerify || currentPin;
    if (pin.length < 6) {
      setError('PIN must be at least 6 digits');
      triggerShake(shakeAnimationValue);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isValid = await verifyAppPin(pin);

      if (isValid) {
        // Move to next step
        setStep('new');
        setIsLoading(false);
      } else {
        setError('Incorrect PIN');
        setCurrentPin('');
        triggerShake(shakeAnimationValue);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error verifying PIN:', err);
      setError('Failed to verify PIN');
      setCurrentPin('');
      triggerShake(shakeAnimationValue);
      setIsLoading(false);
    }
  };

  const handleSetNewPin = (pinToSet?: string) => {
    const pin = pinToSet || newPin;
    if (pin.length < 6) {
      setError('PIN must be at least 6 digits');
      triggerShake(shakeAnimationValue);
      return;
    }

    if (pin === currentPin) {
      setError('New PIN must be different');
      setNewPin('');
      triggerShake(shakeAnimationValue);
      return;
    }

    // Move to confirmation step
    setStep('confirm');
  };

  const handleConfirmNewPin = async (pinToConfirm?: string) => {
    const pin = pinToConfirm || confirmPin;
    if (pin.length < 6) {
      setError('PIN must be at least 6 digits');
      triggerShake(shakeAnimationValue);
      return;
    }

    if (pin !== newPin) {
      setError('PINs do not match');
      setConfirmPin('');
      triggerShake(shakeAnimationValue);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create the new PIN (this will overwrite the old one)
      await createAppPin(newPin);

      success('PIN Changed', 'Your PIN has been successfully updated');

      // Navigate back to settings
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      console.error('Error changing PIN:', err);
      setError('Failed to change PIN');
      setConfirmPin('');
      triggerShake(shakeAnimationValue);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <ScreenHeader title="Change PIN" onBack={handleClose} />

        {/* Main Content */}
        <View style={styles.content}>
          <PinInputSection
            title={getTitle()}
            subtitle={getSubtitle()}
            pin={getCurrentPin()}
            onKeyPress={handleKeyPress}
            maxLength={6}
            shakeAnimation={shakeAnimationValue}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
