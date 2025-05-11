import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRightLeft, Star } from 'lucide-react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { LineChart } from 'react-native-chart-kit';
import colors from '@/constants/colors';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { getCryptoById } from '@/data/crypto';
import { getCryptoChartData } from '@/data/charts';
import TransactionItem from '@/components/TransactionItem';
import { getTransactionHistoryForCrypto } from '@/data/transactions';

const screenWidth = Dimensions.get('window').width;

export default function CryptoDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [crypto, setCrypto] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [transactions, setTransactions] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (crypto) {
      loadChartData();
    }
  }, [crypto, timeframe]);

  const loadData = async () => {
    const cryptoData = await getCryptoById(id);
    setCrypto(cryptoData);
    
    const txHistory = await getTransactionHistoryForCrypto(id);
    setTransactions(txHistory);
  };

  const loadChartData = async () => {
    const data = await getCryptoChartData(crypto.id, timeframe);
    setChartData(data);
  };

  const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  if (!crypto || !chartData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const navigateToTransaction = (type) => {
    router.push({
      pathname: `/transaction/${type}`,
      params: { cryptoId: crypto.id }
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.cryptoSymbol}>{crypto.symbol}</Text>
            <Text style={styles.cryptoName}>{crypto.name}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <Star 
              size={24} 
              color={isFavorite ? colors.warning : colors.textSecondary} 
              fill={isFavorite ? colors.warning : 'transparent'} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Price Info */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.priceSection}>
          <Text style={styles.priceValue}>{formatCurrency(crypto.price)}</Text>
          <View style={styles.changeContainer}>
            <Text 
              style={[
                styles.changeValue, 
                { color: crypto.priceChangePercentage >= 0 ? colors.success : colors.error }
              ]}
            >
              {crypto.priceChangePercentage >= 0 ? '+ ' : ''}
              {formatPercentage(crypto.priceChangePercentage)}
            </Text>
            <Text style={styles.changePeriod}>in the last 24h</Text>
          </View>
        </Animated.View>
        
        {/* Chart */}
        <View style={styles.chartSection}>
          <View style={styles.timeframeSelector}>
            {timeframes.map((tf) => (
              <TouchableOpacity 
                key={tf}
                style={[
                  styles.timeframeOption,
                  timeframe === tf && styles.activeTimeframe
                ]}
                onPress={() => setTimeframe(tf)}
              >
                <Text 
                  style={[
                    styles.timeframeText,
                    timeframe === tf && styles.activeTimeframeText
                  ]}
                >
                  {tf}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: [
                {
                  data: chartData.values,
                  color: () => crypto.priceChangePercentage >= 0 ? colors.success : colors.error,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: colors.backgroundMedium,
              backgroundGradientTo: colors.backgroundMedium,
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '0',
              },
            }}
            bezier
            style={styles.chart}
            withHorizontalLines={false}
            withVerticalLines={false}
            withDots={false}
            withInnerLines={false}
            withOuterLines={false}
            withShadow={false}
            yAxisLabel="$"
            yAxisInterval={1}
          />
        </View>
        
        {/* Your Assets */}
        <View style={styles.assetsSection}>
          <Text style={styles.sectionTitle}>Your {crypto.name} Assets</Text>
          <View style={styles.assetCard}>
            <View style={styles.assetRow}>
              <Text style={styles.assetLabel}>Amount</Text>
              <Text style={styles.assetValue}>
                {crypto.balance.toFixed(4)} {crypto.symbol}
              </Text>
            </View>
            <View style={styles.assetRow}>
              <Text style={styles.assetLabel}>Value</Text>
              <Text style={styles.assetValue}>
                {formatCurrency(crypto.balance * crypto.price)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TransactionItem 
                key={transaction.id} 
                transaction={transaction}
                cryptoData={[crypto]}
                showDate
              />
            ))
          ) : (
            <Text style={styles.noTransactions}>No transactions yet</Text>
          )}
        </View>
        
        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About {crypto.name}</Text>
          <Text style={styles.aboutText}>
            {crypto.description || `${crypto.name} is a cryptocurrency that uses blockchain technology to enable secure, decentralized transactions. It was created to provide a more efficient and transparent financial system.`}
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Market Cap</Text>
              <Text style={styles.statValue}>{formatCurrency(crypto.marketCap)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Volume (24h)</Text>
              <Text style={styles.statValue}>{formatCurrency(crypto.volume24h)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Circulating Supply</Text>
              <Text style={styles.statValue}>{crypto.circulatingSupply.toLocaleString()} {crypto.symbol}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Max Supply</Text>
              <Text style={styles.statValue}>
                {crypto.maxSupply ? crypto.maxSupply.toLocaleString() : '∞'} {crypto.symbol}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Action Buttons */}
      <Animated.View 
        entering={SlideInDown.duration(500)} 
        style={styles.actionButtonsContainer}
      >
        <TouchableOpacity 
          style={[styles.actionButton, styles.buyButton]} 
          onPress={() => navigateToTransaction('trade')}
        >
          <ArrowRightLeft size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Trade</Text>
        </TouchableOpacity>
        
        <View style={styles.actionButtonsGroup}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigateToTransaction('send')}
          >
            <ArrowUp size={20} color={colors.white} />
            <Text style={styles.actionButtonText}>Send</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigateToTransaction('receive')}
          >
            <ArrowDown size={20} color={colors.white} />
            <Text style={styles.actionButtonText}>Receive</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundDark,
  },
  loadingText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  cryptoSymbol: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
  },
  cryptoName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  priceValue: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  changeValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  changePeriod: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginLeft: 4,
  },
  chartSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    alignSelf: 'center',
  },
  timeframeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeTimeframe: {
    backgroundColor: colors.primary,
  },
  timeframeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  activeTimeframeText: {
    color: colors.white,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  assetsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  assetCard: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 16,
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  assetLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  assetValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  transactionsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  noTransactions: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 20,
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
  },
  aboutSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100, // Extra padding for action buttons
  },
  aboutText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundMedium,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButtonsGroup: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  buyButton: {
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  actionButtonText: {
    color: colors.white,
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    marginLeft: 8,
  },
});