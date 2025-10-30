import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Mail } from 'lucide-react-native';
import colors from '@/constants/colors';
import IntroScreen from '@/components/wallet/IntroScreen';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import { triggerShake } from '@/utils/animations';
import { sendOtp, checkEmailStatus } from '@/services/otpService';

type EmailStatus =
  | 'unverified'
  | 'needs_verification'
  | 'otp_pending'
  | 'verified';

interface EmailVerificationStepProps {
  onNext: (email: string) => Promise<void>;
  onBack?: () => void;
  initialEmail?: string;
  isLoading?: boolean;
  onShowOtpStep?: (email: string, otpId: string, expiresAt: number) => void;
}

const EmailVerificationStep: React.FC<EmailVerificationStepProps> = ({
  onNext,
  onBack,
  initialEmail = '',
  isLoading = false,
  onShowOtpStep,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('unverified');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const emailRef = useRef<TextInput>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if email is already verified on mount
  useEffect(() => {
    if (initialEmail && validateEmail(initialEmail)) {
      checkEmailVerificationStatus(initialEmail);
    }
  }, []);

  const checkEmailVerificationStatus = async (emailToCheck: string) => {
    try {
      const statusResponse = await checkEmailStatus(emailToCheck);
      if (statusResponse.isVerified) {
        setEmailStatus('verified');
      } else {
        setEmailStatus('needs_verification');
      }
    } catch (error) {
      console.error('Error checking email status:', error);
      setEmailStatus('needs_verification');
    }
  };

  const handleEmailChange = (text: string) => {
    // Remove all spaces from email
    const noSpaces = text.replace(/\s/g, '');
    setEmail(noSpaces);

    // Reset email status when email changes
    if (emailStatus === 'verified' || emailStatus === 'otp_pending') {
      setEmailStatus('needs_verification');
      setOtpId(null);
      setOtpExpiresAt(null);
    }

    // Clear error when user starts typing
    if (emailError) {
      setEmailError(!validateEmail(noSpaces));
    }
  };

  const handleEmailBlur = async () => {
    setEmailError(!validateEmail(email));

    // Check if email is already verified on blur
    if (validateEmail(email)) {
      await checkEmailVerificationStatus(email);
    }
  };

  const handleSendVerification = async () => {
    if (!validateEmail(email)) {
      setEmailError(true);
      triggerShake(shakeAnimationValue);
      return;
    }

    setIsSendingOtp(true);
    try {
      // First check if email is already verified in the backend
      const statusResponse = await checkEmailStatus(email);
      if (statusResponse.isVerified) {
        // Email is already verified, update status
        setEmailStatus('verified');
        setIsSendingOtp(false);
        return;
      }

      // Email not verified, proceed with OTP flow
      const response = await sendOtp(email);
      setOtpId(response.otpId || null);
      setOtpExpiresAt(response.expiresAt || null);
      setEmailStatus('otp_pending');

      // Show OTP verification step if handler provided
      if (onShowOtpStep && response.otpId && response.expiresAt) {
        onShowOtpStep(email, response.otpId, response.expiresAt);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      triggerShake(shakeAnimationValue);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleContinue = async () => {
    if (!validateEmail(email)) {
      setEmailError(true);
      triggerShake(shakeAnimationValue);
      return;
    }

    if (emailStatus !== 'verified') {
      // Email must be verified before continuing
      triggerShake(shakeAnimationValue);
      return;
    }

    try {
      await onNext(email);
    } catch (error) {
      console.error('Error in email step:', error);
      triggerShake(shakeAnimationValue);
    }
  };

  const handleChangeEmail = () => {
    setEmailStatus('needs_verification');
    setOtpId(null);
    setOtpExpiresAt(null);
    emailRef.current?.focus();
  };

  const isValid = email.trim().length > 0 && validateEmail(email);
  const canContinue = isValid && emailStatus === 'verified';
  const canSendVerification =
    isValid &&
    (emailStatus === 'needs_verification' || emailStatus === 'unverified');

  // Determine button action and text
  const getButtonConfig = () => {
    if (emailStatus === 'verified') {
      return {
        title: isLoading ? 'Loading...' : 'Continue',
        onPress: handleContinue,
        disabled: isLoading,
      };
    } else if (canSendVerification) {
      return {
        title: isSendingOtp ? 'Sending...' : 'Verify',
        onPress: handleSendVerification,
        disabled: isSendingOtp,
      };
    } else {
      return {
        title: 'Verify',
        onPress: handleSendVerification,
        disabled: true,
      };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <IntroScreen
      title="Email Verification"
      subtitle="Enter your email address and verify it"
      footer={
        <PrimaryActionButton
          title={buttonConfig.title}
          onPress={buttonConfig.onPress}
          disabled={buttonConfig.disabled}
          loading={isSendingOtp || isLoading}
          variant="primary"
        />
      }
    >
      {/* Development Back Button */}
      {/* Removed - back button not needed in KYC flow */}

      <View style={styles.contentContainer}>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <Animated.View
            style={[
              styles.inputWrapper,
              emailError && styles.inputWrapperError,
              { transform: [{ translateX: shakeAnimationValue }] },
            ]}
          >
            <View style={styles.emailInputSection}>
              <Mail size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                ref={emailRef}
                style={styles.emailTextInput}
                placeholder="Enter your email address"
                placeholderTextColor="#6b7280"
                value={email}
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={emailStatus !== 'verified'}
                multiline={true}
                numberOfLines={1}
              />
            </View>
            {/* Status indicator */}
            {emailStatus === 'verified' && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </Animated.View>

          {/* Change Email Button */}
          {emailStatus === 'verified' && (
            <TouchableOpacity
              style={styles.changeEmailButton}
              onPress={handleChangeEmail}
            >
              <Text style={styles.changeEmailText}>Change email</Text>
            </TouchableOpacity>
          )}

          {/* Hint/Error Text */}
          {(emailError || email.trim().length === 0) && (
            <Text
              style={[styles.inputHint, emailError && styles.inputHintError]}
            >
              {emailError ? '*' : ''}Valid email required
              {emailError ? ' *' : ''}
            </Text>
          )}

          {/* Helper Text */}
          {emailStatus === 'needs_verification' &&
            !emailError &&
            email.trim().length > 0 && (
              <Text style={styles.helperText}>
                Tap "Verify" below to receive a verification code
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
  emailInputSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: scale(12),
  },
  emailTextInput: {
    flex: 1,
    fontSize: moderateScale(16),
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    minHeight: verticalScale(20),
  },
  inputHint: {
    fontSize: moderateScale(13),
    color: '#9ca3af',
    marginTop: verticalScale(6),
  },
  inputHintError: {
    color: '#ef4444',
  },
  helperText: {
    fontSize: moderateScale(13),
    color: '#9ca3af',
    marginTop: verticalScale(6),
  },
  changeEmailButton: {
    alignSelf: 'flex-start',
    marginTop: verticalScale(8),
  },
  changeEmailText: {
    color: '#3b82f6',
    fontSize: moderateScale(14),
    fontFamily: 'Inter-SemiBold',
  },
  verifiedBadge: {
    backgroundColor: '#10b981',
    borderRadius: scale(12),
    width: scale(28),
    height: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#ffffff',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
});

export default EmailVerificationStep;
