import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Animated,
  TextInputProps,
} from 'react-native';
import { scale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';

interface CodeInputProps {
  length: number;
  value: string;
  onChangeText: (text: string) => void;
  isError?: boolean;
  editable?: boolean;
  autoFocus?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  displayMode?: 'text' | 'dot';
  charAnimations: Animated.Value[];
  shakeAnimation: Animated.Value;
}

const CodeInput: React.FC<CodeInputProps> = ({
  length,
  value,
  onChangeText,
  isError = false,
  editable = true,
  autoFocus = true,
  keyboardType = 'default',
  displayMode = 'text',
  charAnimations,
  shakeAnimation,
}) => {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    // Filter based on keyboard type
    let filtered: string;
    if (keyboardType === 'numeric') {
      filtered = text.replace(/[^0-9]/g, '');
    } else {
      filtered = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    }

    if (filtered.length === 0) {
      // Handle backspace - remove character at current index and focus previous
      const newCode = value.slice(0, index) + value.slice(index + 1);
      onChangeText(newCode);
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      // Reset animation for removed character
      charAnimations[index].setValue(0);
    } else {
      // Handle input - add character and focus next
      const char = filtered[0];
      const newCode = value.slice(0, index) + char + value.slice(index + 1);

      // Trigger animation for newly added character
      charAnimations[index].setValue(20); // Start from below
      Animated.spring(charAnimations[index], {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();

      onChangeText(newCode);

      // Focus next input if not at the end
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      // If backspace on empty field, focus previous
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <Animated.View
      style={[
        styles.codeContainer,
        {
          transform: [{ translateX: shakeAnimation }],
        },
      ]}
    >
      {Array.from({ length }).map((_, index) => {
        const char = value[index];
        const isFilled = char !== undefined;
        const isActive = index === value.length && !isError;

        return (
          <View
            key={index}
            style={[
              styles.codeSlot,
              isActive && styles.codeSlotActive,
              isError && styles.codeSlotError,
            ]}
          >
            <TextInput
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={styles.codeInput}
              value={char || ''}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              autoCapitalize={
                keyboardType === 'numeric' ? 'none' : 'characters'
              }
              autoCorrect={false}
              maxLength={1}
              editable={editable}
              keyboardType={keyboardType}
              autoFocus={autoFocus && index === 0}
              selectTextOnFocus={false}
              textAlign="center"
            />
            {isFilled && (
              <View style={styles.codeCharContainer} pointerEvents="none">
                {displayMode === 'dot' ? (
                  <Animated.View
                    style={[
                      styles.pinDot,
                      {
                        transform: [{ translateY: charAnimations[index] }],
                      },
                    ]}
                  />
                ) : (
                  <Animated.Text
                    style={[
                      styles.codeChar,
                      {
                        transform: [{ translateY: charAnimations[index] }],
                      },
                    ]}
                  >
                    {char}
                  </Animated.Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(8),
    paddingHorizontal: scale(20),
    width: '100%',
  },
  codeSlot: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: scale(60),
    borderRadius: moderateScale(12),
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  codeSlotActive: {
    borderColor: colors.primary,
  },
  codeSlotError: {
    borderColor: colors.error,
    backgroundColor: '#2a1a1a',
  },
  codeInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    fontSize: moderateScale(24),
    fontFamily: 'Inter-SemiBold',
    color: 'transparent',
    textAlign: 'center',
  },
  codeCharContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeChar: {
    fontSize: moderateScale(24),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  pinDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: colors.textPrimary,
  },
});

export default CodeInput;
