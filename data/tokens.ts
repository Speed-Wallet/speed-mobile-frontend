import colors from '@/constants/colors';
import rawTokenData from './tokens.json';
import { EnrichedTokenEntry, TokenEntry, TokenJsonEntry } from './types';

const tokenData: TokenJsonEntry[] = rawTokenData;

// Define the type for the processed crypto data, including the color

const tokens: TokenEntry[] = tokenData.map(
  (token: TokenJsonEntry): TokenEntry => {
    let color = '#CCCCCC'; // Default color
    if (token.symbol === 'SOL') {
      color = colors.solana;
    } else if (token.symbol === 'soETH') {
      color = colors.ethereum;
    } else if (token.symbol === 'WBTC') {
      color = colors.bitcoin;
    } else if (token.symbol === 'USDC') {
      color = colors.usdc; // Use imported color
    } else if (token.symbol === 'USDT') {
      color = colors.usdt; // Use imported color
    }

    return {
      ...token, // Spread all properties from the original token, including decimalsShown
      color: color, // Add the new color property
    };
  },
);

// Get a specific token by Address
export const getTokenByAddress = (address: string): EnrichedTokenEntry => {
  const token = tokens.find((c) => c.address === address);
  if (!token) {
    throw new Error(`Token with address ${address} not found`);
  }
  return {
    ...token,
    priceChangePercentage: Math.random() * 20 - 10, // Random percentage between -10% and +10%
    balance: Math.random() * 100, // Random balance
    price: Math.random() * 1000, // Random price
    description: 'This is a sample description for the token.',
    marketCap: Math.random() * 1000000, // Random market cap
    volume24h: Math.random() * 100000, // Random volume
    circulatingSupply: Math.random() * 1000000, // Random circulating supply
    maxSupply: Math.random() > 0.5 ? Math.random() * 2000000 : undefined, // Random max supply or undefined
  };
};

// Get all available token information
export const getAllTokenInfo = (): EnrichedTokenEntry[] => {
  return tokens.map((token) => ({
    ...token,
    priceChangePercentage: Math.random() * 20 - 10, // Random percentage between -10% and +10%
    balance: Math.random() * 100, // Random balance
    price: Math.random() * 1000, // Random price
    description: 'This is a sample description for the token.',
    marketCap: Math.random() * 1000000, // Random market cap
    volume24h: Math.random() * 100000, // Random volume
    circulatingSupply: Math.random() * 1000000, // Random circulating supply
    maxSupply: Math.random() > 0.5 ? Math.random() * 2000000 : undefined, // Random max supply or undefined
  }));
};
