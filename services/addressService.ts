import { AuthService } from './authService';

const BASE_BACKEND_URL = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;

export interface AddressAutocompleteResult {
  placeId: string;
  title: string;
  label: string;
  address: {
    street?: string;
    addressNumber?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    countryCode?: string;
  };
  placeType: string;
  distance?: number;
}

export interface AddressAutocompleteResponse {
  message: string;
  query: string;
  results: AddressAutocompleteResult[];
  count: number;
}

export interface AddressAutocompleteParams {
  query: string;
  maxResults?: number;
  country?: string;
  language?: string;
}

export class AddressService {
  /**
   * Fetch address autocomplete suggestions
   */
  static async autocomplete(
    params: AddressAutocompleteParams,
  ): Promise<AddressAutocompleteResponse> {
    const { query, maxResults = 5, country = 'ZAF', language = 'en' } = params;

    if (!query || query.trim().length === 0) {
      return {
        message: 'Empty query',
        query: '',
        results: [],
        count: 0,
      };
    }

    const url = new URL(`${BASE_BACKEND_URL}/address/autocomplete`);
    url.searchParams.append('query', query.trim());
    url.searchParams.append('maxResults', maxResults.toString());
    url.searchParams.append('country', country);
    url.searchParams.append('language', language);

    const token = await AuthService.getToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data: AddressAutocompleteResponse = await response.json();
    return data;
  }

  /**
   * Format an address result for display
   */
  static formatAddress(result: AddressAutocompleteResult): string {
    return result.label || result.title;
  }

  /**
   * Get the full address string from a result
   */
  static getFullAddress(result: AddressAutocompleteResult): string {
    const parts: string[] = [];

    if (result.address.addressNumber) {
      parts.push(result.address.addressNumber);
    }

    if (result.address.street) {
      parts.push(result.address.street);
    }

    if (result.address.locality) {
      parts.push(result.address.locality);
    }

    if (result.address.region) {
      parts.push(result.address.region);
    }

    if (result.address.postalCode) {
      parts.push(result.address.postalCode);
    }

    if (result.address.country) {
      parts.push(result.address.country);
    }

    return parts.join(', ') || result.label || result.title;
  }
}
