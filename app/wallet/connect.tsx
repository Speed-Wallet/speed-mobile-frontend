import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bluetooth, Zap } from 'lucide-react-native';
import colors from '@/constants/colors';

export default function ConnectHardwareScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect Wallet</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.speedSection}>
          <Zap size={24} color={colors.warning} />
          <Text style={styles.speedText}>SPEED</Text>
          <Bluetooth size={24} color={colors.primary} />
        </View>

        <Text style={styles.subtitle}>CONNECT YOUR LEDGER HARDWARE WALLET</Text>

        <View style={styles.steps}>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Enable Bluetooth</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>Pair with your Ledger device</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Connect Accounts</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.connectButton}>
          <Text style={styles.connectButtonText}>CONNECT YOUR LEDGER</Text>
        </TouchableOpacity>
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
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  
  },
  content: {
    padding: 16,
    flex: 1,
  },
  speedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  speedText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginBottom: 24,
  },
  steps: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  stepText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
  },
  connectButton: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  connectButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});