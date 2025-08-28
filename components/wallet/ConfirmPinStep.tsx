import React, { useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { triggerShake } from '@/utils/animations';
import ScreenContainer from '@/components/ScreenContainer';
import BackButton from '@/components/BackButton';
import CircularNumericKeyboard from '@/components/keyboard/CircularNumericKeyboard';
import CustomAlert from '@/components/CustomAlert';

interface ConfirmPinStepProps {
  confirmPin: string;
  onConfirmPinChange: (pin: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  isLoading: boolean;
  pinError?: string;
  onClearError?: () => void;
}

const ConfirmPinStep: React.FC<ConfirmPinStepProps> = ({
  confirmPin,
  onConfirmPinChange,
  onConfirm,
  onBack,
  isLoading,
  pinError,
  onClearError,
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

  // Handler for "Try Again" button
  const handleTryAgain = useCallback(() => {
    onConfirmPinChange(''); // Reset the confirm PIN to empty
    if (onClearError) {
      onClearError(); // Clear the error
    }
  }, [onConfirmPinChange, onClearError]);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
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

        {/* Keyboard */}
        <CircularNumericKeyboard onKeyPress={handleKeyPress} />

        {/* Button Container */}
        <View style={styles.buttonContainer}>
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
      </View>

      {/* Custom Alert for PIN Error */}
      {pinError && (
        <CustomAlert
          visible={true}
          type="error"
          title="PIN Mismatch"
          message={pinError}
          onDismiss={handleTryAgain}
          buttons={[
            {
              text: 'Try Again',
              onPress: handleTryAgain,
              style: 'default',
            },
          ]}
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'center',
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
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  continueButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#333333',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    alignItems: 'center',
    paddingVertical: 8,
  },
  backTextButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#00CFFF',
  },
});

export default ConfirmPinStep;
