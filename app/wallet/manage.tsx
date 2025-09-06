import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Wallet, Key } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import colors from '@/constants/colors';
import BackButton from '@/components/buttons/BackButton';

const walletOptions = [
  {
    id: 'new',
    title: 'Create New Account',
    subtitle: 'Create a new wallet account',
    icon: <Plus size={20} color={colors.textPrimary} />,
    route: '/wallet/create',
  },
  {
    id: 'hardware',
    title: 'Connect Hardware Wallet',
    subtitle: 'Ledger, Trezor, etc.',
    icon: <Wallet size={20} color={colors.textPrimary} />,
    route: '/wallet/connect',
  },
  {
    id: 'import',
    title: 'Import Recovery Phrase',
    subtitle: 'Import existing wallet',
    icon: <Key size={20} color={colors.textPrimary} />,
    route: '/wallet/import',
  },
];

export default function WalletManageScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Manage Wallets</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>MANAGE WALLETS</Text>

        {walletOptions.map((option, index) => (
          <Animated.View key={option.id} entering={FadeIn.delay(index * 100)}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => router.push(option.route as any)}
            >
              <View style={styles.iconContainer}>{option.icon}</View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        <View style={styles.existingWallets}>
          <Text style={styles.sectionTitle}>YOUR WALLETS</Text>

          <View style={styles.walletCard}>
            <Text style={styles.walletName}>WALLET #1</Text>
            <View style={styles.backupSection}>
              <Text style={styles.backupTitle}>Secure phrase backup</Text>
              <View style={styles.backupMethods}>
                <View style={styles.backupMethod}>
                  <Text style={styles.backupMethodName}>Google Drive</Text>
                  <Text style={styles.backupStatus}>Active</Text>
                </View>
                <View style={styles.backupMethod}>
                  <Text style={styles.backupMethodName}>Manual</Text>
                  <Text style={[styles.backupStatus, styles.backupPending]}>
                    Back up now
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  existingWallets: {
    marginTop: 24,
  },
  walletCard: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
  },
  walletName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  backupSection: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
  },
  backupTitle: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  backupMethods: {
    gap: 8,
  },
  backupMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backupMethodName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
  },
  backupStatus: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.success,
  },
  backupPending: {
    color: colors.error,
  },
});
