import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { User, X, AlertTriangle } from 'lucide-react-native';
import { PaymentCard as PaymentCardType } from '@/utils/storage';

interface FailedCardProps {
  card: PaymentCardType;
  onDeleteCard: (cardId: string) => void;
  getBrandLogo: (brand: 'mastercard' | 'visa') => any;
}

/**
 * FailedCard - Shows a card that failed to be created
 * Displays error information and allows deletion
 */
export const FailedCard: React.FC<FailedCardProps> = ({
  card,
  onDeleteCard,
  getBrandLogo,
}) => {
  return (
    <View style={[styles.paymentCard, styles.failedCard]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHolderSection}>
          <View style={styles.userIcon}>
            <User size={14} color="#ffffff" />
          </View>
          <Text style={styles.cardHolderName}>{card.holder}</Text>
          <View style={styles.failedBadge}>
            <AlertTriangle size={12} color="#ffffff" />
            <Text style={styles.failedBadgeText}>Failed</Text>
          </View>
        </View>
        <View style={styles.cardHeaderActions}>
          <Image
            source={getBrandLogo(card.brand)}
            style={[styles.brandLogo, styles.failedOpacity]}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.deleteButtonFailed}
            onPress={() => onDeleteCard(card.id)}
          >
            <X size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Card Number Section */}
      <View style={styles.cardNumberSection}>
        <Text style={[styles.cardNumberText, styles.failedText]}>
          Card Creation Failed
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.balanceSection}>
          <Text style={[styles.cardLabel, styles.failedText]}>ERROR</Text>
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceValue, styles.failedText]} numberOfLines={3}>
              {card.failureReason || 'Failed to create card. Please try again or contact support.'}
            </Text>
          </View>
        </View>
        
        <View style={styles.cvvSection}>
          <Text style={[styles.cardLabel, styles.failedText]}>CVV</Text>
          <Text style={[styles.cardValue, styles.failedText]}>N/A</Text>
        </View>
        
        <View style={styles.expirySection}>
          <Text style={[styles.cardLabel, styles.failedText]}>EXPIRES</Text>
          <Text style={[styles.cardValue, styles.failedText]}>N/A</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paymentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  failedCard: {
    borderColor: '#ef4444',
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHolderSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cardHolderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  failedBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  failedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    width: 40,
    height: 25,
  },
  failedOpacity: {
    opacity: 0.3,
  },
  deleteButtonFailed: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNumberSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardNumberText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: 2,
  },
  failedText: {
    color: '#ef4444',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  balanceSection: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginRight: 8,
  },
  cvvSection: {
    alignItems: 'center',
    minWidth: 60,
    marginHorizontal: 20,
  },
  expirySection: {
    alignItems: 'flex-end',
    flex: 1,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
});
