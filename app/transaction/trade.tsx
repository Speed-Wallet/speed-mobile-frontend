import { useState, useEffect, useRef, useMemo } from 'react'; // Added useMemo
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, StatusBar, ScrollView, Animated } from 'react-native'; // Removed Dimensions, Removed Image, Added Animated
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowDownUp, ArrowRightLeft, DollarSign, Lock, ChevronDown } from 'lucide-react-native'; // Changed ArrowUpDown to ArrowDownUp, Added Lock, Added ChevronDown
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import { getAllTokenInfo, getTokenByAddress } from '@/data/tokens';
import AmountInput from '@/components/AmountInput'; // Added import
import TokenLogo from '@/components/TokenLogo'; // Added import
import { EnrichedTokenEntry } from '@/data/types';
import { PLATFORM_FEE_RATE, JupiterQuote, jupiterSwap } from '@/services/walletService';
import ScreenHeader from '@/components/ScreenHeader';
import ScreenContainer from '@/components/ScreenContainer';
import { useTokenValue } from '@/hooks/useTokenValue';
import { useTokenPrice } from '@/hooks/useTokenPrices';
import { triggerShake } from '@/utils/animations';
import { useTokenBalance } from '@/hooks/useTokenBalance';

const WAIT_ON_AMOUNT_CHANGE = 2000;
const LOOP_QUOTE_INTERVAL = 10000;
let lastQuoteTime = 0;
let timeoutID: NodeJS.Timeout | undefined;
let intervalID: NodeJS.Timeout | undefined;

let platformFee: number;
let quote: any;

// New TokenSelectorDisplay component
interface TokenSelectorDisplayProps {
  token: EnrichedTokenEntry | null;
  onPress: () => void;
  labelText: string; // To differentiate "From" / "To" or pass specific label style if needed
}

const TokenSelectorDisplay: React.FC<TokenSelectorDisplayProps> = ({ token, onPress, labelText }) => {
  return (
    <>
      <Text style={styles.label}>{labelText}</Text>
      <TouchableOpacity onPress={onPress} style={styles.tokenSelectorContainer}>
        {token ? (
          <View style={styles.tokenDisplay}>
            <TokenLogo logoURI={token.logoURI} size={24} style={styles.tokenLogo} />
            <Text style={styles.tokenNameText}>{token.name}</Text>
          </View>
        ) : (
          <Text style={styles.tokenPlaceholderText}>Select Token</Text>
        )}
        <ChevronDown color={colors.textSecondary} size={20} />
      </TouchableOpacity>
    </>
  );
};


export default function TradeScreen() {
  const { tokenAddress, selectedTokenAddress, returnParam } = useLocalSearchParams<{
    tokenAddress?: string;
    selectedTokenAddress?: string;
    returnParam?: string;
  }>();
  const router = useRouter();
  const [fromToken, setFromToken] = useState<EnrichedTokenEntry | null>(null);
  const [toToken, setToToken] = useState<EnrichedTokenEntry | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const { price: fromTokenPrice } = useTokenPrice(fromToken?.extensions.coingeckoId);
  const { balance: fromTokenBalance } = useTokenBalance(fromToken?.address);

  function updateAmounts() {
    if (timeoutID !== undefined) {
      clearTimeout(timeoutID);
      timeoutID = undefined;
    }

    if (intervalID !== undefined) {
      clearInterval(intervalID);
      intervalID = undefined;
    }

    setToAmount('');
    const amountEntered = parseFloat(fromAmount);
    if (isNaN(amountEntered) || amountEntered === 0) return;

    const amount = amountEntered * 10 ** fromToken!.decimals;
    platformFee = Math.round(amount * PLATFORM_FEE_RATE);
    const inAmount = amount - platformFee;
    const diff = Date.now() - lastQuoteTime;

    if (diff < WAIT_ON_AMOUNT_CHANGE) {
      timeoutID = setTimeout(updateAmounts, WAIT_ON_AMOUNT_CHANGE - diff);
      return;
    }

    lastQuoteTime = Date.now();
    fetchAndApplyQuote(inAmount);
  }

  async function fetchAndApplyQuote(inAmount: number) {
    try {
      quote = await JupiterQuote(fromToken!.address, toToken!.address, inAmount);

      if (!quote) {
        quote = undefined;
        return;
      } else if (quote.errorCode) {
        console.error(quote);
        quote = undefined;
        return;
      }

      const outAmount = parseFloat(quote.outAmount);

      if (!isNaN(outAmount)) {
        const val = outAmount * 10 ** -toToken!.decimals;
        setToAmount(val.toFixed(toToken!.decimalsShown)); // Use decimalsShown (now mandatory)
      }

      if (!intervalID) {
        intervalID = setInterval(fetchAndApplyQuote, LOOP_QUOTE_INTERVAL, inAmount);
      }
    } catch (err: any) {
      console.error(err.message);
      alert('Network error, unable to establish connection');
    }
  }

  useEffect(updateAmounts, [fromAmount]);

  // Handle token selection from the token selector page
  useEffect(() => {
    if (selectedTokenAddress && returnParam) {
      const tokens = getAllTokenInfo();
      const selectedToken = tokens.find(token => token.address === selectedTokenAddress);

      if (selectedToken) {
        if (returnParam === 'fromToken') {
          setFromToken(selectedToken);
        } else if (returnParam === 'toToken') {
          setToToken(selectedToken);
        }
      }

      // Clear the params to prevent re-triggering
      router.setParams({
        selectedTokenAddress: undefined,
        returnParam: undefined
      });
    }
  }, [selectedTokenAddress, returnParam]);

  useEffect(() => {
    const loadData = () => {
      const tokens = getAllTokenInfo();

      if (tokenAddress) {
        const token = getTokenByAddress(tokenAddress as string);
        setFromToken(token);

        const defaultTo = tokens.find(t => t.address !== token.address);
        if (defaultTo) {
          setToToken(defaultTo);
        }
      } else if (tokens.length > 1) {
        setFromToken(tokens[0]);
        setToToken(tokens[1]);
      }
    };
    loadData()
  }, [tokenAddress]);

  if (Array.isArray(tokenAddress)) {
    throw new Error('tokenAddress should not be an array');
  }

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);

    // If amounts were tied to tokens, you might want to swap them or clear/recalculate
    // For now, let's clear the 'toAmount' and keep 'fromAmount' if it was user-entered,
    // or swap them if 'toAmount' was a calculated quote.
    // If 'toAmount' was a quote, it's now invalid.
    // Let's assume user might want to re-enter or recalculate.
    // For simplicity, we can swap amounts or clear toAmount.
    // Swapping amounts:
    // setFromAmount(tempToAmount); 
    // setToAmount(tempFromAmount);

    // Or, more robustly, clear toAmount and let it recalculate if fromAmount is present
    setFromAmount(toAmount); // Or keep original fromAmount: setFromAmount(tempFromAmount)
    setToAmount(''); // Quote will be re-fetched by useEffect on fromAmount or by updateAmounts call

    // setSelectedPercentage('25'); // Reset selected percentage
  };

  const handleTrade = async () => {
    const amount = parseFloat(fromAmount);

    if (isNaN(amount) || amount <= 0) {
      alert('Invalid amount');
      return;
    }

    if (!fromToken || !toToken) {
      alert('Please select both tokens.');
      return;
    }

    if (amount > fromTokenBalance) {
      alert('Insufficient balance');
      return;
    }
    if (!quote || quote.errorCode) {
      alert('Quote is not available or invalid. Please try again.');
      return;
    }

    alert(`Trading ${fromAmount} ${fromToken?.symbol} for ${toAmount} ${toToken?.symbol}`);

    if (timeoutID !== undefined) {
      clearTimeout(timeoutID);
      timeoutID = undefined;
    }
    if (intervalID !== undefined) {
      clearInterval(intervalID);
      intervalID = undefined;
    }

    try {
      const sig = await jupiterSwap(quote, platformFee);
      console.log(`Trade Successful: ${sig}`);
      alert('Trade Successful!'); // Provide feedback
    } catch (err: any) {
      console.error(err);
      alert(`Error trading tokens: ${err.message || 'Unknown error'}`);
    }
  };

  // Calculate exchange rate and receive amount for display
  const exchangeRate = (quote && toToken && fromToken && parseFloat(fromAmount) > 0)
    ? (parseFloat(quote.outAmount) / (10 ** toToken.decimals)) / parseFloat(fromAmount)
    : null;

  // Determine if the effective 'toAmount' is zero for styling purposes
  const effectiveToAmountIsZero = !toAmount || parseFloat(toAmount) === 0;

  // Format the 'toAmount' for display with thousand separators and correct decimal places
  const receiveAmountDisplay = useMemo(() => {
    const num = parseFloat(toAmount);
    // Default to 0 formatted according to token's decimalsShown or 2 if token/amount is invalid
    if (isNaN(num) || !toToken) {
      return (0).toLocaleString(undefined, {
        minimumFractionDigits: toToken?.decimalsShown || 2,
        maximumFractionDigits: toToken?.decimalsShown || 2,
      });
    }
    // Format the valid number
    return num.toLocaleString(undefined, {
      minimumFractionDigits: toToken.decimalsShown,
      maximumFractionDigits: toToken.decimalsShown,
    });
  }, [toAmount, toToken]);


  const totalValueDisplay = (fromAmount && fromToken && parseFloat(fromAmount) > 0)
    ? formatCurrency(parseFloat(fromAmount) * (fromTokenPrice || 0))
    : '$0.00';

  const isButtonDisabled = !fromAmount || parseFloat(fromAmount) <= 0 || !quote || !!quote.errorCode;

  const handleTradeAttempt = () => {
    if (isButtonDisabled) {
      triggerShake(shakeAnimationValue);
    } else {
      handleTrade();
    }
  };


  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScreenHeader 
        title="Swap Tokens"
        onBack={() => router.push('/' as any)}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* From Token */}
        <TokenSelectorDisplay
          labelText="From"
          token={fromToken}
          onPress={() => router.push({
            pathname: '/token/select',
            params: {
              excludeAddress: toToken?.address,
              selectedAddress: fromToken?.address,
              returnParam: 'fromToken'
            }
          })}
        />

        {/* Swap Button */}
        <View style={styles.swapButtonContainer}>
          <TouchableOpacity style={styles.swapButton} onPress={handleSwapTokens}>
            <ArrowDownUp color={colors.white} size={20} />
          </TouchableOpacity>
        </View>

        {/* To Token */}
        <TokenSelectorDisplay
          labelText="To"
          token={toToken}
          onPress={() => router.push({
            pathname: '/token/select',
            params: {
              excludeAddress: fromToken?.address,
              selectedAddress: toToken?.address,
              returnParam: 'toToken'
            }
          })}
        />

        {/* Amount Input */}
        <AmountInput
          address={fromToken?.address}
          amount={fromAmount}
          setAmount={setFromAmount}
        // selectedPercentage={selectedPercentage} // Pass if using percentage selection
        // handlePercentageSelect={handlePercentageSelect} // Pass if using percentage selection
        />

        {/* You Receive Text - MOVED HERE */}
        {toToken && (
          <Text style={[
            styles.receiveAmountText,
            effectiveToAmountIsZero && { opacity: styles.label.opacity } // Apply label's opacity if zero
          ]}>
            Receive: {receiveAmountDisplay} {toToken.symbol}
          </Text>
        )}

        {/* Trade Button - Exchange Info Card will be MOVED AFTER this */}
        <TouchableOpacity
          style={[
            styles.tradeExecuteButton, // Apply base styles here
            isButtonDisabled && styles.buttonOpacityDisabled,
          ]}
          onPress={handleTradeAttempt} // Use the new handler
        // disabled prop is removed to allow onPress to fire for shake animation
        >
          <LinearGradient
            colors={isButtonDisabled ? ['#4a4a4a', '#3a3a3a'] : ['#3B82F6', '#2563EB']}
            style={styles.buttonGradient}>
            <Animated.View style={{ transform: [{ translateX: shakeAnimationValue }], flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              {isButtonDisabled ? (
                <Lock size={20} color={colors.white} />
              ) : (
                <ArrowRightLeft size={20} color={colors.white} />
              )}
              <Text style={styles.tradeExecuteButtonText}>Swap Tokens</Text>
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Exchange Info - MOVED HERE and "You Receive" row removed */}
        {fromToken && toToken && (
          <View style={styles.exchangeInfoCard}>
            <View style={styles.exchangeInfoRow}>
              <Text style={styles.exchangeInfoLabel}>Rate:</Text>
              <Text style={styles.exchangeInfoValue}>
                {exchangeRate ? `1 ${fromToken.symbol} = ${exchangeRate.toFixed(toToken.decimalsShown)} ${toToken.symbol}` : 'N/A'}
              </Text>
            </View>
            {/* "You Receive" row has been removed */}
            <View style={styles.exchangeInfoRow}>
              <Text style={styles.exchangeInfoLabel}>Total Value:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <DollarSign size={14} color={'#4ade80'} style={{ marginRight: 2, opacity: 1 }} />
                <Text style={[styles.exchangeInfoValue, { color: '#4ade80', opacity: 1 }]}>
                  {totalValueDisplay.startsWith('$') ? totalValueDisplay.substring(1) : totalValueDisplay}
                </Text>
              </View>
            </View>
            <View style={styles.exchangeInfoRow}>
              <Text style={styles.exchangeInfoLabel}>Fee %:</Text>
              <Text style={styles.exchangeInfoValue}>0.2%</Text>
            </View>
            {quote && quote.marketInfos && (
              <View style={styles.exchangeInfoRow}>
                <Text style={styles.exchangeInfoLabel}>Route:</Text>
                <Text style={styles.exchangeInfoValueMini}>
                  {quote.marketInfos.map((mi: any) => mi.label).join(' → ')}
                </Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 30, // Space for the trade button
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.white, // Changed from colors.textSecondary
    opacity: 0.7, // Added opacity to make it slightly less prominent than full white
    marginBottom: 8,
  },
  bottomLabel: { // This style might no longer be needed if TokenSelectorDisplay handles its own label
    // marginTop: -10, // Or adjust if still used elsewhere
  },
  tokenSelectorContainer: {
    backgroundColor: colors.backgroundMedium, // Darker element background
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tokenDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenLogo: {
    marginRight: 8,
  },
  tokenSymbolText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    marginRight: 8,
  },
  tokenNameText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold', // Changed from Inter-Regular
    color: colors.white, // Changed from colors.textSecondary
  },
  tokenPlaceholderText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  swapButtonContainer: {
    alignItems: 'center',
    // marginVertical: 1, // Reduced margin
  },
  swapButton: { // Style for LinearGradient
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight, // Slightly lighter than card, or primary color
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.backgroundMedium,
  },
  balanceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'left',
    marginTop: 4,
  },
  // New style for "You Receive" text
  receiveAmountText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.white, // Base color is white
    textAlign: 'left', // Or 'center' if preferred
    marginTop: 4,
    marginBottom: 12, // Space before the trade button
    paddingHorizontal: 4, // Optional: if you want some horizontal padding
  },
  percentagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Or space-between
  },
  percentageChip: {
    backgroundColor: colors.backgroundLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  selectedPercentageChip: {
    backgroundColor: colors.primary,
  },
  percentageChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  selectedPercentageChipText: {
    color: colors.white,
  },
  exchangeInfoCard: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
    marginTop: 16, // Adjusted marginTop to bring it closer to the trade button
    marginBottom: 24,
  },
  exchangeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Increased vertical spacing
  },
  exchangeInfoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular', // Changed from Inter-Medium to make it less bold
    color: colors.textSecondary,
    // marginRight: 4, // Add some spacing if needed next to an icon
  },
  exchangeInfoValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium', // Changed from Inter-SemiBold to make it less bold
    color: colors.white,
    textAlign: 'right',
    opacity: 0.9, // Added opacity to slightly grey out
  },
  exchangeInfoValueMini: {
    fontSize: 12,
    fontFamily: 'Inter-Regular', // Kept as Inter-Regular
    color: colors.textSecondary, // This is likely already a greyish color
    textAlign: 'right',
    flexShrink: 1,
    opacity: 0.9, // Added or adjust opacity if needed for further greying out
  },
  tradeExecuteButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    // marginBottom: 24, // Removed or adjust if exchangeInfoCard is below

    // iOS Shadow (kept commented as per last file state)
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.25,
    // shadowRadius: 3.84,
    // Android Shadow (kept commented as per last file state)
    // elevation: 5,
  },
  buttonOpacityDisabled: { // New style for TouchableOpacity's disabled state when wrapping a gradient
    opacity: 0.6, // Made less opaque
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  tradeExecuteButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    marginLeft: 10,
  },
});