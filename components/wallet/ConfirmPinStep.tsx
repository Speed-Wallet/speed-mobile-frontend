import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { triggerShake } from '@/utils/animations';
import ScreenContainer from '@/components/ScreenContainer';
import BackButton from '@/components/buttons/BackButton';
import CircularNumericKeyboard from '@/components/keyboard/CircularNumericKeyboard';
import CustomAlert from '@/components/CustomAlert';
import ActionButtonGroup from '@/components/buttons/ActionButtonGroup';

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
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  // Combined loading state
  const loading = isLoading || isLocalLoading;

  const handleConfirm = useCallback(() => {
    setIsLocalLoading(true);
    // Use requestAnimationFrame to ensure UI updates before calling parent
    requestAnimationFrame(() => {
      onConfirm();
    });
  }, [onConfirm]);

  // Reset local loading when external loading changes or error occurs
  useEffect(() => {
    if (pinError) {
      setIsLocalLoading(false);
    }
  }, [pinError]);

  useEffect(() => {
    if (!isLoading) {
      setIsLocalLoading(false);
    }
  }, [isLoading]);

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
        <View style={styles.header}>
          <Text style={styles.title}>Confirm Your PIN</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* PIN Dots Container */}
          <View style={styles.pinDotsContainer}>
            <View style={styles.pinDots}>
              {Array.from({ length: 4 }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.pinDot,
                    index < confirmPin.length && styles.pinDotFilled,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Circular Numeric Keyboard */}
          <CircularNumericKeyboard onKeyPress={handleKeyPress} />
        </View>

        {/* Button Container */}
        <ActionButtonGroup
          primaryTitle={loading ? 'Confirming...' : 'Confirm'}
          onPrimaryPress={handleConfirm}
          primaryDisabled={loading || confirmPin.length < 4}
          primaryLoading={loading}
          secondaryTitle="Back to Create PIN"
          onSecondaryPress={onBack}
          secondaryStyle="text"
        />
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
    top: Platform.OS === 'ios' ? verticalScale(50) : verticalScale(20),
    left: scale(20),
    zIndex: 1000,
    backgroundColor: '#FFB800',
    borderRadius: moderateScale(20),
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? verticalScale(10) : verticalScale(20),
    marginBottom: verticalScale(24),
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDotsContainer: {
    marginBottom: verticalScale(30),
    alignItems: 'center',
  },
  pinDots: {
    flexDirection: 'row',
    gap: scale(15),
  },
  pinDot: {
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#555555',
  },
  pinDotFilled: {
    backgroundColor: '#00CFFF',
    borderColor: '#00CFFF',
  },
});

export default ConfirmPinStep;
