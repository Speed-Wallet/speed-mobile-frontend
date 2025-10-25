import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Animated,
  ScrollView,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import IntroHeader from '@/components/wallet/IntroHeader';
import BottomActionContainer from '@/components/BottomActionContainer';
import { triggerShake } from '@/utils/animations';
import ScreenContainer from '@/components/ScreenContainer';

interface RecoverWalletStepProps {
  onRecover: (seedPhrase: string) => Promise<void>;
  onBack?: () => void;
  isLoading?: boolean;
}

export default function RecoverWalletStep({
  onRecover,
  onBack,
  isLoading = false,
}: RecoverWalletStepProps) {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [isValid, setIsValid] = useState(false);
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
        await onRecover(cleanPhrase);
      } catch (error) {
        setError(
          'Failed to recover wallet. Please check your seed phrase and try again.',
        );
        triggerShake(shakeAnimationValue);
      }
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <IntroHeader
          title="Recover Wallet"
          subtitle="Enter your seed phrase to recover access to your wallet"
        />
      </View>

      {/* Form Section */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.form,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
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
              autoFocus
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
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <BottomActionContainer>
        <PrimaryActionButton
          title={isLoading ? 'Recovering...' : 'Continue'}
          onPress={handleContinue}
          disabled={!isValid}
          loading={isLoading}
        />
      </BottomActionContainer>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(120),
    flexGrow: 1,
    justifyContent: 'center',
  },
  form: {
    paddingVertical: verticalScale(10),
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
});
