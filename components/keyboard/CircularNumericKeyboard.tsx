import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

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
    marginBottom: verticalScale(15),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: verticalScale(8),
  },
  key: {
    width: scale(65),
    height: scale(65),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: scale(20),
  },
  invisibleKey: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  keyText: {
    fontSize: moderateScale(22),
    fontWeight: '400',
    color: '#FFFFFF',
  },
  backspaceText: {
    fontSize: moderateScale(20),
    color: '#FFFFFF',
  },
});

export default CircularNumericKeyboard;
