import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useState, useRef } from 'react';
import { ArrowRight, Key } from 'lucide-react-native';
import colors from '@/constants/colors';
import ScreenHeader from '@/components/ScreenHeader';
import ScreenContainer from '@/components/ScreenContainer';
import BackButton from '@/components/BackButton';
import { triggerShake } from '@/utils/animations';

interface ImportWalletStepProps {
  onNext: (seedPhrase: string) => Promise<void>;
  onBack?: () => void;
  isLoading?: boolean;
}

export default function ImportWalletStep({
  onNext,
  onBack,
  isLoading = false,
}: ImportWalletStepProps) {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;

  const validateSeedPhrase = (text: string) => {
    const cleanPhrase = text.trim().toLowerCase();
    const words = cleanPhrase.split(/\s+/).filter((word) => word.length > 0);

    if (text.length === 0) {
      setError('');
      setIsValid(false);
    } else if (words.length < 12) {
      setError('Seed phrase must contain at least 12 words');
      setIsValid(false);
    } else if (words.length !== 12 && words.length !== 24) {
      setError('Seed phrase must contain 12 or 24 words');
      setIsValid(false);
    } else {
      // Basic validation - could be enhanced with BIP39 word list validation
      const hasInvalidChars = cleanPhrase.match(/[^a-z\s]/);
      if (hasInvalidChars) {
        setError(
          'Seed phrase should only contain lowercase letters and spaces',
        );
        setIsValid(false);
      } else {
        setError('');
        setIsValid(true);
      }
    }
  };

  const handleSeedPhraseChange = (text: string) => {
    setSeedPhrase(text);
    validateSeedPhrase(text);
  };

  const handleContinue = async () => {
    if (isValid && !isLoading) {
      try {
        const cleanPhrase = seedPhrase.trim().toLowerCase();
        await onNext(cleanPhrase);
      } catch (error) {
        setError(
          'Failed to import wallet. Please check your seed phrase and try again.',
        );
        triggerShake(shakeAnimationValue);
      }
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      {/* Development Back Button */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' && onBack && (
        <BackButton onPress={onBack} style={styles.devBackButton} />
      )}

      {/* Dev Button - Top Right */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' && (
        <TouchableOpacity
          style={styles.devButton}
          onPress={() =>
            handleSeedPhraseChange(
              process.env.EXPO_PUBLIC_DEV_SEED_PHRASE || '',
            )
          }
        >
          <Text style={styles.devButtonText}>DEV</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.spacer} />

          <Text style={styles.title}>Import Wallet</Text>
          <Text style={styles.subtitle}>
            Enter your existing wallet's seed phrase to recover your wallet
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          <Text style={styles.label}>Seed Phrase</Text>

          <Animated.View
            style={[
              styles.inputContainer,
              seedPhrase.length > 0 &&
                (error
                  ? styles.inputError
                  : isValid
                    ? styles.inputValid
                    : styles.inputContainer),
              {
                transform: [{ translateX: shakeAnimationValue }],
              },
            ]}
          >
            <TextInput
              style={styles.input}
              value={seedPhrase}
              onChangeText={handleSeedPhraseChange}
              placeholder="Enter your 12 or 24 word seed phrase"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </Animated.View>

          <View style={styles.helperContainer}>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <Text style={styles.helperText}>
                {seedPhrase
                  .trim()
                  .split(/\s+/)
                  .filter((word) => word.length > 0).length > 0
                  ? `${
                      seedPhrase
                        .trim()
                        .split(/\s+/)
                        .filter((word) => word.length > 0).length
                    } words entered`
                  : 'Enter each word separated by a space'}
              </Text>
            )}
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={!isValid || isLoading}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.buttonBackground,
                !isValid
                  ? { backgroundColor: colors.backgroundMedium }
                  : { backgroundColor: '#00CFFF' },
              ]}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  isValid && styles.continueButtonTextActive,
                ]}
              >
                {isLoading ? 'Importing...' : 'Import Wallet'}
              </Text>
              <ArrowRight
                size={20}
                color={isValid ? '#000000' : colors.textSecondary}
                strokeWidth={2}
              />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  devBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 1000,
    backgroundColor: '#FFB800',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  spacer: {
    height: 104, // 80px height + 24px marginBottom from iconContainer
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 207, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  form: {
    marginTop: 20,
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  inputContainer: {
    borderWidth: 2,
    borderColor: '#00CFFF',
    borderRadius: 16,
    backgroundColor: colors.backgroundMedium,
    marginBottom: 12,
    minHeight: 120,
  },
  inputValid: {
    borderColor: '#00CFFF',
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
    paddingHorizontal: 20,
    paddingVertical: 18,
    lineHeight: 24,
  },
  devButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: '#FFB800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  devButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  helperContainer: {
    minHeight: 24,
    justifyContent: 'center',
  },
  helperText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.error,
    lineHeight: 20,
  },
  buttonWrapper: {
    marginTop: 'auto',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  continueButton: {
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
  },
  buttonBackground: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    gap: 12,
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textSecondary,
  },
  continueButtonTextActive: {
    color: '#000000',
  },
});
