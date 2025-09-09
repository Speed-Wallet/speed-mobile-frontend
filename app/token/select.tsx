import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import SettingsHeader from '@/components/SettingsHeader';
import colors from '@/constants/colors';
import { getAllTokenInfo } from '@/data/tokens';
import { EnrichedTokenEntry, TokenEntry } from '@/data/types';
import TokenItemAlt from '@/components/TokenItemAlt';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

export default function TokenSelectScreen() {
  const { excludeAddress, selectedAddress, returnParam } =
    useLocalSearchParams<{
      excludeAddress?: string;
      selectedAddress?: string;
      returnParam?: string;
    }>();

  const [searchQuery, setSearchQuery] = useState('');

  const tokenList = getAllTokenInfo();

  // Parse selected token from address
  const selectedToken = selectedAddress
    ? tokenList.find((token) => token.address === selectedAddress) || null
    : null;

  const filteredTokens = tokenList
    .filter((token) =>
      excludeAddress ? token.address !== excludeAddress : true,
    )
    .filter(
      (token) =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const handleSelectToken = (token: EnrichedTokenEntry) => {
    // Navigate back with the selected token address
    router.back();
    // Use a timeout to ensure navigation completes before setting params
    setTimeout(() => {
      router.setParams({
        selectedTokenAddress: token.address,
        returnParam: returnParam, // Pass through the returnParam
      });
    }, 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <SettingsHeader title="Select Token" onClose={() => router.back()} />

      <View style={styles.searchContainer}>
        <Search
          size={20}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
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
            onSelectToken={handleSelectToken}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
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
    marginBottom: 16,
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
});
