import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import ScreenContainer from '@/components/ScreenContainer';
import ScreenHeader from '@/components/ScreenHeader';
import PinInputSection from '@/components/PinInputSection';
import { verifyAppPin, changeAppPin } from '@/services/walletService';
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
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shakeAnimationValue = useRef(new Animated.Value(0)).current;

  // Auto-verify current PIN when 6 digits entered
  useEffect(() => {
    if (step === 'current' && currentPin.length === 6 && !isValidating) {
      setIsValidating(true);
      setError(null);

      requestAnimationFrame(async () => {
        try {
          const isValid = await verifyAppPin(currentPin);

          if (isValid) {
            setStep('new');
            setIsValidating(false);
          } else {
            setTimeout(() => {
              setError('Incorrect PIN');
              setCurrentPin('');
              triggerShake(shakeAnimationValue);
              setIsValidating(false);
            }, 200);
          }
        } catch (err) {
          console.error('Error verifying PIN:', err);
          setTimeout(() => {
            setError('Failed to verify PIN');
            setCurrentPin('');
            triggerShake(shakeAnimationValue);
            setIsValidating(false);
          }, 200);
        }
      });
    }
  }, [currentPin, step, isValidating, shakeAnimationValue]);

  // Auto-proceed to confirm when new PIN is 6 digits
  useEffect(() => {
    if (step === 'new' && newPin.length === 6 && !isValidating) {
      setIsValidating(true);

      requestAnimationFrame(() => {
        if (newPin === currentPin) {
          setTimeout(() => {
            setError('New PIN must be different');
            setNewPin('');
            triggerShake(shakeAnimationValue);
            setIsValidating(false);
          }, 200);
        } else {
          setStep('confirm');
          setIsValidating(false);
        }
      });
    }
  }, [newPin, step, currentPin, isValidating, shakeAnimationValue]);

  // Auto-confirm when confirm PIN is 6 digits
  useEffect(() => {
    if (
      step === 'confirm' &&
      confirmPin.length === 6 &&
      !isValidating &&
      !isLoading
    ) {
      setIsValidating(true);
      setError(null);

      requestAnimationFrame(async () => {
        if (confirmPin !== newPin) {
          setTimeout(() => {
            setError('PINs do not match');
            setConfirmPin('');
            triggerShake(shakeAnimationValue);
            setIsValidating(false);
          }, 200);
        } else {
          try {
            setIsLoading(true);
            await changeAppPin(currentPin, newPin);

            success('PIN Changed', 'Your PIN has been successfully updated');

            setTimeout(() => {
              router.back();
            }, 1500);
          } catch (err) {
            console.error('Error changing PIN:', err);
            setTimeout(() => {
              setError('Failed to change PIN');
              setConfirmPin('');
              triggerShake(shakeAnimationValue);
              setIsLoading(false);
              setIsValidating(false);
            }, 200);
          }
        }
      });
    }
  }, [
    confirmPin,
    newPin,
    step,
    isValidating,
    isLoading,
    currentPin,
    shakeAnimationValue,
    router,
    success,
  ]);

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
    // Don't allow input while validating or loading
    if (isValidating || isLoading) return;

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
            setCurrentPin(currentPin + key);
          }
          break;
        case 'new':
          if (newPin.length < 6) {
            setNewPin(newPin + key);
          }
          break;
        case 'confirm':
          if (confirmPin.length < 6) {
            setConfirmPin(confirmPin + key);
          }
          break;
      }
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <ScreenHeader
          title="Change PIN"
          onBack={handleClose}
          showBackButton={false}
        />

        {/* Main Content */}
        <View style={styles.content}>
          <PinInputSection
            title={getTitle()}
            subtitle={getSubtitle()}
            pin={getCurrentPin()}
            onKeyPress={handleKeyPress}
            maxLength={6}
            shakeAnimation={shakeAnimationValue}
            isValidating={isValidating || isLoading}
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
