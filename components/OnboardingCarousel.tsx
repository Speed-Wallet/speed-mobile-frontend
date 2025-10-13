import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TrendingUp,
  CreditCard,
  Rocket,
  User,
  MessageCircle,
  Activity,
} from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import UnsafeScreenContainer from '@/components/UnsafeScreenContainer';
import ScreenContainer from '@/components/ScreenContainer';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingCarouselProps {
  onComplete: () => void;
}

interface CarouselItem {
  id: number;
  icon: any;
  title: string;
  description: string;
}

const carouselItems: CarouselItem[] = [
  {
    id: 1,
    icon: TrendingUp,
    title: 'Buy, Send, Receive & Swap',
    description: 'Do more with your crypto in the real world on chain',
  },
  {
    id: 2,
    icon: CreditCard,
    title: 'Create Virtual Cards',
    description: 'Create a virtual card and top up in crypto to spend globally',
  },
  {
    id: 3,
    icon: Rocket,
    title: 'Swap Tokens & Stocks',
    description: 'Swap between tokens and stocks on the Solana blockchain',
  },
];

const CarouselItemComponent = ({ item }: { item: CarouselItem }) => {
  const IconComponent = item.icon;

  return (
    <View style={styles.carouselItem}>
      <View style={styles.iconContainer}>
        <IconComponent size={scale(32)} color="#00CFFF" />
      </View>
      <Text style={styles.carouselTitle}>{item.title}</Text>
      <Text style={styles.carouselDescription}>{item.description}</Text>
    </View>
  );
};

const CarouselDots = ({
  currentIndex,
  total,
}: {
  currentIndex: number;
  total: number;
}) => (
  <View style={styles.carouselDotsContainer}>
    {Array.from({ length: total }, (_, index) => (
      <View
        key={index}
        style={[
          styles.carouselDot,
          index === currentIndex && styles.carouselDotActive,
        ]}
      />
    ))}
  </View>
);

export default function OnboardingCarousel({
  onComplete,
}: OnboardingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Auto-scroll carousel
  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % carouselItems.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(timer);
  }, [currentIndex]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <UnsafeScreenContainer style={styles.container}>
      {/* Linear gradient background */}
      <LinearGradient
        colors={['#009FCC', '#0d2a35', '#0A0A0A']}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appNameText}>Speed Wallet</Text>
        </View>

        {/* Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={carouselItems}
            renderItem={({ item }) => <CarouselItemComponent item={item} />}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false },
            )}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            scrollEventThrottle={16}
            getItemLayout={(data, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
          />
        </View>

        <CarouselDots
          currentIndex={currentIndex}
          total={carouselItems.length}
        />

        {/* Get Started Button */}
        <TouchableOpacity style={styles.getStartedButton} onPress={onComplete}>
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </UnsafeScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(40),
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(40),
    paddingHorizontal: scale(24),
  },
  welcomeText: {
    fontSize: moderateScale(28),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: verticalScale(4),
  },
  appNameText: {
    fontSize: moderateScale(32),
    fontWeight: 'bold',
    color: '#00CFFF',
    textAlign: 'center',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  carouselItem: {
    width: screenWidth,
    paddingHorizontal: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: 'rgba(0, 207, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  carouselTitle: {
    fontSize: moderateScale(22),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: verticalScale(12),
  },
  carouselDescription: {
    fontSize: moderateScale(15),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: moderateScale(22),
  },
  carouselDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: verticalScale(16),
  },
  carouselDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: scale(4),
  },
  carouselDotActive: {
    backgroundColor: '#00CFFF',
    width: scale(24),
  },
  getStartedButton: {
    backgroundColor: '#00CFFF',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(32),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(32),
    marginHorizontal: scale(24),
  },
  getStartedText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#000000',
  },
});
