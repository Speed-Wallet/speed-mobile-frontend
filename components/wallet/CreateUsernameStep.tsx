import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { User, ArrowRight, ArrowLeft } from 'lucide-react-native';
import colors from '@/constants/colors';

interface CreateUsernameStepProps {
  onNext: (username: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function CreateUsernameStep({ onNext, onBack, isLoading = false }: CreateUsernameStepProps) {
  const [username, setUsername] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');

  const validateUsername = (text: string) => {
    const regex = /^[a-zA-Z0-9_-]{3,20}$/;
    const isValidFormat = regex.test(text);
    
    if (text.length === 0) {
      setError('');
      setIsValid(false);
    } else if (text.length < 3) {
      setError('Username must be at least 3 characters');
      setIsValid(false);
    } else if (text.length > 20) {
      setError('Username must be 20 characters or less');
      setIsValid(false);
    } else if (!isValidFormat) {
      setError('Only letters, numbers, hyphens, and underscores allowed');
      setIsValid(false);
    } else {
      setError('');
      setIsValid(true);
    }
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    validateUsername(text);
  };

  const handleContinue = () => {
    if (isValid && !isLoading) {
      onNext(username);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.topBackButton} onPress={onBack} disabled={isLoading}>
          <ArrowLeft size={20} color={colors.textSecondary} />
          <Text style={styles.topBackButtonText}>Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.topHeaderTitle}>Username</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
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
          
          <View style={[
            styles.inputContainer,
            username.length > 0 && (isValid ? styles.inputValid : styles.inputError)
          ]}>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="Enter your username"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              editable={!isLoading}
            />
          </View>
          
          <View style={styles.helperContainer}>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <Text style={styles.helperText}>
                3-20 characters, letters, numbers, hyphens, and underscores only
              </Text>
            )}
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            isValid && styles.continueButtonActive
          ]}
          onPress={handleContinue}
          disabled={!isValid || isLoading}
        >
          <Text style={[
            styles.continueButtonText,
            isValid && styles.continueButtonTextActive
          ]}>
            {isLoading ? 'Loading...' : 'Continue'}
          </Text>
          <ArrowRight 
            size={20} 
            color={isValid ? colors.white : colors.textSecondary} 
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  topBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBackButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  topHeaderTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
    marginTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 16,
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
    marginTop: 40,
    marginBottom: 60,
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
  inputValid: {
    borderColor: '#10b981',
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
    paddingHorizontal: 20,
    paddingVertical: 18,
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
  continueButton: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 'auto',
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
