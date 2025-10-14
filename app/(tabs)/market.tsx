import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { scale, verticalScale } from 'react-native-size-matters';
import { TokenItemMarket } from '@/components/token-items';
import ScreenContainer from '@/components/ScreenContainer';
import TabScreenHeader from '@/components/TabScreenHeader';
import MarketFilterRow, {
  CategoryOption,
  SortMetric,
  SortOrder,
} from '@/components/MarketFilterRow';
import {
  useTopTradedTokens,
  useTrendingTokens,
  fetchJupiterTokens,
} from '@/services/jupiterService';
import { JupiterToken } from '@/types/jupiter';
import { useTabBarVisibility } from '@/contexts/TabBarVisibilityContext';

export default function MarketScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryOption>('top');
  const [sortMetric, setSortMetric] = useState<SortMetric>('price');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [jupiterSearchResults, setJupiterSearchResults] = useState<
    JupiterToken[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const { hideTabBar, showTabBar } = useTabBarVisibility();

  // Add ref for FlashList
  const flashListRef = useRef<FlashListRef<JupiterToken> | null>(null);

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

  // Search Jupiter API with debounce
  const searchJupiterTokens = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setJupiterSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const searchResults = await fetchJupiterTokens(query);
      setJupiterSearchResults(searchResults);
    } catch (error) {
      console.error('Error searching Jupiter tokens:', error);
      setJupiterSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Immediately clear old results and show loading state when search query changes
    if (searchQuery && searchQuery.length >= 2) {
      setJupiterSearchResults([]);
      setIsSearching(true);
    } else {
      setJupiterSearchResults([]);
      setIsSearching(false);
    }

    // Set new timeout for 2 seconds
    searchTimeoutRef.current = setTimeout(() => {
      searchJupiterTokens(searchQuery);
    }, 2000);

    // Cleanup on unmount or when searchQuery changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchJupiterTokens]);

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

        let comparison = 0;

        switch (sortMetric) {
          case 'price':
            comparison =
              (tokenB.stats24h?.priceChange || 0) -
              (tokenA.stats24h?.priceChange || 0);
            break;
          case 'volume':
            comparison =
              (tokenB.stats24h?.buyVolume + tokenB.stats24h?.sellVolume || 0) -
              (tokenA.stats24h?.buyVolume + tokenA.stats24h?.sellVolume || 0);
            break;
          case 'organicScore':
            comparison =
              (tokenB.organicScore || 0) - (tokenA.organicScore || 0);
            break;
          case 'liquidity':
            comparison = (tokenB.liquidity || 0) - (tokenA.liquidity || 0);
            break;
          case 'marketCap':
            comparison = (tokenB.mcap || 0) - (tokenA.mcap || 0);
            break;
          default:
            comparison = 0;
        }

        // Reverse comparison if sort order is ascending
        return sortOrder === 'asc' ? -comparison : comparison;
      });
    }

    return sorted;
  }, [currentData, sortMetric, sortOrder, category]);

  // Filter data based on search query and add Jupiter search results
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedData;
    }

    const query = searchQuery.toLowerCase();
    const filtered = sortedData.filter(
      (token) =>
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.id.toLowerCase().includes(query),
    );

    // Add Jupiter search results if we have any
    if (jupiterSearchResults.length > 0) {
      // Filter out Jupiter results that are already in the filtered list
      const existingAddresses = new Set(filtered.map((token) => token.id));

      const uniqueJupiterResults = jupiterSearchResults.filter(
        (jupToken) => !existingAddresses.has(jupToken.id),
      );

      // Return filtered list followed by unique Jupiter results
      return [...filtered, ...uniqueJupiterResults];
    }

    return filtered;
  }, [sortedData, searchQuery, jupiterSearchResults]);

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
    // Scroll to top when sort metric changes
    flashListRef.current?.scrollToIndex({ index: 0, animated: true });
  };

  const handleToggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    // Scroll to top when sort order changes
    flashListRef.current?.scrollToIndex({ index: 0, animated: true });
  };

  const handleToggleSortDropdown = () => {
    setShowSortDropdown(!showSortDropdown);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleToggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      // Clear search when closing
      setSearchQuery('');
    }
  };

  const renderToken = (item: JupiterToken, index: number) => {
    // Calculate volume (buy + sell)
    const totalVolume =
      (item.stats24h?.buyVolume || 0) + (item.stats24h?.sellVolume || 0);

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
          volume={totalVolume}
          volumeChangePercentage={item.stats24h?.volumeChange || 0}
          liquidity={item.liquidity}
          liquidityChangePercentage={item.stats24h?.liquidityChange || 0}
          organicScore={item.organicScore}
          marketCap={item.mcap}
          displayMetric={sortMetric}
          onPress={() =>
            router.push(
              `/token/${item.id}?symbol=${encodeURIComponent(item.symbol)}&name=${encodeURIComponent(item.name)}`,
            )
          }
        />
      </Animated.View>
    );
  };

  const renderFooter = () => {
    if (!isSearching) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  };

  return (
    <ScreenContainer edges={['top']} style={{ marginTop: 12 }}>
      {/* Token List */}
      <FlashList
        ref={flashListRef}
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => renderToken(item, index)}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListFooterComponent={renderFooter}
      />

      {/* Fixed Filter Row at Bottom */}
      <MarketFilterRow
        category={category}
        sortMetric={sortMetric}
        sortOrder={sortOrder}
        showSortDropdown={showSortDropdown}
        searchQuery={searchQuery}
        showSearch={showSearch}
        filterBarTranslateY={filterBarTranslateY}
        onCategoryChange={handleCategoryChange}
        onSortMetricChange={handleSortMetricChange}
        onToggleSortOrder={handleToggleSortOrder}
        onToggleSortDropdown={handleToggleSortDropdown}
        onSearchChange={handleSearchChange}
        onToggleSearch={handleToggleSearch}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: scale(12),
    paddingBottom: verticalScale(140), // Extra padding for the fixed filter bar
  },
  footerLoader: {
    paddingVertical: verticalScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
