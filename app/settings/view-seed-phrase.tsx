import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import ScreenContainer from '@/components/ScreenContainer';
import ScreenHeader from '@/components/ScreenHeader';
import PinInputSection from '@/components/PinInputSection';
import SeedPhraseDisplay from '@/components/SeedPhraseDisplay';
import { unlockWalletWithPin } from '@/services/walletService';
import { triggerShake } from '@/utils/animations';
import colors from '@/constants/colors';

export default function ViewSeedPhraseScreen() {
  const router = useRouter();

  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const shakeAnimationValue = useRef(new Animated.Value(0)).current;

  const handleClose = () => {
    router.back();
  };

  const getTitle = () => {
    if (error) {
      return error;
    }

    if (seedPhrase) {
      return 'Your Recovery Phrase';
    }

    return 'Enter Your PIN';
  };

  const handleKeyPress = (key: string) => {
    setError(null);

    if (key === 'backspace') {
      setPin((prev) => prev.slice(0, -1));
    } else if (key >= '0' && key <= '9') {
      if (pin.length < 6) {
        const newPin = pin + key;
        setPin(newPin);
        if (newPin.length === 6) {
          // Auto-verify when 6 digits entered
          handleVerifyPin(newPin);
        }
      }
    }
  };

  const handleVerifyPin = async (pinToVerify: string) => {
    if (pinToVerify.length < 6) {
      setError('PIN must be at least 6 digits');
      triggerShake(shakeAnimationValue);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const wallet = await unlockWalletWithPin(pinToVerify);
      if (wallet && wallet.mnemonic) {
        setSeedPhrase(wallet.mnemonic);
        setPin('');
        setIsLoading(false);
      } else {
        setError('Incorrect PIN');
        setPin('');
        triggerShake(shakeAnimationValue);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error verifying PIN:', err);
      setError('Failed to verify PIN');
      setPin('');
      triggerShake(shakeAnimationValue);
      setIsLoading(false);
    }
  };

  const toggleReveal = () => {
    setIsRevealed(!isRevealed);
  };

  const renderSeedPhrase = () => {
    if (!seedPhrase) return null;

    return (
      <View style={styles.seedPhraseContainer}>
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Never share your recovery phrase with anyone
          </Text>
        </View>

        {/* Seed Phrase Display Component */}
        <SeedPhraseDisplay
          seedPhrase={seedPhrase}
          isVisible={isRevealed}
          onToggleVisibility={toggleReveal}
        />
      </View>
    );
  };

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <ScreenHeader title="Recovery Phrase" onBack={handleClose} />

        {/* Main Content */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {!seedPhrase ? (
            <View style={styles.pinContent}>
              <PinInputSection
                title={getTitle()}
                pin={pin}
                onKeyPress={handleKeyPress}
                maxLength={6}
                shakeAnimation={shakeAnimationValue}
              />
            </View>
          ) : (
            renderSeedPhrase()
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  pinContent: {
    flex: 1,
  },
  seedPhraseContainer: {
    flex: 1,
    paddingTop: verticalScale(20),
  },
  warningBanner: {
    backgroundColor: colors.error + '20',
    borderRadius: moderateScale(12),
    padding: scale(16),
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  warningText: {
    color: colors.error,
    fontSize: moderateScale(14),
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
});
