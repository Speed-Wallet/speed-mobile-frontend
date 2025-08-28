import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '@/constants/colors';

interface NumericKeyboardProps {
  onKeyPress: (key: string) => void;
  showDecimal?: boolean;
}

const NumericKeyboard: React.FC<NumericKeyboardProps> = ({
  onKeyPress,
  showDecimal = false,
}) => {
  return (
    <View style={styles.keyboard}>
      <View style={styles.keyboardGrid}>
        <View style={styles.keyboardRow}>
          <TouchableOpacity
            style={styles.keyboardKey}
            onPress={() => onKeyPress('1')}
          >
            <Text style={styles.keyboardKeyText}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keyboardKey}
            onPress={() => onKeyPress('2')}
          >
            <Text style={styles.keyboardKeyText}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keyboardKey}
            onPress={() => onKeyPress('3')}
          >
            <Text style={styles.keyboardKeyText}>3</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.keyboardRow}>
          <TouchableOpacity
            style={styles.keyboardKey}
            onPress={() => onKeyPress('4')}
          >
            <Text style={styles.keyboardKeyText}>4</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keyboardKey}
            onPress={() => onKeyPress('5')}
          >
            <Text style={styles.keyboardKeyText}>5</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keyboardKey}
            onPress={() => onKeyPress('6')}
          >
            <Text style={styles.keyboardKeyText}>6</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.keyboardRow}>
          <TouchableOpacity
            style={styles.keyboardKey}
            onPress={() => onKeyPress('7')}
          >
            <Text style={styles.keyboardKeyText}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keyboardKey}
            onPress={() => onKeyPress('8')}
          >
            <Text style={styles.keyboardKeyText}>8</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keyboardKey}
            onPress={() => onKeyPress('9')}
          >
            <Text style={styles.keyboardKeyText}>9</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.keyboardRow}>
          {showDecimal ? (
            <TouchableOpacity
              style={styles.keyboardKey}
              onPress={() => onKeyPress('.')}
            >
              <Text style={styles.keyboardKeyText}>.</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.keyboardKeyEmpty} />
          )}
          <TouchableOpacity
            style={styles.keyboardKey}
            onPress={() => onKeyPress('0')}
          >
            <Text style={styles.keyboardKeyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keyboardKey}
            onPress={() => onKeyPress('backspace')}
          >
            <Text style={styles.keyboardKeyText}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  keyboardGrid: {
    gap: 12,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  keyboardKey: {
    flex: 1,
    height: 50,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardKeyEmpty: {
    flex: 1,
  },
  keyboardKeyText: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
});

export default NumericKeyboard;
