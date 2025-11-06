import React from 'react';
import {
  View,
  ImageStyle,
  ViewStyle,
  StyleProp,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { AlertCircle } from 'lucide-react-native';

// Local asset mapping
const localAssets = {
  'usdt-logo.png': require('../assets/images/usdt-logo.png'),
  // Add more local assets here as needed
};

interface TokenLogoProps {
  logoURI?: string;
  size?: number;
  style?: StyleProp<ImageStyle | ViewStyle>;
  hasWarning?: boolean; // Show red exclamation mark
}

const TokenLogo: React.FC<TokenLogoProps> = ({
  logoURI,
  size = 40,
  style,
  hasWarning = false,
}) => {
  const baseStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const warningSize = size * 0.5;
  const warningPosition = size * 0.65;

  if (!logoURI) {
    return (
      <View style={{ position: 'relative' }}>
        <View
          style={[
            baseStyle,
            { backgroundColor: '#2a2a2a' },
            style as ViewStyle,
          ]}
        />
        {hasWarning && (
          <View
            style={[
              styles.warningBadge,
              {
                width: warningSize,
                height: warningSize,
                borderRadius: warningSize / 2,
                bottom: -2,
                right: -2,
              },
            ]}
          >
            <AlertCircle
              size={warningSize}
              color="#fff"
              fill="#ef4444"
              strokeWidth={2}
            />
          </View>
        )}
      </View>
    );
  }

  const imageSource = logoURI.startsWith('local://')
    ? localAssets[logoURI.replace('local://', '') as keyof typeof localAssets]
    : { uri: logoURI };

  return (
    <View style={{ position: 'relative' }}>
      <Image
        source={imageSource}
        style={[baseStyle, style as ImageStyle]}
        contentFit="contain"
      />
      {hasWarning && (
        <View
          style={[
            styles.warningBadge,
            {
              width: warningSize,
              height: warningSize,
              borderRadius: warningSize / 2,
              bottom: -2,
              right: -2,
            },
          ]}
        >
          <AlertCircle
            size={warningSize}
            color="#fff"
            fill="#ef4444"
            strokeWidth={2}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  warningBadge: {
    position: 'absolute',
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
});

export default TokenLogo;
