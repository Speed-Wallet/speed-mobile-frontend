import React, { useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { triggerShake } from '@/utils/animations';
import ScreenContainer from '@/components/ScreenContainer';
import BackButton from '@/components/BackButton';
import CircularNumericKeyboard from '@/components/CircularNumericKeyboard';

interface ConfirmPinStepProps {
  confirmPin: string;
  onConfirmPinChange: (pin: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  isLoading: boolean;
  pinError?: string;
}

const ConfirmPinStep: React.FC<ConfirmPinStepProps> = ({
  confirmPin,
  onConfirmPinChange,
  onConfirm,
  onBack,
  isLoading,
  pinError,
}) => {
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === 'backspace') {
        onConfirmPinChange(confirmPin.slice(0, -1));
      } else if (key >= '0' && key <= '9' && confirmPin.length < 4) {
        onConfirmPinChange(confirmPin + key);
      }
    },
    [confirmPin, onConfirmPinChange],
  );

  // Trigger shake animation when PIN error occurs
  useEffect(() => {
    if (pinError) {
      triggerShake(shakeAnimationValue);
    }
  }, [pinError]);

  return (
    <ScreenContainer>
      {/* Development Back Button */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' && (
        <BackButton onPress={onBack} style={styles.devBackButton} />
      )}

      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Confirm Your PIN</Text>

        {/* PIN Dots */}
        <View style={styles.pinDotsContainer}>
          {[...Array(4)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                index < confirmPin.length && styles.pinDotFilled,
              ]}
            />
          ))}
        </View>

        {/* Error Message */}
        {pinError && (
          <View style={styles.errorContainer}>
            <AlertTriangle size={18} color="#ef4444" />
            <Text style={styles.errorText}>{pinError}</Text>
          </View>
        )}

        {/* Keyboard */}
        <CircularNumericKeyboard onKeyPress={handleKeyPress} />

        {/* Action Buttons with absolute positioning */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            confirmPin.length === 4 && styles.continueButtonActive,
          ]}
          onPress={onConfirm}
          disabled={isLoading || confirmPin.length < 4}
        >
          <Text
            style={[
              styles.continueButtonText,
              confirmPin.length === 4 && styles.continueButtonTextActive,
            ]}
          >
            {isLoading ? 'Confirming...' : 'Confirm'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backTextButton} onPress={onBack}>
          <Text style={styles.backTextButtonText}>Back to Create PIN</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 140 : 160, // Fixed keyboard overlap
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40, // Gap 1: easily adjustable
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40, // Gap 2: easily adjustable
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#333333',
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#555555',
  },
  pinDotFilled: {
    backgroundColor: '#00CFFF',
    borderColor: '#00CFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  continueButton: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    height: 56,
    backgroundColor: '#333333',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonActive: {
    backgroundColor: '#00CFFF',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999999',
  },
  continueButtonTextActive: {
    color: '#000000',
  },
  backTextButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backTextButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#00CFFF',
  },
});

export default ConfirmPinStep;
