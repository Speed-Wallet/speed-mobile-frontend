import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ArrowDownUp, ChevronDown } from 'lucide-react-native';
import { scale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import { formatCurrency, formatAmountInput } from '@/utils/formatters';
import TokenLogo from '@/components/TokenLogo';
import { EnrichedTokenEntry } from '@/data/types';
import { useTokenAsset } from '@/hooks/useTokenAsset';
import { useTokenPrice } from '@/hooks/useTokenPrices';

// SwapBox component that combines label, token selector, and amount
interface SwapBoxProps {
  token: EnrichedTokenEntry | null;
  onTokenPress: () => void;
  labelText: string;
  amount: string;
  onAmountChange?: (amount: string) => void;
  isInput?: boolean; // true for input, false for output
  showBalance?: boolean;
  onInputFocus?: () => void;
  isActive?: boolean; // true when this input is currently focused
  hasInsufficientFunds?: boolean; // true when amount exceeds available balance
  disabled?: boolean; // true to disable amount input interaction
}

const SwapBox: React.FC<SwapBoxProps> = ({
  token,
  onTokenPress,
  labelText,
  amount,
  onAmountChange,
  isInput = false,
  showBalance = false,
  onInputFocus,
  isActive = false,
  hasInsufficientFunds = false,
  disabled = false,
}) => {
  const { balance: tokenBalance } = useTokenAsset(token?.address);
  const { price: tokenPrice } = useTokenPrice(token?.extensions.coingeckoId);

  const usdValue =
    token && amount && parseFloat(amount) > 0
      ? formatCurrency(parseFloat(amount) * (tokenPrice || 0))
      : '$0';

  return (
    <View style={styles.swapBoxContainer}>
      <View style={styles.swapBoxContent}>
        {/* Row 1: Label on left, Balance on right */}
        <View style={styles.headerRow}>
          <Text style={styles.swapBoxLabel}>{labelText}</Text>
          {showBalance && token && (
            <Text style={styles.balanceText}>
              {tokenBalance} {token.symbol}
            </Text>
          )}
        </View>

        {/* Row 2: Token selector on left, Amount on right */}
        <View style={styles.tokenAmountRow}>
          <TouchableOpacity
            onPress={onTokenPress}
            style={styles.tokenSelectorInBox}
          >
            {token ? (
              <View style={styles.tokenDisplay}>
                <TokenLogo
                  logoURI={token.logoURI}
                  size={moderateScale(22, 0.3)}
                  style={styles.tokenLogo}
                />
                <Text style={styles.tokenSymbolText}>{token.symbol}</Text>
              </View>
            ) : (
              <Text style={styles.tokenPlaceholderText}>Select</Text>
            )}
            <ChevronDown
              color={colors.textSecondary}
              size={moderateScale(14, 0.3)}
            />
          </TouchableOpacity>

          {disabled ? (
            <View style={styles.amountInputTouchable}>
              <Text
                style={[
                  styles.amountText,
                  !amount && styles.amountPlaceholder,
                  isActive && styles.amountTextActive,
                  hasInsufficientFunds && styles.amountTextInsufficient,
                ]}
              >
                {amount ? formatAmountInput(amount) : '0'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onInputFocus}
              style={styles.amountInputTouchable}
            >
              <Text
                style={[
                  styles.amountText,
                  !amount && styles.amountPlaceholder,
                  isActive && styles.amountTextActive,
                  hasInsufficientFunds && styles.amountTextInsufficient,
                ]}
              >
                {amount ? formatAmountInput(amount) : '0'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Row 3: USD Value on right - No gap above */}
        <View style={styles.usdValueRowTight}>
          <Text style={styles.usdValue}>{usdValue}</Text>
        </View>
      </View>
    </View>
  );
};

// Main SwapTokensSection component
interface SwapTokensSectionProps {
  fromToken: EnrichedTokenEntry | null;
  toToken: EnrichedTokenEntry | null;
  fromAmount: string;
  toAmount: string;
  activeInput: 'from' | 'to' | null;
  onFromAmountChange: (amount: string) => void;
  onToAmountChange: (amount: string) => void;
  onFromInputFocus: () => void;
  onToInputFocus: () => void;
  onSwapTokens: () => void;
  onFromTokenSelect: () => void;
  onToTokenSelect: () => void;
  hasInsufficientFunds?: boolean; // Flag to show red text when amount exceeds balance
}

const SwapTokensSection: React.FC<SwapTokensSectionProps> = ({
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  activeInput,
  onFromAmountChange,
  onToAmountChange,
  onFromInputFocus,
  onToInputFocus,
  onSwapTokens,
  onFromTokenSelect,
  onToTokenSelect,
  hasInsufficientFunds = false,
}) => {
  const handleFromTokenPress = () => {
    onFromTokenSelect();
  };

  const handleToTokenPress = () => {
    onToTokenSelect();
  };

  return (
    <>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* From Token Box */}
        <SwapBox
          labelText="From"
          token={fromToken}
          onTokenPress={handleFromTokenPress}
          amount={fromAmount}
          onAmountChange={onFromAmountChange}
          onInputFocus={onFromInputFocus}
          isInput={true}
          showBalance={true}
          isActive={activeInput === 'from'}
          hasInsufficientFunds={hasInsufficientFunds}
        />

        {/* Swap Button */}
        <View style={styles.swapButtonContainer}>
          <TouchableOpacity style={styles.swapButton} onPress={onSwapTokens}>
            <ArrowDownUp color={colors.white} size={moderateScale(16, 0.3)} />
          </TouchableOpacity>
        </View>

        {/* To Token Box */}
        <SwapBox
          labelText="To"
          token={toToken}
          onTokenPress={handleToTokenPress}
          amount={toAmount}
          onAmountChange={onToAmountChange}
          onInputFocus={onToInputFocus}
          isInput={true}
          showBalance={false}
          isActive={activeInput === 'to'}
          disabled={true}
        />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: moderateScale(20, 2.0),
    // paddingTop: moderateScale(8, 0),
  },
  // SwapBox styles
  swapBoxContainer: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: moderateScale(4, 4.0),
    marginBottom: moderateScale(6, 4.5),
  },
  swapBoxLabel: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  swapBoxContent: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenAmountRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -8,
  },
  tokenSelectorInBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 11,
    paddingHorizontal: moderateScale(9, 0.8),
    paddingVertical: moderateScale(9, 0.8),
    minWidth: moderateScale(77, 0.3),
  },
  tokenDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenLogo: {
    marginRight: 7,
  },
  tokenSymbolText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    marginRight: 7,
  },
  tokenPlaceholderText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  amountInputTouchable: {
    paddingVertical: moderateScale(12, 2.0),
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    minHeight: moderateScale(48, 1.8),
    justifyContent: 'center',
  },
  amountText: {
    fontSize: moderateScale(26, 0.3),
    color: colors.white,
    textAlign: 'right',
    fontFamily: 'Inter-Regular',
    minWidth: scale(120),
  },
  amountPlaceholder: {
    fontSize: moderateScale(26, 0.3),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  amountTextActive: {
    color: colors.white, // Normal white color when active
    opacity: 1,
  },
  amountTextInsufficient: {
    color: colors.error, // Red color for insufficient funds
  },
  usdValueRowTight: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: -12,
  },
  usdValue: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  balanceText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'right',
  },
  // Swap button styles
  swapButtonContainer: {
    alignItems: 'center',
    marginVertical: moderateScale(-28, 0.05),
    zIndex: 1,
  },
  swapButton: {
    width: moderateScale(36, 0.3),
    height: moderateScale(36, 0.3),
    borderRadius: 18, // Keep border radius fixed, no scaling
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.backgroundDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default SwapTokensSection;
