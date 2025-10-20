import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Keyboard, Platform } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import colors from '@/constants/colors';
import ScreenContainer from '@/components/ScreenContainer';
import { Edge } from 'react-native-safe-area-context';
import { verticalScale } from 'react-native-size-matters';

interface BottomActionContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  translateY?: SharedValue<number>;
  avoidKeyboard?: boolean;
  edges?: Edge[];
}

const BottomActionContainer: React.FC<BottomActionContainerProps> = ({
  children,
  style,
  translateY,
  avoidKeyboard = false,
  edges = [],
}) => {
  const keyboardOffset = useSharedValue(0);

  useEffect(() => {
    if (!avoidKeyboard) return;

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        keyboardOffset.value = withTiming(-e.endCoordinates.height, {
          duration: Platform.OS === 'ios' ? 250 : 200,
        });
      },
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        keyboardOffset.value = withTiming(0, {
          duration: Platform.OS === 'ios' ? 250 : 200,
        });
      },
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [avoidKeyboard]);

  const animatedStyle = useAnimatedStyle(() => {
    const baseTransform = translateY ? [{ translateY: translateY.value }] : [];
    const keyboardTransform = avoidKeyboard
      ? [{ translateY: keyboardOffset.value }]
      : [];

    return {
      transform: [...baseTransform, ...keyboardTransform],
    };
  });

  const Container = translateY || avoidKeyboard ? Animated.View : View;

  return (
    <Container
      style={[
        styles.container,
        style,
        (translateY || avoidKeyboard) && animatedStyle,
      ]}
    >
      <ScreenContainer edges={edges}>{children}</ScreenContainer>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.backgroundDark,
    padding: verticalScale(16),
    // borderTopWidth: 0.5,
    // borderTopColor: colors.backgroundLight,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: -2 },
    // shadowOpacity: 0.15,
    // shadowRadius: 8,
    // elevation: 5,
  },
});

export default BottomActionContainer;
