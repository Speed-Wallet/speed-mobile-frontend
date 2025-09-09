import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, Clock, AlertCircle } from 'lucide-react-native';
import { useOtpTimer, formatTime } from '@/hooks/useOtpTimer';

export type EmailStatus =
  | 'unverified'
  | 'needs_verification'
  | 'otp_pending'
  | 'verified';

interface EmailBadgeProps {
  status: EmailStatus;
  expiresAt?: number | null;
  onExpire?: () => void;
}

const EmailBadge: React.FC<EmailBadgeProps> = ({
  status,
  expiresAt,
  onExpire,
}) => {
  const remaining = useOtpTimer(expiresAt || null, onExpire || (() => {}));

  if (status === 'otp_pending' && remaining) {
    return (
      <View style={[styles.badge, styles.pendingBadge]}>
        <Clock size={12} color="#3b82f6" />
        <Text style={[styles.badgeText, styles.pendingText]}>
          {formatTime(remaining)}
        </Text>
      </View>
    );
  }

  switch (status) {
    case 'unverified':
      return (
        <View style={[styles.badge, styles.unverifiedBadge]}>
          <AlertCircle size={12} color="#6b7280" />
          <Text style={[styles.badgeText, styles.unverifiedText]}>
            Unverified
          </Text>
        </View>
      );

    case 'needs_verification':
      return (
        <View style={[styles.badge, styles.needsVerificationBadge]}>
          <Text style={[styles.badgeText, styles.needsVerificationText]}>
            Verify
          </Text>
        </View>
      );

    case 'verified':
      return (
        <View style={[styles.badge, styles.verifiedBadge]}>
          <Check size={12} color="#10b981" />
          <Text style={[styles.badgeText, styles.verifiedText]}>Verified</Text>
        </View>
      );

    default:
      return null;
  }
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unverifiedBadge: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  unverifiedText: {
    color: '#6b7280',
  },
  needsVerificationBadge: {
    backgroundColor: 'rgba(0, 207, 255, 0.125)',
    borderWidth: 1,
    borderColor: '#00CFFF',
  },
  needsVerificationText: {
    color: '#00CFFF',
  },
  pendingBadge: {
    backgroundColor: '#1e40af',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  pendingText: {
    color: '#3b82f6',
  },
  verifiedBadge: {
    backgroundColor: '#065f46',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  verifiedText: {
    color: '#10b981',
  },
});

export default EmailBadge;
