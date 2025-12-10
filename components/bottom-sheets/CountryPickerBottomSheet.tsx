import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  useBottomSheetScrollableCreator,
} from '@gorhom/bottom-sheet';
import SettingsHeader from '@/components/SettingsHeader';
import SearchBar from '@/components/SearchBar';
import colors from '@/constants/colors';
import { countries, Country } from '@/constants/countries';
import { StorageService } from '@/utils/storage';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import BottomActionContainer from '@/components/BottomActionContainer';

interface CountryPickerBottomSheetProps {
  countries?: Country[];
  onCountrySelect: (country: Country) => void;
  onClose: () => void;
  showDialCode?: boolean;
}

export interface CountryPickerBottomSheetRef {
  present: () => void;
  dismiss: () => void;
}

const CountryPickerBottomSheet = forwardRef<
  CountryPickerBottomSheetRef,
  CountryPickerBottomSheetProps
>(
  (
    { countries: countriesProp, onCountrySelect, onClose, showDialCode = true },
    ref,
  ) => {
    const availableCountries = countriesProp || countries;
    const [searchQuery, setSearchQuery] = useState('');
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const searchBarTranslateY = useSharedValue(0);
    const lastScrollY = useRef(0);

    // Load current country from storage
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(
      null,
    );

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    useEffect(() => {
      const loadCurrentCountry = async () => {
        try {
          const currentInfo = await StorageService.loadPersonalInfo();
          if (currentInfo?.selectedCountry) {
            const country = availableCountries.find(
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
    }, [availableCountries]);

    const filteredCountries = availableCountries.filter(
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

      // Close bottom sheet and call callback
      bottomSheetRef.current?.dismiss();
      setTimeout(() => {
        onCountrySelect(country);
      }, 200);
    };

    const handleClose = () => {
      bottomSheetRef.current?.dismiss();
      setTimeout(() => {
        onClose();
      }, 200);
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
        {showDialCode && (
          <Text style={styles.countryCode}>{item.dialCode}</Text>
        )}
      </TouchableOpacity>
    );

    const handleScroll = (event: any) => {
      const currentOffset = event.nativeEvent.contentOffset.y;
      const diff = currentOffset - lastScrollY.current;

      // Hide search bar when scrolling down, show when scrolling up
      if (diff > 5 && currentOffset > 20) {
        // Scrolling down
        searchBarTranslateY.value = withTiming(100, { duration: 200 });
      } else if (diff < -5 || currentOffset <= 0) {
        // Scrolling up or at top
        searchBarTranslateY.value = withTiming(0, { duration: 200 });
      }

      lastScrollY.current = currentOffset;
    };

    // Create scrollable component for FlashList
    const BottomSheetFlashListScrollable = useBottomSheetScrollableCreator();

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={['93%']}
        enableDynamicSizing={false}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.4}
          />
        )}
      >
        <View style={styles.container}>
          {/* Fixed Header */}
          <View style={styles.headerContainer}>
            <SettingsHeader
              title="Select Country"
              onClose={handleClose}
              noPadding={true}
            />
          </View>

          {/* Scrollable List */}

          <FlashList
            data={filteredCountries}
            keyExtractor={(country) => country.code}
            renderItem={renderCountryItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderScrollComponent={BottomSheetFlashListScrollable}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            estimatedItemSize={74}
          />

          {/* Search Bar - Using BottomActionContainer with keyboard avoidance */}
          <BottomActionContainer
            translateY={searchBarTranslateY}
            avoidKeyboard={true}
            edges={['bottom']}
          >
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              placeholder="Search by country name or dial code"
            />
          </BottomActionContainer>
        </View>
      </BottomSheetModal>
    );
  },
);

CountryPickerBottomSheet.displayName = 'CountryPickerBottomSheet';

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: colors.bottomSheetBackground,
  },
  bottomSheetHandle: {
    backgroundColor: colors.textSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bottomSheetBackground,
  },
  headerContainer: {
    // backgroundColor: colors.backgroundDark,
    paddingHorizontal: scale(16),
    marginBottom: 6,
  },
  listContent: {
    paddingHorizontal: scale(15),
    paddingBottom: verticalScale(100), // Extra padding for search bar at bottom
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

export default CountryPickerBottomSheet;
