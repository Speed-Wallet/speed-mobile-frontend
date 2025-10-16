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

export enum WalletSetupStep {
  INTRO = 1,
  SHOW_MNEMONIC,
  VERIFY_MNEMONIC,
  USERNAME,
  CREATE_PIN,
  SUCCESS,
  IMPORT = 9,
}

interface SetupWalletScreenProps {
  onWalletSetupComplete: () => void;
}

const SetupWalletScreen: React.FC<SetupWalletScreenProps> = ({
  onWalletSetupComplete,
}) => {
  const { alert, error: showError, success } = useAlert();
  const [step, setStep] = useState<WalletSetupStep>(WalletSetupStep.INTRO);
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
      setStep(WalletSetupStep.SHOW_MNEMONIC);
    } catch (error) {
      showError('Error', 'Could not generate wallet. Please try again.');
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleMnemonicSaved = () => {
    // Move to verification step
    setStep(WalletSetupStep.VERIFY_MNEMONIC);
  };

  const handleVerificationSuccess = () => {
    // Move to username creation after successful verification
    setStep(WalletSetupStep.USERNAME);
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
      setStep(WalletSetupStep.CREATE_PIN);
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

      setStep(WalletSetupStep.SUCCESS);
    } catch (error) {
      showError('Error', 'Could not save wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWallet = () => {
    setStep(WalletSetupStep.IMPORT);
  };

  const processImportWallet = async (seedPhrase: string) => {
    setIsImporting(true);
    try {
      const wallet = await importWalletFromMnemonic(seedPhrase);

      // Set the imported wallet data and proceed to verification
      setMnemonic(wallet.mnemonic);
      setPublicKey(wallet.publicKey);
      setStep(WalletSetupStep.VERIFY_MNEMONIC);
    } catch (error) {
      setIsImporting(false);
      throw error; // Let the ImportWalletStep handle the error display
    }
    setIsImporting(false);
  };

  // Helper function to get progress bar info
  const getProgressInfo = () => {
    const progressMap = {
      [WalletSetupStep.INTRO]: 0,
      [WalletSetupStep.IMPORT]: 1,
      [WalletSetupStep.SHOW_MNEMONIC]: 1,
      [WalletSetupStep.VERIFY_MNEMONIC]: 2,
      [WalletSetupStep.USERNAME]: 3,
      [WalletSetupStep.CREATE_PIN]: 4,
      [WalletSetupStep.SUCCESS]: 5,
    };

    return {
      current: progressMap[step] || 0,
      total: 5,
    };
  };

  const progressInfo = getProgressInfo();
  const showProgressBar = step !== WalletSetupStep.INTRO;

  // Adjust edges based on step - no edges for step 1 and step 6 to allow gradient to extend fully
  // const screenEdges = [WalletSetupStep.IMPORT, WalletSetupStep.USERNAME].includes(step) ? [] : ['top', 'bottom'] as ("top" | "bottom" | "left" | "right")[];

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

      {step === WalletSetupStep.INTRO && (
        <CreateWalletIntroStep
          onCreateWallet={handleCreateWallet}
          onImportWallet={handleImportWallet}
          isLoading={isLoading}
        />
      )}

      {step === WalletSetupStep.SHOW_MNEMONIC && mnemonic && publicKey && (
        <ShowMnemonicStep
          mnemonic={mnemonic}
          publicKey={publicKey}
          onNext={handleMnemonicSaved}
          isLoading={isLoading}
        />
      )}

      {step === WalletSetupStep.VERIFY_MNEMONIC && mnemonic && (
        <SeedPhraseVerificationStep
          words={mnemonic.split(' ')}
          onBack={() => setStep(WalletSetupStep.SHOW_MNEMONIC)}
          onSuccess={handleVerificationSuccess}
          isLoading={isLoading}
        />
      )}

      {step === WalletSetupStep.USERNAME && (
        <CreateUsernameStep
          onNext={handleUsernameNext}
          onBack={() => setStep(WalletSetupStep.VERIFY_MNEMONIC)}
          isLoading={isLoading}
        />
      )}

      {step === WalletSetupStep.CREATE_PIN && (
        <CreatePinStep
          pin={pin}
          onPinChange={setPin}
          onNext={handleSetPin}
          onBack={() => setStep(WalletSetupStep.USERNAME)}
          isLoading={isLoading}
        />
      )}

      {step === WalletSetupStep.SUCCESS && (
        <WalletSetupSuccessStep
          username={username}
          onComplete={onWalletSetupComplete}
        />
      )}

      {step === WalletSetupStep.IMPORT && (
        <ImportWalletStep
          onNext={processImportWallet}
          onBack={() => setStep(WalletSetupStep.INTRO)}
          isLoading={isImporting}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({});

export default SetupWalletScreen;
