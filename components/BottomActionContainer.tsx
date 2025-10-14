import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import colors from '@/constants/colors';
import ScreenContainer from '@/components/ScreenContainer';

interface BottomActionContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  translateY?: SharedValue<number>;
}

const BottomActionContainer: React.FC<BottomActionContainerProps> = ({
  children,
  style,
  translateY,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    if (!translateY) return {};
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const Container = translateY ? Animated.View : View;

  return (
    <Container style={[styles.container, style, translateY && animatedStyle]}>
      <ScreenContainer edges={['bottom']} style={{ padding: 16 }}>
        {children}
      </ScreenContainer>
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
