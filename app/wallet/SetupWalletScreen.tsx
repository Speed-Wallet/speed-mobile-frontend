import React, { useState } from 'react';
import {
  View,
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  generateInitialSolanaWallet,
  saveWalletToList,
  createAppPin,
  importWalletFromMnemonic,
} from '@/services/walletService';
import { createUser } from '@/services/apis';
import { AuthService } from '@/services/authService';
import { useAlert } from '@/providers/AlertProvider';
import colors from '@/constants/colors';
import CreateWalletIntroStep from '@/components/wallet/CreateWalletIntroStep';
import ShowMnemonicStep from '@/components/wallet/ShowMnemonicStep';
import SeedPhraseVerificationStep from '@/components/wallet/SeedPhraseVerificationStep';
import CreateUsernameStep from '@/components/wallet/CreateUsernameStep';
import CreatePinStep from '@/components/wallet/CreatePinStep';
import ConfirmPinStep from '@/components/wallet/ConfirmPinStep';
import { X } from 'lucide-react-native';
import 'react-native-get-random-values';

interface SetupWalletScreenProps {
  onWalletSetupComplete: () => void;
}

const SetupWalletScreen: React.FC<SetupWalletScreenProps> = ({
  onWalletSetupComplete,
}) => {
  const { alert, error: showError, success } = useAlert();
  const [step, setStep] = useState(1); // 1: Initial, 2: Show Mnemonic, 3: Verify Mnemonic, 4: Username, 5: Create PIN, 6: Confirm PIN
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [accountIndex, setAccountIndex] = useState<number | undefined>(
    undefined,
  );
  const [derivationPath, setDerivationPath] = useState<string | undefined>(
    undefined,
  );
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string>('');

  // Import wallet states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPhrase, setImportPhrase] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleCreateWallet = async () => {
    setIsLoading(true);
    try {
      const wallet = await generateInitialSolanaWallet();
      setMnemonic(wallet.mnemonic);
      setPublicKey(wallet.publicKey);
      setAccountIndex(wallet.accountIndex);
      setDerivationPath(wallet.derivationPath);
      setStep(2);
    } catch (error) {
      showError('Error', 'Could not generate wallet. Please try again.');
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleMnemonicSaved = () => {
    // Move to verification step
    setStep(3); // Move to mnemonic verification
  };

  const handleVerificationSuccess = () => {
    // Move to username creation after successful verification
    setStep(4); // Move to username creation
  };

  const handleUsernameNext = async (selectedUsername: string) => {
    if (!publicKey) {
      showError('Error', 'Public key not available. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      // Create user in backend
      const result = await createUser(selectedUsername, publicKey);

      if (!result.success) {
        // Handle specific error cases
        if (
          result.error?.includes('User already exists') ||
          result.statusCode === 409
        ) {
          // Throw error to let the child component handle the visual feedback
          throw new Error('Username already exists');
        } else {
          showError(
            'Error',
            result.error || 'Failed to create user. Please try again.',
          );
        }
        return;
      }

      // If successful, store username locally and proceed
      await AuthService.storeUsername(selectedUsername);
      setUsername(selectedUsername);
      setStep(5); // Move to PIN creation
    } catch (error) {
      console.error('Error in handleUsernameNext:', error);

      // Only show alert for unknown errors, not for username taken
      if (
        error instanceof Error &&
        error.message !== 'Username already exists'
      ) {
        showError(
          'Error',
          'Failed to create user. Please check your connection and try again.',
        );
      }

      // Re-throw the error so the child component can handle the visual feedback
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPin = () => {
    if (pin.length < 4) {
      // Basic PIN validation
      showError('Invalid PIN', 'PIN must be at least 4 digits.');
      return;
    }
    setStep(6); // Move to PIN confirmation
  };

  const handleImportWallet = () => {
    setShowImportModal(true);
  };

  const processImportWallet = async () => {
    if (!importPhrase.trim()) {
      showError('Invalid Phrase', 'Please enter a valid seed phrase.');
      return;
    }

    setIsImporting(true);
    try {
      const cleanPhrase = importPhrase.trim().toLowerCase();
      const wallet = await importWalletFromMnemonic(cleanPhrase);

      // Set the imported wallet data and proceed to verification
      setMnemonic(wallet.mnemonic);
      setPublicKey(wallet.publicKey);
      setShowImportModal(false);
      setStep(3); // Move to verification
    } catch (error) {
      showError(
        'Error',
        'Failed to import wallet. Please check your seed phrase and try again.',
      );
      console.error('Error importing wallet:', error);
    }
    setIsImporting(false);
  };

  const handleConfirmPinChange = (newPin: string) => {
    setConfirmPin(newPin);
    // Clear error when user starts typing
    if (pinError) {
      setPinError('');
    }
  };

  const handleConfirmSave = async () => {
    if (!mnemonic || !publicKey) return;
    if (pin !== confirmPin) {
      setPinError(
        'Incorrect PIN entered. The PINs do not match. Please try again.',
      );
      return;
    }
    if (pin.length < 4) {
      setPinError('Invalid PIN. PIN must be at least 4 digits.');
      return;
    }

    setIsLoading(true);
    try {
      // Create the app-level PIN first (this is the first wallet)
      await createAppPin(pin);

      // Generate unique wallet ID and save to multi-wallet system using app PIN
      const walletId = `wallet-${Date.now()}`;
      const walletName = 'Main';
      await saveWalletToList(
        walletId,
        walletName,
        mnemonic,
        publicKey,
        pin,
        accountIndex,
        derivationPath,
      );

      success(
        'Success',
        'Your wallet has been created and secured with a PIN. Keep your seed phrase and PIN safe!',
      );
      onWalletSetupComplete();
    } catch (error) {
      showError('Error', 'Could not save wallet. Please try again.');
    }
    setIsLoading(false);
  };

  const handleBackToCreatePin = () => {
    setPin('');
    setConfirmPin('');
    setPinError('');
    setStep(5);
  };

  return (
    <View style={{ flex: 1 }}>
      {isLoading && (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: [{ translateX: -25 }, { translateY: -25 }],
            zIndex: 1000,
          }}
        />
      )}

      {step === 1 && (
        <CreateWalletIntroStep
          onCreateWallet={handleCreateWallet}
          onImportWallet={handleImportWallet}
          isLoading={isLoading}
        />
      )}

      {step === 2 && mnemonic && publicKey && (
        <ShowMnemonicStep
          mnemonic={mnemonic}
          publicKey={publicKey}
          onNext={handleMnemonicSaved}
          isLoading={isLoading}
        />
      )}

      {step === 3 && mnemonic && (
        <SeedPhraseVerificationStep
          words={mnemonic.split(' ')}
          onBack={() => setStep(2)}
          onSuccess={handleVerificationSuccess}
          isLoading={isLoading}
        />
      )}

      {step === 4 && (
        <CreateUsernameStep
          onNext={handleUsernameNext}
          onBack={() => setStep(3)}
          isLoading={isLoading}
        />
      )}

      {step === 5 && (
        <CreatePinStep
          pin={pin}
          onPinChange={setPin}
          onNext={handleSetPin}
          onBack={() => setStep(4)}
          isLoading={isLoading}
        />
      )}

      {step === 6 && (
        <ConfirmPinStep
          confirmPin={confirmPin}
          onConfirmPinChange={handleConfirmPinChange}
          onConfirm={handleConfirmSave}
          onBack={handleBackToCreatePin}
          isLoading={isLoading}
          pinError={pinError}
        />
      )}

      {/* Import Wallet Modal */}
      <Modal
        visible={showImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowImportModal(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Import Wallet</Text>
            <Text style={styles.modalSubtitle}>
              Enter your existing wallet's seed phrase
            </Text>

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
              autoFocus
            />

            {/* Dev Button */}
            {process.env.EXPO_PUBLIC_APP_ENV === 'development' && (
              <TouchableOpacity
                style={styles.devButton}
                onPress={() =>
                  setImportPhrase(process.env.EXPO_PUBLIC_DEV_SEED_PHRASE || '')
                }
              >
                <Text style={styles.devButtonText}>DEV</Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isImporting && styles.buttonDisabled,
                ]}
                onPress={processImportWallet}
                disabled={isImporting}
              >
                <Text style={styles.primaryButtonText}>
                  {isImporting ? 'Importing...' : 'Import Wallet'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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

export default SetupWalletScreen;
