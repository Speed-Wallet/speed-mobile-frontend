import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '@/constants/colors';

interface WordBoxProps {
  word: string;
  index: number;
  isVisible: boolean;
  isSelected?: boolean;
  displayNumber?: number | null;
  onPress?: (word: string) => void;
  variant?: 'display' | 'verification';
}

const WordBox: React.FC<WordBoxProps> = ({
  word,
  index,
  isVisible,
  isSelected = false,
  displayNumber,
  onPress,
  variant = 'display',
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress(word);
    }
  };

  if (variant === 'display') {
    return (
      <View style={styles.displayWordContainer}>
        <Text style={styles.displayWordNumber}>{index + 1}</Text>
        <Text style={styles.displayWord}>{isVisible ? word : '••••'}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.verificationWordItem,
        isSelected && styles.verificationWordItemSelected,
      ]}
      onPress={handlePress}
    >
      <Text
        style={[
          styles.verificationWordText,
          isSelected && styles.verificationWordTextSelected,
        ]}
      >
        {isVisible ? word : '••••'}
      </Text>
      {isSelected && displayNumber && (
        <Text style={styles.verificationWordNumber}>{displayNumber}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Display variant styles (matching ShowMnemonicStep)
  displayWordContainer: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  displayWordNumber: {
    color: '#9ca3af',
    fontSize: 12,
    marginRight: 8,
    opacity: 0.7,
  },
  displayWord: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },

  // Verification variant styles (updated to match display styling)
  verificationWordItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    minHeight: 44, // Fixed height to prevent expansion
  },
  verificationWordItemSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  verificationWordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1, // Take up available space
  },
  verificationWordTextSelected: {
    color: colors.primary,
  },
  verificationWordNumber: {
    color: '#9ca3af',
    fontSize: 12,
    marginLeft: 8,
    opacity: 0.7,
  },
});

export default WordBox;
