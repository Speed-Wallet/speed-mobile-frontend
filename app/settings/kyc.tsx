import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CreditCard as Edit2, Check, Clock, CircleAlert as AlertCircle, Mail, MapPin, CreditCard, FileText, Video, Shield, ChevronDown, Calendar } from 'lucide-react-native';
import BackButton from '@/components/BackButton';
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

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40; // Match input field width (20px padding on each side)
const CARD_MARGIN = 0; // No additional margin needed since we're matching input width
const SNAP_INTERVAL = CARD_WIDTH; // Use card width directly for snapping

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

const countries: Country[] = [
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', dialCode: '+30' },
];

interface VerificationLevel {
  id: number;
  title: string;
  status: 'completed' | 'pending' | 'not_started';
  description: string;
  color: string;
  icon: 'check' | 'clock' | 'alert';
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

const verificationLevels: VerificationLevel[] = [
  {
    id: 1,
    title: 'Level 1 - Basic',
    status: 'completed',
    description: 'Basic account verification',
    color: '#10b981',
    icon: 'check',
    inputs: [
      {
        id: 'phone',
        label: 'Phone Number',
        placeholder: 'Enter your phone number',
        type: 'phone',
        icon: Calendar, // Using Calendar instead of Phone
        value: '60 123 4567'
      },
      {
        id: 'date_of_birth',
        label: 'Date of Birth',
        placeholder: 'Select your date of birth',
        type: 'date',
        icon: Calendar,
        value: '1990-01-15'
      }
    ]
  },
  {
    id: 2,
    title: 'Level 2 - Enhanced',
    status: 'not_started',
    description: 'Enhanced verification with documents',
    color: '#3b82f6',
    icon: 'alert',
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
      }
    ]
  },
  {
    id: 3,
    title: 'Level 3 - Premium',
    status: 'not_started',
    description: 'Premium verification for high-value transactions',
    color: '#f59e0b',
    icon: 'alert',
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
      }
    ]
  },
];

export default function AccountScreen() {
  const router = useRouter();
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(1990, 0, 15));
  const [phoneNumber, setPhoneNumber] = useState('60 123 4567');
  const [firstName, setFirstName] = useState('Tristan');
  const [lastName, setLastName] = useState('Smith');
  const [email, setEmail] = useState('tristan@example.com');
  const [address, setAddress] = useState('Cape Town');
  const [streetNumber, setStreetNumber] = useState('123 Main Street');
  
  // Validation states
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  
  // Date picker state
  const [tempDay, setTempDay] = useState(15);
  const [tempMonth, setTempMonth] = useState(0);
  const [tempYear, setTempYear] = useState(1990);
  
  const scrollX = useSharedValue(0);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const index = Math.round(event.contentOffset.x / SNAP_INTERVAL);
      if (index !== currentLevel) {
        runOnJS(setCurrentLevel)(index);
      }
    },
  });

  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      'worklet';
      const threshold = 50;
      let targetIndex = currentLevel;

      if (event.translationX > threshold && currentLevel > 0) {
        targetIndex = currentLevel - 1;
      } else if (event.translationX < -threshold && currentLevel < verificationLevels.length - 1) {
        targetIndex = currentLevel + 1;
      }

      if (targetIndex !== currentLevel) {
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
      default:
        return <Check size={16} color={color} />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const validateName = (name: string) => {
    // Only allow English letters and spaces, minimum 3 characters
    const cleanName = name.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').replace(/^\s+/, '');
    return cleanName.length >= 3 ? cleanName : name.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').replace(/^\s+/, '');
  };

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
    const daysInMonth = getDaysInMonth(tempMonth, tempYear);
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const handleDateConfirm = async () => {
    setSelectedDate(new Date(tempYear, tempMonth, tempDay));
    setShowDatePicker(false);
    await savePersonalInfo();
  };

  const savePersonalInfo = async () => {
    const personalInfo: PersonalInfo = {
      name: `${firstName} ${lastName}`,
      email,
      phoneNumber,
      dateOfBirth: selectedDate.toISOString(),
      address,
      streetNumber,
      selectedCountry,
    };
    await StorageService.savePersonalInfo(personalInfo);
  };

  const loadPersonalInfo = async () => {
    const savedInfo = await StorageService.loadPersonalInfo();
    if (savedInfo) {
      // Split the name into first and last name
      const nameParts = savedInfo.name.split(' ');
      const firstName = nameParts[0] || 'Tristan';
      const lastName = nameParts.slice(1).join(' ') || 'Smith';
      
      setFirstName(firstName);
      setLastName(lastName);
      
      // Validate names on load
      setFirstNameError(firstName.length < 4);
      setLastNameError(lastName.length < 4);
      
      setEmail(savedInfo.email);
      setPhoneNumber(savedInfo.phoneNumber);
      setSelectedDate(new Date(savedInfo.dateOfBirth));
      setAddress(savedInfo.address);
      setStreetNumber(savedInfo.streetNumber || '123 Main Street');
      
      // Find and set the selected country
      const country = countries.find(c => c.code === savedInfo.selectedCountry.code);
      if (country) {
        setSelectedCountry(country);
      }
    } else {
      // Save default values if no saved info exists
      await savePersonalInfo();
    }
  };

  useEffect(() => {
    loadPersonalInfo();
  }, []);

  const handleCountrySelect = async (country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    await savePersonalInfo();
  };

  const handlePhoneChange = async (phone: string) => {
    setPhoneNumber(phone);
    await savePersonalInfo();
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryCode}>{item.dialCode}</Text>
    </TouchableOpacity>
  );

  const renderPickerItem = (item: any, type: 'day' | 'month' | 'year') => (
    <TouchableOpacity
      style={styles.pickerItem}
      onPress={() => {
        if (type === 'day') setTempDay(item);
        else if (type === 'month') setTempMonth(item);
        else if (type === 'year') setTempYear(item);
      }}
    >
      <Text style={[
        styles.pickerItemText,
        (type === 'day' && item === tempDay) ||
        (type === 'month' && item === tempMonth) ||
        (type === 'year' && item === tempYear)
          ? styles.pickerItemSelected : {}
      ]}>
        {type === 'month' ? months[item] : item}
      </Text>
    </TouchableOpacity>
  );

  const renderInputField = (input: InputField) => {
    const IconComponent = input.icon;
    
    return (
      <View key={input.id} style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{input.label}</Text>
        <View style={styles.inputWrapper}>
          {input.type !== 'phone' && (
            <IconComponent size={20} color="#9ca3af" style={styles.inputIcon} />
          )}
          
          {input.type === 'phone' ? (
            <View style={styles.phoneInputContainer}>
              <TouchableOpacity
                style={styles.countrySelector}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
                <ChevronDown size={16} color="#9ca3af" />
              </TouchableOpacity>
              <TextInput
                style={styles.phoneInput}
                placeholder={input.placeholder}
                placeholderTextColor="#6b7280"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
              />
            </View>
          ) : input.type === 'email' ? (
            <TextInput
              style={styles.textInput}
              placeholder={input.placeholder}
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                savePersonalInfo();
              }}
              keyboardType="email-address"
            />
          ) : input.type === 'date' ? (
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => {
                setTempDay(selectedDate.getDate());
                setTempMonth(selectedDate.getMonth());
                setTempYear(selectedDate.getFullYear());
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.dateText}>
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={() => router.push('/settings')} />
          <Text style={styles.headerTitle}>Account Info</Text>
          <TouchableOpacity style={styles.editButton}>
            <Edit2 size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.nameSection}>
          <Text style={styles.nameDisplay}>{firstName} {lastName}</Text>
        </View>

        {/* Verification Level Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Verification Level</Text>
          
          <GestureDetector gesture={panGesture}>
            <View>
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
                      'clamp'
                    );
                    
                    const opacity = interpolate(
                      scrollX.value,
                      inputRange,
                      [0.7, 1, 0.7],
                      'clamp'
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
                          <Text style={styles.levelDescription}>{level.description}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: level.color }]}>
                          {getStatusIcon(level.icon, '#ffffff')}
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </Animated.ScrollView>
              
              {/* Level Indicators */}
              <View style={styles.indicators}>
                {verificationLevels.map((_, index) => {
                  const animatedIndicatorStyle = useAnimatedStyle(() => {
                    const opacity = interpolate(
                      scrollX.value,
                      [(index - 0.5) * SNAP_INTERVAL, index * SNAP_INTERVAL, (index + 0.5) * SNAP_INTERVAL],
                      [0.3, 1, 0.3],
                      'clamp'
                    );
                    
                    const scale = interpolate(
                      scrollX.value,
                      [(index - 0.5) * SNAP_INTERVAL, index * SNAP_INTERVAL, (index + 0.5) * SNAP_INTERVAL],
                      [0.8, 1.2, 0.8],
                      'clamp'
                    );

                    return { opacity, transform: [{ scale }] };
                  });

                  return (
                    <Animated.View
                      key={index}
                      style={[
                        styles.indicator,
                        { backgroundColor: verificationLevels[index].color },
                        animatedIndicatorStyle,
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </GestureDetector>
        </View>

        {/* Dynamic Input Fields */}
        <View style={styles.section}>
          {/* <Text style={styles.sectionLabel}>Required Information</Text> */}
          <View style={styles.inputsContainer}>
            {/* Level 1 - Basic Personal Information */}
            {currentLevel === 0 && (
              <>
                {/* First Name Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your first name"
                      placeholderTextColor="#6b7280"
                      value={firstName}
                      onChangeText={(text) => {
                        // Only allow English letters and spaces
                        const letterRegex = /^[a-zA-Z\s]*$/;
                        const cleanedText = text.replace(/[^a-zA-Z\s]/g, '');
                        const normalizedText = cleanedText.replace(/\s+/g, ' ').replace(/^\s+/, '');
                        
                        if (letterRegex.test(normalizedText)) {
                          setFirstName(normalizedText);
                          setFirstNameError(normalizedText.length < 4);
                          savePersonalInfo();
                        }
                      }}
                    />
                  </View>
                  <Text style={[
                    styles.inputHint,
                    firstNameError && styles.inputHintError
                  ]}>
                    {firstNameError ? '*' : ''}Minimum 4 characters, letters only{firstNameError ? ' *' : ''}
                  </Text>
                </View>

                {/* Last Name Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your last name"
                      placeholderTextColor="#6b7280"
                      value={lastName}
                      onChangeText={(text) => {
                        // Only allow English letters and spaces
                        const letterRegex = /^[a-zA-Z\s]*$/;
                        const cleanedText = text.replace(/[^a-zA-Z\s]/g, '');
                        const normalizedText = cleanedText.replace(/\s+/g, ' ').replace(/^\s+/, '');
                        
                        if (letterRegex.test(normalizedText)) {
                          setLastName(normalizedText);
                          setLastNameError(normalizedText.length < 4);
                          savePersonalInfo();
                        }
                      }}
                    />
                  </View>
                  <Text style={[
                    styles.inputHint,
                    lastNameError && styles.inputHintError
                  ]}>
                    {lastNameError ? '*' : ''}Minimum 4 characters, letters only{lastNameError ? ' *' : ''}
                  </Text>
                </View>

                {/* Email Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your email address"
                      placeholderTextColor="#6b7280"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        savePersonalInfo();
                      }}
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* Home Street Number Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Home Street Number</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your street number"
                      placeholderTextColor="#6b7280"
                      value={streetNumber}
                      onChangeText={(text) => {
                        // Only allow digits 0-9
                        const numericText = text.replace(/[^0-9]/g, '');
                        setStreetNumber(numericText);
                        savePersonalInfo();
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Home Address Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Home Address</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your home address"
                      placeholderTextColor="#6b7280"
                      value={address}
                      onChangeText={(text) => {
                        setAddress(text);
                        savePersonalInfo();
                      }}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Level-specific fields from verification levels */}
            {verificationLevels[currentLevel]?.inputs.map(renderInputField)}
          </View>
        </View>
      </ScrollView>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCountryPicker(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={countries}
            renderItem={renderCountryItem}
            keyExtractor={(item) => item.code}
            style={styles.modalList}
          />
        </SafeAreaView>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date of Birth</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handleDateConfirm}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.datePickerContainer}>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerColumnTitle}>Month</Text>
              <FlatList
                data={months.map((_, index) => index)}
                renderItem={({ item }) => renderPickerItem(item, 'month')}
                keyExtractor={(item) => item.toString()}
                style={styles.pickerList}
                showsVerticalScrollIndicator={false}
              />
            </View>
            
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerColumnTitle}>Day</Text>
              <FlatList
                data={generateDays()}
                renderItem={({ item }) => renderPickerItem(item, 'day')}
                keyExtractor={(item) => item.toString()}
                style={styles.pickerList}
                showsVerticalScrollIndicator={false}
              />
            </View>
            
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerColumnTitle}>Year</Text>
              <FlatList
                data={generateYears()}
                renderItem={({ item }) => renderPickerItem(item, 'year')}
                keyExtractor={(item) => item.toString()}
                style={styles.pickerList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
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
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  inputIcon: {
    marginRight: 12,
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
  fileInput: {
    flex: 1,
  },
  fileInputText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalCloseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 12,
  },
  countryCode: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
  datePickerContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  pickerColumnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerList: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '500',
  },
  pickerItemSelected: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  nameSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  nameDisplay: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
    textAlign: 'center',
  },
  inputHint: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  inputHintError: {
    color: '#ef4444',
  },
});

// Export function to get current verification level status
export const getCurrentVerificationLevel = async (): Promise<{
  level: number;
  status: 'completed' | 'pending' | 'not_started';
  title: string;
  color: string;
}> => {
  // Load personal info and verification documents
  const personalInfo = await StorageService.loadPersonalInfo();
  const savedCards = await StorageService.loadCards();
  
  // Check Level 1 completion (basic personal info)
  const level1Complete = personalInfo && 
    personalInfo.name && 
    personalInfo.email && 
    personalInfo.phoneNumber && 
    personalInfo.dateOfBirth && 
    personalInfo.address && 
    personalInfo.streetNumber;

  // Check Level 2 completion (documents uploaded - simplified check)
  // In a real app, you'd check if documents are uploaded and verified
  const level2Complete = false; // This should check actual document upload status
  
  // Check Level 3 completion
  const level3Complete = false; // This should check bank statements and video verification
  
  let currentLevel = 0;
  let currentStatus: 'completed' | 'pending' | 'not_started' = 'not_started';
  
  if (level1Complete) {
    currentLevel = 1;
    currentStatus = 'completed';
    
    if (level2Complete) {
      currentLevel = 2;
      currentStatus = 'completed';
      
      if (level3Complete) {
        currentLevel = 3;
        currentStatus = 'completed';
      }
    }
  }
  
  return {
    level: currentLevel,
    status: currentStatus,
    title: currentLevel > 0 ? verificationLevels[currentLevel - 1].title : 'Not Started',
    color: currentLevel > 0 ? verificationLevels[currentLevel - 1].color : '#6b7280'
  };
};