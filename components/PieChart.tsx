import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CHART_SIZE = width * 0.6;
const INNER_RADIUS = CHART_SIZE * 0.3;

type PieChartProps = {
  data: any[];
};

const PieChart = ({ data }: PieChartProps) => {
  // Calculate total value
  const total = data.reduce((sum, item) => sum + (item.balance * item.price), 0);
  
  // Calculate angles for each segment
  let startAngle = 0;
  const segments = data.map(item => {
    const value = item.balance * item.price;
    const percentage = value / total;
    const angle = percentage * 360;
    const segment = {
      ...item,
      startAngle,
      angle,
      endAngle: startAngle + angle,
      percentage
    };
    startAngle += angle;
    return segment;
  });
  
  // Function to create SVG arc path
  const createArc = (startAngle: number, endAngle: number, radius: number) => {
    // Convert angles to radians
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    // Calculate start and end points
    const startX = radius + radius * Math.cos(startRad);
    const startY = radius + radius * Math.sin(startRad);
    const endX = radius + radius * Math.cos(endRad);
    const endY = radius + radius * Math.sin(endRad);
    
    // Create arc flag
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    // Create path
    return `M ${radius} ${radius} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
  };
  
  return (
    <View style={styles.container}>
      <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE * 2} ${CHART_SIZE * 2}`}>
        <G transform={`translate(${CHART_SIZE}, ${CHART_SIZE})`}>
          {segments.map((segment, index) => {
            const { startAngle, endAngle, color } = segment;
            const isSmallSegment = segment.angle < 20;
            
            // Calculate position for percentage label
            const labelAngle = (startAngle + endAngle) / 2 * Math.PI / 180;
            const labelRadius = CHART_SIZE * 0.65;
            const labelX = Math.cos(labelAngle - Math.PI / 2) * labelRadius;
            const labelY = Math.sin(labelAngle - Math.PI / 2) * labelRadius;
            
            return (
              <G key={segment.id}>
                <Path
                  d={createArc(startAngle, endAngle, CHART_SIZE)}
                  fill={color}
                />
                {/* Only show labels for segments large enough */}
                {!isSmallSegment && (
                  <SvgText
                    x={labelX}
                    y={labelY}
                    fontSize="24"
                    fontWeight="bold"
                    fill="#FFFFFF"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {`${Math.round(segment.percentage * 100)}%`}
                  </SvgText>
                )}
              </G>
            );
          })}
          
          {/* Inner circle for donut chart */}
          <Circle cx={0} cy={0} r={INNER_RADIUS} fill="#121212" />
        </G>
      </Svg>
    </View>
  );
};

// Simple circle component since we're not importing Circle from react-native-svg
const Circle = ({ cx, cy, r, fill }) => {
  return (
    <Path
      d={`M ${cx} ${cy} m -${r}, 0 a ${r},${r} 0 1,0 ${r*2},0 a ${r},${r} 0 1,0 -${r*2},0`}
      fill={fill}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PieChart;