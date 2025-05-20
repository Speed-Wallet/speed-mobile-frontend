import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChartPie as PieChartIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import PieChart from 'react-native-pie-chart'
import GradientCard from '@/components/GradientCard'; // Import GradientCard

import TransactionItem from '@/components/TransactionItem';
import { getAllTokenInfo } from '@/data/tokens';
import { getTransactionHistory } from '@/data/transactions';
import UserData from '@/data/user';
import { EnrichedTokenEntry } from '@/data/types';
import GreyCard from '@/components/GreyCard';

export default function PortfolioScreen() {
  const router = useRouter();
  const [tokenData, setTokenData] = useState<EnrichedTokenEntry[]>([]);
  const [transactions, setTransactions] = useState<any>([]);
  const [portfolioChange, setPortfolioChange] = useState(0);
  const [timeframe, setTimeframe] = useState('1D');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getAllTokenInfo();
    setTokenData(data);
    
    // Calculate total portfolio change based on owned assets
    const totalChange = data.reduce((sum, token) => sum + (token.priceChangePercentage * token.balance / 100), 0);
    setPortfolioChange(totalChange);
    
    const history = await getTransactionHistory();
    setTransactions(history);
  };

  const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  // Calculate total value for asset distribution percentages based on current tokenData
  const totalValueForDistribution = tokenData.reduce((sum, token) => sum + token.balance * token.price, 0);

  // Prepare data for the PieChart, now including labels
  const pieChartSeries = tokenData.map(token => ({
    value: token.balance * token.price,
    color: token.color || colors.primary, // Fallback color if token.color is undefined
    // label: { text: token.symbol || 'N/A' }, // Add label with token symbol
  })).filter(item => item.value > 0); // Ensure no zero-value slices

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio</Text>
          <Text style={styles.subtitle}>Track your crypto assets</Text>
        </View>
        
        {/* Portfolio Summary */}
        <Animated.View entering={FadeIn.duration(800)} style={styles.summaryCard}>
          <GradientCard
            contentPaddingHorizontal={24} // Explicitly set for summary card
            contentPaddingVertical={24}   // Explicitly set for summary card
          >
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
            </View>
            
            {/* New row for balance amount and portfolio change */}
            <View style={styles.balanceDetailRow}> 
              <Text style={styles.balanceValue}>{formatCurrency(UserData.totalBalance)}</Text>
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
            </View>
            
            {/* Timeframe selector on its own row */}
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
          </GradientCard>
        </Animated.View>

        {pieChartSeries.length > 0 && (
          <View style={styles.chartContainer}>
            <PieChart 
              widthAndHeight={180} // Adjusted size to better fit typical card layouts
              series={pieChartSeries} // Pass only values to series prop
              cover={0.55} // Retained from your existing code for donut chart style
              // Note: react-native-pie-chart does not use the 'label' part of pieChartSeries directly.
              // This data is structured for potential use with other libraries or custom label rendering.
            />
          </View>
        )}
        
        {/* Asset Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Asset Distribution</Text>
          <View style={styles.distributionList}>
            {tokenData.map((token) => {
              // Use totalValueForDistribution for percentage calculation
              // Ensure totalValueForDistribution is not zero to avoid division by zero
              const percentage = totalValueForDistribution > 0 
                ? (token.balance * token.price / totalValueForDistribution) * 100 
                : 0;
              return (
                <GreyCard
                  key={token.address} 
                  style={styles.assetCard}
                  contentPaddingHorizontal={16} // Custom horizontal padding for asset items
                  contentPaddingVertical={12}   // Custom vertical padding for asset items
                  borderRadius={12} // Less rounded corners for these specific cards
                >
                  <TouchableOpacity 
                    style={styles.distributionItem}
                    onPress={() => router.push(`/token/${token.address}`)}
                  >
                    <View style={styles.distributionLeft}>
                      <View 
                        style={[
                          styles.colorIndicator, 
                          { backgroundColor: token.color }
                        ]} 
                      />
                      <Text style={styles.tokenName}>{token.name}</Text>
                    </View>
                    <Text style={styles.distributionPercentage}>
                      {percentage.toFixed(1)}%
                    </Text>
                  </TouchableOpacity>
                </GreyCard>
              );
            })}
          </View>
        </View>
        
        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.slice(0, 5).map((transaction: any, index: any) => (
            <TransactionItem 
              key={transaction.id} 
              transaction={transaction}
              tokenData={tokenData}
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
    // backgroundColor: colors.backgroundMedium, // Handled by GradientCard
    // borderRadius: 16, // Handled by GradientCard
    // padding: 16, // Handled by GradientCard's internal padding (default 24)
    margin: 16,
    marginTop: 8,
    // GradientCard handles its own width, maxWidth, and alignSelf
  },
  balanceRow: {
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
    textAlign: 'center', // Center the label
  },
  balanceValue: {
    fontSize: 32,
    color: colors.textPrimary,
    fontFamily: 'Inter-Bold',
    marginRight: 8, // Add space between balance and change percentage
  },
  balanceDetailRow: { // Renamed/repurposed from changeRow
    flexDirection: 'row',
    justifyContent: 'center', // Center the balance and change
    alignItems: 'center',
    marginBottom: 16, // Reduced from 24 to decrease gap
  },
  changeValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 6,
    // paddingVertical: 4,
    // paddingHorizontal: 4,
    width: '100%', // Make the selector span the full width
    justifyContent: 'space-between', // Distribute buttons within the selector
    // marginTop: 16, // Add margin if not using marginBottom on balanceDetailRow
  },
  timeframeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    height: 200, // Keep height to ensure space
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2, // Reduced from 16 to decrease gaps
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
    // marginBottom: 8, // No longer needed if assetCard has marginBottom
  },
  assetCard: { // Style for the GradientCard wrapping each asset item
    marginBottom: 8, // Space between asset cards
  },
  distributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingVertical: 12, // Padding now handled by GradientCard's contentPadding
    // borderBottomWidth: 1, // Handled by card separation
    // borderBottomColor: colors.backgroundLight, // Handled by card separation
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
  tokenName: {
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