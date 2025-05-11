import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, TextInput, Modal } from 'react-native';
import { X, Search } from 'lucide-react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';

type CryptoSelectorProps = {
  cryptoList: any[];
  selectedCrypto: any;
  excludeCryptoId?: string;
  onSelectCrypto: (crypto: any) => void;
  onClose: () => void;
};

const CryptoSelector = ({ 
  cryptoList, 
  selectedCrypto, 
  excludeCryptoId, 
  onSelectCrypto, 
  onClose 
}: CryptoSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredCryptos = cryptoList
    .filter(crypto => 
      excludeCryptoId ? crypto.id !== excludeCryptoId : true
    )
    .filter(crypto => 
      crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
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
            <Text style={styles.title}>Select Crypto</Text>
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
            data={filteredCryptos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.cryptoItem,
                  selectedCrypto?.id === item.id && styles.selectedCryptoItem
                ]}
                onPress={() => onSelectCrypto(item)}
              >
                <Image source={{ uri: item.iconUrl }} style={styles.cryptoIcon} />
                <View style={styles.cryptoInfo}>
                  <Text style={styles.cryptoName}>{item.name}</Text>
                  <Text style={styles.cryptoSymbol}>{item.symbol}</Text>
                </View>
                <View style={styles.cryptoBalance}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.backgroundDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  cryptoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedCryptoItem: {
    backgroundColor: colors.backgroundMedium,
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
  cryptoSymbol: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  cryptoBalance: {
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

export default CryptoSelector;