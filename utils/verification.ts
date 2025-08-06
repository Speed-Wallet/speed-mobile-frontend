import { StorageService, PersonalInfo } from './storage';

// Validation functions - extracted from KYC screen for reuse
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 4;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return cleanPhone.length >= 8;
};

export const validateAddress = (address: string): boolean => {
  return address.trim().length >= 5;
};

export const validateStreetNumber = (streetNumber: string): boolean => {
  return streetNumber.trim().length >= 1;
};

export const validateDateOfBirth = (dateOfBirth: string): boolean => {
  if (!dateOfBirth || dateOfBirth.trim() === '') return false;
  const date = new Date(dateOfBirth);
  return !isNaN(date.getTime());
};

// Function to validate all personal info fields
export const validatePersonalInfo = (
  personalInfo: PersonalInfo | null,
): {
  isValid: boolean;
  errors: { [key: string]: boolean };
} => {
  if (!personalInfo) {
    return {
      isValid: false,
      errors: {},
    };
  }

  // Split name into first and last name for validation
  const nameParts = personalInfo.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const errors = {
    firstName: !validateName(firstName),
    lastName: !validateName(lastName),
    email: !validateEmail(personalInfo.email),
    phoneNumber: !validatePhoneNumber(personalInfo.phoneNumber),
    dateOfBirth: !validateDateOfBirth(personalInfo.dateOfBirth),
    address: !validateAddress(personalInfo.address),
    streetNumber: !validateStreetNumber(personalInfo.streetNumber),
  };

  const isValid =
    !Object.values(errors).some((hasError) => hasError) &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    personalInfo.email.trim().length > 0 &&
    personalInfo.phoneNumber.trim().length > 0 &&
    personalInfo.address.trim().length > 0 &&
    personalInfo.streetNumber.trim().length > 0;

  return { isValid, errors };
};

// Pure function to calculate verification level from personal info
export const calculateVerificationLevel = (
  personalInfo: PersonalInfo | null,
): number => {
  // Check Level 1 completion using proper validation
  const validation = validatePersonalInfo(personalInfo);
  const level1Complete = personalInfo && validation.isValid;

  // Check Level 2 completion (documents uploaded - simplified check)
  // In a real app, you'd check if documents are uploaded and verified
  const level2Complete = false; // This should check actual document upload status

  // Check Level 3 completion
  const level3Complete = false; // This should check bank statements and video verification

  let currentLevel = 0;

  if (level1Complete) {
    currentLevel = 1;

    if (level2Complete) {
      currentLevel = 2;

      if (level3Complete) {
        currentLevel = 3;
      }
    }
  }

  return currentLevel;
};

// Async wrapper function to load from storage and calculate level
export const getCurrentVerificationLevel = async (): Promise<number> => {
  // Load personal info from storage
  const personalInfo = await StorageService.loadPersonalInfo();

  // Calculate level using pure function
  return calculateVerificationLevel(personalInfo);
};
