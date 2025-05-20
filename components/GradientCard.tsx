import React from 'react';
import { StyleSheet, View, Platform, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gradientColors?: string[];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
}

const GradientCard: React.FC<GradientCardProps> = ({
  children,
  style,
  gradientColors = ['#1A1A1A', '#121212'],
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 0, y: 1 },
}) => {
  return (
    <View style={[styles.cardContainer, style]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradientBackground}
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
    maxWidth: 400, 
    alignSelf: 'center',
  },
  gradientBackground: {
    padding: 24, // Default padding, can be overridden by children's layout
    width: '100%',
  },
});

export default GradientCard;
