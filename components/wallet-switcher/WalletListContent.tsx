import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import colors from '@/constants/colors';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import WalletItem from './WalletItem';

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
}

const WalletListContent: React.FC<WalletListContentProps> = ({
  wallets,
  loading,
  copiedAddressId,
  onSwitchWallet,
  onCopyAddress,
  onAddWalletPress,
}) => {
  return (
    <>
      {/* Wallets List */}
      <View style={styles.section}>
        {wallets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No wallets found</Text>
          </View>
        ) : (
          wallets.map((wallet) => (
            <WalletItem
              key={wallet.id}
              id={wallet.id}
              name={wallet.name}
              publicKey={wallet.publicKey}
              isActive={wallet.isActive}
              isCopied={copiedAddressId === wallet.id}
              loading={loading}
              onPress={() => onSwitchWallet(wallet.id)}
              onCopyAddress={onCopyAddress}
            />
          ))
        )}
      </View>

      {/* Centered Add Wallet Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddWalletPress}
          disabled={loading}
        >
          <Plus size={20} color={colors.primaryText} />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  section: {
    flexDirection: 'column',
    gap: 3,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
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
