import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import ScreenContainer from '@/components/ScreenContainer';
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
import WalletSetupSuccessStep from '@/components/wallet/WalletSetupSuccessStep';
import ImportWalletStep from '@/components/wallet/ImportWalletStep';
import ProgressBar from '@/components/ProgressBar';
import 'react-native-get-random-values';

interface SetupWalletScreenProps {
  onWalletSetupComplete: () => void;
}

const SetupWalletScreen: React.FC<SetupWalletScreenProps> = ({
  onWalletSetupComplete,
}) => {
  const { alert, error: showError, success } = useAlert();
  const [step, setStep] = useState(1); // 1: Initial, 2: Show Mnemonic, 3: Verify Mnemonic, 4: Username, 5: Create PIN, 6: Success, 9: Import
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

  const handleSetPin = async () => {
    if (!mnemonic || !publicKey) return;

    if (pin.length < 6) {
      showError('Invalid PIN', 'PIN must be at least 6 digits.');
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

      setStep(6); // Go to success screen
    } catch (error) {
      showError('Error', 'Could not save wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWallet = () => {
    setStep(9); // Move to import step
  };

  const processImportWallet = async (seedPhrase: string) => {
    setIsImporting(true);
    try {
      const wallet = await importWalletFromMnemonic(seedPhrase);

      // Set the imported wallet data and proceed to verification
      setMnemonic(wallet.mnemonic);
      setPublicKey(wallet.publicKey);
      setStep(3); // Move to verification
    } catch (error) {
      setIsImporting(false);
      throw error; // Let the ImportWalletStep handle the error display
    }
    setIsImporting(false);
  };

  // Helper function to get progress bar info
  const getProgressInfo = () => {
    if (step === 1) return { current: 0, total: 5 }; // Initial screen - no progress bar
    if (step === 9) return { current: 1, total: 5 }; // Import wallet - step 1 of 5
    if (step === 6) return { current: 5, total: 5 }; // Success screen - full progress (step 5 of 5)

    // Normal flow: steps 2-5 map to progress 1-4
    const progressMap: { [key: number]: number } = {
      2: 1, // Show Mnemonic
      3: 2, // Verify Mnemonic
      4: 3, // Username
      5: 4, // Create PIN (includes confirm)
    };

    return {
      current: progressMap[step] || 0,
      total: 5,
    };
  };

  const progressInfo = getProgressInfo();
  const showProgressBar = step > 1; // Show on all steps except initial (step 1)

  // Adjust edges based on step - no edges for step 1 and step 6 to allow gradient to extend fully
  // const screenEdges = step === 1 ? [] : ['top', 'bottom'];

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      {/* Progress Bar */}
      {showProgressBar && (
        <View>
          <ProgressBar
            currentStep={progressInfo.current}
            totalSteps={progressInfo.total}
          />
        </View>
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
        <WalletSetupSuccessStep
          username={username}
          onComplete={onWalletSetupComplete}
        />
      )}

      {step === 9 && (
        <ImportWalletStep
          onNext={processImportWallet}
          onBack={() => setStep(1)}
          isLoading={isImporting}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({});

export default SetupWalletScreen;
