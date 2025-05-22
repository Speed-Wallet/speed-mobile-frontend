// Type for entries directly from cryptos.json
export interface TokenJsonEntry {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  decimalsShown: number; // Changed to be non-optional
  logoURI: string;
  tags?: string[];
  daily_volume?: number;
  created_at: string;
  freeze_authority: string | null;
  mint_authority: string | null;
  permanent_delegate: string | null;
  minted_at: string | null;
  extensions: {
    coingeckoId: string;
  };
}

export interface TokenEntry extends TokenJsonEntry {
  color: string;
  // decimalsShown is inherited from TokenJsonEntry
}

export interface EnrichedTokenEntry extends TokenEntry {
  priceChangePercentage: number;
  balance: number;
  price: number;
  description: string;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  maxSupply?: number;
  // decimalsShown is inherited from TokenEntry -> TokenJsonEntry
}

