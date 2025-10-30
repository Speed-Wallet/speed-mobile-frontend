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
