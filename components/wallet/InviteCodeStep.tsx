import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import IntroScreen from './IntroScreen';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import CodeInput from '@/components/CodeInput';
import { triggerShake } from '@/utils/animations';

interface InviteCodeStepProps {
  onNext: (inviteCode: string) => Promise<void>;
  onSkip: () => void;
  isLoading?: boolean;
  existingCode?: string | null;
}

const InviteCodeStep: React.FC<InviteCodeStepProps> = ({
  onNext,
  onSkip,
  isLoading = false,
  existingCode = null,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isCodeInvalid, setIsCodeInvalid] = useState(false);
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
    setCode(text);
    // Clear error when user starts typing again
    if (error) {
      setError('');
      setIsCodeInvalid(false);
    }
  };

  // If user already has an existing code, show read-only view
  if (existingCode) {
    return (
      <IntroScreen
        title="Invite Code"
        subtitle="You have already used an invite code. This cannot be changed."
        footer={
          <PrimaryActionButton
            title="Continue"
            onPress={onSkip}
            disabled={isLoading}
            loading={isLoading}
          />
        }
      >
        <View style={styles.contentContainer}>
          <View style={styles.readOnlyCodeContainer}>
            <Text style={styles.readOnlyCodeLabel}>Your invite code</Text>
            <View style={styles.readOnlyCodeBox}>
              <Text style={styles.readOnlyCodeText}>{existingCode}</Text>
            </View>
          </View>
        </View>
      </IntroScreen>
    );
  }

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
        <CodeInput
          length={CODE_LENGTH}
          value={code}
          onChangeText={handleCodeChange}
          isError={isCodeInvalid}
          editable={!isLoading}
          autoFocus={true}
          keyboardType="default"
          displayMode="text"
          charAnimations={charAnimations}
          shakeAnimation={shakeAnimationValue}
        />

        {/* Error message */}
        <View style={styles.helperContainer}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.helperText}>Enter the 6-character code</Text>
          )}
        </View>
      </View>
    </IntroScreen>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  readOnlyCodeContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: scale(20),
  },
  readOnlyCodeLabel: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: verticalScale(12),
  },
  readOnlyCodeBox: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(40),
    minWidth: scale(200),
    alignItems: 'center',
  },
  readOnlyCodeText: {
    fontSize: moderateScale(24),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    letterSpacing: 4,
  },
});

export default InviteCodeStep;
