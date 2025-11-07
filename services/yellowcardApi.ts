/**
 * YellowCard API Service
 * Calls the backend API which handles YellowCard authentication
 */

const BASE_BACKEND_URL = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;

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
 * Get active payment channels from backend
 * The backend handles YellowCard authentication (IP whitelisted)
 */
export async function getActiveChannels(): Promise<GetChannelsResponse> {
  if (!BASE_BACKEND_URL) {
    throw new Error('Backend URL not configured');
  }

  try {
    const response = await fetch(
      `${BASE_BACKEND_URL}/api/yellowcard/channels`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('YellowCard API error:', response.status, errorData);
      throw new Error(
        `YellowCard API error: ${response.status} ${response.statusText}`,
      );
    }

    const data: GetChannelsResponse = await response.json();
    return data;
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

/**
 * Generate widget signature from backend
 * The backend securely signs the widget parameters using the secret key
 */
export async function getWidgetSignature(
  walletAddress: string,
  token: string,
): Promise<string> {
  if (!BASE_BACKEND_URL) {
    throw new Error('Backend URL not configured');
  }

  try {
    const response = await fetch(
      `${BASE_BACKEND_URL}/api/yellowcard/signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          token,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Signature generation error:', response.status, errorData);
      throw new Error(
        `Signature generation error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data.signature;
  } catch (error) {
    console.error('Failed to generate widget signature:', error);
    throw error;
  }
}
