import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { verticalScale, moderateScale } from 'react-native-size-matters';
import CircularNumericKeyboard from '@/components/keyboard/CircularNumericKeyboard';
import PinDots from '@/components/PinDots';

interface PinInputSectionProps {
  title: string;
  pin: string;
  onKeyPress: (key: string) => void;
  maxLength?: number;
  subtitle?: string;
  shakeAnimation?: any; // Animated.Value for shake effect
}

const PinInputSection: React.FC<PinInputSectionProps> = ({
  title,
  pin,
  onKeyPress,
  maxLength = 6,
  subtitle,
  shakeAnimation,
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
    <Animated.View
      style={[
        styles.centerSection,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.titleContainer,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={styles.title}>{title}</Text>
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

      <CircularNumericKeyboard onKeyPress={onKeyPress} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: moderateScale(16),
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: verticalScale(8),
  },
  pinDotsContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
});

export default PinInputSection;
