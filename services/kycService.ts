import { getMasterWalletKeypair } from './walletUtils';
import bs58 from 'bs58';
import { signAsync } from '@noble/ed25519';

const BASE_BACKEND_URL = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;

export interface KYCData {
  email: string;
  name: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  streetNumber: string;
  selectedCountry: {
    code: string;
    name: string;
    dialCode: string;
    flag: string;
  };
}

export interface SubmitKYCResponse {
  success: boolean;
  message?: string;
  kycStatus?: string;
  kycVerifiedAt?: string;
  error?: string;
}

/**
 * Submit KYC data to backend for verified storage
 */
export async function submitKYC(
  username: string,
  kycData: KYCData,
): Promise<SubmitKYCResponse> {
  try {
    const wallet = await getMasterWalletKeypair();

    if (!wallet) {
      return {
        success: false,
        error: 'Wallet not initialized',
      };
    }

    const publicKey = wallet.publicKey.toBase58();
    const timestamp = Date.now();

    // Create signature for authentication
    const message = `Submit KYC for ${username} at ${timestamp}`;
    const messageBytes = new TextEncoder().encode(message);
    const privateKey = wallet.secretKey.subarray(0, 32);
    const signature = await signAsync(messageBytes, privateKey);
    const signatureBase58 = bs58.encode(signature);

    const response = await fetch(`${BASE_BACKEND_URL}/kyc/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        publicKey,
        signature: signatureBase58,
        timestamp,
        kycData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to submit KYC',
      };
    }

    return {
      success: true,
      message: data.message,
      kycStatus: data.kycStatus,
      kycVerifiedAt: data.kycVerifiedAt,
    };
  } catch (error) {
    console.error('Error submitting KYC:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit KYC',
    };
  }
}

/**
 * Get KYC data from backend
 */
export async function getKYC(
  username: string,
  jwtToken: string,
): Promise<{ success: boolean; kyc?: KYCData; error?: string }> {
  try {
    const response = await fetch(`${BASE_BACKEND_URL}/kyc/${username}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to get KYC data',
      };
    }

    return {
      success: true,
      kyc: data.kyc,
    };
  } catch (error) {
    console.error('Error getting KYC:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get KYC data',
    };
  }
}
