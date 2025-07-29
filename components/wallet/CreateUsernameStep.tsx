import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useState, useRef } from 'react';
import { User, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import ScreenHeader from '@/components/ScreenHeader';
import ScreenContainer from '@/components/ScreenContainer';
import BackButton from '@/components/BackButton';
import { triggerShake } from '@/utils/animations';

interface CreateUsernameStepProps {
  onNext: (username: string) => Promise<void>;
  onBack?: () => void;
  isLoading?: boolean;
}

export default function CreateUsernameStep({ onNext, onBack, isLoading = false }: CreateUsernameStepProps) {
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
    <ScreenContainer>
      {/* Development Back Button */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' && onBack && (
        <BackButton onPress={onBack} style={styles.devBackButton} />
      )}
      
      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <User size={32} color={colors.primary} strokeWidth={2} />
          </View>
          
          <Text style={styles.title}>
            Welcome{username.length > 0 && <Text style={styles.usernameText}> {username}</Text>}
          </Text>
          <Text style={styles.subtitle}>
            Please enter your username to get started with your wallet setup
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          
          <Animated.View style={[
            styles.inputContainer,
            username.length > 0 && (
              isUsernameTaken || (!isValid && error) 
                ? styles.inputError 
                : isValid 
                ? styles.inputValid 
                : styles.inputContainer
            ),
            {
              transform: [{ translateX: shakeAnimationValue }],
            },
          ]}>
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
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={!isValid || isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                !isValid
                  ? [colors.backgroundMedium, colors.backgroundMedium]
                  : isUsernameTaken
                  ? ['#ff5252', '#e53e3e']
                  : ['#7c5cff', '#6446fe']
              }
              style={styles.buttonGradient}
            >
              <Text style={[
                styles.continueButtonText,
                isValid && styles.continueButtonTextActive
              ]}>
                {isLoading ? 'Loading...' : isUsernameTaken ? 'Username Taken' : 'Continue'}
              </Text>
              {!isUsernameTaken && (
                <ArrowRight 
                  size={20} 
                  color={isValid ? colors.white : colors.textSecondary} 
                  strokeWidth={2}
                />
              )}
            </LinearGradient>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
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
  usernameText: {
    color: colors.primary,
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
    borderColor: colors.primary,
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
    color: colors.primary,
    marginRight: 8,
  },
  inputValid: {
    borderColor: '#10b981',
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
  },
  continueButton: {
    borderRadius: 25,
    overflow: 'hidden',
    height: 56,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    gap: 12,
  },
  continueButtonActive: {
    backgroundColor: colors.primary,
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textSecondary,
  },
  continueButtonTextActive: {
    color: colors.white,
  },
});
