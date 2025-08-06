import React, { useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Lock, Shield } from 'lucide-react-native';
import PinInputCard from './PinInputCard';
import ScreenContainer from '@/components/ScreenContainer';
import BackButton from '@/components/BackButton';
import NumericKeyboard from '@/components/NumericKeyboard';

interface CreatePinStepProps {
  pin: string;
  onPinChange: (pin: string) => void;
  onNext: () => void;
  onBack?: () => void;
  isLoading: boolean;
}

const CreatePinStep: React.FC<CreatePinStepProps> = ({
  pin,
  onPinChange,
  onNext,
  onBack,
  isLoading,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === 'backspace') {
        onPinChange(pin.slice(0, -1));
      } else if (key >= '0' && key <= '9' && pin.length < 4) {
        onPinChange(pin + key);
      }
    },
    [pin, onPinChange],
  );

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
    <ScreenContainer>
      {/* Development Back Button */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' && onBack && (
        <BackButton onPress={onBack} style={styles.devBackButton} />
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
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[
                  'rgba(124, 92, 255, 0.15)',
                  'rgba(124, 92, 255, 0.05)',
                ]}
                style={styles.iconBadge}
              >
                <Lock size={24} color="#7c5cff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Create Your PIN</Text>
            <Text style={styles.subtitle}>
              Choose a 4-digit PIN to quickly access your wallet. Make it
              memorable but secure.
            </Text>
          </View>
        </Animated.View>

        {/* PIN Input Card */}
        <Animated.View
          style={[
            styles.pinContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <PinInputCard
            pin={pin}
            onPinChange={onPinChange}
            headerIcon={<Shield size={20} color="#7c5cff" />}
            headerText="Security PIN"
            instruction={{
              empty: 'Use the keypad below to enter PIN',
              incomplete: '{count} more digits',
              complete: 'PIN complete',
            }}
          />
        </Animated.View>

        {/* Bottom Section - Keyboard and Button */}
        <View style={styles.bottomSection}>
          {/* Numeric Keyboard */}
          <NumericKeyboard onKeyPress={handleKeyPress} />

          {/* Action Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                pin.length < 4 && styles.continueButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={onNext}
              disabled={isLoading || pin.length < 4}
            >
              <LinearGradient
                colors={
                  pin.length === 4
                    ? ['#7c5cff', '#6446fe']
                    : ['#4a4a4a', '#3a3a3a']
                }
                style={styles.buttonGradient}
              >
                <Text
                  style={[
                    styles.buttonText,
                    pin.length < 4 && styles.buttonTextDisabled,
                  ]}
                >
                  {isLoading ? 'Creating...' : 'Continue'}
                </Text>
                <ArrowRight
                  size={20}
                  color={pin.length === 4 ? '#fff' : '#9ca3af'}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  devBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 1000,
    backgroundColor: '#FFB800',
    borderRadius: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    marginBottom: 32,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  pinContainer: {
    marginBottom: 24,
  },
  pinCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  pinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    justifyContent: 'space-between',
  },
  pinHeaderText: {
    color: '#7c5cff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.5,
    flex: 1,
  },
  visibilityButton: {
    padding: 8,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // marginBottom: 20,
  },
  pinInputArea: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7c5cff',
  },
  pinInputAreaFocused: {
    borderColor: 'rgba(124, 92, 255, 0.3)',
    backgroundColor: 'rgba(124, 92, 255, 0.05)',
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: '#7c5cff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDotFilled: {
    backgroundColor: '#7c5cff',
    borderColor: '#7c5cff',
  },
  pinDigit: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    fontSize: 16,
    textAlign: 'center',
  },
  pinInstruction: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  securityNote: {
    marginBottom: 32,
  },
  securityCard: {
    borderRadius: 12,
    padding: 16,
  },
  securityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityText: {
    flex: 1,
    color: '#7c5cff',
    fontSize: 14,
    marginLeft: 12,
    opacity: 0.9,
  },
  bottomSection: {
    marginTop: 'auto',
  },
  buttonContainer: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  continueButton: {
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  buttonTextDisabled: {
    color: '#9ca3af',
  },
});

export default CreatePinStep;
