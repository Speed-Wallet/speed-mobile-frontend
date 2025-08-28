import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowDownUp,
  DollarSign,
  Lock,
  ChevronDown,
  Zap,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from '@/components/Toast';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import { getAllTokenInfo, getTokenByAddress } from '@/data/tokens';
// import AmountInput from '@/components/AmountInput'; // Commented out since we're using SwapBox now
import TokenLogo from '@/components/TokenLogo'; // Added import
import { EnrichedTokenEntry } from '@/data/types';
import {
  JupiterQuote,
  prepareJupiterSwapTransaction,
  confirmJupiterSwap,
  type PreparedJupiterSwap,
} from '@/services/walletService';
import { useConfig } from '@/hooks/useConfig';
import ScreenHeader from '@/components/ScreenHeader';
import ScreenContainer from '@/components/ScreenContainer';
import { useTokenValue } from '@/hooks/useTokenValue';
import { useTokenPrice } from '@/hooks/useTokenPrices';
import { triggerShake } from '@/utils/animations';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useQueryClient } from '@tanstack/react-query';

const WAIT_ON_AMOUNT_CHANGE = 2000;
const LOOP_QUOTE_INTERVAL = 300000;
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
  onInputFocus?: () => void;
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
}) => {
  const { balance: tokenBalance } = useTokenBalance(token?.address);
  const { price: tokenPrice } = useTokenPrice(token?.extensions.coingeckoId);

  const usdValue =
    token && amount && parseFloat(amount) > 0
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
        <TouchableOpacity
          onPress={onTokenPress}
          style={styles.tokenSelectorInBox}
        >
          {token ? (
            <View style={styles.tokenDisplay}>
              <TokenLogo
                logoURI={token.logoURI}
                size={24}
                style={styles.tokenLogo}
              />
              <Text style={styles.tokenSymbolText}>{token.symbol}</Text>
            </View>
          ) : (
            <Text style={styles.tokenPlaceholderText}>Select</Text>
          )}
          <ChevronDown color={colors.textSecondary} size={16} />
        </TouchableOpacity>

        {/* Right side - Amount input/output */}
        <View style={styles.amountSection}>
          <TouchableOpacity
            onPress={onInputFocus}
            style={styles.amountInputTouchable}
          >
            <Text
              style={[
                isInput ? styles.amountInput : styles.amountOutput,
                !amount && styles.amountPlaceholder,
              ]}
            >
              {amount || '0'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.usdValue}>{usdValue}</Text>
        </View>
      </View>
    </View>
  );
};

export default function TradeScreen() {
  const { tokenAddress, selectedTokenAddress, returnParam } =
    useLocalSearchParams<{
      tokenAddress?: string;
      selectedTokenAddress?: string;
      returnParam?: string;
    }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [fromToken, setFromToken] = useState<EnrichedTokenEntry | null>(null);
  const [toToken, setToToken] = useState<EnrichedTokenEntry | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const bottomSheetRef = useRef<BottomSheet>(null);
  const loadingBottomSheetRef = useRef<BottomSheet>(null);

  const { price: fromTokenPrice } = useTokenPrice(
    fromToken?.extensions.coingeckoId,
  );
  const { balance: fromTokenBalance } = useTokenBalance(fromToken?.address);

  // Get config values - this is critical data that must be loaded
  const {
    data: config,
    isLoading: isConfigLoading,
    error: configError,
  } = useConfig();
  const swapFeeRate = config?.swapFeeRate;

  // Toast state for validation errors and network issues
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>(
    'error',
  );

  // Loading state for swap
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapComplete, setSwapComplete] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [swapTxSignature, setSwapTxSignature] = useState<string>('');

  // New state for prepared swap workflow
  const [preparedSwap, setPreparedSwap] = useState<PreparedJupiterSwap | null>(
    null,
  );
  const [isPreparingSwap, setIsPreparingSwap] = useState(false);
  const [isConfirmingSwap, setIsConfirmingSwap] = useState(false);

  // Custom keyboard state
  const [showCustomKeyboard, setShowCustomKeyboard] = useState(true);
  const [activeInput, setActiveInput] = useState<'from' | 'to' | null>(null);

  function updateAmounts() {
    // Only proceed if config is loaded and swapFeeRate is available
    if (!swapFeeRate) {
      console.log('Config not loaded yet, skipping updateAmounts');
      return;
    }

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
    platformFee = Math.round(amount * swapFeeRate);
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
      quote = await JupiterQuote(
        fromToken!.address,
        toToken!.address,
        inAmount,
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
      console.log(
        `Quote received: ${quote.inAmount} -> ${quote.outAmount} (${quote.slippageBps})`,
      );
      if (!isNaN(outAmount)) {
        const val = outAmount * 10 ** -toToken!.decimals;
        setToAmount(val.toFixed(toToken!.decimalsShown)); // Use decimalsShown (now mandatory)
      }

      if (!intervalID) {
        intervalID = setInterval(
          fetchAndApplyQuote,
          LOOP_QUOTE_INTERVAL,
          inAmount,
        );
      }
    } catch (err: any) {
      console.error(err.message);
      setToastMessage('Network error, unable to establish connection');
      setToastType('error');
      setShowToast(true);
    }
  }

  // Function for inverse calculation when user types in "to" field
  function updateInverseAmounts() {
    // Only proceed if config is loaded and swapFeeRate is available
    if (
      !swapFeeRate ||
      !fromToken ||
      !toToken ||
      !toAmount ||
      parseFloat(toAmount) === 0
    ) {
      setFromAmount('');
      return;
    }

    if (timeoutID !== undefined) {
      clearTimeout(timeoutID);
      timeoutID = undefined;
    }

    if (intervalID !== undefined) {
      clearInterval(intervalID);
      intervalID = undefined;
    }

    const toAmountEntered = parseFloat(toAmount);
    if (isNaN(toAmountEntered) || toAmountEntered === 0) {
      setFromAmount('');
      return;
    }

    // For inverse calculation, we estimate the from amount
    // This is approximate since we don't have reverse quotes from Jupiter
    const estimatedFromAmount = toAmountEntered * 1.01; // Add small buffer for slippage
    setFromAmount(estimatedFromAmount.toString());
  }

  useEffect(updateAmounts, [fromAmount, fromToken, toToken, swapFeeRate]);
  useEffect(() => {
    // Only run inverse calculation when actively typing in "to" field
    if (activeInput === 'to') {
      updateInverseAmounts();
    }
  }, [toAmount, fromToken, toToken, swapFeeRate, activeInput]);

  // Handle token selection from the token selector page
  useEffect(() => {
    if (selectedTokenAddress && returnParam) {
      const tokens = getAllTokenInfo();
      const selectedToken = tokens.find(
        (token) => token.address === selectedTokenAddress,
      );

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
        returnParam: undefined,
      });
    }
  }, [selectedTokenAddress, returnParam]);

  useEffect(() => {
    const loadData = () => {
      const tokens = getAllTokenInfo();

      if (tokenAddress) {
        const token = getTokenByAddress(tokenAddress as string);
        setFromToken(token);

        const defaultTo = tokens.find((t) => t.address !== token.address);
        if (defaultTo) {
          setToToken(defaultTo);
        }
      } else if (tokens.length > 1) {
        setFromToken(tokens[0]);
        setToToken(tokens[1]);
      }
    };
    loadData();
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

  const handlePreviewSwap = async () => {
    const amount = parseFloat(fromAmount);

    if (isNaN(amount) || amount <= 0) {
      setToastMessage('Please enter a valid amount');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (!fromToken || !toToken) {
      setToastMessage('Please select both tokens.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (amount > fromTokenBalance) {
      setToastMessage("You don't have enough tokens for this trade");
      setToastType('error');
      setShowToast(true);
      return;
    }
    if (!quote || quote.errorCode) {
      setToastMessage('Quote is not available or invalid. Please try again.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (timeoutID !== undefined) {
      clearTimeout(timeoutID);
      timeoutID = undefined;
    }
    if (intervalID !== undefined) {
      clearInterval(intervalID);
      intervalID = undefined;
    }

    // Open the bottom sheet immediately
    bottomSheetRef.current?.expand();

    // Start preparing the swap in the background
    setIsPreparingSwap(true);
    setPreparedSwap(null);

    try {
      const prepared = await prepareJupiterSwapTransaction(quote, platformFee);
      setPreparedSwap(prepared);
      console.log('Swap prepared successfully');
    } catch (err: any) {
      console.error('Failed to prepare swap:', err);
      setToastMessage('Failed to prepare swap. Please try again.');
      setToastType('error');
      setShowToast(true);
      bottomSheetRef.current?.close();
    } finally {
      setIsPreparingSwap(false);
    }
  };

  const handleConfirmSwap = async () => {
    if (!preparedSwap) {
      setToastMessage('Swap not prepared. Please try again.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    // Close the preview bottom sheet and show loading sheet
    bottomSheetRef.current?.close();
    setIsConfirmingSwap(true);
    setIsSwapping(true);
    setSwapComplete(false);
    setSwapSuccess(false);
    setSwapTxSignature('');
    loadingBottomSheetRef.current?.expand();

    try {
      const sig = await confirmJupiterSwap(preparedSwap);
      console.log(`Trade Successful: ${sig}`);

      // Update loading states - success handled by bottom sheet
      setSwapSuccess(true);
      setSwapTxSignature(sig);
      setSwapComplete(true);
      setIsSwapping(false);
      setIsConfirmingSwap(false);

      // Clear the input amount and prepared swap after successful trade
      setFromAmount('');
      setToAmount('');
      setPreparedSwap(null);
    } catch (err: any) {
      console.error(err);
      // Error handled by bottom sheet
      setIsSwapping(false);
      setIsConfirmingSwap(false);
      setSwapComplete(true);
      setSwapSuccess(false);
    }
  };

  // Calculate exchange rate and receive amount for display
  const exchangeRate =
    quote && toToken && fromToken && parseFloat(fromAmount) > 0
      ? parseFloat(quote.outAmount) /
        10 ** toToken.decimals /
        parseFloat(fromAmount)
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

  const totalValueDisplay =
    fromAmount && fromToken && parseFloat(fromAmount) > 0
      ? formatCurrency(parseFloat(fromAmount) * (fromTokenPrice || 0))
      : '$0.00';

  const isButtonDisabled =
    !fromAmount || parseFloat(fromAmount) <= 0 || !quote || !!quote.errorCode;

  const handlePreviewSwapClick = useCallback(() => {
    if (isButtonDisabled) {
      triggerShake(shakeAnimationValue);
    } else {
      handlePreviewSwap();
    }
  }, [isButtonDisabled, shakeAnimationValue]);

  const handleCloseLoadingSheet = useCallback(() => {
    loadingBottomSheetRef.current?.close();
    // Reset all loading states
    setTimeout(() => {
      setIsSwapping(false);
      setSwapComplete(false);
      setSwapSuccess(false);
      setSwapTxSignature('');
      setIsConfirmingSwap(false);
      setPreparedSwap(null);
    }, 300);
  }, []);

  // Custom keyboard handlers
  const handleKeyPress = useCallback(
    (key: string) => {
      if (!activeInput) return;

      if (key === 'backspace') {
        if (activeInput === 'from') {
          setFromAmount((prev) => prev.slice(0, -1));
        } else {
          setToAmount((prev) => prev.slice(0, -1));
        }
      } else if (key === '.') {
        if (activeInput === 'from') {
          if (!fromAmount.includes('.')) {
            setFromAmount((prev) => prev + '.');
          }
        } else {
          if (!toAmount.includes('.')) {
            setToAmount((prev) => prev + '.');
          }
        }
      } else {
        // Number key
        if (activeInput === 'from') {
          setFromAmount((prev) => {
            // Clear to amount when starting to type in from field
            if (prev === '' && key !== '0') {
              setToAmount('');
            }
            // Prevent multiple leading zeros
            if (prev === '0' && key !== '.') return key;
            // No limit on decimal places - allow users to input as many as they want
            return prev + key;
          });
        } else {
          setToAmount((prev) => {
            // Clear from amount when starting to type in to field
            if (prev === '' && key !== '0') {
              setFromAmount('');
            }
            // Prevent multiple leading zeros
            if (prev === '0' && key !== '.') return key;
            // No limit on decimal places - allow users to input as many as they want
            return prev + key;
          });
        }
      }
    },
    [activeInput, fromAmount, toAmount],
  );

  const handleInputFocus = useCallback(() => {
    setActiveInput('from');
  }, []);

  const handleToInputFocus = useCallback(() => {
    setActiveInput('to');
  }, []);

  const handleCloseKeyboard = useCallback(() => {
    setActiveInput(null);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScreenContainer edges={['top', 'bottom']} style={styles.container}>
        <ScreenHeader
          title="Swap Tokens"
          onBack={() => router.push('/' as any)}
        />

        {/* Config Loading/Error States */}
        {isConfigLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : configError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Configuration Error</Text>
            <Text style={styles.loadingSubtitle}>
              Failed to load app configuration. Please check your connection and
              try again.
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                // Invalidate the config query to trigger a refetch
                queryClient.invalidateQueries({ queryKey: ['app-config'] });
              }}
            >
              <Text style={styles.closeButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : swapFeeRate === undefined ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Configuration Missing</Text>
            <Text style={styles.loadingSubtitle}>
              Required configuration data is missing. Please contact support.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.mainContent}>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
              >
                {/* From Token Box */}
                <SwapBox
                  labelText="From"
                  token={fromToken}
                  onTokenPress={() =>
                    router.push({
                      pathname: '/token/select',
                      params: {
                        excludeAddress: toToken?.address,
                        selectedAddress: fromToken?.address,
                        returnParam: 'fromToken',
                      },
                    })
                  }
                  amount={fromAmount}
                  onAmountChange={setFromAmount}
                  onInputFocus={handleInputFocus}
                  isInput={true}
                  showBalance={true}
                />

                {/* Swap Button */}
                <View style={styles.swapButtonContainer}>
                  <TouchableOpacity
                    style={styles.swapButton}
                    onPress={handleSwapTokens}
                  >
                    <ArrowDownUp color={colors.white} size={16} />
                  </TouchableOpacity>
                </View>

                {/* To Token Box */}
                <SwapBox
                  labelText="To"
                  token={toToken}
                  onTokenPress={() =>
                    router.push({
                      pathname: '/token/select',
                      params: {
                        excludeAddress: fromToken?.address,
                        selectedAddress: toToken?.address,
                        returnParam: 'toToken',
                      },
                    })
                  }
                  amount={toAmount}
                  onAmountChange={setToAmount}
                  onInputFocus={handleToInputFocus}
                  isInput={true} // Changed to true to enable input
                  showBalance={false}
                />
              </ScrollView>

              {/* Bottom Section - Keyboard and Button */}
              <View style={styles.bottomSection}>
                {/* Custom Keyboard */}
                {showCustomKeyboard && (
                  <View style={styles.inlineKeyboard}>
                    <View style={styles.keyboardGrid}>
                      <View style={styles.keyboardRow}>
                        <TouchableOpacity
                          style={[
                            styles.keyboardKey,
                            !activeInput && styles.keyboardKeyDisabled,
                          ]}
                          onPress={() => handleKeyPress('1')}
                          disabled={!activeInput}
                        >
                          <Text
                            style={[
                              styles.keyboardKeyText,
                              !activeInput && styles.keyboardKeyTextDisabled,
                            ]}
                          >
                            1
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.keyboardKey,
                            !activeInput && styles.keyboardKeyDisabled,
                          ]}
                          onPress={() => handleKeyPress('2')}
                          disabled={!activeInput}
                        >
                          <Text
                            style={[
                              styles.keyboardKeyText,
                              !activeInput && styles.keyboardKeyTextDisabled,
                            ]}
                          >
                            2
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.keyboardKey,
                            !activeInput && styles.keyboardKeyDisabled,
                          ]}
                          onPress={() => handleKeyPress('3')}
                          disabled={!activeInput}
                        >
                          <Text
                            style={[
                              styles.keyboardKeyText,
                              !activeInput && styles.keyboardKeyTextDisabled,
                            ]}
                          >
                            3
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.keyboardRow}>
                        <TouchableOpacity
                          style={[
                            styles.keyboardKey,
                            !activeInput && styles.keyboardKeyDisabled,
                          ]}
                          onPress={() => handleKeyPress('4')}
                          disabled={!activeInput}
                        >
                          <Text
                            style={[
                              styles.keyboardKeyText,
                              !activeInput && styles.keyboardKeyTextDisabled,
                            ]}
                          >
                            4
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.keyboardKey,
                            !activeInput && styles.keyboardKeyDisabled,
                          ]}
                          onPress={() => handleKeyPress('5')}
                          disabled={!activeInput}
                        >
                          <Text
                            style={[
                              styles.keyboardKeyText,
                              !activeInput && styles.keyboardKeyTextDisabled,
                            ]}
                          >
                            5
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.keyboardKey,
                            !activeInput && styles.keyboardKeyDisabled,
                          ]}
                          onPress={() => handleKeyPress('6')}
                          disabled={!activeInput}
                        >
                          <Text
                            style={[
                              styles.keyboardKeyText,
                              !activeInput && styles.keyboardKeyTextDisabled,
                            ]}
                          >
                            6
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.keyboardRow}>
                        <TouchableOpacity
                          style={[
                            styles.keyboardKey,
                            !activeInput && styles.keyboardKeyDisabled,
                          ]}
                          onPress={() => handleKeyPress('7')}
                          disabled={!activeInput}
                        >
                          <Text
                            style={[
                              styles.keyboardKeyText,
                              !activeInput && styles.keyboardKeyTextDisabled,
                            ]}
                          >
                            7
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.keyboardKey,
                            !activeInput && styles.keyboardKeyDisabled,
                          ]}
                          onPress={() => handleKeyPress('8')}
                          disabled={!activeInput}
                        >
                          <Text
                            style={[
                              styles.keyboardKeyText,
                              !activeInput && styles.keyboardKeyTextDisabled,
                            ]}
                          >
                            8
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.keyboardKey,
                            !activeInput && styles.keyboardKeyDisabled,
                          ]}
                          onPress={() => handleKeyPress('9')}
                          disabled={!activeInput}
                        >
                          <Text
                            style={[
                              styles.keyboardKeyText,
                              !activeInput && styles.keyboardKeyTextDisabled,
                            ]}
                          >
                            9
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.keyboardRow}>
                        <TouchableOpacity
                          style={[
                            styles.keyboardKey,
                            !activeInput && styles.keyboardKeyDisabled,
                          ]}
                          onPress={() => handleKeyPress('.')}
                          disabled={!activeInput}
                        >
                          <Text
                            style={[
                              styles.keyboardKeyText,
                              !activeInput && styles.keyboardKeyTextDisabled,
                            ]}
                          >
                            .
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.keyboardKey,
                            !activeInput && styles.keyboardKeyDisabled,
                          ]}
                          onPress={() => handleKeyPress('0')}
                          disabled={!activeInput}
                        >
                          <Text
                            style={[
                              styles.keyboardKeyText,
                              !activeInput && styles.keyboardKeyTextDisabled,
                            ]}
                          >
                            0
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.keyboardKey,
                            !activeInput && styles.keyboardKeyDisabled,
                          ]}
                          onPress={() => handleKeyPress('backspace')}
                          disabled={!activeInput}
                        >
                          <Text
                            style={[
                              styles.keyboardKeyText,
                              !activeInput && styles.keyboardKeyTextDisabled,
                            ]}
                          >
                            ⌫
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Preview Swap Button */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.tradeExecuteButton}
                  onPress={handlePreviewSwapClick}
                  disabled={isButtonDisabled}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.buttonBackground,
                      {
                        backgroundColor: isButtonDisabled
                          ? colors.backgroundMedium
                          : '#3B82F6',
                      },
                    ]}
                  >
                    <Animated.View
                      style={{
                        transform: [{ translateX: shakeAnimationValue }],
                      }}
                    >
                      {isButtonDisabled ? (
                        <Text
                          style={[
                            styles.tradeExecuteButtonText,
                            styles.tradeExecuteButtonTextDisabled,
                          ]}
                        >
                          Preview Swap
                        </Text>
                      ) : (
                        <Text style={styles.tradeExecuteButtonText}>
                          Preview Swap
                        </Text>
                      )}
                    </Animated.View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Sheet for Swap Details */}
            <BottomSheet
              ref={bottomSheetRef}
              index={-1}
              enablePanDownToClose={true}
              backgroundStyle={styles.bottomSheetBackground}
              handleIndicatorStyle={styles.bottomSheetHandle}
              backdropComponent={(props) => (
                <BottomSheetBackdrop
                  {...props}
                  appearsOnIndex={0}
                  disappearsOnIndex={-1}
                  opacity={0.4}
                />
              )}
              onClose={() => {
                // Clean up prepared swap state when bottom sheet closes
                setPreparedSwap(null);
                setIsPreparingSwap(false);
              }}
            >
              <BottomSheetView style={styles.bottomSheetContent}>
                <Text style={styles.bottomSheetTitle}>Swap Details</Text>

                {fromToken && toToken && (
                  <View style={styles.swapDetailsContainer}>
                    <View style={styles.swapDetailRow}>
                      <Text style={styles.swapDetailLabel}>Rate</Text>
                      <Text style={styles.swapDetailValue}>
                        {exchangeRate
                          ? `1 ${fromToken.symbol} = ${exchangeRate.toFixed(toToken.decimalsShown)} ${toToken.symbol}`
                          : 'N/A'}
                      </Text>
                    </View>

                    <View style={styles.swapDetailRow}>
                      <Text style={styles.swapDetailLabel}>Total Value</Text>
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <DollarSign
                          size={14}
                          color={'#4ade80'}
                          style={{ marginRight: 2 }}
                        />
                        <Text
                          style={[styles.swapDetailValue, { color: '#4ade80' }]}
                        >
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

                    {/* <View style={styles.swapDetailRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Zap size={14} color={'#eab308'} style={{ marginRight: 4 }} />
                  <Text style={styles.swapDetailLabel}>Network Fee</Text>
                </View>
                <Text style={styles.swapDetailValue}>$0.01</Text>
              </View> */}
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.confirmSwapButton,
                    (!preparedSwap || isPreparingSwap) &&
                      styles.buttonOpacityDisabled,
                  ]}
                  onPress={handleConfirmSwap}
                  disabled={!preparedSwap || isPreparingSwap}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.buttonBackground,
                      {
                        backgroundColor:
                          !preparedSwap || isPreparingSwap
                            ? colors.backgroundMedium
                            : '#3B82F6',
                      },
                    ]}
                  >
                    {isPreparingSwap ? (
                      <>
                        <ActivityIndicator
                          size="small"
                          color={
                            !preparedSwap || isPreparingSwap
                              ? colors.textSecondary
                              : colors.white
                          }
                        />
                        <Text
                          style={[
                            styles.confirmSwapButtonText,
                            (!preparedSwap || isPreparingSwap) &&
                              styles.confirmSwapButtonTextDisabled,
                          ]}
                        >
                          Preparing...
                        </Text>
                      </>
                    ) : (
                      <Text
                        style={[
                          styles.confirmSwapButtonText,
                          (!preparedSwap || isPreparingSwap) &&
                            styles.confirmSwapButtonTextDisabled,
                        ]}
                      >
                        Confirm Swap
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </BottomSheetView>
            </BottomSheet>

            {/* Loading Bottom Sheet for Swap Progress */}
            <BottomSheet
              ref={loadingBottomSheetRef}
              index={-1}
              enablePanDownToClose={swapComplete}
              backgroundStyle={styles.bottomSheetBackground}
              handleIndicatorStyle={styles.bottomSheetHandle}
              backdropComponent={(props) => (
                <BottomSheetBackdrop
                  {...props}
                  appearsOnIndex={0}
                  disappearsOnIndex={-1}
                  opacity={0.4}
                />
              )}
              onClose={handleCloseLoadingSheet}
            >
              <BottomSheetView style={styles.loadingBottomSheetContent}>
                <View style={styles.loadingContainer}>
                  {isSwapping && (
                    <>
                      <ActivityIndicator
                        size="large"
                        color="#3B82F6"
                        style={styles.loadingSpinner}
                      />
                      <Text style={styles.loadingTitle}>
                        Processing Swap...
                      </Text>
                      <Text style={styles.loadingSubtitle}>
                        Please wait while we execute your trade
                      </Text>
                    </>
                  )}

                  {swapComplete && swapSuccess && (
                    <>
                      <View style={styles.successIcon}>
                        <Check size={32} color="#10b981" />
                      </View>
                      <Text style={styles.loadingTitle}>Swap Successful!</Text>
                      <Text style={styles.loadingSubtitle}>
                        Transaction: {swapTxSignature.substring(0, 8)}...
                        {swapTxSignature.substring(swapTxSignature.length - 8)}
                      </Text>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleCloseLoadingSheet}
                      >
                        <Text style={styles.closeButtonText}>Close</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {swapComplete && !swapSuccess && (
                    <>
                      <View style={styles.errorIcon}>
                        <Text style={styles.errorIconText}>✕</Text>
                      </View>
                      <Text style={styles.loadingTitle}>Swap Failed</Text>
                      <Text style={styles.loadingSubtitle}>
                        Please try again
                      </Text>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleCloseLoadingSheet}
                      >
                        <Text style={styles.closeButtonText}>Close</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </BottomSheetView>
            </BottomSheet>

            <Toast
              message={toastMessage}
              visible={showToast}
              onHide={() => setShowToast(false)}
              type={toastType}
            />
          </>
        )}
      </ScreenContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 20, // Reduced padding since button is no longer sticky
  },
  // Bottom section for keyboard and button
  bottomSection: {
    backgroundColor: colors.backgroundDark,
    paddingBottom: 34, // Safe area padding
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  // New SwapBox styles
  swapBoxContainer: {
    backgroundColor: 'transparent', // Remove box background
    borderRadius: 0, // Remove border radius
    paddingVertical: 16,
    paddingHorizontal: 4, // Minimal horizontal padding
    marginBottom: 8, // Increased spacing between sections
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
    marginLeft: 16, // Increased from 12 for more space
    paddingVertical: 8, // Added padding for better touch targets
  },
  amountInput: {
    fontSize: 32, // Increased from 24 for better visibility
    fontFamily: 'Inter-Bold', // Changed from SemiBold to Bold for more prominence
    color: colors.white,
    textAlign: 'right',
    minWidth: 120, // Increased minimum width
  },
  amountOutput: {
    fontSize: 32, // Increased from 24 for better visibility
    fontFamily: 'Inter-Bold', // Changed from SemiBold to Bold for more prominence
    color: colors.white,
    textAlign: 'right',
    minWidth: 120, // Increased minimum width
  },
  usdValue: {
    fontSize: 16, // Increased from 14 for better visibility
    fontFamily: 'Inter-Medium', // Changed from Regular for more prominence
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
  bottomLabel: {
    // This style might no longer be needed if TokenSelectorDisplay handles its own label
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
  buttonOpacityDisabled: {
    // New style for TouchableOpacity's disabled state when wrapping a gradient
    opacity: 0.6, // Made less opaque
  },
  buttonBackground: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    width: '100%',
    height: '100%',
    gap: 8,
  },
  tradeExecuteButtonText: {
    fontSize: 17, // Match SeedPhraseVerificationStep font size
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    // Remove marginLeft since we're using gap in the gradient container
  },
  tradeExecuteButtonTextDisabled: {
    color: colors.textSecondary,
    opacity: 0.5,
  },
  // Bottom Sheet Styles
  bottomSheetBackground: {
    backgroundColor: colors.bottomSheetBackground, // Custom dark color with full opacity
  },
  bottomSheetHandle: {
    backgroundColor: colors.textSecondary,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20, // Normal padding, not extra for absolute button
  },
  bottomSheetTitle: {
    fontSize: 18, // Reduced from 20
    fontFamily: 'Inter-Medium', // Reduced from Inter-SemiBold
    color: colors.textSecondary, // Less primary color
    marginBottom: 20,
    textAlign: 'center',
  },
  swapDetailsContainer: {
    backgroundColor: colors.backgroundMedium, // Use a more opaque background
    borderRadius: 12,
    padding: 16,
    marginBottom: 42, // Increased space before the button to push it down
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
    color: colors.white, // Changed back to white for better contrast
    textAlign: 'right',
  },
  swapDetailValueSmall: {
    fontSize: 12,
    flexShrink: 1,
  },
  confirmSwapButton: {
    height: 54, // Match the preview button height
    borderRadius: 27, // Match the preview button border radius
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // Remove absolute positioning - let it flow naturally in the layout
  },
  confirmSwapButtonText: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
  confirmSwapButtonTextDisabled: {
    color: colors.textSecondary,
    opacity: 0.5,
  },
  // Loading Bottom Sheet Styles
  loadingBottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingSpinner: {
    marginBottom: 8,
  },
  loadingTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorIconText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.white,
  },
  closeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
  // SwapBox custom input styles
  amountInputTouchable: {
    paddingVertical: 12, // Reduced padding
    paddingHorizontal: 8, // Reduced padding
    borderRadius: 0, // Remove border radius
    backgroundColor: 'transparent', // Make background transparent
    borderWidth: 0, // Remove border
    borderColor: 'transparent', // Make border color transparent
    minHeight: 48, // Slightly reduced height
    justifyContent: 'center',
  },
  amountPlaceholder: {
    fontSize: 32, // Increased to match the amount text size
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  // Custom keyboard styles
  inlineKeyboard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  keyboardHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  keyboardHeaderText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  keyboardGrid: {
    gap: 12,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  keyboardKey: {
    flex: 1,
    height: 80,
    backgroundColor: 'transparent',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardKeyText: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  keyboardKeyDisabled: {
    backgroundColor: 'transparent',
    opacity: 0.5,
  },
  keyboardKeyTextDisabled: {
    color: colors.textSecondary,
    opacity: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  errorTitle: {
    fontSize: 20,
    color: '#ef4444',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
});
