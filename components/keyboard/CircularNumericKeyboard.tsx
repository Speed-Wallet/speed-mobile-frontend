import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface CircularNumericKeyboardProps {
  onKeyPress: (key: string) => void;
  scale?: number;
  showForgot?: boolean;
  onForgotPress?: () => void;
}

const CircularNumericKeyboard: React.FC<CircularNumericKeyboardProps> = ({
  onKeyPress,
  scale: scaleProp = 1,
  showForgot = false,
  onForgotPress,
}) => {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [showForgot ? 'forgot' : '', '0', 'backspace'],
  ];

  const handleKeyPress = (key: string) => {
    if (key !== '') {
      onKeyPress(key);
    }
  };

  const dynamicStyles = {
    container: {
      ...styles.container,
      // marginBottom: verticalScale(15 * scaleProp),
    },
    row: {
      ...styles.row,
      // marginVertical: verticalScale(8 * scaleProp),
    },
    key: {
      ...styles.key,
      width: scale(65 * scaleProp),
      height: scale(65 * scaleProp),
      marginHorizontal: scale(20 * scaleProp),
    },
    keyText: {
      ...styles.keyText,
      fontSize: moderateScale(22 * scaleProp),
    },
    backspaceText: {
      ...styles.backspaceText,
      fontSize: moderateScale(20 * scaleProp),
    },
  };

  return (
    <View style={dynamicStyles.container}>
      {keys.map((row, rowIndex) => (
        <View key={rowIndex} style={dynamicStyles.row}>
          {row.map((key, keyIndex) => (
            <TouchableOpacity
              key={keyIndex}
              style={[dynamicStyles.key, key === '' && styles.invisibleKey]}
              onPress={() =>
                key === 'forgot' ? onForgotPress?.() : handleKeyPress(key)
              }
              activeOpacity={0.6}
              disabled={key === ''}
            >
              {key === 'backspace' ? (
                <Text style={dynamicStyles.backspaceText}>⌫</Text>
              ) : key === 'forgot' ? (
                <Text style={styles.forgotText}>Forgot</Text>
              ) : (
                <Text style={dynamicStyles.keyText}>{key}</Text>
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
    // maxHeight: 300,
    // maxWidth: 400,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    // marginVertical: verticalScale(8),
  },
  key: {
    justifyContent: 'center',
    alignItems: 'center',
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
  forgotText: {
    fontSize: moderateScale(14),
    fontWeight: '400',
    color: '#FFFFFF',
  },
});

export default CircularNumericKeyboard;
