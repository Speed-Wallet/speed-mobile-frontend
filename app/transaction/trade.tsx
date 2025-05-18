import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, ArrowDown, ArrowRightLeft } from 'lucide-react-native';
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

export default function TradeScreen() {
  const { tokenAddress } = useLocalSearchParams();
  const router = useRouter();
  const [fromToken, setFromToken] = useState<EnrichedTokenEntry | null>(null);
  const [toToken, setToToken] = useState<EnrichedTokenEntry | null>(null);
  const [tokenList, setTokenList] = useState<EnrichedTokenEntry[]>([]);
  const [fromAmount, setFromAmount] = useState('');
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [selectedPercentage, setSelectedPercentage] = useState('25'); // Add selected percentage state
  const toAmountRef = useRef<any>(null);
  const toAmountFiatRef = useRef<any>(null);
  let toAmount: number | null = null;
  let quote: any;

  function setToAmount(amount: number | null) {
    toAmount = amount;

    if (!toAmountRef.current || !toAmountFiatRef.current) return;

    let text: string, fiat: string;

    if (amount === null) {
      text = '...';
      fiat = '$0.00';
    } else {
      text = amount.toFixed(toToken!.decimals);
      fiat = formatCurrency(amount * toToken!.price);
    }

    if (Platform.OS === 'web') {
      toAmountRef.current.textContent = text;
      toAmountFiatRef.current.textContent = fiat;
    } else {
      toAmountRef.current.setNativeProps({ text });
      toAmountFiatRef.current.setNativeProps({text: fiat});
    }
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

    setToAmount(null);
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
      !isNaN(outAmount) && setToAmount(outAmount * 10 ** -toToken!.decimals);

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
  
  // Add effect to automatically apply 25% amount when fromToken is set
  useEffect(() => {
    if (fromToken && !fromAmount) {
      handlePercentageSelect('25');
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
    
    setSelectedPercentage(percentage); // Set selected percentage
    
    if (percentage === 'MAX') {
      setFromAmount(fromToken.balance.toString());
    } else {
      const percent = parseInt(percentage);
      setFromAmount((fromToken.balance * percent / 100).toFixed(fromToken.decimals));
    }
  };

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);

    // Reset selected percentage when tokens are swapped
    setSelectedPercentage('25');
  };

  const handleTrade = async () => {
    const amount= parseFloat(fromAmount);

    if (isNaN(amount)) {
      alert('Invalid amount');
    } else if (amount > fromToken!.balance) {
      alert('Insufficient balance');
    } else if (!quote) {
      alert('Quote is not available');
    } else {
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
        await jupiterSwap(quote);
      } catch (err) {
        console.error(err);
        alert('Error trading tokens');
      }
    }

    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton style={styles.closeButton} />
        <Text style={styles.headerTitle}>Trade</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {fromToken && toToken && (
          <>
            {/* From Token */}
            <Animated.View entering={FadeIn.delay(100)}>
              <View style={styles.tokenCard}>
                <TouchableOpacity
                  style={styles.tokenSelectorButton}
                  onPress={() => setShowFromSelector(true)}
                >
                  <Text style={styles.tokenSymbol}>{fromToken.symbol}</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  value={fromAmount}
                  onChangeText={setFromAmount}
                />

                <Text style={styles.balanceText}>
                  Balance: {fromToken.balance} {fromToken.symbol}
                </Text>

                <Text style={styles.fiatValue}>
                  {fromAmount ? formatCurrency(parseFloat(fromAmount) * fromToken.price) : '$0.00'}
                </Text>

                <View style={styles.percentages}>
                  <TouchableOpacity
                    style={[
                      styles.percentageButton,
                      selectedPercentage === '25' && styles.selectedPercentageButton
                    ]}
                    onPress={() => handlePercentageSelect('25')}
                  >
                    <Text style={[
                      styles.percentageText,
                      selectedPercentage === '25' && styles.selectedPercentageText
                    ]}>25%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.percentageButton,
                      selectedPercentage === '50' && styles.selectedPercentageButton
                    ]}
                    onPress={() => handlePercentageSelect('50')}
                  >
                    <Text style={[
                      styles.percentageText,
                      selectedPercentage === '50' && styles.selectedPercentageText
                    ]}>50%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.percentageButton,
                      selectedPercentage === '75' && styles.selectedPercentageButton
                    ]}
                    onPress={() => handlePercentageSelect('75')}
                  >
                    <Text style={[
                      styles.percentageText,
                      selectedPercentage === '75' && styles.selectedPercentageText
                    ]}>75%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.percentageButton,
                      styles.maxButton,
                      selectedPercentage === 'MAX' && styles.selectedPercentageButton
                    ]}
                    onPress={() => handlePercentageSelect('MAX')}
                  >
                    <Text style={[
                      styles.percentageText,
                      selectedPercentage === 'MAX' && styles.selectedPercentageText
                    ]}>MAX</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Swap Button */}
            <TouchableOpacity
              style={styles.swapButton}
              onPress={handleSwapTokens}
            >
              <ArrowDown size={20} color={colors.primary} />
            </TouchableOpacity>

            {/* To Token */}
            <Animated.View entering={FadeIn.delay(200)}>
              <View style={styles.tokenCard}>
                <TouchableOpacity
                  style={styles.tokenSelectorButton}
                  onPress={() => setShowToSelector(true)}
                >
                  <Text style={styles.tokenSymbol}>{toToken.symbol}</Text>
                </TouchableOpacity>

                <Text ref={toAmountRef} style={styles.amountText}>...</Text>

                <Text style={styles.balanceText}>
                  Balance: {toToken.balance} {toToken.symbol}
                </Text>

                <Text ref={toAmountFiatRef} style={styles.fiatValue}>$0.00</Text>
              </View>
            </Animated.View>
          </>
        )}
      </View>

      {/* Trade Button */}
      <Animated.View
        entering={SlideInUp.duration(300)}
        style={styles.bottomContainer}
      >
        <TouchableOpacity
          style={[
            styles.tradeButton,
            (!fromAmount || parseFloat(fromAmount) <= 0) && styles.tradeButtonDisabled
          ]}
          disabled={!fromAmount || parseFloat(fromAmount) <= 0}
          onPress={handleTrade}
        >
          <ArrowRightLeft size={20} color={colors.white} />
          <Text style={styles.tradeButtonText}>Trade</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Token Selectors */}
      {showFromSelector && (
        <TokenSelector
          tokenList={tokenList}
          selectedToken={fromToken}
          excludeTokenId={toToken?.address}
          onSelectToken={(token) => {
            setFromToken(token);
            setShowFromSelector(false);
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
          }}
          onClose={() => setShowToSelector(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.backgroundDark,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 16,
  },
  tokenCard: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 16,
  },
  tokenSelectorButton: {
    backgroundColor: colors.backgroundLight,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  tokenSymbol: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  amountInput: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    padding: 0,
    marginBottom: 8,
  },
  amountText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fiatValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  percentages: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  percentageButton: {
    backgroundColor: colors.backgroundLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  selectedPercentageButton: {
    backgroundColor: colors.primary,
  },
  percentageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  selectedPercentageText: {
    color: colors.white,
  },
  maxButton: {
    // backgroundColor: colors.primary + '20',
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 16,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundMedium,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  tradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 56,
  },
  tradeButtonDisabled: {
    backgroundColor: colors.backgroundLight,
    opacity: 0.7,
  },
  tradeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    marginLeft: 8,
  },
});