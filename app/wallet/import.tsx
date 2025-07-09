import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import BackButton from '@/components/BackButton';
import { importWalletFromMnemonic, saveWalletToList } from '@/services/walletService';

export default function ImportPhraseScreen() {
  const router = useRouter();
  const [phrase, setPhrase] = useState('');
  const [walletName, setWalletName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1); // 1: Phrase, 2: Name, 3: PIN, 4: Confirm PIN
  const [loading, setLoading] = useState(false);

  const handleNextStep = async () => {
    if (step === 1) {
      if (!phrase.trim()) {
        Alert.alert('Invalid Phrase', 'Please enter a valid seed phrase.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!walletName.trim()) {
        Alert.alert('Invalid Name', 'Please enter a wallet name.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (pin.length < 4) {
        Alert.alert('Invalid PIN', 'PIN must be at least 4 digits.');
        return;
      }
      setStep(4);
    } else {
      await handleImport();
    }
  };

  const handleImport = async () => {
    if (pin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhrase = phrase.trim().toLowerCase();
      const wallet = await importWalletFromMnemonic(cleanPhrase);
      
      // Generate unique wallet ID and save to multi-wallet system
      const walletId = `wallet-${Date.now()}`;
      await saveWalletToList(walletId, walletName, wallet.mnemonic, wallet.publicKey, pin);
      
      Alert.alert('Success', 'Wallet imported successfully!', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to import wallet. Please check your seed phrase and try again.');
      console.error('Import error:', error);
    }
    setLoading(false);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <>
          <Text style={styles.title}>Secret Recovery Phrase</Text>
          <Text style={styles.subtitle}>
            Restore an existing wallet with your 12 or 24 word secret recovery phrase
          </Text>

          <TextInput
            style={styles.phraseInput}
            placeholder="Secret Recovery Phrase"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={phrase}
            onChangeText={setPhrase}
            autoCapitalize="none"
          />
        </>
      );
    } else if (step === 2) {
      return (
        <>
          <Text style={styles.title}>Name Your Wallet</Text>
          <Text style={styles.subtitle}>
            Give your imported wallet a name to identify it easily
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter wallet name"
            placeholderTextColor={colors.textSecondary}
            value={walletName}
            onChangeText={setWalletName}
            autoCapitalize="words"
            maxLength={30}
          />
        </>
      );
    } else if (step === 3) {
      return (
        <>
          <Text style={styles.title}>Create PIN</Text>
          <Text style={styles.subtitle}>
            Create a PIN to secure your imported wallet
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter PIN"
            placeholderTextColor={colors.textSecondary}
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
          />
        </>
      );
    } else {
      return (
        <>
          <Text style={styles.title}>Confirm PIN</Text>
          <Text style={styles.subtitle}>
            Re-enter your PIN to confirm
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Confirm PIN"
            placeholderTextColor={colors.textSecondary}
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
          />
        </>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <Text style={styles.headerTitle}>Import Recovery Phrase</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {renderStep()}

        <TouchableOpacity 
          style={[styles.importButton, loading && styles.buttonDisabled]} 
          onPress={handleNextStep}
          disabled={loading}
        >
          <Text style={styles.importButtonText}>
            {step === 4 ? 'IMPORT' : 'NEXT'}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 24,
  },
  phraseInput: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
    height: 120,
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlignVertical: 'top',
  },
  input: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  importButton: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  importButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});