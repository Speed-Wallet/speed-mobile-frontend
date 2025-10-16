import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import SearchBar from '@/components/SearchBar';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  useBottomSheetScrollableCreator,
} from '@gorhom/bottom-sheet';
import SettingsHeader from '@/components/SettingsHeader';
import colors from '@/constants/colors';
import { TokenItemSelector } from '@/components/token-items';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { TokenAsset, TokenMetadata } from '@/services/tokenAssetService';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import BottomActionContainer from '@/components/BottomActionContainer';

interface TokenSelectorBottomSheetProps {
  tokens: (TokenAsset | TokenMetadata)[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  onTokenSelect: (token: TokenAsset | TokenMetadata) => void;
  onClose: () => void;
  selectedAddress?: string;
}

export interface TokenSelectorBottomSheetRef {
  present: () => void;
  dismiss: () => void;
}

const TokenSelectorBottomSheet = forwardRef<
  TokenSelectorBottomSheetRef,
  TokenSelectorBottomSheetProps
>(
  (
    {
      tokens,
      searchQuery,
      onSearchChange,
      isLoading = false,
      onTokenSelect,
      onClose,
      selectedAddress,
    },
    ref,
  ) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const scrollOffset = useSharedValue(0);
    const searchBarTranslateY = useSharedValue(0);
    const lastScrollY = useRef(0);

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    const handleSelectToken = (token: TokenAsset | TokenMetadata) => {
      // Close bottom sheet and call callback with the token as-is
      bottomSheetRef.current?.dismiss();
      setTimeout(() => {
        onTokenSelect(token);
      }, 200);
    };

    const handleClose = () => {
      bottomSheetRef.current?.dismiss();
      setTimeout(() => {
        onClose();
      }, 200);
    };

    const renderTokenItem = ({
      item,
    }: {
      item: TokenAsset | TokenMetadata;
    }) => {
      const isSelected = item.address === selectedAddress;

      // Check if item is a TokenAsset (has balance property)
      const isTokenAsset = 'balance' in item;

      return (
        <TokenItemSelector
          token={{
            address: item.address,
            name: item.name,
            symbol: item.symbol,
            logoURI: item.logoURI,
            decimals: item.decimals,
          }}
          onPress={() => handleSelectToken(item)}
          isSelected={isSelected}
          backgroundColor={
            isSelected ? colors.backgroundLight : colors.backgroundMedium
          }
          balance={isTokenAsset ? (item as TokenAsset).balance : undefined}
          totalPrice={
            isTokenAsset ? (item as TokenAsset).totalPrice : undefined
          }
        />
      );
    };

    const renderFooter = () => {
      if (!isLoading) return null;
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
        </View>
      );
    };

    const renderEmptyComponent = () => {
      // Don't show empty state while loading
      if (isLoading) return null;

      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No tokens found' : 'No tokens available'}
          </Text>
          {searchQuery && (
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          )}
        </View>
      );
    };

    const handleScroll = (event: any) => {
      const currentOffset = event.nativeEvent.contentOffset.y;
      const diff = currentOffset - lastScrollY.current;

      // Hide search bar when scrolling down, show when scrolling up
      if (diff > 5 && currentOffset > 20) {
        // Scrolling down
        searchBarTranslateY.value = withTiming(100, { duration: 200 });
      } else if (diff < -5 || currentOffset <= 0) {
        // Scrolling up or at top
        searchBarTranslateY.value = withTiming(0, { duration: 200 });
      }

      lastScrollY.current = currentOffset;
    };

    // Sort tokens by USD balance (descending)
    const sortedTokens = [...tokens].sort((a, b) => {
      const aValue = 'totalPrice' in a ? a.totalPrice || 0 : 0;
      const bValue = 'totalPrice' in b ? b.totalPrice || 0 : 0;
      return bValue - aValue;
    });

    // Create scrollable component for FlashList
    const BottomSheetFlashListScrollable = useBottomSheetScrollableCreator();

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={['93%']}
        enableDynamicSizing={false}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.4}
          />
        )}
      >
        <View style={styles.container}>
          {/* Fixed Header */}
          <View style={styles.headerContainer}>
            <SettingsHeader
              title="Select Token"
              onClose={handleClose}
              noPadding={true}
            />
          </View>

          {/* Scrollable List */}
          <FlashList
            data={sortedTokens}
            keyExtractor={(token) => token.address}
            renderItem={renderTokenItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyComponent}
            ListFooterComponent={renderFooter}
            renderScrollComponent={BottomSheetFlashListScrollable}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />

          {/* Search Bar - Using BottomActionContainer with keyboard avoidance */}
          <BottomActionContainer
            translateY={searchBarTranslateY}
            avoidKeyboard={true}
            edges={['bottom']}
          >
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              placeholder="Search by name or symbol"
            />
          </BottomActionContainer>
        </View>
      </BottomSheetModal>
    );
  },
);

TokenSelectorBottomSheet.displayName = 'TokenSelectorBottomSheet';

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: colors.backgroundDark,
  },
  bottomSheetHandle: {
    backgroundColor: colors.textSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  headerContainer: {
    backgroundColor: colors.backgroundDark,
    paddingHorizontal: scale(16),
    marginBottom: 6,
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(100), // Extra padding for search bar at bottom
  },
  footerLoader: {
    paddingVertical: verticalScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: verticalScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: verticalScale(8),
  },
  emptySubtext: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
});

export default TokenSelectorBottomSheet;
