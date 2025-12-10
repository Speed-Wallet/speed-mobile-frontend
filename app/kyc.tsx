import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ScreenContainer from '@/components/ScreenContainer';
import ProgressBar from '@/components/ProgressBar';
import { StorageService, PersonalInfo } from '@/utils/storage';
import { countries, Country } from '@/constants/countries';
import CountryPhoneStep from '@/components/kyc/CountryPhoneStep';
import NameStep from '@/components/kyc/NameStep';
import AddressStep from '@/components/kyc/AddressStep';
import EmailVerificationStep from '@/components/kyc/EmailVerificationStep';
import EmailOtpVerificationStep from '@/components/kyc/EmailOtpVerificationStep';
import DateOfBirthStep from '@/components/kyc/DateOfBirthStep';
import VerificationCompleteStep from '@/components/kyc/VerificationCompleteStep';
import { sendOtp } from '@/services/otpService';
import { submitKYC } from '@/services/kycService';
import { AuthService } from '@/services/authService';
import 'react-native-get-random-values';

export enum KYCStep {
  COUNTRY_PHONE = 1,
  NAME,
  ADDRESS,
  EMAIL_VERIFICATION,
  EMAIL_OTP_VERIFICATION,
  DATE_OF_BIRTH,
  VERIFICATION_COMPLETE,
}

interface KYCScreenProps {
  onComplete?: () => void; // Optional callback for when KYC is completed
}

export default function KYCScreen({ onComplete }: KYCScreenProps = {}) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fromScreen = params.from as string | undefined;
  const pinVerified = params.pinVerified as string | undefined;

  const [step, setStep] = useState<KYCStep>(KYCStep.COUNTRY_PHONE);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');

  // Form data states
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);

  // Email OTP verification state
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpId, setOtpId] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState(0);

  // Load saved data on mount
  useEffect(() => {
    loadPersonalInfo();
  }, []);

  const loadPersonalInfo = async () => {
    try {
      const savedInfo = await StorageService.loadPersonalInfo();
      if (savedInfo) {
        // Split the name into first and last name
        const nameParts = savedInfo.name.split(' ');
        const firstNameValue = nameParts[0] || '';
        const lastNameValue = nameParts.slice(1).join(' ') || '';

        setFirstName(firstNameValue);
        setLastName(lastNameValue);
        setUsername(firstNameValue); // Use first name as username

        setEmail(savedInfo.email || '');
        setPhoneNumber(savedInfo.phoneNumber || '');
        setAddress(savedInfo.address || '');
        setStreetNumber(savedInfo.streetNumber || '');

        // Set date if valid
        if (savedInfo.dateOfBirth && savedInfo.dateOfBirth.trim() !== '') {
          const savedDate = new Date(savedInfo.dateOfBirth);
          if (!isNaN(savedDate.getTime())) {
            setDateOfBirth(savedDate);
          }
        }

        // Find and set the selected country
        const country = countries.find(
          (c) => c.code === savedInfo.selectedCountry.code,
        );
        if (country) {
          setSelectedCountry(country);
        }
      }
    } catch (error) {
      console.error('Error loading personal info:', error);
    }
  };

  const savePersonalInfo = async (overrides?: Partial<PersonalInfo>) => {
    try {
      const personalInfo: PersonalInfo = {
        name: `${firstName} ${lastName}`,
        email,
        phoneNumber,
        dateOfBirth: dateOfBirth?.toISOString() || '',
        address,
        streetNumber,
        selectedCountry,
        ...overrides,
      };
      await StorageService.savePersonalInfo(personalInfo);
    } catch (error) {
      console.error('Error saving personal info:', error);
      throw error;
    }
  };

  const handleCountryPhoneNext = async (country: Country, phone: string) => {
    setSelectedCountry(country);
    setPhoneNumber(phone);

    // Save to storage
    await savePersonalInfo({
      selectedCountry: country,
      phoneNumber: phone,
    });

    setStep(KYCStep.NAME);
  };

  const handleNameNext = async (first: string, last: string) => {
    setFirstName(first);
    setLastName(last);

    // Save to storage
    await savePersonalInfo({
      name: `${first} ${last}`,
    });

    setStep(KYCStep.ADDRESS);
  };

  const handleAddressNext = async (addr: string, streetNum: string) => {
    setAddress(addr);
    setStreetNumber(streetNum);

    // Save to storage
    await savePersonalInfo({
      address: addr,
      streetNumber: streetNum,
    });

    setStep(KYCStep.EMAIL_VERIFICATION);
  };

  const handleEmailNext = async (emailAddress: string) => {
    setEmail(emailAddress);

    // Save to storage
    await savePersonalInfo({
      email: emailAddress,
    });

    setStep(KYCStep.DATE_OF_BIRTH);
  };

  const handleShowOtpStep = (
    emailAddress: string,
    otpIdValue: string,
    expiresAt: number,
  ) => {
    setEmail(emailAddress);
    setOtpId(otpIdValue);
    setOtpExpiresAt(expiresAt);
    setShowOtpStep(true);
    setStep(KYCStep.EMAIL_OTP_VERIFICATION);
  };

  const handleResendOtp = async (emailAddress: string) => {
    // Use the OTP service to resend
    const response = await sendOtp(emailAddress);

    // Update state with new OTP details
    const newOtpId = response.otpId || '';
    const newExpiresAt = response.expiresAt || Date.now() + 300000;

    setOtpId(newOtpId);
    setOtpExpiresAt(newExpiresAt);

    return {
      otpId: newOtpId,
      expiresAt: newExpiresAt,
    };
  };

  const handleOtpVerified = async () => {
    // OTP verified successfully, move to next step
    setShowOtpStep(false);
    await handleEmailNext(email);
  };

  const handleBackFromOtp = () => {
    // Go back to email input
    setShowOtpStep(false);
    setStep(KYCStep.EMAIL_VERIFICATION);
    setOtpId('');
    setOtpExpiresAt(0);
  };

  const handleDateOfBirthNext = async (date: Date) => {
    setDateOfBirth(date);

    // Save to storage
    await savePersonalInfo({
      dateOfBirth: date.toISOString(),
    });

    // Submit KYC data to backend for secure storage
    setIsLoading(true);
    try {
      const username = AuthService.getStoredUsername();

      if (username) {
        const kycData = {
          email,
          name: `${firstName} ${lastName}`,
          phoneNumber,
          dateOfBirth: date.toISOString(),
          address,
          streetNumber,
          selectedCountry,
        };

        const result = await submitKYC(username, kycData);

        if (result.success) {
          console.log('✅ KYC data submitted successfully to backend');
          // Move to verification complete step
          setStep(KYCStep.VERIFICATION_COMPLETE);
        } else {
          console.error('❌ Failed to submit KYC to backend:', result.error);
          Alert.alert(
            'Verification Failed',
            'Unable to verify your identity at this time. Please try again later.',
            [{ text: 'OK' }],
          );
        }
      } else {
        console.error('❌ No username found, cannot submit KYC');
        Alert.alert(
          'Verification Failed',
          'Username not found. Please log in again.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      console.error('Error submitting KYC to backend:', error);
      Alert.alert(
        'Verification Failed',
        'An error occurred while verifying your identity. Please try again later.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    // If onComplete callback is provided, call it (for root-level KYC)
    // This will unlock the wallet and allow navigation
    if (onComplete) {
      // IMPORTANT: Navigate FIRST, then call onComplete
      // If we call onComplete first, the layout re-renders and navigation breaks
      router.push('/(tabs)/spend?pinVerified=true');
      // Use setTimeout to ensure navigation completes before state change
      setTimeout(() => {
        onComplete();
      }, 100);
    } else if (fromScreen === 'spend') {
      // If navigated from spend screen, go back to spend with pinVerified flag
      router.push(`/(tabs)/spend?pinVerified=${pinVerified || 'true'}`);
    } else {
      // If called from settings, just go back to settings
      router.push('/settings');
    }
  };

  const handleBack = (currentStep: KYCStep) => {
    if (currentStep === KYCStep.COUNTRY_PHONE) {
      // If onComplete is provided, it means we're at root level
      // Don't allow back navigation in that case
      if (!onComplete) {
        // Navigate back to where we came from
        if (fromScreen === 'spend') {
          router.push('/(tabs)/spend' as any);
        } else {
          router.push('/settings');
        }
      }
    } else {
      setStep(currentStep - 1);
    }
  };

  // Helper function to get progress bar info
  const getProgressInfo = () => {
    return {
      current: step,
      total: 7,
    };
  };

  const progressInfo = getProgressInfo();

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      {/* Progress Bar */}
      <View>
        <ProgressBar
          currentStep={progressInfo.current}
          totalSteps={progressInfo.total}
        />
      </View>

      {/* Step Content */}
      {step === KYCStep.COUNTRY_PHONE && (
        <CountryPhoneStep
          onNext={handleCountryPhoneNext}
          onBack={() => handleBack(KYCStep.COUNTRY_PHONE)}
          initialCountry={selectedCountry}
          initialPhoneNumber={phoneNumber}
          isLoading={isLoading}
        />
      )}

      {step === KYCStep.NAME && (
        <NameStep
          onNext={handleNameNext}
          onBack={() => handleBack(KYCStep.NAME)}
          initialFirstName={firstName}
          initialLastName={lastName}
          isLoading={isLoading}
        />
      )}

      {step === KYCStep.ADDRESS && (
        <AddressStep
          onNext={handleAddressNext}
          onBack={() => handleBack(KYCStep.ADDRESS)}
          initialAddress={address}
          initialStreetNumber={streetNumber}
          isLoading={isLoading}
        />
      )}

      {step === KYCStep.EMAIL_VERIFICATION && (
        <EmailVerificationStep
          onNext={handleEmailNext}
          onBack={() => handleBack(KYCStep.EMAIL_VERIFICATION)}
          initialEmail={email}
          isLoading={isLoading}
          onShowOtpStep={handleShowOtpStep}
        />
      )}

      {step === KYCStep.EMAIL_OTP_VERIFICATION && (
        <EmailOtpVerificationStep
          email={email}
          otpId={otpId}
          expiresAt={otpExpiresAt}
          onVerified={handleOtpVerified}
          onBack={handleBackFromOtp}
          isLoading={isLoading}
          onResendOtp={handleResendOtp}
        />
      )}

      {step === KYCStep.DATE_OF_BIRTH && (
        <DateOfBirthStep
          onNext={handleDateOfBirthNext}
          onBack={() => handleBack(KYCStep.DATE_OF_BIRTH)}
          initialDate={dateOfBirth || undefined}
          isLoading={isLoading}
        />
      )}

      {step === KYCStep.VERIFICATION_COMPLETE && (
        <VerificationCompleteStep
          onComplete={handleVerificationComplete}
          username={username || firstName || 'User'}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({});
