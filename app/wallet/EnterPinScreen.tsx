import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { scale } from 'react-native-size-matters';
import { unlockApp } from '@/services/walletService';
import { triggerShake } from '@/utils/animations';
import ScreenContainer from '@/components/ScreenContainer';
import PinInputSection from '@/components/PinInputSection';

interface EnterPinScreenProps {
  onWalletUnlocked: () => void;
  publicKey?: string | null;
}

const EnterPinScreen: React.FC<EnterPinScreenProps> = ({
  onWalletUnlocked,
  publicKey,
}) => {
  const [pin, setPin] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log(process.env.EXPO_PUBLIC_APP_ENV);
    console.log(process.env.EXPO_PUBLIC_DEV_PIN);
    const autoUnlockDev = async () => {
      if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
        const devPin = process.env.EXPO_PUBLIC_DEV_PIN;
        if (devPin) {
          console.log(
            `Development mode: Attempting auto-unlock with EXPO_PUBLIC_DEV_PIN ${devPin}`,
          );
          setIsValidating(true);
          try {
            const success = await unlockApp(devPin);
            if (success) {
              console.log('Development mode: Auto-unlock successful.');
              onWalletUnlocked();
            } else {
              console.warn('Development mode: Auto-unlock failed.');
              setError('Dev auto-unlock failed. Please enter PIN manually.');
            }
          } catch (err) {
            console.error('Development mode: Auto-unlock error:', err);
            setError('Error during dev auto-unlock.');
          } finally {
            setIsValidating(false);
          }
        }
      }
    };

    autoUnlockDev();
  }, [onWalletUnlocked]);

  // Auto-validate PIN when 6th digit is entered
  useEffect(() => {
    if (pin.length === 6 && !isValidating) {
      setIsValidating(true);
      setError(null);

      // Use requestAnimationFrame to ensure the UI updates (6th dot fills) before validation
      requestAnimationFrame(async () => {
        try {
          const success = await unlockApp(pin);
          if (success) {
            onWalletUnlocked();
          } else {
            // Invalid PIN, show the dot briefly then shake and reset
            setTimeout(() => {
              setError('Incorrect PIN');
              triggerShake(shakeAnimationValue);
              setPin('');
              setIsValidating(false);
            }, 200); // Brief delay to see the 6th dot before shake
          }
        } catch (err) {
          console.error('Unlock error:', err);
          setTimeout(() => {
            setError('Failed to unlock');
            triggerShake(shakeAnimationValue);
            setPin('');
            setIsValidating(false);
          }, 200);
        }
      });
    }
  }, [pin, isValidating, onWalletUnlocked, shakeAnimationValue]);

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (key: string) => {
      // Don't allow input while validating
      if (isValidating) return;

      if (key === 'backspace') {
        setPin((prev) => prev.slice(0, -1));
        if (error) setError(null);
      } else if (key >= '0' && key <= '9' && pin.length < 6) {
        setPin((prev) => prev + key);
        if (error) setError(null);
      }
    },
    [pin, error, isValidating],
  );

  const getTitle = () => {
    if (error) {
      return error;
    }
    return 'Enter Your PIN';
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Centered content (Title + PIN Dots + Keyboard) */}
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

export default EnterPinScreen;
