import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Animated } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Check } from 'lucide-react-native';
import colors from '@/constants/colors';
import IntroScreen from '@/components/wallet/IntroScreen';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import { triggerShake } from '@/utils/animations';

interface NameStepProps {
  onNext: (firstName: string, lastName: string) => Promise<void>;
  onBack?: () => void;
  initialFirstName?: string;
  initialLastName?: string;
  isLoading?: boolean;
}

const NameStep: React.FC<NameStepProps> = ({
  onNext,
  onBack,
  initialFirstName = '',
  initialLastName = '',
  isLoading = false,
}) => {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);

  const validateName = (name: string): boolean => {
    return name.trim().length >= 4;
  };

  const handleFirstNameChange = (text: string) => {
    // Only allow English letters, no spaces
    const letterRegex = /^[a-zA-Z]*$/;
    const cleanedText = text.replace(/[^a-zA-Z]/g, '');

    if (letterRegex.test(cleanedText)) {
      setFirstName(cleanedText);
      // Clear error when user starts typing
      if (firstNameError) {
        setFirstNameError(!validateName(cleanedText));
      }
    }
  };

  const handleLastNameChange = (text: string) => {
    // Only allow English letters, no spaces
    const letterRegex = /^[a-zA-Z]*$/;
    const cleanedText = text.replace(/[^a-zA-Z]/g, '');

    if (letterRegex.test(cleanedText)) {
      setLastName(cleanedText);
      // Clear error when user starts typing
      if (lastNameError) {
        setLastNameError(!validateName(cleanedText));
      }
    }
  };

  const handleFirstNameBlur = () => {
    setFirstNameError(!validateName(firstName));
  };

  const handleLastNameBlur = () => {
    setLastNameError(!validateName(lastName));
  };

  const handleContinue = async () => {
    const firstNameValid = validateName(firstName);
    const lastNameValid = validateName(lastName);

    setFirstNameError(!firstNameValid);
    setLastNameError(!lastNameValid);

    if (!firstNameValid || !lastNameValid) {
      triggerShake(shakeAnimationValue);
      return;
    }

    try {
      await onNext(firstName, lastName);
    } catch (error) {
      console.error('Error in name step:', error);
      triggerShake(shakeAnimationValue);
    }
  };

  const isValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    validateName(firstName) &&
    validateName(lastName);

  return (
    <IntroScreen
      title="Personal Information"
      subtitle="Enter your first and last name"
      footer={
        <PrimaryActionButton
          title={isLoading ? 'Loading...' : 'Continue'}
          onPress={handleContinue}
          disabled={!isValid || isLoading}
          loading={isLoading}
          variant="primary"
        />
      }
    >
      {/* Development Back Button */}
      {/* Removed - back button not needed in KYC flow */}

      <View style={styles.contentContainer}>
        {/* First Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>First Name</Text>
          <Animated.View
            style={[
              styles.inputWrapper,
              firstNameError && styles.inputWrapperError,
              { transform: [{ translateX: shakeAnimationValue }] },
            ]}
          >
            <TextInput
              ref={firstNameRef}
              style={styles.textInput}
              placeholder="Enter your first name"
              placeholderTextColor="#6b7280"
              value={firstName}
              onChangeText={handleFirstNameChange}
              onBlur={handleFirstNameBlur}
              editable={!isLoading}
              autoCapitalize="words"
              autoComplete="name-given"
            />
            {!firstNameError &&
              firstName.trim().length > 0 &&
              validateName(firstName) && (
                <Check size={20} color="#10b981" style={styles.validIcon} />
              )}
          </Animated.View>
          {(firstNameError || firstName.trim().length === 0) && (
            <Text
              style={[
                styles.inputHint,
                firstNameError && styles.inputHintError,
              ]}
            >
              {firstNameError ? '*' : ''}Minimum 4 characters
              {firstNameError ? ' *' : ''}
            </Text>
          )}
        </View>

        {/* Last Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Last Name</Text>
          <Animated.View
            style={[
              styles.inputWrapper,
              lastNameError && styles.inputWrapperError,
              { transform: [{ translateX: shakeAnimationValue }] },
            ]}
          >
            <TextInput
              ref={lastNameRef}
              style={styles.textInput}
              placeholder="Enter your last name"
              placeholderTextColor="#6b7280"
              value={lastName}
              onChangeText={handleLastNameChange}
              onBlur={handleLastNameBlur}
              editable={!isLoading}
              autoCapitalize="words"
              autoComplete="name-family"
            />
            {!lastNameError &&
              lastName.trim().length > 0 &&
              validateName(lastName) && (
                <Check size={20} color="#10b981" style={styles.validIcon} />
              )}
          </Animated.View>
          {(lastNameError || lastName.trim().length === 0) && (
            <Text
              style={[styles.inputHint, lastNameError && styles.inputHintError]}
            >
              {lastNameError ? '*' : ''}Minimum 4 characters
              {lastNameError ? ' *' : ''}
            </Text>
          )}
        </View>
      </View>
    </IntroScreen>
  );
};

const styles = StyleSheet.create({
  devBackButton: {
    position: 'absolute',
    top: verticalScale(20),
    left: scale(20),
    zIndex: 100,
  },
  contentContainer: {
    gap: verticalScale(20),
  },
  inputContainer: {
    marginBottom: verticalScale(4),
  },
  inputLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: verticalScale(8),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#404040',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(16),
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
  },
  validIcon: {
    marginLeft: scale(8),
  },
  inputHint: {
    fontSize: moderateScale(13),
    color: '#9ca3af',
    marginTop: verticalScale(6),
  },
  inputHintError: {
    color: '#ef4444',
  },
});

export default NameStep;
