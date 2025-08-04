import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Line,
  Text as SvgText,
  LinearGradient,
  Defs,
  Stop,
  G,
} from 'react-native-svg';

interface DataPoint {
  timestamp: number;
  price: number;
}

interface TokenPriceChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  timeframe: string;
  isPositive?: boolean;
}

const screenWidth = Dimensions.get('window').width;

const TokenPriceChart: React.FC<TokenPriceChartProps> = ({
  data,
  width = screenWidth - 32,
  height = 200,
  timeframe,
  isPositive = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.noDataText}>No chart data available</Text>
      </View>
    );
  }

  // Chart dimensions
  const padding = 20;
  const rightPadding = 60;
  const chartWidth = width - padding - rightPadding;
  const chartHeight = height - padding * 2 - 30;

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const scaleX = (index: number) => (index / (data.length - 1)) * chartWidth;
  const scaleY = (price: number) =>
    chartHeight - ((price - minPrice) / priceRange) * chartHeight;

  const generatePath = () => {
    if (data.length === 0) return '';

    let path = `M ${scaleX(0)} ${scaleY(data[0].price)}`;

    for (let i = 1; i < data.length; i++) {
      const x = scaleX(i);
      const y = scaleY(data[i].price);
      path += ` L ${x} ${y}`;
    }

    return path;
  };

  const generateFillPath = () => {
    if (data.length === 0) return '';

    let path = `M ${scaleX(0)} ${chartHeight}`;
    path += ` L ${scaleX(0)} ${scaleY(data[0].price)}`;

    for (let i = 1; i < data.length; i++) {
      const x = scaleX(i);
      const y = scaleY(data[i].price);
      path += ` L ${x} ${y}`;
    }

    path += ` L ${scaleX(data.length - 1)} ${chartHeight}`;
    path += ' Z';

    return path;
  };

  const formatYAxisPrice = (price: number) => {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`;
    } else if (price < 1) {
      return `$${price.toFixed(4)}`;
    } else if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(1)}K`;
    } else {
      return `$${price.toFixed(2)}`;
    }
  };

  const getYAxisLabels = () => {
    const labelCount = 5;
    const labels = [];

    for (let i = 0; i < labelCount; i++) {
      const ratio = i / (labelCount - 1);
      const price = minPrice + priceRange * (1 - ratio);
      const y = chartHeight * ratio;
      labels.push({ price, y });
    }

    return labels;
  };

  const yAxisLabels = getYAxisLabels();

  const formatTimeLabel = (timestamp: number, index: number) => {
    const date = new Date(timestamp);

    switch (timeframe) {
      case '1D':
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      case '1W':
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      case '1M':
      case '3M':
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      case '1Y':
        return date.toLocaleDateString('en-US', { month: 'short' });
      case 'ALL':
        return date.getFullYear().toString();
      default:
        return '';
    }
  };

  const getLabelsToShow = () => {
    const maxLabels = 5;
    if (data.length <= maxLabels) {
      return data.map((_, index) => index);
    }

    const indices = [];
    const step = Math.floor(data.length / (maxLabels - 1));

    for (let i = 0; i < maxLabels - 1; i++) {
      indices.push(i * step);
    }
    indices.push(data.length - 1);

    return indices;
  };

  const labelsToShow = getLabelsToShow();
  const lineColor = isPositive ? '#10b981' : '#ef4444';
  const gradientColorStart = isPositive ? '#10b981' : '#ef4444';

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop
              offset="0%"
              stopColor={gradientColorStart}
              stopOpacity="0.3"
            />
            <Stop
              offset="100%"
              stopColor={gradientColorStart}
              stopOpacity="0.05"
            />
          </LinearGradient>
        </Defs>

        <G x={padding} y={padding}>
          {yAxisLabels.map((label, index) => (
            <Line
              key={index}
              x1={0}
              y1={label.y}
              x2={chartWidth}
              y2={label.y}
              stroke="#333"
              strokeWidth="0.5"
              opacity="0.3"
            />
          ))}

          <Path d={generateFillPath()} fill="url(#priceGradient)" />

          <Path
            d={generatePath()}
            stroke={lineColor}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {yAxisLabels.map((label, index) => (
            <SvgText
              key={index}
              x={chartWidth + 10}
              y={label.y + 4}
              fontSize="11"
              fill="#9ca3af"
              textAnchor="start"
            >
              {formatYAxisPrice(label.price)}
            </SvgText>
          ))}

          {labelsToShow.map((dataIndex, index) => (
            <SvgText
              key={index}
              x={scaleX(dataIndex)}
              y={chartHeight + 20}
              fontSize="11"
              fill="#9ca3af"
              textAnchor="middle"
            >
              {formatTimeLabel(data[dataIndex].timestamp, dataIndex)}
            </SvgText>
          ))}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    color: '#9ca3af',
    fontSize: 14,
  },
});

export default TokenPriceChart;
