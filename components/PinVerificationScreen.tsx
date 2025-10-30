import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import ScreenContainer from '@/components/ScreenContainer';
import IntroHeader from '@/components/wallet/IntroHeader';
import CodeInput from '@/components/CodeInput';
import { triggerShake } from '@/utils/animations';
import { StorageService } from '@/utils/storage';

interface PinVerificationScreenProps {
  onVerify: (pin: string) => Promise<boolean>;
  onBack: () => void;
  title?: string;
  subtitle?: string;
}

const PinVerificationScreen: React.FC<PinVerificationScreenProps> = ({
  onVerify,
  onBack,
  title = 'Enter PIN',
  subtitle = 'Virtual cards are currently in closed beta and require a PIN to access. Contact support for access.',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPinInvalid, setIsPinInvalid] = useState(false);
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const charAnimations = useRef<Animated.Value[]>(
    Array.from({ length: 6 }).map(() => new Animated.Value(0)),
  ).current;
  const PIN_LENGTH = 6;

  // Clear KYC data in development mode when spend PIN screen loads
  useEffect(() => {
    if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
      console.log('🧪 [DEV] ========================================');
      console.log('🧪 [DEV] SPEND PIN SCREEN LOADED - Clearing KYC data');
      console.log('🧪 [DEV] ========================================');

      // Check current data before clearing
      const beforeData = StorageService.loadPersonalInfo();
      console.log('🧪 [DEV] KYC data BEFORE clearing:', beforeData);

      try {
        StorageService.savePersonalInfo({
          name: '',
          email: '',
          phoneNumber: '',
          dateOfBirth: '',
          address: '',
          streetNumber: '',
          selectedCountry: {
            code: '',
            name: '',
            flag: '',
            dialCode: '',
          },
        });

        // Verify data was cleared
        const afterData = StorageService.loadPersonalInfo();
        console.log('🧪 [DEV] KYC data AFTER clearing:', afterData);
        console.log('🧪 [DEV] Data cleared successfully ✓');
      } catch (error) {
        console.error('🧪 [DEV] ❌ Error clearing KYC data:', error);
      }
    }
  }, []); // Run once on mount

  const handleSubmit = async () => {
    if (pin.length === PIN_LENGTH) {
      try {
        setError('');
        setIsPinInvalid(false);
        setIsLoading(true);

        const isValid = await onVerify(pin);

        if (!isValid) {
          setIsPinInvalid(true);
          setError('* Incorrect PIN');
          triggerShake(shakeAnimationValue);
          setPin(''); // Clear the pin for retry
          // Reset character animations
          charAnimations.forEach((anim) => anim.setValue(0));
        }
      } catch (error) {
        setIsPinInvalid(true);
        setError('* Verification failed. Please try again.');
        triggerShake(shakeAnimationValue);
        setPin('');
        charAnimations.forEach((anim) => anim.setValue(0));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePinChange = (text: string) => {
    setPin(text);

    // Clear error when user starts typing again
    if (error) {
      setError('');
      setIsPinInvalid(false);
    }
  };

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === PIN_LENGTH && !isLoading) {
      handleSubmit();
    }
  }, [pin]);

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.content}>
        <IntroHeader title={title} subtitle={subtitle} />

        <View style={styles.centerSection}>
          <CodeInput
            length={PIN_LENGTH}
            value={pin}
            onChangeText={handlePinChange}
            isError={isPinInvalid}
            editable={!isLoading}
            autoFocus={true}
            keyboardType="numeric"
            displayMode="dot"
            charAnimations={charAnimations}
            shakeAnimation={shakeAnimationValue}
          />

          {/* Error message */}
          <View style={styles.helperContainer}>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <Text style={styles.helperText}>Enter your 6-digit PIN</Text>
            )}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: verticalScale(250),
  },
  helperContainer: {
    minHeight: 24,
    justifyContent: 'center',
    marginTop: verticalScale(12),
  },
  helperText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.error,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default PinVerificationScreen;
