import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Key, Check, Copy, RefreshCw, Trash2 } from 'lucide-react-native';
import colors from '@/constants/colors';
import BackButton from '@/components/BackButton';
import { 
  generateSolanaWallet, 
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
}

export default function WalletsScreen() {
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPhrase, setImportPhrase] = useState('');
  const [walletName, setWalletName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const storedWallets = await getAllStoredWallets();
      const activeWalletId = await getActiveWalletId();
      
      const walletInfos: WalletInfo[] = storedWallets.map(wallet => ({
        id: wallet.id,
        name: wallet.name,
        publicKey: wallet.publicKey,
        isActive: wallet.id === activeWalletId
      }));
      
      setWallets(walletInfos);
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  const handleCreateWallet = () => {
    setWalletName('');
    setShowCreateModal(true);
  };

  const handleImportWallet = () => {
    setImportPhrase('');
    setWalletName('');
    setShowImportModal(true);
  };

  const validateWalletName = () => {
    if (walletName.trim().length < 3) {
      Alert.alert('Invalid Name', 'Wallet name must be at least 3 characters long.');
      return false;
    }
    return true;
  };

  const processCreateWallet = async () => {
    if (!validateWalletName()) return;

    setLoading(true);
    try {
      const wallet = await generateSolanaWallet();
      const walletId = `wallet_${Date.now()}`;
      await saveWalletWithAppPin(walletId, walletName.trim(), wallet.mnemonic, wallet.publicKey);
      
      Alert.alert('Success', 'Wallet created successfully!', [
        { text: 'OK', onPress: () => {
          setShowCreateModal(false);
          loadWallets();
        }}
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create wallet. Please try again.');
      console.error('Error creating wallet:', error);
    }
    setLoading(false);
  };

  const processImportWallet = async () => {
    if (!validateWalletName()) return;

    if (!importPhrase.trim()) {
      Alert.alert('Invalid Phrase', 'Please enter a valid seed phrase.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhrase = importPhrase.trim().toLowerCase();
      const wallet = await importWalletFromMnemonic(cleanPhrase);
      const walletId = `wallet_${Date.now()}`;
      await saveWalletWithAppPin(walletId, walletName.trim(), wallet.mnemonic, wallet.publicKey);
      
      Alert.alert('Success', 'Wallet imported successfully!', [
        { text: 'OK', onPress: () => {
          setShowImportModal(false);
          loadWallets();
        }}
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to import wallet. Please try again.');
      console.error('Error importing wallet:', error);
    }
    setLoading(false);
  };

  const handleDeleteWallet = (walletId: string) => {
    Alert.alert(
      'Delete Wallet',
      'Are you sure you want to delete this wallet? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteWallet(walletId) }
      ]
    );
  };

  const deleteWallet = async (walletId: string) => {
    try {
      await removeWalletFromList(walletId);
      await loadWallets();
      Alert.alert('Success', 'Wallet deleted successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete wallet.');
      console.error('Error deleting wallet:', error);
    }
  };

  const handleSwitchWallet = async (walletId: string) => {
    try {
      setLoading(true);
      const success = await switchToWalletUnlocked(walletId);
      if (success) {
        Alert.alert('Success', 'Wallet switched successfully! No PIN required.', [
          { text: 'OK', onPress: () => {
            loadWallets();
          }}
        ]);
      } else {
        Alert.alert('Error', 'Failed to switch wallet.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to switch wallet. Please try again.');
      console.error('Error switching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = async (publicKey: string) => {
    await setStringAsync(publicKey);
    Alert.alert('Copied', 'Wallet address copied to clipboard');
  };

  const renderModalContent = () => {
    return (
      <>
        <Text style={styles.modalTitle}>
          {showCreateModal ? 'Create New Wallet' : 'Import Wallet'}
        </Text>
        <Text style={styles.modalSubtitle}>
          {showCreateModal ? 'Give your wallet a name' : 'Import your existing wallet'}
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Wallet name (e.g., Main Wallet)"
          placeholderTextColor={colors.textSecondary}
          value={walletName}
          onChangeText={setWalletName}
          autoFocus
        />

        {showImportModal && (
          <>
            <Text style={styles.inputLabel}>Seed Phrase</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your 12 or 24 word seed phrase"
              placeholderTextColor={colors.textSecondary}
              value={importPhrase}
              onChangeText={setImportPhrase}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Wallets</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Wallets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Wallets</Text>
          
          {wallets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No wallets found</Text>
              <Text style={styles.emptySubtitle}>Create or import a wallet to get started</Text>
            </View>
          ) : (
            wallets.map((wallet) => (
              <TouchableOpacity 
                key={wallet.id} 
                style={styles.walletCard}
                onPress={() => !wallet.isActive && handleSwitchWallet(wallet.id)}
                activeOpacity={wallet.isActive ? 1 : 0.7}
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
                      copyAddress(wallet.publicKey);
                    }}
                  >
                    <Text style={styles.walletAddress}>
                      {wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-8)}
                    </Text>
                    <Copy size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.walletActions}>
                  {!wallet.isActive && (
                    <TouchableOpacity 
                      style={styles.switchButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleSwitchWallet(wallet.id);
                      }}
                    >
                      <RefreshCw size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteWallet(wallet.id);
                    }}
                  >
                    <Trash2 size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Wallet</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleCreateWallet}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
              <Plus size={20} color={colors.white} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Create New Wallet</Text>
              <Text style={styles.actionSubtitle}>Generate a new wallet with seed phrase</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleImportWallet}>
            <View style={[styles.actionIcon, { backgroundColor: colors.warning }]}>
              <Key size={20} color={colors.white} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Import Wallet</Text>
              <Text style={styles.actionSubtitle}>Import existing wallet using seed phrase</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
            {renderModalContent()}
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={showCreateModal ? processCreateWallet : processImportWallet}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {showCreateModal ? 'Create Wallet' : 'Import Wallet'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  switchButton: {
    padding: 8,
    marginRight: 8,
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
});
