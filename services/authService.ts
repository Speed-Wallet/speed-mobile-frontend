import AsyncStorage from '@react-native-async-storage/async-storage';
import { Keypair } from '@solana/web3.js';
import { signAsync } from '@noble/ed25519';

const BASE_BACKEND_URL = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;

const STORAGE_KEYS = {
  JWT_TOKEN: 'jwt_token',
  JWT_EXPIRY: 'jwt_expiry',
  USERNAME: 'username',
};

export interface LoginRequestResponse {
  authMessage: string;
}

export interface LoginResponse {
  // The JWT token is returned in the Authorization header
}

export class AuthService {
  private static jwtToken: string | null = null;
  private static jwtExpiry: number | null = null;
  private static walletProvider: (() => Keypair | null) | null = null;

  /**
   * Set the wallet provider function
   */
  static setWalletProvider(provider: () => Keypair | null): void {
    this.walletProvider = provider;
  }

  /**
   * Get the current wallet instance
   */
  private static getWallet(): Keypair {
    if (!this.walletProvider) {
      throw new Error('Wallet provider not set. Please set wallet provider first.');
    }
    const wallet = this.walletProvider();
    if (!wallet) {
      throw new Error('Wallet not initialized. Please set up wallet first.');
    }
    return wallet;
  }

  /**
   * Initialize the auth service by loading stored JWT token
   */
  static async initialize(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      const expiry = await AsyncStorage.getItem(STORAGE_KEYS.JWT_EXPIRY);
      
      if (token && expiry) {
        this.jwtToken = token;
        this.jwtExpiry = parseInt(expiry);
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
    }
  }

  /**
   * Check if user is authenticated and token is valid
   */
  static async isAuthenticated(): Promise<boolean> {
    await this.initialize();
    
    if (!this.jwtToken) {
      return false;
    }

    // Check if token is expired (with buffer - shorter in development for testing)
    const bufferTime = 5 * 1000;  // 5 seconds buffer for testing (since backend token expires in 30s)
    // const bufferTime = 12 * 60 * 60 * 1000; // 12 hours in production
    
    try {
      const expiry = this.extractTokenExpiry(this.jwtToken);
      const now = Date.now();
      const expiryWithBuffer = expiry - bufferTime;
      
      if (now >= expiryWithBuffer) {
        console.log('🔄 JWT token expired - refreshing auth');
        await this.clearStoredAuth();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating JWT token:', error);
      await this.clearStoredAuth();
      return false;
    }
  }

  /**
   * Get the current JWT token for API requests
   */
  static async getToken(): Promise<string | null> {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      await this.authenticate();
    }
    return this.jwtToken;
  }

  /**
   * Get authorization header for API requests
   */
  static async getAuthHeader(): Promise<{ Authorization: string } | {}> {
    const token = await this.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Sign a message with the wallet's private key
   */
  private static async signMessageForAuth(
    message: Uint8Array, 
    solanaKeypair: Keypair
  ): Promise<Uint8Array> {
    const privateKey = solanaKeypair.secretKey.subarray(0, 32);
    return signAsync(message, privateKey);
  }

  /**
   * Request login message from backend
   */
  private static async requestLoginMessage(userName: string, publicKey: string): Promise<LoginRequestResponse> {
    const response = await fetch(`${BASE_BACKEND_URL}/auth/loginRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userName,
        publicKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Submit signed message to get JWT token
   */
  private static async submitLogin(message: string, signature: string): Promise<void> {
    const response = await fetch(`${BASE_BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        signature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Extract JWT token from Authorization header
    const authHeader = response.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No JWT token in response');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    await this.storeToken(token);
  }

  /**
   * Extract expiry time from JWT token
   */
  private static extractTokenExpiry(token: string): number {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }
      
      // Decode the payload (middle part of JWT)
      const payload = JSON.parse(atob(parts[1]));
      
      if (!payload.exp) {
        throw new Error('JWT token does not contain expiry information');
      }
      
      return payload.exp * 1000; // Convert from seconds to milliseconds
    } catch (error) {
      console.error('Error extracting JWT expiry:', error);
      throw new Error('Failed to parse JWT token expiry');
    }
  }

  /**
   * Store JWT token and calculate expiry
   */
  private static async storeToken(token: string): Promise<void> {
    try {
      const expiry = this.extractTokenExpiry(token);

      this.jwtToken = token;
      this.jwtExpiry = expiry;

      const now = Date.now();
      const timeToExpiry = expiry - now;
      console.log(`💾 JWT token stored - expires in ${Math.round(timeToExpiry / 1000)}s`);

      await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.JWT_EXPIRY, expiry.toString());
    } catch (error) {
      console.error('Error storing JWT token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  /**
   * Store username in local storage
   */
  static async storeUsername(username: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USERNAME, username);
    } catch (error) {
      console.error('Error storing username:', error);
      throw new Error('Failed to store username');
    }
  }

  /**
   * Get stored username
   */
  static async getStoredUsername(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USERNAME);
    } catch (error) {
      console.error('Error retrieving username:', error);
      return null;
    }
  }

  /**
   * Get current user's username
   */
  static async getCurrentUsername(): Promise<string | null> {
    return await this.getStoredUsername();
  }

  /**
   * Clear stored authentication data
   */
  private static async clearStoredAuth(): Promise<void> {
    this.jwtToken = null;
    this.jwtExpiry = null;
    
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.JWT_TOKEN,
      STORAGE_KEYS.JWT_EXPIRY
    ]);
    // Note: USERNAME is preserved intentionally
  }

  /**
   * Perform full authentication flow
   */
  static async authenticate(): Promise<void> {
    const wallet = this.getWallet();

    try {
      // Get wallet info and stored username
      const publicKey = wallet.publicKey.toBase58();
      const storedUsername = await this.getStoredUsername();
      
      if (!storedUsername) {
        throw new Error('No username found. Please complete wallet setup first.');
      }

      console.log('🔐 Authenticating user...');

      // Step 1: Request login message
      const { authMessage } = await this.requestLoginMessage(storedUsername, publicKey);

      // Step 2: Sign the message
      const messageBytes = new TextEncoder().encode(authMessage);
      const signatureBytes = await this.signMessageForAuth(messageBytes, wallet);
      const signature = Buffer.from(signatureBytes).toString('base64');

      // Step 3: Submit signed message and get JWT
      await this.submitLogin(authMessage, signature);
      console.log('✅ Authentication successful');

    } catch (error) {
      console.error('❌ Authentication failed:', error);
      await this.clearStoredAuth();
      throw error;
    }
  }

  /**
   * Force re-authentication (useful for expired tokens)
   */
  static async reAuthenticate(): Promise<void> {
    await this.clearStoredAuth();
    await this.authenticate();
  }

  /**
   * Logout and clear all auth data
   */
  static async logout(): Promise<void> {
    await this.clearStoredAuth();
    console.log('🔓 User logged out');
  }

  /**
   * Check if a JWT token is expired
   */
  private static isTokenExpired(token: string, bufferTimeMs: number = 30 * 1000): boolean {
    try {
      const expiry = this.extractTokenExpiry(token);
      const now = Date.now();
      return now >= (expiry - bufferTimeMs);
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true; // Treat invalid tokens as expired
    }
  }
}
