import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scale, verticalScale } from 'react-native-size-matters';
import { TokenItemMarket } from '@/components/token-items';
import ScreenContainer from '@/components/ScreenContainer';
import TabScreenHeader from '@/components/TabScreenHeader';
import MarketFilterRow from '@/components/MarketFilterRow';
import {
  useTopTradedTokens,
  useTrendingTokens,
} from '@/services/jupiterService';
import { JupiterToken } from '@/types/jupiter';
import { useTabBarVisibility } from '@/contexts/TabBarVisibilityContext';

type CategoryOption = 'top' | 'trending';
type SortMetric = 'price' | 'volume' | 'organicScore' | 'liquidity';

export default function MarketScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryOption>('top');
  const [sortMetric, setSortMetric] = useState<SortMetric>('price');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const { hideTabBar, showTabBar } = useTabBarVisibility();

  // Scroll tracking
  const scrollY = useRef(0);
  const lastScrollY = useRef(0);
  const filterBarTranslateY = useSharedValue(0);
  const barsHidden = useRef(false); // Track bar visibility to avoid redundant updates

  // Fetch Jupiter data
  const { data: topTradedTokens, isLoading: isLoadingTop } =
    useTopTradedTokens(20);
  const { data: trendingTokens, isLoading: isLoadingTrending } =
    useTrendingTokens(20);

  // Get current data based on selected category
  const currentData = useMemo(() => {
    if (category === 'top' && topTradedTokens) {
      return topTradedTokens;
    } else if (category === 'trending' && trendingTokens) {
      return trendingTokens;
    }
    return [];
  }, [category, topTradedTokens, trendingTokens]);

  // Sort data
  const sortedData = useMemo(() => {
    let sorted = [...currentData];

    // Sort based on selected metric
    if (sorted.length > 0) {
      sorted.sort((a, b) => {
        const tokenA = a as JupiterToken;
        const tokenB = b as JupiterToken;

        switch (sortMetric) {
          case 'price':
            return (tokenB.usdPrice || 0) - (tokenA.usdPrice || 0);
          case 'volume':
            return (
              (tokenB.stats24h?.buyVolume + tokenB.stats24h?.sellVolume || 0) -
              (tokenA.stats24h?.buyVolume + tokenA.stats24h?.sellVolume || 0)
            );
          case 'organicScore':
            return (tokenB.organicScore || 0) - (tokenA.organicScore || 0);
          case 'liquidity':
            return (tokenB.liquidity || 0) - (tokenA.liquidity || 0);
          default:
            return 0;
        }
      });
    }

    return sorted;
  }, [currentData, sortMetric, category]);

  // Handle scroll with debounce/threshold - memoized for performance
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const scrollDiff = currentScrollY - lastScrollY.current;

      // Only trigger if scrolled more than 10 pixels to reduce state updates
      if (Math.abs(scrollDiff) > 10) {
        if (scrollDiff > 0 && currentScrollY > 50) {
          // Scrolling down - hide bars and close dropdown
          if (!barsHidden.current) {
            setShowSortDropdown(false);
            filterBarTranslateY.value = withTiming(200, { duration: 300 });
            hideTabBar();
            barsHidden.current = true;
          }
        } else if (scrollDiff < 0) {
          // Scrolling up - show bars
          if (barsHidden.current) {
            filterBarTranslateY.value = withTiming(0, { duration: 300 });
            showTabBar();
            barsHidden.current = false;
          }
        }
        lastScrollY.current = currentScrollY;
      }
    },
    [hideTabBar, showTabBar, filterBarTranslateY],
  );

  const handleCategoryChange = (newCategory: CategoryOption) => {
    setCategory(newCategory);
    setShowSortDropdown(false);
  };

  const handleSortMetricChange = (metric: SortMetric) => {
    setSortMetric(metric);
    setShowSortDropdown(false);
  };

  const handleToggleSortDropdown = () => {
    setShowSortDropdown(!showSortDropdown);
  };

  const renderToken = (item: JupiterToken, index: number) => {
    return (
      <Animated.View entering={FadeInUp.delay(index * 100).duration(400)}>
        <TokenItemMarket
          token={{
            address: item.id,
            name: item.name,
            symbol: item.symbol,
            logoURI: item.icon,
            decimals: item.decimals,
          }}
          price={item.usdPrice}
          priceChangePercentage={item.stats24h?.priceChange || 0}
          onPress={() =>
            router.push(
              `/token/${item.id}?symbol=${encodeURIComponent(item.symbol)}&name=${encodeURIComponent(item.name)}`,
            )
          }
        />
      </Animated.View>
    );
  };

  return (
    <ScreenContainer edges={['top']}>
      {/* Token List */}
      <Animated.FlatList
        data={sortedData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => renderToken(item, index)}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Fixed Filter Row at Bottom */}
      <MarketFilterRow
        category={category}
        sortMetric={sortMetric}
        showSortDropdown={showSortDropdown}
        filterBarTranslateY={filterBarTranslateY}
        onCategoryChange={handleCategoryChange}
        onSortMetricChange={handleSortMetricChange}
        onToggleSortDropdown={handleToggleSortDropdown}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: scale(12),
    paddingBottom: verticalScale(140), // Extra padding for the fixed filter bar
  },
});
