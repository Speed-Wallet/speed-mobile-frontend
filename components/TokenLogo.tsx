import React from 'react';
import { View, ImageStyle, ViewStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';

// Local asset mapping
const localAssets = {
  'usdt-logo.png': require('../assets/images/usdt-logo.png'),
  // Add more local assets here as needed
};

interface TokenLogoProps {
  logoURI?: string;
  size?: number;
  style?: StyleProp<ImageStyle | ViewStyle>;
}

const TokenLogo: React.FC<TokenLogoProps> = ({ logoURI, size = 40, style }) => {
  const baseStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (!logoURI) {
    return (
      <View
        style={[baseStyle, { backgroundColor: '#2a2a2a' }, style as ViewStyle]}
      />
    );
  }

  const imageSource = logoURI.startsWith('local://')
    ? localAssets[logoURI.replace('local://', '') as keyof typeof localAssets]
    : { uri: logoURI };

  return (
    <Image
      source={imageSource}
      style={[baseStyle, style as ImageStyle]}
      contentFit="contain"
    />
  );
};

export default TokenLogo;
