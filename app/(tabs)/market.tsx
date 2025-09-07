import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import { getAllTokenInfo } from '@/data/tokens';
import TokenItem from '@/components/TokenItem';
import { EnrichedTokenEntry } from '@/data/types';
import ScreenContainer from '@/components/ScreenContainer';
import TabScreenHeader from '@/components/TabScreenHeader';
import { useTokenPrices } from '@/hooks/useTokenPrices';

type SortOption = 'price' | 'name' | 'change';
type SortDirection = 'asc' | 'desc';

export default function MarketScreen() {
  const router = useRouter();
  const [tokenData, setTokenData] = useState<EnrichedTokenEntry[]>([]);
  const [filteredData, setFilteredData] = useState<EnrichedTokenEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('price');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Batch fetch all token prices at once
  const coingeckoIds = tokenData
    .map((token) => token.extensions?.coingeckoId)
    .filter(Boolean) as string[];

  const { prices, isLoading: isPricesLoading } = useTokenPrices(coingeckoIds);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortData();
  }, [searchQuery, sortBy, sortDirection, tokenData]);

  const loadData = async () => {
    const data = await getAllTokenInfo();
    setTokenData(data);
    setFilteredData(data);
  };

  const filterAndSortData = () => {
    let filtered = [...tokenData];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (crypto) =>
          crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sort data
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'price') {
        comparison = a.price - b.price;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'change') {
        comparison = a.priceChangePercentage - b.priceChangePercentage;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredData(filtered);
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const setSortOption = (option: SortOption) => {
    if (sortBy === option) {
      toggleSortDirection();
    } else {
      setSortBy(option);
      setSortDirection('desc');
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <TabScreenHeader
        title="Market"
        subtitle="Discover and track cryptocurrencies"
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search
          size={scale(18)}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search cryptocurrencies..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Sort Options */}
      <View style={styles.sortOptionsContainer}>
        <TouchableOpacity
          style={[
            styles.sortOption,
            sortBy === 'name' && styles.activeSortOption,
          ]}
          onPress={() => setSortOption('name')}
        >
          <Text
            style={[
              styles.sortOptionText,
              sortBy === 'name' && styles.activeSortOptionText,
            ]}
          >
            Name
          </Text>
          {sortBy === 'name' && (
            <ArrowUpDown
              size={scale(12)}
              color={colors.backgroundDark}
              style={{ marginLeft: scale(3) }}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortOption,
            sortBy === 'price' && styles.activeSortOption,
          ]}
          onPress={() => setSortOption('price')}
        >
          <Text
            style={[
              styles.sortOptionText,
              sortBy === 'price' && styles.activeSortOptionText,
            ]}
          >
            Price
          </Text>
          {sortBy === 'price' && (
            <ArrowUpDown
              size={scale(12)}
              color={colors.backgroundDark}
              style={{ marginLeft: scale(3) }}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortOption,
            sortBy === 'change' && styles.activeSortOption,
          ]}
          onPress={() => setSortOption('change')}
        >
          <Text
            style={[
              styles.sortOptionText,
              sortBy === 'change' && styles.activeSortOptionText,
            ]}
          >
            24h Change
          </Text>
          {sortBy === 'change' &&
            (sortDirection === 'asc' ? (
              <TrendingUp
                size={scale(12)}
                color={colors.backgroundDark}
                style={{ marginLeft: scale(3) }}
              />
            ) : (
              <TrendingDown
                size={scale(12)}
                color={colors.backgroundDark}
                style={{ marginLeft: scale(3) }}
              />
            ))}
        </TouchableOpacity>
      </View>

      {/* Token List */}
      <Animated.FlatList
        data={filteredData}
        keyExtractor={(item) => item.address}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInUp.delay(index * 100).duration(400)}>
            <TokenItem
              token={item}
              onPress={() => router.push(`/token/${item.address}`)}
              showBalance={false}
              preloadedPrice={
                item.extensions?.coingeckoId
                  ? prices[item.extensions.coingeckoId]
                  : undefined
              }
              isPriceLoading={isPricesLoading}
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(10),
    marginHorizontal: scale(12),
    marginTop: verticalScale(6),
    marginBottom: verticalScale(12),
    paddingHorizontal: scale(10),
    height: verticalScale(42),
  },
  searchIcon: {
    marginRight: scale(6),
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: moderateScale(14),
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(12),
    marginBottom: verticalScale(12),
    gap: scale(8),
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(14),
    borderRadius: scale(18),
    backgroundColor: colors.backgroundMedium,
    minHeight: verticalScale(36),
  },
  activeSortOption: {
    backgroundColor: '#00CFFF',
  },
  sortOptionText: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  activeSortOptionText: {
    color: colors.backgroundDark,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: scale(12),
    paddingBottom: verticalScale(60),
  },
});
