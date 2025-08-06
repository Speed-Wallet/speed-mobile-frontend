import { Animated } from 'react-native';

/**
 * Triggers a shake animation for UI feedback when user tries to interact with disabled elements
 * @param shakeAnimationValue - Animated.Value to control the shake animation
 */
export function triggerShake(shakeAnimationValue: Animated.Value) {
  shakeAnimationValue.setValue(0);
  Animated.sequence([
    Animated.timing(shakeAnimationValue, {
      toValue: 10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(shakeAnimationValue, {
      toValue: -10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(shakeAnimationValue, {
      toValue: 10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(shakeAnimationValue, {
      toValue: 0,
      duration: 50,
      useNativeDriver: true,
    }),
  ]).start();
}
