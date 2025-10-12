import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Key } from 'lucide-react-native';
import colors from '@/constants/colors';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface AddWalletOptionsProps {
  onCreateWallet: () => void;
  onImportWallet: () => void;
  loading: boolean;
}

const ICON_SIZE = 18;

const AddWalletOptions: React.FC<AddWalletOptionsProps> = ({
  onCreateWallet,
  onImportWallet,
  loading,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.actionCard}
        onPress={onCreateWallet}
        disabled={loading}
      >
        <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
          <Plus size={ICON_SIZE} color={colors.primaryText} />
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Create New Wallet</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionCard}
        onPress={onImportWallet}
        disabled={loading}
      >
        <View style={[styles.actionIcon, { backgroundColor: colors.success }]}>
          <Key size={ICON_SIZE} color={colors.primaryText} />
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Import Wallet</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // paddingVertical: verticalScale(20),
    flexDirection: 'column',
    gap: 6,
    marginBottom: verticalScale(12),
  },
  title: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: verticalScale(12),
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(12),
    padding: scale(16),
    // marginBottom: verticalScale(12),
  },
  actionIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(16),
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: verticalScale(4),
  },
  actionSubtitle: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
});

export default AddWalletOptions;
