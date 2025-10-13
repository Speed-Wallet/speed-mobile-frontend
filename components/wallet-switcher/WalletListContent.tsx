import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Plus } from 'lucide-react-native';
import colors from '@/constants/colors';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import WalletItem from './WalletItem';
import SettingsHeader from '@/components/SettingsHeader';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface WalletInfo {
  id: string;
  name: string;
  publicKey: string;
  isActive: boolean;
  isMasterWallet?: boolean;
}

interface WalletListContentProps {
  wallets: WalletInfo[];
  loading: boolean;
  copiedAddressId: string | null;
  onSwitchWallet: (walletId: string) => void;
  onCopyAddress: (publicKey: string, walletId: string) => void;
  onAddWalletPress: () => void;
  renderScrollComponent?: any;
  title: string;
  onClose: () => void;
}

const WalletListContent: React.FC<WalletListContentProps> = ({
  wallets,
  loading,
  copiedAddressId,
  onSwitchWallet,
  onCopyAddress,
  onAddWalletPress,
  renderScrollComponent,
  title,
  onClose,
}) => {
  const renderWalletItem = ({ item }: { item: WalletInfo }) => (
    <WalletItem
      id={item.id}
      name={item.name}
      publicKey={item.publicKey}
      isActive={item.isActive}
      isCopied={copiedAddressId === item.id}
      loading={loading}
      onPress={() => onSwitchWallet(item.id)}
      onCopyAddress={onCopyAddress}
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No wallets found</Text>
    </View>
  );

  const renderHeaderComponent = () => (
    <View style={styles.headerContainer}>
      <SettingsHeader title={title} onClose={onClose} noPadding={true} />
    </View>
  );

  const renderFooterComponent = () => (
    <View style={styles.addButtonContainer}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={onAddWalletPress}
        disabled={loading}
      >
        <Plus size={20} color={colors.primaryText} />
      </TouchableOpacity>
    </View>
  );

  return (
    <FlashList
      data={wallets}
      keyExtractor={(item) => item.id}
      renderItem={renderWalletItem}
      contentContainerStyle={styles.listContent}
      style={styles.flashList}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={renderHeaderComponent}
      ListEmptyComponent={renderEmptyComponent}
      ListFooterComponent={renderFooterComponent}
      renderScrollComponent={renderScrollComponent}
    />
  );
};

const styles = StyleSheet.create({
  flashList: {
    maxHeight: SCREEN_HEIGHT * 0.65,
  },
  headerContainer: {
    backgroundColor: colors.backgroundDark,
    marginBottom: verticalScale(6),
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(24),
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: verticalScale(40),
  },
  emptyText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  addButtonContainer: {
    alignItems: 'center',
    paddingTop: verticalScale(16),
  },
  addButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(28),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WalletListContent;
