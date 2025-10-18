import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import IntroScreen from './IntroScreen';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';

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
  const inputRef = useRef<TextInput>(null);
  const CODE_LENGTH = 6;

  const handleSubmit = () => {
    if (code.trim().length === CODE_LENGTH) {
      onNext(code.trim().toUpperCase());
    }
  };

  const handleCodeChange = (text: string) => {
    // Only allow alphanumeric characters
    const filtered = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    setCode(filtered.slice(0, CODE_LENGTH));
  };

  const renderCodeSlots = () => {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={styles.codeContainer}
      >
        {Array.from({ length: CODE_LENGTH }).map((_, index) => {
          const char = code[index];
          const isFilled = char !== undefined;

          return (
            <View
              key={index}
              style={[
                styles.codeSlot,
                isFilled && styles.codeSlotFilled,
                index === code.length && styles.codeSlotActive,
              ]}
            >
              {isFilled && <Text style={styles.codeChar}>{char}</Text>}
            </View>
          );
        })}
      </TouchableOpacity>
    );
  };

  return (
    <IntroScreen
      title="Invite Code"
      subtitle="Enter an invite code if you have one, otherwise press skip to continue."
      footer={
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            disabled={isLoading}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          <View style={styles.submitButtonContainer}>
            <PrimaryActionButton
              title="Continue"
              onPress={handleSubmit}
              disabled={isLoading || code.length !== CODE_LENGTH}
              loading={isLoading}
            />
          </View>
        </View>
      }
    >
      <View style={styles.contentContainer}>
        {renderCodeSlots()}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={code}
          onChangeText={handleCodeChange}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={CODE_LENGTH}
          editable={!isLoading}
          keyboardType="default"
          autoFocus={true}
          selectTextOnFocus={false}
        />
      </View>
    </IntroScreen>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(8),
    paddingHorizontal: scale(20),
    width: '100%',
  },
  codeSlot: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: scale(60),
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
  codeChar: {
    fontSize: moderateScale(24),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    gap: scale(12),
  },
  skipButton: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(16),
  },
  skipButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  submitButtonContainer: {
    flex: 7,
  },
});

export default InviteCodeStep;
