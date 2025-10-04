import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Key, Check, Copy, RefreshCw, Trash2 } from 'lucide-react-native';
import { useAlert } from '@/providers/AlertProvider';
import colors from '@/constants/colors';
import SettingsScreen from '@/components/SettingsScreen';
import CreateWalletBottomSheet, {
  CreateWalletBottomSheetRef,
} from '@/components/bottom-sheets/CreateWalletBottomSheet';
import ImportWalletBottomSheet, {
  ImportWalletBottomSheetRef,
} from '@/components/bottom-sheets/ImportWalletBottomSheet';
import {
  generateSolanaWalletFromMaster,
  getAllStoredWallets,
  saveWalletWithAppPin,
  removeWalletFromList,
  getActiveWalletId,
  switchToWalletUnlocked,
  importWalletFromMnemonic,
} from '@/services/walletService';
import { setStringAsync } from 'expo-clipboard';

interface WalletInfo {
  id: string;
  name: string;
  publicKey: string;
  isActive: boolean;
  isMasterWallet?: boolean;
}

export default function WalletsScreen() {
  const router = useRouter();
  const { alert, error: showError, success, confirm } = useAlert();
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedAddressId, setCopiedAddressId] = useState<string | null>(null);

  const createWalletRef = useRef<CreateWalletBottomSheetRef>(null);
  const importWalletRef = useRef<ImportWalletBottomSheetRef>(null);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const storedWallets = await getAllStoredWallets();
      const activeWalletId = await getActiveWalletId();

      const walletInfos: WalletInfo[] = storedWallets.map((wallet) => ({
        id: wallet.id,
        name: wallet.name,
        publicKey: wallet.publicKey,
        isActive: wallet.id === activeWalletId,
        isMasterWallet: wallet.isMasterWallet,
      }));

      setWallets(walletInfos);
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  const handleCreateWallet = () => {
    createWalletRef.current?.expand();
  };

  const handleImportWallet = () => {
    importWalletRef.current?.expand();
  };

  const handleCreateWalletSubmit = async (walletName: string) => {
    setLoading(true);
    try {
      const wallet = await generateSolanaWalletFromMaster();
      const walletId = `wallet_${Date.now()}`;
      await saveWalletWithAppPin(
        walletId,
        walletName.trim(),
        wallet.mnemonic,
        wallet.publicKey,
        wallet.accountIndex,
        wallet.derivationPath,
      );
      await loadWallets(); // Reload the wallet list to show the new wallet
      success('Wallet created successfully!');
      createWalletRef.current?.close();
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      showError('Failed to create wallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportWalletSubmit = async (
    walletName: string,
    seedPhrase: string,
  ) => {
    setLoading(true);
    try {
      const cleanPhrase = seedPhrase.trim().toLowerCase();
      const wallet = await importWalletFromMnemonic(cleanPhrase);
      const walletId = `wallet_${Date.now()}`;
      const accountIndex = 0; // Imported wallets use the first derivation (m/44'/501'/0'/0')
      const derivationPath = "m/44'/501'/0'/0'";
      await saveWalletWithAppPin(
        walletId,
        walletName.trim(),
        wallet.mnemonic,
        wallet.publicKey,
        accountIndex,
        derivationPath,
      );
      await loadWallets(); // Reload the wallet list to show the imported wallet
      success('Wallet imported successfully!');
      importWalletRef.current?.close();
    } catch (error: any) {
      console.error('Error importing wallet:', error);
      showError('Failed to import wallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBottomSheetClose = () => {
    // Bottom sheet closed, no action needed
  };

  const handleDeleteWallet = (walletId: string, isMasterWallet?: boolean) => {
    if (isMasterWallet) {
      alert(
        'Cannot Delete Main Wallet',
        'The main wallet cannot be deleted as it contains the master seed phrase for your account.',
        [{ text: 'OK', style: 'default' }],
        'warning',
      );
      return;
    }

    confirm(
      'Delete Wallet',
      'Are you sure you want to delete this wallet? This action cannot be undone.',
      () => deleteWallet(walletId),
    );
  };

  const deleteWallet = async (walletId: string) => {
    try {
      await removeWalletFromList(walletId);
      await loadWallets();
      success('Success', 'Wallet deleted successfully.');
    } catch (error) {
      showError('Error', 'Failed to delete wallet.');
      console.error('Error deleting wallet:', error);
    }
  };

  const handleSwitchWallet = async (walletId: string) => {
    try {
      setLoading(true);
      const isSuccess = await switchToWalletUnlocked(walletId);
      if (isSuccess) {
        loadWallets();
      } else {
        showError('Error', 'Failed to switch wallet.');
      }
    } catch (error) {
      showError('Error', 'Failed to switch wallet. Please try again.');
      console.error('Error switching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = async (publicKey: string, walletId: string) => {
    await setStringAsync(publicKey);
    setCopiedAddressId(walletId);

    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedAddressId(null);
    }, 2000);
  };

  return (
    <SettingsScreen title="Wallets" scrollable={false}>
      <View style={styles.content}>
        <ScrollView
          style={styles.scrollableContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Wallets */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Wallets</Text>

            {wallets.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No wallets found</Text>
                <Text style={styles.emptySubtitle}>
                  Create or import a wallet to get started
                </Text>
              </View>
            ) : (
              wallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id}
                  style={styles.walletCard}
                  onPress={() =>
                    !wallet.isActive && handleSwitchWallet(wallet.id)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.walletInfo}>
                    <View style={styles.walletHeader}>
                      <Text style={styles.walletName}>{wallet.name}</Text>
                      {wallet.isActive && (
                        <View style={styles.activeBadge}>
                          <Check size={12} color={colors.white} />
                          <Text style={styles.activeText}>Active</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.addressContainer}
                      onPress={(e) => {
                        e.stopPropagation();
                        copyAddress(wallet.publicKey, wallet.id);
                      }}
                    >
                      <Text style={styles.walletAddress}>
                        {wallet.publicKey.slice(0, 8)}...
                        {wallet.publicKey.slice(-8)}
                      </Text>
                      {copiedAddressId === wallet.id ? (
                        <Check size={14} color={colors.success} />
                      ) : (
                        <Copy size={14} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.walletActions}>
                    {!wallet.isMasterWallet && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteWallet(wallet.id, wallet.isMasterWallet);
                        }}
                      >
                        <Trash2 size={18} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Wallet</Text>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleCreateWallet}
            >
              <View
                style={[styles.actionIcon, { backgroundColor: colors.primary }]}
              >
                <Plus size={20} color={colors.white} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Create New Wallet</Text>
                <Text style={styles.actionSubtitle}>
                  Generate a new wallet with seed phrase
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleImportWallet}
            >
              <View
                style={[styles.actionIcon, { backgroundColor: colors.success }]}
              >
                <Key size={20} color={colors.white} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Import Wallet</Text>
                <Text style={styles.actionSubtitle}>
                  Import existing wallet using seed phrase
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Bottom Sheets */}
      <CreateWalletBottomSheet
        ref={createWalletRef}
        onCreateWallet={handleCreateWalletSubmit}
        onClose={handleBottomSheetClose}
        loading={loading}
        existingWalletNames={wallets.map((w) => w.name)}
      />

      <ImportWalletBottomSheet
        ref={importWalletRef}
        onImportWallet={handleImportWalletSubmit}
        onClose={handleBottomSheetClose}
        loading={loading}
        existingWalletNames={wallets.map((w) => w.name)}
      />
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollableContent: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginRight: 12,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: colors.white,
    marginLeft: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletAddress: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginRight: 8,
  },
  walletActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
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
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  disabledCard: {
    opacity: 0.6,
  },
  disabledText: {
    color: colors.textSecondary,
  },
});
