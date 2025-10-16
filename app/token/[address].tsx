import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeft,
  Star,
  ArrowUpRight,
  ArrowRightLeft,
  Copy,
} from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import ScreenHeader from '@/components/ScreenHeader';
import TokenLogo from '@/components/TokenLogo';
import ScreenContainer from '@/components/ScreenContainer';
import BottomActionContainer from '@/components/BottomActionContainer';
import { TokenPriceChart } from '@/components/charts';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  getHistoricalPrices,
  HistoricalPricesResponse,
  TimeframePeriod,
} from '@/services/apis';
import {
  formatHistoricalDataForCustomChart,
  formatPriceChangeString,
  formatPrice,
  formatLargeNumber,
  calculatePriceChange,
  timeframeConfigs,
  ChartDataPoint,
  formatPriceChange,
} from '@/utils/chartUtils';
import { useJupiterToken } from '@/services/jupiterService';
import { useTokenAssets } from '@/hooks/useTokenAsset';
import { useWalletPublicKey } from '@/services/walletService';
import { CHART_HORIZONTAL_MARGIN } from '@/constants/layout';

const screenWidth = Dimensions.get('window').width;

const timeframes: TimeframePeriod[] = ['1H', '1D', '7D', '1M', '1Y'];

export default function TokenDetailScreen() {
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<TimeframePeriod>('1D');
  const [historicalData, setHistoricalData] =
    useState<HistoricalPricesResponse | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceChange, setPriceChange] = useState({
    change: 0,
    changePercentage: 0,
  });
  const [chartSelectedData, setChartSelectedData] = useState<{
    selectedPrice: number;
    priceChange: number;
    percentageChange: number;
    timestamp: number;
    isInteracting: boolean;
  } | null>(null);

  const bottomActionTranslateY = useSharedValue(0);
  const lastScrollY = useRef(0);

  const router = useRouter();
  const { address, symbol, name } = useLocalSearchParams<{
    address: string;
    symbol?: string;
    name?: string;
  }>();

  // Use Jupiter API to fetch token data
  const {
    data: tokenData,
    isLoading: isLoadingToken,
    error: tokenError,
  } = useJupiterToken(address || '', !!address);

  // Get user's wallet and token holdings
  const walletAddress = useWalletPublicKey();
  const { data: tokenAssets } = useTokenAssets(walletAddress);

  // Find the user's holding for this token
  const userHolding = tokenAssets?.tokenAssets?.find(
    (asset) => asset.address === address,
  );

  useEffect(() => {
    if (address && tokenData) {
      loadHistoricalData(selectedTimeframe);
    }
  }, [selectedTimeframe, address, tokenData]);

  const loadHistoricalData = async (timeframe: TimeframePeriod) => {
    if (!address) return;

    try {
      setLoading(true);

      const response = await getHistoricalPrices(address, timeframe);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load historical data');
      }

      setHistoricalData(response);

      const formattedChart = formatHistoricalDataForCustomChart(
        response,
        timeframe,
      );
      setChartData(formattedChart);

      const change = calculatePriceChange(response, timeframe);
      setPriceChange(change);
    } catch (err) {
      console.error('Error loading historical data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load historical data',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTimeframeChange = (timeframe: TimeframePeriod) => {
    setSelectedTimeframe(timeframe);
  };

  const handleChartInteraction = (
    data: {
      selectedPrice: number;
      priceChange: number;
      percentageChange: number;
      timestamp: number;
      isInteracting: boolean;
    } | null,
  ) => {
    setChartSelectedData(data);
  };

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const diff = currentOffset - lastScrollY.current;

    // Hide bottom actions when scrolling down, show when scrolling up
    if (diff > 5 && currentOffset > 20) {
      // Scrolling down
      bottomActionTranslateY.value = withTiming(150, { duration: 200 });
    } else if (diff < -5 || currentOffset <= 0) {
      // Scrolling up or at top
      bottomActionTranslateY.value = withTiming(0, { duration: 200 });
    }

    lastScrollY.current = currentOffset;
  };

  if (isLoadingToken && !tokenData) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <ScreenHeader title="Loading..." onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading token data...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Show error state
  if (tokenError || error) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <ScreenHeader title="Error" onBack={() => router.back()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || 'Failed to load token data'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  if (!tokenData) {
    return null;
  }

  const currentPrice = tokenData.usdPrice || 0;

  const displayPriceChange = priceChange;

  const currentChange = `${formatPriceChange(
    displayPriceChange.change,
  )} ${formatPriceChangeString(displayPriceChange.changePercentage)}`;
  const isNegative = displayPriceChange.changePercentage < 0;

  // Format date for display
  const formatDisplayDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return `${time}, ${dateStr}`;
  };

  // Format mint address for display (show first 4 and last 4 characters)
  const formatAddress = (addr: string) => {
    if (!addr) return 'N/A';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const handleCopyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      // Could add a toast notification here
    }
  };

  // Calculate 24h volume (buy + sell volume)
  const volume24h = tokenData.stats24h
    ? tokenData.stats24h.buyVolume + tokenData.stats24h.sellVolume
    : 0;

  const statsData = [
    {
      label: 'Token Name',
      value: tokenData.name || name || 'N/A',
    },
    {
      label: 'Market Cap',
      value: formatLargeNumber(tokenData?.mcap || 0),
    },
    {
      label: 'Volume 24h',
      value: formatLargeNumber(volume24h),
    },
    {
      label: 'Liquidity',
      value: formatLargeNumber(tokenData?.liquidity || 0),
    },
    {
      label: 'Holders',
      value: formatLargeNumber(tokenData?.holderCount || 0),
    },
    {
      label: 'Mint Address',
      value: formatAddress(address || ''),
      action: handleCopyAddress,
      icon: 'copy',
    },
    {
      label: 'Circulating Supply',
      value: tokenData?.circSupply
        ? formatLargeNumber(tokenData.circSupply)
        : 'N/A',
    },
    {
      label: 'Total Supply',
      value: tokenData?.totalSupply
        ? formatLargeNumber(tokenData.totalSupply)
        : 'N/A',
    },
  ];

  // Holdings data (only if user has this token)
  const holdingsData = userHolding
    ? [
        {
          label: 'Balance',
          value: `${userHolding.balance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })} ${tokenData.symbol}`,
        },
        {
          label: 'Value',
          value: formatPrice(userHolding.totalPrice || 0),
        },
      ]
    : null;

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScreenHeader
        title={
          <View style={styles.headerTitleContainer}>
            <TokenLogo logoURI={tokenData.icon} size={scale(24)} />
            <Text style={styles.headerTitle}>
              {tokenData.symbol || symbol || ''}
            </Text>
          </View>
        }
        // onBack={() => router.back()}
        // rightElement={
        //   <TouchableOpacity style={styles.headerButton}>
        //     <Star size={scale(20)} color="#fff" />
        //   </TouchableOpacity>
        // }
        // showBackButton={true}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Price Section */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            {/* Left: Price */}
            <Text style={styles.price}>
              {chartSelectedData?.isInteracting
                ? formatPrice(chartSelectedData.selectedPrice)
                : formatPrice(currentPrice)}
            </Text>

            {/* Right: Percentage Change */}
            <Text
              style={[
                styles.percentageChange,
                {
                  color: chartSelectedData?.isInteracting
                    ? chartSelectedData.percentageChange < 0
                      ? '#ef4444'
                      : '#10b981'
                    : isNegative
                      ? '#ef4444'
                      : '#10b981',
                },
              ]}
            >
              {chartSelectedData?.isInteracting
                ? `${chartSelectedData.percentageChange >= 0 ? '↑' : '↓'} ${Math.abs(chartSelectedData.percentageChange).toFixed(2)}%`
                : `${displayPriceChange.changePercentage >= 0 ? '↑' : '↓'} ${Math.abs(displayPriceChange.changePercentage).toFixed(2)}%`}
            </Text>
          </View>

          <View style={styles.priceBottomRow}>
            {/* Left: Dollar Change */}
            <Text
              style={[
                styles.dollarChange,
                {
                  color: chartSelectedData?.isInteracting
                    ? chartSelectedData.percentageChange < 0
                      ? '#ef4444'
                      : '#10b981'
                    : isNegative
                      ? '#ef4444'
                      : '#10b981',
                },
              ]}
            >
              {chartSelectedData?.isInteracting
                ? formatPriceChange(chartSelectedData.priceChange)
                : formatPriceChange(displayPriceChange.change)}
            </Text>

            {/* Right: Date/Timeframe */}
            <Text style={styles.dateLabel}>
              {chartSelectedData?.isInteracting
                ? formatDisplayDate(chartSelectedData.timestamp)
                : 'Today'}
            </Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          {loading ? (
            <View style={styles.chartLoadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.chartLoadingText}>Loading chart...</Text>
            </View>
          ) : chartData && chartData.length > 0 ? (
            <TokenPriceChart
              data={chartData}
              timeframe={selectedTimeframe}
              isPositive={priceChange.changePercentage >= 0}
              onInteraction={handleChartInteraction}
            />
          ) : (
            <View style={styles.chartErrorContainer}>
              <Text style={styles.chartErrorText}>Chart data unavailable</Text>
            </View>
          )}
        </View>

        {/* Timeframe Selector */}
        <View style={styles.timeframeContainer}>
          {timeframes.map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.timeframeButton,
                selectedTimeframe === timeframe && styles.timeframeButtonActive,
              ]}
              onPress={() => handleTimeframeChange(timeframe)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  selectedTimeframe === timeframe && styles.timeframeTextActive,
                ]}
              >
                {timeframe}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Your Holdings Section - Only show if user holds this token */}
        {holdingsData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Holdings</Text>
            <View style={styles.statsContainer}>
              {holdingsData.map((stat, index) => (
                <View
                  key={index}
                  style={[
                    styles.statRow,
                    index === holdingsData.length - 1 && styles.lastStatRow,
                  ]}
                >
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Market Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Info</Text>
          <View style={styles.statsContainer}>
            {statsData.map((stat, index) => (
              <View
                key={index}
                style={[
                  styles.statRow,
                  index === statsData.length - 1 && styles.lastStatRow,
                ]}
              >
                <Text style={styles.statLabel}>{stat.label}</Text>
                <View style={styles.statValueContainer}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  {stat.icon === 'copy' && (
                    <TouchableOpacity
                      onPress={stat.action}
                      style={styles.copyButton}
                    >
                      <Copy size={scale(14)} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* About Token */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>
            About {tokenData.name || tokenData.symbol || 'Token'}
          </Text>
          <Text style={styles.description}>
            {tokenData.name || tokenData.symbol || 'This token'} is a
            cryptocurrency token on Solana. Current price data and market
            information are provided by Jupiter.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <BottomActionContainer
        translateY={bottomActionTranslateY}
        edges={['bottom']}
      >
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/(tabs)/trade?fromToken=${address}`)}
          >
            <ArrowRightLeft size={scale(18)} color="#000" />
            <Text style={styles.actionButtonText}>Trade</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/transaction/send?token=${address}`)}
          >
            <ArrowUpRight size={scale(18)} color="#000" />
            <Text style={styles.actionButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </BottomActionContainer>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  headerTitle: {
    fontSize: scale(16),
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(16),
  },
  loadingText: {
    fontSize: scale(14),
    color: '#9ca3af',
    marginTop: verticalScale(10),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(16),
  },
  errorText: {
    fontSize: scale(14),
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: scale(8),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: scale(14),
    fontWeight: '600',
  },
  priceSection: {
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(8),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(4),
  },
  price: {
    fontSize: scale(24),
    fontWeight: '700',
    color: '#fff',
  },
  percentageChange: {
    fontSize: scale(20),
    fontWeight: '700',
  },
  priceBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dollarChange: {
    fontSize: scale(13),
    fontWeight: '600',
  },
  dateLabel: {
    fontSize: scale(13),
    fontWeight: '500',
    color: '#9ca3af',
  },
  priceChange: {
    fontSize: scale(14),
    fontWeight: '600',
  },
  chartSelectedDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  chartContainer: {
    // backgroundColor: '#2a2a2a', // Using colors.backgroundMedium equivalent
    borderRadius: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginHorizontal: scale(CHART_HORIZONTAL_MARGIN),
    marginBottom: 10,
  },
  chartLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: scale(200),
    width: screenWidth - scale(CHART_HORIZONTAL_MARGIN * 2),
  },
  chartLoadingText: {
    fontSize: scale(12),
    color: '#9ca3af',
    marginTop: verticalScale(6),
  },
  chartErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: scale(200),
    width: screenWidth - scale(CHART_HORIZONTAL_MARGIN * 2),
    backgroundColor: '#2a2a2a',
    borderRadius: scale(16),
  },
  chartErrorText: {
    fontSize: scale(12),
    color: '#ef4444',
  },
  timeframeContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  timeframeButton: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(6),
    borderRadius: scale(16),
    backgroundColor: '#2a2a2a',
  },
  timeframeButtonActive: {
    backgroundColor: '#00CFFF',
  },
  timeframeText: {
    fontSize: scale(12),
    color: '#9ca3af',
    fontWeight: '500',
  },
  timeframeTextActive: {
    color: '#000',
  },
  section: {
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(20),
  },
  aboutSection: {
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(20),
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#fff',
    marginBottom: verticalScale(10),
  },
  description: {
    fontSize: scale(13),
    color: '#9ca3af',
    lineHeight: scale(18),
    marginBottom: verticalScale(16),
  },
  statsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: scale(12),
    padding: scale(12),
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  lastStatRow: {
    borderBottomWidth: 0,
  },
  statLabel: {
    fontSize: scale(13),
    color: '#9ca3af',
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  statValue: {
    fontSize: scale(13),
    fontWeight: '600',
    color: '#fff',
  },
  copyButton: {
    padding: scale(4),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#00CFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    borderRadius: scale(16),
    gap: scale(6),
  },
  actionButtonText: {
    fontSize: scale(15),
    fontWeight: '600',
    color: '#000',
  },
});
