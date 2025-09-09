import React, { useState, useEffect } from 'react';
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
import { router } from 'expo-router';
import SettingsHeader from '@/components/SettingsHeader';
import colors from '@/constants/colors';
import { countries, Country } from '@/constants/countries';
import { StorageService, PersonalInfo } from '@/utils/storage';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

export default function CountryPickerScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  // Load current country from storage
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  useEffect(() => {
    const loadCurrentCountry = async () => {
      try {
        const currentInfo = await StorageService.loadPersonalInfo();
        if (currentInfo?.selectedCountry) {
          const country = countries.find(
            (c) => c.code === currentInfo.selectedCountry.code,
          );
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

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery),
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
        selectedCountry?.code === item.code && styles.selectedCountryItem,
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
      <SettingsHeader title="Select Country" onClose={() => router.back()} />

      <View style={styles.searchContainer}>
        <Search
          size={scale(20)}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(11),
    borderColor: colors.backgroundMedium,
    borderWidth: 1,
    borderRadius: scale(11),
    marginHorizontal: scale(15),
    marginBottom: verticalScale(15),
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
  listContent: {
    paddingHorizontal: scale(15),
    paddingBottom: verticalScale(22),
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(14),
    borderRadius: scale(11),
    marginBottom: 4,
    backgroundColor: colors.backgroundMedium,
  },
  selectedCountryItem: {
    backgroundColor: '#3b82f6',
  },
  countryFlag: {
    fontSize: moderateScale(22),
    marginRight: scale(14),
  },
  countryName: {
    flex: 1,
    fontSize: moderateScale(15),
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  countryCode: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    opacity: 0.8,
    marginRight: scale(7),
  },
});
