import { getTokenByAddress } from './tokens';

// Mock chart data based on timeframe
export const getTokenChartData = async (tokenId: string, timeframe: string) => {
  const token = await getTokenByAddress(tokenId);
  if (!token) return null;

  // Generate some demo data based on timeframe
  const isPositive = token.priceChangePercentage >= 0;
  const priceVariance = token.price * 0.1; // 10% variance

  let dataPoints = 24;
  let labels = [];

  switch (timeframe) {
    case '1D':
      labels = Array(24)
        .fill(0)
        .map((_, i) => `${i}:00`);
      dataPoints = 24;
      break;
    case '1W':
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      dataPoints = 7;
      break;
    case '1M':
      labels = Array(30)
        .fill(0)
        .map((_, i) => `${i + 1}`);
      dataPoints = 30;
      break;
    case '3M':
      labels = ['Jan', 'Feb', 'Mar'];
      dataPoints = 90;
      break;
    case '1Y':
      labels = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      dataPoints = 365;
      break;
    case 'ALL':
      labels = ['2018', '2019', '2020', '2021', '2022', '2023', '2024'];
      dataPoints = 7;
      break;
    default:
      labels = Array(24)
        .fill(0)
        .map((_, i) => `${i}:00`);
      dataPoints = 24;
  }

  const generateTrend = (
    isUp: boolean,
    points: number,
    baseValue: number,
    variance: number,
  ) => {
    let currentValue = baseValue;
    const values = [currentValue];

    for (let i = 1; i < points; i++) {
      const change = Math.random() * variance * (isUp ? 1 : -1);
      currentValue += change;
      values.push(Math.max(currentValue, baseValue * 0.5)); // Ensure not too low
    }

    return values;
  };

  // Create chart values
  const values = generateTrend(
    isPositive,
    dataPoints,
    token.price,
    priceVariance,
  );

  return {
    labels: labels,
    values: values,
  };
};
