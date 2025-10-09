// Utility functions for formatting chart data
import { HistoricalPricesResponse } from '@/types/birdeye';
import { formatLargeNumber } from './formatters';

export interface FormattedChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color: (opacity?: number) => string;
    strokeWidth: number;
  }>;
}

export interface ChartDataPoint {
  timestamp: number;
  price: number;
}

export interface TimeframeConfig {
  days: number;
  label: string;
  formatLabel: (date: Date) => string;
}

export const timeframeConfigs: Record<string, TimeframeConfig> = {
  '1H': {
    days: 1 / 24,
    label: '1H',
    formatLabel: (date: Date) =>
      date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  },
  '1D': {
    days: 1,
    label: '24H',
    formatLabel: (date: Date) =>
      date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  },
  '7D': {
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
  '1Y': {
    days: 365,
    label: '1Y',
    formatLabel: (date: Date) =>
      date.toLocaleDateString('en-US', { month: 'short' }),
  },
};

/**
 * Format historical price data for chart display (legacy - for react-native-chart-kit)
 */
export function formatHistoricalDataForChart(
  historicalResponse: HistoricalPricesResponse,
  timeframe: string,
): FormattedChartData {
  if (
    !historicalResponse.success ||
    !historicalResponse.data?.items ||
    historicalResponse.data.items.length === 0
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

  const { items } = historicalResponse.data;
  const config = timeframeConfigs[timeframe];

  // For charts, we want to show a reasonable number of data points
  const maxDataPoints = 20;
  const dataPoints = items.length;
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
    const item = items[i];
    const date = new Date(item.unixTime * 1000); // Convert from seconds to milliseconds

    formattedData.labels.push(config.formatLabel(date));
    formattedData.datasets[0].data.push(item.value);
  }

  return formattedData;
}

/**
 * Format historical price data for custom chart component
 */
export function formatHistoricalDataForCustomChart(
  historicalResponse: HistoricalPricesResponse,
  timeframe: string,
): ChartDataPoint[] {
  if (
    !historicalResponse.success ||
    !historicalResponse.data?.items ||
    historicalResponse.data.items.length === 0
  ) {
    return [];
  }

  const { items } = historicalResponse.data;

  // For custom chart, we can handle more data points efficiently
  let maxDataPoints = 50;

  // Adjust based on timeframe
  switch (timeframe) {
    case '1H':
      maxDataPoints = 12; // 5-minute intervals
      break;
    case '1D':
      maxDataPoints = 24; // Hourly data points
      break;
    case '7D':
      maxDataPoints = 42; // 4-hour intervals
      break;
    case '1M':
      maxDataPoints = 30; // Daily data points
      break;
    case '1Y':
      maxDataPoints = 52; // Weekly data points
      break;
  }

  const dataPoints = items.length;
  const step = Math.max(1, Math.floor(dataPoints / maxDataPoints));

  const formattedData: ChartDataPoint[] = [];

  // Sample data points evenly
  for (let i = 0; i < dataPoints; i += step) {
    const item = items[i];
    formattedData.push({
      timestamp: item.unixTime * 1000, // Convert to milliseconds
      price: item.value,
    });
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
    !historicalResponse.data?.items ||
    historicalResponse.data.items.length < 2
  ) {
    return { change: 0, changePercentage: 0 };
  }

  const { items } = historicalResponse.data;

  const currentPrice = items[items.length - 1].value;
  const startPrice = items[0].value;

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
export function formatPriceChange(priceChange: number): string {
  const sign = priceChange >= 0 ? '+' : '-';
  const absChange = Math.abs(priceChange);

  const formatted =
    absChange < 0.01 && absChange > 0
      ? absChange.toFixed(8)
      : absChange.toFixed(2);

  return `${sign}$${formatted}`;
}

// Export formatLargeNumber from formatters.ts for convenience
export { formatLargeNumber };
