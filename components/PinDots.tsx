import React from 'react';
import { View, StyleSheet } from 'react-native';
import { scale } from 'react-native-size-matters';

interface PinDotsProps {
  pinLength: number;
  maxLength?: number;
  dotSize?: number;
  gap?: number;
  dotColor?: string;
  filledDotColor?: string;
  borderColor?: string;
  filledBorderColor?: string;
}

const PinDots: React.FC<PinDotsProps> = ({
  pinLength,
  maxLength = 6,
  dotSize = 16,
  gap = 12,
  dotColor = '#333333',
  filledDotColor = '#00CFFF',
  borderColor = '#555555',
  filledBorderColor = '#00CFFF',
}) => {
  return (
    <View style={[styles.pinDots, { gap: scale(gap) }]}>
      {Array.from({ length: maxLength }, (_, index) => (
        <View
          key={index}
          style={[
            styles.pinDot,
            {
              width: scale(dotSize),
              height: scale(dotSize),
              borderRadius: scale(dotSize / 2),
              backgroundColor: index < pinLength ? filledDotColor : dotColor,
              borderColor: index < pinLength ? filledBorderColor : borderColor,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  pinDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {
    borderWidth: 1,
  },
});

export default PinDots;
