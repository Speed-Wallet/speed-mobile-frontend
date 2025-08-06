import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  Key,
  Check,
  Copy,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react-native';
import { useAlert } from '@/providers/AlertProvider';
import colors from '@/constants/colors';
import SettingsScreen from '@/components/SettingsScreen';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPhrase, setImportPhrase] = useState('');
  const [walletName, setWalletName] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletNameError, setWalletNameError] = useState('');
  const [seedPhraseError, setSeedPhraseError] = useState('');
  const [copiedAddressId, setCopiedAddressId] = useState<string | null>(null);

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
    setWalletName('');
    setWalletNameError('');
    setShowCreateModal(true);
  };

  const handleImportWallet = () => {
    setImportPhrase('');
    setWalletName('');
    setWalletNameError('');
    setSeedPhraseError('');
    setShowImportModal(true);
  };

  const validateWalletName = (name: string) => {
    const trimmedName = name.trim();

    if (trimmedName.length < 3) {
      return 'Wallet name must be at least 3 characters long';
    }

    const existingWallet = wallets.find(
      (wallet) => wallet.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (existingWallet) {
      return 'Wallet name already exists';
    }

    return '';
  };

  const validateSeedPhrase = (phrase: string) => {
    const trimmedPhrase = phrase.trim();

    if (!trimmedPhrase) {
      return 'Seed phrase is required';
    }

    const words = trimmedPhrase.split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      return 'Seed phrase must be 12 or 24 words';
    }

    return '';
  };

  const handleWalletNameBlur = () => {
    const error = validateWalletName(walletName);
    setWalletNameError(error);
  };

  const handleSeedPhraseBlur = () => {
    const error = validateSeedPhrase(importPhrase);
    setSeedPhraseError(error);
  };

  const isFormValid = () => {
    const nameError = validateWalletName(walletName);
    if (nameError) return false;

    if (showImportModal) {
      const seedError = validateSeedPhrase(importPhrase);
      if (seedError) return false;
    }

    return true;
  };

  const processCreateWallet = async () => {
    const nameError = validateWalletName(walletName);
    if (nameError) {
      setWalletNameError(nameError);
      return;
    }

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

      success('Success', 'Wallet created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setShowCreateModal(false);
            loadWallets();
          },
        },
      ]);
    } catch (error) {
      showError('Error', 'Failed to create wallet. Please try again.');
      console.error('Error creating wallet:', error);
    }
    setLoading(false);
  };

  const processImportWallet = async () => {
    const nameError = validateWalletName(walletName);
    const seedError = validateSeedPhrase(importPhrase);

    if (nameError || seedError) {
      setWalletNameError(nameError);
      setSeedPhraseError(seedError);
      return;
    }

    setLoading(true);
    try {
      const cleanPhrase = importPhrase.trim().toLowerCase();
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

      success('Success', 'Wallet imported successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setShowImportModal(false);
            loadWallets();
          },
        },
      ]);
    } catch (error) {
      showError('Error', 'Failed to import wallet. Please try again.');
      console.error('Error importing wallet:', error);
    }
    setLoading(false);
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

  const renderModalContent = () => {
    return (
      <>
        <Text style={styles.modalTitle}>
          {showCreateModal ? 'Create New Wallet' : 'Import Wallet'}
        </Text>
        <Text style={styles.modalSubtitle}>
          {showCreateModal
            ? 'Give your wallet a name'
            : 'Import your existing wallet'}
        </Text>

        <TextInput
          style={[styles.input, walletNameError && styles.inputError]}
          placeholder="Wallet name (e.g. Wallet 2)"
          placeholderTextColor={colors.textSecondary}
          value={walletName}
          onChangeText={(text) => {
            setWalletName(text);
            if (walletNameError) setWalletNameError('');
          }}
          onBlur={handleWalletNameBlur}
          autoFocus
        />
        {walletNameError && (
          <Text style={styles.errorText}>* {walletNameError}</Text>
        )}

        {showImportModal && (
          <>
            <Text style={styles.inputLabel}>Seed Phrase</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  seedPhraseError && styles.inputError,
                ]}
                placeholder="Enter your 12 or 24 word seed phrase"
                placeholderTextColor={colors.textSecondary}
                value={importPhrase}
                onChangeText={(text) => {
                  setImportPhrase(text);
                  if (seedPhraseError) setSeedPhraseError('');
                }}
                onBlur={handleSeedPhraseBlur}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {/* Dev Button */}
              {process.env.EXPO_PUBLIC_APP_ENV === 'development' && (
                <TouchableOpacity
                  style={styles.devButton}
                  onPress={() =>
                    setImportPhrase(
                      process.env.EXPO_PUBLIC_DEV_SEED_PHRASE || '',
                    )
                  }
                >
                  <Text style={styles.devButtonText}>DEV</Text>
                </TouchableOpacity>
              )}
            </View>
            {seedPhraseError && (
              <Text style={styles.errorText}>* {seedPhraseError}</Text>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <SettingsScreen title="Wallets">
      <View style={styles.content}>
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
      </View>

      {/* Create/Import Modal */}
      <Modal
        visible={showCreateModal || showImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCreateModal(false);
          setShowImportModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowCreateModal(false);
                setShowImportModal(false);
              }}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            {renderModalContent()}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (loading || !isFormValid()) && styles.buttonDisabled,
                ]}
                onPress={
                  showCreateModal ? processCreateWallet : processImportWallet
                }
                disabled={loading || !isFormValid()}
              >
                <Text style={styles.primaryButtonText}>
                  {showCreateModal ? 'Create Wallet' : 'Import Wallet'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.backgroundDark,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.error,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.error,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  disabledCard: {
    opacity: 0.6,
  },
  disabledText: {
    color: colors.textSecondary,
  },
  inputContainer: {
    position: 'relative',
  },
  devButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  devButtonText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: colors.white,
  },
});
