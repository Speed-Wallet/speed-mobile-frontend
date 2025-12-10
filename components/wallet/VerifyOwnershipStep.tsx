import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { scale, verticalScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import BackButton from '@/components/buttons/BackButton';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import { triggerShake } from '@/utils/animations';
import IntroScreen from './IntroScreen';
import { signWalletOwnershipMessage } from '@/services/walletService';

const BASE_BACKEND_URL = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;

interface VerifyOwnershipStepProps {
  mnemonic: string;
  onNext: () => void;
  onBack?: () => void;
}

export default function VerifyOwnershipStep({
  mnemonic,
  onNext,
  onBack,
}: VerifyOwnershipStepProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Auto-verify on mount
  useEffect(() => {
    verifyOwnership();
  }, []);

  const verifyOwnership = async () => {
    setIsVerifying(true);
    setError('');

    try {
      const { publicKey, signature, timestamp } =
        await signWalletOwnershipMessage(mnemonic, 0);

      // Verify with backend
      const response = await fetch(`${BASE_BACKEND_URL}/verifySignature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey,
          // message,
          signature,
          timestamp,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setIsVerified(true);
        // Auto-proceed after a brief delay
        setTimeout(() => {
          onNext();
        }, 800);
      } else {
        setError(data.message || 'Verification failed. Please try again.');
        triggerShake(shakeAnimationValue);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify wallet ownership. Please try again.');
      triggerShake(shakeAnimationValue);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRetry = () => {
    verifyOwnership();
  };

  return (
    <IntroScreen
      title="Verify Wallet"
      subtitle="Verifying your wallet ownership..."
      footer={
        !isVerifying && error ? (
          <PrimaryActionButton
            title="Retry Verification"
            onPress={handleRetry}
            disabled={false}
          />
        ) : null
      }
    >
      {/* Development Back Button */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' && onBack && (
        <BackButton onPress={onBack} style={styles.devBackButton} />
      )}

      {/* Status Section */}
      <Animated.View
        style={[
          styles.statusContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {isVerifying && (
          <View style={styles.verifyingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.statusText}>Signing and verifying...</Text>
          </View>
        )}

        {isVerified && (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>Wallet Verified!</Text>
            <Text style={styles.successSubtext}>Continuing...</Text>
          </View>
        )}

        {!isVerifying && error && (
          <Animated.View
            style={[
              styles.errorContainer,
              {
                transform: [{ translateX: shakeAnimationValue }],
              },
            ]}
          >
            <Text style={styles.errorIcon}>⚠</Text>
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {!isVerifying && !error && !isVerified && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              We need to verify that you own this wallet by signing a message
              with your private key.
            </Text>
          </View>
        )}
      </Animated.View>
    </IntroScreen>
  );
}

const styles = StyleSheet.create({
  devBackButton: {
    position: 'absolute',
    top: verticalScale(50),
    left: scale(20),
    zIndex: 1000,
    backgroundColor: '#FFB800',
    borderRadius: scale(20),
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(40),
  },
  verifyingContainer: {
    alignItems: 'center',
    gap: verticalScale(20),
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    gap: verticalScale(16),
  },
  successIcon: {
    fontSize: 64,
    color: colors.primary,
  },
  successText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.primary,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    gap: verticalScale(16),
    paddingHorizontal: scale(20),
  },
  errorIcon: {
    fontSize: 48,
    color: colors.error,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.error,
    textAlign: 'center',
  },
  infoContainer: {
    paddingHorizontal: scale(20),
  },
  infoText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
