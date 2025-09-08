import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import ScreenContainer from '@/components/ScreenContainer';
import CircularNumericKeyboard from '@/components/keyboard/CircularNumericKeyboard';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import PinDots from '@/components/PinDots';

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
      } else if (key >= '0' && key <= '9' && pin.length < 6) {
        onPinChange(pin + key);
      }
    },
    [pin, onPinChange],
  );

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Your PIN</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* PIN Dots Container */}
          <View style={styles.pinDotsContainer}>
            <PinDots pinLength={pin.length} maxLength={6} />
          </View>

          {/* Circular Numeric Keyboard */}
          <CircularNumericKeyboard onKeyPress={handleKeyPress} />
        </View>

        {/* Button Container */}
        <View style={styles.buttonContainer}>
          <PrimaryActionButton
            title={isLoading ? 'Creating...' : 'Continue'}
            onPress={onNext}
            disabled={isLoading || pin.length < 6}
            loading={isLoading}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
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
  buttonContainer: {
    paddingBottom:
      Platform.OS === 'ios' ? verticalScale(34) : verticalScale(24),
  },
});

export default CreatePinStep;
