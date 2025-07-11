import { useState, useEffect, useRef, useMemo } from 'react'; // Added useMemo
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, StatusBar, ScrollView, Animated } from 'react-native'; // Removed Dimensions, Removed Image, Added Animated
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowDownUp, ArrowRightLeft, DollarSign, Lock, ChevronDown } from 'lucide-react-native'; // Changed ArrowUpDown to ArrowDownUp, Added Lock, Added ChevronDown
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import { getAllTokenInfo, getTokenByAddress } from '@/data/tokens';
// import AmountInput from '@/components/AmountInput'; // Commented out since we're using SwapBox now
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

// New SwapBox component that combines label, token selector, and amount
interface SwapBoxProps {
  token: EnrichedTokenEntry | null;
  onTokenPress: () => void;
  labelText: string;
  amount: string;
  onAmountChange?: (amount: string) => void;
  isInput?: boolean; // true for input, false for output
  showBalance?: boolean;
}

const SwapBox: React.FC<SwapBoxProps> = ({ 
  token, 
  onTokenPress, 
  labelText, 
  amount, 
  onAmountChange, 
  isInput = false,
  showBalance = false 
}) => {
  const { balance: tokenBalance } = useTokenBalance(token?.address);
  const { price: tokenPrice } = useTokenPrice(token?.extensions.coingeckoId);
  
  const usdValue = token && amount && parseFloat(amount) > 0 
    ? formatCurrency(parseFloat(amount) * (tokenPrice || 0))
    : '$0';

  return (
    <View style={styles.swapBoxContainer}>
      <View style={styles.swapBoxHeader}>
        <Text style={styles.swapBoxLabel}>{labelText}</Text>
        {showBalance && token && (
          <Text style={styles.balanceText}>
            {tokenBalance.toFixed(token.decimalsShown)} {token.symbol}
          </Text>
        )}
      </View>
      
      <View style={styles.swapBoxContent}>
        {/* Left side - Token selector */}
        <TouchableOpacity onPress={onTokenPress} style={styles.tokenSelectorInBox}>
          {token ? (
            <View style={styles.tokenDisplay}>
              <TokenLogo logoURI={token.logoURI} size={24} style={styles.tokenLogo} />
              <Text style={styles.tokenSymbolText}>{token.symbol}</Text>
            </View>
          ) : (
            <Text style={styles.tokenPlaceholderText}>Select</Text>
          )}
          <ChevronDown color={colors.textSecondary} size={16} />
        </TouchableOpacity>
        
        {/* Right side - Amount input/output */}
        <View style={styles.amountSection}>
          {isInput ? (
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={onAmountChange}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              textAlign="right"
            />
          ) : (
            <Text style={styles.amountOutput}>
              {amount || '0'}
            </Text>
          )}
          <Text style={styles.usdValue}>{usdValue}</Text>
        </View>
      </View>
    </View>
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
        {/* From Token Box */}
        <SwapBox
          labelText="From"
          token={fromToken}
          onTokenPress={() => router.push({
            pathname: '/token/select',
            params: {
              excludeAddress: toToken?.address,
              selectedAddress: fromToken?.address,
              returnParam: 'fromToken'
            }
          })}
          amount={fromAmount}
          onAmountChange={setFromAmount}
          isInput={true}
          showBalance={true}
        />

        {/* Swap Button */}
        <View style={styles.swapButtonContainer}>
          <TouchableOpacity style={styles.swapButton} onPress={handleSwapTokens}>
            <ArrowDownUp color={colors.white} size={16} />
          </TouchableOpacity>
        </View>

        {/* To Token Box */}
        <SwapBox
          labelText="To"
          token={toToken}
          onTokenPress={() => router.push({
            pathname: '/token/select',
            params: {
              excludeAddress: fromToken?.address,
              selectedAddress: toToken?.address,
              returnParam: 'toToken'
            }
          })}
          amount={toAmount}
          isInput={false}
          showBalance={false}
        />

        {/* Comment out the original AmountInput component */}
        {/* <AmountInput
          address={fromToken?.address}
          amount={fromAmount}
          setAmount={setFromAmount}
        /> */}

        {/* Comment out the "You Receive" text since it's now in the To box */}
        {/* {toToken && (
          <Text style={[
            styles.receiveAmountText,
            effectiveToAmountIsZero && { opacity: styles.label.opacity }
          ]}>
            Receive: {receiveAmountDisplay} {toToken.symbol}
          </Text>
        )} */}

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

      {/* Trade Button - Now sticky to bottom */}
      <View style={styles.stickyButtonContainer}>
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
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Add space for the sticky button
  },
  // Sticky button container
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundDark,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34, // Match the SeedPhraseVerificationStep padding
  },
  // New SwapBox styles
  swapBoxContainer: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 16,
    marginBottom: 4, // Reduced from 8 to make boxes almost touching
  },
  swapBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  swapBoxLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  swapBoxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenSelectorInBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
  },
  amountSection: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  amountInput: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    textAlign: 'right',
    minWidth: 80,
  },
  amountOutput: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    textAlign: 'right',
    minWidth: 80,
  },
  usdValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 4,
  },
  // Keep existing styles
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
    fontSize: 16,
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
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  swapButtonContainer: {
    alignItems: 'center',
    marginVertical: -18, // Increased negative margin to overlap more
    zIndex: 1, // Ensure button appears above the boxes
  },
  swapButton: {
    width: 36, // Reduced from 48
    height: 36, // Reduced from 48
    borderRadius: 18, // Half of width/height
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2, // Increased border width
    borderColor: colors.backgroundDark, // Use a darker border to make it stand out
    // Add shadow for better visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // Android shadow
  },
  balanceText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'right',
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
    marginBottom: 24, // Space for sticky button
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
    height: 54, // Match SeedPhraseVerificationStep height
    borderRadius: 27, // Match SeedPhraseVerificationStep border radius (fully rounded)
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: '100%', // Match SeedPhraseVerificationStep width
    height: '100%', // Match SeedPhraseVerificationStep height
    gap: 8, // Match SeedPhraseVerificationStep gap
  },
  tradeExecuteButtonText: {
    fontSize: 17, // Match SeedPhraseVerificationStep font size
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    // Remove marginLeft since we're using gap in the gradient container
  },
});