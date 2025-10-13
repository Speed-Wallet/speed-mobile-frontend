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
    <View style={[styles.walletCard, isActive && styles.activeWalletCard]}>
      <TouchableOpacity
        style={styles.walletMainArea}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={loading || isActive}
      >
        <View style={styles.walletInfo}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletName}>{name}</Text>
          </View>
          <Text style={styles.walletAddress}>
            {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.copyButton}
        onPress={() => onCopyAddress(publicKey, id)}
        activeOpacity={0.7}
      >
        {isCopied ? (
          <Check size={20} color={colors.success} />
        ) : (
          <Copy size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  walletCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeWalletCard: {
    backgroundColor: colors.backgroundLight,
  },
  walletMainArea: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    justifyContent: 'center',
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
    fontSize: moderateScale(14),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  walletAddress: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  copyButton: {
    width: scale(50),
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: colors.backgroundLight,
    // borderLeftWidth: 1,
    borderLeftColor: colors.backgroundDark,
  },
});

export default WalletItem;
