import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale, verticalScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import IntroScreen from './IntroScreen';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import BackButton from '@/components/buttons/BackButton';

interface ShowExistingInviteCodeStepProps {
  referralCode: string;
  onNext: () => void;
  onBack?: () => void;
}

const ShowExistingInviteCodeStep: React.FC<ShowExistingInviteCodeStepProps> = ({
  referralCode,
  onNext,
  onBack,
}) => {
  return (
    <IntroScreen
      title="Invite Code Used"
      subtitle="This is the invite code you used during signup"
      footer={
        <PrimaryActionButton
          title="Continue"
          onPress={onNext}
          disabled={false}
        />
      }
    >
      {/* Development Back Button */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' && onBack && (
        <BackButton onPress={onBack} style={styles.devBackButton} />
      )}

      {/* Display Invite Code */}
      <View style={styles.contentContainer}>
        <View style={styles.codeDisplayContainer}>
          <Text style={styles.codeLabel}>Code You Used</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{referralCode}</Text>
          </View>
          <Text style={styles.helperText}>
            You signed up using this invite code
          </Text>
        </View>
      </View>
    </IntroScreen>
  );
};

const styles = StyleSheet.create({
  devBackButton: {
    position: 'absolute',
    top: verticalScale(50),
    left: scale(20),
    zIndex: 1000,
    backgroundColor: '#FFB800',
    borderRadius: scale(20),
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  codeDisplayContainer: {
    width: '100%',
    alignItems: 'center',
    gap: verticalScale(20),
  },
  codeLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  codeBox: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(12),
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(40),
    borderWidth: 2,
    borderColor: colors.primary,
  },
  codeText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: colors.primary,
    letterSpacing: 4,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: verticalScale(10),
  },
});

export default ShowExistingInviteCodeStep;
