import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const GradientBackground = () => {
  return (
    <LinearGradient
      colors={['#009FCC', '#0d2a35', '#0A0A0A']}
      locations={[0, 0.4, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
};

export default GradientBackground;
