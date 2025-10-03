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
import { User } from 'lucide-react-native';
import { verticalScale, scale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import ScreenHeader from '@/components/ScreenHeader';
import ScreenContainer from '@/components/ScreenContainer';
import UnsafeScreenContainer from '@/components/UnsafeScreenContainer';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import BackButton from '@/components/buttons/BackButton';
import { triggerShake } from '@/utils/animations';

interface CreateUsernameStepProps {
  onNext: (username: string) => Promise<void>;
  onBack?: () => void;
  isLoading?: boolean;
}

export default function CreateUsernameStep({
  onNext,
  onBack,
  isLoading = false,
}: CreateUsernameStepProps) {
  const [username, setUsername] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');
  const [isUsernameTaken, setIsUsernameTaken] = useState(false);
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;

  const validateUsername = (text: string) => {
    // Match backend validation exactly
    const regex = /^[a-zA-Z0-9_]+$/;
    const isValidFormat = regex.test(text);

    if (text.length === 0) {
      setError('');
      setIsValid(false);
    } else if (text.length < 3) {
      setError('Username must be between 3 and 20 characters');
      setIsValid(false);
    } else if (text.length > 20) {
      setError('Username must be between 3 and 20 characters');
      setIsValid(false);
    } else if (!isValidFormat) {
      setError('Username can only contain letters, numbers, and underscores');
      setIsValid(false);
    } else {
      setError('');
      setIsValid(true);
    }
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    setIsUsernameTaken(false); // Reset username taken state on text change
    validateUsername(text);
  };

  const handleContinue = async () => {
    if (isValid && !isLoading) {
      try {
        await onNext(username);
        // If we get here, the username was accepted
        setIsUsernameTaken(false);
      } catch (error) {
        // If there's an error, assume it's because username is taken
        setIsUsernameTaken(true);
        setError('* Username is already taken');
        triggerShake(shakeAnimationValue);
      }
    }
  };

  return (
    <UnsafeScreenContainer>
      {/* Development Back Button */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' && onBack && (
        <BackButton onPress={onBack} style={styles.devBackButton} />
      )}

      <View style={styles.content}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Welcome
              {username.length > 0 && (
                <Text style={styles.usernameText}> {username}</Text>
              )}
            </Text>
            <Text style={styles.subtitle}>
              Please enter your username to get started with your wallet setup
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <Text style={styles.label}>Username</Text>

            <Animated.View
              style={[
                styles.inputContainer,
                username.length > 0 &&
                  (isUsernameTaken || (!isValid && error)
                    ? styles.inputError
                    : isValid
                      ? styles.inputValid
                      : styles.inputContainer),
                {
                  transform: [{ translateX: shakeAnimationValue }],
                },
              ]}
            >
              <View style={styles.inputWrapper}>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="username"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  editable={!isLoading}
                />
              </View>
            </Animated.View>

            <View style={styles.helperContainer}>
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <Text style={styles.helperText}>
                  3-20 characters, letters, numbers, and underscores only
                </Text>
              )}
            </View>
          </View>

          {/* Continue Button */}
          <View style={styles.buttonWrapper}>
            <PrimaryActionButton
              title={
                isLoading
                  ? 'Loading...'
                  : isUsernameTaken
                    ? 'Username Taken'
                    : 'Continue'
              }
              onPress={handleContinue}
              disabled={!isValid || isLoading}
              loading={isLoading}
              variant={isUsernameTaken ? 'error' : 'primary'}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </UnsafeScreenContainer>
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
    paddingHorizontal: scale(20),
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? verticalScale(10) : verticalScale(20),
    marginBottom: verticalScale(24),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: verticalScale(8),
    textAlign: 'left',
  },
  usernameText: {
    color: '#00CFFF',
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: '#9ca3af',
    textAlign: 'left',
    lineHeight: moderateScale(22),
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
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  atSymbol: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#00CFFF',
    marginRight: 8,
  },
  inputValid: {
    borderColor: '#00CFFF',
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
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
});
