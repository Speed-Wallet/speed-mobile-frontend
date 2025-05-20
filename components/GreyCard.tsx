import React from 'react';
import { StyleSheet, View, Platform, ViewStyle, StyleProp } from 'react-native';
import colors from '@/constants/colors'; // Assuming colors.backgroundMedium is your desired grey

interface GreyCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentPaddingHorizontal?: number;
  contentPaddingVertical?: number;
  backgroundColor?: string;
  borderRadius?: number;
}

const GreyCard: React.FC<GreyCardProps> = ({
  children,
  style,
  contentPaddingHorizontal = 16, // Default horizontal content padding
  contentPaddingVertical = 16,   // Default vertical content padding
  backgroundColor = colors.backgroundMedium,
  borderRadius = 16,
}) => {
  return (
    <View 
      style={[
        styles.cardContainer, 
        { 
          backgroundColor, 
          borderRadius,
          paddingHorizontal: contentPaddingHorizontal,
          paddingVertical: contentPaddingVertical,
        }, 
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    // Common container properties like shadow could be added here if desired
    // For now, it's a simple container with background, borderRadius, and padding
    // Example shadow (optional, uncomment and adjust if needed):
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.2,
    // shadowRadius: 4,
    // elevation: 3,
  },
});

export default GreyCard;
