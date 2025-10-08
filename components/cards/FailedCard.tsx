import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
} from 'react-native';
import {
  User,
  X,
  AlertTriangle,
  MessageCircle,
  Send,
} from 'lucide-react-native';
import { PaymentCard as PaymentCardType } from '@/types/cards';
import { formatTimestamp } from '@/utils/timeUtils';

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
        <View style={styles.failureInfoSection}>
          <Text style={[styles.cardNumberText, styles.failedText]}>
            Card Creation Failed
          </Text>
          {(card.updatedAt || card.createdAt) && (
            <Text style={styles.failureTimestamp}>
              Failed {formatTimestamp(card.updatedAt || card.createdAt!)} at{' '}
              {new Date(card.updatedAt || card.createdAt!).toLocaleString()}
            </Text>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.supportSection}>
          <Text style={[styles.cardLabel, styles.failedText]}>SUPPORT</Text>
          <View style={styles.supportButtons}>
            <TouchableOpacity
              style={styles.discordButton}
              onPress={() => Linking.openURL('https://discord.gg/RX75b64z')}
            >
              <MessageCircle size={16} color="#5865F2" />
              <Text style={styles.discordButtonText}>Discord Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.telegramButton}
              onPress={() => {
                // Will be made clickable later
                console.log('Telegram support clicked');
              }}
            >
              <Send size={16} color="#0088CC" />
              <Text style={styles.telegramButtonText}>Telegram Support</Text>
            </TouchableOpacity>
          </View>
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
  failureInfoSection: {
    flex: 1,
  },
  cardNumberText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: 2,
  },
  failureTimestamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  failedText: {
    color: '#ef4444',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  supportSection: {
    flex: 1,
  },
  supportButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 4,
  },
  discordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(88, 101, 242, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5865F2',
    flex: 1,
  },
  discordButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5865F2',
    marginLeft: 6,
  },
  telegramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 136, 204, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0088CC',
    flex: 1,
  },
  telegramButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0088CC',
    marginLeft: 6,
  },
});
