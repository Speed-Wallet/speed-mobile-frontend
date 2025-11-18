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
import { Keypair } from '@solana/web3.js';
import { mnemonicToSeed } from '@/utils/bip39';
import { deriveKeyFromPath } from '@/utils/derivation';

const BASE_BACKEND_URL = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;

interface CheckUserStepProps {
  mnemonic: string;
  onUserExists: (username: string, referralCode: string | null) => void;
  onUserNew: () => void;
  onBack?: () => void;
}

export default function CheckUserStep({
  mnemonic,
  onUserExists,
  onUserNew,
  onBack,
}: CheckUserStepProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [existingUsername, setExistingUsername] = useState<string | null>(null);
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

  // Auto-check on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    setIsChecking(true);
    setError('');

    try {
      // Derive keypair from mnemonic
      const seed = await mnemonicToSeed(mnemonic);
      const derivedKey = deriveKeyFromPath(seed, 0);
      const keypair = Keypair.fromSeed(derivedKey);

      const publicKey = keypair.publicKey.toBase58();

      const response = await fetch(
        `${BASE_BACKEND_URL}/checkUser?publicKey=${encodeURIComponent(publicKey)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check user status');
      }

      if (data.exists && data.username) {
        // User already exists with this public key
        setExistingUsername(data.username);
        // Auto-proceed to next step
        setTimeout(() => {
          onUserExists(data.username, data.usedReferralCode || null);
        }, 800);
      } else {
        // New user - proceed to username creation
        setTimeout(() => {
          onUserNew();
        }, 800);
      }
    } catch (err) {
      console.error('Check user error:', err);
      setError('Failed to check user status. Please try again.');
      triggerShake(shakeAnimationValue);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetry = () => {
    checkUser();
  };

  const handleContinue = () => {
    if (existingUsername) {
      onUserExists(existingUsername, null); // referralCode already passed in auto-proceed
    } else {
      onUserNew();
    }
  };

  return (
    <IntroScreen
      title="Checking Account"
      subtitle="Please wait while we check your account..."
      footer={
        !isChecking && error ? (
          <PrimaryActionButton
            title="Retry"
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
        {isChecking && (
          <View style={styles.checkingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.statusText}>Checking your account...</Text>
          </View>
        )}

        {!isChecking && !existingUsername && !error && (
          <View style={styles.newUserContainer}>
            <Text style={styles.successIcon}>✨</Text>
            <Text style={styles.newUserText}>New Wallet Detected</Text>
            <Text style={styles.newUserSubtext}>
              Let's create your username...
            </Text>
          </View>
        )}

        {!isChecking && error && (
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
  checkingContainer: {
    alignItems: 'center',
    gap: verticalScale(20),
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  newUserContainer: {
    alignItems: 'center',
    gap: verticalScale(16),
  },
  successIcon: {
    fontSize: 64,
  },
  newUserText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  newUserSubtext: {
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
});
