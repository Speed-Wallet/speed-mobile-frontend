import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Calendar, ChevronDown } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import colors from '@/constants/colors';
import IntroScreen from '@/components/wallet/IntroScreen';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
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
  // Calculate default date (18 years ago)
  const getDefaultDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate || getDefaultDate(),
  );
  const [showPicker, setShowPicker] = useState(false);
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDateSelect = () => {
    setShowPicker(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      // On Android, hide picker after selection
      setShowPicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
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

  // Calculate maximum date (18 years ago)
  const getMaximumDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date;
  };

  // Calculate minimum date (120 years ago)
  const getMinimumDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 120);
    return date;
  };

  return (
    <IntroScreen
      title="Date of Birth"
      subtitle="Select your date of birth"
      footer={
        <PrimaryActionButton
          title={isLoading ? 'Loading...' : 'Continue'}
          onPress={handleContinue}
          disabled={isLoading}
          loading={isLoading}
          variant="primary"
        />
      }
    >
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
                <Calendar size={20} color="#9ca3af" style={styles.inputIcon} />
                <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
              </View>
              <ChevronDown size={20} color="#9ca3af" />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.inputHint}>
            You must be at least 18 years old
          </Text>
        </View>

        {/* Date Picker - iOS shows inline when showPicker is true, Android shows native dialog */}
        {showPicker && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              maximumDate={getMaximumDate()}
              minimumDate={getMinimumDate()}
              textColor={Platform.OS === 'ios' ? colors.textPrimary : undefined}
              themeVariant={Platform.OS === 'ios' ? 'dark' : undefined}
              style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </IntroScreen>
  );
};

const styles = StyleSheet.create({
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
  inputHint: {
    fontSize: moderateScale(13),
    color: '#9ca3af',
    marginTop: verticalScale(6),
  },
  pickerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: verticalScale(20),
  },
  iosPicker: {
    width: scale(320),
    height: verticalScale(200),
  },
  doneButton: {
    backgroundColor: colors.primary,
    marginTop: verticalScale(20),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(40),
    borderRadius: scale(12),
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: 'Inter-SemiBold',
  },
});

export default DateOfBirthStep;
