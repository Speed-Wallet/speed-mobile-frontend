import React, { useState, useEffect } from 'react'; // Added useEffect
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { unlockWalletWithPin } from '@/services/walletService';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router'; // Optional: if you want to navigate after unlock


interface EnterPinScreenProps {
  onWalletUnlocked: () => void; // Callback to notify parent that wallet is unlocked
  publicKey?: string | null; // Optional: to display or use
}

const EnterPinScreen: React.FC<EnterPinScreenProps> = ({ onWalletUnlocked, publicKey }) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Optional

  useEffect(() => {
    const autoUnlockDev = async () => {
      if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
        const devPin = process.env.EXPO_PUBLIC_DEV_PIN;
        if (devPin) {
          console.log(`Development mode: Attempting auto-unlock with EXPO_PUBLIC_DEV_PIN ${devPin}`);
          setIsLoading(true); // Show loading indicator during auto-unlock attempt
          try {
            const wallet = await unlockWalletWithPin(devPin);
            if (wallet) {
              console.log('Development mode: Auto-unlock successful.');
              onWalletUnlocked();
              // Optionally navigate to a specific screen, e.g., home
              // router.replace('/(tabs)'); 
            } else {
              console.warn('Development mode: Auto-unlock failed. EXPO_PUBLIC_DEV_PIN might be incorrect or wallet not set up for it.');
              // You might want to set an error or allow manual PIN entry
              setError("Dev auto-unlock failed. Please enter PIN manually.");
            }
          } catch (err) {
            console.error("Development mode: Auto-unlock error:", err);
            setError("Error during dev auto-unlock.");
          } finally {
            setIsLoading(false);
          }
        } else {
          console.log('Development mode: EXPO_PUBLIC_DEV_PIN not set. Manual PIN entry required.');
        }
      }
    };

    autoUnlockDev();
  }, [onWalletUnlocked, router]); // Keep dependencies, though router might not be strictly needed if not navigating from here

  const handleUnlockWallet = async () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const wallet = await unlockWalletWithPin(pin);
      if (wallet) {
        // Alert.alert("Success", "Wallet unlocked!"); // Optional success message
        onWalletUnlocked();
        // Optionally navigate to a specific screen, e.g., home
        // router.replace('/(tabs)'); 
      } else {
        setError("Invalid PIN. Please try again.");
        setPin(''); // Clear PIN input on failure
      }
    } catch (err) {
      console.error("Unlock error:", err);
      setError("Failed to unlock wallet. Please try again.");
      setPin('');
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      {isLoading && <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />}
      <Text style={styles.title}>Enter Your PIN</Text>
      <Text style={styles.description}>
        Enter your PIN to unlock your Solana wallet.
      </Text>
      {publicKey && <Text style={styles.publicKeyTextHint}>Wallet: {publicKey.substring(0,6)}...{publicKey.substring(publicKey.length-4)}</Text>}
      
      <TextInput
        style={[styles.pinInput, error ? styles.inputError : null]}
        placeholder="Enter PIN"
        placeholderTextColor={colors.textSecondary}
        keyboardType="number-pad"
        maxLength={4} // Adjust as per your PIN length
        secureTextEntry
        value={pin}
        onChangeText={(text) => {
          setPin(text);
          if (error) setError(null); // Clear error on new input
        }}
        autoFocus
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      <TouchableOpacity 
        style={[styles.button, (isLoading || pin.length < 4) ? styles.buttonDisabled : null]} 
        onPress={handleUnlockWallet} 
        disabled={isLoading || pin.length < 4}
      >
        <Text style={styles.buttonText}>Unlock Wallet</Text>
      </TouchableOpacity>
      {/* Optional: Add a "Forgot PIN?" or "Reset Wallet" option here, which would involve clearing the wallet */}
      {/* <TouchableOpacity style={styles.linkButton} onPress={() => Alert.alert("Reset Wallet", "This will clear your current wallet. You'll need your seed phrase to restore it. Are you sure?", [{text: "Cancel"}, {text: "Reset", onPress: async () => { await clearWallet(); router.replace('/'); /* or some other logic to re-trigger setup * /}}])}>
        <Text style={styles.linkButtonText}>Forgot PIN / Reset Wallet</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.backgroundDark,
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  publicKeyTextHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  pinInput: {
    backgroundColor: colors.backgroundMedium,
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: 20,
    textAlign: 'center',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '80%',
    marginBottom: 10, // Reduced margin to make space for error text
    borderWidth: 1,
    borderColor: colors.backgroundLight,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    width: '80%',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: colors.backgroundLight, // Or a disabled color from your theme
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  linkButton: {
    marginTop: 25,
    paddingVertical: 10,
  },
  linkButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  }
});

export default EnterPinScreen;
