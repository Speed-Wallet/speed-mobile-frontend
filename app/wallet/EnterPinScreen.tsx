import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { scale } from 'react-native-size-matters';
import {
  unlockApp,
  recoverWalletWithSeedPhrase,
  validateSeedPhraseForRecovery,
  preloadEncryptedWallets,
} from '@/services/walletService';
import { triggerShake } from '@/utils/animations';
import ScreenContainer from '@/components/ScreenContainer';
import PinInputSection from '@/components/PinInputSection';
import RecoverWalletStep from '@/components/wallet/RecoverWalletStep';
import RecoveryPinSetup from '@/components/wallet/RecoveryPinSetup';
import colors from '@/constants/colors';

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
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'seed' | 'pin'>('seed');
  const [recoveredSeedPhrase, setRecoveredSeedPhrase] = useState<string>('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;

  // Preload encrypted wallet data on mount
  useEffect(() => {
    const preloadData = async () => {
      try {
        await preloadEncryptedWallets();
      } catch (error) {
        console.error('Failed to preload wallet data:', error);
      } finally {
        setIsPreloading(false);
      }
    };

    preloadData();
  }, []);

  useEffect(() => {
    console.log(process.env.EXPO_PUBLIC_APP_ENV);
    console.log(process.env.EXPO_PUBLIC_DEV_PIN);
    const autoUnlockDev = async () => {
      // Wait for preloading to complete before auto-unlock
      if (isPreloading) return;

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
  }, [onWalletUnlocked, isPreloading]);

  // Auto-validate PIN when 6th digit is entered
  useEffect(() => {
    if (pin.length === 6 && !isValidating) {
      setIsValidating(true);
      setError(null);

      // Use requestAnimationFrame to ensure the UI updates (6th dot fills) before validation
      requestAnimationFrame(async () => {
        try {
          // If still preloading, wait for it to complete
          if (isPreloading) {
            console.log('Waiting for preload to complete...');
            // The preload effect will set isPreloading to false when done
            // This validation will be retriggered by the pin/isPreloading dependency
            setIsValidating(false);
            return;
          }

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
  }, [pin, isValidating, isPreloading, onWalletUnlocked, shakeAnimationValue]);

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (key: string) => {
      // Don't allow input while validating (but allow during preloading)
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

  const handleForgotPress = () => {
    setShowRecovery(true);
    setRecoveryStep('seed');
  };

  const handleSeedPhraseEntered = async (seedPhrase: string) => {
    // Validate that the seed phrase matches an existing wallet
    setIsRecovering(true);
    try {
      // Validate the seed phrase and check if it matches an existing wallet
      const validation = await validateSeedPhraseForRecovery(seedPhrase);

      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid seed phrase');
      }

      // Store the seed phrase and move to PIN setup step
      setRecoveredSeedPhrase(seedPhrase);
      setRecoveryStep('pin');
    } catch (err: any) {
      console.error('Seed phrase validation error:', err);
      throw new Error(err.message || 'Invalid seed phrase');
    } finally {
      setIsRecovering(false);
    }
  };

  const handlePinSet = async (newPin: string) => {
    setIsRecovering(true);
    try {
      const success = await recoverWalletWithSeedPhrase(
        recoveredSeedPhrase,
        newPin,
      );

      if (success) {
        setShowRecovery(false);
        setRecoveryStep('seed');
        setRecoveredSeedPhrase('');
        onWalletUnlocked();
      }
    } catch (err: any) {
      console.error('Recovery error:', err);
      // Reset to seed phrase step on error
      setRecoveryStep('seed');
      setRecoveredSeedPhrase('');
      throw new Error(err.message || 'Failed to recover wallet');
    } finally {
      setIsRecovering(false);
    }
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
          showForgot={true}
          onForgotPress={handleForgotPress}
          isValidating={isValidating}
        />
      </View>

      {/* Recovery Modal */}
      <Modal
        visible={showRecovery}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => !isRecovering && setShowRecovery(false)}
      >
        <ScreenContainer edges={['top', 'bottom']}>
          {recoveryStep === 'seed' ? (
            <RecoverWalletStep
              onRecover={handleSeedPhraseEntered}
              onBack={() => setShowRecovery(false)}
              isLoading={isRecovering}
            />
          ) : (
            <RecoveryPinSetup onPinSet={handlePinSet} />
          )}
        </ScreenContainer>
      </Modal>
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
