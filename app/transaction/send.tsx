import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Search, Send, User, ArrowRight } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import { getCryptoData, getCryptoById } from '@/data/crypto';
import CryptoSelector from '@/components/CryptoSelector';
import AddressInput from '@/components/AddressInput';
import RecentContacts from '@/data/contacts';

export default function SendScreen() {
  const { cryptoId } = useLocalSearchParams();
  const router = useRouter();
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [cryptoList, setCryptoList] = useState([]);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [showCryptoSelector, setShowCryptoSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [filteredContacts, setFilteredContacts] = useState(RecentContacts);

  useEffect(() => {
    loadData();
  }, [cryptoId]);

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

  const loadData = async () => {
    const cryptos = await getCryptoData();
    setCryptoList(cryptos);
    
    if (cryptoId) {
      const crypto = await getCryptoById(cryptoId);
      setSelectedCrypto(crypto);
    } else if (cryptos.length > 0) {
      setSelectedCrypto(cryptos[0]);
    }
  };

  const handleSend = () => {
    // In a real app, this would connect to a blockchain API
    // and initiate a transaction
    alert(`Sending ${amount} ${selectedCrypto.symbol} to ${address || selectedContact?.username}`);
    router.back();
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setAddress(contact.address);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send {selectedCrypto?.symbol}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {selectedCrypto && (
          <>
            {/* Crypto Selection */}
            <TouchableOpacity 
              style={styles.cryptoSelector}
              onPress={() => setShowCryptoSelector(true)}
            >
              <Image 
                source={{ uri: selectedCrypto.iconUrl }} 
                style={styles.cryptoIcon} 
              />
              <View style={styles.cryptoInfo}>
                <Text style={styles.cryptoName}>{selectedCrypto.name}</Text>
                <Text style={styles.cryptoBalance}>
                  Balance: {selectedCrypto.balance.toFixed(4)} {selectedCrypto.symbol}
                </Text>
              </View>
              <Text style={styles.cryptoValue}>
                {formatCurrency(selectedCrypto.balance * selectedCrypto.price)}
              </Text>
            </TouchableOpacity>

            {/* Amount Input */}
            <Animated.View entering={FadeIn.delay(100)} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount</Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={styles.amountCurrency}>{selectedCrypto.symbol}</Text>
              </View>
              <Text style={styles.amountInFiat}>
                {amount ? formatCurrency(parseFloat(amount) * selectedCrypto.price) : formatCurrency(0)}
              </Text>
              <View style={styles.amountOptions}>
                <TouchableOpacity 
                  style={styles.amountOption}
                  onPress={() => setAmount((selectedCrypto.balance * 0.25).toFixed(4))}
                >
                  <Text style={styles.amountOptionText}>25%</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.amountOption}
                  onPress={() => setAmount((selectedCrypto.balance * 0.5).toFixed(4))}
                >
                  <Text style={styles.amountOptionText}>50%</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.amountOption}
                  onPress={() => setAmount((selectedCrypto.balance * 0.75).toFixed(4))}
                >
                  <Text style={styles.amountOptionText}>75%</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.amountOption}
                  onPress={() => setAmount(selectedCrypto.balance.toFixed(4))}
                >
                  <Text style={styles.amountOptionText}>MAX</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

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
                  
                  <AddressInput 
                    address={address} 
                    onChangeAddress={setAddress} 
                    selectedCrypto={selectedCrypto}
                  />
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
            <Animated.View entering={FadeIn.delay(400)} style={styles.feeContainer}>
              <Text style={styles.feeLabel}>Network Fee</Text>
              <Text style={styles.feeValue}>
                0.00005 {selectedCrypto.symbol} (~{formatCurrency(0.00005 * selectedCrypto.price)})
              </Text>
            </Animated.View>
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

      {/* Crypto Selector Modal */}
      {showCryptoSelector && (
        <CryptoSelector
          cryptoList={cryptoList}
          selectedCrypto={selectedCrypto}
          onSelectCrypto={(crypto) => {
            setSelectedCrypto(crypto);
            setShowCryptoSelector(false);
          }}
          onClose={() => setShowCryptoSelector(false)}
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
    paddingTop: 60,
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
  cryptoSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  cryptoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  cryptoInfo: {
    flex: 1,
  },
  cryptoName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  cryptoBalance: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  cryptoValue: {
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