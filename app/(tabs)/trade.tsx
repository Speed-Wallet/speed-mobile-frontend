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
import {
  DollarSign,
  Check,
  ExternalLink,
  ChevronDown,
  ArrowLeftRight,
} from 'lucide-react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import Toast from '@/components/Toast';
import colors from '@/constants/colors';
import { formatCurrency, unformatAmountInput } from '@/utils/formatters';
import { TokenMetadata } from '@/services/tokenAssetService';
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
import { useTokenAsset } from '@/hooks/useTokenAsset';
import { useRefetchTokenAssets } from '@/hooks/useTokenAsset';
import { useQueryClient } from '@tanstack/react-query';
import {
  WSOL_TOKEN,
  USDC_TOKEN,
  WSOL_ADDRESS,
} from '@/constants/popularTokens';
import TokenLogo from '@/components/TokenLogo';
import CopyButton from '@/components/CopyButton';
import TokenSelectorBottomSheet, {
  TokenSelectorBottomSheetRef,
} from '@/components/bottom-sheets/TokenSelectorBottomSheet';
import SwapNumPad from '@/components/keyboard/NumericKeyboard';
import { getJupiterQuote } from '@/services/jupiterApi';
import { useTradeTokens } from '@/hooks/useTradeTokens';

const WAIT_ON_AMOUNT_CHANGE = 2000;
const LOOP_QUOTE_INTERVAL = 300000;

/**
 * Trade Screen - Token Swap Interface
 *
 * Navigation Examples:
 *
 * 1. With both tokens specified:
 *    const fromToken: TokenMetadata = { address: '...', name: '...', symbol: '...', logoURI: '...', decimals: 9 };
 *    const toToken: TokenMetadata = { address: '...', name: '...', symbol: '...', logoURI: '...', decimals: 6 };
 *    router.push(`/(tabs)/trade?fromTokenJson=${encodeURIComponent(JSON.stringify(fromToken))}&toTokenJson=${encodeURIComponent(JSON.stringify(toToken))}`);
 *
 * 2. With only from token (to token will default to USDC or SOL):
 *    router.push(`/(tabs)/trade?fromTokenJson=${encodeURIComponent(JSON.stringify(fromToken))}`);
 *
 * 3. With no tokens (will default to SOL -> USDC):
 *    router.push('/(tabs)/trade');
 */
export default function TradeScreen() {
  const { fromTokenJson, toTokenJson } = useLocalSearchParams<{
    fromTokenJson?: string;
    toTokenJson?: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const walletAddress = useWalletPublicKey();
  const [fromToken, setFromToken] = useState<TokenMetadata | null>(null);
  const [toToken, setToToken] = useState<TokenMetadata | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  // Move module-level variables to proper React state/refs
  const lastQuoteTimeRef = useRef(0);
  const timeoutIDRef = useRef<NodeJS.Timeout | undefined>();
  const intervalIDRef = useRef<NodeJS.Timeout | undefined>();
  const [platformFee, setPlatformFee] = useState<number>(0);
  const [quote, setQuote] = useState<any>(undefined);

  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const bottomSheetRef = useRef<BottomSheet>(null);
  const fromTokenSelectorRef = useRef<TokenSelectorBottomSheetRef>(null);
  const toTokenSelectorRef = useRef<TokenSelectorBottomSheetRef>(null);

  // Token search state
  const [fromTokenSearchQuery, setFromTokenSearchQuery] = useState('');
  const [toTokenSearchQuery, setToTokenSearchQuery] = useState('');

  // Use token search hooks
  const { tokens: fromTokens, isLoading: isFromTokensLoading } = useTradeTokens(
    fromTokenSearchQuery,
    toToken?.address,
  );

  const { tokens: toTokens, isLoading: isToTokensLoading } = useTradeTokens(
    toTokenSearchQuery,
    fromToken?.address,
  );

  const { price: fromTokenPrice } = useTokenPrice(fromToken?.address);
  const { balance: fromTokenBalance } = useTokenAsset(fromToken?.address);

  // Check if output token ATA exists (needed for swap)
  const { ataExists: outputTokenAtaExists } = useTokenAsset(toToken?.address);

  const refetchTokenBalances = useRefetchTokenAssets();

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
  const [wasSheetDismissedDuringSwap, setWasSheetDismissedDuringSwap] =
    useState(false);

  // New state for prepared swap workflow
  const [preparedSwap, setPreparedSwap] = useState<PreparedJupiterSwap | null>(
    null,
  );
  const [isPreparingSwap, setIsPreparingSwap] = useState(false);
  const [isConfirmingSwap, setIsConfirmingSwap] = useState(false);

  // Always focus on 'from' input since 'to' is disabled
  const [activeInput, setActiveInput] = useState<'from' | 'to' | null>('from');

  function updateAmounts() {
    // Only proceed if config is loaded and swapFeeRate is available
    if (!swapFeeRate) {
      console.log('Config not loaded yet, skipping updateAmounts');
      return;
    }

    if (timeoutIDRef.current !== undefined) {
      clearTimeout(timeoutIDRef.current);
      timeoutIDRef.current = undefined;
    }

    if (intervalIDRef.current !== undefined) {
      clearInterval(intervalIDRef.current);
      intervalIDRef.current = undefined;
    }

    setToAmount('');
    const amountEntered = parseFloat(unformatAmountInput(fromAmount));
    if (isNaN(amountEntered) || amountEntered === 0) return;

    const amount = amountEntered * 10 ** fromToken!.decimals;
    const calculatedPlatformFee = Math.round(amount * swapFeeRate);
    setPlatformFee(calculatedPlatformFee);
    const inAmount = amount - calculatedPlatformFee;
    const diff = Date.now() - lastQuoteTimeRef.current;

    if (diff < WAIT_ON_AMOUNT_CHANGE) {
      timeoutIDRef.current = setTimeout(
        updateAmounts,
        WAIT_ON_AMOUNT_CHANGE - diff,
      );
      return;
    }

    lastQuoteTimeRef.current = Date.now();
    fetchAndApplyQuote(inAmount);
  }

  async function fetchAndApplyQuote(inAmount: number) {
    try {
      const newQuote = await getJupiterQuote(
        fromToken!.address,
        toToken!.address,
        inAmount,
      );

      if (!newQuote) {
        setQuote(undefined);
        return;
      } else if ('error' in newQuote || 'errorCode' in newQuote) {
        console.error(newQuote);
        setQuote(undefined);
        return;
      }

      setQuote(newQuote);

      const outAmount = parseFloat(newQuote.outAmount);
      console.log(
        `Quote received: ${newQuote.inAmount} -> ${newQuote.outAmount} (${newQuote.slippageBps})`,
      );
      if (!isNaN(outAmount)) {
        const val = outAmount * 10 ** -toToken!.decimals;
        setToAmount(parseFloat(val.toPrecision(12)).toString()); // Use reasonable precision without trailing zeros
      }

      if (!intervalIDRef.current) {
        intervalIDRef.current = setInterval(
          fetchAndApplyQuote,
          LOOP_QUOTE_INTERVAL,
          inAmount,
        );
      }
    } catch (err: any) {
      console.error(err);
      setToast({
        message: 'Network error, unable to establish connection',
        type: 'error',
      });
    }
  }

  // Cleanup effect for timers
  useEffect(() => {
    return () => {
      if (timeoutIDRef.current) {
        clearTimeout(timeoutIDRef.current);
      }
      if (intervalIDRef.current) {
        clearInterval(intervalIDRef.current);
      }
    };
  }, []);

  useEffect(updateAmounts, [fromAmount, fromToken, toToken, swapFeeRate]);
  // Note: Removed inverse calculation useEffect since 'to' input is now disabled

  // Initialize tokens from URL params or defaults
  useEffect(() => {
    const initializeTokens = () => {
      let initialFromToken: TokenMetadata | null = null;
      let initialToToken: TokenMetadata | null = null;

      // Try to parse tokens from URL params
      if (fromTokenJson) {
        try {
          initialFromToken = JSON.parse(fromTokenJson) as TokenMetadata;
        } catch (error) {
          console.error('Error parsing fromTokenJson:', error);
        }
      }

      if (toTokenJson) {
        try {
          initialToToken = JSON.parse(toTokenJson) as TokenMetadata;
        } catch (error) {
          console.error('Error parsing toTokenJson:', error);
        }
      }

      // Set default tokens if not provided in params
      if (!initialFromToken) {
        // Default to WSOL for from token
        initialFromToken = WSOL_TOKEN;
      }

      if (!initialToToken && initialFromToken) {
        // Default to USDC for to token if different from from token
        const defaultToToken = USDC_TOKEN;
        if (
          defaultToToken &&
          defaultToToken.address !== initialFromToken.address
        ) {
          initialToToken = defaultToToken;
        } else {
          // If USDC is the from token, use WSOL as to token
          initialToToken = WSOL_TOKEN;
        }
      }

      setFromToken(initialFromToken);
      setToToken(initialToToken);
    };

    initializeTokens();
  }, [fromTokenJson, toTokenJson]);

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);

    // Or, more robustly, clear toAmount and let it recalculate if fromAmount is present
    setFromAmount(truncateDecimals(toAmount)); // Or keep original fromAmount: setFromAmount(tempFromAmount)
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

    if (timeoutIDRef.current !== undefined) {
      clearTimeout(timeoutIDRef.current);
      timeoutIDRef.current = undefined;
    }
    if (intervalIDRef.current !== undefined) {
      clearInterval(intervalIDRef.current);
      intervalIDRef.current = undefined;
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

    // Start swap process - keep current bottom sheet open, just update state
    setIsConfirmingSwap(true);
    setIsSwapping(true);
    setSwapComplete(false);
    setSwapSuccess(false);
    setSwapTxSignature('');

    try {
      const sig = await confirmJupiterSwap(preparedSwap);
      console.log(`Trade Successful: ${sig}`);

      // Refetch token balances after successful trade
      refetchTokenBalances();

      // Update loading states - success handled by bottom sheet or toast
      setSwapSuccess(true);
      setSwapTxSignature(sig);
      setSwapComplete(true);
      setIsSwapping(false);
      setIsConfirmingSwap(false);

      // If sheet was dismissed during swap, show success toast
      if (wasSheetDismissedDuringSwap) {
        setToast({
          message: 'Swap successful!',
          type: 'success',
        });
        setWasSheetDismissedDuringSwap(false);
      }

      // Clear the input amount and prepared swap after successful trade
      setFromAmount('');
      setToAmount('');
      setPreparedSwap(null);
    } catch (err: any) {
      console.error(err);
      // Error handled by bottom sheet or toast
      setIsSwapping(false);
      setIsConfirmingSwap(false);
      setSwapComplete(true);
      setSwapSuccess(false);

      // If sheet was dismissed during swap, show error toast
      if (wasSheetDismissedDuringSwap) {
        setToast({
          message: 'Swap failed. Please try again.',
          type: 'error',
        });
        setWasSheetDismissedDuringSwap(false);
      }
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

  // Shared SOL buffer calculation
  const getSolBuffer = useCallback(() => {
    return outputTokenAtaExists ? 0.006 : 0.008;
  }, [outputTokenAtaExists]);

  // Calculate max allowable SOL amount (with buffer)
  const getMaxSolAmount = useCallback(() => {
    if (!fromToken || fromToken.address !== WSOL_ADDRESS)
      return fromTokenBalance;
    const buffer = getSolBuffer();
    return Math.max(0, fromTokenBalance - buffer);
  }, [fromToken, fromTokenBalance, getSolBuffer]);

  // Check if amount exceeds balance
  const isInsufficientBalance = useMemo(() => {
    if (!fromAmount || !fromToken) return false;
    const amount = parseFloat(unformatAmountInput(fromAmount));
    if (isNaN(amount) || amount === 0) return false;

    // For WSOL, compare against max allowable amount (already has buffer subtracted)
    if (fromToken.address === WSOL_ADDRESS) {
      const maxAllowable = getMaxSolAmount();
      return amount > maxAllowable;
    }

    // For other tokens, just check if amount exceeds balance
    return amount > fromTokenBalance;
  }, [fromAmount, fromToken, fromTokenBalance, getMaxSolAmount]);

  // Get WSOL balance for transaction fee checking
  const { balance: wsolBalance } = useTokenAsset(WSOL_ADDRESS);

  // Helper function to truncate decimal places to maximum of 9
  const truncateDecimals = useCallback(
    (value: string, maxDecimals: number = 9): string => {
      const decimalIndex = value.indexOf('.');
      if (decimalIndex === -1) return value;

      const integerPart = value.substring(0, decimalIndex);
      const decimalPart = value.substring(decimalIndex + 1);

      if (decimalPart.length <= maxDecimals) return value;

      const truncatedDecimal = decimalPart.substring(0, maxDecimals);
      return `${integerPart}.${truncatedDecimal}`;
    },
    [],
  );

  // Wrapped setFromAmount that truncates decimals
  const setFromAmountTruncated = useCallback(
    (value: string) => {
      setFromAmount(truncateDecimals(value));
    },
    [truncateDecimals],
  );

  // Check for insufficient SOL considering buffer for transaction fees
  const isInsufficientSol = useMemo(() => {
    // Require at least 0.01 WSOL for any swap operation
    return wsolBalance < 0.01;
  }, [wsolBalance]);

  const isButtonDisabled =
    !fromAmount ||
    parseFloat(unformatAmountInput(fromAmount)) <= 0 ||
    !quote ||
    !!quote.errorCode ||
    isInsufficientBalance ||
    isInsufficientSol;

  // Determine button text based on state
  const getButtonText = () => {
    if (isInsufficientSol) {
      return 'Insufficient SOL';
    }
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

  const handleCloseSheet = useCallback(() => {
    bottomSheetRef.current?.close();
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
      // Always handle input for 'from' field since 'to' input is disabled
      if (key === 'backspace') {
        setFromAmount((prev) => prev.slice(0, -1));
      } else if (key === '.') {
        if (!fromAmount.includes('.')) {
          setFromAmount((prev) => (prev === '' ? '0.' : prev + '.'));
        }
      } else {
        // Number key
        setFromAmount((prev) => {
          // Clear to amount when starting to type in from field
          if (prev === '' && key !== '0') {
            setToAmount('');
          }
          // Prevent multiple leading zeros
          if (prev === '0' && key !== '.') return key;

          // Add the new key and truncate to max 9 decimal places
          const newValue = prev + key;
          return truncateDecimals(newValue);
        });
      }
    },
    [fromAmount],
  );

  const handleInputFocus = useCallback(() => {
    setActiveInput('from');
  }, []);

  const handlePercentagePress = useCallback(
    (percentage: number) => {
      if (!fromToken || !fromTokenBalance || fromTokenBalance === 0) return;

      let amount;

      // For WSOL, use the max allowable amount when clicking 100%
      if (fromToken.address === WSOL_ADDRESS && percentage === 100) {
        amount = getMaxSolAmount();
      } else {
        // For other percentages or non-SOL tokens, calculate normally
        amount = (fromTokenBalance * percentage) / 100;
      }

      // Convert to string with reasonable precision, removing trailing zeros
      const formattedAmount = parseFloat(amount.toPrecision(12)).toString();

      // Truncate to max 9 decimal places
      const truncatedAmount = truncateDecimals(formattedAmount);

      // Only update if the amount actually changed
      if (truncatedAmount !== fromAmount) {
        setFromAmount(truncatedAmount);
        setToAmount(''); // Only clear output when input changes
      }

      // Set focus to from input
      setActiveInput('from');
    },
    [fromToken, fromTokenBalance, fromAmount, getMaxSolAmount],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScreenContainer edges={['top']} style={styles.container}>
        <ScreenHeader
          title="Swap Tokens"
          showBackButton={false}
          // onBack={() => router.push('/' as any)}
        />

        {/* Config Loading/Error States */}
        {isConfigLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : configError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Configuration Error</Text>
            <Text style={styles.stateSubtitle}>
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
            <Text style={styles.stateSubtitle}>
              Required configuration data is missing. Please contact support.
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Main Content */}
            <View style={styles.mainContent}>
              {/* Row 1: Amount Display Section */}
              <View style={styles.amountSection}>
                <TouchableOpacity
                  onPress={handleInputFocus}
                  style={styles.amountTouchable}
                  activeOpacity={0.7}
                >
                  <Text style={styles.amountText}>
                    {fromAmount || '0'}
                    {fromToken && (
                      <Text style={styles.amountCurrency}>
                        {' '}
                        {fromToken.symbol}
                      </Text>
                    )}
                  </Text>
                  {toAmount && toToken && (
                    <Text style={styles.estimatedOutputText}>
                      ≈ {toAmount} {toToken.symbol}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Row 2: Token Selectors */}
              <View style={styles.tokenSelectorsRow}>
                <TouchableOpacity
                  style={styles.tokenSelectorFrom}
                  onPress={() => fromTokenSelectorRef.current?.present()}
                  activeOpacity={0.7}
                >
                  <View style={styles.tokenColumnLeft}>
                    <Text style={styles.tokenLabel}>From</Text>
                    {fromToken ? (
                      <View style={styles.tokenDisplayVertical}>
                        <TokenLogo
                          logoURI={fromToken.logoURI}
                          size={moderateScale(20, 0.3)}
                        />
                        <Text style={styles.tokenSymbolSmall}>
                          {fromToken.symbol}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.tokenPlaceholderSmall}>Select</Text>
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.tokenSelectorTo}
                  onPress={() => toTokenSelectorRef.current?.present()}
                  activeOpacity={0.7}
                >
                  <View style={styles.tokenColumnRight}>
                    <Text style={styles.tokenLabelRight}>To</Text>
                    {toToken ? (
                      <View style={styles.tokenDisplayVertical}>
                        <TokenLogo
                          logoURI={toToken.logoURI}
                          size={moderateScale(20, 0.3)}
                        />
                        <Text style={styles.tokenSymbolSmall}>
                          {toToken.symbol}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.tokenPlaceholderSmall}>Select</Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Swap button positioned absolutely on top of divider */}
                <TouchableOpacity
                  style={styles.swapButtonSmall}
                  onPress={handleSwapTokens}
                  activeOpacity={0.7}
                >
                  <ArrowLeftRight size={16} color={colors.white} />
                </TouchableOpacity>
              </View>

              {/* Row 3: Horizontal Container for Percentage Buttons and Keyboard */}
              <View style={styles.horizontalContainer}>
                {/* Percentage Buttons */}
                <PercentageButtons
                  fromToken={fromToken}
                  fromTokenBalance={fromTokenBalance}
                  onPercentagePress={handlePercentagePress}
                />

                {/* Custom Keyboard - Always shown since only 'from' input is active */}
                <SwapNumPad
                  onKeyPress={handleKeyPress}
                  activeInput={activeInput}
                />
              </View>

              {/* Row 4: Preview Swap Button */}
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
                // If swap is in progress, mark as dismissed and let toast handle success/error
                if (isSwapping) {
                  setWasSheetDismissedDuringSwap(true);
                }
                // Clean up prepared swap state when bottom sheet closes
                setPreparedSwap(null);
                setIsPreparingSwap(false);
              }}
            >
              <BottomSheetView style={styles.bottomSheetContent}>
                {/* Only show swap details when not in success/error state */}
                {!swapComplete && (
                  <>
                    <Text style={styles.bottomSheetTitle}>Swap Details</Text>

                    {fromToken && toToken && (
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
                    )}

                    {fromToken && toToken && (
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
                          <Text style={styles.swapDetailLabel}>
                            Total Value
                          </Text>
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
                            <Text
                              style={[
                                styles.swapDetailValue,
                                { color: '#4ade80' },
                              ]}
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

                        {quote && (
                          <>
                            <View style={styles.swapDetailRow}>
                              <Text style={styles.swapDetailLabel}>
                                Price Impact
                              </Text>
                              <Text style={styles.swapDetailValue}>
                                {(() => {
                                  const impact =
                                    parseFloat(quote.priceImpactPct) * 100;
                                  if (impact < 0.001) return '0.00%';
                                  const decimals = impact < 0.01 ? 3 : 2;
                                  return `${impact.toFixed(decimals)}%`;
                                })()}
                              </Text>
                            </View>

                            <View style={styles.swapDetailRow}>
                              <Text style={styles.swapDetailLabel}>
                                Max Slippage
                              </Text>
                              <Text style={styles.swapDetailValue}>
                                {(quote.slippageBps / 100).toFixed(2)}%
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    )}

                    <PrimaryActionButton
                      title={
                        isSwapping
                          ? 'Processing Swap...'
                          : isPreparingSwap
                            ? 'Preparing...'
                            : 'Confirm Swap'
                      }
                      onPress={handleConfirmSwap}
                      disabled={!preparedSwap || isPreparingSwap || isSwapping}
                      loading={isPreparingSwap || isSwapping}
                    />
                  </>
                )}

                {/* Success State */}
                {swapComplete && swapSuccess && (
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
                      {fromToken && toToken && fromAmount && toAmount && (
                        <View style={styles.swapSummaryContainer}>
                          <View style={styles.swapSummaryRow}>
                            <Text style={styles.swapSummaryLabel}>From</Text>
                            <View style={styles.swapSummaryAmountContainer}>
                              <Text style={styles.swapSummaryAmount}>
                                {parseFloat(
                                  unformatAmountInput(fromAmount),
                                ).toFixed(2)}{' '}
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
                                {parseFloat(
                                  unformatAmountInput(toAmount),
                                ).toFixed(2)}{' '}
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
                        </View>
                      )}

                      {swapTxSignature && (
                        <>
                          <View style={styles.transactionIdContainer}>
                            <View>
                              <Text style={styles.transactionIdLabel}>
                                Transaction ID
                              </Text>
                              <Text style={styles.transactionIdValue}>
                                {swapTxSignature.substring(0, 8)}...
                                {swapTxSignature.substring(
                                  swapTxSignature.length - 8,
                                )}
                              </Text>
                            </View>
                            <CopyButton
                              textToCopy={swapTxSignature}
                              size={20}
                            />
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
                    <PrimaryActionButton
                      title="Close"
                      onPress={handleCloseSheet}
                    />
                  </View>
                )}

                {/* Error State */}
                {swapComplete && !swapSuccess && (
                  <View style={styles.stateContainer}>
                    <View style={styles.errorIconSubdued}>
                      <Text style={styles.errorIconText}>!</Text>
                    </View>
                    <Text style={styles.stateTitle}>Swap Failed</Text>
                    <Text style={styles.stateSubtitle}>
                      Your transaction could not be completed.{'\n'}
                      Please check your funds and network connection.
                    </Text>

                    <View style={styles.failedButtonContainer}>
                      <PrimaryActionButton
                        title="Try Again"
                        onPress={handleCloseSheet}
                      />
                      <PrimaryActionButton
                        title="Close"
                        onPress={handleCloseSheet}
                        variant="secondary"
                      />
                    </View>
                  </View>
                )}
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
          tokens={fromTokens}
          searchQuery={fromTokenSearchQuery}
          onSearchChange={setFromTokenSearchQuery}
          isLoading={isFromTokensLoading}
          onTokenSelect={setFromToken}
          onClose={() => setFromTokenSearchQuery('')}
          selectedAddress={fromToken?.address}
        />

        <TokenSelectorBottomSheet
          ref={toTokenSelectorRef}
          tokens={toTokens}
          searchQuery={toTokenSearchQuery}
          onSearchChange={setToTokenSearchQuery}
          isLoading={isToTokensLoading}
          onTokenSelect={setToToken}
          onClose={() => setToTokenSearchQuery('')}
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
    gap: scale(10),
    paddingHorizontal: scale(16),
  },
  // Row 1: Amount Display Section
  amountSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
  },
  amountTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(16),
  },
  amountText: {
    fontSize: moderateScale(30),
    fontFamily: 'Inter-Bold',
    color: colors.white,
    textAlign: 'center',
  },
  amountCurrency: {
    fontSize: moderateScale(30),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  estimatedOutputText: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: verticalScale(8),
    textAlign: 'center',
  },
  // Row 2: Token Selectors
  tokenSelectorsRow: {
    flexDirection: 'row',
    gap: 0,
    alignItems: 'stretch',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    // padding: scale(12),
    minHeight: verticalScale(56),
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(155, 155, 155, 0.1)',
  },
  tokenSelectorFrom: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: scale(4),
  },
  tokenSelectorTo: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: scale(4),
  },
  tokenColumnLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: scale(4),
    padding: 12,
  },
  tokenColumnRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: scale(4),
    padding: 12,
  },
  tokenLabel: {
    fontSize: moderateScale(11),
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  tokenLabelRight: {
    fontSize: moderateScale(11),
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  tokenDisplayVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  tokenSymbolSmall: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
  tokenPlaceholderSmall: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  swapButtonSmall: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.textSecondary,
    opacity: 0.15,
  },
  tokenSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    height: verticalScale(56),
  },
  tokenDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  tokenSymbol: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
  tokenPlaceholder: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  // Row 3: Horizontal container for percentage buttons and keyboard
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 200,
    justifyContent: 'space-between',
    gap: moderateScale(12, 2.0),
  },
  // Row 4: Button Container
  buttonContainer: {
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
    marginLeft: -8, // Overlap the logos
    zIndex: 1,
  },
  swapTokensText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    textAlign: 'center',
  },
  swapDetailsContainer: {
    backgroundColor: colors.backgroundMedium, // Use a more opaque background
    borderRadius: 12,
    padding: 16,
    marginBottom: 24, // Reduced gap between details and button
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
  stateContainer: {
    flex: 1,
    alignItems: 'center',
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
  errorIconSubdued: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.2)', // More subdued red background
    borderWidth: 2,
    borderColor: '#ef4444',
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
  failedButtonContainer: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  // Success screen styles
  successDetailsContainer: {
    width: '100%',
    gap: 10, // Customize spacing between from/to box, txn id box, and explorer box
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
