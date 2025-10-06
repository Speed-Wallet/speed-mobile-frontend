import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { User, Eye, EyeOff, X, CheckCircle } from 'lucide-react-native';
import { PaymentCard as PaymentCardType } from '@/utils/storage';

interface SuccessCardProps {
  card: PaymentCardType;
  isVisible: boolean;
  onToggleVisibility: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  formatBalance: (amount: number) => string;
  getBrandLogo: (brand: 'mastercard' | 'visa') => any;
}

/**
 * SuccessCard - Shows a fully created and ready-to-use card
 * Displays all card details with visibility toggles
 */
export const SuccessCard: React.FC<SuccessCardProps> = ({
  card,
  isVisible,
  onToggleVisibility,
  onDeleteCard,
  formatBalance,
  getBrandLogo,
}) => {
  return (
    <View style={[styles.paymentCard, styles.successCard]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHolderSection}>
          <View style={styles.userIcon}>
            <User size={14} color="#ffffff" />
          </View>
          <Text style={styles.cardHolderName}>{card.holder}</Text>
          <View style={styles.successBadge}>
            <CheckCircle size={12} color="#ffffff" />
            <Text style={styles.successBadgeText}>Ready</Text>
          </View>
        </View>
        <View style={styles.cardHeaderActions}>
          <Image
            source={getBrandLogo(card.brand)}
            style={styles.brandLogo}
            contentFit="contain"
          />
          {process.env.EXPO_PUBLIC_APP_ENV === 'development' && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDeleteCard(card.id)}
            >
              <X size={16} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Card Number Section */}
      <View style={styles.cardNumberSection}>
        <Text style={styles.cardNumberText}>
          {isVisible
            ? card.cardNumber
              ? `${card.cardNumber.slice(0, 4)} ${card.cardNumber.slice(4, 8)} ${card.cardNumber.slice(8, 12)} ${card.cardNumber.slice(12, 16)}`
              : `•••• •••• •••• ${card.last4}`
            : '•••• •••• •••• ••••'}
        </Text>
        <TouchableOpacity
          style={styles.visibilityButton}
          onPress={() => onToggleVisibility(card.id)}
        >
          {isVisible ? (
            <EyeOff size={20} color="#9ca3af" />
          ) : (
            <Eye size={20} color="#9ca3af" />
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.balanceSection}>
          <Text style={styles.cardLabel}>BALANCE</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceValue}>
              {isVisible ? formatBalance(card.balance) : '••••••'}
            </Text>
            <TouchableOpacity
              style={styles.balanceVisibilityButton}
              onPress={() => onToggleVisibility(card.id)}
            >
              {isVisible ? (
                <EyeOff size={16} color="#10b981" />
              ) : (
                <Eye size={16} color="#10b981" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cvvSection}>
          <Text style={styles.cardLabel}>CVV</Text>
          <Text style={styles.cardValue}>
            {isVisible ? card.cvv || '•••' : '•••'}
          </Text>
        </View>

        <View style={styles.expirySection}>
          <Text style={styles.cardLabel}>EXPIRES</Text>
          <Text style={styles.cardValue}>{card.expires}</Text>
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
  successCard: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
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
  successBadge: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  successBadgeText: {
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
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
  visibilityButton: {
    padding: 4,
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
  balanceVisibilityButton: {
    padding: 2,
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
