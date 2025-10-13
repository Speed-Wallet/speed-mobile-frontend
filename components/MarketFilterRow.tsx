import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  ChevronDown,
  Flame,
  ArrowUpDown,
  Filter,
  Search,
} from 'lucide-react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import SearchBar from './SearchBar';

export type CategoryOption = 'top' | 'trending';
export type SortMetric =
  | 'price'
  | 'volume'
  | 'organicScore'
  | 'liquidity'
  | 'marketCap';
export type SortOrder = 'asc' | 'desc';

interface MarketFilterRowProps {
  category: CategoryOption;
  sortMetric: SortMetric;
  sortOrder: SortOrder;
  showSortDropdown: boolean;
  searchQuery: string;
  showSearch: boolean;
  filterBarTranslateY: Animated.SharedValue<number>;
  onCategoryChange: (category: CategoryOption) => void;
  onSortMetricChange: (metric: SortMetric) => void;
  onToggleSortOrder: () => void;
  onToggleSortDropdown: () => void;
  onSearchChange: (query: string) => void;
  onToggleSearch: () => void;
}

const sortMetricLabels: Record<SortMetric, string> = {
  price: 'Price',
  volume: 'Volume',
  organicScore: 'Score',
  liquidity: 'Liquidity',
  marketCap: 'Market Cap',
};

export default function MarketFilterRow({
  category,
  sortMetric,
  sortOrder,
  showSortDropdown,
  searchQuery,
  showSearch,
  filterBarTranslateY,
  onCategoryChange,
  onSortMetricChange,
  onToggleSortOrder,
  onToggleSortDropdown,
  onSearchChange,
  onToggleSearch,
}: MarketFilterRowProps) {
  const animatedFilterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: filterBarTranslateY.value }],
  }));

  const ICON_SIZE = 16;

  return (
    <Animated.View
      style={[
        styles.fixedFilterContainer,
        // { bottom: tabBarHeight/1000 },
        animatedFilterStyle,
      ]}
    >
      <View style={styles.filterBarContent}>
        {showSearch ? (
          /* Search Mode */
          <View style={styles.searchModeContainer}>
            <View style={styles.searchBarWrapper}>
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                placeholder="Search tokens..."
                padding={scale(10)}
                showSearchIcon={false}
                autoFocus={true}
              />
            </View>
            <TouchableOpacity
              style={[styles.buttons, styles.searchButton]}
              onPress={onToggleSearch}
            >
              <Search size={scale(14)} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Main Filter Row */}
            <View style={styles.mainFilterRow}>
              {/* Category Radio Buttons */}
              <View style={styles.categoryContainer}>
                <TouchableOpacity
                  style={[
                    styles.buttons,
                    category === 'top' && styles.activeCategoryOption,
                  ]}
                  onPress={() => onCategoryChange('top')}
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
                    styles.buttons,
                    category === 'trending' && styles.activeCategoryOption,
                  ]}
                  onPress={() => onCategoryChange('trending')}
                >
                  <Flame
                    size={scale(12)}
                    color={
                      category === 'trending' ? '#00CFFF' : colors.textSecondary
                    }
                    style={{ marginRight: scale(2) }}
                  />
                  <Text
                    style={[
                      styles.categoryOptionText,
                      category === 'trending' &&
                        styles.activeCategoryOptionText,
                    ]}
                  >
                    Trending
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sort Controls Container */}
              <View style={styles.sortControlsContainer}>
                {/* Sort Dropdown Button */}
                <TouchableOpacity
                  style={[styles.buttons, styles.sortDropdownButton]}
                  onPress={onToggleSortDropdown}
                >
                  <Filter size={ICON_SIZE} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Sort Order Toggle Button */}
                <TouchableOpacity
                  style={[styles.buttons, styles.sortOrderButton]}
                  onPress={onToggleSortOrder}
                >
                  <ArrowUpDown size={ICON_SIZE} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Search Toggle Button */}
                <TouchableOpacity
                  style={[styles.buttons, styles.sortOrderButton]}
                  onPress={onToggleSearch}
                >
                  <Search size={ICON_SIZE} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Expandable Sort Options */}
            {showSortDropdown && (
              <View style={styles.expandedDropdown}>
                {(Object.keys(sortMetricLabels) as SortMetric[]).map(
                  (metric) => (
                    <TouchableOpacity
                      key={metric}
                      style={[
                        styles.expandedDropdownItem,
                        sortMetric === metric &&
                          styles.activeExpandedDropdownItem,
                      ]}
                      onPress={() => onSortMetricChange(metric)}
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
                  ),
                )}
              </View>
            )}
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fixedFilterContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // paddingHorizontal: scale(16),
    zIndex: 1000,
    borderColor: colors.backgroundLight,
    borderBottomWidth: 0.5,
    borderTopWidth: 0.5,
  },
  filterBarContent: {
    backgroundColor: colors.backgroundDark,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  mainFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  searchBarWrapper: {
    flex: 1,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: scale(8),
    flex: 1,
  },
  sortControlsContainer: {
    flexDirection: 'row',
    gap: scale(4),
    alignItems: 'center',
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    justifyContent: 'center',
    // backgroundColor: colors.backgroundMedium,
    // minHeight: 42,
  },
  searchButton: {
    paddingHorizontal: scale(10),
  },
  sortOrderButton: {
    paddingHorizontal: scale(10),
  },
  sortDropdownButton: {
    // backgroundColor: colors.backgroundMedium,
    backgroundColor: 'transparent',
  },
  activeCategoryOption: {
    backgroundColor: '#11333e94',
  },
  categoryOptionText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  activeCategoryOptionText: {
    color: '#00CFFF',
    fontWeight: '600',
  },
  sortDropdownButtonText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  expandedDropdown: {
    marginTop: verticalScale(8),
    gap: 2,
  },
  expandedDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: scale(6),
    backgroundColor: colors.backgroundMedium,
  },
  activeExpandedDropdownItem: {
    backgroundColor: colors.backgroundLight,
  },
  expandedDropdownItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  activeExpandedDropdownItemText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
