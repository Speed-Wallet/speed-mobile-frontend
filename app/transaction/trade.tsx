import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, StatusBar, ScrollView, Image } from 'react-native'; // Removed Dimensions
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowDownUp, ArrowRightLeft } from 'lucide-react-native'; // Changed ArrowUpDown to ArrowDownUp
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import { getAllTokenInfo, getTokenByAddress } from '@/data/tokens';
import TokenSelector from '@/components/TokenSelector';
import { EnrichedTokenEntry } from '@/data/types';
import { JupiterQuote, jupiterSwap } from '@/services/walletService';
import BackButton from '@/components/BackButton';

const WAIT_ON_AMOUNT_CHANGE = 2000;
const LOOP_QUOTE_INTERVAL = 10000;
let lastQuoteTime = 0;
let timeoutID: NodeJS.Timeout | undefined;
let intervalID: NodeJS.Timeout | undefined;
let quote: any;

export default function TradeScreen() {
  const { tokenAddress } = useLocalSearchParams();
  const router = useRouter();
  const [fromToken, setFromToken] = useState<EnrichedTokenEntry | null>(null);
  const [toToken, setToToken] = useState<EnrichedTokenEntry | null>(null);
  const [tokenList, setTokenList] = useState<EnrichedTokenEntry[]>([]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [selectedPercentage, setSelectedPercentage] = useState('25'); // Add selected percentage state

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
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount === 0) return;

    const diff = Date.now() - lastQuoteTime;

    if (diff < WAIT_ON_AMOUNT_CHANGE) {
      timeoutID = setTimeout(updateAmounts, WAIT_ON_AMOUNT_CHANGE - diff);
      return;
    }

    lastQuoteTime = Date.now();
    fetchAndApplyQuote(amount);
  }

  async function fetchAndApplyQuote(amount: number) {
    try {
      quote = await JupiterQuote(
        fromToken!.address, 
        toToken!.address, 
        amount * 10 ** fromToken!.decimals
      );

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
        intervalID = setInterval(fetchAndApplyQuote, LOOP_QUOTE_INTERVAL, amount);
      }
    } catch (err: any) {
      console.error(err.message);
      alert('Network error, unable to establish connection');
    }
  }
  
  useEffect(updateAmounts, [fromAmount]);
  useEffect(() => loadData(), [tokenAddress]);
  
  useEffect(() => {
    if (fromToken && !fromAmount) {
      // handlePercentageSelect('25');
    }
  }, [fromToken]);

  if (Array.isArray(tokenAddress)) {
    throw new Error('tokenAddress should not be an array');
  }

  const loadData = () => {
    const tokens = getAllTokenInfo();
    setTokenList(tokens);

    if (tokenAddress) {
      const token = getTokenByAddress(tokenAddress);
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

  const handlePercentageSelect = (percentage: string) => {
    if (!fromToken) return;
    
    setSelectedPercentage(percentage);
    
    if (percentage === 'MAX') {
      setFromAmount(fromToken.balance.toString());
    } else {
      const percent = parseInt(percentage);
      setFromAmount((fromToken.balance * percent / 100).toFixed(fromToken.decimals));
    }
  };

  const handleSwapTokens = () => {
    const tempFromToken = fromToken;
    const tempToToken = toToken;
    const tempFromAmount = fromAmount;
    const tempToAmount = toAmount;

    setFromToken(tempToToken);
    setToToken(tempFromToken);
    
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
    // Manually trigger quote update if fromAmount has a value
    if (fromAmount && parseFloat(fromAmount) > 0) {
        // updateAmounts(); // This might be called by useEffect on fromAmount already
    }
  };

  const handleTrade = async () => {
    const amount= parseFloat(fromAmount);

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
    
    // alert(`Trading ${fromAmount} ${fromToken?.symbol} for ${toAmount} ${toToken?.symbol}`);

    if (timeoutID !== undefined) {
      clearTimeout(timeoutID);
      timeoutID = undefined;
    }
    if (intervalID !== undefined) {
      clearInterval(intervalID);
      intervalID = undefined;
    }
  
    try {
      await jupiterSwap(quote);
      alert('Trade Successful!'); // Provide feedback
      router.back();
    } catch (err: any) {
      console.error(err);
      alert(`Error trading tokens: ${err.message || 'Unknown error'}`);
    }
  };

  // Calculate exchange rate and receive amount for display
  const exchangeRate = (quote && toToken && fromToken && parseFloat(fromAmount) > 0) 
    ? (parseFloat(quote.outAmount) / (10**toToken.decimals)) / parseFloat(fromAmount) 
    : null;
  const receiveAmountDisplay = toAmount ? parseFloat(toAmount).toFixed(toToken?.decimalsShown || 2) : '0.00'; // Use decimalsShown (now mandatory), fallback to 2 if toToken is null for some reason during initial render.
  const totalValueDisplay = (fromAmount && fromToken && parseFloat(fromAmount) > 0) 
    ? formatCurrency(parseFloat(fromAmount) * fromToken.price) 
    : '$0.00';


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <BackButton style={styles.backButton} />
        {/* The title "Trade" from the original header is removed to match the new design's "Swap Tokens" title below */}
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Swap Tokens</Text>
        
        {/* From Token */}
        <Text style={styles.label}>From</Text>
        <TouchableOpacity onPress={() => setShowFromSelector(true)} style={styles.tokenSelectorContainer}>
          {fromToken ? (
            <View style={styles.tokenDisplay}>
              <Image source={{ uri: fromToken.logoURI }} style={styles.tokenIcon} />
              <Text style={styles.tokenNameText}>{fromToken.name}</Text>
            </View>
          ) : (
            <Text style={styles.tokenPlaceholderText}>Select Token</Text>
          )}
          <ArrowDownUp color={colors.textSecondary} size={16} />
        </TouchableOpacity>

        {/* Swap Button */}
        <View style={styles.swapButtonContainer}>
          <TouchableOpacity style={styles.swapButton} onPress={handleSwapTokens}>
            <ArrowDownUp color={colors.white} size={20} />
          </TouchableOpacity>
        </View>

        {/* To Token */}
        <Text style={styles.label}>To</Text>
        <TouchableOpacity onPress={() => setShowToSelector(true)} style={styles.tokenSelectorContainer}>
          {toToken ? (
            <View style={styles.tokenDisplay}>
              <Image source={{ uri: toToken.logoURI }} style={styles.tokenIcon} />
              <Text style={styles.tokenNameText}>{toToken.name}</Text>
            </View>
          ) : (
            <Text style={styles.tokenPlaceholderText}>Select Token</Text>
          )}
          <ArrowDownUp color={colors.textSecondary} size={16} />
        </TouchableOpacity>
        
        {/* Amount Input */}
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountInputSection}>
          <View style={styles.amountInputRow}>
            {fromToken && <Image source={{ uri: fromToken.logoURI }} style={styles.amountTokenIcon} />}
            <TextInput
              style={styles.amountTextInput}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={fromAmount}
              onChangeText={setFromAmount}
            />
          </View>
          {fromToken && (
            <Text style={styles.balanceText}>
              Max: {fromToken.balance.toFixed(4)} {fromToken.symbol}
            </Text>
          )}
          {/* <View style={styles.percentagesRow}>
            {['25', '50', '75', 'MAX'].map((perc) => (
              <TouchableOpacity
                key={perc}
                style={[
                  styles.percentageChip,
                  selectedPercentage === perc && styles.selectedPercentageChip,
                ]}
                onPress={() => handlePercentageSelect(perc)}
              >
                <Text style={[
                  styles.percentageChipText,
                  selectedPercentage === perc && styles.selectedPercentageChipText,
                ]}>{perc}{perc !== 'MAX' ? '%' : ''}</Text>
              </TouchableOpacity>
            ))}
          </View> */}
        </View>

        {/* Exchange Info */}
        {fromToken && toToken && (
          <View style={styles.exchangeInfoCard}>
            <View style={styles.exchangeInfoRow}>
              <Text style={styles.exchangeInfoLabel}>Rate:</Text>
              <Text style={styles.exchangeInfoValue}>
                {exchangeRate ? `1 ${fromToken.symbol} ≈ ${exchangeRate.toFixed(toToken.decimalsShown)} ${toToken.symbol}` : 'N/A'} 
              </Text>
            </View>
            <View style={styles.exchangeInfoRow}>
              <Text style={styles.exchangeInfoLabel}>You Receive:</Text>
              <Text style={styles.exchangeInfoValue}>{receiveAmountDisplay} {toToken.symbol}</Text>
            </View>
            <View style={styles.exchangeInfoRow}>
              <Text style={styles.exchangeInfoLabel}>Total Value:</Text>
              <Text style={styles.exchangeInfoValue}>{totalValueDisplay}</Text>
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
        
        {/* Trade Button */}
        <TouchableOpacity
          style={[
            styles.tradeExecuteButton,
            (!fromAmount || parseFloat(fromAmount) <= 0 || !quote || !!quote.errorCode) && styles.tradeExecuteButtonDisabled,
          ]}
          disabled={!fromAmount || parseFloat(fromAmount) <= 0 || !quote || !!quote.errorCode}
          onPress={handleTrade}
        >
          <ArrowRightLeft size={20} color={colors.white} />
          <Text style={styles.tradeExecuteButtonText}>Swap Tokens</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Token Selectors Modals (existing logic) */}
      {showFromSelector && (
        <TokenSelector
          tokenList={tokenList}
          selectedToken={fromToken}
          excludeTokenId={toToken?.address}
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
          tokenList={tokenList}
          selectedToken={toToken}
          excludeTokenId={fromToken?.address}
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
    paddingHorizontal: 16,
    paddingTop: 10, // Adjust as needed for status bar
    // backgroundColor: '#141828', // Match SafeAreaView
    position: 'absolute', // To overlay on ScrollView if needed, or keep it static
    top: StatusBar.currentHeight, // Position below status bar
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    // Style for back button, e.g., position if it's part of an overlay header
    // For now, assuming it's a simple button at the start of the header flow
    padding: 8, // Make it easier to press
    borderRadius: 16,
    backgroundColor: colors.backgroundMedium, // Or a color that fits the new theme
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 60, // Space for the absolute positioned header
    paddingHorizontal: 20,
    paddingBottom: 30, // Space for the trade button
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold', // Using existing font family
    color: colors.white,
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary, // Lighter text for labels
    marginBottom: 8,
    // opacity: 0.8, // From example
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
  swapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight, // Slightly lighter than card, or primary color
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.backgroundMedium,
  },
  amountInputSection: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Space for balance text below
  },
  amountTokenIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 12,
  },
  amountTextInput: {
    fontSize: 20, 
    fontFamily: 'Inter-Bold',
    color: colors.white,
    flex: 1, 
    paddingVertical: 0,
    outlineStyle: 'none', // Remove outline on focus
  },
  balanceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'left',
    marginTop: 4,
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
    marginBottom: 24,
  },
  exchangeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exchangeInfoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  exchangeInfoValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    textAlign: 'right',
  },
  exchangeInfoValueMini: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'right',
    flexShrink: 1,
  },
  tradeExecuteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16, // Added padding
  },
  tradeExecuteButtonDisabled: {
    backgroundColor: colors.backgroundLight, // Use a disabled color from your theme
    opacity: 0.6,
  },
  tradeExecuteButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    marginLeft: 10,
  },
});