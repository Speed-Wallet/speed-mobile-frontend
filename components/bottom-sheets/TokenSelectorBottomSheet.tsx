import React, {
  useState,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { StyleSheet } from 'react-native';
import SearchBar from '@/components/SearchBar';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import SettingsHeader from '@/components/SettingsHeader';
import colors from '@/constants/colors';
import TokenItem from '@/components/TokenItem';
import { scale, verticalScale } from 'react-native-size-matters';
import { useTokenAssets } from '@/hooks/useTokenAsset';
import { useWalletPublicKey } from '@/services/walletService';
import { TokenAsset } from '@/services/tokenBalanceService';

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

  const { data: tokenBalancesData, isLoading: isLoadingBalances } =
    useTokenAssets(walletAddress);

  const tokenList = tokenBalancesData?.tokenBalances || [];

  const filteredTokens = useMemo(() => {
    return tokenList
      .filter((token) =>
        excludeAddress ? token.address !== excludeAddress : true,
      )
      .filter(
        (token) =>
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
      );
  }, [tokenList, excludeAddress, searchQuery]);

  const handleSelectToken = (token: TokenAsset) => {
    // Close bottom sheet and call callback
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

  const renderTokenItem = ({ item }: { item: TokenAsset }) => {
    const isSelected = item.address === selectedAddress;

    return (
      <TokenItem
        balance={item.balance}
        pricePerToken={item.pricePerToken}
        totalPrice={item.totalPrice}
        logoURI={item.logoURI}
        name={item.name}
        symbol={item.symbol}
        decimals={item.decimals}
        isLoading={isLoadingBalances}
        priceChangePercentage={0}
        onPress={() => handleSelectToken(item)}
        showBalance={true}
        backgroundColor={
          isSelected ? colors.backgroundLight : colors.backgroundMedium
        }
        // showSelectorIcon={isSelected}
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
      <BottomSheetView style={styles.bottomSheetContent}>
        <SettingsHeader title="Select Token" onClose={handleClose} />

        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search by name or symbol"
        />

        <BottomSheetFlatList
          data={filteredTokens}
          keyExtractor={(token) => token.address}
          renderItem={renderTokenItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheetView>
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
  bottomSheetContent: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(24),
  },
});

export default TokenSelectorBottomSheet;
