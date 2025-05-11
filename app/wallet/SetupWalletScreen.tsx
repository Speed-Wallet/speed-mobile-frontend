import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { generateSolanaWallet, saveWalletWithPin } from '@/services/walletService'; // Updated import
import colors from '@/constants/colors';

interface SetupWalletScreenProps {
  onWalletSetupComplete: () => void;
}

const SetupWalletScreen: React.FC<SetupWalletScreenProps> = ({ onWalletSetupComplete }) => {
  const [step, setStep] = useState(1); // 1: Initial, 2: Show Mnemonic, 3: Create PIN, 4: Confirm PIN
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleCreateWallet = async () => {
    setIsLoading(true);
    try {
      const wallet = await generateSolanaWallet();
      setMnemonic(wallet.mnemonic);
      setPublicKey(wallet.publicKey);
      setStep(2);
    } catch (error) {
      Alert.alert("Error", "Could not generate wallet. Please try again.");
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleMnemonicSaved = () => {
    setStep(3); // Move to PIN creation
  };

  const handleSetPin = () => {
    if (pin.length < 4) { // Basic PIN validation
      Alert.alert("Invalid PIN", "PIN must be at least 4 digits.");
      return;
    }
    setStep(4); // Move to PIN confirmation
  };

  const handleConfirmSave = async () => {
    if (!mnemonic || !publicKey) return;
    if (pin !== confirmPin) {
      Alert.alert("PIN Mismatch", "The PINs do not match. Please try again.");
      setConfirmPin(''); // Clear confirm PIN
      setStep(3); // Go back to create PIN step
      return;
    }
    if (pin.length < 4) {
      Alert.alert("Invalid PIN", "PIN must be at least 4 digits.");
      setStep(3);
      return;
    }

    setIsLoading(true);
    try {
      await saveWalletWithPin(mnemonic, publicKey, pin); // Use new save function
      Alert.alert("Success", "Your wallet has been created and secured with a PIN. Keep your seed phrase and PIN safe!");
      onWalletSetupComplete();
    } catch (error) {
      Alert.alert("Error", "Could not save wallet. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isLoading && <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />}
      
      {step === 1 && (
        <>
          <Text style={styles.title}>Create New Solana Wallet</Text>
          <Text style={styles.description}>
            Let's set up a new Solana wallet for you. This will generate a unique seed phrase.
          </Text>
          <Text style={styles.warning}>
            IMPORTANT: You are responsible for securely storing your seed phrase.
            Losing it means losing access to your funds.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleCreateWallet} disabled={isLoading}>
            <Text style={styles.buttonText}>Create Wallet</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 2 && mnemonic && publicKey && (
        <>
          <Text style={styles.title}>Your Seed Phrase</Text>
          <Text style={styles.description}>
            Write down this seed phrase in a safe place. This is the ONLY way to recover your wallet.
            Do NOT share it with anyone.
          </Text>
          <View style={styles.mnemonicContainer}>
            <Text style={styles.mnemonicText}>{mnemonic}</Text>
          </View>
          <Text style={styles.publicKeyText}>Your Public Key: {publicKey}</Text>
          <Text style={styles.warning}>
            SECURITY WARNING: For this example, the app will store this seed phrase encrypted with a PIN in AsyncStorage. While better, ensure your PIN is strong.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleMnemonicSaved} disabled={isLoading}>
            <Text style={styles.buttonText}>I've Saved My Phrase, Set PIN</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.title}>Create a PIN</Text>
          <Text style={styles.description}>
            Create a PIN to quickly access your wallet. Make it memorable but secure.
          </Text>
          <TextInput
            style={styles.pinInput}
            placeholder="Enter 4-digit PIN"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={4} // Example: 4-digit PIN
            secureTextEntry
            value={pin}
            onChangeText={setPin}
            autoFocus
          />
          <TouchableOpacity style={styles.button} onPress={handleSetPin} disabled={isLoading || pin.length < 4}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 4 && (
        <>
          <Text style={styles.title}>Confirm Your PIN</Text>
          <Text style={styles.description}>
            Please re-enter your PIN to confirm.
          </Text>
          <TextInput
            style={styles.pinInput}
            placeholder="Confirm 4-digit PIN"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={4} // Example: 4-digit PIN
            secureTextEntry
            value={confirmPin}
            onChangeText={setConfirmPin}
            autoFocus
          />
          <TouchableOpacity style={styles.button} onPress={handleConfirmSave} disabled={isLoading || confirmPin.length < 4}>
            <Text style={styles.buttonText}>Confirm & Save Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => { setPin(''); setConfirmPin(''); setStep(3); }}>
            <Text style={styles.linkButtonText}>Back to Create PIN</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.backgroundDark, // Assuming colors.backgroundDark
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }], // Center the indicator
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold', // Assuming Inter-Bold font
    color: colors.textPrimary, // Assuming colors.textPrimary
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular', // Assuming Inter-Regular font
    color: colors.textSecondary, // Assuming colors.textSecondary
    textAlign: 'center',
    marginBottom: 20,
  },
  warning: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.warning, // Assuming colors.warning
    textAlign: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: colors.warningLight, // Assuming colors.warningLight
    borderRadius: 8,
  },
  mnemonicContainer: {
    backgroundColor: colors.backgroundMedium, // Assuming colors.backgroundMedium
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  mnemonicText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  publicKeyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10, // Ensure it's readable
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.backgroundLight, // Assuming colors.backgroundLight
  },
  button: {
    backgroundColor: colors.primary, // Assuming colors.primary
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: colors.white, // Assuming colors.white
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  linkButton: {
    marginTop: 15,
    paddingVertical: 10,
  },
  linkButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});

export default SetupWalletScreen;
