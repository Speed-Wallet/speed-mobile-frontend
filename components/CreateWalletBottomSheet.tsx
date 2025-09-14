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

interface CreateWalletBottomSheetProps {
  onCreateWallet: (walletName: string) => void;
  onClose: () => void;
  loading?: boolean;
  existingWalletNames: string[];
}

export interface CreateWalletBottomSheetRef {
  expand: () => void;
  close: () => void;
}

const CreateWalletBottomSheet = forwardRef<
  CreateWalletBottomSheetRef,
  CreateWalletBottomSheetProps
>(({ onCreateWallet, onClose, loading = false, existingWalletNames }, ref) => {
  const [walletName, setWalletName] = useState('');
  const [walletNameError, setWalletNameError] = useState('');
  const bottomSheetRef = useRef<BottomSheet>(null);

  useImperativeHandle(ref, () => ({
    expand: () => {
      setWalletName('');
      setWalletNameError('');
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

  const handleWalletNameBlur = () => {
    const error = validateWalletName(walletName);
    setWalletNameError(error);
  };

  const isFormValid = () => {
    const nameError = validateWalletName(walletName);
    return !nameError;
  };

  const handleCreateWallet = () => {
    const nameError = validateWalletName(walletName);
    if (nameError) {
      setWalletNameError(nameError);
      return;
    }

    onCreateWallet(walletName.trim());
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
      snapPoints={['60%']}
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
        <SettingsHeader title="Create New Wallet" onClose={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <Text style={styles.subtitle}>Give your wallet a name</Text>

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

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (loading || !isFormValid()) && styles.buttonDisabled,
              ]}
              onPress={handleCreateWallet}
              disabled={loading || !isFormValid()}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Creating...' : 'Create Wallet'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheet>
  );
});

CreateWalletBottomSheet.displayName = 'CreateWalletBottomSheet';

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
  input: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    fontSize: moderateScale(16),
    color: colors.textPrimary,
    marginBottom: verticalScale(8),
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

export default CreateWalletBottomSheet;
