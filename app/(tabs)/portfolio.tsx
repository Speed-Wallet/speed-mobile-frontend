import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChartPie as PieChartIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import PieChart from '@/components/PieChart';
import TransactionItem from '@/components/TransactionItem';
import { getCryptoData } from '@/data/crypto';
import { getTransactionHistory } from '@/data/transactions';
import UserData from '@/data/user';

export default function PortfolioScreen() {
  const router = useRouter();
  const [cryptoData, setCryptoData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [portfolioChange, setPortfolioChange] = useState(0);
  const [timeframe, setTimeframe] = useState('1D');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getCryptoData();
    setCryptoData(data);
    
    // Calculate total portfolio change based on owned assets
    const totalChange = data.reduce((sum, crypto) => sum + (crypto.priceChangePercentage * crypto.balance / 100), 0);
    setPortfolioChange(totalChange);
    
    const history = await getTransactionHistory();
    setTransactions(history);
  };

  const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio</Text>
          <Text style={styles.subtitle}>Track your crypto assets</Text>
        </View>
        
        {/* Portfolio Summary */}
        <Animated.View entering={FadeIn.duration(800)} style={styles.summaryCard}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceValue}>{formatCurrency(UserData.totalBalance)}</Text>
          </View>
          
          <View style={styles.changeRow}>
            <Text 
              style={[
                styles.changeValue, 
                { color: portfolioChange >= 0 ? colors.success : colors.error }
              ]}
            >
              {portfolioChange >= 0 ? '+' : ''}{formatPercentage(portfolioChange)}
              {portfolioChange >= 0 ? 
                <ArrowUpRight size={16} color={colors.success} /> : 
                <ArrowDownRight size={16} color={colors.error} />
              }
            </Text>
            
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
          </View>
          
          {/* Portfolio Distribution Chart */}
          <View style={styles.chartContainer}>
            <PieChart data={cryptoData} />
          </View>
        </Animated.View>
        
        {/* Asset Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Asset Distribution</Text>
          <View style={styles.distributionList}>
            {cryptoData.map((crypto) => {
              const percentage = (crypto.balance * crypto.price / UserData.totalBalance) * 100;
              return (
                <TouchableOpacity 
                  key={crypto.id}
                  style={styles.distributionItem}
                  onPress={() => router.push(`/crypto/${crypto.id}`)}
                >
                  <View style={styles.distributionLeft}>
                    <View 
                      style={[
                        styles.colorIndicator, 
                        { backgroundColor: crypto.color }
                      ]} 
                    />
                    <Text style={styles.cryptoName}>{crypto.name}</Text>
                  </View>
                  <Text style={styles.distributionPercentage}>
                    {percentage.toFixed(1)}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.slice(0, 5).map((transaction, index) => (
            <TransactionItem 
              key={transaction.id} 
              transaction={transaction}
              cryptoData={cryptoData}
            />
          ))}
          
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Transactions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginTop: 8,
  },
  balanceRow: {
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  balanceValue: {
    fontSize: 32,
    color: colors.textPrimary,
    fontFamily: 'Inter-Bold',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  changeValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 4,
  },
  timeframeOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  chartContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  distributionList: {
    marginBottom: 8,
  },
  distributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundLight,
  },
  distributionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  cryptoName: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
  },
  distributionPercentage: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: 'Inter-Medium',
  },
  viewAllButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 16,
    color: colors.primary,
    fontFamily: 'Inter-SemiBold',
  },
});