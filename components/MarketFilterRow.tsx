import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, Flame } from 'lucide-react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';

type CategoryOption = 'curated' | 'top' | 'trending';
type SortMetric = 'price' | 'volume' | 'organicScore' | 'liquidity';

interface MarketFilterRowProps {
  category: CategoryOption;
  sortMetric: SortMetric;
  showSortDropdown: boolean;
  filterBarTranslateY: Animated.SharedValue<number>;
  onCategoryChange: (category: CategoryOption) => void;
  onSortMetricChange: (metric: SortMetric) => void;
  onToggleSortDropdown: () => void;
}

const sortMetricLabels: Record<SortMetric, string> = {
  price: 'Price',
  volume: 'Volume',
  organicScore: 'Organic Score',
  liquidity: 'Liquidity',
};

export default function MarketFilterRow({
  category,
  sortMetric,
  showSortDropdown,
  filterBarTranslateY,
  onCategoryChange,
  onSortMetricChange,
  onToggleSortDropdown,
}: MarketFilterRowProps) {
  const animatedFilterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: filterBarTranslateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.fixedFilterContainer,
        // { bottom: tabBarHeight/1000 },
        animatedFilterStyle,
      ]}
    >
      <View style={styles.filterBarContent}>
        {/* Main Filter Row */}
        <View style={styles.mainFilterRow}>
          {/* Category Radio Buttons */}
          <View style={styles.categoryContainer}>
            <TouchableOpacity
              style={[
                styles.buttons,
                category === 'curated' && styles.activeCategoryOption,
              ]}
              onPress={() => onCategoryChange('curated')}
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
              style={[styles.buttons, styles.sortDropdownButton]}
              onPress={onToggleSortDropdown}
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
            ))}
          </View>
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
  categoryContainer: {
    flexDirection: 'row',
    gap: scale(8),
    flex: 1,
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
    gap: verticalScale(4),
  },
  expandedDropdownItem: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12),
    borderRadius: scale(6),
    backgroundColor: colors.backgroundMedium,
    marginBottom: verticalScale(4),
  },
  activeExpandedDropdownItem: {
    backgroundColor: colors.textSecondary + '20',
  },
  expandedDropdownItemText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  activeExpandedDropdownItemText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
