# Birdeye API Migration Guide

## Overview

The frontend has been updated to use **Birdeye API** instead of CoinGecko for real-time token price data and market statistics. This provides better data coverage for Solana tokens.

## What Changed

### New Types (see `/types/birdeye.ts`)

- `BirdeyeTokenMarketData` - Comprehensive market data for a single token
- `BirdeyeHistoricalDataPoint` - Single price data point with timestamp
- `HistoricalPricesResponse` - Response structure for historical price data
- `TokenMarketDataResponse` - Response structure for market data
- `TimeframePeriod` - Supported timeframe periods: '1H' | '1D' | '7D' | '1M' | '1Y'

### Updated Functions

- `getTokenMarketData(address)` - Get current market data for a token
- `getHistoricalPrices(address, timeframe)` - Get historical price data

### Deprecated Functions

- `getTokenPrices()` - Still available but marked as deprecated. Will be removed in future version.

## Migration Examples

### Before (CoinGecko)

```typescript
import { TokenMetadata, getTokenPrices } from '@/services/apis';

const response = await getTokenPrices();
if (response.success) {
  const tokens: TokenMetadata[] = response.data;
  // tokens had coingeckoId, priceData with current_price, market_cap, etc.
}
```

### After (Birdeye)

```typescript
import { BirdeyeTokenMarketData, getTokenMarketData } from '@/services/apis';

const response = await getTokenMarketData(tokenAddress);
if (response.success && response.data) {
  const token: BirdeyeTokenMarketData = response.data;
  // token has price, mc (market cap), supply, circulatingSupply, v24hUSD (volume), etc.
}
```

## Key Differences

### Field Names

| CoinGecko            | Birdeye              | Notes                      |
| -------------------- | -------------------- | -------------------------- |
| `current_price`      | `price`              | Current token price in USD |
| `market_cap`         | `market_cap`         | Market capitalization      |
| `total_supply`       | `total_supply`       | Total token supply         |
| `circulating_supply` | `circulating_supply` | Circulating supply         |
| N/A                  | `liquidity`          | Total liquidity            |
| N/A                  | `fdv`                | Fully diluted valuation    |

**Note**: Token `symbol` and `name` are NOT returned in the API response. They should be passed as route/query parameters.

### Historical Data Structure

**CoinGecko**: Array of `[timestamp, price]` tuples

```typescript
prices: [[1609459200000, 0.123], [1609462800000, 0.124], ...]
```

**Birdeye**: Array of objects with `unixTime` (seconds) and `value`

```typescript
items: [
  { unixTime: 1609459200, value: 0.123 },
  { unixTime: 1609462800, value: 0.124 },
  ...
]
```

### Timeline Parameters

**CoinGecko**: Used `days` parameter (1, 7, 30, 90, 365, max)

**Birdeye**: Uses `timeframe` parameter with mapped intervals:

- `'1H'` → 5-minute intervals, last 1 hour
- `'1D'` → 1-hour intervals, last 24 hours
- `'7D'` → 4-hour intervals, last 7 days
- `'1M'` → 1-day intervals, last 30 days
- `'1Y'` → 1-week intervals, last 365 days

## Caching Strategy

### Birdeye API Caching

- **Historical Prices**: 24 hours (86400 seconds)
- **Market Data**: 30 minutes (1800 seconds)

Cache keys:

- Historical: `birdeye_historical_{address}_{timeframe}`
- Market Data: `birdeye_market_{address}`

## Backward Compatibility

The old CoinGecko types and `getTokenPrices()` function are still available but deprecated. They will be removed in a future version.

If you have code that still relies on these:

1. Update to use Birdeye functions and types
2. Update field names according to the mapping above
3. Test thoroughly, especially chart rendering

## Files Modified

### Types

- ✅ Created `/types/birdeye.ts` - New Birdeye types

### Services

- ✅ Updated `/services/apis.ts` - Birdeye functions with proper types

### Utils

- ✅ Updated `/utils/chartUtils.ts` - Chart formatting for Birdeye data structure

### Screens

- ✅ Updated `/app/token/[address].tsx` - Token detail screen using Birdeye types

## Next Steps

1. **Remove CoinGecko Backend Endpoints** (optional)
   - `/api/prices/tokens` endpoint can be deprecated
   - Remove CoinGecko layer from backend

2. **Update Other Screens** (if needed)
   - Check if any other screens use `getTokenPrices()`
   - Migrate them to Birdeye API

3. **Monitor API Usage**
   - Birdeye has rate limits on free tier
   - Caching helps stay within limits
   - Consider upgrading if needed
