import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, Flame } from 'lucide-react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import { getAllTokenInfo } from '@/data/tokens';
import TokenItem from '@/components/TokenItem';
import { EnrichedTokenEntry } from '@/data/types';
import ScreenContainer from '@/components/ScreenContainer';
import TabScreenHeader from '@/components/TabScreenHeader';
import SearchBar from '@/components/SearchBar';
import {
  useTopTradedTokens,
  useTrendingTokens,
} from '@/services/jupiterService';
import { JupiterToken } from '@/types/jupiter';
import { useTabBarVisibility } from '@/contexts/TabBarVisibilityContext';

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

  // Fetch curated tokens (existing list)
  const curatedTokens = getAllTokenInfo();

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

  const sortMetricLabels: Record<SortMetric, string> = {
    price: 'Price',
    volume: 'Volume',
    organicScore: 'Organic Score',
    liquidity: 'Liquidity',
  };

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

  const animatedFilterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: filterBarTranslateY.value }],
  }));

  const renderToken = (
    item: EnrichedTokenEntry | JupiterToken,
    index: number,
  ) => {
    // Check if it's a Jupiter token or curated token
    const isJupiterToken = 'id' in item;

    if (isJupiterToken) {
      const jupToken = item as JupiterToken;
      return (
        <Animated.View entering={FadeInUp.delay(index * 100).duration(400)}>
          <TokenItem
            balance={0} // Jupiter data doesn't have user balance
            pricePerToken={jupToken.usdPrice}
            totalPrice={0}
            logoURI={jupToken.icon}
            name={jupToken.name}
            symbol={jupToken.symbol}
            decimals={jupToken.decimals}
            priceChangePercentage={jupToken.stats24h?.priceChange || 0}
            onPress={() =>
              router.push(
                `/token/${jupToken.id}?symbol=${encodeURIComponent(jupToken.symbol)}&name=${encodeURIComponent(jupToken.name)}`,
              )
            }
            showBalance={false}
          />
        </Animated.View>
      );
    } else {
      const curatedToken = item as EnrichedTokenEntry;
      return (
        <Animated.View entering={FadeInUp.delay(index * 100).duration(400)}>
          <TokenItem
            balance={curatedToken.balance}
            pricePerToken={curatedToken.price}
            totalPrice={curatedToken.balance * curatedToken.price}
            logoURI={curatedToken.logoURI}
            name={curatedToken.name}
            symbol={curatedToken.symbol}
            decimals={curatedToken.decimals}
            priceChangePercentage={curatedToken.priceChangePercentage}
            onPress={() =>
              router.push(
                `/token/${curatedToken.address}?symbol=${encodeURIComponent(curatedToken.symbol)}&name=${encodeURIComponent(curatedToken.name)}`,
              )
            }
            showBalance={false}
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

      {/* Fixed Filter Row at Bottom - Overlaying */}
      <Animated.View style={[styles.fixedFilterContainer, animatedFilterStyle]}>
        <View style={styles.filterBarContent}>
          {/* Main Filter Row */}
          <View style={styles.mainFilterRow}>
            {/* Category Radio Buttons */}
            <View style={styles.categoryContainer}>
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  category === 'curated' && styles.activeCategoryOption,
                ]}
                onPress={() => {
                  setCategory('curated');
                  setShowSortDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    category === 'curated' && styles.activeCategoryOptionText,
                  ]}
                >
                  Curated
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  category === 'top' && styles.activeCategoryOption,
                ]}
                onPress={() => {
                  setCategory('top');
                  setShowSortDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    category === 'top' && styles.activeCategoryOptionText,
                  ]}
                >
                  Top
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  category === 'trending' && styles.activeCategoryOption,
                ]}
                onPress={() => {
                  setCategory('trending');
                  setShowSortDropdown(false);
                }}
              >
                <Flame
                  size={scale(12)}
                  color={
                    category === 'trending'
                      ? colors.backgroundDark
                      : colors.textSecondary
                  }
                  style={{ marginRight: scale(2) }}
                />
                <Text
                  style={[
                    styles.categoryOptionText,
                    category === 'trending' && styles.activeCategoryOptionText,
                  ]}
                >
                  Trending
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sort Dropdown Button */}
            {category !== 'curated' && (
              <TouchableOpacity
                style={styles.sortDropdownButton}
                onPress={() => setShowSortDropdown(!showSortDropdown)}
              >
                <Text style={styles.sortDropdownButtonText}>
                  {sortMetricLabels[sortMetric]}
                </Text>
                <ChevronDown
                  size={scale(12)}
                  color={colors.textSecondary}
                  style={[
                    { marginLeft: scale(4) },
                    showSortDropdown && { transform: [{ rotate: '180deg' }] },
                  ]}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Expandable Sort Options */}
          {showSortDropdown && category !== 'curated' && (
            <View style={styles.expandedDropdown}>
              {(Object.keys(sortMetricLabels) as SortMetric[]).map((metric) => (
                <TouchableOpacity
                  key={metric}
                  style={[
                    styles.expandedDropdownItem,
                    sortMetric === metric && styles.activeExpandedDropdownItem,
                  ]}
                  onPress={() => {
                    setSortMetric(metric);
                    setShowSortDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.expandedDropdownItemText,
                      sortMetric === metric &&
                        styles.activeExpandedDropdownItemText,
                    ]}
                  >
                    {sortMetricLabels[metric]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  fixedFilterContainer: {
    position: 'absolute',
    bottom: 90, // Position above tab bar - matches tab bar height
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundMedium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  filterBarContent: {
    width: '100%',
  },
  mainFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8, // Increased for taller bar
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: scale(6), // Reduced gap
    flex: 1,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6, // Increased for taller buttons
    paddingHorizontal: 12, // Increased for better spacing
    borderRadius: 16, // Increased border radius
    backgroundColor: colors.backgroundMedium,
    minHeight: 42, // Increased minimum height
  },
  activeCategoryOption: {
    backgroundColor: '#00CFFF',
  },
  categoryOptionText: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
    fontSize: moderateScale(12), // Increased for taller buttons
    fontWeight: '600',
  },
  activeCategoryOptionText: {
    color: colors.backgroundDark,
    fontWeight: '600',
  },
  sortDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8, // Increased to match category buttons
    paddingHorizontal: 12, // Increased for better spacing
    borderRadius: 6,
    backgroundColor: colors.backgroundMedium,
    borderWidth: 1,
    borderColor: colors.textSecondary + '40',
    minHeight: 42,
  },
  sortDropdownButtonText: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
    fontSize: moderateScale(12), // Increased to match category text
  },
  expandedDropdown: {
    paddingHorizontal: scale(12),
    paddingTop: verticalScale(4),
    paddingBottom: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: colors.backgroundMedium,
  },
  expandedDropdownItem: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    borderRadius: 6,
    marginBottom: verticalScale(4),
  },
  activeExpandedDropdownItem: {
    backgroundColor: colors.backgroundMedium,
  },
  expandedDropdownItemText: {
    color: colors.textPrimary,
    fontFamily: 'Inter-Medium',
    fontSize: moderateScale(12),
  },
  activeExpandedDropdownItemText: {
    color: '#00CFFF',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: scale(12),
    paddingBottom: verticalScale(140), // Extra padding for the fixed filter bar
  },
});
