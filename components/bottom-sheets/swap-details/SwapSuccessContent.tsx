import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, ExternalLink } from 'lucide-react-native';
import colors from '@/constants/colors';
import CopyButton from '@/components/CopyButton';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import { TokenMetadata } from '@/services/tokenAssetService';
import { unformatAmountInput, formatCurrency } from '@/utils/formatters';

interface SwapSuccessContentProps {
  fromToken: TokenMetadata;
  toToken: TokenMetadata;
  fromAmount: string;
  toAmount: string;
  fromTokenPrice: number;
  swapTxSignature: string;
  onClose: () => void;
}

export default function SwapSuccessContent({
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  fromTokenPrice,
  swapTxSignature,
  onClose,
}: SwapSuccessContentProps) {
  return (
    <View style={styles.stateContainer}>
      {/* Row 1: Check mark */}
      <View style={styles.successIcon}>
        <Check size={32} color="white" />
      </View>

      {/* Row 2: Title + subtitle */}
      <View>
        <Text style={styles.stateTitle}>Swap Successful!</Text>
        <Text style={styles.stateSubtitle}>
          You've successfully swapped your tokens.
        </Text>
      </View>

      {/* Row 3: From/to box + txn id box + explorer box */}
      <View style={styles.successDetailsContainer}>
        {/* <View style={styles.swapSummaryContainer}>
          <View style={styles.swapSummaryRow}>
            <Text style={styles.swapSummaryLabel}>From</Text>
            <View style={styles.swapSummaryAmountContainer}>
              <Text style={styles.swapSummaryAmount}>
                {parseFloat(unformatAmountInput(fromAmount)).toFixed(2)}{' '}
                {fromToken.symbol}
              </Text>
              <Text style={styles.swapSummaryValue}>
                {formatCurrency(
                  parseFloat(unformatAmountInput(fromAmount)) *
                    (fromTokenPrice || 0),
                )}
              </Text>
            </View>
          </View>

          <View style={styles.swapSummaryDivider} />

          <View style={styles.swapSummaryRow}>
            <Text style={styles.swapSummaryLabel}>To</Text>
            <View style={styles.swapSummaryAmountContainer}>
              <Text style={styles.swapSummaryAmount}>
                {parseFloat(unformatAmountInput(toAmount)).toFixed(2)}{' '}
                {toToken.symbol}
              </Text>
              <Text style={styles.swapSummaryValue}>
                {formatCurrency(
                  parseFloat(unformatAmountInput(toAmount)) *
                    (fromTokenPrice || 0),
                )}
              </Text>
            </View>
          </View>
        </View> */}

        {swapTxSignature && (
          <>
            <View style={styles.transactionIdContainer}>
              <View>
                <Text style={styles.transactionIdLabel}>Transaction ID</Text>
                <Text style={styles.transactionIdValue}>
                  {swapTxSignature.substring(0, 8)}...
                  {swapTxSignature.substring(swapTxSignature.length - 8)}
                </Text>
              </View>
              <CopyButton textToCopy={swapTxSignature} size={20} />
            </View>

            <TouchableOpacity style={styles.explorerContainer}>
              <View>
                <Text style={styles.explorerLabel}>Explorer</Text>
                <Text style={styles.explorerSubtext}>
                  View on Solana Explorer
                </Text>
              </View>
              <ExternalLink size={20} color={colors.white} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Row 4: Close button */}
      <PrimaryActionButton title="Close" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  stateContainer: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 1,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  successDetailsContainer: {
    width: '100%',
    gap: 10,
    marginVertical: 24,
  },
  swapSummaryContainer: {
    width: '100%',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  swapSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  swapSummaryDivider: {
    height: 1,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary,
    borderStyle: 'dashed',
    opacity: 0.3,
    marginVertical: 4,
  },
  swapSummaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  swapSummaryAmountContainer: {
    alignItems: 'flex-end',
  },
  swapSummaryAmount: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
  swapSummaryValue: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionIdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  transactionIdLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
  transactionIdValue: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  explorerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  explorerLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
  explorerSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
});
