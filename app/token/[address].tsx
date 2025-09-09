import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  Star,
  ArrowUpRight,
  ArrowRightLeft,
  ArrowDownLeft,
} from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import ScreenHeader from '@/components/ScreenHeader';
import ScreenContainer from '@/components/ScreenContainer';
import { TokenPriceChart } from '@/components/charts';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  getHistoricalPrices,
  getTokenPrices,
  TokenMetadata,
} from '@/services/apis';
import {
  formatHistoricalDataForCustomChart,
  formatPriceChangeString,
  formatPrice,
  formatLargeNumber,
  formatSupply,
  calculatePriceChange,
  timeframeConfigs,
  ChartDataPoint,
  formatPriceChange,
} from '@/utils/chartUtils';

const screenWidth = Dimensions.get('window').width;

const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

export default function TokenDetailScreen() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [tokenData, setTokenData] = useState<TokenMetadata | null>(null);
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceChange, setPriceChange] = useState({
    change: 0,
    changePercentage: 0,
  });
  const [chartSelectedData, setChartSelectedData] = useState<{
    priceChange: number;
    percentageChange: number;
    isInteracting: boolean;
  } | null>(null);

  const router = useRouter();
  const { address } = useLocalSearchParams<{ address: string }>();

  useEffect(() => {
    loadTokenData();
  }, [address]);

  useEffect(() => {
    if (tokenData?.coingeckoId) {
      loadHistoricalData(selectedTimeframe);
    }
  }, [selectedTimeframe, tokenData]);

  const loadTokenData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getTokenPrices();

      if (!response.success) {
        throw new Error(response.error || 'Failed to load token data');
      }

      const token = response.data.find((t) => t.address === address);

      if (!token) {
        throw new Error('Token not found');
      }

      setTokenData(token);
    } catch (err) {
      console.error('Error loading token data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load token data',
      );
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalData = async (timeframe: string) => {
    if (!tokenData?.coingeckoId) return;

    try {
      setLoading(true);
      const config = timeframeConfigs[timeframe];

      const response = await getHistoricalPrices(
        tokenData.coingeckoId,
        config.days,
      );

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

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
  };

  const handleChartInteraction = (
    data: {
      priceChange: number;
      percentageChange: number;
      isInteracting: boolean;
    } | null,
  ) => {
    setChartSelectedData(data);
  };

  if (loading && !tokenData) {
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
  if (error) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <ScreenHeader title="Error" onBack={() => router.back()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadTokenData()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  if (!tokenData) {
    return null;
  }

  const currentPrice = tokenData.priceData?.current_price || 0;

  const displayPriceChange = priceChange;

  const currentChange = `${formatPriceChange(
    displayPriceChange.change,
  )} ${formatPriceChangeString(displayPriceChange.changePercentage)}`;
  const isNegative = displayPriceChange.changePercentage < 0;

  const statsData = [
    {
      label: 'Market Cap',
      value: formatLargeNumber(tokenData.priceData?.market_cap || 0),
    },
    {
      label: 'Volume (24h)',
      value: formatLargeNumber(tokenData.priceData?.total_volume || 0),
    },
    {
      label: 'Circulating Supply',
      value: formatSupply(
        tokenData.priceData?.circulating_supply || 0,
        tokenData.symbol,
      ),
    },
    {
      label: 'Max Supply',
      value: tokenData.priceData?.max_supply
        ? formatSupply(tokenData.priceData.max_supply, tokenData.symbol)
        : 'N/A',
    },
  ];

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScreenHeader
        title={tokenData.symbol}
        onBack={() => router.back()}
        rightElement={
          <TouchableOpacity style={styles.headerButton}>
            <Star size={scale(20)} color="#fff" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Price Section */}
        <View style={styles.priceSection}>
          <Text style={styles.price}>{formatPrice(currentPrice)}</Text>

          {chartSelectedData?.isInteracting ? (
            <View style={styles.chartSelectedDisplay}>
              <Text
                style={[
                  styles.chartSelectedPrice,
                  {
                    color:
                      chartSelectedData.percentageChange < 0
                        ? '#ef4444'
                        : '#10b981',
                  },
                ]}
              >
                {formatPriceChange(chartSelectedData.priceChange)}
              </Text>
              <Text
                style={[
                  styles.chartSelectedPercentage,
                  {
                    color:
                      chartSelectedData.percentageChange < 0
                        ? '#ef4444'
                        : '#10b981',
                  },
                ]}
              >
                {chartSelectedData.percentageChange >= 0 ? '+' : ''}
                {chartSelectedData.percentageChange.toFixed(2)}%
              </Text>
            </View>
          ) : (
            <Text
              style={[
                styles.priceChange,
                { color: isNegative ? '#ef4444' : '#10b981' },
              ]}
            >
              {currentChange}
            </Text>
          )}
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
              width={screenWidth - 32}
              height={scale(200)}
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
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* About Token */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About {tokenData.name}</Text>
          <Text style={styles.description}>
            {tokenData.name} ({tokenData.symbol}) is a cryptocurrency token.
            Current price data and market information are provided by CoinGecko.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActionContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/transaction/trade?fromToken=${address}`)}
        >
          <ArrowRightLeft size={scale(18)} color="#fff" />
          <Text style={styles.actionButtonText}>Trade</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/transaction/send?token=${address}`)}
        >
          <ArrowUpRight size={scale(18)} color="#fff" />
          <Text style={styles.actionButtonText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/transaction/receive')}
        >
          <ArrowDownLeft size={scale(18)} color="#fff" />
          <Text style={styles.actionButtonText}>Receive</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    paddingVertical: verticalScale(4),
  },
  price: {
    fontSize: scale(30),
    fontWeight: '700',
    color: '#fff',
    marginBottom: verticalScale(3),
  },
  priceChange: {
    fontSize: scale(14),
    fontWeight: '600',
  },
  chartSelectedDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(3),
    gap: scale(6),
  },
  chartSelectedPrice: {
    fontSize: scale(12),
    fontWeight: '600',
  },
  chartSelectedPercentage: {
    fontSize: scale(10),
    fontWeight: '500',
  },
  chartContainer: {
    // backgroundColor: '#2a2a2a', // Using colors.backgroundMedium equivalent
    borderRadius: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginHorizontal: scale(16),
  },
  chartLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: scale(200),
    width: screenWidth - 32,
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
    width: screenWidth - 32,
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
    marginBottom: verticalScale(16),
    justifyContent: 'space-between',
  },
  timeframeButton: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(6),
    borderRadius: scale(16),
    backgroundColor: '#2a2a2a',
  },
  timeframeButtonActive: {
    backgroundColor: '#6366f1',
  },
  timeframeText: {
    fontSize: scale(12),
    color: '#9ca3af',
    fontWeight: '500',
  },
  timeframeTextActive: {
    color: '#fff',
  },
  section: {
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(20),
  },
  aboutSection: {
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(80), // Extra space for bottom buttons
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
  statValue: {
    fontSize: scale(13),
    fontWeight: '600',
    color: '#fff',
  },
  bottomActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    paddingBottom: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: scale(8),
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    borderRadius: scale(12),
    gap: scale(6),
  },
  actionButtonText: {
    fontSize: scale(15),
    fontWeight: '600',
    color: '#fff',
  },
});
