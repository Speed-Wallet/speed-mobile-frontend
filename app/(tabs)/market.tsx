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
import { TokenMetadata } from '@/services/tokenAssetService';
import ScreenContainer from '@/components/ScreenContainer';
import TabScreenHeader from '@/components/TabScreenHeader';
import MarketFilterRow from '@/components/MarketFilterRow';
import {
  useTopTradedTokens,
  useTrendingTokens,
} from '@/services/jupiterService';
import { JupiterToken } from '@/types/jupiter';
import { useTabBarVisibility } from '@/contexts/TabBarVisibilityContext';
import { POPULAR_TOKENS } from '@/constants/popularTokens';

type CategoryOption = 'curated' | 'top' | 'trending';
type SortMetric = 'price' | 'volume' | 'organicScore' | 'liquidity';

export default function MarketScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryOption>('curated');
  const [sortMetric, setSortMetric] = useState<SortMetric>('price');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const { hideTabBar, showTabBar } = useTabBarVisibility();

  // Scroll tracking
  const scrollY = useRef(0);
  const lastScrollY = useRef(0);
  const filterBarTranslateY = useSharedValue(0);
  const barsHidden = useRef(false); // Track bar visibility to avoid redundant updates

  // Use popular tokens for curated list
  const curatedTokens = POPULAR_TOKENS;

  // Fetch Jupiter data
  const { data: topTradedTokens, isLoading: isLoadingTop } =
    useTopTradedTokens(20);
  const { data: trendingTokens, isLoading: isLoadingTrending } =
    useTrendingTokens(20);

  // Get current data based on selected category
  const currentData = useMemo(() => {
    if (category === 'curated') {
      return curatedTokens;
    } else if (category === 'top' && topTradedTokens) {
      return topTradedTokens;
    } else if (category === 'trending' && trendingTokens) {
      return trendingTokens;
    }
    return [];
  }, [category, curatedTokens, topTradedTokens, trendingTokens]);

  // Sort data
  const sortedData = useMemo(() => {
    let sorted = [...currentData];

    // Sort based on selected metric (only for Jupiter data)
    if (category !== 'curated' && sorted.length > 0) {
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

  const renderToken = (item: TokenMetadata | JupiterToken, index: number) => {
    // Check if it's a Jupiter token or curated token
    const isJupiterToken = 'id' in item;

    if (isJupiterToken) {
      const jupToken = item as JupiterToken;
      return (
        <Animated.View entering={FadeInUp.delay(index * 100).duration(400)}>
          <TokenItemMarket
            token={{
              address: jupToken.id,
              name: jupToken.name,
              symbol: jupToken.symbol,
              logoURI: jupToken.icon,
              decimals: jupToken.decimals,
            }}
            price={jupToken.usdPrice}
            priceChangePercentage={jupToken.stats24h?.priceChange || 0}
            onPress={() =>
              router.push(
                `/token/${jupToken.id}?symbol=${encodeURIComponent(jupToken.symbol)}&name=${encodeURIComponent(jupToken.name)}`,
              )
            }
          />
        </Animated.View>
      );
    } else {
      const curatedToken = item as TokenMetadata;
      return (
        <Animated.View entering={FadeInUp.delay(index * 100).duration(400)}>
          <TokenItemMarket
            token={{
              address: curatedToken.address,
              name: curatedToken.name,
              symbol: curatedToken.symbol,
              logoURI: curatedToken.logoURI,
              decimals: curatedToken.decimals,
            }}
            price={undefined}
            priceChangePercentage={undefined}
            onPress={() =>
              router.push(
                `/token/${curatedToken.address}?symbol=${encodeURIComponent(curatedToken.symbol)}&name=${encodeURIComponent(curatedToken.name)}`,
              )
            }
          />
        </Animated.View>
      );
    }
  };

  return (
    <ScreenContainer edges={['top']}>
      <TabScreenHeader
        title="Market"
        subtitle="Discover and track cryptocurrencies"
      />

      {/* Token List */}
      <Animated.FlatList
        data={sortedData}
        keyExtractor={(item) => ('id' in item ? item.id : item.address)}
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
