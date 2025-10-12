import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import colors from '@/constants/colors';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import { triggerShake } from '@/utils/animations';

interface WalletNameInputProps {
  onSubmit: (walletName: string) => void;
  loading?: boolean;
  existingWalletNames: string[];
  buttonTitle?: string;
  loadingTitle?: string;
}

const WalletNameInput: React.FC<WalletNameInputProps> = ({
  onSubmit,
  loading = false,
  existingWalletNames,
  buttonTitle = 'Continue',
  loadingTitle = 'Processing...',
}) => {
  const [walletName, setWalletName] = useState('');
  const [walletNameError, setWalletNameError] = useState('');
  const inputRef = useRef<TextInput>(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const validateWalletName = (name: string) => {
    const trimmedName = name.trim();

    if (trimmedName.length < 3) {
      return 'Name must be at least 3 characters';
    }

    const existingWallet = existingWalletNames.find(
      (walletName) => walletName.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (existingWallet) {
      return 'Wallet name already exists';
    }

    return '';
  };

  const handleWalletNameBlur = () => {
    const error = validateWalletName(walletName);
    setWalletNameError(error);
  };

  const handleSubmit = () => {
    if (loading) return;

    const nameError = validateWalletName(walletName);
    if (nameError) {
      setWalletNameError(nameError);
      triggerShake(shakeAnimation);
      inputRef.current?.focus();
      return;
    }

    onSubmit(walletName.trim());
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <View style={styles.content}>
        <Text style={styles.subtitle}>Wallet Name</Text>

        <Animated.View
          style={{
            transform: [{ translateX: shakeAnimation }],
            ...styles.inputContainer,
          }}
        >
          <TextInput
            ref={inputRef}
            style={[styles.input, walletNameError && styles.inputError]}
            placeholder="Enter wallet name"
            placeholderTextColor={colors.textSecondary}
            value={walletName}
            onChangeText={(text) => {
              setWalletName(text);
              if (walletNameError) setWalletNameError('');
            }}
            onBlur={handleWalletNameBlur}
            autoFocus
          />
          {walletNameError && (
            <Text style={styles.errorText}>* {walletNameError}</Text>
          )}
        </Animated.View>

        <View style={styles.buttonContainer}>
          <PrimaryActionButton
            title={loading ? loadingTitle : buttonTitle}
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingTop: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: verticalScale(8),
  },
  input: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(16),
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    marginBottom: verticalScale(6),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: colors.error,
  },
  inputContainer: {
    marginBottom: verticalScale(12),
  },
  errorText: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Regular',
    color: colors.error,
    marginTop: verticalScale(4),
  },
  buttonContainer: {
    marginTop: verticalScale(8),
  },
});

export default WalletNameInput;
