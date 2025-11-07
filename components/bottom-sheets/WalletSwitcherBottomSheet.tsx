import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { StyleSheet, BackHandler, Alert } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  useBottomSheetScrollableCreator,
} from '@gorhom/bottom-sheet';
import SettingsHeader from '@/components/SettingsHeader';
import colors from '@/constants/colors';
import { scale } from 'react-native-size-matters';
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
import WalletListContent from './wallet-switcher/WalletListContent';
import CreateWalletContent from './wallet-switcher/CreateWalletContent';
import ImportWalletContent from './wallet-switcher/ImportWalletContent';
import AddWalletOptions from './wallet-switcher/AddWalletOptions';
import WalletNameInput from './wallet-switcher/WalletNameInput';
import BottomSheetScreenContainer from '@/components/bottom-sheets/BottomSheetScreenContainer';

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
  present: () => void;
  dismiss: () => void;
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
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // Create scrollable component for FlashList
  const BottomSheetFlashListScrollable = useBottomSheetScrollableCreator();

  useImperativeHandle(ref, () => ({
    present: () => {
      setViewMode('list');
      loadWallets();
      bottomSheetRef.current?.present();
    },
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }));

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!isSheetOpen) {
          return false;
        }

        if (viewMode === 'create' || viewMode === 'import') {
          setViewMode('add');
          return true;
        } else if (viewMode === 'name-import') {
          setViewMode('import');
          return true;
        } else if (viewMode === 'add') {
          setViewMode('list');
          return true;
        } else if (viewMode === 'list') {
          bottomSheetRef.current?.dismiss();
          return true;
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
        bottomSheetRef.current?.dismiss();
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

  const handleDeleteWallet = async (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId);

    if (wallet?.isMasterWallet) {
      // This should never happen as the button is hidden, but double-check
      return;
    }

    Alert.alert(
      'Remove Wallet',
      `Are you sure you want to remove "${wallet?.name}" from this device? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await removeWalletFromList(walletId);
              await loadWallets();
              // Don't call onDeleteWallet - it would show an unwanted alert
              // Just refresh the parent's data via onSuccess callback
              onSuccess?.();
            } catch (error) {
              console.error('Error deleting wallet:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
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
    bottomSheetRef.current?.dismiss();
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
      case 'list':
        return (
          <WalletListContent
            wallets={wallets}
            loading={loading}
            copiedAddressId={copiedAddressId}
            onSwitchWallet={handleSwitchWallet}
            onCopyAddress={copyAddress}
            onDeleteWallet={handleDeleteWallet}
            onAddWalletPress={() => setViewMode('add')}
            renderScrollComponent={BottomSheetFlashListScrollable}
          />
        );
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
        return null;
    }
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      enableDynamicSizing
      onChange={(index: number) => {
        setIsSheetOpen(index >= 0);
      }}
    >
      <BottomSheetView key={viewMode} style={styles.container}>
        <SettingsHeader
          title={getTitle()}
          onClose={handleClose}
          noPadding={false}
        />

        <BottomSheetScreenContainer edges={['bottom']}>
          {renderContent()}
        </BottomSheetScreenContainer>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

WalletSwitcherBottomSheet.displayName = 'WalletSwitcherBottomSheet';

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: colors.bottomSheetBackground,
  },
  handleIndicator: {
    backgroundColor: colors.textSecondary,
  },
  container: {
    flex: 1,
    paddingHorizontal: scale(16),
    // paddingBottom: 24,
    backgroundColor: colors.bottomSheetBackground,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WalletSwitcherBottomSheet;
