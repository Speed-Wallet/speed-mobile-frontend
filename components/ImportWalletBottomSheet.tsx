import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import SettingsHeader from '@/components/SettingsHeader';
import colors from '@/constants/colors';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface ImportWalletBottomSheetProps {
  onImportWallet: (walletName: string, seedPhrase: string) => void;
  onClose: () => void;
  loading?: boolean;
  existingWalletNames: string[];
}

export interface ImportWalletBottomSheetRef {
  expand: () => void;
  close: () => void;
}

const ImportWalletBottomSheet = forwardRef<
  ImportWalletBottomSheetRef,
  ImportWalletBottomSheetProps
>(({ onImportWallet, onClose, loading = false, existingWalletNames }, ref) => {
  const [walletName, setWalletName] = useState('');
  const [importPhrase, setImportPhrase] = useState('');
  const [walletNameError, setWalletNameError] = useState('');
  const [seedPhraseError, setSeedPhraseError] = useState('');
  const bottomSheetRef = useRef<BottomSheet>(null);

  useImperativeHandle(ref, () => ({
    expand: () => {
      setWalletName('');
      setImportPhrase('');
      setWalletNameError('');
      setSeedPhraseError('');
      bottomSheetRef.current?.expand();
    },
    close: () => bottomSheetRef.current?.close(),
  }));

  const validateWalletName = (name: string) => {
    const trimmedName = name.trim();

    if (trimmedName.length < 3) {
      return 'Wallet name must be at least 3 characters long';
    }

    const existingWallet = existingWalletNames.find(
      (walletName) => walletName.toLowerCase() === trimmedName.toLowerCase(),
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
    const seedError = validateSeedPhrase(importPhrase);
    return !nameError && !seedError;
  };

  const handleImportWallet = () => {
    const nameError = validateWalletName(walletName);
    const seedError = validateSeedPhrase(importPhrase);

    if (nameError) {
      setWalletNameError(nameError);
      return;
    }

    if (seedError) {
      setSeedPhraseError(seedError);
      return;
    }

    onImportWallet(walletName.trim(), importPhrase.trim());
  };

  const handleClose = () => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
      onClose();
    }, 200);
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['90%']}
      enableDynamicSizing={false}
      enablePanDownToClose={true}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.bottomSheetHandle}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.4}
        />
      )}
      onClose={handleClose}
    >
      <BottomSheetView style={styles.bottomSheetContent}>
        <SettingsHeader title="Import Wallet" onClose={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <Text style={styles.subtitle}>Import your existing wallet</Text>

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

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (loading || !isFormValid()) && styles.buttonDisabled,
              ]}
              onPress={handleImportWallet}
              disabled={loading || !isFormValid()}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Importing...' : 'Import Wallet'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheet>
  );
});

ImportWalletBottomSheet.displayName = 'ImportWalletBottomSheet';

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: colors.backgroundDark,
  },
  bottomSheetHandle: {
    backgroundColor: colors.textSecondary,
  },
  bottomSheetContent: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(32), // Add bottom padding for safe area
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: colors.textSecondary,
    marginBottom: verticalScale(24),
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: moderateScale(16),
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: verticalScale(8),
    marginTop: verticalScale(16),
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    fontSize: moderateScale(16),
    color: colors.textPrimary,
    marginBottom: verticalScale(8),
  },
  textArea: {
    height: verticalScale(120),
    paddingTop: verticalScale(16),
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  errorText: {
    color: colors.error,
    fontSize: moderateScale(14),
    marginBottom: verticalScale(16),
  },
  devButton: {
    position: 'absolute',
    right: scale(12),
    top: scale(12),
    backgroundColor: colors.primary,
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(4),
  },
  devButtonText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: scale(12),
    paddingVertical: verticalScale(16),
    alignItems: 'center',
    marginTop: verticalScale(24),
  },
  buttonDisabled: {
    backgroundColor: colors.backgroundMedium,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});

export default ImportWalletBottomSheet;
