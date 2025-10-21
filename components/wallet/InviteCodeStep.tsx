import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import IntroScreen from './IntroScreen';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import { triggerShake } from '@/utils/animations';

interface InviteCodeStepProps {
  onNext: (inviteCode: string) => Promise<void>;
  onSkip: () => void;
  isLoading?: boolean;
}

const InviteCodeStep: React.FC<InviteCodeStepProps> = ({
  onNext,
  onSkip,
  isLoading = false,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isCodeInvalid, setIsCodeInvalid] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const charAnimations = useRef<Animated.Value[]>(
    Array.from({ length: 6 }).map(() => new Animated.Value(0)),
  ).current;
  const CODE_LENGTH = 6;

  const handleSubmit = async () => {
    if (code.trim().length === CODE_LENGTH) {
      try {
        setError('');
        setIsCodeInvalid(false);
        await onNext(code.trim().toUpperCase());
        // If successful, error state remains cleared
      } catch (error) {
        // Handle error by showing it below the input
        setIsCodeInvalid(true);
        if (error instanceof Error) {
          if (
            error.message.includes('not exist') ||
            error.message.includes('not found')
          ) {
            setError('* Invite code not found');
          } else if (error.message.includes('already used')) {
            setError('* You have already used a referral code');
          } else if (error.message.includes('own')) {
            setError('* Cannot use your own referral code');
          } else {
            setError('* Invalid invite code');
          }
        } else {
          setError('* Invalid invite code');
        }
        triggerShake(shakeAnimationValue);
      }
    }
  };

  const handleCodeChange = (text: string) => {
    // Only allow alphanumeric characters
    const filtered = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const newCode = filtered.slice(0, CODE_LENGTH);

    // Trigger animation for newly added character
    if (newCode.length > code.length) {
      const index = newCode.length - 1;
      charAnimations[index].setValue(20); // Start from below
      Animated.spring(charAnimations[index], {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }

    // Reset animation for removed character
    if (newCode.length < code.length) {
      charAnimations[newCode.length].setValue(0);
    }

    setCode(newCode);
    // Clear error when user starts typing again
    if (error) {
      setError('');
      setIsCodeInvalid(false);
    }
  };

  const renderCodeSlots = () => {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={styles.codeContainer}
      >
        <Animated.View
          style={[
            styles.codeRow,
            {
              transform: [{ translateX: shakeAnimationValue }],
            },
          ]}
        >
          {Array.from({ length: CODE_LENGTH }).map((_, index) => {
            const char = code[index];
            const isFilled = char !== undefined;
            const isActive = index === code.length && !isCodeInvalid;

            return (
              <View
                key={index}
                style={[
                  styles.codeSlot,
                  isActive && styles.codeSlotActive,
                  isCodeInvalid && styles.codeSlotError,
                ]}
              >
                {isFilled && (
                  <Animated.Text
                    style={[
                      styles.codeChar,
                      {
                        transform: [{ translateY: charAnimations[index] }],
                      },
                    ]}
                  >
                    {char}
                  </Animated.Text>
                )}
              </View>
            );
          })}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <IntroScreen
      title="Invite Code"
      subtitle="Enter an invite code if you have one, otherwise press skip to continue."
      footer={
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            disabled={isLoading}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          <View style={styles.submitButtonContainer}>
            <PrimaryActionButton
              title={
                isLoading
                  ? 'Validating...'
                  : isCodeInvalid
                    ? 'Invalid Code'
                    : 'Continue'
              }
              onPress={handleSubmit}
              disabled={isLoading || code.length !== CODE_LENGTH}
              loading={isLoading}
              variant={isCodeInvalid ? 'error' : 'primary'}
            />
          </View>
        </View>
      }
    >
      <View style={styles.contentContainer}>
        {renderCodeSlots()}

        {/* Error message */}
        <View style={styles.helperContainer}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.helperText}>Enter the 6-character code</Text>
          )}
        </View>

        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={code}
          onChangeText={handleCodeChange}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={CODE_LENGTH}
          editable={!isLoading}
          keyboardType="default"
          autoFocus={true}
          selectTextOnFocus={false}
        />
      </View>
    </IntroScreen>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(8),
    paddingHorizontal: scale(20),
    width: '100%',
  },
  codeRow: {
    flexDirection: 'row',
    gap: scale(8),
    width: '100%',
  },
  codeSlot: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: scale(60),
    borderRadius: moderateScale(12),
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeSlotActive: {
    borderColor: colors.primary,
  },
  codeSlotError: {
    borderColor: colors.error,
    backgroundColor: '#2a1a1a',
  },
  codeChar: {
    fontSize: moderateScale(24),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  helperContainer: {
    minHeight: 24,
    justifyContent: 'center',
    marginTop: verticalScale(12),
    paddingHorizontal: scale(20),
  },
  helperText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.error,
    lineHeight: 20,
    textAlign: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    gap: scale(12),
  },
  skipButton: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(16),
  },
  skipButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  submitButtonContainer: {
    flex: 7,
  },
});

export default InviteCodeStep;
