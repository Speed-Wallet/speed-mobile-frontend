import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import CircularNumericKeyboard from '@/components/keyboard/CircularNumericKeyboard';
import IntroHeader from './IntroHeader';
import ScreenContainer from '@/components/ScreenContainer';

interface InviteCodeStepProps {
  onNext: (inviteCode: string) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

const InviteCodeStep: React.FC<InviteCodeStepProps> = ({
  onNext,
  onSkip,
  isLoading = false,
}) => {
  const [code, setCode] = useState('');
  const CODE_LENGTH = 6;

  useEffect(() => {
    if (code.length === CODE_LENGTH) {
      // Auto-submit when all digits are entered
      onNext(code);
    }
  }, [code, onNext]);

  const handleKeyPress = (key: string) => {
    if (isLoading) return;

    if (key === 'backspace') {
      setCode((prev) => prev.slice(0, -1));
    } else if (code.length < CODE_LENGTH) {
      setCode((prev) => prev + key);
    }
  };

  const renderCodeSlots = () => {
    return (
      <View style={styles.codeContainer}>
        {Array.from({ length: CODE_LENGTH }).map((_, index) => {
          const digit = code[index];
          const isFilled = digit !== undefined;

          return (
            <View
              key={index}
              style={[
                styles.codeSlot,
                isFilled && styles.codeSlotFilled,
                index === code.length && styles.codeSlotActive,
              ]}
            >
              {isFilled && <Text style={styles.codeDigit}>{digit}</Text>}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScreenContainer style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <IntroHeader
          title="Invite Code"
          subtitle="Enter invite code if you have one. Otherwise skip."
        />
      </View>

      {/* Skip Button */}
      <View style={styles.skipButtonContainer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onSkip}
          disabled={isLoading}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Code Slots */}
      <View style={styles.codeSlotsContainer}>{renderCodeSlots()}</View>

      {/* Keyboard */}
      <View style={styles.keyboardContainer}>
        <CircularNumericKeyboard onKeyPress={handleKeyPress} scale={1} />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  headerContainer: {
    paddingHorizontal: scale(20),
  },
  codeSlotsContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  codeSlot: {
    width: scale(48),
    height: verticalScale(56),
    borderRadius: moderateScale(12),
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeSlotFilled: {
    borderColor: colors.primary,
    backgroundColor: '#1f1f1f',
  },
  codeSlotActive: {
    borderColor: colors.primary,
  },
  codeDigit: {
    fontSize: moderateScale(24),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  keyboardContainer: {
    alignItems: 'center',
    // paddingBottom: 16,
    // flex: 1,
  },
  skipButtonContainer: {
    paddingHorizontal: 30,
    paddingVertical: 16,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingVertical: verticalScale(12),
  },
  skipButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#878b90ff',
    textAlign: 'center',
  },
});

export default InviteCodeStep;
