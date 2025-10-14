import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import UnsafeScreenContainer from '../UnsafeScreenContainer';
import SeedPhraseDisplay from '../SeedPhraseDisplay';
import PrimaryActionButton from '../buttons/PrimaryActionButton';
import ScreenContainer from '@/components/ScreenContainer';
import { useAlert } from '@/providers/AlertProvider';
import IntroHeader from './IntroHeader';

interface ShowMnemonicStepProps {
  mnemonic: string;
  publicKey: string;
  onNext: () => void;
  isLoading: boolean;
}

const ShowMnemonicStep: React.FC<ShowMnemonicStepProps> = ({
  mnemonic,
  publicKey,
  onNext,
  isLoading,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { alert } = useAlert();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;

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
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      {/* Dev Mode Skip Button */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' && (
        <TouchableOpacity style={styles.skipButton} onPress={onNext}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        {/* Header */}
        <IntroHeader
          title="Your Seed Phrase"
          subtitle="Don't share your seed phrase with anyone."
        />

        {/* Seed Phrase Card */}
        <Animated.View
          style={[
            styles.seedPhraseContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <SeedPhraseDisplay
            seedPhrase={mnemonic}
            isVisible={isVisible}
            onToggleVisibility={() => setIsVisible(!isVisible)}
          />
        </Animated.View>

        {/* Warning Card */}
        {/* <Animated.View
          style={[
            styles.warningContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          <LinearGradient
            colors={['rgba(255, 176, 0, 0.15)', 'rgba(255, 176, 0, 0.05)']}
            style={styles.warningCard}>
            <View style={styles.warningContent}>
              <AlertTriangle size={42} color="#FFB800" style={styles.warningIcon} />
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningTitle}>SECURITY WARNING</Text>
                <Text style={styles.warningText}>
                  Anyone with these words can access the funds in your wallet.
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View> */}

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <PrimaryActionButton
            title="I've Saved My Phrase"
            onPress={() => {
              alert(
                'Security Reminder',
                'Never share your seed phrase with anyone. Anyone who has your seed phrase can access your funds.',
              );
              onNext();
            }}
            disabled={isLoading}
            loading={isLoading}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    // UnsafeScreenContainer provides flex: 1 and backgroundColor
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
    justifyContent: 'space-between',
  },
  seedPhraseContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: verticalScale(10),
    maxHeight: '50%',
  },
  buttonContainer: {
    flex: 0,
    paddingTop: verticalScale(20),
    minHeight: '15%',
    justifyContent: 'flex-end',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? verticalScale(50) : verticalScale(20),
    right: scale(20),
    zIndex: 1000,
    backgroundColor: '#FFB800',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#121212',
  },
});

export default ShowMnemonicStep;
