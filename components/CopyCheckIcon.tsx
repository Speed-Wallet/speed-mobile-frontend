import React, { useEffect } from 'react';
import { Copy, CopyCheck } from 'lucide-react-native';
import { scale } from 'react-native-size-matters';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withSequence,
} from 'react-native-reanimated';
import colors from '@/constants/colors';

interface CopyCheckIconProps {
  copied: boolean;
  size?: number;
  color?: string;
}

const CopyCheckIcon: React.FC<CopyCheckIconProps> = ({
  copied,
  size = scale(18),
  color = colors.textPrimary,
}) => {
  const scale_value = useSharedValue(1);

  // Animate when copied state changes
  useEffect(() => {
    if (copied) {
      scale_value.value = withSequence(
        withTiming(1.1, { duration: 150 }),
        withTiming(1, { duration: 150 }),
      );
    }
  }, [copied]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale_value.value }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      {copied ? (
        <CopyCheck size={size} color={color} />
      ) : (
        <Copy size={size} color={color} />
      )}
    </Animated.View>
  );
};

export default CopyCheckIcon;
