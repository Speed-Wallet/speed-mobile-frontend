import React from 'react';
import { ImageStyle } from 'react-native';
import { Image } from 'expo-image';

// Local asset mapping
const localAssets = {
  'usdt-logo.png': require('../assets/images/usdt-logo.png'),
  // Add more local assets here as needed
};

interface TokenLogoProps {
  logoURI?: string;
  size?: number;
  style?: ImageStyle;
}

const TokenLogo: React.FC<TokenLogoProps> = ({ logoURI, size = 40, style }) => {
  if (!logoURI) {
    return null;
  }

  const imageSource = logoURI.startsWith('local://')
    ? localAssets[logoURI.replace('local://', '') as keyof typeof localAssets]
    : { uri: logoURI };

  return (
    <Image
      source={imageSource}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      contentFit="contain"
    />
  );
};

export default TokenLogo;
