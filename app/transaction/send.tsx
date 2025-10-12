import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search, ArrowRight, Check, DollarSign } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from '@/components/Toast';
import colors from '@/constants/colors';
import { TokenMetadata } from '@/services/tokenAssetService';
import { USDC_TOKEN } from '@/constants/popularTokens';
import ScreenHeader from '@/components/ScreenHeader';
import ScreenContainer from '@/components/ScreenContainer';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import AmountInputWithValue from '@/components/AmountInputWithValue';
import { TokenItemSelector } from '@/components/token-items';
import TokenSelectorBottomSheet, {
  TokenSelectorBottomSheetRef,
} from '@/components/bottom-sheets/TokenSelectorBottomSheet';
import {
  prepareSendTransaction,
  confirmSendTransaction,
  type PreparedSendTransaction,
} from '@/utils/sendTransaction';
import { useTokenAsset } from '@/hooks/useTokenAsset';
import { useSendTokens } from '@/hooks/useSendTokens';

/**
 * Send Screen - Send Token Interface
 *
 * Navigation Examples:
 *
 * 1. With token specified:
 *    const token: TokenMetadata = { address: '...', name: '...', symbol: '...', logoURI: '...', decimals: 6 };
 *    router.push(`/transaction/send?tokenJson=${encodeURIComponent(JSON.stringify(token))}`);
 *
 * 2. With no token (will default to USDC):
 *    router.push('/transaction/send');
 */
export default function SendScreen() {
  const { tokenJson } = useLocalSearchParams<{
    tokenJson?: string;
  }>();
  const router = useRouter();
  const [selectedToken, setSelectedToken] = useState<TokenMetadata | null>(
    null,
  );

  // Get token asset data for the selected token
  const tokenAsset = useTokenAsset(selectedToken?.address);

  const [amount, setAmount] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [note, setNote] = useState('');

  // Token search state
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');

  // Use token search hook
  const { tokens, isLoading: isTokensLoading } =
    useSendTokens(tokenSearchQuery);

  // Bottom sheet states
  const previewBottomSheetRef = useRef<BottomSheet>(null);
  const statusBottomSheetRef = useRef<BottomSheet>(null);
  const tokenSelectorRef = useRef<TokenSelectorBottomSheetRef>(null);
  const [isPreviewSheetOpen, setIsPreviewSheetOpen] = useState(false);
  const [isStatusSheetOpen, setIsStatusSheetOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    signature?: string;
    error?: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // New state for prepared send workflow
  const [preparedTransaction, setPreparedTransaction] =
    useState<PreparedSendTransaction | null>(null);
  const [isPreparingSend, setIsPreparingSend] = useState(false);
  const [isConfirmingSend, setIsConfirmingSend] = useState(false);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  // Initialize token from URL params or default to USDC
  useEffect(() => {
    const initializeToken = () => {
      let initialToken: TokenMetadata | null = null;

      // Try to parse token from URL params
      if (tokenJson) {
        try {
          initialToken = JSON.parse(tokenJson) as TokenMetadata;
        } catch (error) {
          console.error('Error parsing tokenJson:', error);
        }
      }

      // Set default token if not provided in params
      if (!initialToken) {
        // Default to USDC for send screen
        initialToken = USDC_TOKEN || null;
      }

      setSelectedToken(initialToken);
    };

    initializeToken();
  }, [tokenJson]);

  const handleTokenSelect = (token: TokenMetadata) => {
    setSelectedToken(token);
  };

  const handleTokenSelectorClose = () => {
    // Bottom sheet closed, reset search query
    setTokenSearchQuery('');
  };

  const handleSend = async () => {
    if (!selectedToken) {
      setToast({ message: 'Please select a token to send.', type: 'error' });
      return;
    }
    if (!amount) {
      setToast({ message: 'Please enter an amount.', type: 'error' });
      return;
    }
    if (!recipient) {
      setToast({ message: 'Please enter a recipient.', type: 'error' });
      return;
    }

    // Open the bottom sheet immediately
    setIsPreviewSheetOpen(true);
    previewBottomSheetRef.current?.expand();

    // Start preparing the transaction in the background
    setIsPreparingSend(true);
    setPreparedTransaction(null);

    try {
      const prepared = await prepareSendTransaction({
        amount: amount || '',
        recipient: recipient || '',
        tokenAddress: selectedToken.address,
        tokenSymbol: selectedToken.symbol,
        tokenDecimals: selectedToken.decimals,
      });
      setPreparedTransaction(prepared);
      console.log('Send transaction prepared successfully');
    } catch (err: any) {
      console.error('Failed to prepare send transaction:', err);
      setToast({
        message: 'Failed to prepare transaction. Please try again.',
        type: 'error',
      });
      previewBottomSheetRef.current?.close();
      setIsPreviewSheetOpen(false);
    } finally {
      setIsPreparingSend(false);
    }
  };

  const handleConfirmSend = async () => {
    if (!preparedTransaction) {
      setToast({
        message: 'Transaction not prepared. Please try again.',
        type: 'error',
      });
      return;
    }

    setIsSending(true);
    setIsConfirmingSend(true);
    previewBottomSheetRef.current?.close();
    setIsPreviewSheetOpen(false);

    setTimeout(() => {
      statusBottomSheetRef.current?.expand();
      setIsStatusSheetOpen(true);
    }, 300);

    const result = await confirmSendTransaction(preparedTransaction);

    setSendResult(result);
    setIsSending(false);
    setIsConfirmingSend(false);
    if (result.success) {
      // Clear inputs after successful send
      setAmount('');
      setRecipient('');
      setNote('');
      setPreparedTransaction(null);
    } else {
      console.error('Transaction failed:', result.error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScreenContainer edges={['top', 'bottom']}>
        <ScreenHeader
          title="Send Crypto"
          onBack={() => router.push('/' as any)}
        />

        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            {selectedToken && (
              <>
                <Text style={styles.inputLabel}>Token</Text>
                <TokenItemSelector
                  token={{
                    address: tokenAsset.address,
                    name: tokenAsset.name || selectedToken.name,
                    symbol: tokenAsset.symbol || selectedToken.symbol,
                    logoURI: tokenAsset.logoURI,
                    decimals: tokenAsset.decimals || selectedToken.decimals,
                  }}
                  isLoading={tokenAsset.loading}
                  onPress={() => tokenSelectorRef.current?.present()}
                  showSelectorIcon={true}
                />
                <Text style={styles.inputLabel}>Amount</Text>
                <AmountInputWithValue
                  address={selectedToken.address}
                  amount={amount || ''}
                  setAmount={setAmount}
                />

                {/* Recipient Section */}
                <Animated.View
                  entering={FadeIn.delay(200)}
                  style={styles.recipientSection}
                >
                  <Text style={styles.inputLabel}>Send To</Text>
                  <View style={styles.searchContainer}>
                    <TextInput
                      style={styles.recipientInput}
                      placeholder="Paste recipient address"
                      placeholderTextColor={colors.textSecondary}
                      value={recipient || ''}
                      onChangeText={setRecipient}
                    />
                  </View>
                </Animated.View>

                {/* Note Input */}
                <Animated.View
                  entering={FadeIn.delay(300)}
                  style={styles.inputGroup}
                >
                  <Text style={styles.inputLabel}>Note (Optional)</Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Add a note"
                    placeholderTextColor={colors.textSecondary}
                    value={note}
                    onChangeText={setNote}
                    multiline
                  />
                </Animated.View>

                {/* Network Fee info */}
                {/* <Animated.View entering={FadeIn.delay(400)} style={styles.feeContainer}>
                <Text style={styles.feeLabel}>Network Fee</Text>
                <Text style={styles.feeValue}>
                  0.00005 {selectedToken.symbol} (~{formatCurrency(0.00005 * selectedToken.price)})
                </Text>
              </Animated.View> */}
              </>
            )}
          </ScrollView>

          {/* Send Button */}
          <View style={styles.buttonContainer}>
            <PrimaryActionButton
              title="Preview Send"
              onPress={handleSend}
              disabled={!amount || !recipient}
            />
          </View>

          {/* Preview Bottom Sheet */}
          <BottomSheet
            ref={previewBottomSheetRef}
            index={-1}
            backdropComponent={renderBackdrop}
            enablePanDownToClose={true}
            onClose={() => setIsPreviewSheetOpen(false)}
            backgroundStyle={styles.bottomSheetBackground}
            handleIndicatorStyle={styles.bottomSheetHandle}
          >
            <BottomSheetView style={styles.bottomSheetContent}>
              <Text style={styles.bottomSheetTitle}>Send Details</Text>

              {selectedToken && (
                <View style={styles.previewContainer}>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Amount</Text>
                    <Text style={styles.previewValue}>
                      {amount} {selectedToken.symbol}
                    </Text>
                  </View>

                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>To</Text>
                    <Text style={styles.previewValue} numberOfLines={1}>
                      {recipient?.slice(0, 6) + '...' + recipient?.slice(-4)}
                    </Text>
                  </View>

                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Network Fee</Text>
                    <Text style={styles.previewValue}>~0.000005 SOL</Text>
                  </View>

                  {note && (
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Note</Text>
                      <Text style={styles.previewValue}>{note}</Text>
                    </View>
                  )}
                </View>
              )}

              <PrimaryActionButton
                title={isPreparingSend ? 'Preparing...' : 'Confirm Send'}
                onPress={handleConfirmSend}
                disabled={!preparedTransaction || isPreparingSend}
                loading={isPreparingSend}
              />
            </BottomSheetView>
          </BottomSheet>

          {/* Status Bottom Sheet */}
          <BottomSheet
            ref={statusBottomSheetRef}
            index={-1}
            backdropComponent={renderBackdrop}
            enablePanDownToClose={!isSending}
            onClose={() => setIsStatusSheetOpen(false)}
            backgroundStyle={styles.bottomSheetBackground}
            handleIndicatorStyle={styles.bottomSheetHandle}
          >
            <BottomSheetView
              style={[styles.bottomSheetContent, { alignItems: 'center' }]}
            >
              {isSending ? (
                <>
                  <ActivityIndicator
                    size="large"
                    color={colors.primary}
                    style={styles.loadingIndicator}
                  />
                  <Text style={styles.loadingText}>
                    {isConfirmingSend
                      ? 'Sending Transaction...'
                      : 'Processing Transaction...'}
                  </Text>
                  <Text style={styles.loadingSubtext}>
                    {isConfirmingSend
                      ? 'Please wait while we submit your transaction to the blockchain'
                      : 'Please wait while we process your transaction'}
                  </Text>
                </>
              ) : sendResult ? (
                <>
                  {sendResult.success ? (
                    <>
                      <LinearGradient
                        colors={['#4CAF50', '#45a049']}
                        style={styles.successIcon}
                      >
                        <Check size={32} color={colors.white} />
                      </LinearGradient>
                      <Text style={styles.successTitle}>Send Successful!</Text>
                      <Text style={styles.successSubtitle}>
                        Your transaction has been sent successfully
                      </Text>
                      {sendResult.signature && (
                        <Text style={styles.transactionId} numberOfLines={1}>
                          Transaction ID: {sendResult.signature.slice(0, 8)}...
                          {sendResult.signature.slice(-8)}
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      <View style={styles.errorIcon}>
                        <Text style={styles.errorIconText}>✕</Text>
                      </View>
                      <Text style={styles.errorTitle}>Send Failed</Text>
                      <Text style={styles.errorSubtitle}>
                        {'Something went wrong. Please try again.'}
                      </Text>
                    </>
                  )}

                  <PrimaryActionButton
                    title={sendResult.success ? 'Done' : 'Try Again'}
                    onPress={() => {
                      statusBottomSheetRef.current?.close();
                      if (sendResult.success) {
                        router.push('/' as any);
                      }
                    }}
                  />
                </>
              ) : null}
            </BottomSheetView>
          </BottomSheet>

          {/* Toast */}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              visible={!!toast}
              onHide={() => setToast(null)}
            />
          )}
        </View>
      </ScreenContainer>

      {/* Token Selector Bottom Sheet */}
      <TokenSelectorBottomSheet
        ref={tokenSelectorRef}
        tokens={tokens}
        searchQuery={tokenSearchQuery}
        onSearchChange={setTokenSearchQuery}
        isLoading={isTokensLoading}
        onTokenSelect={handleTokenSelect}
        onClose={handleTokenSelectorClose}
        selectedAddress={selectedToken?.address}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: verticalScale(20),
  },
  content: {
    padding: scale(16),
  },
  tokenIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    marginRight: scale(10),
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  tokenBalance: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: verticalScale(2),
  },
  tokenValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  inputGroup: {
    marginBottom: verticalScale(24),
  },
  inputLabel: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginBottom: verticalScale(8),
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    height: verticalScale(60),
  },
  amountInput: {
    flex: 1,
    fontSize: moderateScale(24),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  amountCurrency: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-SemiBold',
    color: colors.textSecondary,
  },
  amountInFiat: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: verticalScale(8),
    marginLeft: scale(16),
  },
  amountOptions: {
    flexDirection: 'row',
    marginTop: verticalScale(10),
    justifyContent: 'space-between',
  },
  amountOption: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(10),
    backgroundColor: colors.backgroundLight,
    borderRadius: scale(10),
  },
  amountOptionText: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },
  recipientSection: {
    marginBottom: verticalScale(8),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    height: verticalScale(50),
    marginBottom: verticalScale(16),
  },
  searchInput: {
    flex: 1,
    marginLeft: scale(8),
    fontSize: moderateScale(16),
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
  },
  recipientInput: {
    flex: 1,
    fontSize: moderateScale(16),
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
  },
  optionsRow: {
    flexDirection: 'row',
    marginBottom: verticalScale(16),
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: scale(16),
  },
  optionIconContainer: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: colors.backgroundMedium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(8),
  },
  optionText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  contactsContainer: {
    paddingVertical: verticalScale(8),
  },
  contactItem: {
    alignItems: 'center',
    marginRight: scale(16),
    width: scale(70),
  },
  contactImage: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    marginBottom: verticalScale(8),
  },
  contactItemName: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  noResults: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    alignSelf: 'center',
    marginVertical: verticalScale(14),
  },
  selectedContactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(14),
    padding: scale(14),
    marginBottom: verticalScale(14),
  },
  contactAvatar: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    marginRight: scale(10),
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: moderateScale(15),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  contactUsername: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  changeButton: {
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    backgroundColor: colors.backgroundLight,
    borderRadius: scale(10),
  },
  changeButtonText: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },
  noteInput: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    minHeight: verticalScale(80),
    fontSize: moderateScale(16),
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: verticalScale(100),
  },
  feeLabel: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  feeValue: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom:
      Platform.OS === 'ios' ? verticalScale(34) : verticalScale(24),
    paddingHorizontal: scale(20),
  },
  // Bottom sheet styles
  bottomSheetBackground: {
    backgroundColor: colors.bottomSheetBackground,
  },
  bottomSheetHandle: {
    backgroundColor: colors.textSecondary,
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  previewContainer: {
    width: '100%',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  previewValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  confirmButton: {
    height: verticalScale(54),
    borderRadius: scale(27),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: moderateScale(17),
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
  loadingIndicator: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  transactionId: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    backgroundColor: colors.backgroundLight,
    padding: 8,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorIconText: {
    fontSize: 32,
    color: colors.white,
    fontFamily: 'Inter-Bold',
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: verticalScale(24),
  },
});
