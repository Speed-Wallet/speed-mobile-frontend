import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, ArrowUpRight, ArrowRightLeft, ArrowDownLeft } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { useState } from 'react';
import BackButton from '@/components/BackButton';

const screenWidth = Dimensions.get('window').width;

const chartData = {
  labels: ['0:00', '1:00', '2:00'],
  datasets: [
    {
      data: [19.43, 24.77, 30.11, 35.46, 40.80],
      color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
      strokeWidth: 2,
    },
  ],
};

const chartConfig = {
  backgroundColor: '#2a2a2a',
  backgroundGradientFrom: '#2a2a2a',
  backgroundGradientTo: '#1a1a1a',
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#6366f1',
  },
};

const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

const timeframeChanges: { [key: string]: string } = {
  '1D': '-3.1%',
  '1W': '+1.2%',
  '1M': '-0.8%',
  '3M': '+4.5%',
  '1Y': '+12.3%',
  'ALL': '+156.7%',
};

const statsData = [
  {
    label: 'Market Cap',
    value: '$164,164.76',
  },
  {
    label: 'Volume (24h)',
    value: '$23,049.91',
  },
  {
    label: 'Circulating Supply',
    value: '641,264.285 USDC',
  },
  {
    label: 'Max Supply',
    value: '401,051.089 USDC',
  },
];

export default function HomeScreen() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');

  const currentChange = timeframeChanges[selectedTimeframe];
  const isNegative = currentChange.startsWith('-');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>USDC</Text>
            <Text style={styles.headerSubtitle}>USDC</Text>
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <Star size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Price Section */}
        <View style={styles.priceSection}>
          <Text style={styles.price}>$440.73</Text>
          <Text style={[styles.priceChange, { color: isNegative ? '#ef4444' : '#10b981' }]}>
            {currentChange}
          </Text>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={screenWidth - 32}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLabels={false}
            withHorizontalLabels={true}
          />
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
              onPress={() => setSelectedTimeframe(timeframe)}>
              <Text
                style={[
                  styles.timeframeText,
                  selectedTimeframe === timeframe && styles.timeframeTextActive,
                ]}>
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
              <View key={index} style={[styles.statRow, index === statsData.length - 1 && styles.lastStatRow]}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* About USDC */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About USDC</Text>
          <Text style={styles.description}>
            USD Coin (USDC) is a fully-backed dollar stablecoin. USDC is issued by regulated and licensed financial institutions that maintain full reserves of the equivalent fiat currency.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActionContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <ArrowRightLeft size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Trade</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <ArrowUpRight size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <ArrowDownLeft size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Receive</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  priceSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  priceChange: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chart: {
    borderRadius: 16,
  },
  timeframeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 32,
    gap: 8,
    justifyContent: 'center',
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  timeframeButtonActive: {
    backgroundColor: '#6366f1',
  },
  timeframeText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  timeframeTextActive: {
    color: '#fff',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  aboutSection: {
    paddingHorizontal: 16,
    marginBottom: 120, // Extra space for bottom buttons
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 20,
  },
  statsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  lastStatRow: {
    borderBottomWidth: 0,
  },
  statLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statValue: {
    fontSize: 14,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});