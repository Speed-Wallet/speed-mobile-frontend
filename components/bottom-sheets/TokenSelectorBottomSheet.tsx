import React, {
  useState,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import SearchBar from '@/components/SearchBar';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import SettingsHeader from '@/components/SettingsHeader';
import colors from '@/constants/colors';
import { TokenItemSelector } from '@/components/token-items';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useTokenAssets } from '@/hooks/useTokenAsset';
import { useWalletPublicKey } from '@/services/walletService';
import { TokenAsset, TokenMetadata } from '@/services/tokenAssetService';
import { POPULAR_TOKENS } from '@/constants/popularTokens';

interface TokenSelectorBottomSheetProps {
  onTokenSelect: (token: TokenAsset) => void;
  onClose: () => void;
  excludeAddress?: string;
  selectedAddress?: string;
}

export interface TokenSelectorBottomSheetRef {
  expand: () => void;
  close: () => void;
}

const TokenSelectorBottomSheet = forwardRef<
  TokenSelectorBottomSheetRef,
  TokenSelectorBottomSheetProps
>(({ onTokenSelect, onClose, excludeAddress, selectedAddress }, ref) => {
  const [searchQuery, setSearchQuery] = useState('');
  const bottomSheetRef = useRef<BottomSheet>(null);
  const walletAddress = useWalletPublicKey();

  useImperativeHandle(ref, () => ({
    expand: () => bottomSheetRef.current?.expand(),
    close: () => bottomSheetRef.current?.close(),
  }));

  const { data: tokenAssets, isLoading: isLoadingBalances } =
    useTokenAssets(walletAddress);

  const tokenList = tokenAssets?.tokenAssets || [];

  // Combine user tokens with popular tokens
  const combinedTokenList = useMemo(() => {
    const userTokenAddresses = new Set(
      tokenList.map((t: TokenAsset) => t.address),
    );

    // Filter out popular tokens that user already has
    const additionalPopularTokens = POPULAR_TOKENS.filter(
      (token) => !userTokenAddresses.has(token.address),
    );

    // Combine: user tokens first, then popular tokens
    return [...tokenList, ...additionalPopularTokens];
  }, [tokenList]);

  const filteredTokens = useMemo(() => {
    return combinedTokenList
      .filter((token: TokenAsset | TokenMetadata) =>
        excludeAddress ? token.address !== excludeAddress : true,
      )
      .filter(
        (token: TokenAsset | TokenMetadata) =>
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
      );
  }, [combinedTokenList, excludeAddress, searchQuery]);

  const handleSelectToken = (token: TokenAsset | TokenMetadata) => {
    // Convert TokenMetadata to TokenAsset if needed
    const tokenAsset: TokenAsset = {
      ...token,
      balance: 0,
      rawBalance: '0',
      mint: token.address,
      tokenStandard: 'Fungible',
      totalPrice: 0,
      pricePerToken: 0,
      currency: 'USD',
    };

    // Close bottom sheet and call callback
    bottomSheetRef.current?.close();
    setTimeout(() => {
      onTokenSelect(tokenAsset);
    }, 200);
  };

  const handleClose = () => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const renderTokenItem = ({ item }: { item: TokenAsset | TokenMetadata }) => {
    const isSelected = item.address === selectedAddress;

    return (
      <TokenItemSelector
        token={{
          address: item.address,
          name: item.name,
          symbol: item.symbol,
          logoURI: item.logoURI,
          decimals: item.decimals,
        }}
        isLoading={isLoadingBalances}
        onPress={() => handleSelectToken(item)}
        isSelected={isSelected}
        backgroundColor={
          isSelected ? colors.backgroundLight : colors.backgroundMedium
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
        data={filteredTokens}
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
                onSearchChange={setSearchQuery}
                placeholder="Search by name or symbol"
              />
            </View>
          </View>
        }
        stickyHeaderIndices={[0]}
      />
    </BottomSheet>
  );
});

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
