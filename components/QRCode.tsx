import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

type QRCodeProps = {
  value: string;
  size: number;
  color?: string;
  backgroundColor?: string;
  logoUrl?: string;
};

const QRCode = ({ 
  value, 
  size, 
  color = '#000000', 
  backgroundColor = '#FFFFFF',
  logoUrl
}: QRCodeProps) => {
  // This is a simplified mockup of a QR code
  // In a real app, this would use a proper QR code generator library
  
  const moduleCount = 25; // Number of modules (rows/columns) in the QR code
  const moduleSize = size / moduleCount;
  const logoSize = size * 0.2;
  
  // Mock QR code pattern - this would be generated from the value in a real app
  const modules = Array(moduleCount).fill(0).map(() => 
    Array(moduleCount).fill(0).map(() => Math.random() > 0.7)
  );
  
  // Add finder patterns (the three square patterns in corners)
  const addFinderPattern = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        // Outer border
        if (r === 0 || r === 6 || c === 0 || c === 6) {
          modules[row + r][col + c] = true;
        }
        // Inner square
        else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          modules[row + r][col + c] = true;
        }
        // White spacing
        else {
          modules[row + r][col + c] = false;
        }
      }
    }
  };
  
  // Add finder patterns
  addFinderPattern(0, 0); // Top-left
  addFinderPattern(0, moduleCount - 7); // Top-right
  addFinderPattern(moduleCount - 7, 0); // Bottom-left
  
  // Clear center for logo
  if (logoUrl) {
    const logoModules = Math.ceil(logoSize / moduleSize);
    const startIndex = Math.floor((moduleCount - logoModules) / 2);
    
    for (let r = 0; r < logoModules; r++) {
      for (let c = 0; c < logoModules; c++) {
        if (startIndex + r < moduleCount && startIndex + c < moduleCount) {
          modules[startIndex + r][startIndex + c] = false;
        }
      }
    }
  }
  
  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      <Svg width={size} height={size}>
        {modules.map((row, rowIndex) => 
          row.map((isActive, colIndex) => 
            isActive ? (
              <Rect
                key={`${rowIndex}-${colIndex}`}
                x={colIndex * moduleSize}
                y={rowIndex * moduleSize}
                width={moduleSize}
                height={moduleSize}
                fill={color}
              />
            ) : null
          )
        )}
      </Svg>
      
      {logoUrl && (
        <Image
          source={{ uri: logoUrl }}
          style={[
            styles.logo, 
            { 
              width: logoSize, 
              height: logoSize,
              borderRadius: logoSize / 2 
            }
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    padding: 2,
  }
});

export default QRCode;