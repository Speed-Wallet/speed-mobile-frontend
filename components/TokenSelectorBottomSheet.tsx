import React, {
  useState,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { Search } from 'lucide-react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import SettingsHeader from '@/components/SettingsHeader';
import colors from '@/constants/colors';
import { getAllTokenInfo } from '@/data/tokens';
import { EnrichedTokenEntry, TokenEntry } from '@/data/types';
import TokenItemAlt from '@/components/TokenItemAlt';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface TokenSelectorBottomSheetProps {
  onTokenSelect: (token: EnrichedTokenEntry) => void;
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

  useImperativeHandle(ref, () => ({
    expand: () => bottomSheetRef.current?.expand(),
    close: () => bottomSheetRef.current?.close(),
  }));

  const tokenList = getAllTokenInfo();

  // Parse selected token from address
  const selectedToken = selectedAddress
    ? tokenList.find((token) => token.address === selectedAddress) || null
    : null;

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

  const handleSelectToken = (token: EnrichedTokenEntry) => {
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

  const renderTokenItem = ({ item }: { item: EnrichedTokenEntry }) => (
    <TokenItemAlt
      token={item}
      selectedToken={selectedToken}
      onSelectToken={handleSelectToken}
    />
  );

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

        <View style={styles.searchContainer}>
          <Search
            size={scale(20)}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or symbol"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderColor: colors.backgroundMedium,
    borderWidth: 1,
    borderRadius: scale(12),
    marginHorizontal: scale(16),
    marginBottom: verticalScale(16),
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(24),
  },
});

export default TokenSelectorBottomSheet;
