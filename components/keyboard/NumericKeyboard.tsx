import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';

interface NumericKeyboardProps {
  onKeyPress: (key: string) => void;
  activeInput: 'from' | 'to' | null;
}

const NumericKeyboard: React.FC<NumericKeyboardProps> = ({
  onKeyPress,
  activeInput,
}) => {
  return (
    <View style={styles.inlineKeyboard}>
      <View style={styles.keyboardGrid}>
        <View style={styles.keyboardRow}>
          <TouchableOpacity
            style={[
              styles.keyboardKey,
              !activeInput && styles.keyboardKeyDisabled,
            ]}
            onPress={() => onKeyPress('1')}
            disabled={!activeInput}
          >
            <Text
              style={[
                styles.keyboardKeyText,
                !activeInput && styles.keyboardKeyTextDisabled,
              ]}
            >
              1
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.keyboardKey,
              !activeInput && styles.keyboardKeyDisabled,
            ]}
            onPress={() => onKeyPress('2')}
            disabled={!activeInput}
          >
            <Text
              style={[
                styles.keyboardKeyText,
                !activeInput && styles.keyboardKeyTextDisabled,
              ]}
            >
              2
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.keyboardKey,
              !activeInput && styles.keyboardKeyDisabled,
            ]}
            onPress={() => onKeyPress('3')}
            disabled={!activeInput}
          >
            <Text
              style={[
                styles.keyboardKeyText,
                !activeInput && styles.keyboardKeyTextDisabled,
              ]}
            >
              3
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.keyboardRow}>
          <TouchableOpacity
            style={[
              styles.keyboardKey,
              !activeInput && styles.keyboardKeyDisabled,
            ]}
            onPress={() => onKeyPress('4')}
            disabled={!activeInput}
          >
            <Text
              style={[
                styles.keyboardKeyText,
                !activeInput && styles.keyboardKeyTextDisabled,
              ]}
            >
              4
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.keyboardKey,
              !activeInput && styles.keyboardKeyDisabled,
            ]}
            onPress={() => onKeyPress('5')}
            disabled={!activeInput}
          >
            <Text
              style={[
                styles.keyboardKeyText,
                !activeInput && styles.keyboardKeyTextDisabled,
              ]}
            >
              5
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.keyboardKey,
              !activeInput && styles.keyboardKeyDisabled,
            ]}
            onPress={() => onKeyPress('6')}
            disabled={!activeInput}
          >
            <Text
              style={[
                styles.keyboardKeyText,
                !activeInput && styles.keyboardKeyTextDisabled,
              ]}
            >
              6
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.keyboardRow}>
          <TouchableOpacity
            style={[
              styles.keyboardKey,
              !activeInput && styles.keyboardKeyDisabled,
            ]}
            onPress={() => onKeyPress('7')}
            disabled={!activeInput}
          >
            <Text
              style={[
                styles.keyboardKeyText,
                !activeInput && styles.keyboardKeyTextDisabled,
              ]}
            >
              7
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.keyboardKey,
              !activeInput && styles.keyboardKeyDisabled,
            ]}
            onPress={() => onKeyPress('8')}
            disabled={!activeInput}
          >
            <Text
              style={[
                styles.keyboardKeyText,
                !activeInput && styles.keyboardKeyTextDisabled,
              ]}
            >
              8
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.keyboardKey,
              !activeInput && styles.keyboardKeyDisabled,
            ]}
            onPress={() => onKeyPress('9')}
            disabled={!activeInput}
          >
            <Text
              style={[
                styles.keyboardKeyText,
                !activeInput && styles.keyboardKeyTextDisabled,
              ]}
            >
              9
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.keyboardRow}>
          <TouchableOpacity
            style={[
              styles.keyboardKey,
              !activeInput && styles.keyboardKeyDisabled,
            ]}
            onPress={() => onKeyPress('.')}
            disabled={!activeInput}
          >
            <Text
              style={[
                styles.keyboardKeyText,
                !activeInput && styles.keyboardKeyTextDisabled,
              ]}
            >
              .
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.keyboardKey,
              !activeInput && styles.keyboardKeyDisabled,
            ]}
            onPress={() => onKeyPress('0')}
            disabled={!activeInput}
          >
            <Text
              style={[
                styles.keyboardKeyText,
                !activeInput && styles.keyboardKeyTextDisabled,
              ]}
            >
              0
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.keyboardKey,
              !activeInput && styles.keyboardKeyDisabled,
            ]}
            onPress={() => onKeyPress('backspace')}
            disabled={!activeInput}
          >
            <Text
              style={[
                styles.keyboardKeyText,
                !activeInput && styles.keyboardKeyTextDisabled,
              ]}
            >
              ⌫
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inlineKeyboard: {
    flex: 1, // Fill remaining horizontal space in the parent container
    maxWidth: 500,
  },
  keyboardGrid: {
    marginBottom: 0,
    flex: 1, // Fill the full height of the keyboard container
    justifyContent: 'space-around', // Distribute rows evenly vertically
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  keyboardKey: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: scale(6),
    alignItems: 'center',
  },
  keyboardKeyText: {
    fontSize: moderateScale(26),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  keyboardKeyDisabled: {
    backgroundColor: 'transparent',
    opacity: 0.5,
  },
  keyboardKeyTextDisabled: {
    color: colors.textSecondary,
    opacity: 0.5,
  },
});

export default NumericKeyboard;
