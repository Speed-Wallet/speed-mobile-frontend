import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Settings, Plus } from 'lucide-react-native';
import colors from '@/constants/colors';
import { SecureMMKVStorage } from '@/utils/mmkvStorage';
import ScreenContainer from '@/components/ScreenContainer';

interface DevStartupScreenProps {
  onCreateWallet: () => void;
  onEnterApp: () => void;
  hasExistingWallet: boolean;
}

export default function DevStartupScreen({
  onCreateWallet,
  onEnterApp,
  hasExistingWallet,
}: DevStartupScreenProps) {
  const handleCreateWallet = async () => {
    Alert.alert(
      'Clear Wallet Data',
      'This will delete all existing wallet data including seed phrases. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear & Create',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all wallet-related data
              SecureMMKVStorage.multiRemove([
                'solanaWalletsList',
                'solanaActiveWallet',
                'appPin',
                'appSalt',
                'appIV',
                'masterMnemonic',
              ]);
              onCreateWallet();
            } catch (error) {
              console.error('Error clearing wallet data:', error);
              Alert.alert('Error', 'Failed to clear wallet data');
            }
          },
        },
      ],
    );
  };

  const handleEnterApp = () => {
    if (hasExistingWallet) {
      onEnterApp();
    } else {
      Alert.alert('No Wallet', 'Please create a wallet first');
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Settings size={32} color={colors.warning} strokeWidth={2} />
          </View>

          <Text style={styles.title}>Development Mode</Text>
          <Text style={styles.subtitle}>Choose an option to continue</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateWallet}
          >
            <Plus size={24} color={colors.white} strokeWidth={2} />
            <Text style={styles.createButtonText}>Create New Wallet</Text>
            <Text style={styles.createButtonSubtext}>
              Clears all existing data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.enterButton,
              !hasExistingWallet && styles.enterButtonDisabled,
            ]}
            onPress={handleEnterApp}
            disabled={!hasExistingWallet}
          >
            <Text
              style={[
                styles.enterButtonText,
                !hasExistingWallet && styles.enterButtonTextDisabled,
              ]}
            >
              Enter App
            </Text>
            <Text
              style={[
                styles.enterButtonSubtext,
                !hasExistingWallet && styles.enterButtonSubtextDisabled,
              ]}
            >
              {hasExistingWallet ? 'Use existing wallet' : 'No wallet found'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.devWarning}>
          This screen only appears in development mode
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    gap: 20,
  },
  createButton: {
    backgroundColor: colors.error,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.white,
    textAlign: 'center',
  },
  createButtonSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.white + '80',
    textAlign: 'center',
  },
  enterButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  enterButtonDisabled: {
    backgroundColor: colors.backgroundMedium,
  },
  enterButtonText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.white,
    textAlign: 'center',
  },
  enterButtonTextDisabled: {
    color: colors.textSecondary,
  },
  enterButtonSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.white + '80',
    textAlign: 'center',
  },
  enterButtonSubtextDisabled: {
    color: colors.textSecondary,
  },
  devWarning: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.warning,
    textAlign: 'center',
    marginTop: 'auto',
  },
});
