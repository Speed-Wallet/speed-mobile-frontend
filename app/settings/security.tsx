import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import BackButton from '@/components/BackButton';
import { unlockWalletWithPin } from '@/services/walletService';
import { Eye, EyeOff } from 'lucide-react-native';

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinEntryVisible, setPinEntryVisible] = useState(false);

  const handleShowSeedPhrase = () => {
    setSeedPhrase(null); // Reset previous seed phrase
    setError(null); // Reset previous error
    setPinEntryVisible(true); // Show PIN input
    setPin(''); // Clear PIN input
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const wallet = await unlockWalletWithPin(pin);
      if (wallet && wallet.mnemonic) {
        setSeedPhrase(wallet.mnemonic);
        setPinEntryVisible(false); // Hide PIN input after success
      } else {
        setError("Incorrect PIN or unable to retrieve seed phrase.");
        setSeedPhrase(null);
      }
    } catch (err) {
      console.error("Error unlocking wallet:", err);
      setError("An error occurred while trying to retrieve the seed phrase.");
      setSeedPhrase(null);
    }
    setIsLoading(false);
    setPin(''); // Clear PIN input
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 40 }} />{/* Spacer */}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>General Security</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Navigate", "Navigate to 2FA settings")}>
          <Text style={styles.menuItemText}>Two-Factor Authentication (2FA)</Text>
          <Text style={styles.menuItemValue}>Off {'>'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Navigate", "Navigate to Change Password")}>
          <Text style={styles.menuItemText}>Change PIN</Text>
          <Text style={styles.menuItemValue}>{'>'}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Recovery</Text>
        <TouchableOpacity style={styles.menuItem} onPress={handleShowSeedPhrase}>
          <Text style={styles.menuItemText}>View Seed Phrase</Text>
          <Text style={styles.menuItemValue}>{seedPhrase ? 'Hide' : 'Show'} {'>'}</Text>
        </TouchableOpacity>

        {pinEntryVisible && !seedPhrase && (
          <View style={styles.pinEntryContainer}>
            <Text style={styles.pinPrompt}>Enter your PIN to view the seed phrase:</Text>
            <View style={styles.pinInputContainer}>
              <TextInput
                style={styles.pinInput}
                placeholder="Enter PIN"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={6} // Assuming PIN max length
                secureTextEntry={!showPin}
                value={pin}
                onChangeText={setPin}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeIcon}>
                {showPin ? <EyeOff color={colors.primary} size={24} /> : <Eye color={colors.primary} size={24} />}
              </TouchableOpacity>
            </View>
            {isLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 10 }} />}
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handlePinSubmit}
              disabled={isLoading || pin.length < 4}
            >
              <Text style={styles.buttonText}>View Phrase</Text>
            </TouchableOpacity>
          </View>
        )}

        {seedPhrase && (
          <View style={styles.seedPhraseContainer}>
            <Text style={styles.seedPhraseWarningTitle}>Your Seed Phrase</Text>
            <Text style={styles.seedPhraseWarning}>
              Store this phrase securely. Do NOT share it with anyone.
              This is the ONLY way to recover your wallet.
            </Text>
            <View style={styles.mnemonicDisplay}>
              <Text style={styles.mnemonicText}>{seedPhrase}</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={() => setSeedPhrase(null)}>
              <Text style={styles.buttonText}>Hide Seed Phrase</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10, // Adjusted for status bar
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  menuItem: {
    backgroundColor: colors.backgroundMedium,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
  },
  menuItemValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  pinEntryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: colors.backgroundMedium,
    borderRadius: 8,
  },
  pinPrompt: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    marginBottom: 15,
    textAlign: 'center',
  },
  pinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.backgroundLight, // Assuming colors.backgroundLight
  },
  pinInput: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: colors.primary + '80', // Semi-transparent primary
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  errorText: {
    color: colors.error, // Changed from colors.danger to colors.error
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 10,
  },
  seedPhraseContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: colors.backgroundMedium,
    borderRadius: 8,
    alignItems: 'center',
  },
  seedPhraseWarningTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: colors.warning,
    marginBottom: 10,
  },
  seedPhraseWarning: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 15,
  },
  mnemonicDisplay: {
    backgroundColor: colors.backgroundDark,
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  mnemonicText: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
  },
});
