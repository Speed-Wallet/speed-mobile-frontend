import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { scale, verticalScale } from 'react-native-size-matters';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  State,
} from 'react-native-gesture-handler';
import Svg, {
  Path,
  Line,
  Text as SvgText,
  LinearGradient,
  Defs,
  Stop,
  G,
  Circle,
} from 'react-native-svg';
import {
  calculatePaddingMultiplier,
  calculateLinearScale,
  calculateLogScale,
} from '@/utils/chartUtils';
import { CHART_HORIZONTAL_MARGIN } from '@/constants/layout';
import colors from '@/constants/colors';

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
  onInteraction?: (
    data: {
      selectedPrice: number;
      priceChange: number;
      percentageChange: number;
      timestamp: number;
      isInteracting: boolean;
    } | null,
  ) => void;
}

const screenWidth = Dimensions.get('window').width;

const TokenPriceChart: React.FC<TokenPriceChartProps> = ({
  data,
  width = screenWidth - CHART_HORIZONTAL_MARGIN * 2, // Account for container's horizontal margins
  height = 250,
  timeframe,
  isPositive = true,
  onInteraction,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  // Log initial data for debugging
  console.log('[TokenPriceChart] Data received:', {
    dataLength: data?.length || 0,
    timeframe,
    firstPoint: data?.[0],
    lastPoint: data?.[data?.length - 1],
    allPoints: data,
  });

  if (!data || data.length === 0) {
    console.log('[TokenPriceChart] No data available');
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.noDataText}>No chart data available</Text>
      </View>
    );
  }

  // Need at least 2 points to draw a line chart
  if (data.length < 2) {
    console.log('[TokenPriceChart] Insufficient data points:', data.length);
    return (
      <View style={[styles.container, styles.centerContent, { width, height }]}>
        <Text style={styles.noDataText}>Not enough chart data available</Text>
        <Text style={styles.noDataSubtext}>
          Need more historical data to display chart
        </Text>
      </View>
    );
  }

  // Chart dimensions
  const padding = 0;
  const rightPadding = 0; // No extra space needed
  const topPadding = 10;
  const chartWidth = width - padding - rightPadding;
  const chartHeight = height - padding - topPadding;

  // Extract prices from data
  const prices = data.map((item) => item.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  console.log('[TokenPriceChart] Price analysis:', {
    numPoints: prices.length,
    minPrice,
    maxPrice,
    priceRange,
    prices: prices.slice(0, 10), // First 10 prices
  });
  const avgPrice = (minPrice + maxPrice) / 2;

  // Calculate volatility as percentage of average price
  const volatilityPercentage = (priceRange / avgPrice) * 100;

  console.log('[TokenPriceChart] Volatility:', {
    avgPrice,
    volatilityPercentage,
  });

  // Calculate adaptive padding multiplier
  const paddingMultiplier = calculatePaddingMultiplier(
    volatilityPercentage,
    avgPrice,
  );

  // Calculate linear scale parameters
  const { paddedMinPrice, paddedPriceRange, minPaddedRange } =
    calculateLinearScale(
      minPrice,
      maxPrice,
      priceRange,
      volatilityPercentage,
      paddingMultiplier,
    );

  // Scale functions
  const scaleX = (index: number) => (index / (data.length - 1)) * chartWidth;
  let scaleY: (price: number) => number;

  // Logarithmic scale option: Enable for very low prices or high vol to focus on % changes
  const useLogScale = avgPrice < 0.001 || volatilityPercentage > 20;

  console.log('[TokenPriceChart] Scale decision:', {
    useLogScale,
    avgPrice,
    volatilityPercentage,
  });

  if (useLogScale) {
    const { paddedLogMin, paddedLogRange } = calculateLogScale(
      minPrice,
      maxPrice,
      volatilityPercentage,
      paddingMultiplier,
      avgPrice,
      minPaddedRange,
    );
    scaleY = (price: number) =>
      chartHeight -
      ((Math.log(price) - paddedLogMin) / paddedLogRange) * chartHeight;
  } else {
    // Linear scale for normal cases
    scaleY = (price: number) =>
      chartHeight - ((price - paddedMinPrice) / paddedPriceRange) * chartHeight;
  }

  // Get the first price (starting point) for percentage change calculation
  const firstPrice = data[0]?.price || 0;

  // Calculate price change and percentage when a point is selected
  const getPriceChangeInfo = (selectedIndex: number) => {
    const selectedPrice = data[selectedIndex].price;
    const priceChange = selectedPrice - firstPrice;
    const percentageChange = (priceChange / firstPrice) * 100;

    return {
      selectedPrice,
      priceChange,
      percentageChange,
      isPositive: priceChange >= 0,
    };
  };

  // Generate path for the line with dynamic coloring
  const generatePaths = (splitIndex: number | null = null) => {
    if (data.length === 0)
      return { beforePath: '', afterPath: '', fullPath: '' };

    console.log('[TokenPriceChart] Generating paths:', {
      dataLength: data.length,
      splitIndex,
      chartWidth,
      chartHeight,
      samplePoints: data.slice(0, 3).map((d, i) => ({
        index: i,
        price: d.price,
        x: scaleX(i),
        y: scaleY(d.price),
      })),
    });

    let beforePath = '';
    let afterPath = '';
    let fullPath = `M ${scaleX(0)} ${scaleY(data[0].price)}`;

    if (splitIndex !== null && splitIndex > 0) {
      // Before selected point
      beforePath = `M ${scaleX(0)} ${scaleY(data[0].price)}`;
      for (let i = 1; i <= splitIndex; i++) {
        const x = scaleX(i);
        const y = scaleY(data[i].price);
        beforePath += ` L ${x} ${y}`;
      }

      // After selected point
      if (splitIndex < data.length - 1) {
        afterPath = `M ${scaleX(splitIndex)} ${scaleY(data[splitIndex].price)}`;
        for (let i = splitIndex + 1; i < data.length; i++) {
          const x = scaleX(i);
          const y = scaleY(data[i].price);
          afterPath += ` L ${x} ${y}`;
        }
      }
    }

    // Full path for when not interacting
    for (let i = 1; i < data.length; i++) {
      const x = scaleX(i);
      const y = scaleY(data[i].price);
      fullPath += ` L ${x} ${y}`;
    }

    return { beforePath, afterPath, fullPath };
  };

  // Generate path for gradient fill
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

  // Format price change for display
  const formatPriceChange = (priceChange: number) => {
    const sign = priceChange >= 0 ? '+' : '';
    const absChange = Math.abs(priceChange);
    if (absChange < 0.01) {
      return `${sign}$${absChange.toFixed(6)}`;
    } else if (absChange < 1) {
      return `${sign}$${absChange.toFixed(4)}`;
    } else {
      return `${sign}$${absChange.toFixed(2)}`;
    }
  };

  // Format percentage change for display
  const formatPercentageChange = (percentageChange: number) => {
    const sign = percentageChange >= 0 ? '+' : '';
    return `${sign}${percentageChange.toFixed(2)}%`;
  };

  // Format time and date for display
  const formatTimeAndDate = (timestamp: number) => {
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

  // Format price for Y-axis labels
  const formatYAxisPrice = (price: number) => {
    if (price < 0.01) {
      return `${price.toFixed(6)}`;
    } else if (price < 1) {
      return `${price.toFixed(4)}`;
    } else if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K`;
    } else {
      return `${price.toFixed(2)}`;
    }
  };

  // Get Y-axis label positions and values
  const getYAxisLabels = () => {
    const labelCount = 5;
    const labels = [];

    for (let i = 0; i < labelCount; i++) {
      const ratio = i / (labelCount - 1);
      const price = minPrice + priceRange * (1 - ratio); // Inverted because Y increases downward
      const y = chartHeight * ratio;
      labels.push({ price, y });
    }

    return labels;
  };

  const yAxisLabels = getYAxisLabels();

  // Format time labels based on timeframe
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

  // Select which labels to show (max 5 labels)
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
    indices.push(data.length - 1); // Always include the last point

    return indices;
  };

  // Handle pan gesture
  const onGestureEvent = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      const { x } = event.nativeEvent;
      const chartX = x - padding;

      if (chartX >= 0 && chartX <= chartWidth) {
        const index = Math.round((chartX / chartWidth) * (data.length - 1));
        const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
        setSelectedIndex(clampedIndex);

        // Send interaction data to parent
        if (onInteraction) {
          const changeInfo = getPriceChangeInfo(clampedIndex);
          onInteraction({
            selectedPrice: changeInfo.selectedPrice,
            priceChange: changeInfo.priceChange,
            percentageChange: changeInfo.percentageChange,
            timestamp: data[clampedIndex].timestamp,
            isInteracting: true,
          });
        }
      }
    },
    [chartWidth, data.length, padding, onInteraction],
  );

  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.state === State.BEGAN) {
        setIsInteracting(true);
      } else if (
        event.nativeEvent.state === State.END ||
        event.nativeEvent.state === State.CANCELLED
      ) {
        setIsInteracting(false);
        setSelectedIndex(null);

        // Reset interaction in parent
        if (onInteraction) {
          onInteraction(null);
        }
      }
    },
    [onInteraction],
  );

  const labelsToShow = getLabelsToShow();
  const paths = generatePaths(selectedIndex);

  // Determine colors based on price movement
  const getLineColors = () => {
    if (selectedIndex !== null) {
      const changeInfo = getPriceChangeInfo(selectedIndex);
      return {
        beforeColor: changeInfo.isPositive ? '#10b981' : '#ef4444', // Green if up, red if down
        afterColor: '#6b7280', // Gray for after
      };
    }
    return {
      beforeColor: isPositive ? '#10b981' : '#ef4444',
      afterColor: isPositive ? '#10b981' : '#ef4444',
    };
  };

  const { beforeColor, afterColor } = getLineColors();
  const displayColor =
    isInteracting && selectedIndex !== null
      ? beforeColor
      : isPositive
        ? '#10b981'
        : '#ef4444';
  const gradientColorStart = displayColor;

  // Get price change info for selected point
  const selectedPriceChangeInfo =
    selectedIndex !== null ? getPriceChangeInfo(selectedIndex) : null;

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Date label removed - now displayed in price section above chart */}

      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <View style={{ flex: 1 }}>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient
                id="priceGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <Stop
                  offset="0%"
                  stopColor={gradientColorStart}
                  stopOpacity="0.3"
                />
                <Stop
                  offset="100%"
                  stopColor={colors.backgroundDark}
                  stopOpacity="1"
                />
              </LinearGradient>
            </Defs>

            <G x={padding} y={topPadding}>
              <Path d={generateFillPath()} fill="url(#priceGradient)" />

              {isInteracting && selectedIndex !== null ? (
                <>
                  {paths.beforePath && (
                    <Path
                      d={paths.beforePath}
                      stroke={beforeColor}
                      strokeWidth={scale(2)}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {paths.afterPath && (
                    <Path
                      d={paths.afterPath}
                      stroke={afterColor}
                      strokeWidth={scale(2)}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  <Circle
                    cx={scaleX(selectedIndex)}
                    cy={scaleY(data[selectedIndex].price)}
                    r={scale(4)}
                    fill={beforeColor}
                    stroke="#fff"
                    strokeWidth={scale(2)}
                  />

                  <Line
                    x1={scaleX(selectedIndex)}
                    y1={0}
                    x2={scaleX(selectedIndex)}
                    y2={chartHeight}
                    stroke={beforeColor}
                    strokeWidth={scale(1)}
                    opacity="0.5"
                    strokeDasharray="4,4"
                  />
                </>
              ) : (
                <Path
                  d={paths.fullPath}
                  stroke={displayColor}
                  strokeWidth={scale(2)}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </G>
          </Svg>
        </View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: '#9ca3af',
    fontSize: scale(14),
    textAlign: 'center',
  },
  noDataSubtext: {
    color: '#6b7280',
    fontSize: scale(12),
    marginTop: verticalScale(4),
    textAlign: 'center',
  },
  timeDisplay: {
    position: 'absolute',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: '#444',
    zIndex: 10,
  },
  timeText: {
    fontSize: scale(11),
    color: '#fff',
    fontWeight: '500',
  },
});

export default TokenPriceChart;
