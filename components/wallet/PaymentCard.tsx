import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { User, Eye, EyeOff, X } from 'lucide-react-native';
import { PaymentCard as PaymentCardType } from '@/utils/storage';
import LoadingSkeleton from '@/components/LoadingSkeleton';

interface PaymentCardProps {
  card: PaymentCardType;
  isVisible: boolean;
  isLoading: boolean;
  isDevelopment: boolean;
  onToggleVisibility: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  formatBalance: (amount: number) => string;
  getBrandLogo: (brand: 'mastercard' | 'visa') => any;
  styles: any;
}

interface FailedPaymentCardProps {
  card: PaymentCardType;
  onDeleteCard: (cardId: string) => void;
  getBrandLogo: (brand: 'mastercard' | 'visa') => any;
  styles: any;
}

export const SuccessfulPaymentCard: React.FC<PaymentCardProps> = ({
  card,
  isVisible,
  isLoading,
  isDevelopment,
  onToggleVisibility,
  onDeleteCard,
  formatBalance,
  getBrandLogo,
  styles,
}) => {
  return (
    <View style={[
      styles.paymentCard,
      isLoading && styles.loadingCard
    ]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHolderSection}>
          <View style={styles.userIcon}>
            <User size={14} color="#ffffff" />
          </View>
          <Text style={styles.cardHolderName}>{card.holder}</Text>
          {isLoading && (
            <View style={styles.loadingBadge}>
              <Text style={styles.loadingBadgeText}>Creating...</Text>
            </View>
          )}
        </View>
        <View style={styles.cardHeaderActions}>
          <Image
            source={getBrandLogo(card.brand)}
            style={[
              styles.brandLogo,
              isLoading && styles.loadingOpacity
            ]}
            resizeMode="contain"
          />
          {isDevelopment && (
            <TouchableOpacity
              style={styles.deleteButtonFailed}
              onPress={() => onDeleteCard(card.id)}
            >
              <X size={16} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.cardNumberSection}>
        {isLoading ? (
          <LoadingSkeleton width="60%" height={22} borderRadius={4} />
        ) : (
          <Text style={styles.cardNumberText}>
            {isVisible 
              ? (card.cardNumber 
                  ? `${card.cardNumber.slice(0, 4)} ${card.cardNumber.slice(4, 8)} ${card.cardNumber.slice(8, 12)} ${card.cardNumber.slice(12, 16)}`
                  : `•••• •••• •••• ${card.last4}`) 
              : '•••• •••• •••• ••••'}
          </Text>
        )}
        <TouchableOpacity
          style={styles.visibilityButton}
          onPress={() => onToggleVisibility(card.id)}
          disabled={isLoading}
        >
          {isVisible ? (
            <EyeOff size={20} color={isLoading ? "#555555" : "#9ca3af"} />
          ) : (
            <Eye size={20} color={isLoading ? "#555555" : "#9ca3af"} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.balanceSection}>
          <Text style={styles.cardLabel}>BALANCE</Text>
          <Text style={styles.balanceValue}>
            {isVisible ? formatBalance(card.balance) : '••••••'}
          </Text>
        </View>
        
        <View style={styles.cvvSection}>
          <Text style={styles.cardLabel}>CVV</Text>
          {isLoading ? (
            <LoadingSkeleton width={24} height={16} borderRadius={4} />
          ) : (
            <Text style={styles.cardValue}>
              {isVisible ? (card.cvv || '•••') : '•••'}
            </Text>
          )}
        </View>
        
        <View style={styles.expirySection}>
          <Text style={styles.cardLabel}>EXPIRES</Text>
          {isLoading ? (
            <LoadingSkeleton width={40} height={16} borderRadius={4} />
          ) : (
            <Text style={styles.cardValue}>{card.expires}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export const FailedPaymentCard: React.FC<FailedPaymentCardProps> = ({
  card,
  onDeleteCard,
  getBrandLogo,
  styles,
}) => {
  return (
    <View style={[styles.paymentCard, styles.failedCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHolderSection}>
          <View style={styles.userIcon}>
            <User size={14} color="#ffffff" />
          </View>
          <Text style={styles.cardHolderName}>{card.holder}</Text>
          <View style={styles.failedBadge}>
            <Text style={styles.failedBadgeText}>Failed to Create</Text>
          </View>
        </View>
        <View style={styles.cardHeaderActions}>
          <Image
            source={getBrandLogo(card.brand)}
            style={[styles.brandLogo, styles.loadingOpacity]}
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

      <View style={styles.cardNumberSection}>
        <Text style={[styles.cardNumberText, styles.failedText]}>
          Failed to Create Card
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.balanceSection}>
          <Text style={styles.cardLabel}>ERROR</Text>
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceValue, styles.failedText]} numberOfLines={2}>
              {card.failureReason || 'Unknown error'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
