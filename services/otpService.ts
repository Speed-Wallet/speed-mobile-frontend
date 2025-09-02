const BASE_BACKEND_URL = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;
import { AuthService } from './authService';

export interface SendOtpResponse {
  success: boolean;
  message: string;
  email: string;
  expiresIn: number;
  otpId?: string;
  expiresAt?: number;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  email: string;
  verifiedAt: string;
  error?: string;
  attemptsRemaining?: number;
}

export interface CheckEmailStatusResponse {
  success: boolean;
  email: string;
  isVerified: boolean;
  message: string;
  error?: string;
}

export async function sendOtp(email: string): Promise<SendOtpResponse> {
  try {
    const token = await AuthService.getToken();

    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${BASE_BACKEND_URL}/email/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });
    console.log('response', response);
    const data = await response.json();
    console.log('data', data);

    if (!response.ok) {
      console.log('response not ok', response);
      throw new Error(data.error || 'Failed to request OTP');
    }

    // Calculate expiration timestamp
    const expiresAt = Date.now() + data.expiresIn * 1000;

    return {
      success: true,
      message: data.message,
      email: data.email,
      expiresIn: data.expiresIn,
      otpId: data.email, // Use email as otpId for simplicity
      expiresAt,
    };
  } catch (error) {
    console.error('Error requesting OTP:', error);
    throw error;
  }
}

export async function verifyOtp(
  email: string,
  code: string,
): Promise<VerifyOtpResponse> {
  try {
    const token = await AuthService.getToken();

    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${BASE_BACKEND_URL}/email/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email,
        otp: code,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Failed to verify OTP',
        email,
        verifiedAt: '',
        error: data.error,
        attemptsRemaining: data.attemptsRemaining,
      };
    }

    return {
      success: true,
      message: data.message,
      email: data.email,
      verifiedAt: data.verifiedAt,
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
}

export async function checkEmailStatus(
  email: string,
): Promise<CheckEmailStatusResponse> {
  try {
    const token = await AuthService.getToken();

    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${BASE_BACKEND_URL}/email/check-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        email,
        isVerified: false,
        message: data.error || 'Failed to check email status',
        error: data.error,
      };
    }

    return {
      success: true,
      email: data.email,
      isVerified: data.isVerified,
      message: data.message,
    };
  } catch (error) {
    console.error('Error checking email status:', error);
    throw error;
  }
}
