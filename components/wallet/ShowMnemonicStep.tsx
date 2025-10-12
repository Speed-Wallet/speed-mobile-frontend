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
    <UnsafeScreenContainer style={styles.container}>
      {/* Dev Mode Skip Button */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' && (
        <TouchableOpacity style={styles.skipButton} onPress={onNext}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.headerContent}>
            {/* <LinearGradient
              colors={['rgba(124, 92, 255, 0.15)', 'rgba(124, 92, 255, 0.05)']}
              style={styles.headerBadge}>
              <ShieldCheck size={20} color="#00CFFF" />
              <Text style={styles.headerBadgeText}>SECURE BACKUP</Text>
            </LinearGradient> */}
            <Text style={styles.title}>Your Seed Phrase</Text>
            <Text style={styles.subtitle}>
              Write down these 12 words in order and keep them in a safe place.
              Never share them with anyone.{' '}
              <Text style={{ fontWeight: 'bold', color: '#d1d5db' }}>
                Anyone with these words can access the funds in your wallet.
              </Text>
            </Text>
          </View>
        </Animated.View>

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
            onPress={onNext}
            disabled={isLoading}
            loading={isLoading}
          />
        </View>
      </View>
    </UnsafeScreenContainer>
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
  header: {
    paddingTop: Platform.OS === 'ios' ? verticalScale(10) : verticalScale(20),
    flex: 0,
    minHeight: '25%',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  headerBadgeText: {
    color: '#00CFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: verticalScale(8),
    textAlign: 'left',
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: '#9ca3af',
    textAlign: 'left',
    lineHeight: moderateScale(22),
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
    paddingBottom:
      Platform.OS === 'ios' ? verticalScale(34) : verticalScale(24),
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
