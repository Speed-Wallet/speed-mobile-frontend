import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale, moderateScale } from 'react-native-size-matters';
import { DollarSign } from 'lucide-react-native';
import colors from '@/constants/colors';
import TokenLogo from '@/components/TokenLogo';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import { TokenMetadata } from '@/services/tokenAssetService';
import { PreparedJupiterSwap } from '@/services/walletService';

interface SwapDetailsContentProps {
  fromToken: TokenMetadata;
  toToken: TokenMetadata;
  quote: any;
  exchangeRate: number | null;
  totalValueDisplay: string;
  preparedSwap: PreparedJupiterSwap | null;
  isPreparingSwap: boolean;
  isSwapping: boolean;
  onConfirmSwap: () => void;
}

export default function SwapDetailsContent({
  fromToken,
  toToken,
  quote,
  exchangeRate,
  totalValueDisplay,
  preparedSwap,
  isPreparingSwap,
  isSwapping,
  onConfirmSwap,
}: SwapDetailsContentProps) {
  return (
    <>
      <Text style={styles.bottomSheetTitle}>Swap Details</Text>

      <View style={styles.swapTokensDisplay}>
        <View style={styles.swapTokenLogos}>
          <TokenLogo
            logoURI={fromToken.logoURI}
            size={moderateScale(32, 0.3)}
            style={styles.fromTokenLogo}
          />
          <TokenLogo
            logoURI={toToken.logoURI}
            size={moderateScale(32, 0.3)}
            style={styles.toTokenLogo}
          />
        </View>
        <Text style={styles.swapTokensText}>
          {fromToken.symbol} → {toToken.symbol}
        </Text>
      </View>

      <View style={styles.swapDetailsContainer}>
        <View style={styles.swapDetailRow}>
          <Text style={styles.swapDetailLabel}>Rate</Text>
          <Text style={styles.swapDetailValue}>
            {exchangeRate
              ? `1 ${fromToken.symbol} = ${exchangeRate.toFixed(toToken.decimalsShown || toToken.decimals)} ${toToken.symbol}`
              : 'N/A'}
          </Text>
        </View>

        <View style={styles.swapDetailRow}>
          <Text style={styles.swapDetailLabel}>Total Value</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <DollarSign
              size={14}
              color={'#4ade80'}
              style={{ marginRight: 2 }}
            />
            <Text style={[styles.swapDetailValue, { color: '#4ade80' }]}>
              {totalValueDisplay.startsWith('$')
                ? totalValueDisplay.substring(1)
                : totalValueDisplay}
            </Text>
          </View>
        </View>

        <View style={styles.swapDetailRow}>
          <Text style={styles.swapDetailLabel}>Trade Fee</Text>
          <Text style={styles.swapDetailValue}>0.2%</Text>
        </View>

        {quote && (
          <>
            <View style={styles.swapDetailRow}>
              <Text style={styles.swapDetailLabel}>Price Impact</Text>
              <Text style={styles.swapDetailValue}>
                {(() => {
                  const impact = parseFloat(quote.priceImpactPct) * 100;
                  if (impact < 0.001) return '0.00%';
                  const decimals = impact < 0.01 ? 3 : 2;
                  return `${impact.toFixed(decimals)}%`;
                })()}
              </Text>
            </View>

            <View style={styles.swapDetailRow}>
              <Text style={styles.swapDetailLabel}>Max Slippage</Text>
              <Text style={styles.swapDetailValue}>
                {(quote.slippageBps / 100).toFixed(2)}%
              </Text>
            </View>
          </>
        )}
      </View>

      <PrimaryActionButton
        title={
          isSwapping
            ? 'Processing Swap...'
            : isPreparingSwap
              ? 'Preparing...'
              : 'Confirm Swap'
        }
        onPress={onConfirmSwap}
        disabled={!preparedSwap || isPreparingSwap || isSwapping}
        loading={isPreparingSwap || isSwapping}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bottomSheetTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  swapTokensDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  swapTokenLogos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  fromTokenLogo: {
    zIndex: 2,
  },
  toTokenLogo: {
    marginLeft: -8,
    zIndex: 1,
  },
  swapTokensText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    textAlign: 'center',
  },
  swapDetailsContainer: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  swapDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  swapDetailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  swapDetailValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.white,
    textAlign: 'right',
  },
});
