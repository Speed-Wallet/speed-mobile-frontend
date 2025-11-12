import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { verticalScale, moderateScale } from 'react-native-size-matters';
import CircularNumericKeyboard from '@/components/keyboard/CircularNumericKeyboard';
import PinDots from '@/components/PinDots';
import colors from '@/constants/colors';

interface PinInputSectionProps {
  title: string;
  pin: string;
  onKeyPress: (key: string) => void;
  maxLength?: number;
  subtitle?: string;
  shakeAnimation?: any; // Animated.Value for shake effect
  showForgot?: boolean;
  onForgotPress?: () => void;
  isValidating?: boolean;
}

const PinInputSection: React.FC<PinInputSectionProps> = ({
  title,
  pin,
  onKeyPress,
  maxLength = 6,
  subtitle,
  shakeAnimation,
  showForgot = false,
  onForgotPress,
  isValidating = false,
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
    <View style={styles.container}>
      {/* Centered Title and Pin Dots */}
      <Animated.View
        style={[
          styles.centerSection,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Title with optional Loading Spinner */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {isValidating && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.spinner}
              />
            )}
          </View>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </Animated.View>

        <Animated.View
          style={[
            styles.pinDotsContainer,
            shakeAnimation && { transform: [{ translateX: shakeAnimation }] },
          ]}
        >
          <PinDots pinLength={pin.length} maxLength={maxLength} />
        </Animated.View>
      </Animated.View>

      {/* Keyboard at Bottom */}
      <Animated.View
        style={[
          styles.keyboardSection,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <CircularNumericKeyboard
          onKeyPress={onKeyPress}
          showForgot={showForgot}
          onForgotPress={onForgotPress}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  spinner: {
    marginLeft: 8,
  },
  subtitle: {
    fontSize: moderateScale(16),
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: verticalScale(8),
  },
  pinDotsContainer: {
    // marginBottom: 24,
    alignItems: 'center',
  },
  keyboardSection: {
    alignItems: 'center',
    paddingBottom: moderateScale(5, 20),
  },
});

export default PinInputSection;
