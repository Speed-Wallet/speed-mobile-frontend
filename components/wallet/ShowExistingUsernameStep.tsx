import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { scale, verticalScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import BackButton from '@/components/buttons/BackButton';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import IntroScreen from './IntroScreen';

interface ShowExistingUsernameStepProps {
  username: string;
  onNext: () => void;
  onBack?: () => void;
}

export default function ShowExistingUsernameStep({
  username,
  onNext,
  onBack,
}: ShowExistingUsernameStepProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <IntroScreen
      title="Welcome back"
      subtitle={`Your username is @${username}`}
      username={username}
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

      {/* Welcome Back Section */}
      <Animated.View
        style={[
          styles.statusContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.existingUserContainer}>
          <Text style={styles.successIcon}>👋</Text>
          <Text style={styles.usernameText}>@{username}</Text>
          <Text style={styles.existingUserSubtext}>
            This wallet is already registered!
          </Text>
        </View>
      </Animated.View>
    </IntroScreen>
  );
}

const styles = StyleSheet.create({
  devBackButton: {
    position: 'absolute',
    top: verticalScale(50),
    left: scale(20),
    zIndex: 1000,
    backgroundColor: '#FFB800',
    borderRadius: scale(20),
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(40),
  },
  existingUserContainer: {
    alignItems: 'center',
    gap: verticalScale(16),
  },
  successIcon: {
    fontSize: 64,
  },
  usernameText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: colors.primary,
    textAlign: 'center',
  },
  existingUserSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
