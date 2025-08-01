import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { User, Eye, X, Clock } from 'lucide-react-native';
import { PaymentCard as PaymentCardType } from '@/utils/storage';
import LoadingSkeleton from '@/components/LoadingSkeleton';

interface LoadingCardProps {
  card: PaymentCardType;
  onDeleteCard: (cardId: string) => void;
  getBrandLogo: (brand: 'mastercard' | 'visa') => any;
  isDevelopment?: boolean;
}

/**
 * LoadingCard - Shows a card that is currently being created
 * Displays loading skeletons and a "Creating..." badge
 */
export const LoadingCard: React.FC<LoadingCardProps> = ({
  card,
  onDeleteCard,
  getBrandLogo,
  isDevelopment = false,
}) => {
  return (
    <View style={[styles.paymentCard, styles.loadingCard]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHolderSection}>
          <View style={styles.userIcon}>
            <User size={14} color="#ffffff" />
          </View>
          <Text style={styles.cardHolderName}>{card.holder}</Text>
          <View style={styles.loadingBadge}>
            <Clock size={12} color="#ffffff" />
            <Text style={styles.loadingBadgeText}>Creating...</Text>
          </View>
        </View>
        <View style={styles.cardHeaderActions}>
          <Image
            source={getBrandLogo(card.brand)}
            style={[styles.brandLogo, styles.loadingOpacity]}
            resizeMode="contain"
          />
          {isDevelopment && (
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
        <LoadingSkeleton width="65%" height={22} borderRadius={4} />
        <View style={styles.visibilityButton}>
          <Eye size={20} color="#555555" />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.balanceSection}>
          <Text style={styles.cardLabel}>BALANCE</Text>
          <LoadingSkeleton width={80} height={18} borderRadius={4} />
        </View>
        
        <View style={styles.cvvSection}>
          <Text style={styles.cardLabel}>CVV</Text>
          <LoadingSkeleton width={24} height={16} borderRadius={4} />
        </View>
        
        <View style={styles.expirySection}>
          <Text style={styles.cardLabel}>EXPIRES</Text>
          <LoadingSkeleton width={40} height={16} borderRadius={4} />
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
  loadingCard: {
    borderColor: '#4a5568',
    borderWidth: 1,
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
  loadingBadge: {
    backgroundColor: '#3182ce',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadingBadgeText: {
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
  loadingOpacity: {
    opacity: 0.5,
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
  cvvSection: {
    alignItems: 'center',
    minWidth: 60,
    marginHorizontal: 20,
  },
  expirySection: {
    alignItems: 'flex-end',
    flex: 1,
  },
});
