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
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import colors from '@/constants/colors';
import SpeedLogo from '@/components/SpeedLogo';

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
        <Defs>
          {/* Gradient from teal to purple */}
          <LinearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00CFFF" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
          </LinearGradient>
          <LinearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00CFFF" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#A855F7" stopOpacity="0.5" />
          </LinearGradient>
          <LinearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00CFFF" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#9333EA" stopOpacity="0.4" />
          </LinearGradient>
          <LinearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00CFFF" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#7C3AED" stopOpacity="0.3" />
          </LinearGradient>
          <LinearGradient id="gradient5" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00CFFF" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.5" />
          </LinearGradient>
        </Defs>

        {/* Diagonal flowing lines from bottom left to top right - 5 lines with 200 unit separation */}
        <Path
          d="M-50,350 C50,250 100,150 150,50 C200,-50 250,-150 375,-250"
          stroke="url(#gradient1)"
          strokeWidth="1.5"
          fill="none"
        />
        <Path
          d="M-50,550 C50,450 100,350 150,250 C200,150 250,50 375,-50"
          stroke="url(#gradient2)"
          strokeWidth="2"
          fill="none"
        />
        <Path
          d="M-50,750 C50,650 100,550 150,450 C200,350 250,250 375,150"
          stroke="url(#gradient3)"
          strokeWidth="1.5"
          fill="none"
        />
        <Path
          d="M-50,950 C50,850 100,750 150,650 C200,550 250,450 375,350"
          stroke="url(#gradient4)"
          strokeWidth="1.5"
          fill="none"
        />
        <Path
          d="M-50,1150 C50,1050 100,950 150,850 C200,750 250,650 375,550"
          stroke="url(#gradient5)"
          strokeWidth="1.5"
          fill="none"
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
          <ArrowRight size={24} color="#CCCCCC" strokeWidth={2} />
        </Animated.View>
      </View>
    </View>
  );
};

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <WaveBackground />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <SpeedLogo size={150} />
        </View>

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
