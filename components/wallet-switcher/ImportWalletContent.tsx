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
import BottomSheetScreenContainer from '../BottomSheetScreenContainer';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import { triggerShake } from '@/utils/animations';

interface ImportWalletContentProps {
  onSubmit: (seedPhrase: string) => void;
  loading?: boolean;
}

const ImportWalletContent: React.FC<ImportWalletContentProps> = ({
  onSubmit,
  loading = false,
}) => {
  const [importPhrase, setImportPhrase] = useState('');
  const [seedPhraseError, setSeedPhraseError] = useState('');
  const inputRef = useRef<TextInput>(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const validateSeedPhrase = (phrase: string) => {
    const trimmedPhrase = phrase.trim();

    if (!trimmedPhrase) {
      return 'Seed phrase is required';
    }

    const words = trimmedPhrase.split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      return 'Seed phrase must be 12 or 24 words';
    }

    return '';
  };

  const handleSeedPhraseBlur = () => {
    const error = validateSeedPhrase(importPhrase);
    setSeedPhraseError(error);
  };

  const handleImportWallet = () => {
    if (loading) return;

    const phraseError = validateSeedPhrase(importPhrase);

    if (phraseError) {
      setSeedPhraseError(phraseError);
      triggerShake(shakeAnimation);
      inputRef.current?.focus();
      return;
    }

    onSubmit(importPhrase.trim());
  };

  return (
    <BottomSheetScreenContainer edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Enter your 12 or 24 word seed phrase
          </Text>

          <Animated.View
            style={{
              transform: [{ translateX: shakeAnimation }],
            }}
          >
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                styles.textArea,
                seedPhraseError && styles.inputError,
              ]}
              placeholder="Enter your seed phrase"
              placeholderTextColor={colors.textSecondary}
              value={importPhrase}
              onChangeText={(text) => {
                setImportPhrase(text);
                if (seedPhraseError) setSeedPhraseError('');
              }}
              onBlur={handleSeedPhraseBlur}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {seedPhraseError && (
              <Text style={styles.errorText}>* {seedPhraseError}</Text>
            )}
          </Animated.View>

          <View style={styles.buttonContainer}>
            <PrimaryActionButton
              title={loading ? 'Confirming...' : 'Confirm Seed Phrase'}
              onPress={handleImportWallet}
              disabled={loading}
              loading={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheetScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  content: {
    // paddingHorizontal: scale(16),
    paddingTop: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: verticalScale(16),
  },
  input: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(12),
    padding: scale(16),
    fontSize: moderateScale(16),
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    marginBottom: verticalScale(8),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: {
    minHeight: verticalScale(100),
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Regular',
    color: colors.error,
    marginBottom: verticalScale(12),
  },
  buttonContainer: {
    marginTop: verticalScale(8),
  },
});

export default ImportWalletContent;
