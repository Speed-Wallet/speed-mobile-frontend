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
import { useState, useRef, useEffect } from 'react';
import { Key } from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import ScreenHeader from '@/components/ScreenHeader';
import ScreenContainer from '@/components/ScreenContainer';
import BackButton from '@/components/buttons/BackButton';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import { triggerShake } from '@/utils/animations';
import IntroHeader from './IntroHeader';

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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;

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
      Animated.timing(translateY, {
        toValue: 0,
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

      <View style={styles.content}>
        {/* Header */}
        <IntroHeader
          title="Import Wallet"
          subtitle="Enter your existing wallet's seed phrase to recover your wallet"
        />

        {/* Form Section */}
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

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <PrimaryActionButton
            title={isLoading ? 'Importing...' : 'Import Wallet'}
            onPress={handleContinue}
            disabled={!isValid}
            loading={isLoading}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    // ScreenContainer provides flex: 1 and backgroundColor
  },
  devBackButton: {
    position: 'absolute',
    top: verticalScale(50),
    left: scale(20),
    zIndex: 1000,
    backgroundColor: '#FFB800',
    borderRadius: scale(20),
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
    justifyContent: 'space-between',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: verticalScale(10),
    maxHeight: '50%',
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
    top: verticalScale(50),
    right: scale(20),
    zIndex: 1000,
    backgroundColor: '#FFB800',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: scale(8),
  },
  devButtonText: {
    fontSize: moderateScale(12),
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
  buttonContainer: {
    flex: 0,
    paddingTop: verticalScale(20),
    minHeight: '15%',
    justifyContent: 'flex-end',
  },
});
