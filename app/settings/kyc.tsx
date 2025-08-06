import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Animated as RNAnimated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  CreditCard as Edit2,
  Check,
  Clock,
  CircleAlert as AlertCircle,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Video,
  Shield,
  ChevronDown,
  Calendar,
  Save,
  Lock,
} from 'lucide-react-native';
import SettingsScreen from '@/components/SettingsScreen';
import Toast from '@/components/Toast';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  withSpring,
  runOnJS,
  useAnimatedRef,
  scrollTo,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { StorageService, PersonalInfo } from '@/utils/storage';
import { triggerShake } from '@/utils/animations';
import { countries, Country } from '@/constants/countries';
import { sendOtp, checkEmailStatus } from '@/services/otpService';
import EmailBadge, { EmailStatus } from '@/components/EmailBadge';
import EmailVerificationSheet from '@/components/EmailVerificationSheet';

const { width: screenWidth } = Dimensions.get('window');

// Development default values
const developmentInfo = {
  phoneNumber: '60 123 4567',
  firstName: 'Tristan',
  lastName: 'Smith',
  email: 'tristan@example.com',
  address: 'Cape Town',
  streetNumber: '123',
};
const CARD_WIDTH = screenWidth - 40; // Match input field width (20px padding on each side)
const CARD_MARGIN = 0; // No additional margin needed since we're matching input width
const SNAP_INTERVAL = CARD_WIDTH; // Use card width directly for snapping

interface VerificationLevel {
  id: number;
  title: string;
  status: 'completed' | 'pending' | 'not_started' | 'locked';
  description: string;
  color: string;
  icon: 'check' | 'clock' | 'alert' | 'lock';
  accessible: boolean;
  inputs: InputField[];
}

interface InputField {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'email' | 'phone' | 'file' | 'date';
  icon: any;
  value?: string;
}

const getVerificationLevels = (isDevelopment: boolean): VerificationLevel[] => [
  {
    id: 1,
    title: 'Level 1 - Basic',
    status: 'completed',
    description: 'Basic account verification',
    color: '#10b981',
    icon: 'check',
    accessible: true,
    inputs: [
      {
        id: 'phone',
        label: 'Phone Number',
        placeholder: 'Enter your phone number',
        type: 'phone',
        icon: Calendar, // Using Calendar instead of Phone
        value: isDevelopment ? '60 123 4567' : undefined,
      },
      {
        id: 'date_of_birth',
        label: 'Date of Birth',
        placeholder: 'Select your date of birth',
        type: 'date',
        icon: Calendar,
        value: isDevelopment ? '1990-01-15' : undefined,
      },
    ],
  },
  {
    id: 2,
    title: 'Level 2 - Enhanced',
    status: 'locked',
    description: 'Enhanced verification with documents',
    color: '#6b7280',
    icon: 'lock',
    accessible: false,
    inputs: [
      {
        id: 'id_document',
        label: 'Government ID',
        placeholder: 'Upload government-issued ID',
        type: 'file',
        icon: CreditCard,
      },
      {
        id: 'address_proof',
        label: 'Proof of Address',
        placeholder: 'Upload proof of address',
        type: 'file',
        icon: MapPin,
      },
      {
        id: 'selfie',
        label: 'Selfie Verification',
        placeholder: 'Take a selfie for verification',
        type: 'file',
        icon: Shield,
      },
    ],
  },
  {
    id: 3,
    title: 'Level 3 - Premium',
    status: 'locked',
    description: 'Premium verification for high-value transactions',
    color: '#6b7280',
    icon: 'lock',
    accessible: false,
    inputs: [
      {
        id: 'bank_statement',
        label: 'Bank Statement',
        placeholder: 'Upload recent bank statement',
        type: 'file',
        icon: FileText,
      },
      {
        id: 'income_proof',
        label: 'Income Verification',
        placeholder: 'Upload income verification',
        type: 'file',
        icon: CreditCard,
      },
      {
        id: 'video_call',
        label: 'Video Call Verification',
        placeholder: 'Schedule video call verification',
        type: 'text',
        icon: Video,
      },
    ],
  },
];

export default function AccountScreen() {
  const router = useRouter();

  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);

  // Set default values only in development mode
  const isDevelopment = process.env.EXPO_PUBLIC_APP_ENV === 'development';
  const verificationLevels = useMemo(() => {
    return getVerificationLevels(isDevelopment);
  }, [isDevelopment]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    isDevelopment ? new Date(1990, 0, 15) : null,
  );
  const [phoneNumber, setPhoneNumber] = useState(
    isDevelopment ? developmentInfo.phoneNumber : '',
  );
  const [firstName, setFirstName] = useState(
    isDevelopment ? developmentInfo.firstName : '',
  );
  const [lastName, setLastName] = useState(
    isDevelopment ? developmentInfo.lastName : '',
  );
  const [email, setEmail] = useState(
    isDevelopment ? developmentInfo.email : '',
  );
  const [address, setAddress] = useState(
    isDevelopment ? developmentInfo.address : '',
  );
  const [streetNumber, setStreetNumber] = useState(
    isDevelopment ? developmentInfo.streetNumber : '',
  );

  // Validation states
  const [firstNameError, setFirstNameError] = useState(false);

  const [lastNameError, setLastNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [addressError, setAddressError] = useState(false);
  const [streetNumberError, setStreetNumberError] = useState(false);
  const [phoneNumberError, setPhoneNumberError] = useState(false);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>(
    'success',
  );

  // Save button state
  const [isSaving, setIsSaving] = useState(false);

  // OTP verification state
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('unverified');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [showSheet, setShowSheet] = useState(false);

  // Animation for shake effect
  const shakeAnimationValue = useRef(new RNAnimated.Value(0)).current;
  const buttonShakeAnimationValue = useRef(new RNAnimated.Value(0)).current;

  // Input refs for focusing on errors
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const streetNumberRef = useRef<TextInput>(null);
  const phoneNumberRef = useRef<TextInput>(null);

  const scrollX = useSharedValue(0);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();

  // Wrapper function for shake animation that can be called from worklet
  const handleShakeAnimation = () => {
    triggerShake(shakeAnimationValue);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const index = Math.round(event.contentOffset.x / SNAP_INTERVAL);
      // Only allow navigation to accessible levels
      if (index !== currentLevel && verificationLevels[index]?.accessible) {
        runOnJS(setCurrentLevel)(index);
      }
    },
  });

  const panGesture = Gesture.Pan().onEnd((event) => {
    'worklet';
    const threshold = 50;
    let targetIndex = currentLevel;
    let attemptedLockedLevel = false;

    // Guard against undefined verificationLevels
    if (!verificationLevels || verificationLevels.length === 0) {
      return;
    }

    if (event.translationX > threshold && currentLevel > 0) {
      // Find the previous accessible level
      for (let i = currentLevel - 1; i >= 0; i--) {
        if (verificationLevels[i]?.accessible) {
          targetIndex = i;
          break;
        }
      }
    } else if (
      event.translationX < -threshold &&
      currentLevel < verificationLevels.length - 1
    ) {
      // Check if user is trying to access a locked level
      const nextIndex = currentLevel + 1;
      if (
        nextIndex < verificationLevels.length &&
        !verificationLevels[nextIndex]?.accessible
      ) {
        attemptedLockedLevel = true;
      }

      // Find the next accessible level
      for (let i = currentLevel + 1; i < verificationLevels.length; i++) {
        if (verificationLevels[i]?.accessible) {
          targetIndex = i;
          break;
        }
      }
    }

    if (attemptedLockedLevel) {
      // Trigger shake animation when trying to access locked level
      runOnJS(handleShakeAnimation)();
    } else if (targetIndex !== currentLevel) {
      scrollTo(scrollViewRef, targetIndex * SNAP_INTERVAL, 0, true);
      runOnJS(setCurrentLevel)(targetIndex);
    }
  });

  const getStatusIcon = (iconType: string, color: string) => {
    switch (iconType) {
      case 'check':
        return <Check size={16} color={color} />;
      case 'clock':
        return <Clock size={16} color={color} />;
      case 'alert':
        return <AlertCircle size={16} color={color} />;
      case 'lock':
        return <Lock size={16} color={color} />;
      default:
        return <Check size={16} color={color} />;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select your date of birth';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateName = (name: string): boolean => {
    return name.trim().length >= 4;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return cleanPhone.length >= 8;
  };

  const validateAddress = (address: string): boolean => {
    return address.trim().length >= 5;
  };

  const validateStreetNumber = (streetNumber: string): boolean => {
    return streetNumber.trim().length >= 1;
  };

  // Check if all fields are valid
  const isFormValid = (): boolean => {
    return (
      !firstNameError &&
      !lastNameError &&
      !emailError &&
      !addressError &&
      !streetNumberError &&
      !phoneNumberError &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      email.trim().length > 0 &&
      address.trim().length > 0 &&
      streetNumber.trim().length > 0 &&
      phoneNumber.trim().length > 0
    );
  };

  // Focus first invalid field
  const focusFirstInvalidField = () => {
    // First blur all inputs to ensure we can refocus properly
    [
      firstNameRef,
      lastNameRef,
      emailRef,
      addressRef,
      streetNumberRef,
      phoneNumberRef,
    ].forEach((ref) => {
      if (ref.current) {
        ref.current.blur();
      }
    });

    // Use setTimeout to ensure blur completes before focusing
    setTimeout(() => {
      if (firstNameError && firstNameRef.current) {
        firstNameRef.current.focus();
        return;
      }
      if (lastNameError && lastNameRef.current) {
        lastNameRef.current.focus();
        return;
      }
      if (emailError && emailRef.current) {
        emailRef.current.focus();
        return;
      }
      if (addressError && addressRef.current) {
        addressRef.current.focus();
        return;
      }
      if (streetNumberError && streetNumberRef.current) {
        streetNumberRef.current.focus();
        return;
      }
      if (phoneNumberError && phoneNumberRef.current) {
        phoneNumberRef.current.focus();
        return;
      }
    }, 100);
  };

  const handleSaveButtonPress = async () => {
    if (!isFormValid()) {
      triggerShake(buttonShakeAnimationValue);
      focusFirstInvalidField();
      return;
    }

    // Handle OTP verification flow
    if (emailStatus === 'needs_verification') {
      setIsSaving(true);
      try {
        // Send OTP directly since we already checked verification status on mount
        const response = await sendOtp(email);
        setOtpId(response.otpId || null);
        setOtpExpiresAt(response.expiresAt || null);
        setEmailStatus('otp_pending');
        setShowSheet(true);
        setToastMessage('Verification code sent to your email');
        setToastType('info');
        setShowToast(true);
      } catch (error) {
        setToastMessage('Failed to send verification code');
        setToastType('error');
        setShowToast(true);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (emailStatus === 'otp_pending') {
      setShowSheet(true);
      return;
    }

    // Default save behavior
    setIsSaving(true);
    try {
      await savePersonalInfo();
      setToastMessage('Details saved successfully ✅');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Error saving details');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const savePersonalInfo = async (overrides?: Partial<PersonalInfo>) => {
    try {
      const personalInfo: PersonalInfo = {
        name: `${firstName} ${lastName}`,
        email,
        phoneNumber,
        dateOfBirth: selectedDate?.toISOString() || '',
        address,
        streetNumber,
        selectedCountry,
        ...overrides, // Allow overriding specific fields
      };
      await StorageService.savePersonalInfo(personalInfo);
    } catch (error) {
      console.error('Error saving personal info:', error);
      throw error;
    }
  };

  const loadPersonalInfo = async () => {
    const savedInfo = await StorageService.loadPersonalInfo();
    if (savedInfo) {
      // Split the name into first and last name
      const nameParts = savedInfo.name.split(' ');
      const firstName =
        nameParts[0] || (isDevelopment ? developmentInfo.firstName : '');
      const lastName =
        nameParts.slice(1).join(' ') ||
        (isDevelopment ? developmentInfo.lastName : '');

      setFirstName(firstName);
      setLastName(lastName);

      // Validate names on load
      setFirstNameError(!validateName(firstName));
      setLastNameError(!validateName(lastName));

      setEmail(savedInfo.email);
      setEmailError(!validateEmail(savedInfo.email));

      // Check if email is already verified when loading
      if (savedInfo.email && validateEmail(savedInfo.email)) {
        try {
          const statusResponse = await checkEmailStatus(savedInfo.email);
          if (statusResponse.isVerified) {
            setEmailStatus('verified');
          } else {
            setEmailStatus('needs_verification');
          }
        } catch (error) {
          console.error('Error checking email status on load:', error);
          setEmailStatus('needs_verification');
        }
      }

      setPhoneNumber(savedInfo.phoneNumber);
      setPhoneNumberError(!validatePhoneNumber(savedInfo.phoneNumber));

      // Only set date if it exists and is valid
      if (savedInfo.dateOfBirth && savedInfo.dateOfBirth.trim() !== '') {
        const savedDate = new Date(savedInfo.dateOfBirth);
        // Check if the date is valid
        if (!isNaN(savedDate.getTime())) {
          setSelectedDate(savedDate);
        }
      }

      setAddress(savedInfo.address);
      setAddressError(!validateAddress(savedInfo.address));

      setStreetNumber(
        savedInfo.streetNumber ||
          (isDevelopment ? developmentInfo.streetNumber : ''),
      );
      setStreetNumberError(
        !validateStreetNumber(
          savedInfo.streetNumber ||
            (isDevelopment ? developmentInfo.streetNumber : ''),
        ),
      );

      // Find and set the selected country
      const country = countries.find(
        (c) => c.code === savedInfo.selectedCountry.code,
      );
      if (country) {
        setSelectedCountry(country);
      }
    } else if (isDevelopment) {
      // In development mode, also check the default email
      const defaultEmail = developmentInfo.email;
      if (defaultEmail && validateEmail(defaultEmail)) {
        try {
          const statusResponse = await checkEmailStatus(defaultEmail);
          if (statusResponse.isVerified) {
            setEmailStatus('verified');
          } else {
            setEmailStatus('needs_verification');
          }
        } catch (error) {
          console.error('Error checking default email status:', error);
          setEmailStatus('needs_verification');
        }
      }
    }
  };

  useEffect(() => {
    loadPersonalInfo();
  }, []);

  // Reload data when screen becomes focused (after returning from picker screens)
  useFocusEffect(
    React.useCallback(() => {
      loadPersonalInfo();
    }, []),
  );

  const handleCountrySelect = () => {
    // Navigate to country picker - it will save to storage and return
    router.push('/settings/country-picker');
  };

  const handleDateSelect = () => {
    // Navigate to date picker - it will save to storage and return
    router.push('/settings/date-picker');
  };

  const handleBackPress = async () => {
    // Save current form state before navigating back
    // This ensures user doesn't lose their input even if they haven't pressed "Save Details"
    try {
      const personalInfo: PersonalInfo = {
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        dateOfBirth: selectedDate?.toISOString() || '',
        address: address.trim(),
        streetNumber: streetNumber.trim(),
        selectedCountry,
      };

      // Only save if at least one field has content
      const hasContent =
        firstName.trim() ||
        lastName.trim() ||
        email.trim() ||
        phoneNumber.trim() ||
        address.trim() ||
        streetNumber.trim() ||
        selectedDate;

      if (hasContent) {
        await StorageService.savePersonalInfo(personalInfo);
      }
    } catch (error) {
      console.error('Error saving form state on back navigation:', error);
    }

    // Navigate back to settings
    router.push('/settings');
  };

  const handlePhoneChange = (phone: string) => {
    // Only allow numbers and spaces
    const numericText = phone.replace(/[^0-9\s]/g, '');
    setPhoneNumber(numericText);
    // Only check error state on text change if already in error state
    if (phoneNumberError) {
      setPhoneNumberError(!validatePhoneNumber(numericText));
    }
  };

  const handlePhoneBlur = async () => {
    // Always check error state on blur
    setPhoneNumberError(!validatePhoneNumber(phoneNumber));
    // Only save to storage on blur (slow operation)
    if (phoneNumber.trim()) {
      await saveFieldToStorage({ phoneNumber });
    }
  };

  // Save field to storage on blur
  const saveFieldToStorage = async (field: Partial<PersonalInfo>) => {
    try {
      const currentInfo = await StorageService.loadPersonalInfo();

      // If no existing info, create a complete PersonalInfo with current state
      if (!currentInfo) {
        const completeInfo: PersonalInfo = {
          name: `${firstName} ${lastName}`,
          email,
          phoneNumber,
          dateOfBirth: selectedDate?.toISOString() || '',
          address,
          streetNumber,
          selectedCountry,
          ...field, // Override with the specific field being saved
        };
        await StorageService.savePersonalInfo(completeInfo);
      } else {
        // If existing info exists, merge with it
        const updatedInfo: PersonalInfo = {
          ...currentInfo,
          ...field,
        };
        await StorageService.savePersonalInfo(updatedInfo);
      }
    } catch (error) {
      console.error('Error saving field to storage:', error);
    }
  };

  const renderInputField = (input: InputField) => {
    const IconComponent = input.icon;

    return (
      <View key={input.id} style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{input.label}</Text>
        <View
          style={[
            styles.inputWrapper,
            input.type === 'phone' &&
              phoneNumberError &&
              styles.inputWrapperError,
          ]}
        >
          {input.type !== 'phone' && (
            <IconComponent size={20} color="#9ca3af" style={styles.inputIcon} />
          )}

          {input.type === 'phone' ? (
            <View style={styles.phoneInputContainer}>
              <TouchableOpacity
                style={styles.countrySelector}
                onPress={handleCountrySelect}
              >
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
                <ChevronDown size={16} color="#9ca3af" />
              </TouchableOpacity>
              <TextInput
                ref={phoneNumberRef}
                style={styles.phoneInput}
                placeholder={input.placeholder}
                placeholderTextColor="#6b7280"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                onBlur={handlePhoneBlur}
                keyboardType="phone-pad"
              />
              {!phoneNumberError &&
                phoneNumber.trim().length > 0 &&
                validatePhoneNumber(phoneNumber) && (
                  <Check size={20} color="#10b981" style={styles.validIcon} />
                )}
            </View>
          ) : input.type === 'email' ? (
            <TextInput
              ref={emailRef}
              style={styles.textInput}
              placeholder={input.placeholder}
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                // Only check error state on text change if already in error state
                if (emailError) {
                  setEmailError(!validateEmail(text));
                }
              }}
              onBlur={async () => {
                // Always check error state on blur
                setEmailError(!validateEmail(email));
                // Only save to storage on blur (slow operation)
                if (email.trim()) {
                  await saveFieldToStorage({ email });
                }
              }}
              keyboardType="email-address"
            />
          ) : input.type === 'date' ? (
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={handleDateSelect}
            >
              <Text
                style={[
                  styles.dateText,
                  !selectedDate && styles.dateTextPlaceholder,
                ]}
              >
                {formatDate(selectedDate)}
              </Text>
              <ChevronDown size={16} color="#9ca3af" />
            </TouchableOpacity>
          ) : input.type === 'file' ? (
            <TouchableOpacity style={styles.fileInput}>
              <Text style={styles.fileInputText}>{input.placeholder}</Text>
            </TouchableOpacity>
          ) : (
            <TextInput
              style={styles.textInput}
              placeholder={input.placeholder}
              placeholderTextColor="#6b7280"
              value={input.value || ''}
            />
          )}
        </View>
        {/* Add error hint for phone input */}
        {input.type === 'phone' &&
          (phoneNumberError || phoneNumber.trim().length === 0) && (
            <Text
              style={[
                styles.inputHint,
                phoneNumberError && styles.inputHintError,
              ]}
            >
              {phoneNumberError ? '*' : ''}Minimum 8 digits
              {phoneNumberError ? ' *' : ''}
            </Text>
          )}
      </View>
    );
  };

  return (
    <SettingsScreen
      title="Account Info"
      onBack={handleBackPress}
      rightElement={
        <TouchableOpacity style={styles.editButton}>
          <Edit2 size={20} color="#3b82f6" />
        </TouchableOpacity>
      }
      bottomElement={
        <>
          {/* Save Button */}
          <View style={styles.saveButtonContainer}>
            <RNAnimated.View
              style={[
                { transform: [{ translateX: buttonShakeAnimationValue }] },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!isFormValid() || isSaving) && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveButtonPress}
                disabled={isSaving}
              >
                <Save size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>
                  {isSaving
                    ? 'Saving...'
                    : emailStatus === 'needs_verification' ||
                        emailStatus === 'otp_pending'
                      ? 'Verify Email'
                      : 'Save Details'}
                </Text>
              </TouchableOpacity>
            </RNAnimated.View>
          </View>

          {/* Toast */}
          <Toast
            message={toastMessage}
            visible={showToast}
            onHide={() => setShowToast(false)}
            type={toastType}
          />
        </>
      }
    >
      {/* Verification Level Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Verification Level</Text>

        <GestureDetector gesture={panGesture}>
          <View>
            <RNAnimated.View
              style={[{ transform: [{ translateX: shakeAnimationValue }] }]}
            >
              <Animated.ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                snapToInterval={SNAP_INTERVAL}
                decelerationRate="fast"
                contentContainerStyle={styles.scrollContent}
              >
                {verificationLevels.map((level, index) => {
                  const animatedStyle = useAnimatedStyle(() => {
                    const inputRange = [
                      (index - 1) * SNAP_INTERVAL,
                      index * SNAP_INTERVAL,
                      (index + 1) * SNAP_INTERVAL,
                    ];

                    const scale = interpolate(
                      scrollX.value,
                      inputRange,
                      [0.95, 1, 0.95],
                      'clamp',
                    );

                    const opacity = interpolate(
                      scrollX.value,
                      inputRange,
                      [0.7, 1, 0.7],
                      'clamp',
                    );

                    return {
                      transform: [{ scale }],
                      opacity,
                    };
                  });

                  return (
                    <Animated.View
                      key={level.id}
                      style={[
                        styles.verificationCard,
                        { borderLeftColor: level.color },
                        animatedStyle,
                      ]}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.levelInfo}>
                          <Text style={styles.levelTitle}>{level.title}</Text>
                          <Text style={styles.levelDescription}>
                            {level.description}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: level.color },
                          ]}
                        >
                          {getStatusIcon(level.icon, '#ffffff')}
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </Animated.ScrollView>
            </RNAnimated.View>

            {/* Level Indicators */}
            <View style={styles.indicators}>
              {verificationLevels.map((level, index) => {
                const animatedIndicatorStyle = useAnimatedStyle(() => {
                  const opacity = interpolate(
                    scrollX.value,
                    [
                      (index - 0.5) * SNAP_INTERVAL,
                      index * SNAP_INTERVAL,
                      (index + 0.5) * SNAP_INTERVAL,
                    ],
                    [0.3, 1, 0.3],
                    'clamp',
                  );

                  const scale = interpolate(
                    scrollX.value,
                    [
                      (index - 0.5) * SNAP_INTERVAL,
                      index * SNAP_INTERVAL,
                      (index + 0.5) * SNAP_INTERVAL,
                    ],
                    [0.8, 1.2, 0.8],
                    'clamp',
                  );

                  return { opacity, transform: [{ scale }] };
                });

                return (
                  <View key={index} style={styles.indicatorContainer}>
                    {level.accessible ? (
                      <Animated.View
                        style={[
                          styles.indicator,
                          {
                            backgroundColor:
                              index === currentLevel ? '#10b981' : '#6b7280',
                          },
                          animatedIndicatorStyle,
                        ]}
                      />
                    ) : (
                      <Animated.View
                        style={[styles.lockedIndicator, animatedIndicatorStyle]}
                      >
                        <Lock size={12} color="#d1d5db" strokeWidth={4} />
                      </Animated.View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </GestureDetector>
      </View>

      {/* Dynamic Input Fields */}
      <View style={styles.section}>
        <Text style={styles.sectionInfo}>
          Complete Level 1 verification to unlock virtual card creation
        </Text>
        <View style={styles.inputsContainer}>
          {/* Level 1 - Basic Personal Information */}
          {currentLevel === 0 && (
            <>
              {/* First Name Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>First Name</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    firstNameError && styles.inputWrapperError,
                  ]}
                >
                  <TextInput
                    ref={firstNameRef}
                    style={styles.textInput}
                    placeholder="Enter your first name"
                    placeholderTextColor="#6b7280"
                    value={firstName}
                    onChangeText={(text) => {
                      // Only allow English letters, no spaces
                      const letterRegex = /^[a-zA-Z]*$/;
                      const cleanedText = text.replace(/[^a-zA-Z]/g, '');

                      if (letterRegex.test(cleanedText)) {
                        setFirstName(cleanedText);
                        // Only check error state on text change if already in error state
                        if (firstNameError) {
                          setFirstNameError(!validateName(cleanedText));
                        }
                      }
                    }}
                    onBlur={async () => {
                      // Always check error state on blur
                      setFirstNameError(!validateName(firstName));
                      // Only save to storage on blur (slow operation)
                      if (firstName.trim()) {
                        await saveFieldToStorage({
                          name: `${firstName} ${lastName}`,
                        });
                      }
                    }}
                  />
                  {!firstNameError &&
                    firstName.trim().length > 0 &&
                    validateName(firstName) && (
                      <Check
                        size={20}
                        color="#10b981"
                        style={styles.validIcon}
                      />
                    )}
                </View>
                {(firstNameError || firstName.trim().length === 0) && (
                  <Text
                    style={[
                      styles.inputHint,
                      firstNameError && styles.inputHintError,
                    ]}
                  >
                    {firstNameError ? '*' : ''}Minimum 4 characters
                    {firstNameError ? ' *' : ''}
                  </Text>
                )}
              </View>

              {/* Last Name Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    lastNameError && styles.inputWrapperError,
                  ]}
                >
                  <TextInput
                    ref={lastNameRef}
                    style={styles.textInput}
                    placeholder="Enter your last name"
                    placeholderTextColor="#6b7280"
                    value={lastName}
                    onChangeText={(text) => {
                      // Only allow English letters, no spaces
                      const letterRegex = /^[a-zA-Z]*$/;
                      const cleanedText = text.replace(/[^a-zA-Z]/g, '');

                      if (letterRegex.test(cleanedText)) {
                        setLastName(cleanedText);
                        // Only check error state on text change if already in error state
                        if (lastNameError) {
                          setLastNameError(!validateName(cleanedText));
                        }
                      }
                    }}
                    onBlur={async () => {
                      // Always check error state on blur
                      setLastNameError(!validateName(lastName));
                      // Only save to storage on blur (slow operation)
                      if (lastName.trim()) {
                        await saveFieldToStorage({
                          name: `${firstName} ${lastName}`,
                        });
                      }
                    }}
                  />
                  {!lastNameError &&
                    lastName.trim().length > 0 &&
                    validateName(lastName) && (
                      <Check
                        size={20}
                        color="#10b981"
                        style={styles.validIcon}
                      />
                    )}
                </View>
                {(lastNameError || lastName.trim().length === 0) && (
                  <Text
                    style={[
                      styles.inputHint,
                      lastNameError && styles.inputHintError,
                    ]}
                  >
                    {lastNameError ? '*' : ''}Minimum 4 characters
                    {lastNameError ? ' *' : ''}
                  </Text>
                )}
              </View>

              {/* Email Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    emailError && styles.inputWrapperError,
                  ]}
                >
                  <Mail size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your email address"
                    placeholderTextColor="#6b7280"
                    value={email}
                    editable={
                      emailStatus === 'unverified' ||
                      emailStatus === 'needs_verification'
                    }
                    onChangeText={(text) => {
                      // Remove all spaces from email
                      const noSpaces = text.replace(/\s/g, '');
                      setEmail(noSpaces);

                      // Reset email status when email changes
                      if (
                        emailStatus === 'verified' ||
                        emailStatus === 'otp_pending'
                      ) {
                        setEmailStatus('needs_verification');
                        setOtpId(null);
                        setOtpExpiresAt(null);
                      }

                      // Only check error state on text change if already in error state
                      if (emailError) {
                        setEmailError(!validateEmail(noSpaces));
                      }
                    }}
                    onBlur={async () => {
                      // Always check error state on blur
                      setEmailError(!validateEmail(email));

                      // Check if email is already verified on blur
                      if (validateEmail(email)) {
                        try {
                          const statusResponse = await checkEmailStatus(email);
                          if (statusResponse.isVerified) {
                            setEmailStatus('verified');
                          } else if (emailStatus === 'unverified') {
                            setEmailStatus('needs_verification');
                          }
                        } catch (error) {
                          console.error(
                            'Error checking email status on blur:',
                            error,
                          );
                          // If check fails, set to needs_verification if email is valid
                          if (emailStatus === 'unverified') {
                            setEmailStatus('needs_verification');
                          }
                        }
                      }

                      // Only save to storage on blur (slow operation)
                      if (email.trim()) {
                        await saveFieldToStorage({ email });
                      }
                    }}
                    keyboardType="email-address"
                    ref={emailRef}
                  />
                  <EmailBadge
                    status={emailStatus}
                    expiresAt={otpExpiresAt}
                    onExpire={() => {
                      setEmailStatus('needs_verification');
                      setOtpExpiresAt(null);
                      setOtpId(null);
                    }}
                  />
                </View>
                {emailStatus === 'verified' && (
                  <TouchableOpacity
                    style={styles.changeEmailButton}
                    onPress={() => {
                      setEmailStatus('needs_verification');
                      setOtpId(null);
                      setOtpExpiresAt(null);
                    }}
                  >
                    <Text style={styles.changeEmailText}>Change email</Text>
                  </TouchableOpacity>
                )}
                {(emailError || email.trim().length === 0) && (
                  <Text
                    style={[
                      styles.inputHint,
                      emailError && styles.inputHintError,
                    ]}
                  >
                    {emailError ? '*' : ''}Valid email required
                    {emailError ? ' *' : ''}
                  </Text>
                )}
              </View>

              {/* Address Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Address</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    addressError && styles.inputWrapperError,
                  ]}
                >
                  <MapPin size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your address"
                    placeholderTextColor="#6b7280"
                    value={address}
                    onChangeText={(text) => {
                      setAddress(text);
                      // Only check error state on text change if already in error state
                      if (addressError) {
                        setAddressError(!validateAddress(text));
                      }
                    }}
                    onBlur={async () => {
                      // Always check error state on blur
                      setAddressError(!validateAddress(address));
                      // Only save to storage on blur (slow operation)
                      if (address.trim()) {
                        await saveFieldToStorage({ address });
                      }
                    }}
                    ref={addressRef}
                  />
                  {!addressError &&
                    address.trim().length > 0 &&
                    validateAddress(address) && (
                      <Check
                        size={20}
                        color="#10b981"
                        style={styles.validIcon}
                      />
                    )}
                </View>
                {(addressError || address.trim().length === 0) && (
                  <Text
                    style={[
                      styles.inputHint,
                      addressError && styles.inputHintError,
                    ]}
                  >
                    {addressError ? '*' : ''}Minimum 5 characters
                    {addressError ? ' *' : ''}
                  </Text>
                )}
              </View>

              {/* Street Number Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Street Number</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    streetNumberError && styles.inputWrapperError,
                  ]}
                >
                  <MapPin size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter street number"
                    placeholderTextColor="#6b7280"
                    value={streetNumber}
                    onChangeText={(text) => {
                      setStreetNumber(text);
                      // Only check error state on text change if already in error state
                      if (streetNumberError) {
                        setStreetNumberError(!validateStreetNumber(text));
                      }
                    }}
                    onBlur={async () => {
                      // Always check error state on blur
                      setStreetNumberError(!validateStreetNumber(streetNumber));
                      // Only save to storage on blur (slow operation)
                      if (streetNumber.trim()) {
                        await saveFieldToStorage({ streetNumber });
                      }
                    }}
                    ref={streetNumberRef}
                  />
                  {!streetNumberError &&
                    streetNumber.trim().length > 0 &&
                    validateStreetNumber(streetNumber) && (
                      <Check
                        size={20}
                        color="#10b981"
                        style={styles.validIcon}
                      />
                    )}
                </View>
                {(streetNumberError || streetNumber.trim().length === 0) && (
                  <Text
                    style={[
                      styles.inputHint,
                      streetNumberError && styles.inputHintError,
                    ]}
                  >
                    {streetNumberError ? '*' : ''}Required field
                    {streetNumberError ? ' *' : ''}
                  </Text>
                )}
              </View>
            </>
          )}

          {/* Level-specific fields from verification levels */}
          {verificationLevels[currentLevel]?.inputs.map(renderInputField)}
        </View>
      </View>

      {/* Email Verification Sheet */}
      <EmailVerificationSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        email={email}
        onVerified={() => {
          setEmailStatus('verified');
          setOtpId(null);
          setOtpExpiresAt(null);
          setShowSheet(false);
        }}
      />
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  editButton: {
    padding: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 12,
  },
  sectionInfo: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  infoCard: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  infoText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  scrollContent: {
    // paddingHorizontal: 20, // Match section padding to align with input fields
  },
  verificationCard: {
    width: CARD_WIDTH,
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#404040',
    borderLeftWidth: 4,
    padding: 20,
    marginHorizontal: CARD_MARGIN, // Use the defined margin constant
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  levelInfo: {
    flex: 1,
    marginRight: 16,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  levelDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  indicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lockedIndicator: {
    width: 24,
    height: 24,
    backgroundColor: '#6b7280',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputsContainer: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#404040',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  validIcon: {
    marginLeft: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#404040',
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  dialCode: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  dateSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  dateTextPlaceholder: {
    color: '#6b7280',
  },
  fileInput: {
    flex: 1,
  },
  fileInputText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  inputHintError: {
    color: '#ef4444',
  },
  saveButtonContainer: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 56,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  changeEmailButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  changeEmailText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});
