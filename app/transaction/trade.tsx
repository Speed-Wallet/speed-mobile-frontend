import { useState, useEffect, useRef, useMemo } from 'react'; // Added useMemo
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, StatusBar, ScrollView, Image, Animated } from 'react-native'; // Removed Dimensions, Added Animated
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowDownUp, ArrowRightLeft, DollarSign, Lock, ChevronDown } from 'lucide-react-native'; // Changed ArrowUpDown to ArrowDownUp, Added Lock, Added ChevronDown
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import { getAllTokenInfo, getTokenByAddress } from '@/data/tokens';
import TokenSelector from '@/components/TokenSelector';
import AmountInput from '@/components/AmountInput'; // Added import
import { EnrichedTokenEntry } from '@/data/types';
import { PLATFORM_FEE_RATE, JupiterQuote, jupiterSwap } from '@/services/walletService';
import BackButton from '@/components/BackButton';
import { useTokenValue } from '@/hooks/useTokenValue';
import { useTokenPrice } from '@/hooks/useTokenPrice';

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
            <Image source={{ uri: token.logoURI }} style={styles.tokenIcon} />
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
  const { tokenAddress } = useLocalSearchParams(); // TODO change array
  const router = useRouter();
  const [fromToken, setFromToken] = useState<EnrichedTokenEntry | null>(null);
  const [toToken, setToToken] = useState<EnrichedTokenEntry | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  // const [selectedPercentage, setSelectedPercentage] = useState('25'); // Add selected percentage state

  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const { data: fromTokenPrice } = useTokenPrice(fromToken?.extensions.coingeckoId);

  function triggerShake() {
    shakeAnimationValue.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimationValue, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimationValue, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimationValue, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimationValue, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

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

  useEffect(() => {
    if (fromToken && !fromAmount) {
      // handlePercentageSelect('25');
    }
  }, [fromToken]);

  if (Array.isArray(tokenAddress)) {
    throw new Error('tokenAddress should not be an array');
  }



  const handlePercentageSelect = (percentage: string) => {
    if (!fromToken) return;

    // setSelectedPercentage(percentage);

    if (percentage === 'MAX') {
      setFromAmount(fromToken.balance.toString());
    } else {
      const percent = parseInt(percentage);
      setFromAmount((fromToken.balance * percent / 100).toFixed(fromToken.decimals));
    }
  };

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
    if (amount > fromToken.balance) {
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
    ? formatCurrency(parseFloat(fromAmount) * fromTokenPrice)
    : '$0.00';

  const isButtonDisabled = !fromAmount || parseFloat(fromAmount) <= 0 || !quote || !!quote.errorCode;

  const handleTradeAttempt = () => {
    if (isButtonDisabled) {
      triggerShake();
    } else {
      handleTrade();
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <BackButton style={styles.backButton} onPress={() => router.push('/')} />
        <Text style={styles.title}>Swap Tokens</Text>
        <View style={{ width: (styles.backButton.padding * 2) + 20 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* From Token */}
        <TokenSelectorDisplay
          labelText="From"
          token={fromToken}
          onPress={() => setShowFromSelector(true)}
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
          onPress={() => setShowToSelector(true)}
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

      {/* Token Selectors Modals (existing logic) */}
      {showFromSelector && (
        <TokenSelector
          selectedToken={fromToken}
          excludeTokenAddress={toToken?.address}
          onSelectToken={(token) => {
            setFromToken(token);
            setShowFromSelector(false);
            // Reset fromAmount if token changes, or let user decide
            // setFromAmount(''); 
            // setToAmount('');
          }}
          onClose={() => setShowFromSelector(false)}
        />
      )}

      {showToSelector && (
        <TokenSelector
          selectedToken={toToken}
          excludeTokenAddress={fromToken?.address}
          onSelectToken={(token) => {
            setToToken(token);
            setShowToSelector(false);
            // setToAmount(''); // Quote will be re-fetched
          }}
          onClose={() => setShowToSelector(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundDark, // Dark background from example
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Distribute space
    paddingHorizontal: 16,
    paddingTop: 10, // Adjust as needed for status bar
    position: 'absolute', // To overlay on ScrollView if needed, or keep it static
    top: StatusBar.currentHeight, // Position below status bar
    left: 0,
    right: 0,
    zIndex: 10,
    height: 50, // Give header a fixed height
    backgroundColor: colors.backgroundDark, // Match the background color
  },
  backButton: {
    // Style for back button, e.g., position if it's part of an overlay header
    // For now, assuming it's a simple button at the start of the header flow
    padding: 8, // Make it easier to press
    borderRadius: 16,
    backgroundColor: colors.backgroundMedium, // Or a color that fits the new theme
    // Add a specific width if needed for the spacer, e.g., width: 30 + (padding * 2)
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 70, // Adjusted space for the fixed header (header height + some margin)
    paddingHorizontal: 20,
    paddingBottom: 30, // Space for the trade button
  },
  title: {
    fontSize: 20, // Slightly smaller to fit header
    fontFamily: 'Inter-SemiBold', // Using existing font family
    color: colors.white,
    // marginBottom: 24, // Removed, no longer needed here
    // textAlign: 'center', // Centering is handled by header's justifyContent or flex properties
    flex: 1, // Allow title to take available space and center itself
    textAlign: 'center', // Ensure text is centered within its flex container
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
  tokenIcon: { // Add if you have icons
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 12,
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