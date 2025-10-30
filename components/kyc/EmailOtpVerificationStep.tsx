import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { RefreshCw } from 'lucide-react-native';
import colors from '@/constants/colors';
import IntroScreen from '@/components/wallet/IntroScreen';
import CodeInput from '@/components/CodeInput';
import { triggerShake } from '@/utils/animations';
import { verifyOtp, sendOtp } from '@/services/otpService';

interface EmailOtpVerificationStepProps {
  email: string;
  otpId: string;
  expiresAt: number;
  onVerified: () => void;
  onBack: () => void;
  isLoading?: boolean;
  onResendOtp?: (
    email: string,
  ) => Promise<{ otpId: string; expiresAt: number }>;
}

const EmailOtpVerificationStep: React.FC<EmailOtpVerificationStepProps> = ({
  email,
  otpId,
  expiresAt,
  onVerified,
  onBack,
  isLoading = false,
  onResendOtp,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isCodeInvalid, setIsCodeInvalid] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [currentExpiresAt, setCurrentExpiresAt] = useState(expiresAt);
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const charAnimations = useRef<Animated.Value[]>(
    Array.from({ length: 6 }).map(() => new Animated.Value(0)),
  ).current;
  const CODE_LENGTH = 6;

  const handleVerify = async (codeToVerify?: string) => {
    const verificationCode = codeToVerify || code;
    if (verificationCode.trim().length === CODE_LENGTH) {
      setIsVerifying(true);
      try {
        setError('');
        setIsCodeInvalid(false);

        // Verify the OTP
        const result = await verifyOtp(email, verificationCode.trim());

        // Check if verification was successful
        if (!result.success) {
          // Verification failed
          setIsCodeInvalid(true);
          setCode(''); // Clear the code on error

          const errorMessage =
            result.message || result.error || 'Verification failed';

          if (
            errorMessage.includes('expired') ||
            errorMessage.includes('Expired')
          ) {
            setError('* Verification code expired');
          } else if (
            errorMessage.includes('invalid') ||
            errorMessage.includes('Invalid') ||
            errorMessage.includes('incorrect') ||
            errorMessage.includes('not match')
          ) {
            setError('* Invalid verification code');
          } else if (errorMessage.includes('attempts')) {
            setError('* Too many attempts. Please try again later');
          } else {
            setError(`* ${errorMessage}`);
          }
          triggerShake(shakeAnimationValue);
          return;
        }

        // If successful, call onVerified
        onVerified();
      } catch (error) {
        // Handle error by showing it below the input
        setIsCodeInvalid(true);
        // Clear the code on error so user can try again
        setCode('');

        if (error instanceof Error) {
          if (
            error.message.includes('expired') ||
            error.message.includes('Expired')
          ) {
            setError('* Verification code expired');
          } else if (
            error.message.includes('invalid') ||
            error.message.includes('Invalid') ||
            error.message.includes('incorrect')
          ) {
            setError('* Invalid verification code');
          } else if (error.message.includes('attempts')) {
            setError('* Too many attempts. Please try again later');
          } else {
            setError('* Verification failed. Please try again');
          }
        } else {
          setError('* Verification failed. Please try again');
        }
        triggerShake(shakeAnimationValue);
      } finally {
        setIsVerifying(false);
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

    // Auto-verify when 6 digits are entered
    if (text.length === CODE_LENGTH) {
      handleVerify(text);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      if (onResendOtp) {
        const response = await onResendOtp(email);
        setCurrentExpiresAt(response.expiresAt);
        setResendCooldown(60); // 60 second cooldown
        setError('');
        setIsCodeInvalid(false);
        setCode(''); // Clear the code input
      } else {
        // Fallback to direct sendOtp call
        const response = await sendOtp(email);
        setCurrentExpiresAt(response.expiresAt || Date.now() + 300000);
        setResendCooldown(60);
        setError('');
        setIsCodeInvalid(false);
        setCode('');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setError('* Failed to resend code. Please try again');
    } finally {
      setIsResending(false);
    }
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = Date.now();
    const remaining = currentExpiresAt - now;
    if (remaining <= 0) return '0:00';
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());

  // Update time remaining every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [currentExpiresAt]);

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  return (
    <IntroScreen
      title="Email Verification"
      subtitle={`Enter the 6-digit code sent to ${email}`}
    >
      <View style={styles.contentContainer}>
        {/* Status message */}
        {isVerifying && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>Verifying...</Text>
          </View>
        )}

        {/* Timer above code input */}
        <View style={styles.timerContainerTop}>
          <Text style={styles.helperText}>
            {timeRemaining === '0:00'
              ? 'Code has expired'
              : `Code expires in ${timeRemaining}`}
          </Text>
        </View>

        <CodeInput
          length={CODE_LENGTH}
          value={code}
          onChangeText={handleCodeChange}
          isError={isCodeInvalid}
          editable={!isVerifying && !isLoading}
          autoFocus={true}
          keyboardType="numeric"
          displayMode="text"
          charAnimations={charAnimations}
          shakeAnimation={shakeAnimationValue}
        />

        {/* Error message */}
        <View style={styles.helperContainer}>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Resend code button */}
        <View style={styles.resendContainer}>
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={resendCooldown > 0 || isResending}
            style={styles.resendButton}
          >
            <RefreshCw
              size={16}
              color={
                resendCooldown > 0 || isResending
                  ? colors.textSecondary
                  : colors.primary
              }
              style={styles.resendIcon}
            />
            <Text
              style={[
                styles.resendText,
                (resendCooldown > 0 || isResending) &&
                  styles.resendTextDisabled,
              ]}
            >
              {isResending
                ? 'Sending...'
                : resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Back to email button */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backButtonText}>Change email address</Text>
          </TouchableOpacity>
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
  statusContainer: {
    marginBottom: verticalScale(16),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    backgroundColor: colors.primary + '20',
    borderRadius: scale(8),
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
    textAlign: 'center',
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
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
    paddingHorizontal: scale(20),
  },
  resendContainer: {
    marginTop: verticalScale(16),
    alignItems: 'center',
  },
  resendButton: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  resendIcon: {
    marginRight: scale(4),
  },
  resendText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
    textAlign: 'center',
  },
  resendTextDisabled: {
    color: colors.textSecondary,
  },
  backButtonContainer: {
    marginTop: verticalScale(8),
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
    textAlign: 'center',
  },
});

export default EmailOtpVerificationStep;
