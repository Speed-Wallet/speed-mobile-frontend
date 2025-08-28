import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import ScreenContainer from '@/components/ScreenContainer';
import CircularNumericKeyboard from '@/components/keyboard/CircularNumericKeyboard';

interface CreatePinStepProps {
  pin: string;
  onPinChange: (pin: string) => void;
  onNext: () => void;
  onBack?: () => void;
  isLoading: boolean;
}

const CreatePinStep: React.FC<CreatePinStepProps> = ({
  pin,
  onPinChange,
  onNext,
  onBack,
  isLoading,
}) => {
  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === 'backspace') {
        onPinChange(pin.slice(0, -1));
      } else if (key >= '0' && key <= '9' && pin.length < 4) {
        onPinChange(pin + key);
      }
    },
    [pin, onPinChange],
  );

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Create Your PIN</Text>

        {/* PIN Dots Container */}
        <View style={styles.pinDotsContainer}>
          <View style={styles.pinDots}>
            {Array.from({ length: 4 }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.pinDot,
                  index < pin.length && styles.pinDotFilled,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Circular Numeric Keyboard */}
        <CircularNumericKeyboard onKeyPress={handleKeyPress} />

        {/* Button Container */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              pin.length === 4 && styles.continueButtonActive,
            ]}
            onPress={onNext}
            disabled={isLoading || pin.length < 4}
          >
            <Text
              style={[
                styles.continueButtonText,
                pin.length === 4 && styles.continueButtonTextActive,
              ]}
            >
              {isLoading ? 'Creating...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40, // First easily adjustable gap
  },
  pinDotsContainer: {
    marginBottom: 40, // Second easily adjustable gap
    alignItems: 'center',
  },
  pinDots: {
    flexDirection: 'row',
    gap: 15,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#333333',
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
});

export default CreatePinStep;
