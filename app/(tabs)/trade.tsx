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
import { ChevronDown, ArrowLeftRight } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { showToast } from '@/services/notifications';
import colors from '@/constants/colors';
import {
  formatCurrency,
  unformatAmountInput,
  formatAmountInput,
  formatBalance,
} from '@/utils/formatters';
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
import { useTokenAsset, useRefetchTokenAssets } from '@/hooks/useTokenAsset';
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
import SwapDetailsBottomSheet, {
  SwapDetailsBottomSheetRef,
} from '@/components/bottom-sheets/SwapDetailsBottomSheet';
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
  const bottomSheetRef = useRef<SwapDetailsBottomSheetRef>(null);
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
  const { balance: toTokenBalance } = useTokenAsset(toToken?.address);

  // Check if output token ATA exists (needed for swap)
  const { ataExists: outputTokenAtaExists } = useTokenAsset(toToken?.address);

  // Force immediate refetch of all token balances
  const refetchTokenBalances = useRefetchTokenAssets();

  // Get config values - this is critical data that must be loaded
  const {
    data: config,
    isLoading: isConfigLoading,
    error: configError,
  } = useConfig();
  const swapFeeRate = config?.swapFeeRate;

  // Loading state for swap
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapComplete, setSwapComplete] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [swapTxSignature, setSwapTxSignature] = useState<string>('');
  const [swapErrorMessage, setSwapErrorMessage] = useState<string>('');
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

    const amount = Math.round(amountEntered * 10 ** fromToken!.decimals);
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
        walletAddress || undefined, // Pass user's wallet address for accurate quotes
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
      console.log('quote: ', newQuote);

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
      showToast('Network error, unable to fetch quote', 'error');
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

  // Handler for selecting from token - truncates amount if needed
  const handleFromTokenSelect = useCallback(
    (token: TokenMetadata) => {
      setFromToken(token);
      // If there's an amount, truncate it to the new token's decimals
      if (fromAmount) {
        const maxDecimals = token.decimals;
        const decimalIndex = fromAmount.indexOf('.');
        if (decimalIndex !== -1) {
          const decimalPart = fromAmount.substring(decimalIndex + 1);
          if (decimalPart.length > maxDecimals) {
            const truncated = fromAmount.substring(
              0,
              decimalIndex + maxDecimals + 1,
            );
            setFromAmount(truncated);
          }
        }
      }
    },
    [fromAmount],
  );

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);

    // Truncate toAmount when swapping to respect the new fromToken's decimals
    setFromAmount(truncateDecimals(toAmount));
    setToAmount(''); // Quote will be re-fetched by useEffect on fromAmount or by updateAmounts call
  };

  const handlePreviewSwap = async () => {
    const amount = parseFloat(unformatAmountInput(fromAmount));

    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    if (!fromToken || !toToken) {
      showToast('Please select both tokens.', 'error');
      return;
    }

    if (amount > fromTokenBalance) {
      showToast("You don't have enough tokens for this trade", 'error');
      return;
    }
    if (!quote || quote.errorCode) {
      showToast(
        'Quote is not available or invalid. Please try again.',
        'error',
      );
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

    // Reset any previous swap states before opening sheet
    setSwapComplete(false);
    setSwapSuccess(false);
    setSwapTxSignature('');
    setSwapErrorMessage('');
    setIsSwapping(false);
    setIsConfirmingSwap(false);

    // Open the bottom sheet immediately
    bottomSheetRef.current?.present();

    // Start preparing the swap in the background
    setIsPreparingSwap(true);
    setPreparedSwap(null);

    try {
      const prepared = await prepareJupiterSwapTransaction(quote, platformFee);
      setPreparedSwap(prepared);
      console.log('Swap prepared successfully');
    } catch (err: any) {
      console.error('Failed to prepare swap:', err);
      showToast('Failed to prepare swap. Please try again.', 'error');
      bottomSheetRef.current?.dismiss();
    } finally {
      setIsPreparingSwap(false);
    }
  };

  const handleConfirmSwap = async () => {
    if (!preparedSwap) {
      showToast('Swap not prepared. Please try again.', 'error');
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

      // Update loading states - success handled by bottom sheet or toast
      setSwapSuccess(true);
      setSwapTxSignature(sig);
      setSwapComplete(true);
      setIsSwapping(false);
      setIsConfirmingSwap(false);

      // Only show success toast if sheet was dismissed during swap
      if (wasSheetDismissedDuringSwap) {
        showToast(
          `Successfully swapped ${fromToken?.symbol} to ${toToken?.symbol}!`,
          'success',
        );
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

      // Determine error message based on error type
      const isBlockhashExpired =
        err.isBlockhashExpired ||
        err.message?.includes('expired') ||
        err.message?.includes('Blockhash not found') ||
        err.message?.includes('block height exceeded') ||
        err.details?.includes('block height exceeded');

      const isInsufficientBalance =
        err.isInsufficientBalance ||
        err.message?.includes('insufficient lamports') ||
        err.message?.includes('insufficient funds') ||
        err.details?.includes('insufficient lamports');

      const errorMessage = isInsufficientBalance
        ? 'Insufficient balance. Please reduce the amount.'
        : isBlockhashExpired
          ? 'Transaction took too long to confirm. Please try again.'
          : 'Swap failed. Please try again.';

      setSwapErrorMessage(errorMessage);

      // Only show error toast if sheet was dismissed during swap
      if (wasSheetDismissedDuringSwap) {
        showToast(errorMessage, 'error');
        setWasSheetDismissedDuringSwap(false);
      }
    } finally {
      // Always refetch token balances after trade attempt (success or failure)
      refetchTokenBalances();
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

    // For other tokens, check if amount exceeds balance
    return amount > fromTokenBalance;
  }, [fromAmount, fromToken, fromTokenBalance, getMaxSolAmount]);

  // Get WSOL balance for transaction fee checking
  const { balance: wsolBalance } = useTokenAsset(WSOL_ADDRESS);

  // Helper function to truncate decimal places based on token decimals
  const truncateDecimals = useCallback(
    (value: string, maxDecimals?: number): string => {
      // Use token decimals if not specified
      const decimalsLimit = maxDecimals ?? fromToken?.decimals ?? 9;

      const decimalIndex = value.indexOf('.');
      if (decimalIndex === -1) return value;

      const integerPart = value.substring(0, decimalIndex);
      const decimalPart = value.substring(decimalIndex + 1);

      if (decimalPart.length <= decimalsLimit) return value;

      const truncatedDecimal = decimalPart.substring(0, decimalsLimit);
      return `${integerPart}.${truncatedDecimal}`;
    },
    [fromToken],
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
    if (isInsufficientBalance) {
      return `Insufficient ${fromToken?.symbol || 'Balance'}`;
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
    bottomSheetRef.current?.dismiss();
    // Reset all loading states
    setTimeout(() => {
      setIsSwapping(false);
      setSwapComplete(false);
      setSwapSuccess(false);
      setSwapTxSignature('');
      setSwapErrorMessage('');
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

          // Check if adding this digit would exceed token decimals
          const decimalIndex = prev.indexOf('.');
          if (decimalIndex !== -1) {
            const currentDecimals = prev.length - decimalIndex - 1;
            const maxDecimals = fromToken?.decimals ?? 9;
            if (currentDecimals >= maxDecimals) {
              return prev; // Don't add more decimals
            }
          }

          // Add the new key and truncate to token decimals
          const newValue = prev + key;
          return truncateDecimals(newValue);
        });
      }
    },
    [fromAmount, fromToken, truncateDecimals],
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

      // Truncate to token decimals
      const truncatedAmount = truncateDecimals(formattedAmount);

      // Only update if the amount actually changed
      if (truncatedAmount !== fromAmount) {
        setFromAmount(truncatedAmount);
        setToAmount(''); // Only clear output when input changes
      }

      // Set focus to from input
      setActiveInput('from');
    },
    [
      fromToken,
      fromTokenBalance,
      fromAmount,
      getMaxSolAmount,
      truncateDecimals,
    ],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScreenContainer edges={['top']} style={styles.container}>
        <ScreenHeader
          title="Swap"
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
                    {formatAmountInput(fromAmount) || '0'}
                    {fromToken && (
                      <Text style={styles.amountCurrency}>
                        {' '}
                        {fromToken.symbol}
                      </Text>
                    )}
                  </Text>
                  {toAmount && toToken && (
                    <Text style={styles.estimatedOutputText}>
                      ≈ {formatAmountInput(toAmount)} {toToken.symbol}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Row 2: Preview Swap Button */}
              <View style={styles.buttonContainer}>
                <PrimaryActionButton
                  title={getButtonText()}
                  onPress={handlePreviewSwapClick}
                  disabled={isButtonDisabled}
                />
              </View>

              {/* Row 3: Token Selectors */}
              <View style={styles.tokenSelectorsRow}>
                <TouchableOpacity
                  style={styles.tokenSelectorFrom}
                  onPress={() => fromTokenSelectorRef.current?.present()}
                  activeOpacity={0.7}
                >
                  <View style={styles.tokenSelectorRow}>
                    <View style={styles.tokenColumnLeft}>
                      <View style={[styles.labelRow, styles.labelRowLeft]}>
                        <Text style={styles.tokenLabel}>From</Text>
                        {fromToken && fromTokenBalance !== undefined && (
                          <Text style={styles.tokenBalanceText}>
                            {formatBalance(fromTokenBalance)}
                          </Text>
                        )}
                      </View>
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
                  </View>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.tokenSelectorTo}
                  onPress={() => toTokenSelectorRef.current?.present()}
                  activeOpacity={0.7}
                >
                  <View style={styles.tokenSelectorRow}>
                    <View style={styles.tokenColumnRight}>
                      <View style={[styles.labelRow, styles.labelRowRight]}>
                        {toToken && toTokenBalance !== undefined && (
                          <Text style={styles.tokenBalanceText}>
                            {formatBalance(toTokenBalance)}
                          </Text>
                        )}
                        <Text style={styles.tokenLabelRight}>To</Text>
                      </View>
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

              {/* Row 4: Horizontal Container for Percentage Buttons and Keyboard */}
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
            </View>

            {/* Bottom Sheet for Swap Details */}
            <SwapDetailsBottomSheet
              ref={bottomSheetRef}
              fromToken={fromToken}
              toToken={toToken}
              fromAmount={fromAmount}
              toAmount={toAmount}
              quote={quote}
              exchangeRate={exchangeRate}
              totalValueDisplay={totalValueDisplay}
              fromTokenPrice={fromTokenPrice || 0}
              preparedSwap={preparedSwap}
              isPreparingSwap={isPreparingSwap}
              isSwapping={isSwapping}
              swapComplete={swapComplete}
              swapSuccess={swapSuccess}
              swapTxSignature={swapTxSignature}
              swapErrorMessage={swapErrorMessage}
              onConfirmSwap={handleConfirmSwap}
              onClose={handleCloseSheet}
              onDismiss={() => {
                // If swap is in progress, mark as dismissed and let toast handle success/error
                if (isSwapping) {
                  setWasSheetDismissedDuringSwap(true);
                }
                // Clean up prepared swap state when bottom sheet closes
                setPreparedSwap(null);
                setIsPreparingSwap(false);
              }}
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
          onTokenSelect={handleFromTokenSelect}
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
    gap: scale(5),
    paddingHorizontal: scale(16),
  },
  // Row 1: Amount Display Section
  amountSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(155, 155, 155, 0.1)',
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
  tokenSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    // gap: scale(8),
  },
  labelRowLeft: {
    paddingRight: 10,
  },
  labelRowRight: {
    paddingLeft: 10,
  },
  tokenBalanceText: {
    fontSize: moderateScale(11),
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  tokenColumnLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: scale(4),
    padding: 12,
    flex: 1,
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
    marginLeft: -16,
    marginTop: -16,
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
    height: 250,
    justifyContent: 'space-between',
    gap: moderateScale(12, 2.0),
  },
  // Row 4: Button Container
  buttonContainer: {
    // marginTop: -8,
  },
  // Keep existing styles
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.white,
    opacity: 0.7,
    marginBottom: 8,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 1,
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
