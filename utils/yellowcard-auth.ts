/**
 * YellowCard API authentication utilities
 * Uses react-native-quick-crypto for cryptographic operations
 * Note: You'll need to set EXPO_PUBLIC_YELLOWCARD_SECRET_KEY in your .env
 */

const apiKey = process.env.EXPO_PUBLIC_YELLOWCARD_API_KEY;
const secretKey =
  process.env.EXPO_PUBLIC_YELLOWCARD_SECRET_KEY ||
  '8a2bfda7f762403b97a3abddc9c16c9298d066f81b7d01679c918929528f969c';
const baseURL = 'https://sandbox.api.yellowcard.io';

/**
 * Simple HMAC-SHA256 implementation using crypto.subtle
 * This avoids the complex type issues by using a more direct approach
 */
async function createSimpleHmac(
  secret: string,
  message: string,
): Promise<string> {
  try {
    // Convert strings to buffers - using Buffer which is available via @craftzdog/react-native-buffer
    const secretBuffer = new Uint8Array(Buffer.from(secret, 'utf8'));
    const messageBuffer = new Uint8Array(Buffer.from(message, 'utf8'));

    const key = await crypto.subtle.importKey(
      'raw',
      secretBuffer.buffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      messageBuffer.buffer,
    );
    return Buffer.from(signature).toString('base64');
  } catch (error) {
    console.error('HMAC creation failed:', error);
    throw error;
  }
}

/**
 * Create authentication headers for YellowCard API requests
 * @param path - The API endpoint path (e.g., '/business/channels')
 * @param method - HTTP method (e.g., 'GET', 'POST')
 * @param body - Optional request body for POST/PUT requests
 * @returns Authentication headers for YellowCard API
 */
export const createYellowCardAuth = async (
  path: string,
  method: string,
  body?: any,
) => {
  if (!apiKey) {
    console.warn('YellowCard API key not configured');
    return {};
  }

  try {
    const date = new Date().toISOString();
    let message = date + path + method;

    if (body) {
      const bodyString = JSON.stringify(body);
      const bodyBuffer = new Uint8Array(Buffer.from(bodyString, 'utf8'));
      const bodyHash = await crypto.subtle.digest('SHA-256', bodyBuffer.buffer);
      const bodyHashBase64 = Buffer.from(bodyHash).toString('base64');
      message += bodyHashBase64;
    }

    const signature = await createSimpleHmac(secretKey, message);

    return {
      'X-YC-Timestamp': date,
      Authorization: `YcHmacV1 ${apiKey}:${signature}`,
    };
  } catch (error) {
    console.error('Failed to create YellowCard auth headers:', error);
    return {};
  }
};

/**
 * Make an authenticated request to YellowCard API
 * @param path - The API endpoint path
 * @param method - HTTP method
 * @param body - Optional request body
 * @returns Promise with API response data
 */
export const makeYellowCardRequest = async (
  path: string,
  method: string = 'GET',
  body?: any,
): Promise<any> => {
  try {
    const authHeaders = await createYellowCardAuth(path, method, body);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add auth headers if they exist
    if (authHeaders['X-YC-Timestamp']) {
      headers['X-YC-Timestamp'] = authHeaders['X-YC-Timestamp'];
    }
    if (authHeaders['Authorization']) {
      headers['Authorization'] = authHeaders['Authorization'];
    }

    const requestOptions: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${baseURL}${path}`, requestOptions);

    if (!response.ok) {
      throw new Error(
        `YellowCard API error: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error('YellowCard API request failed:', error);
    throw error;
  }
};

/**
 * Test YellowCard API connection by fetching business channels
 * @returns Promise with channels data
 */
export const testYellowCardConnection = async (): Promise<any> => {
  return makeYellowCardRequest('/business/channels', 'GET');
};
