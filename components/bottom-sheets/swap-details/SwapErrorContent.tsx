import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import colors from '@/constants/colors';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';

interface SwapErrorContentProps {
  onClose: () => void;
}

export default function SwapErrorContent({ onClose }: SwapErrorContentProps) {
  return (
    <View style={styles.stateContainer}>
      <View style={styles.errorHeader}>
        <AlertTriangle size={28} color="#ef4444" />
        <Text style={styles.stateTitle}>Swap Failed</Text>
      </View>
      <Text style={styles.stateSubtitle}>
        Your transaction could not be completed.{'\n'}
        Please check your funds and network connection and try again.
      </Text>

      <View style={styles.failedButtonContainer}>
        <PrimaryActionButton title="Close" onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stateContainer: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'left',
    marginTop: 1,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    marginBottom: 12,
    width: '100%',
  },
  failedButtonContainer: {
    width: '100%',
    marginTop: 24,
  },
});
