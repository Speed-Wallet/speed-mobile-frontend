import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, TextInput, Modal } from 'react-native';
import { X, Search } from 'lucide-react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import { getAllTokenInfo } from '@/data/tokens';
import { EnrichedTokenEntry, TokenEntry } from '@/data/types';
import TokenItemAlt from '@/components/TokenItemAlt'; // Import the new component

type TokenSelectorProps = {
  selectedToken: TokenEntry | null;
  excludeTokenAddress?: string;
  onSelectToken: (token: EnrichedTokenEntry) => void;
  onClose: () => void;
};

const TokenSelector = ({
  selectedToken,
  excludeTokenAddress,
  onSelectToken,
  onClose 
}: TokenSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const tokenList = getAllTokenInfo()
  
  const filteredTokens = tokenList
    .filter(token =>
      excludeTokenAddress ? token.address !== excludeTokenAddress : true
    )
    .filter(token =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          entering={SlideInUp.duration(300)} 
          style={styles.modalContainer}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Select Token</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or symbol"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <FlatList
            data={filteredTokens}
            keyExtractor={(token) => token.address}
            renderItem={({ item }) => (
              <TokenItemAlt 
                token={item} 
                selectedToken={selectedToken} 
                onSelectToken={onSelectToken} 
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.backgroundDark,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderColor: colors.backgroundMedium,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    outlineStyle: 'none', // Not standard in React Native, but included for consistency
  },
  listContent: {
    padding: 16,
    // paddingHorizontal: 16,
    // paddingBottom: 24,
  },
});

export default TokenSelector;