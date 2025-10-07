import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import colors from '@/constants/colors';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  placeholder = 'Search...',
}: SearchBarProps) {
  return (
    <View style={[styles.searchContainer]}>
      <Search
        size={scale(20)}
        color={colors.textSecondary}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={onSearchChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(11),
    borderColor: colors.backgroundMedium,
    borderWidth: 1,
    borderRadius: scale(11),
  },
  searchIcon: {
    marginRight: scale(7),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(15),
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
  },
});
