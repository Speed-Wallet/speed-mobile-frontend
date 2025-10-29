import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Calendar, ChevronDown } from 'lucide-react-native';
import colors from '@/constants/colors';
import IntroScreen from '@/components/wallet/IntroScreen';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import DatePickerBottomSheet, {
  DatePickerBottomSheetRef,
} from '@/components/bottom-sheets/DatePickerBottomSheet';
import { triggerShake } from '@/utils/animations';

interface DateOfBirthStepProps {
  onNext: (dateOfBirth: Date) => Promise<void>;
  onBack?: () => void;
  initialDate?: Date;
  isLoading?: boolean;
}

const DateOfBirthStep: React.FC<DateOfBirthStepProps> = ({
  onNext,
  onBack,
  initialDate,
  isLoading = false,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialDate || null,
  );
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const datePickerRef = useRef<DatePickerBottomSheetRef>(null);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select your date of birth';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDateSelect = () => {
    datePickerRef.current?.present();
  };

  const handleDatePicked = (date: Date) => {
    setSelectedDate(date);
  };

  const handleContinue = async () => {
    if (!selectedDate) {
      triggerShake(shakeAnimationValue);
      return;
    }

    try {
      await onNext(selectedDate);
    } catch (error) {
      console.error('Error in date of birth step:', error);
      triggerShake(shakeAnimationValue);
    }
  };

  const isValid = selectedDate !== null;

  return (
    <>
      <IntroScreen
        title="Date of Birth"
        subtitle="Select your date of birth"
        footer={
          <PrimaryActionButton
            title={isLoading ? 'Loading...' : 'Continue'}
            onPress={handleContinue}
            disabled={!isValid || isLoading}
            loading={isLoading}
            variant="primary"
          />
        }
      >
        {/* Development Back Button */}
        {/* Removed - back button not needed in KYC flow */}

        <View style={styles.contentContainer}>
          {/* Date Selector */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <Animated.View
              style={[{ transform: [{ translateX: shakeAnimationValue }] }]}
            >
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={handleDateSelect}
                disabled={isLoading}
              >
                <View style={styles.dateSelectorContent}>
                  <Calendar
                    size={20}
                    color="#9ca3af"
                    style={styles.inputIcon}
                  />
                  <Text
                    style={[
                      styles.dateText,
                      !selectedDate && styles.dateTextPlaceholder,
                    ]}
                  >
                    {formatDate(selectedDate)}
                  </Text>
                </View>
                <ChevronDown size={20} color="#9ca3af" />
              </TouchableOpacity>
            </Animated.View>
            {!selectedDate && (
              <Text style={styles.inputHint}>
                You must be at least 18 years old
              </Text>
            )}
          </View>
        </View>
      </IntroScreen>

      {/* Date Picker Bottom Sheet */}
      <DatePickerBottomSheet
        ref={datePickerRef}
        onDateSelect={handleDatePicked}
        onClose={() => {}}
      />
    </>
  );
};

const styles = StyleSheet.create({
  devBackButton: {
    position: 'absolute',
    top: verticalScale(20),
    left: scale(20),
    zIndex: 100,
  },
  contentContainer: {
    gap: verticalScale(20),
  },
  inputContainer: {
    marginBottom: verticalScale(4),
  },
  inputLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: verticalScale(8),
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#404040',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
  },
  dateSelectorContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: scale(12),
  },
  dateText: {
    fontSize: moderateScale(16),
    color: colors.textPrimary,
    fontFamily: 'Inter-Medium',
  },
  dateTextPlaceholder: {
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  inputHint: {
    fontSize: moderateScale(13),
    color: '#9ca3af',
    marginTop: verticalScale(6),
  },
});

export default DateOfBirthStep;
