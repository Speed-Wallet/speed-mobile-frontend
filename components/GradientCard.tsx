import React from 'react';
import { StyleSheet, View, Platform, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gradientColors?: readonly [string, string, ...string[]];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  contentPaddingHorizontal?: number; // New prop for horizontal content padding
  contentPaddingVertical?: number; // New prop for vertical content padding
}

const GradientCard: React.FC<GradientCardProps> = ({
  children,
  style,
  gradientColors = ['#1A1A1A', '#121212'],
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 0, y: 1 },
  contentPaddingHorizontal = 24, // Default horizontal content padding
  contentPaddingVertical = 24, // Default vertical content padding
}) => {
  return (
    <View style={[styles.cardContainer, style]}>
      <LinearGradient
        colors={gradientColors}
        style={[
          styles.gradientBackground,
          {
            paddingHorizontal: contentPaddingHorizontal,
            paddingVertical: contentPaddingVertical,
          },
        ]} // Apply contentPadding here
        start={gradientStart}
        end={gradientEnd}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.5,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  gradientBackground: {
    width: '100%',
  },
});

export default GradientCard;
