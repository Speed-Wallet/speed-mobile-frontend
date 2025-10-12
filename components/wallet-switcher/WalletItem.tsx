import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Copy } from 'lucide-react-native';
import colors from '@/constants/colors';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface WalletItemProps {
  id: string;
  name: string;
  publicKey: string;
  isActive: boolean;
  isCopied: boolean;
  loading: boolean;
  onPress: () => void;
  onCopyAddress: (publicKey: string, walletId: string) => void;
}

const WalletItem: React.FC<WalletItemProps> = ({
  id,
  name,
  publicKey,
  isActive,
  isCopied,
  loading,
  onPress,
  onCopyAddress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.walletCard, isActive && styles.activeWalletCard]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={loading || isActive}
    >
      <View style={styles.walletInfo}>
        <View style={styles.walletHeader}>
          <Text style={styles.walletName}>{name}</Text>
        </View>
        <TouchableOpacity
          style={styles.addressContainer}
          onPress={(e) => {
            e.stopPropagation();
            onCopyAddress(publicKey, id);
          }}
        >
          <Text style={styles.walletAddress}>
            {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
          </Text>
          {isCopied ? (
            <Check size={14} color={colors.success} />
          ) : (
            <Copy size={14} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    paddingHorizontal: scale(16),
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeWalletCard: {
    // borderColor: colors.primary,
    backgroundColor: colors.backgroundLight,
  },
  walletInfo: {
    flex: 1,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  walletName: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  walletAddress: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginRight: scale(8),
  },
});

export default WalletItem;
