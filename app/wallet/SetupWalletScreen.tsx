import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import ScreenContainer from '@/components/ScreenContainer';
import {
  generateInitialSolanaWallet,
  saveWalletToList,
  createAppPin,
  importWalletFromMnemonic,
} from '@/services/walletService';
import { createUser, useReferralCode } from '@/services/apis';
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
import VerifyOwnershipStep from '@/components/wallet/VerifyOwnershipStep';
import CheckUserStep from '@/components/wallet/CheckUserStep';
import ShowExistingUsernameStep from '@/components/wallet/ShowExistingUsernameStep';
import InviteCodeStep from '@/components/wallet/InviteCodeStep';
import ProgressBar from '@/components/ProgressBar';
import 'react-native-get-random-values';
import { Keypair } from '@solana/web3.js';
import { signAsync } from '@noble/ed25519';
import { mnemonicToSeed } from '@/utils/bip39';
import { deriveKeyFromPath } from '@/utils/derivation';
export enum WalletSetupStep {
  INTRO = 1,
  SHOW_MNEMONIC,
  VERIFY_MNEMONIC,
  USERNAME,
  INVITE_CODE,
  CREATE_PIN,
  SUCCESS,
  IMPORT = 9,
  VERIFY_OWNERSHIP = 10,
  CHECK_USER = 11,
  SHOW_EXISTING_USERNAME = 12,
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
  const [userReferralCode, setUserReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isImportFlow, setIsImportFlow] = useState(false); // Track if user is in import flow
  const [showUsernameCreation, setShowUsernameCreation] = useState(false); // Control whether to show username creation

  const handleCreateWallet = async () => {
    setIsLoading(true);
    setIsImportFlow(false); // Creating new wallet, not importing
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
      let result;

      // For import flow, include signature verification
      if (isImportFlow && mnemonic) {
        // Derive keypair and sign message
        const seed = await mnemonicToSeed(mnemonic);
        const derivedKey = deriveKeyFromPath(seed, 0);
        const keypair = Keypair.fromSeed(derivedKey);

        const timestamp = Date.now();
        const message = `Speed Wallet Import\nPublic Key: ${publicKey}\nTimestamp: ${timestamp}`;
        const messageBytes = new TextEncoder().encode(message);
        const privateKey = keypair.secretKey.subarray(0, 32);
        const signatureBytes = await signAsync(messageBytes, privateKey);
        const signature = Buffer.from(signatureBytes).toString('base64');

        result = await createUser(
          selectedUsername,
          publicKey,
          signature,
          message,
          timestamp,
        );
      } else {
        // For create flow, no signature needed (yet - can be added later)
        result = await createUser(selectedUsername, publicKey);
      }

      if (!result.success) {
        // Handle specific error cases
        if (
          result.error?.includes('User already exists') ||
          result.error?.includes('Public key already registered') ||
          result.statusCode === 409
        ) {
          // Throw error to let the child component handle the visual feedback
          throw new Error(result.error || 'User already exists');
        } else {
          showError(
            'Error',
            result.error || 'Failed to create user. Please try again.',
          );
        }
        return;
      }

      // If successful, store username locally and referral code, then proceed
      await AuthService.storeUsername(selectedUsername);
      setUsername(selectedUsername);

      // Store the user's own referral code if provided
      if (result.data?.referralCode) {
        setUserReferralCode(result.data.referralCode);
        console.log('User referral code:', result.data.referralCode);
      }

      setStep(WalletSetupStep.INVITE_CODE);
    } catch (error) {
      console.error('Error in handleUsernameNext:', error);

      // Only show alert for unknown errors, not for username taken
      if (
        error instanceof Error &&
        !error.message.includes('already') &&
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
      const walletId = `wallet-${Date.now()}`;
      const walletName = 'Main';

      // Show success immediately - don't wait for storage
      setStep(WalletSetupStep.SUCCESS);
      setIsLoading(false);

      // Store wallet in background, then authenticate after it's saved
      saveWalletToList(
        walletId,
        walletName,
        mnemonic,
        publicKey,
        pin,
        accountIndex,
        derivationPath,
      )
        .then(() => {
          // Only authenticate after wallet is successfully saved
          return AuthService.authenticate();
        })
        .catch((error) => {
          console.error('Failed to save wallet or authenticate:', error);
          // Wallet saving failed - show warning but don't block user
          if (error.message?.includes('App must be unlocked')) {
            console.warn(
              'Authentication skipped - will authenticate on next app launch',
            );
          } else {
            showError(
              'Warning',
              'Wallet setup complete but may need re-import.',
            );
          }
        });
    } catch (error) {
      setIsLoading(false);
      showError('Error', 'Could not setup wallet. Please try again.');
      console.error(error);
    }
  };

  const handleImportWallet = () => {
    setIsImportFlow(true); // Set import flow immediately when user chooses to import
    setStep(WalletSetupStep.IMPORT);
  };

  const processImportWallet = async (seedPhrase: string) => {
    setIsImporting(true);
    setIsImportFlow(true); // User is importing, not creating
    try {
      const wallet = await importWalletFromMnemonic(seedPhrase);

      // Set the imported wallet data
      setMnemonic(wallet.mnemonic);
      setPublicKey(wallet.publicKey);

      // Move to verification step (components will derive keypair from mnemonic)
      setStep(WalletSetupStep.VERIFY_OWNERSHIP);
    } catch (error) {
      setIsImporting(false);
      throw error; // Let the ImportWalletStep handle the error display
    }
    setIsImporting(false);
  };

  const handleVerificationComplete = () => {
    // After verification, check if user exists
    setStep(WalletSetupStep.CHECK_USER);
  };

  const handleUserExists = (
    existingUsername: string,
    usedReferralCode: string | null,
  ) => {
    // User already exists - show the username screen
    setUsername(existingUsername);
    AuthService.storeUsername(existingUsername);
    setShowUsernameCreation(false);

    // Store the used referral code for display
    if (usedReferralCode) {
      setUserReferralCode(usedReferralCode);
    }

    setStep(WalletSetupStep.SHOW_EXISTING_USERNAME);
  };

  const handleUserNew = () => {
    // New user - proceed to username creation
    setShowUsernameCreation(true);
    setStep(WalletSetupStep.USERNAME);
  };

  const handleInviteCodeNext = async (inviteCode: string) => {
    if (!username) {
      // This shouldn't happen, but throw error to be handled by component
      throw new Error('Username not found. Please try again.');
    }

    setIsLoading(true);
    try {
      // Use the referral code
      const result = await useReferralCode(username, inviteCode);

      if (!result.success) {
        // Throw error with appropriate message for the component to handle
        if (result.statusCode === 404) {
          throw new Error('Invite code not found');
        } else if (
          result.statusCode === 400 &&
          result.error?.includes('already used')
        ) {
          throw new Error('You have already used a referral code');
        } else if (result.statusCode === 400 && result.error?.includes('own')) {
          throw new Error('Cannot use your own referral code');
        } else {
          throw new Error(result.error || 'Invalid invite code');
        }
      }

      console.log('Invite code accepted:', inviteCode);
      setStep(WalletSetupStep.CREATE_PIN);
    } catch (error) {
      console.error('Error validating invite code:', error);
      // Re-throw the error so the InviteCodeStep component can display it
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteCodeSkip = () => {
    setStep(WalletSetupStep.CREATE_PIN);
  };

  // Helper function to get progress bar info
  const getProgressInfo = () => {
    // For import flow with existing user: IMPORT(1) -> VERIFY_OWNERSHIP(2) -> CHECK_USER(3) -> SHOW_EXISTING_USERNAME(4) -> INVITE_CODE(5) -> CREATE_PIN(6) -> SUCCESS(7)
    // For import flow with new user: IMPORT(1) -> VERIFY_OWNERSHIP(2) -> CHECK_USER(3) -> USERNAME(4) -> INVITE_CODE(5) -> CREATE_PIN(6) -> SUCCESS(7)
    // For create flow: SHOW_MNEMONIC(1) -> VERIFY_MNEMONIC(2) -> USERNAME(3) -> INVITE_CODE(4) -> CREATE_PIN(5) -> SUCCESS(6)

    if (isImportFlow) {
      const importProgressMap: Record<WalletSetupStep, number> = {
        [WalletSetupStep.INTRO]: 0,
        [WalletSetupStep.IMPORT]: 1,
        [WalletSetupStep.VERIFY_OWNERSHIP]: 2,
        [WalletSetupStep.CHECK_USER]: 3,
        [WalletSetupStep.SHOW_EXISTING_USERNAME]: 4,
        [WalletSetupStep.SHOW_MNEMONIC]: 0,
        [WalletSetupStep.VERIFY_MNEMONIC]: 0,
        [WalletSetupStep.USERNAME]: 4,
        [WalletSetupStep.INVITE_CODE]: 5,
        [WalletSetupStep.CREATE_PIN]: 6,
        [WalletSetupStep.SUCCESS]: 7,
      };
      return {
        current: importProgressMap[step] || 0,
        total: 7,
      };
    } else {
      // Create flow
      const createProgressMap: Record<WalletSetupStep, number> = {
        [WalletSetupStep.INTRO]: 0,
        [WalletSetupStep.IMPORT]: 0,
        [WalletSetupStep.VERIFY_OWNERSHIP]: 0,
        [WalletSetupStep.CHECK_USER]: 0,
        [WalletSetupStep.SHOW_EXISTING_USERNAME]: 0,
        [WalletSetupStep.SHOW_MNEMONIC]: 1,
        [WalletSetupStep.VERIFY_MNEMONIC]: 2,
        [WalletSetupStep.USERNAME]: 3,
        [WalletSetupStep.INVITE_CODE]: 4,
        [WalletSetupStep.CREATE_PIN]: 5,
        [WalletSetupStep.SUCCESS]: 6,
      };
      return {
        current: createProgressMap[step] || 0,
        total: 6,
      };
    }
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
          onBack={() =>
            setStep(
              isImportFlow
                ? WalletSetupStep.IMPORT
                : WalletSetupStep.VERIFY_MNEMONIC,
            )
          }
          isLoading={isLoading}
        />
      )}

      {step === WalletSetupStep.INVITE_CODE && (
        <InviteCodeStep
          onNext={handleInviteCodeNext}
          onSkip={handleInviteCodeSkip}
          isLoading={isLoading}
          existingCode={userReferralCode}
        />
      )}

      {step === WalletSetupStep.CREATE_PIN && (
        <CreatePinStep
          pin={pin}
          onPinChange={setPin}
          onNext={handleSetPin}
          onBack={() => setStep(WalletSetupStep.INVITE_CODE)}
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

      {step === WalletSetupStep.VERIFY_OWNERSHIP && mnemonic && (
        <VerifyOwnershipStep
          mnemonic={mnemonic}
          onNext={handleVerificationComplete}
          onBack={() => setStep(WalletSetupStep.IMPORT)}
        />
      )}

      {step === WalletSetupStep.CHECK_USER && mnemonic && (
        <CheckUserStep
          mnemonic={mnemonic}
          onUserExists={handleUserExists}
          onUserNew={handleUserNew}
          onBack={() => setStep(WalletSetupStep.VERIFY_OWNERSHIP)}
        />
      )}

      {step === WalletSetupStep.SHOW_EXISTING_USERNAME && username && (
        <ShowExistingUsernameStep
          username={username}
          onNext={() => setStep(WalletSetupStep.INVITE_CODE)}
          onBack={() => setStep(WalletSetupStep.CHECK_USER)}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({});

export default SetupWalletScreen;
