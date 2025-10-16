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
    // marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
    // marginBottom: verticalScale(12),
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
});

export default AddWalletOptions;
