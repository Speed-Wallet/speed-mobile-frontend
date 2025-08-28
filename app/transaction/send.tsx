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
import { LinearGradient } from 'expo-linear-gradient';
import Toast from '@/components/Toast';
import colors from '@/constants/colors';
import { getAllTokenInfo, getTokenByAddress } from '@/data/tokens';

import RecentContacts from '@/data/contacts';
import { EnrichedTokenEntry } from '@/data/types';
import ScreenHeader from '@/components/ScreenHeader';
import ScreenContainer from '@/components/ScreenContainer';
import AmountInputWithValue from '@/components/AmountInputWithValue';
import TokenItem from '@/components/TokenItem';
import {
  prepareSendTransaction,
  confirmSendTransaction,
  type PreparedSendTransaction,
} from '@/utils/sendTransaction';

export default function SendScreen() {
  const { tokenAddress, selectedTokenAddress } = useLocalSearchParams<{
    tokenAddress?: string;
    selectedTokenAddress?: string;
  }>();
  const router = useRouter();
  const [selectedToken, setSelectedToken] = useState<EnrichedTokenEntry | null>(
    null,
  );
  const [amount, setAmount] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [filteredContacts, setFilteredContacts] = useState(RecentContacts);

  // Bottom sheet states
  const previewBottomSheetRef = useRef<BottomSheet>(null);
  const statusBottomSheetRef = useRef<BottomSheet>(null);
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

  useEffect(() => {
    const loadData = async () => {
      const tokens = await getAllTokenInfo();

      if (tokenAddress) {
        console.log('Loading token by address:', tokenAddress);
        const token = await getTokenByAddress(tokenAddress as string);
        setSelectedToken(token);
      } else if (tokens.length > 0) {
        setSelectedToken(tokens[0]);
      }
    };
    loadData();
  }, [tokenAddress]);

  // Handle token selection from the token selector page
  useEffect(() => {
    if (selectedTokenAddress) {
      const loadSelectedToken = async () => {
        const token = await getTokenByAddress(selectedTokenAddress);
        setSelectedToken(token);
      };
      loadSelectedToken();

      // Clear the param to prevent re-triggering
      router.setParams({ selectedTokenAddress: undefined });
    }
  }, [selectedTokenAddress]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = RecentContacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.username.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(RecentContacts);
    }
  }, [searchQuery]);

  if (Array.isArray(tokenAddress)) {
    throw new Error('tokenAddress should not be an array');
  }

  const handleSend = async () => {
    if (!selectedToken) {
      setToast({ message: 'Please select a token to send.', type: 'error' });
      return;
    }
    if (!amount) {
      setToast({ message: 'Please enter an amount.', type: 'error' });
      return;
    }
    if (!recipient && !selectedContact) {
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
        recipient: recipient || selectedContact?.recipient || '',
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
      setSelectedContact(null);
      setPreparedTransaction(null);
    } else {
      console.error('Transaction failed:', result.error);
    }
  };

  const handleSelectContact = (contact: any) => {
    setSelectedContact(contact);
    setRecipient(contact.recipient);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScreenContainer edges={['top', 'bottom']}>
        <ScreenHeader
          title="Send Crypto"
          onBack={() => router.push('/' as any)}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {selectedToken && (
            <>
              <Text style={styles.inputLabel}>Token</Text>
              <TokenItem
                token={selectedToken}
                onPress={() =>
                  router.push({
                    pathname: '/token/select',
                    params: {
                      selectedAddress: selectedToken?.address,
                    },
                  })
                }
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

                {selectedContact ? (
                  <View style={styles.selectedContactContainer}>
                    <Image
                      source={{ uri: selectedContact.avatar }}
                      style={styles.contactAvatar}
                    />
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>
                        {selectedContact.name}
                      </Text>
                      <Text style={styles.contactUsername}>
                        @{selectedContact.username}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.changeButton}
                      onPress={() => setSelectedContact(null)}
                    >
                      <Text style={styles.changeButtonText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.searchContainer}>
                      <Search size={20} color={colors.textSecondary} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search contacts or paste recipient"
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={(value) => {
                          setSearchQuery(value);
                          setRecipient(value);
                        }}
                      />
                    </View>

                    {/* <View style={styles.optionsRow}>
                      <TouchableOpacity style={styles.optionButton}>
                        <View style={styles.optionIconContainer}>
                          <User size={20} color={colors.textPrimary} />
                        </View>
                        <Text style={styles.optionText}>Address Book</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.optionButton}>
                        <View style={styles.optionIconContainer}>
                          <Send size={20} color={colors.textPrimary} />
                        </View>
                        <Text style={styles.optionText}>Recent</Text>
                      </TouchableOpacity>
                    </View>

                    {filteredContacts.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.contactsContainer}
                      >
                        {filteredContacts.map((contact) => (
                          <TouchableOpacity
                            key={contact.id}
                            style={styles.contactItem}
                            onPress={() => handleSelectContact(contact)}
                          >
                            <Image
                              source={{ uri: contact.avatar }}
                              style={styles.contactImage}
                            />
                            <Text style={styles.contactItemName}>{contact.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    ) : (
                      searchQuery ? (
                        <Text style={styles.noResults}>No contacts found</Text>
                      ) : null
                    )} */}

                    {/* <AddressInput
                      recipient={recipient}
                      onChangeAddress={setRecipient}
                      selectedToken={selectedToken}
                    /> */}
                  </>
                )}
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
          <TouchableOpacity
            style={styles.sendButton}
            disabled={!amount || (!recipient && !selectedContact)}
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.buttonBackground,
                {
                  backgroundColor:
                    !amount || (!recipient && !selectedContact)
                      ? colors.backgroundMedium
                      : '#3B82F6',
                },
              ]}
            >
              <Text
                style={[
                  styles.sendButtonText,
                  (!amount || (!recipient && !selectedContact)) &&
                    styles.sendButtonTextDisabled,
                ]}
              >
                Preview Send
              </Text>
            </View>
          </TouchableOpacity>
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
                    {selectedContact
                      ? selectedContact.name
                      : recipient?.slice(0, 6) + '...' + recipient?.slice(-4)}
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

            <TouchableOpacity
              style={styles.confirmButton}
              disabled={!preparedTransaction || isPreparingSend}
              onPress={handleConfirmSend}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.buttonBackground,
                  {
                    backgroundColor:
                      !preparedTransaction || isPreparingSend
                        ? colors.backgroundMedium
                        : '#3B82F6',
                  },
                ]}
              >
                {isPreparingSend ? (
                  <>
                    <ActivityIndicator size="small" color={colors.white} />
                    <Text style={styles.confirmButtonText}>Preparing...</Text>
                  </>
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Send</Text>
                )}
              </View>
            </TouchableOpacity>
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

                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => {
                    statusBottomSheetRef.current?.close();
                    if (sendResult.success) {
                      router.push('/' as any);
                    }
                  }}
                >
                  <Text style={styles.doneButtonText}>
                    {sendResult.success ? 'Done' : 'Try Again'}
                  </Text>
                </TouchableOpacity>
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
      </ScreenContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  tokenBalance: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  tokenValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  amountCurrency: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textSecondary,
  },
  amountInFiat: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 8,
    marginLeft: 16,
  },
  amountOptions: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  amountOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
  },
  amountOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },
  recipientSection: {
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
  },
  optionsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundMedium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  contactsContainer: {
    paddingVertical: 8,
  },
  contactItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  contactImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  contactItemName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  noResults: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    alignSelf: 'center',
    marginVertical: 16,
  },
  selectedContactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  contactUsername: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  changeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
  },
  changeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },
  noteInput: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 80,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 16,
    marginBottom: 100,
  },
  feeLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  feeValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingHorizontal: 20,
  },
  sendButton: {
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBackground: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    gap: 8,
  },
  sendButtonText: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
  sendButtonTextDisabled: {
    color: colors.textSecondary,
    opacity: 0.5,
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
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 17,
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
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  doneButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
});
