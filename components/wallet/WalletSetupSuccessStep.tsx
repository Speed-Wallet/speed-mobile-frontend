import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { CheckCircle, ArrowRight } from 'lucide-react-native';
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
      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY }],
            },
          ]}
        >
          <View style={styles.iconBackground}>
            <CheckCircle size={64} color="#00CFFF" />
          </View>
        </Animated.View>

        {/* Success Message */}
        <Animated.View
          style={[
            styles.messageContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}
        >
          <Text style={styles.title}>Wallet Created Successfully!</Text>
          <Text style={styles.subtitle}>
            Welcome <Text style={styles.username}>{username}</Text>! Your wallet
            has been created and secured with a PIN. Keep your seed phrase and
            PIN safe!
          </Text>
        </Animated.View>

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
            style={styles.continueButton}
            activeOpacity={0.8}
            onPress={onComplete}
          >
            <View style={styles.buttonBackground}>
              <Text style={styles.buttonText}>Get Started</Text>
              <ArrowRight size={20} color="#000000" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 120 : 140,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 207, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 207, 255, 0.3)',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  username: {
    fontWeight: '700',
    color: '#ffffff',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    left: 24,
    right: 24,
  },
  continueButton: {
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
  },
  buttonBackground: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00CFFF',
    gap: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
});

export default WalletSetupSuccessStep;
