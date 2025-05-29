import React, { useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { generateSolanaWallet, saveWalletWithPin } from '@/services/walletService';
import colors from '@/constants/colors';
import CreateWalletIntroStep from '@/components/wallet/CreateWalletIntroStep';
import ShowMnemonicStep from '@/components/wallet/ShowMnemonicStep';
import CreatePinStep from '@/components/wallet/CreatePinStep';
import ConfirmPinStep from '@/components/wallet/ConfirmPinStep';

interface SetupWalletScreenProps {
  onWalletSetupComplete: () => void;
}

const SetupWalletScreen: React.FC<SetupWalletScreenProps> = ({ onWalletSetupComplete }) => {
  const [step, setStep] = useState(1); // 1: Initial, 2: Show Mnemonic, 3: Create PIN, 4: Confirm PIN
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string>('');

  const handleCreateWallet = async () => {
    setIsLoading(true);
    try {
      const wallet = await generateSolanaWallet();
      setMnemonic(wallet.mnemonic);
      setPublicKey(wallet.publicKey);
      setStep(2);
    } catch (error) {
      Alert.alert("Error", "Could not generate wallet. Please try again.");
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleMnemonicSaved = () => {
    setStep(3); // Move to PIN creation
  };

  const handleSetPin = () => {
    if (pin.length < 4) { // Basic PIN validation
      Alert.alert("Invalid PIN", "PIN must be at least 4 digits.");
      return;
    }
    setStep(4); // Move to PIN confirmation
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
      setPinError("Incorrect PIN entered. The PINs do not match. Please try again.");
      return;
    }
    if (pin.length < 4) {
      setPinError("Invalid PIN. PIN must be at least 4 digits.");
      return;
    }

    setIsLoading(true);
    try {
      await saveWalletWithPin(mnemonic, publicKey, pin);
      Alert.alert("Success", "Your wallet has been created and secured with a PIN. Keep your seed phrase and PIN safe!");
      onWalletSetupComplete();
    } catch (error) {
      Alert.alert("Error", "Could not save wallet. Please try again.");
    }
    setIsLoading(false);
  };

  const handleBackToCreatePin = () => {
    setPin('');
    setConfirmPin('');
    setPinError('');
    setStep(3);
  };

  return (
    <View style={{ flex: 1 }}>
      {isLoading && <ActivityIndicator size="large" color={colors.primary} style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -25 }, { translateY: -25 }],
        zIndex: 1000,
      }} />}
      
      {step === 1 && (
        <CreateWalletIntroStep 
          onCreateWallet={handleCreateWallet}
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

      {step === 3 && (
        <CreatePinStep 
          pin={pin}
          onPinChange={setPin}
          onNext={handleSetPin}
          isLoading={isLoading}
        />
      )}

      {step === 4 && (
        <ConfirmPinStep 
          confirmPin={confirmPin}
          onConfirmPinChange={handleConfirmPinChange}
          onConfirm={handleConfirmSave}
          onBack={handleBackToCreatePin}
          isLoading={isLoading}
          pinError={pinError}
        />
      )}
    </View>
  );
};

export default SetupWalletScreen;
