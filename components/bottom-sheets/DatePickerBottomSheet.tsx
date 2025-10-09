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
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  useBottomSheetScrollableCreator,
} from '@gorhom/bottom-sheet';
import SettingsHeader from '@/components/SettingsHeader';
import colors from '@/constants/colors';
import { StorageService } from '@/utils/storage';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface DatePickerBottomSheetProps {
  onDateSelect: (date: Date) => void;
  onClose: () => void;
}

export interface DatePickerBottomSheetRef {
  expand: () => void;
  close: () => void;
}

const DatePickerBottomSheet = forwardRef<
  DatePickerBottomSheetRef,
  DatePickerBottomSheetProps
>(({ onDateSelect, onClose }, ref) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Load current date from storage
  const [initialDate, setInitialDate] = useState<Date | null>(null);

  useImperativeHandle(ref, () => ({
    expand: () => bottomSheetRef.current?.expand(),
    close: () => bottomSheetRef.current?.close(),
  }));

  useEffect(() => {
    const loadCurrentDate = async () => {
      try {
        const currentInfo = await StorageService.loadPersonalInfo();
        if (currentInfo?.dateOfBirth) {
          const date = new Date(currentInfo.dateOfBirth);
          if (!isNaN(date.getTime())) {
            setInitialDate(date);
          }
        }
      } catch (error) {
        console.error('Error loading current date:', error);
      }
    };

    loadCurrentDate();
  }, []);

  // Current year for reasonable defaults when user starts selecting
  const currentYear = new Date().getFullYear();
  const defaultYear = currentYear - 25; // 25 years ago as a reasonable default

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Set initial values when loaded from storage
  useEffect(() => {
    if (initialDate) {
      setSelectedDay(initialDate.getDate());
      setSelectedMonth(initialDate.getMonth());
      setSelectedYear(initialDate.getFullYear());
    }
  }, [initialDate]);

  // Generate arrays for the pickers
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const years = useMemo(() => {
    const yearArray = [];
    const startYear = currentYear - 100; // 100 years ago
    const endYear = currentYear - 13; // Minimum age of 13
    for (let year = endYear; year >= startYear; year--) {
      yearArray.push(year);
    }
    return yearArray;
  }, [currentYear]);

  const days = useMemo(() => {
    if (selectedMonth === null || selectedYear === null) {
      return Array.from({ length: 31 }, (_, i) => i + 1);
    }
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear]);

  // Update selected day if it exceeds the days in the selected month
  useEffect(() => {
    if (
      selectedDay !== null &&
      selectedMonth !== null &&
      selectedYear !== null
    ) {
      const daysInMonth = new Date(
        selectedYear,
        selectedMonth + 1,
        0,
      ).getDate();
      if (selectedDay > daysInMonth) {
        setSelectedDay(daysInMonth);
      }
    }
  }, [selectedMonth, selectedYear]);

  const handleDateConfirm = async () => {
    // Only confirm if all values are selected
    if (
      selectedYear === null ||
      selectedMonth === null ||
      selectedDay === null
    ) {
      return;
    }

    const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);

    // Save to storage
    try {
      const currentInfo = await StorageService.loadPersonalInfo();
      if (currentInfo) {
        const updatedInfo = {
          ...currentInfo,
          dateOfBirth: selectedDate.toISOString(),
        };
        await StorageService.savePersonalInfo(updatedInfo);
      }
    } catch (error) {
      console.error('Error saving date to storage:', error);
    }

    // Close bottom sheet and call callback
    bottomSheetRef.current?.close();
    setTimeout(() => {
      onDateSelect(selectedDate);
    }, 200);
  };

  const handleClose = () => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const renderPickerItem = (
    item: any,
    type: 'month' | 'day' | 'year',
    isSelected: boolean,
  ) => (
    <TouchableOpacity
      style={[styles.pickerItem, isSelected && styles.selectedPickerItem]}
      onPress={() => {
        if (type === 'month') {
          setSelectedMonth(item);
        } else if (type === 'day') {
          setSelectedDay(item);
        } else if (type === 'year') {
          setSelectedYear(item);
        }
      }}
    >
      <Text
        style={[
          styles.pickerItemText,
          isSelected && styles.selectedPickerItemText,
        ]}
      >
        {type === 'month' ? months[item] : item}
      </Text>
    </TouchableOpacity>
  );

  const isDateValid =
    selectedYear !== null && selectedMonth !== null && selectedDay !== null;

  // Create scrollable component for FlashList
  const BottomSheetFlashListScrollable = useBottomSheetScrollableCreator();

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
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
      onClose={handleClose}
    >
      <BottomSheetView style={styles.bottomSheetContent}>
        <SettingsHeader title="Select Date of Birth" onClose={handleClose} />

        <View style={styles.datePickerContainer}>
          <View style={styles.pickerColumn}>
            <Text style={styles.pickerColumnTitle}>Month</Text>
            <FlashList
              data={months.map((_, index) => index)}
              renderItem={({ item }) =>
                renderPickerItem(item, 'month', item === selectedMonth)
              }
              keyExtractor={(item) => item.toString()}
              style={styles.pickerList}
              showsVerticalScrollIndicator={false}
              renderScrollComponent={BottomSheetFlashListScrollable}
            />
          </View>

          <View style={styles.pickerColumn}>
            <Text style={styles.pickerColumnTitle}>Day</Text>
            <FlashList
              data={days}
              renderItem={({ item }) =>
                renderPickerItem(item, 'day', item === selectedDay)
              }
              keyExtractor={(item) => item.toString()}
              style={styles.pickerList}
              showsVerticalScrollIndicator={false}
              renderScrollComponent={BottomSheetFlashListScrollable}
            />
          </View>

          <View style={styles.pickerColumn}>
            <Text style={styles.pickerColumnTitle}>Year</Text>
            <FlashList
              data={years}
              renderItem={({ item }) =>
                renderPickerItem(item, 'year', item === selectedYear)
              }
              keyExtractor={(item) => item.toString()}
              style={styles.pickerList}
              showsVerticalScrollIndicator={false}
              renderScrollComponent={BottomSheetFlashListScrollable}
            />
          </View>
        </View>

        <View style={styles.confirmButtonContainer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              !isDateValid && styles.confirmButtonDisabled,
            ]}
            onPress={handleDateConfirm}
            disabled={!isDateValid}
          >
            <Text
              style={[
                styles.confirmButtonText,
                !isDateValid && styles.confirmButtonTextDisabled,
              ]}
            >
              Confirm Date
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});

DatePickerBottomSheet.displayName = 'DatePickerBottomSheet';

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: colors.backgroundDark,
  },
  bottomSheetHandle: {
    backgroundColor: colors.textSecondary,
  },
  bottomSheetContent: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  datePickerContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: scale(4),
  },
  pickerColumnTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: verticalScale(12),
  },
  pickerList: {
    maxHeight: verticalScale(300),
  },
  pickerItem: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(8),
    marginVertical: verticalScale(2),
    borderRadius: scale(8),
    alignItems: 'center',
  },
  selectedPickerItem: {
    backgroundColor: colors.primary,
  },
  pickerItemText: {
    fontSize: moderateScale(16),
    color: colors.textPrimary,
    textAlign: 'center',
  },
  selectedPickerItemText: {
    color: colors.white,
    fontWeight: '600',
  },
  confirmButtonContainer: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(16),
    paddingTop: verticalScale(8),
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: verticalScale(16),
    borderRadius: scale(12),
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.backgroundMedium,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  confirmButtonTextDisabled: {
    color: colors.textSecondary,
  },
});

export default DatePickerBottomSheet;
