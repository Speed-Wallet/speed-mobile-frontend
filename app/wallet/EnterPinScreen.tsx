import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { unlockApp } from '@/services/walletService';
import PinInputCard from '@/components/wallet/PinInputCard';
import { Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerShake } from '@/utils/animations';
import ScreenContainer from '@/components/ScreenContainer';


interface EnterPinScreenProps {
  onWalletUnlocked: () => void;
  publicKey?: string | null;
}

const EnterPinScreen: React.FC<EnterPinScreenProps> = ({ onWalletUnlocked, publicKey }) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log(process.env.EXPO_PUBLIC_APP_ENV)
    console.log(process.env.EXPO_PUBLIC_DEV_PIN)
    const autoUnlockDev = async () => {
      if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
        const devPin = process.env.EXPO_PUBLIC_DEV_PIN;
        if (devPin) {
          console.log(`Development mode: Attempting auto-unlock with EXPO_PUBLIC_DEV_PIN ${devPin}`);
          setIsLoading(true);
          try {
            const success = await unlockApp(devPin);
            if (success) {
              console.log('Development mode: Auto-unlock successful.');
              onWalletUnlocked();
            } else {
              console.warn('Development mode: Auto-unlock failed.');
              setError("Dev auto-unlock failed. Please enter PIN manually.");
            }
          } catch (err) {
            console.error("Development mode: Auto-unlock error:", err);
            setError("Error during dev auto-unlock.");
          } finally {
            setIsLoading(false);
          }
        }
      }
    };

    autoUnlockDev();
  }, [onWalletUnlocked]);

  const handleUnlockWallet = async () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits.");
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
        setError("Invalid PIN. Please try again.");
        setPin('');
        triggerShake(shakeAnimationValue);
      }
    } catch (err) {
      console.error("Unlock error:", err);
      setError("Failed to unlock wallet. Please try again.");
      setPin('');
      triggerShake(shakeAnimationValue);
    }
    setIsLoading(false);
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['rgba(124, 92, 255, 0.15)', 'rgba(124, 92, 255, 0.05)']}
              style={styles.logoBadge}>
              <Lock size={32} color="#7c5cff" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Enter Your PIN</Text>
        </View>

        {/* PIN Input */}
        <View style={styles.pinContainer}>
          <PinInputCard
            pin={pin}
            onPinChange={(newPin) => {
              setPin(newPin);
              if (error) setError(null);
            }}
            headerIcon={<Lock size={20} color="#7c5cff" />}
            headerText="Enter PIN"
            instruction={{
              empty: 'Tap above and use your keypad to enter PIN',
              incomplete: '{count} more digits',
              complete: 'PIN complete'
            }}
            autoFocus
          />
        </View>

        {/* Unlock Button */}
        <Animated.View style={{ transform: [{ translateX: shakeAnimationValue }] }}>
          <TouchableOpacity
            style={[styles.unlockButton, (isLoading || pin.length < 4) && styles.unlockButtonDisabled]}
            onPress={handleUnlockWallet}
            disabled={isLoading || pin.length < 4}>
            {isLoading ? (
              <ActivityIndicator size={20} color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Unlock Wallet</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Error Message - Fixed height container to prevent layout shift */}
        <View style={styles.errorContainer}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.errorTextPlaceholder}> </Text>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  pinContainer: {
    marginBottom: 32,
  },
  errorContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    minHeight: 40, // Reserve space to prevent layout shift
    justifyContent: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  errorTextPlaceholder: {
    color: 'transparent',
    fontSize: 14,
    textAlign: 'center',
  },
  unlockButton: {
    backgroundColor: '#7c5cff',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockButtonDisabled: {
    backgroundColor: '#4a4a4a',
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EnterPinScreen;
