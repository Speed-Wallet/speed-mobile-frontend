import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import colors from '@/constants/colors';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  padding?: number;
  fontSize?: number;
  iconSize?: number;
  showSearchIcon?: boolean;
  autoFocus?: boolean;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  placeholder = 'Search...',
  padding = scale(15),
  fontSize = moderateScale(15),
  iconSize = scale(20),
  showSearchIcon = true,
  autoFocus = false,
}: SearchBarProps) {
  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <View style={[styles.searchContainer, { padding: padding }]}>
      {showSearchIcon && (
        <Search
          size={iconSize}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
      )}
      <TextInput
        style={[styles.searchInput, { fontSize: fontSize }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={onSearchChange}
        autoFocus={autoFocus}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <X size={iconSize * 0.9} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // padding is now set via prop
    borderColor: colors.backgroundMedium,
    borderWidth: 1,
    borderRadius: scale(11),
    // flex: 1
  },
  searchIcon: {
    marginRight: scale(7),
  },
  searchInput: {
    flex: 1,
    // fontSize is now set via prop
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
  },
  clearButton: {
    // padding: scale(4),
    marginLeft: scale(4),
  },
});
