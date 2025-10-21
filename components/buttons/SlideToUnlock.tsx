import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - scale(40);
const THUMB_SIZE = scale(55);
const THUMB_MARGIN = scale(5);
const SLIDER_HEIGHT = THUMB_SIZE + THUMB_MARGIN * 2;
const SLIDER_TRACK_WIDTH = SLIDER_WIDTH - THUMB_SIZE - THUMB_MARGIN * 2;

interface SlideToUnlockProps {
  onUnlock: () => void;
  text?: string;
}

const SlideToUnlock: React.FC<SlideToUnlockProps> = ({
  onUnlock,
  text = 'Slide to get started',
}) => {
  const pan = useRef(new Animated.Value(0)).current;
  const [isUnlocked, setIsUnlocked] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => !isUnlocked,
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > SLIDER_TRACK_WIDTH * 0.8) {
          // Successfully slid to unlock
          Animated.timing(pan, {
            toValue: SLIDER_TRACK_WIDTH,
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            setIsUnlocked(true);
            setTimeout(onUnlock, 300);
          });
        } else {
          // Reset to start
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx >= 0 && gestureState.dx <= SLIDER_TRACK_WIDTH) {
          pan.setValue(gestureState.dx);
        }
      },
    }),
  ).current;

  const thumbOpacity = pan.interpolate({
    inputRange: [0, SLIDER_TRACK_WIDTH],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const textOpacity = pan.interpolate({
    inputRange: [0, SLIDER_TRACK_WIDTH * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderTrack}>
        <Animated.Text style={[styles.sliderText, { opacity: textOpacity }]}>
          {text}
        </Animated.Text>
        <Animated.View
          style={[
            styles.sliderThumb,
            {
              transform: [{ translateX: pan }],
              opacity: thumbOpacity,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <ArrowRight size={scale(26)} color="#CCCCCC" strokeWidth={2} />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    width: SLIDER_WIDTH,
  },
  sliderTrack: {
    height: SLIDER_HEIGHT,
    backgroundColor: '#00CFFF',
    borderRadius: verticalScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 10,
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sliderText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#121212',
    fontFamily: 'Inter-SemiBold',
  },
  sliderThumb: {
    position: 'absolute',
    left: THUMB_MARGIN,
    top: THUMB_MARGIN,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: '#121212',
    borderRadius: scale(25),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default SlideToUnlock;
