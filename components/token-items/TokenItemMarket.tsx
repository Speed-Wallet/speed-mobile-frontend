import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { scale, moderateScale, verticalScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import {
  formatCurrency,
  formatPercentage,
  formatLargeNumber,
} from '@/utils/formatters';
import { TokenMetadata } from '@/services/tokenAssetService';
import TokenItemBase from './TokenItemBase';

type DisplayMetric =
  | 'price'
  | 'volume'
  | 'organicScore'
  | 'liquidity'
  | 'marketCap';

interface TokenItemMarketProps {
  token: TokenMetadata;
  onPress: () => void;
  price?: number; // Optional current price
  priceChangePercentage?: number; // Optional 24h price change
  volume?: number; // Optional 24h volume (buy + sell)
  volumeChangePercentage?: number; // Optional 24h volume change
  liquidity?: number; // Optional liquidity
  liquidityChangePercentage?: number; // Optional liquidity change
  organicScore?: number; // Optional organic score
  marketCap?: number; // Optional market cap
  displayMetric?: DisplayMetric; // What metric to display
  isLoading?: boolean;
  backgroundColor?: string;
}

/**
 * Token item for market screen - shows symbol and dynamic metrics based on displayMetric
 */
const TokenItemMarket = ({
  token,
  onPress,
  price,
  priceChangePercentage = 0,
  volume,
  volumeChangePercentage = 0,
  liquidity,
  liquidityChangePercentage = 0,
  organicScore,
  marketCap,
  displayMetric = 'price',
  isLoading = false,
  backgroundColor,
}: TokenItemMarketProps) => {
  // Determine what to display based on displayMetric
  let mainValue: string | undefined;
  let changePercentage: number | undefined;
  let hasValue = false;

  switch (displayMetric) {
    case 'price':
      if (price !== undefined && price !== null) {
        mainValue = formatCurrency(price);
        changePercentage = priceChangePercentage;
        hasValue = true;
      }
      break;
    case 'volume':
      if (volume !== undefined && volume !== null) {
        mainValue = formatLargeNumber(volume);
        changePercentage = volumeChangePercentage;
        hasValue = true;
      }
      break;
    case 'liquidity':
      if (liquidity !== undefined && liquidity !== null) {
        mainValue = formatLargeNumber(liquidity);
        changePercentage = liquidityChangePercentage;
        hasValue = true;
      }
      break;
    case 'marketCap':
      if (marketCap !== undefined && marketCap !== null) {
        mainValue = formatLargeNumber(marketCap);
        changePercentage = undefined; // No change percentage for market cap
        hasValue = true;
      }
      break;
    case 'organicScore':
      if (organicScore !== undefined && organicScore !== null) {
        mainValue = organicScore.toFixed(2);
        changePercentage = undefined; // No change percentage for organic score
        hasValue = true;
      }
      break;
  }

  const isPositiveChange = (changePercentage ?? 0) >= 0;

  return (
    <TokenItemBase
      logoURI={token.logoURI}
      name={token.name}
      onPress={onPress}
      isLoading={isLoading}
      backgroundColor={backgroundColor}
      secondaryContent={<Text style={styles.symbol}>{token.symbol}</Text>}
      rightContent={
        hasValue && mainValue ? (
          <>
            <Text style={styles.price}>{mainValue}</Text>
            {changePercentage !== undefined && changePercentage !== 0 && (
              <View style={styles.changeContainer}>
                {isPositiveChange ? (
                  <ArrowUpRight
                    size={scale(10)}
                    color={colors.success}
                    style={styles.changeIcon}
                  />
                ) : (
                  <ArrowDownRight
                    size={scale(10)}
                    color={colors.error}
                    style={styles.changeIcon}
                  />
                )}
                <Text
                  style={[
                    styles.change,
                    { color: isPositiveChange ? colors.success : colors.error },
                  ]}
                >
                  {formatPercentage(changePercentage)}
                </Text>
              </View>
            )}
          </>
        ) : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  symbol: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  price: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(3),
  },
  changeIcon: {
    marginRight: scale(3),
  },
  change: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Medium',
  },
});

export default TokenItemMarket;
