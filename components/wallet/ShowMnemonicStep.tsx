import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import colors from '@/constants/colors';

interface ShowMnemonicStepProps {
  mnemonic: string;
  publicKey: string;
  onNext: () => void;
  isLoading: boolean;
}

const ShowMnemonicStep: React.FC<ShowMnemonicStepProps> = ({ 
  mnemonic, 
  publicKey, 
  onNext, 
  isLoading 
}) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
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
      <TouchableOpacity style={styles.button} onPress={onNext} disabled={isLoading}>
        <Text style={styles.buttonText}>I've Saved My Phrase, Set PIN</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.backgroundDark,
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
  warning: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.warning,
    textAlign: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: colors.warningLight,
    borderRadius: 8,
  },
  mnemonicContainer: {
    backgroundColor: colors.backgroundMedium,
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
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

export default ShowMnemonicStep;
