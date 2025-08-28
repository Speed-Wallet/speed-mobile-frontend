import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

interface CircularNumericKeyboardProps {
  onKeyPress: (key: string) => void;
}

const CircularNumericKeyboard: React.FC<CircularNumericKeyboardProps> = ({
  onKeyPress,
}) => {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'backspace'],
  ];

  const handleKeyPress = (key: string) => {
    if (key !== '') {
      onKeyPress(key);
    }
  };

  return (
    <View style={styles.container}>
      {keys.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key, keyIndex) => (
            <TouchableOpacity
              key={keyIndex}
              style={[styles.key, key === '' && styles.invisibleKey]}
              onPress={() => handleKeyPress(key)}
              activeOpacity={0.6}
              disabled={key === ''}
            >
              {key === 'backspace' ? (
                <Text style={styles.backspaceText}>⌫</Text>
              ) : (
                <Text style={styles.keyText}>{key}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
  },
  key: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  invisibleKey: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  backspaceText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
});

export default CircularNumericKeyboard;
