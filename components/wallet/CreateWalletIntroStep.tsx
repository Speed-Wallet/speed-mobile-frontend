import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Download, Zap } from 'lucide-react-native';
import GradientBackground from '@/components/GradientBackground';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import colors from '@/constants/colors';
import 'react-native-get-random-values';

interface CreateWalletIntroStepProps {
  onCreateWallet: () => void;
  onImportWallet?: () => void;
  isLoading: boolean;
}

export default function CreateWalletIntroStep({
  onCreateWallet,
  onImportWallet,
  isLoading,
}: CreateWalletIntroStepProps) {
  const router = useRouter();
  useFrameworkReady();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
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
    <SafeAreaView style={styles.container}>
      {/* <GradientBackground /> */}

      <View style={styles.content}>
        {/* Logo with Glow Effect */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateY }],
            },
          ]}
        >
          <View style={styles.logoWrapper}>
            <LinearGradient
              colors={['#22d3ee', '#06b6d4']}
              style={styles.logoCircle}
            >
              <Zap
                size={scale(80)}
                color="#0f172a"
                strokeWidth={2.5}
                fill="#0f172a"
              />
            </LinearGradient>

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
                colors={['#22d3ee', '#06b6d4']}
                style={styles.glowGradient}
              />
            </Animated.View>
          </View>

          {/* Info Text */}
          <Text style={styles.infoText}>
            Start using Speed Wallet to swap, send, receive, and spend
            instantly.
          </Text>
        </Animated.View>
      </View>

      {/* Action Buttons */}
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
          onPress={onCreateWallet}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#22d3ee', '#06b6d4']}
            style={styles.primaryButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Plus size={scale(20)} color="#0f172a" strokeWidth={2.5} />
            <Text style={styles.primaryButtonText}>Create new wallet</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            if (onImportWallet) {
              onImportWallet();
            }
          }}
          activeOpacity={0.8}
        >
          <Download size={scale(20)} color="#22d3ee" strokeWidth={2.5} />
          <Text style={styles.secondaryButtonText}>Import wallet</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
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
    elevation: 20,
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
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
    // paddingBottom:
    // Platform.OS === 'ios' ? verticalScale(34) : verticalScale(24),
    paddingTop: verticalScale(20),
  },
  primaryButton: {
    width: '100%',
    marginBottom: verticalScale(16),
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
  secondaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(24),
    borderRadius: scale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    gap: scale(12),
    marginBottom: verticalScale(16),
  },
  secondaryButtonText: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#22d3ee',
  },
});
