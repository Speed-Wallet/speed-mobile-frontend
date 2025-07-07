import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import colors from '@/constants/colors';
import { countries, Country } from '@/constants/countries';
import { StorageService, PersonalInfo } from '@/utils/storage';

export default function CountryPickerScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  // Load current country from storage
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  
  useEffect(() => {
    const loadCurrentCountry = async () => {
      try {
        const currentInfo = await StorageService.loadPersonalInfo();
        if (currentInfo?.selectedCountry) {
          const country = countries.find(c => c.code === currentInfo.selectedCountry.code);
          if (country) {
            setSelectedCountry(country);
          }
        }
      } catch (error) {
        console.error('Error loading current country:', error);
      }
    };
    
    loadCurrentCountry();
  }, []);
  
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery)
  );

  const handleSelectCountry = async (country: Country) => {
    // Save to storage
    try {
      const currentInfo = await StorageService.loadPersonalInfo();
      if (currentInfo) {
        const updatedInfo = { ...currentInfo, selectedCountry: country };
        await StorageService.savePersonalInfo(updatedInfo);
      }
    } catch (error) {
      console.error('Error saving country to storage:', error);
    }

    // Navigate back without parameters - KYC will reload from storage
    router.replace('/settings/kyc');
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[
        styles.countryItem,
        selectedCountry?.code === item.code && styles.selectedCountryItem
      ]}
      onPress={() => handleSelectCountry(item)}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryCode}>{item.dialCode}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Country</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by country name or dial code"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <FlatList
        data={filteredCountries}
        keyExtractor={(country) => country.code}
        renderItem={renderCountryItem}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.backgroundMedium,
  },
  selectedCountryItem: {
    backgroundColor: '#3b82f6',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  countryCode: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    opacity: 0.8,
    marginRight: 8,
  },
});
