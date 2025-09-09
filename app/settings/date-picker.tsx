import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import SettingsHeader from '@/components/SettingsHeader';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import { StorageService, PersonalInfo } from '@/utils/storage';

export default function DatePickerScreen() {
  // Load current date from storage
  const [initialDate, setInitialDate] = useState<Date | null>(null);

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

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 18; year >= currentYear - 100; year--) {
      years.push(year);
    }
    return years;
  };

  const generateDays = () => {
    // Always show days 1-31, but limit based on selected month if available
    let maxDays = 31;
    if (selectedMonth !== null) {
      if (selectedMonth === 1) {
        // February (0-indexed)
        // For February, use year if available, otherwise default to 28 (non-leap year)
        maxDays =
          selectedYear !== null
            ? getDaysInMonth(selectedMonth, selectedYear)
            : 28;
      } else {
        // For all other months, we can determine days without needing the year
        maxDays = getDaysInMonth(selectedMonth, selectedYear || 2024); // Use any non-leap year as default
      }
    }

    const days = [];
    for (let day = 1; day <= maxDays; day++) {
      days.push(day);
    }
    return days;
  };

  // Validate selected day when month or year changes
  useEffect(() => {
    if (selectedMonth !== null && selectedDay !== null) {
      let maxDaysInMonth;
      if (selectedMonth === 1) {
        // February
        // For February, use year if available, otherwise default to 28
        maxDaysInMonth =
          selectedYear !== null
            ? getDaysInMonth(selectedMonth, selectedYear)
            : 28;
      } else {
        // For other months, year doesn't matter
        maxDaysInMonth = getDaysInMonth(selectedMonth, selectedYear || 2024);
      }

      if (selectedDay > maxDaysInMonth) {
        setSelectedDay(maxDaysInMonth);
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

    // Navigate back without parameters - KYC will reload from storage
    router.replace('/settings/kyc');
  };

  const renderPickerItem = (
    item: any,
    type: 'day' | 'month' | 'year',
    isSelected: boolean,
  ) => (
    <TouchableOpacity
      style={[styles.pickerItem, isSelected && styles.selectedPickerItem]}
      onPress={() => {
        if (type === 'day') setSelectedDay(item);
        else if (type === 'month') setSelectedMonth(item);
        else if (type === 'year') setSelectedYear(item);
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

  return (
    <SafeAreaView style={styles.container}>
      <SettingsHeader
        title="Select Date of Birth"
        onClose={() => router.back()}
      />

      <View style={styles.datePickerContainer}>
        <View style={styles.pickerColumn}>
          <Text style={styles.pickerColumnTitle}>Month</Text>
          <FlatList
            data={months.map((_, index) => index)}
            renderItem={({ item }) =>
              renderPickerItem(item, 'month', item === selectedMonth)
            }
            keyExtractor={(item) => item.toString()}
            style={styles.pickerList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pickerListContent}
          />
        </View>

        <View style={styles.pickerColumn}>
          <Text style={styles.pickerColumnTitle}>Day</Text>
          <FlatList
            data={generateDays()}
            renderItem={({ item }) =>
              renderPickerItem(item, 'day', item === selectedDay)
            }
            keyExtractor={(item) => item.toString()}
            style={styles.pickerList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pickerListContent}
          />
        </View>

        <View style={styles.pickerColumn}>
          <Text style={styles.pickerColumnTitle}>Year</Text>
          <FlatList
            data={generateYears()}
            renderItem={({ item }) =>
              renderPickerItem(item, 'year', item === selectedYear)
            }
            keyExtractor={(item) => item.toString()}
            style={styles.pickerList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pickerListContent}
          />
        </View>
      </View>

      <View style={styles.confirmButtonContainer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (selectedDay === null ||
              selectedMonth === null ||
              selectedYear === null) &&
              styles.confirmButtonDisabled,
          ]}
          onPress={handleDateConfirm}
          disabled={
            selectedDay === null ||
            selectedMonth === null ||
            selectedYear === null
          }
        >
          <Text
            style={[
              styles.confirmButtonText,
              (selectedDay === null ||
                selectedMonth === null ||
                selectedYear === null) &&
                styles.confirmButtonTextDisabled,
            ]}
          >
            Confirm Date
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },

  datePickerContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: scale(15),
    paddingTop: verticalScale(15),
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: scale(3),
  },
  pickerColumnTitle: {
    fontSize: moderateScale(15),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: verticalScale(15),
  },
  pickerList: {
    flex: 1,
  },
  pickerListContent: {
    paddingBottom: verticalScale(18),
  },
  pickerItem: {
    paddingVertical: verticalScale(11),
    paddingHorizontal: scale(7),
    borderRadius: scale(7),
    marginVertical: verticalScale(2),
    backgroundColor: colors.backgroundMedium,
  },
  selectedPickerItem: {
    backgroundColor: '#3b82f6',
  },
  pickerItemText: {
    fontSize: moderateScale(15),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  selectedPickerItemText: {
    color: colors.textPrimary,
    fontFamily: 'Inter-SemiBold',
  },
  confirmButtonContainer: {
    padding: scale(15),
    borderTopWidth: 1,
    borderTopColor: colors.backgroundMedium,
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: verticalScale(15),
    borderRadius: scale(11),
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.backgroundMedium,
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: moderateScale(15),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  confirmButtonTextDisabled: {
    color: colors.textSecondary,
  },
});
