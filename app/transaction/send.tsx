import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Search, Send, User, ArrowRight } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import { getAllTokenInfo, getTokenByAddress } from '@/data/tokens';
import TokenSelector from '@/components/TokenSelector';
import AddressInput from '@/components/AddressInput';
import RecentContacts from '@/data/contacts';
import { EnrichedTokenEntry } from '@/data/types';
import BackButton from '@/components/BackButton';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import AmountInput from '@/components/AmountInput';
import AmountInputWithValue from '@/components/AmountInputWithValue';
import TokenItem from '@/components/TokenItem';

export default function SendScreen() {
  const { tokenAddress } = useLocalSearchParams();
  const router = useRouter();
  const [selectedToken, setSelectedToken] = useState<EnrichedTokenEntry | null>(null);
  const [tokenList, setTokenList] = useState<EnrichedTokenEntry[]>([]);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [filteredContacts, setFilteredContacts] = useState(RecentContacts);
  const { balance: selectedTokenBalance } = useTokenBalance(tokenAddress as string || selectedToken?.address);

  useEffect(() => {
    loadData();
  }, [tokenAddress]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = RecentContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(RecentContacts);
    }
  }, [searchQuery]);

  if (Array.isArray(tokenAddress)) {
    throw new Error('tokenAddress should not be an array');
  }

  const loadData = async () => {
    const tokens = await getAllTokenInfo();
    setTokenList(tokens);

    if (tokenAddress) {
      console.log('Loading token by address:', tokenAddress);
      const token = await getTokenByAddress(tokenAddress);
      setSelectedToken(token);
    } else if (tokens.length > 0) {
      setSelectedToken(tokens[0]);
    }
  };

  const handleSend = () => {
    alert(`Sending ${amount} ${selectedToken?.symbol} to ${address || selectedContact?.username}`);
    router.back();
  };

  const handleSelectContact = (contact: any) => {
    setSelectedContact(contact);
    setAddress(contact.address);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton style={styles.closeButton} onPress={() => router.push('/')} />
        <Text style={styles.headerTitle}>Send Crypto</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {selectedToken && (
          <>
          <Text style={styles.inputLabel}>Token</Text>
            <TokenItem token={selectedToken} onPress={() => setShowTokenSelector(true)} />
            <Text style={styles.inputLabel}>Amount</Text>
            <AmountInputWithValue
              address={selectedToken.address}
              amount={amount}
              setAmount={setAmount}
            />

            {/* Recipient Section */}
            <Animated.View entering={FadeIn.delay(200)} style={styles.recipientSection}>
              <Text style={styles.inputLabel}>Send To</Text>

              {selectedContact ? (
                <View style={styles.selectedContactContainer}>
                  <Image
                    source={{ uri: selectedContact.avatar }}
                    style={styles.contactAvatar}
                  />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{selectedContact.name}</Text>
                    <Text style={styles.contactUsername}>@{selectedContact.username}</Text>
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
                      placeholder="Search contacts or paste address"
                      placeholderTextColor={colors.textSecondary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>

                  <View style={styles.optionsRow}>
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
                  )}

                  {/* <AddressInput
                    address={address}
                    onChangeAddress={setAddress}
                    selectedToken={selectedToken}
                  /> */}
                </>
              )}
            </Animated.View>

            {/* Note Input */}
            <Animated.View entering={FadeIn.delay(300)} style={styles.inputGroup}>
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
      <Animated.View entering={FadeInDown.duration(300)} style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!amount || !address && !selectedContact) && styles.sendButtonDisabled
          ]}
          disabled={!amount || (!address && !selectedContact)}
          onPress={handleSend}
        >
          <Text style={styles.sendButtonText}>Preview Transaction</Text>
          <ArrowRight size={20} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>

      {/* Token Selector Modal */}
      {showTokenSelector && (
        <TokenSelector
          tokenList={tokenList}
          selectedToken={selectedToken}
          onSelectToken={(token) => {
            setSelectedToken(token);
            setShowTokenSelector(false);
          }}
          onClose={() => setShowTokenSelector(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
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
    outlineStyle: 'none',
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
    outlineStyle: 'none',
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundMedium,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 56,
  },
  sendButtonDisabled: {
    backgroundColor: colors.backgroundLight,
    opacity: 0.7,
  },
  sendButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    marginRight: 8,
  },
});