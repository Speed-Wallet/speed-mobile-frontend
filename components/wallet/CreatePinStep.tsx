import React, { useCallback } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { scale, verticalScale } from 'react-native-size-matters';
import UnsafeScreenContainer from '@/components/UnsafeScreenContainer';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import PinInputSection from '@/components/PinInputSection';

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
    <UnsafeScreenContainer>
      <View style={styles.container}>
        {/* First Section: Centered content (Title + PIN Dots + Keyboard) */}
        <PinInputSection
          title="Create Your PIN"
          pin={pin}
          onKeyPress={handleKeyPress}
          maxLength={6}
        />

        {/* Second Section: Bottom button */}
        <View style={styles.bottomSection}>
          <PrimaryActionButton
            title={isLoading ? 'Creating...' : 'Continue'}
            onPress={onNext}
            disabled={isLoading || pin.length < 6}
            loading={isLoading}
          />
        </View>
      </View>
    </UnsafeScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale(20),
    justifyContent: 'space-between',
  },
  bottomSection: {
    paddingBottom:
      Platform.OS === 'ios' ? verticalScale(34) : verticalScale(24),
  },
});

export default CreatePinStep;
