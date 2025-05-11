import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, TextInput, Modal } from 'react-native';
import { X, Search } from 'lucide-react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';

type TokenSelectorProps = {
  tokenList: any[];
  selectedToken: any;
  excludeTokenId?: string;
  onSelectToken: (token: any) => void;
  onClose: () => void;
};

const TokenSelector = ({
  tokenList,
  selectedToken,
  excludeTokenId,
  onSelectToken,
  onClose 
}: TokenSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredTokens = tokenList
    .filter(token =>
      excludeTokenId ? token.id !== excludeTokenId : true
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
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.tokenItem,
                  selectedToken?.id === item.id && styles.selectedTokenItem
                ]}
                onPress={() => onSelectToken(item)}
              >
                <Image source={{ uri: item.iconUrl }} style={styles.tokenIcon} />
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenName}>{item.name}</Text>
                  <Text style={styles.tokenSymbol}>{item.symbol}</Text>
                </View>
                <View style={styles.tokenBalance}>
                  <Text style={styles.balanceText}>{item.balance.toFixed(4)}</Text>
                  <Text style={styles.balanceValue}>
                    {formatCurrency(item.balance * item.price)}
                  </Text>
                </View>
              </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundMedium,
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
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundMedium,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedTokenItem: {
    backgroundColor: colors.backgroundMedium,
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
  tokenSymbol: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  balanceText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  balanceValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
});

export default TokenSelector;