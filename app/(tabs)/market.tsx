import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { getAllTokenInfo } from '@/data/tokens';
import TokenItem from '@/components/TokenItem';
import { EnrichedTokenEntry } from '@/data/types';

type SortOption = 'price' | 'name' | 'change';
type SortDirection = 'asc' | 'desc';

export default function MarketScreen() {
  const router = useRouter();
  const [tokenData, setTokenData] = useState<EnrichedTokenEntry[]>([]);
  const [filteredData, setFilteredData] = useState<EnrichedTokenEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('price');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
      filtered = filtered.filter(crypto => 
        crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Market</Text>
        <Text style={styles.subtitle}>Discover and track cryptocurrencies</Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
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
          style={[styles.sortOption, sortBy === 'name' && styles.activeSortOption]} 
          onPress={() => setSortOption('name')}
        >
          <Text style={[styles.sortOptionText, sortBy === 'name' && styles.activeSortOptionText]}>Name</Text>
          {sortBy === 'name' && (
            <ArrowUpDown size={14} color={colors.primary} style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.sortOption, sortBy === 'price' && styles.activeSortOption]} 
          onPress={() => setSortOption('price')}
        >
          <Text style={[styles.sortOptionText, sortBy === 'price' && styles.activeSortOptionText]}>Price</Text>
          {sortBy === 'price' && (
            <ArrowUpDown size={14} color={colors.primary} style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.sortOption, sortBy === 'change' && styles.activeSortOption]} 
          onPress={() => setSortOption('change')}
        >
          <Text style={[styles.sortOptionText, sortBy === 'change' && styles.activeSortOptionText]}>24h Change</Text>
          {sortBy === 'change' && (
            sortDirection === 'asc' ? 
              <TrendingUp size={14} color={colors.primary} style={{ marginLeft: 4 }} /> :
              <TrendingDown size={14} color={colors.primary} style={{ marginLeft: 4 }} />
          )}
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
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
  },
  activeSortOption: {
    backgroundColor: colors.backgroundLight,
  },
  sortOptionText: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  activeSortOptionText: {
    color: colors.primaryLight,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
});