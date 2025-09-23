import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DollarSign, Check } from 'lucide-react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import Toast from '@/components/Toast';
import colors from '@/constants/colors';
import { formatCurrency, unformatAmountInput } from '@/utils/formatters';
import { getAllTokenInfo, getTokenByAddress } from '@/data/tokens';
import { EnrichedTokenEntry } from '@/data/types';
import {
  prepareJupiterSwapTransaction,
  confirmJupiterSwap,
  useWalletPublicKey,
  type PreparedJupiterSwap,
} from '@/services/walletService';
import { useConfig } from '@/hooks/useConfig';
import ScreenHeader from '@/components/ScreenHeader';
import ScreenContainer from '@/components/ScreenContainer';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import PercentageButtons from '@/components/buttons/PercentageButtons';
import { useTokenPrice } from '@/hooks/useTokenPrices';
import { triggerShake } from '@/utils/animations';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useRefetchTokenBalances } from '@/hooks/useTokenBalance';
import { useQueryClient } from '@tanstack/react-query';
import SwapTokensSection from '@/components/SwapTokensSection';
import TokenSelectorBottomSheet, {
  TokenSelectorBottomSheetRef,
} from '@/components/TokenSelectorBottomSheet';
import NumericKeyboard from '@/components/keyboard/NumericKeyboard';
import { getJupiterQuote } from '@/services/jupiterApi';

const WAIT_ON_AMOUNT_CHANGE = 2000;
const LOOP_QUOTE_INTERVAL = 300000;
let lastQuoteTime = 0;
let timeoutID: NodeJS.Timeout | undefined;
let intervalID: NodeJS.Timeout | undefined;

let platformFee: number;
let quote: any;

export default function TradeScreen() {
  const { tokenAddress, selectedTokenAddress, returnParam } =
    useLocalSearchParams<{
      tokenAddress?: string;
      selectedTokenAddress?: string;
      returnParam?: string;
    }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const walletAddress = useWalletPublicKey();
  const [fromToken, setFromToken] = useState<EnrichedTokenEntry | null>(null);
  const [toToken, setToToken] = useState<EnrichedTokenEntry | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const bottomSheetRef = useRef<BottomSheet>(null);
  const loadingBottomSheetRef = useRef<BottomSheet>(null);
  const fromTokenSelectorRef = useRef<TokenSelectorBottomSheetRef>(null);
  const toTokenSelectorRef = useRef<TokenSelectorBottomSheetRef>(null);

  const { price: fromTokenPrice } = useTokenPrice(
    fromToken?.extensions.coingeckoId,
  );
  const { balance: fromTokenBalance } = useTokenBalance(fromToken?.address);

  // Get refetch function for after successful trades
  const refetchTokenBalances = useRefetchTokenBalances();

  // Get config values - this is critical data that must be loaded
  const {
    data: config,
    isLoading: isConfigLoading,
    error: configError,
  } = useConfig();
  const swapFeeRate = config?.swapFeeRate;

  // Toast state for validation errors and network issues
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

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
    const amountEntered = parseFloat(unformatAmountInput(fromAmount));
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
      quote = await getJupiterQuote(
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
      setToast({
        message: 'Network error, unable to establish connection',
        type: 'error',
      });
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
      parseFloat(unformatAmountInput(toAmount)) === 0
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

    const toAmountEntered = parseFloat(unformatAmountInput(toAmount));
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

    // Or, more robustly, clear toAmount and let it recalculate if fromAmount is present
    setFromAmount(toAmount); // Or keep original fromAmount: setFromAmount(tempFromAmount)
    setToAmount(''); // Quote will be re-fetched by useEffect on fromAmount or by updateAmounts call
  };

  const handlePreviewSwap = async () => {
    const amount = parseFloat(unformatAmountInput(fromAmount));

    if (isNaN(amount) || amount <= 0) {
      setToast({ message: 'Please enter a valid amount', type: 'error' });
      return;
    }

    if (!fromToken || !toToken) {
      setToast({ message: 'Please select both tokens.', type: 'error' });
      return;
    }

    if (amount > fromTokenBalance) {
      setToast({
        message: "You don't have enough tokens for this trade",
        type: 'error',
      });
      return;
    }
    if (!quote || quote.errorCode) {
      setToast({
        message: 'Quote is not available or invalid. Please try again.',
        type: 'error',
      });
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
      setToast({
        message: 'Failed to prepare swap. Please try again.',
        type: 'error',
      });
      bottomSheetRef.current?.close();
    } finally {
      setIsPreparingSwap(false);
    }
  };

  const handleConfirmSwap = async () => {
    if (!preparedSwap) {
      setToast({
        message: 'Swap not prepared. Please try again.',
        type: 'error',
      });
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

      // Refetch token balances after successful trade
      refetchTokenBalances();

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
    quote &&
    toToken &&
    fromToken &&
    parseFloat(unformatAmountInput(fromAmount)) > 0
      ? parseFloat(quote.outAmount) /
        10 ** toToken.decimals /
        parseFloat(unformatAmountInput(fromAmount))
      : null;

  const totalValueDisplay =
    fromAmount && fromToken && parseFloat(unformatAmountInput(fromAmount)) > 0
      ? formatCurrency(
          parseFloat(unformatAmountInput(fromAmount)) * (fromTokenPrice || 0),
        )
      : '$0.00';

  // Check if amount exceeds balance
  const isInsufficientBalance = useMemo(() => {
    if (!fromAmount || !fromToken) return false;
    const amount = parseFloat(unformatAmountInput(fromAmount));
    if (isNaN(amount) || amount === 0) return false;
    return amount > fromTokenBalance;
  }, [fromAmount, fromToken, fromTokenBalance]);

  const isButtonDisabled =
    !fromAmount ||
    parseFloat(unformatAmountInput(fromAmount)) <= 0 ||
    !quote ||
    !!quote.errorCode ||
    isInsufficientBalance;

  // Determine button text based on state
  const getButtonText = () => {
    if (isInsufficientBalance && fromToken) {
      return `Insufficient ${fromToken.symbol}`;
    }
    return 'Preview Swap';
  };

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
            setFromAmount((prev) => (prev === '' ? '0.' : prev + '.'));
          }
        } else {
          if (!toAmount.includes('.')) {
            setToAmount((prev) => (prev === '' ? '0.' : prev + '.'));
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

  const handlePercentagePress = useCallback(
    (percentage: number) => {
      if (!fromToken || !fromTokenBalance || fromTokenBalance === 0) return;

      // Calculate the percentage of the available balance
      const amount = (fromTokenBalance * percentage) / 100;

      // Format to the token's decimal precision
      const formattedAmount = amount.toFixed(fromToken.decimalsShown);

      // Set the from amount and clear the to amount
      setFromAmount(formattedAmount);
      setToAmount('');

      // Set focus to from input
      setActiveInput('from');
    },
    [fromToken, fromTokenBalance],
  );

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
          <View style={{ flex: 1 }}>
            {/* Main Content */}
            <View style={styles.mainContent}>
              <SwapTokensSection
                fromToken={fromToken}
                toToken={toToken}
                fromAmount={fromAmount}
                toAmount={toAmount}
                activeInput={activeInput}
                onFromAmountChange={setFromAmount}
                onToAmountChange={setToAmount}
                onFromInputFocus={handleInputFocus}
                onToInputFocus={handleToInputFocus}
                onSwapTokens={handleSwapTokens}
                onFromTokenSelect={() => fromTokenSelectorRef.current?.expand()}
                onToTokenSelect={() => toTokenSelectorRef.current?.expand()}
              />

              {/* Percentage Buttons */}
              <PercentageButtons
                fromToken={fromToken}
                fromTokenBalance={fromTokenBalance}
                onPercentagePress={handlePercentagePress}
              />

              {/* Bottom Section - Keyboard and Button */}
              <View style={styles.bottomSection}>
                {/* Custom Keyboard */}
                {showCustomKeyboard && (
                  <NumericKeyboard
                    onKeyPress={handleKeyPress}
                    activeInput={activeInput}
                  />
                )}
              </View>

              {/* Preview Swap Button */}
              <View style={styles.buttonContainer}>
                <PrimaryActionButton
                  title={getButtonText()}
                  onPress={handlePreviewSwapClick}
                  disabled={isButtonDisabled}
                />
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

                <PrimaryActionButton
                  title={isPreparingSwap ? 'Preparing...' : 'Confirm Swap'}
                  onPress={handleConfirmSwap}
                  disabled={!preparedSwap || isPreparingSwap}
                  loading={isPreparingSwap}
                />
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
              message={toast?.message || ''}
              visible={!!toast}
              onHide={() => setToast(null)}
              type={toast?.type || 'error'}
            />
          </View>
        )}

        {/* Token Selector Bottom Sheets - At root level for proper z-index */}
        <TokenSelectorBottomSheet
          ref={fromTokenSelectorRef}
          onTokenSelect={setFromToken}
          onClose={() => {}}
          excludeAddress={toToken?.address}
          selectedAddress={fromToken?.address}
        />

        <TokenSelectorBottomSheet
          ref={toTokenSelectorRef}
          onTokenSelect={setToToken}
          onClose={() => {}}
          excludeAddress={fromToken?.address}
          selectedAddress={toToken?.address}
        />
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
  // Bottom section for keyboard and button
  bottomSection: {
    backgroundColor: colors.backgroundDark,
    paddingBottom: verticalScale(18), // Safe area padding
  },
  buttonContainer: {
    paddingHorizontal: moderateScale(20, 2.0),
    paddingTop: moderateScale(4, 2.0),
    paddingBottom: verticalScale(16),
    marginTop: -8,
  },
  // Keep existing styles
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.white, // Changed from colors.textSecondary
    opacity: 0.7, // Added opacity to make it slightly less prominent than full white
    marginBottom: 8,
  },
  bottomSheetBackground: {
    backgroundColor: colors.bottomSheetBackground, // Custom dark color with full opacity
  },
  bottomSheetHandle: {
    backgroundColor: colors.textSecondary,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
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
