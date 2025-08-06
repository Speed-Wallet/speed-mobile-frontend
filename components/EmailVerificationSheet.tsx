import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { X, Mail, RefreshCw } from 'lucide-react-native';
import { verifyOtp, sendOtp } from '@/services/otpService';

const { width: screenWidth } = Dimensions.get('window');

interface EmailVerificationSheetProps {
  visible: boolean;
  onClose: () => void;
  email: string;
  onVerified: () => void;
}

const EmailVerificationSheet: React.FC<EmailVerificationSheetProps> = ({
  visible,
  onClose,
  email,
  onVerified,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');

  const bottomSheetRef = useRef<BottomSheet>(null);
  const inputRefs = useRef<TextInput[]>([]);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasClosed = useRef(false);

  // Memoize snapPoints to prevent infinite re-renders
  const snapPoints = useMemo(() => {
    return ['70%'];
  }, []);

  // Memoize styles to prevent re-creation on every render
  const bottomSheetStyle = useMemo(() => {
    return { backgroundColor: '#1a1a1a' };
  }, []);
  const indicatorStyle = useMemo(() => {
    return { backgroundColor: '#404040' };
  }, []);

  // Handle sheet visibility
  useEffect(() => {
    if (visible) {
      hasClosed.current = false; // Reset closed flag when opening
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  // Start cooldown countdown
  const startCooldown = (seconds: number) => {
    setResendCooldown(seconds);

    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }

    cooldownIntervalRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
            cooldownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
    };
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);
    setError('');

    // Auto-move to next input
    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (numericValue && index === 5) {
      const code = [...newOtp.slice(0, 5), numericValue].join('');
      if (code.length === 6) {
        handleVerify(code);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await verifyOtp(email, otpCode);

      if (response.success) {
        onVerified();
        onClose();
        setOtp(['', '', '', '', '', '']);
        setAttemptsLeft(5);
      } else {
        setError(response.error || 'Invalid verification code');
        setAttemptsLeft(response.attemptsRemaining || 0);

        // Clear OTP inputs on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();

        if (response.attemptsRemaining === 0) {
          Alert.alert(
            'Too Many Attempts',
            'You have exceeded the maximum number of attempts. Please request a new verification code.',
            [{ text: 'OK' }],
          );
        }
      }
    } catch (error) {
      setError('Failed to verify code. Please try again.');
      console.error('OTP verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');

    try {
      await sendOtp(email);
      startCooldown(60);
      setAttemptsLeft(5);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      setError('Failed to resend code. Please try again.');
      console.error('Resend OTP error:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    if (hasClosed.current) return;
    hasClosed.current = true;

    setOtp(['', '', '', '', '', '']);
    setError('');
    setAttemptsLeft(5);
    setResendCooldown(0);

    // Clear any running cooldown
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }

    onClose();
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={handleClose}
      backgroundStyle={bottomSheetStyle}
      handleIndicatorStyle={indicatorStyle}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Mail size={24} color="#3b82f6" />
            <Text style={styles.title}>Verify Your Email</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          We've sent a 6-digit verification code to
        </Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref!)}
              style={[
                styles.otpInput,
                error && styles.otpInputError,
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
              autoFocus={index === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {attemptsLeft < 5 && attemptsLeft > 0 && (
          <Text style={styles.attemptsText}>
            {attemptsLeft} attempts remaining
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.verifyButton,
            isVerifying && styles.verifyButtonDisabled,
          ]}
          onPress={() => handleVerify()}
          disabled={isVerifying || otp.join('').length !== 6}
        >
          <Text style={styles.verifyButtonText}>
            {isVerifying ? 'Verifying...' : 'Verify Code'}
          </Text>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={isResending || resendCooldown > 0}
            style={styles.resendButton}
          >
            <RefreshCw
              size={16}
              color={resendCooldown > 0 ? '#6b7280' : '#3b82f6'}
            />
            <Text
              style={[
                styles.resendButtonText,
                resendCooldown > 0 && styles.resendButtonTextDisabled,
              ]}
            >
              {isResending
                ? 'Resending...'
                : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    backgroundColor: '#1a1a1a',
  },
  indicator: {
    backgroundColor: '#404040',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 2,
    borderColor: '#404040',
    borderRadius: 8,
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#2a2a2a',
  },
  otpInputFilled: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e40af',
  },
  otpInputError: {
    borderColor: '#ef4444',
    backgroundColor: '#7f1d1d',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  attemptsText: {
    color: '#f59e0b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  verifyButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    gap: 8,
  },
  resendText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resendButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: '#6b7280',
  },
});

export default EmailVerificationSheet;
