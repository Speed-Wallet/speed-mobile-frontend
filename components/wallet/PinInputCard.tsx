import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';

interface PinInputCardProps {
  pin: string;
  onPinChange: (pin: string) => void;
  headerIcon: React.ReactNode;
  headerText: string;
  instruction: {
    empty: string;
    incomplete: string;
    complete: string;
  };
}

const PinInputCard: React.FC<PinInputCardProps> = ({
  pin,
  onPinChange,
  headerIcon,
  headerText,
  instruction,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const renderPinDots = () => {
    return (
      <View style={styles.pinDotsContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View key={index} style={styles.pinPosition}>
            {pin.length > index ? (
              isVisible ? (
                <Text style={styles.pinDigitLarge}>{pin[index]}</Text>
              ) : (
                <View style={[styles.pinDot, styles.pinDotFilled]} />
              )
            ) : (
              <View style={styles.pinDot} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const getInstructionText = () => {
    if (pin.length === 0) return instruction.empty;
    if (pin.length < 4)
      return instruction.incomplete.replace(
        '{count}',
        (4 - pin.length).toString(),
      );
    return instruction.complete;
  };

  return (
    <LinearGradient colors={['#1a1a1a', '#1f1f1f']} style={styles.pinCard}>
      <View style={styles.pinHeader}>
        {headerIcon}
        <Text style={styles.pinHeaderText}>{headerText}</Text>
        <TouchableOpacity
          style={styles.visibilityButton}
          onPress={() => setIsVisible(!isVisible)}
        >
          {isVisible ? (
            <EyeOff size={18} color="#9ca3af" />
          ) : (
            <Eye size={18} color="#9ca3af" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.pinInputArea} activeOpacity={1}>
        {renderPinDots()}
      </TouchableOpacity>

      <Text style={styles.pinInstruction}>{getInstructionText()}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  pinCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  pinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    justifyContent: 'space-between',
  },
  pinHeaderText: {
    color: '#7c5cff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.5,
    flex: 1,
  },
  visibilityButton: {
    padding: 8,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinPosition: {
    width: 40,
    height: 40,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInputArea: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7c5cff',
  },
  pinInputAreaFocused: {
    borderColor: 'rgba(124, 92, 255, 0.3)',
    backgroundColor: 'rgba(124, 92, 255, 0.05)',
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: '#7c5cff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDotFilled: {
    backgroundColor: '#7c5cff',
    borderColor: '#7c5cff',
  },
  pinDigit: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  pinDigitLarge: {
    color: '#7c5cff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    fontSize: 16,
    textAlign: 'center',
  },
  pinInstruction: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default PinInputCard;
