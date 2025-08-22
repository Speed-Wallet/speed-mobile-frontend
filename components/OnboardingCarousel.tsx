import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Rocket,
} from 'lucide-react-native';
import colors from '@/constants/colors';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingCarouselProps {
  onComplete: () => void;
}

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  icon: 'chart' | 'card' | 'rocket';
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'BUY, SPEND,\nRECEIVE & SWAP',
    subtitle: 'Do more with your crypto in the real\nworld on chain',
    icon: 'chart',
  },
  {
    id: 2,
    title: 'CREATE A\nVIRTUAL CARD',
    subtitle: 'Create a virtual card and top up in\ncrypto to spend globally',
    icon: 'card',
  },
  {
    id: 3,
    title: 'SWAP ANY SOL\nTOKEN',
    subtitle: 'Swap between any token on the\nSOLANA Chain',
    icon: 'rocket',
  },
];

const OrbitalDesign = ({ icon }: { icon: 'chart' | 'card' | 'rocket' }) => {
  const renderIcon = () => {
    const iconProps = { size: 50, color: '#FFFFFF', strokeWidth: 2.5 };

    switch (icon) {
      case 'chart':
        return <TrendingUp {...iconProps} />;
      case 'card':
        return <CreditCard {...iconProps} />;
      case 'rocket':
        return <Rocket {...iconProps} />;
      default:
        return <TrendingUp {...iconProps} />;
    }
  };

  return (
    <View style={styles.orbitalContainer}>
      <Svg
        height="400"
        width="400"
        viewBox="0 0 400 400"
        style={styles.orbitalSvg}
      >
        {/* Main orbital circle */}
        <Circle
          cx="200"
          cy="200"
          r="160"
          stroke="#00CFFF"
          strokeWidth="1.5"
          fill="none"
          strokeOpacity="0.6"
        />

        {/* Small orbital dots */}
        <Circle cx="360" cy="200" r="16" fill="#00CFFF" opacity="0.8" />
        <Circle cx="40" cy="200" r="12" fill="#4a90e2" opacity="0.6" />
      </Svg>

      {/* Central icon circle */}
      <View style={styles.centralIcon}>{renderIcon()}</View>
    </View>
  );
};

const NavigationDots = ({
  currentSlide,
  totalSlides,
}: {
  currentSlide: number;
  totalSlides: number;
}) => (
  <View style={styles.dotsContainer}>
    {Array.from({ length: totalSlides }, (_, index) => (
      <View
        key={index}
        style={[styles.dot, index === currentSlide && styles.activeDot]}
      />
    ))}
  </View>
);

export default function OnboardingCarousel({
  onComplete,
}: OnboardingCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  const animateToSlide = (
    slideIndex: number,
    direction: 'left' | 'right' = 'right',
  ) => {
    if (slideIndex < 0 || slideIndex >= slides.length || isAnimating) return;

    setIsAnimating(true);

    // Animate out current screen
    const exitValue = direction === 'right' ? -screenWidth : screenWidth;

    Animated.timing(slideAnim, {
      toValue: exitValue,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Update slide and reset position for entrance
      setCurrentSlide(slideIndex);
      const entryValue = direction === 'right' ? screenWidth : -screenWidth;
      slideAnim.setValue(entryValue);

      // Animate in new screen
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
      });
    });
  };

  const goToNextSlide = () => {
    if (currentSlide === slides.length - 1) {
      onComplete();
    } else {
      animateToSlide(currentSlide + 1, 'right');
    }
  };

  const goToPrevSlide = () => {
    if (currentSlide > 0) {
      animateToSlide(currentSlide - 1, 'left');
    }
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return (
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        Math.abs(gestureState.dx) > 10 &&
        !isAnimating
      );
    },
    onPanResponderMove: (_, gestureState) => {
      if (!isAnimating) {
        slideAnim.setValue(gestureState.dx);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (isAnimating) return;

      const threshold = screenWidth * 0.25;

      if (gestureState.dx > threshold && currentSlide > 0) {
        goToPrevSlide();
      } else if (
        gestureState.dx < -threshold &&
        currentSlide < slides.length - 1
      ) {
        goToNextSlide();
      } else if (
        gestureState.dx < -threshold &&
        currentSlide === slides.length - 1
      ) {
        onComplete();
      } else {
        // Snap back to center
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const currentSlideData = slides[currentSlide];

  return (
    <SafeAreaView style={styles.container}>
      {/* Linear gradient background */}
      <LinearGradient
        colors={['#009FCC', '#0d2a35', '#0A0A0A']}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <OrbitalDesign icon={currentSlideData.icon} />

        <View style={styles.textContainer}>
          <Text style={styles.title}>{currentSlideData.title}</Text>
          <Text style={styles.subtitle}>{currentSlideData.subtitle}</Text>
        </View>
      </Animated.View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            (currentSlide === 0 || isAnimating) && styles.navButtonDisabled,
          ]}
          onPress={goToPrevSlide}
          disabled={currentSlide === 0 || isAnimating}
        >
          <ChevronLeft
            size={24}
            color={currentSlide === 0 || isAnimating ? '#666' : '#CCCCCC'}
          />
        </TouchableOpacity>

        <NavigationDots
          currentSlide={currentSlide}
          totalSlides={slides.length}
        />

        <TouchableOpacity
          style={[styles.navButton, isAnimating && styles.navButtonDisabled]}
          onPress={goToNextSlide}
          disabled={isAnimating}
        >
          <ChevronRight size={24} color={isAnimating ? '#666' : '#CCCCCC'} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  orbitalContainer: {
    position: 'relative',
    width: 400,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 80,
  },
  orbitalSvg: {
    position: 'absolute',
  },
  centralIcon: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#00CFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#00CFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00CFFF',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  navButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#00CFFF',
    width: 24,
    borderRadius: 4,
  },
});
