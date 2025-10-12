import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import SettingsHeader from '@/components/SettingsHeader';
import colors from '@/constants/colors';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { setStringAsync } from 'expo-clipboard';
import {
  getAllStoredWallets,
  getActiveWalletId,
  switchToWalletUnlocked,
  generateSolanaWalletFromMaster,
  saveWalletWithAppPin,
  removeWalletFromList,
  importWalletFromMnemonic,
} from '@/services/walletService';
import WalletListContent from '@/components/wallet-switcher/WalletListContent';
import CreateWalletContent from '@/components/wallet-switcher/CreateWalletContent';
import ImportWalletContent from '@/components/wallet-switcher/ImportWalletContent';
import AddWalletOptions from '@/components/wallet-switcher/AddWalletOptions';
import WalletNameInput from '@/components/wallet-switcher/WalletNameInput';

interface WalletInfo {
  id: string;
  name: string;
  publicKey: string;
  isActive: boolean;
  isMasterWallet?: boolean;
}

type ViewMode = 'list' | 'add' | 'create' | 'import' | 'name-import';

interface WalletSwitcherBottomSheetProps {
  onDeleteWallet: (walletId: string, isMasterWallet?: boolean) => void;
  onWalletSwitch?: () => void;
  onSuccess?: () => void;
}

export interface WalletSwitcherBottomSheetRef {
  expand: () => void;
  close: () => void;
}

const WalletSwitcherBottomSheet = forwardRef<
  WalletSwitcherBottomSheetRef,
  WalletSwitcherBottomSheetProps
>(({ onDeleteWallet, onWalletSwitch, onSuccess }, ref) => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedAddressId, setCopiedAddressId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [importedSeedPhrase, setImportedSeedPhrase] = useState<string>('');
  const bottomSheetRef = useRef<BottomSheet>(null);

  useImperativeHandle(ref, () => ({
    expand: () => {
      setViewMode('list');
      loadWallets();
      bottomSheetRef.current?.expand();
    },
    close: () => bottomSheetRef.current?.close(),
  }));

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!isSheetOpen) {
          return false; // Let default behavior handle it
        }

        if (viewMode === 'create' || viewMode === 'import') {
          setViewMode('add');
          return true; // Prevent default behavior
        } else if (viewMode === 'name-import') {
          setViewMode('import');
          return true; // Prevent default behavior
        } else if (viewMode === 'add') {
          setViewMode('list');
          return true; // Prevent default behavior
        } else if (viewMode === 'list') {
          bottomSheetRef.current?.close();
          return true; // Prevent default behavior
        }

        return false;
      },
    );

    return () => backHandler.remove();
  }, [viewMode, isSheetOpen]);

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

  const handleSwitchWallet = async (walletId: string) => {
    try {
      setLoading(true);
      const isSuccess = await switchToWalletUnlocked(walletId);
      if (isSuccess) {
        await loadWallets();
        onWalletSwitch?.();
        // Close the bottom sheet after successful switch
        bottomSheetRef.current?.close();
      }
    } catch (error) {
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
      await loadWallets();
      onSuccess?.();
      setViewMode('list');
    } catch (error: any) {
      console.error('Error creating wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedPhraseSubmit = (seedPhrase: string) => {
    setImportedSeedPhrase(seedPhrase);
    setViewMode('name-import');
  };

  const handleImportWalletNameSubmit = async (walletName: string) => {
    setLoading(true);
    try {
      const cleanPhrase = importedSeedPhrase.trim().toLowerCase();
      const wallet = await importWalletFromMnemonic(cleanPhrase);
      const walletId = `wallet_${Date.now()}`;
      const accountIndex = 0;
      const derivationPath = "m/44'/501'/0'/0'";
      await saveWalletWithAppPin(
        walletId,
        walletName.trim(),
        wallet.mnemonic,
        wallet.publicKey,
        accountIndex,
        derivationPath,
      );
      await loadWallets();
      onSuccess?.();
      setViewMode('list');
      setImportedSeedPhrase('');
    } catch (error: any) {
      console.error('Error importing wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.5}
    />
  );

  const handleClose = () => {
    if (viewMode === 'create' || viewMode === 'import') {
      setViewMode('add');
    } else if (viewMode === 'name-import') {
      setViewMode('import');
    } else if (viewMode === 'add') {
      setViewMode('list');
    } else {
      bottomSheetRef.current?.close();
    }
  };

  const getTitle = () => {
    switch (viewMode) {
      case 'add':
        return 'Add Wallet';
      case 'create':
        return 'Create New Wallet';
      case 'import':
        return 'Import Wallet';
      case 'name-import':
        return 'Name Your Wallet';
      default:
        return 'Your Wallets';
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'add':
        return (
          <AddWalletOptions
            onCreateWallet={() => setViewMode('create')}
            onImportWallet={() => setViewMode('import')}
            loading={loading}
          />
        );
      case 'create':
        return (
          <CreateWalletContent
            onSubmit={handleCreateWalletSubmit}
            loading={loading}
            existingWalletNames={wallets.map((w) => w.name)}
          />
        );
      case 'import':
        return (
          <ImportWalletContent
            onSubmit={handleSeedPhraseSubmit}
            loading={loading}
          />
        );
      case 'name-import':
        return (
          <WalletNameInput
            onSubmit={handleImportWalletNameSubmit}
            loading={loading}
            existingWalletNames={wallets.map((w) => w.name)}
            buttonTitle="Import Wallet"
            loadingTitle="Importing..."
          />
        );
      default:
        return (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <WalletListContent
              wallets={wallets}
              loading={loading}
              copiedAddressId={copiedAddressId}
              onSwitchWallet={handleSwitchWallet}
              onCopyAddress={copyAddress}
              onAddWalletPress={() => setViewMode('add')}
            />
          </ScrollView>
        );
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      enableDynamicSizing
      onChange={(index) => {
        setIsSheetOpen(index >= 0);
      }}
    >
      <BottomSheetView style={styles.container}>
        <SettingsHeader
          title={getTitle()}
          onClose={handleClose}
          noPadding={false}
        />

        {renderContent()}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
});

WalletSwitcherBottomSheet.displayName = 'WalletSwitcherBottomSheet';

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: colors.backgroundDark,
  },
  handleIndicator: {
    backgroundColor: colors.textSecondary,
  },
  container: {
    flex: 1,
    paddingHorizontal: scale(16),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(20),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WalletSwitcherBottomSheet;
