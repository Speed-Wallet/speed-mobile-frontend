import React from 'react';
import { Image, StyleSheet, ViewStyle } from 'react-native';

// Local asset mapping
const localAssets = {
  'usdt-logo.png': require('../assets/images/usdt-logo.png'),
  // Add more local assets here as needed
};

interface TokenLogoProps {
  logoURI?: string;
  size?: number;
  style?: ViewStyle;
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
      style={[
        styles.logo,
        { width: size, height: size, borderRadius: size / 2 },
        style
      ]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  logo: {
    // Default styles that can be overridden
  },
});

export default TokenLogo;
