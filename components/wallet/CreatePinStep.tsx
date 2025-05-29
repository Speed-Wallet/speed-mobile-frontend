import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import colors from '@/constants/colors';

interface CreatePinStepProps {
  pin: string;
  onPinChange: (pin: string) => void;
  onNext: () => void;
  isLoading: boolean;
}

const CreatePinStep: React.FC<CreatePinStepProps> = ({ 
  pin, 
  onPinChange, 
  onNext, 
  isLoading 
}) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create a PIN</Text>
      <Text style={styles.description}>
        Create a PIN to quickly access your wallet. Make it memorable but secure.
      </Text>
      <TextInput
        style={styles.pinInput}
        placeholder="Enter 4-digit PIN"
        placeholderTextColor={colors.textSecondary}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        value={pin}
        onChangeText={onPinChange}
        autoFocus
      />
      <TouchableOpacity 
        style={styles.button} 
        onPress={onNext} 
        disabled={isLoading || pin.length < 4}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.backgroundDark,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  pinInput: {
    backgroundColor: colors.backgroundMedium,
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: 20,
    textAlign: 'center',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '80%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.backgroundLight,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

export default CreatePinStep;
