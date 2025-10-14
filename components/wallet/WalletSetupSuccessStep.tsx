import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { CheckCircle, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import GradientBackground from '@/components/GradientBackground';
import 'react-native-get-random-values';
import ScreenContainer from '@/components/ScreenContainer';

interface WalletSetupSuccessStepProps {
  onComplete: () => void;
  username: string;
}

const WalletSetupSuccessStep: React.FC<WalletSetupSuccessStepProps> = ({
  onComplete,
  username,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = useCallback(() => {
    setIsLoading(true);
    requestAnimationFrame(() => {
      onComplete();
    });
  }, [onComplete]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Pulsing animation for the glow
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <GradientBackground />
      <ScreenContainer edges={['bottom']} backgroundColor="transparent">
        <View style={styles.content}>
          {/* Success Icon with Glow Effect */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateY }, { scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.logoWrapper}>
              <View style={styles.logoCircle}>
                <View style={styles.outerRing} />
                <CheckCircle
                  size={scale(80)}
                  color="#34d399"
                  strokeWidth={3}
                  fill="none"
                />
              </View>

              {/* Glow effect */}
              <Animated.View
                style={[
                  styles.glowEffect,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.glowGradient}
                />
              </Animated.View>
            </View>

            {/* Success Message */}
            <Text style={styles.title}>Wallet Created Successfully!</Text>
            <Text style={styles.subtitle}>
              Welcome <Text style={styles.username}>{username}</Text>! Your
              wallet has been created and secured with a PIN.
            </Text>
            <Text style={styles.infoText}>
              Keep your seed phrase and PIN safe!
            </Text>
          </Animated.View>
        </View>

        {/* Continue Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleComplete}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#22d3ee', '#06b6d4']}
              style={styles.primaryButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#0f172a" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    Continue to Wallet
                  </Text>
                  <ArrowRight
                    size={scale(20)}
                    color="#0f172a"
                    strokeWidth={2.5}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(40),
  },
  logoCircle: {
    width: scale(160),
    height: scale(160),
    borderRadius: scale(80),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    elevation: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  outerRing: {
    position: 'absolute',
    width: scale(160),
    height: scale(160),
    borderRadius: scale(80),
    borderWidth: 5,
    borderColor: 'rgba(16, 185, 129, 0.6)',
  },
  glowEffect: {
    position: 'absolute',
    width: scale(160),
    height: scale(160),
    borderRadius: scale(80),
    zIndex: -1,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: scale(80),
    opacity: 0.5,
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: verticalScale(16),
    paddingHorizontal: scale(16),
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: moderateScale(24),
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(12),
  },
  username: {
    fontWeight: '700',
    color: '#22d3ee',
  },
  infoText: {
    fontSize: moderateScale(14),
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: moderateScale(22),
    paddingHorizontal: scale(16),
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: scale(24),
    paddingBottom:
      Platform.OS === 'ios' ? verticalScale(34) : verticalScale(24),
    paddingTop: verticalScale(20),
  },
  primaryButton: {
    width: '100%',
    borderRadius: scale(16),
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(24),
    gap: scale(12),
  },
  primaryButtonText: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#0f172a',
  },
});

export default WalletSetupSuccessStep;
