import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated as RNAnimated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Mail, RefreshCw } from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import ScreenContainer from '@/components/ScreenContainer';
import SettingsHeader from '@/components/SettingsHeader';
import Toast from '@/components/Toast';
import CircularNumericKeyboard from '@/components/keyboard/CircularNumericKeyboard';
import { sendOtp, verifyOtp } from '@/services/otpService';
import { StorageService } from '@/utils/storage';
import { triggerShake } from '@/utils/animations';

export default function EmailVerificationScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Animation for shake effect
  const shakeAnimationValue = useRef(new RNAnimated.Value(0)).current;

  const otpInputRef = useRef<TextInput>(null);

  // Load email and OTP data from storage
  useEffect(() => {
    loadEmailData();
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (expiresAt && timeLeft > 0) {
      const timer = setInterval(() => {
        const remaining = Math.max(
          0,
          Math.floor((expiresAt - Date.now()) / 1000),
        );
        setTimeLeft(remaining);
        if (remaining === 0) {
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [expiresAt, timeLeft]);

  const loadEmailData = async () => {
    try {
      const personalInfo = await StorageService.loadPersonalInfo();
      if (personalInfo?.email) {
        setEmail(personalInfo.email);
      }

      // In a real app, you might load OTP data from storage or context
      // For now, we'll assume the OTP was just sent
      if (expiresAt) {
        const remaining = Math.max(
          0,
          Math.floor((expiresAt - Date.now()) / 1000),
        );
        setTimeLeft(remaining);
      }
    } catch (error) {
      console.error('Error loading email data:', error);
    }
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const codeToVerify = otpCode || otp;
    if (!codeToVerify.trim() || codeToVerify.length !== 6) {
      triggerShake(shakeAnimationValue);
      setToast({ message: 'Please enter a valid 6-digit code', type: 'error' });
      // Reset OTP and cursor position
      setOtp('');
      otpInputRef.current?.setSelection(0, 0);
      otpInputRef.current?.focus();
      return;
    }

    if (!otpId) {
      setToast({
        message: 'No verification session found. Please request a new code.',
        type: 'error',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyOtp(otpId, codeToVerify);
      if (response.success) {
        setToast({
          message: 'Email verified successfully! ✅',
          type: 'success',
        });

        // Go back to the previous screen after a short delay
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        triggerShake(shakeAnimationValue);
        setToast({
          message: 'Invalid verification code. Please try again.',
          type: 'error',
        });
        // Reset OTP and cursor position immediately
        setOtp('');
        otpInputRef.current?.setSelection(0, 0);
        otpInputRef.current?.focus();
      }
    } catch (error) {
      triggerShake(shakeAnimationValue);
      setToast({
        message: 'Verification failed. Please try again.',
        type: 'error',
      });
      // Reset OTP and cursor position immediately
      setOtp('');
      otpInputRef.current?.setSelection(0, 0);
      otpInputRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (isResending) return;

    setIsResending(true);
    try {
      const response = await sendOtp(email);
      setOtpId(response.otpId || null);
      setExpiresAt(response.expiresAt || null);

      if (response.expiresAt) {
        const remaining = Math.max(
          0,
          Math.floor((response.expiresAt - Date.now()) / 1000),
        );
        setTimeLeft(remaining);
      }

      setToast({
        message: 'New verification code sent to your email',
        type: 'info',
      });
      // Reset OTP and cursor position immediately
      setOtp('');
      otpInputRef.current?.setSelection(0, 0);
      otpInputRef.current?.focus();
    } catch (error) {
      setToast({ message: 'Failed to send verification code', type: 'error' });
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    router.back();
  };

  // Handle keyboard input
  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setOtp((prev) => prev.slice(0, -1));
    } else if (key >= '0' && key <= '9' && otp.length < 6) {
      const newOtp = otp + key;
      setOtp(newOtp);

      // Auto-verify when 6 digits are entered - pass the complete OTP directly
      if (newOtp.length === 6) {
        handleVerifyOtp(newOtp);
      }
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      {/* Header */}
      <SettingsHeader
        title="Verify Email"
        onClose={handleClose}
        backgroundColor="#2a2a2a"
        textColor="#ffffff"
      />

      {/* Content */}
      <View style={styles.content}>
        <View>
          <Text style={styles.primaryText}>
            We've sent an email to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>

          <Text style={styles.secondaryText}>
            Please enter the verification code sent to your email in the next 10
            mins
          </Text>
        </View>

        <View style={styles.codeSection}>
          <RNAnimated.View
            style={[
              styles.otpContainer,
              { transform: [{ translateX: shakeAnimationValue }] },
            ]}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={index} style={styles.digitContainer}>
                <Text style={styles.digitText}>{otp[index] || ''}</Text>
                <View style={styles.underline} />
              </View>
            ))}
            <TextInput
              ref={otpInputRef}
              style={styles.hiddenInput}
              value={otp}
              onChangeText={(text) => {
                // Only allow digits and limit to 6 characters
                const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
                setOtp(numericText);
              }}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={6}
              autoFocus
            />
          </RNAnimated.View>

          {/* Timer and Resend */}
          <View style={styles.resendSection}>
            {timeLeft > 0 ? (
              <Text style={styles.timerText}>
                Code expires in {formatTime(timeLeft)}
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={isResending}
                style={styles.resendButton}
              >
                <RefreshCw size={16} color="#00CFFF" />
                <Text style={styles.resendText}>
                  {isResending ? 'Sending...' : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Circular Numeric Keyboard */}
        <View style={styles.keyboardSection}>
          <CircularNumericKeyboard onKeyPress={handleKeyPress} scale={0.9} />
        </View>
      </View>

      {/* Toast */}
      <Toast
        message={toast?.message || ''}
        visible={!!toast}
        onHide={() => setToast(null)}
        type={toast?.type || 'success'}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: scale(15),
    paddingTop: verticalScale(8),
  },
  primaryText: {
    fontSize: moderateScale(20),
    color: '#ffffff',
    textAlign: 'left',
    lineHeight: moderateScale(24),
    fontWeight: '600',
    marginBottom: verticalScale(16),
  },
  secondaryText: {
    fontSize: moderateScale(16),
    color: '#9ca3af',
    textAlign: 'left',
    lineHeight: verticalScale(22),
    fontWeight: '400',
  },
  emailHighlight: {
    color: '#00CFFF',
    fontWeight: '600',
  },
  codeSection: {
    // marginBottom: verticalScale(36),
    justifyContent: 'center',
    flex: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    marginBottom: verticalScale(12),
  },
  digitContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: scale(8),
    paddingBottom: verticalScale(8),
  },
  digitText: {
    fontSize: moderateScale(32),
    fontWeight: '600',
    color: '#ffffff',
    minHeight: verticalScale(40),
    textAlign: 'center',
  },
  underline: {
    width: '100%',
    height: 2,
    backgroundColor: '#404040',
    marginTop: verticalScale(4),
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    fontSize: 1,
  },
  resendSection: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: moderateScale(14),
    color: '#6b7280',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
  },
  resendText: {
    fontSize: moderateScale(14),
    color: '#00CFFF',
    fontWeight: '600',
    marginLeft: scale(8),
  },
  keyboardSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: moderateScale(10),
  },
});
