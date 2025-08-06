// Utility functions for formatting chart data
import { HistoricalPricesResponse } from '@/services/apis';

export interface FormattedChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color: (opacity?: number) => string;
    strokeWidth: number;
  }>;
}

export interface TimeframeConfig {
  days: number;
  label: string;
  formatLabel: (date: Date) => string;
}

export const timeframeConfigs: Record<string, TimeframeConfig> = {
  '1D': {
    days: 1,
    label: '24H',
    formatLabel: (date: Date) =>
      date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  },
  '1W': {
    days: 7,
    label: '7D',
    formatLabel: (date: Date) =>
      date.toLocaleDateString('en-US', { weekday: 'short' }),
  },
  '1M': {
    days: 30,
    label: '1M',
    formatLabel: (date: Date) =>
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  },
  '3M': {
    days: 90,
    label: '3M',
    formatLabel: (date: Date) =>
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  },
  '1Y': {
    days: 365,
    label: '1Y',
    formatLabel: (date: Date) =>
      date.toLocaleDateString('en-US', { month: 'short' }),
  },
  ALL: {
    days: 2000, // Max supported by CoinGecko
    label: 'MAX',
    formatLabel: (date: Date) =>
      date.toLocaleDateString('en-US', { year: 'numeric' }),
  },
};

/**
 * Format historical price data for chart display
 */
export function formatHistoricalDataForChart(
  historicalResponse: HistoricalPricesResponse,
  timeframe: string,
): FormattedChartData {
  if (
    !historicalResponse.success ||
    !historicalResponse.data?.historicalData?.prices
  ) {
    return {
      labels: [],
      datasets: [
        {
          data: [],
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }

  const { prices } = historicalResponse.data.historicalData;
  const config = timeframeConfigs[timeframe];

  // For charts, we want to show a reasonable number of data points
  const maxDataPoints = 20;
  const dataPoints = prices.length;
  const step = Math.max(1, Math.floor(dataPoints / maxDataPoints));

  const formattedData: FormattedChartData = {
    labels: [],
    datasets: [
      {
        data: [],
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // Sample data points evenly
  for (let i = 0; i < dataPoints; i += step) {
    const [timestamp, price] = prices[i];
    const date = new Date(timestamp);

    formattedData.labels.push(config.formatLabel(date));
    formattedData.datasets[0].data.push(price);
  }

  return formattedData;
}

/**
 * Calculate price change percentage for a given timeframe
 */
export function calculatePriceChange(
  historicalResponse: HistoricalPricesResponse,
  timeframe: string,
): { change: number; changePercentage: number } {
  if (
    !historicalResponse.success ||
    !historicalResponse.data?.historicalData?.prices
  ) {
    return { change: 0, changePercentage: 0 };
  }

  const { prices } = historicalResponse.data.historicalData;

  if (prices.length < 2) {
    return { change: 0, changePercentage: 0 };
  }

  const currentPrice = prices[prices.length - 1][1];
  const startPrice = prices[0][1];

  const change = currentPrice - startPrice;
  const changePercentage = (change / startPrice) * 100;

  return { change, changePercentage };
}

/**
 * Format price change as a percentage string
 */
export function formatPriceChangeString(changePercentage: number): string {
  const sign = changePercentage >= 0 ? '+' : '';
  return `${sign}${changePercentage.toFixed(2)}%`;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  if (price < 0.01) {
    return `$${price.toFixed(6)}`;
  } else if (price < 1) {
    return `$${price.toFixed(4)}`;
  } else {
    return `$${price.toFixed(2)}`;
  }
}

/**
 * Format large numbers (for market cap, volume, etc.)
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

/**
 * Format supply numbers (without $ sign)
 */
export function formatSupply(value: number, symbol: string): string {
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)}T ${symbol}`;
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B ${symbol}`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M ${symbol}`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K ${symbol}`;
  } else {
    return `${value.toFixed(0)} ${symbol}`;
  }
}
