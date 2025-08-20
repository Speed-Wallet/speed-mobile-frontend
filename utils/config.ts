import { AppConfig } from '@/hooks/useConfig';

let cachedConfig: AppConfig | null = null;
let configFetchPromise: Promise<AppConfig> | null = null;

const fetchConfig = async (): Promise<AppConfig> => {
  const baseUrl = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;
  if (!baseUrl) {
    throw new Error('Base backend URL not configured');
  }

  const response = await fetch(`${baseUrl}/api/config`);

  if (!response.ok) {
    throw new Error(`Failed to fetch config: ${response.statusText}`);
  }

  const data = await response.json();
  cachedConfig = data;
  return data;
};

/**
 * Get config values - can be used anywhere (not just in React components)
 * Returns cached values if available, otherwise fetches from API
 */
export const getConfig = async (): Promise<AppConfig> => {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  // If a fetch is already in progress, wait for it
  if (configFetchPromise) {
    return configFetchPromise;
  }

  // Start a new fetch
  configFetchPromise = fetchConfig();

  try {
    const config = await configFetchPromise;
    configFetchPromise = null; // Clear the promise on success
    return config;
  } catch (error) {
    configFetchPromise = null; // Clear the promise on error
    throw error;
  }
};

/**
 * Get a specific config value
 */
export const getConfigValue = async <K extends keyof AppConfig>(
  key: K,
  fallback?: AppConfig[K],
): Promise<AppConfig[K]> => {
  try {
    const config = await getConfig();
    return config[key] ?? fallback;
  } catch (error) {
    console.warn('Failed to fetch config, using fallback:', error);
    return fallback as AppConfig[K];
  }
};

/**
 * Clear cached config (useful for testing or forcing refresh)
 */
export const clearConfigCache = () => {
  cachedConfig = null;
  configFetchPromise = null;
};
