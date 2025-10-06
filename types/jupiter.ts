// Jupiter API Types for token data

export interface JupiterTokenStats {
  priceChange: number;
  liquidityChange: number;
  volumeChange: number;
  buyVolume: number;
  sellVolume: number;
  buyOrganicVolume: number;
  sellOrganicVolume: number;
  numBuys: number;
  numSells: number;
  numTraders: number;
  numOrganicBuyers: number;
  numNetBuyers: number;
}

export interface JupiterTokenAudit {
  mintAuthorityDisabled: boolean;
  freezeAuthorityDisabled: boolean;
  topHoldersPercentage: number;
}

export interface JupiterFirstPool {
  id: string;
  createdAt: string;
}

export interface JupiterToken {
  id: string; // Mint address
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  circSupply: number;
  totalSupply: number;
  tokenProgram: string;
  firstPool: JupiterFirstPool;
  holderCount: number;
  audit: JupiterTokenAudit;
  organicScore: number;
  organicScoreLabel: string;
  isVerified: boolean;
  cexes: string[];
  tags: string[];
  fdv: number; // Fully diluted valuation
  mcap: number; // Market cap
  usdPrice: number;
  priceBlockId: number;
  liquidity: number;
  stats5m: JupiterTokenStats;
  stats1h: JupiterTokenStats;
  stats6h: JupiterTokenStats;
  stats24h: JupiterTokenStats;
  ctLikes: number;
  smartCtLikes: number;
  updatedAt: string;
}

export type JupiterTokenResponse = JupiterToken[];
