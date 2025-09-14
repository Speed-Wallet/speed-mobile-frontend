// Format a number as currency (USD)
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format a number as percentage
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

// Format a date in a readable format
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

// Format a number with a specified number of decimal places
export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
};

// Format input amount with commas while preserving decimal input
export const formatAmountInput = (value: string): string => {
  if (!value || value === '0') return value;

  // Handle incomplete decimal inputs like "0." or "123."
  if (value.endsWith('.')) {
    const beforeDecimal = value.slice(0, -1);
    const num = parseFloat(beforeDecimal);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-US').format(num) + '.';
  }

  const num = parseFloat(value);
  if (isNaN(num)) return value;

  // Preserve decimal places from original string
  const decimalIndex = value.indexOf('.');
  if (decimalIndex !== -1) {
    const decimalPlaces = value.length - decimalIndex - 1;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(num);
  }

  return new Intl.NumberFormat('en-US').format(num);
};

// Remove commas from formatted number string
export const unformatAmountInput = (value: string): string => {
  return value.replace(/,/g, '');
};
