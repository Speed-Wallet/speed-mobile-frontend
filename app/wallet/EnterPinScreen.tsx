import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { unlockApp } from '@/services/walletService';
import { triggerShake } from '@/utils/animations';
import ScreenContainer from '@/components/ScreenContainer';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
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
  const [isLoading, setIsLoading] = useState(false);
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
          setIsLoading(true);
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
            setIsLoading(false);
          }
        }
      }
    };

    autoUnlockDev();
  }, [onWalletUnlocked]);

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === 'backspace') {
        setPin((prev) => prev.slice(0, -1));
        if (error) setError(null);
      } else if (key >= '0' && key <= '9' && pin.length < 6) {
        setPin((prev) => prev + key);
        if (error) setError(null);
      }
    },
    [pin, error],
  );

  const handleUnlockWallet = async () => {
    if (pin.length < 6) {
      setError('PIN must be at least 6 digits.');
      triggerShake(shakeAnimationValue);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const success = await unlockApp(pin);
      if (success) {
        onWalletUnlocked();
      } else {
        setError('Invalid PIN. Please try again.');
        setPin('');
        triggerShake(shakeAnimationValue);
      }
    } catch (err) {
      console.error('Unlock error:', err);
      setError('Failed to unlock wallet. Please try again.');
      setPin('');
      triggerShake(shakeAnimationValue);
    }
    setIsLoading(false);
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* First Section: Centered content (Title + PIN Dots + Keyboard) */}
        <View style={styles.centerSection}>
          <PinInputSection
            title="Enter Your PIN"
            pin={pin}
            onKeyPress={handleKeyPress}
            maxLength={6}
          />

          {/* Error Message */}
          {error && (
            <Animated.View
              style={[
                styles.errorContainer,
                { transform: [{ translateX: shakeAnimationValue }] },
              ]}
            >
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}
        </View>

        {/* Second Section: Bottom button */}
        <View style={styles.bottomSection}>
          <PrimaryActionButton
            title={isLoading ? 'Unlocking...' : 'Unlock Wallet'}
            onPress={handleUnlockWallet}
            disabled={isLoading || pin.length < 6}
            loading={isLoading}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale(20),
    justifyContent: 'space-between',
  },
  centerSection: {
    flex: 1,
    position: 'relative',
  },
  errorContainer: {
    position: 'absolute',
    bottom: verticalScale(20),
    left: 0,
    right: 0,
    marginHorizontal: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: moderateScale(14),
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomSection: {
    paddingBottom: verticalScale(Platform.OS === 'ios' ? 34 : 24),
  },
});

export default EnterPinScreen;
