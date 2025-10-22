import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, Info } from 'lucide-react-native';
import colors from '@/constants/colors';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';

interface SwapErrorContentProps {
  onClose: () => void;
  errorMessage?: string;
}

export default function SwapErrorContent({
  onClose,
  errorMessage,
}: SwapErrorContentProps) {
  // Determine if this is a blockhash expiration error
  const isExpiredError =
    errorMessage?.includes('expired') ||
    errorMessage?.includes('took too long');

  // Set appropriate explanation based on error type
  const explanationText = isExpiredError
    ? 'You took too long to confirm the transaction and the transaction window expired. Please start a new swap and confirm more quickly.'
    : 'Please check your funds and network connection and try again.';

  return (
    <View style={styles.stateContainer}>
      <View style={styles.topSection}>
        <View style={styles.iconContainer}>
          <AlertTriangle size={48} color="#ef4444" />
        </View>

        <Text style={styles.stateTitle}>Swap Failed</Text>

        <Text style={styles.mainMessage}>
          {'Your transaction could not be completed.'}
        </Text>
      </View>

      <View style={styles.explanationCard}>
        <View style={styles.explanationContainer}>
          <Info
            size={20}
            color={colors.textSecondary}
            style={styles.infoIcon}
          />
          <Text style={styles.explanationText}>{explanationText}</Text>
        </View>
      </View>

      <View style={styles.failedButtonContainer}>
        <PrimaryActionButton title="Close" onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stateContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 12,
    justifyContent: 'center',
  },
  topSection: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  iconContainer: {
    alignItems: 'center',
  },
  stateTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    textAlign: 'center',
  },
  mainMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.white,
    textAlign: 'center',
  },
  explanationCard: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 16,
  },
  explanationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    flexShrink: 0,
    marginRight: 10,
  },
  explanationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  failedButtonContainer: {
    width: '100%',
  },
});
