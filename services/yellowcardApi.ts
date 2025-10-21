/**
 * YellowCard API Service
 * Handles authentication and API requests to YellowCard
 */

import CryptoJS from 'crypto-js';

const API_KEY = process.env.EXPO_PUBLIC_YELLOWCARD_API_KEY;
const SECRET_KEY = process.env.EXPO_PUBLIC_YELLOWCARD_SECRET_KEY;
const BASE_URL = 'https://sandbox.api.yellowcard.io';

// Types
export interface YellowCardChannel {
  id: string;
  channelType: 'momo' | 'bank';
  country: string;
  currency: string;
  countryCurrency: string;
  min: number;
  max: number;
  widgetMin?: number;
  widgetMax?: number;
  rampType: 'deposit' | 'withdraw';
  status: 'active' | 'inactive';
  apiStatus?: 'active' | 'inactive';
  widgetStatus?: 'active' | 'inactive';
  settlementType: string;
  estimatedSettlementTime: number;
  vendorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetChannelsResponse {
  channels: YellowCardChannel[];
}

/**
 * Generate YellowCard API authentication headers
 */
const generateAuthHeaders = (
  path: string,
  method: string,
  body?: any,
): Record<string, string> => {
  if (!SECRET_KEY) {
    throw new Error('YellowCard secret key not configured');
  }

  const date = new Date().toISOString();
  const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, SECRET_KEY);

  hmac.update(date);
  hmac.update(path);
  hmac.update(method);

  if (body) {
    const bodyHmac = CryptoJS.SHA256(JSON.stringify(body)).toString(
      CryptoJS.enc.Base64,
    );
    hmac.update(bodyHmac);
  }

  const hash = hmac.finalize();
  const signature = CryptoJS.enc.Base64.stringify(hash);

  return {
    'X-YC-Timestamp': date,
    Authorization: `YcHmacV1 ${API_KEY}:${signature}`,
  };
};

/**
 * Get active payment channels
 * Filters out inactive channels and non-widget-active channels
 */
export async function getActiveChannels(): Promise<GetChannelsResponse> {
  const path = '/business/channels';
  const method = 'GET';

  try {
    const headers = generateAuthHeaders(path, method);

    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('YellowCard API error:', response.status, errorData);
      throw new Error(
        `YellowCard API error: ${response.status} ${response.statusText}`,
      );
    }

    const data: GetChannelsResponse = await response.json();

    // Filter to only return active channels suitable for widget use
    const activeChannels = data.channels.filter(
      (channel) =>
        channel.rampType === 'deposit' &&
        (!channel.widgetStatus || channel.widgetStatus === 'active') &&
        channel.status !== 'inactive',
    );

    return { channels: activeChannels };
  } catch (error) {
    console.error('Failed to fetch YellowCard channels:', error);
    throw error;
  }
}

/**
 * Get active deposit channels filtered by country and currency
 * Only returns channels that are active for the widget
 */
export function getActiveDepositChannels(
  channels: YellowCardChannel[],
  countryCode?: string,
  currency?: string,
): YellowCardChannel[] {
  return channels.filter((channel) => {
    // Must be deposit type
    if (channel.rampType !== 'deposit') return false;

    // Must have active widget status (or be active if widgetStatus not present)
    if (channel.widgetStatus && channel.widgetStatus !== 'active') return false;

    // Optionally filter by country
    if (countryCode && channel.country !== countryCode) return false;

    // Optionally filter by currency
    if (currency && channel.currency !== currency) return false;

    return true;
  });
}
