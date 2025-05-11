import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Camera, Scan } from 'lucide-react-native';
import colors from '@/constants/colors';

type AddressInputProps = {
  address: string;
  onChangeAddress: (address: string) => void;
  selectedToken: any;
};

const AddressInput = ({ address, onChangeAddress, selectedToken }: AddressInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleScanQR = () => {
    // In a real app, this would open a QR code scanner
    alert('QR scanner would open here');
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {selectedToken.name} Address
      </Text>
      <View 
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder={`Enter ${selectedToken.name} address`}
          placeholderTextColor={colors.textSecondary}
          value={address}
          onChangeText={onChangeAddress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
        />
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={handleScanQR}
        >
          <Scan size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 16,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
  },
  input: {
    flex: 1,
    height: 50,
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  scanButton: {
    padding: 8,
  },
});

export default AddressInput;