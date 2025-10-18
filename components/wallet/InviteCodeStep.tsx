import React, { useState } from 'react';
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

  const handleSubmit = () => {
    if (code.trim()) {
      onNext(code.trim().toUpperCase());
    }
  };

  return (
    <IntroScreen
      title="Invite Code"
      subtitle="Enter invite code if you have one. Otherwise skip."
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
              disabled={isLoading || !code.trim()}
              loading={isLoading}
            />
          </View>
        </View>
      }
    >
      <View style={styles.contentContainer}>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="Enter invite code"
          placeholderTextColor="#4B5563"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={20}
          editable={!isLoading}
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
  input: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#2a2a2a',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    fontSize: moderateScale(18),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 2,
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
