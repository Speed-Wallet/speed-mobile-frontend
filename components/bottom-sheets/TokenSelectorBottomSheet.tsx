import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import SearchBar from '@/components/SearchBar';
import BottomSheet, {
  BottomSheetBackdrop,
  useBottomSheetScrollableCreator,
} from '@gorhom/bottom-sheet';
import SettingsHeader from '@/components/SettingsHeader';
import colors from '@/constants/colors';
import { TokenItemSelector } from '@/components/token-items';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { TokenAsset, TokenMetadata } from '@/services/tokenAssetService';

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
  expand: () => void;
  close: () => void;
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
    const bottomSheetRef = useRef<BottomSheet>(null);

    useImperativeHandle(ref, () => ({
      expand: () => bottomSheetRef.current?.expand(),
      close: () => bottomSheetRef.current?.close(),
    }));

    const handleSelectToken = (token: TokenAsset | TokenMetadata) => {
      // Close bottom sheet and call callback with the token as-is
      bottomSheetRef.current?.close();
      setTimeout(() => {
        onTokenSelect(token);
      }, 200);
    };

    const handleClose = () => {
      bottomSheetRef.current?.close();
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

    // Create scrollable component for FlashList
    const BottomSheetFlashListScrollable = useBottomSheetScrollableCreator();

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
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
        onClose={handleClose}
      >
        <FlashList
          data={tokens}
          keyExtractor={(token) => token.address}
          renderItem={renderTokenItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <SettingsHeader
                title="Select Token"
                onClose={handleClose}
                noPadding={true}
              />
              <View>
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={onSearchChange}
                  placeholder="Search by name or symbol"
                />
              </View>
            </View>
          }
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={renderFooter}
          renderScrollComponent={BottomSheetFlashListScrollable}
        />
      </BottomSheet>
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
  headerContainer: {
    backgroundColor: colors.backgroundDark,
    marginBottom: 6,
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(24),
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
