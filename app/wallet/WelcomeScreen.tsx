import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import colors from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 40;
const SLIDER_HEIGHT = 60;
const THUMB_SIZE = 50;
const SLIDER_TRACK_WIDTH = SLIDER_WIDTH - THUMB_SIZE;

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

const WaveBackground = () => {
  return (
    <View style={styles.waveContainer}>
      <Svg
        height="100%"
        width="100%"
        viewBox="0 0 375 812"
        style={styles.waveBackground}
      >
        {/* Diagonal flowing lines from bottom left to top right - 3 lines with spacing */}
        <Path
          d="M-50,650 C50,550 100,450 150,350 C200,250 250,150 375,50"
          stroke="#00CFFF"
          strokeWidth="2"
          fill="none"
          strokeOpacity="0.6"
        />
        <Path
          d="M-120,780 C0,660 60,550 120,450 C180,350 240,250 375,150"
          stroke="#4a90e2"
          strokeWidth="1.5"
          fill="none"
          strokeOpacity="0.5"
        />
        <Path
          d="M-190,910 C-60,770 0,660 80,540 C140,440 200,340 375,280"
          stroke="#00CFFF"
          strokeWidth="1.5"
          fill="none"
          strokeOpacity="0.4"
        />
      </Svg>
    </View>
  );
};

const SlideToUnlock = ({ onUnlock }: { onUnlock: () => void }) => {
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
          Slide to get started
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
          <ArrowRight size={24} color="#E5E5E5" strokeWidth={2} />
        </Animated.View>
      </View>
    </View>
  );
};

const SpeedLogo = () => (
  <View style={styles.logoContainer}>
    <View style={styles.logoCircle}>
      <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <Path
          d="M8 12L22 4L32 12L24 28L16 20L8 28V12Z"
          fill="#121212"
          stroke="none"
        />
      </Svg>
    </View>
  </View>
);

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <WaveBackground />

      <View style={styles.content}>
        <SpeedLogo />

        <View style={styles.textContainer}>
          <Text style={styles.title}>SPEED WALLET</Text>
          <Text style={styles.subtitle}>
            Have control of your crypto, trusted{'\n'}secure and decentralised
          </Text>
        </View>
      </View>

      <View style={styles.sliderWrapper}>
        <SlideToUnlock onUnlock={onGetStarted} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  waveContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  waveBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#00CFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  textContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: -100,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: '#00CFFF',
    fontFamily: 'Inter-Bold',
    letterSpacing: 2,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    opacity: 0.8,
  },
  sliderWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
  },
  sliderTrack: {
    height: SLIDER_HEIGHT,
    backgroundColor: '#00CFFF',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sliderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#121212',
    fontFamily: 'Inter-SemiBold',
  },
  sliderThumb: {
    position: 'absolute',
    left: 5,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: '#121212',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  arrowText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
  },
});
