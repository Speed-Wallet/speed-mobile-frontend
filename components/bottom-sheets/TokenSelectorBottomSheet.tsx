import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';
import SearchBar from '@/components/SearchBar';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import SettingsHeader from '@/components/SettingsHeader';
import colors from '@/constants/colors';
import { TokenItemSelector } from '@/components/token-items';
import { scale, verticalScale } from 'react-native-size-matters';
import { TokenAsset, TokenMetadata } from '@/services/tokenAssetService';

interface TokenSelectorBottomSheetProps {
  tokens: (TokenAsset | TokenMetadata)[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  onTokenSelect: (token: TokenMetadata) => void;
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
      // Convert TokenAsset to TokenMetadata if needed
      const tokenMetadata: TokenMetadata = {
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        logoURI: token.logoURI,
        decimals: token.decimals,
      };

      // Close bottom sheet and call callback
      bottomSheetRef.current?.close();
      setTimeout(() => {
        onTokenSelect(tokenMetadata);
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
          isLoading={isLoading}
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
        <BottomSheetFlatList
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
          stickyHeaderIndices={[0]}
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
    // paddingHorizontal: scale(16),
    paddingBottom: 6,
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(24),
  },
});

export default TokenSelectorBottomSheet;
