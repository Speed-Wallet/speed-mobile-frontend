import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import {
  Share2,
  QrCode,
  UserPlus,
  ShoppingCart,
  Coins,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import ScreenContainer from '@/components/ScreenContainer';
import ScreenHeader from '@/components/ScreenHeader';
import { AuthService } from '@/services/authService';
import { getReferralStats } from '@/services/apis';
import { useAlert } from '@/providers/AlertProvider';

export default function ReferralScreen() {
  const router = useRouter();
  const { error: showError } = useAlert();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [rewardsEarned, setRewardsEarned] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setIsLoading(true);
      const username = AuthService.getCurrentUsername();

      if (!username) {
        showError('Error', 'Username not found. Please sign in again.');
        return;
      }

      const result = await getReferralStats(username);

      if (result.success && result.data) {
        setReferralCode(result.data.referralCode);
        setRewardsEarned(result.data.totalEarnings);
        setReferralCount(result.data.totalReferrals);
      } else {
        showError('Error', result.error || 'Failed to load referral data');
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
      showError('Error', 'Failed to load referral data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!referralCode) {
      showError('Error', 'Referral code not available');
      return;
    }

    try {
      await Share.share({
        message: `Join Speed Wallet using my invite code: ${referralCode}\n\nEarn 30% commission on trading fees!`,
        title: 'Join Speed Wallet',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleShowQR = () => {
    // Navigate to QR code screen or show modal
    console.log('Show QR code');
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScreenHeader
        title="Rewards"
        onBack={() => router.back()}
        showBackButton={false}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Launch Notice */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>
              🎉 Rewards start on 1 Dec 2025, but start getting your referrals
              in the meantime!
            </Text>
          </View>

          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>
              Invite friends, earn{'\n'}30% commission,{'\n'} forever
            </Text>
          </View>

          {/* Stats Section */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${rewardsEarned}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{referralCount}</Text>
              <Text style={styles.statLabel}>Referrals</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleShare}
              activeOpacity={0.8}
              disabled={!referralCode}
            >
              <Share2 size={scale(20)} color={colors.backgroundDark} />
              <Text style={styles.primaryButtonText}>Send invite</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleShowQR}
              activeOpacity={0.8}
              disabled={!referralCode}
            >
              <QrCode size={scale(20)} color={colors.textPrimary} />
              <Text style={styles.secondaryButtonText}>Show QR code</Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>How it works</Text>

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <UserPlus
                  size={scale(24)}
                  color={colors.primary}
                  strokeWidth={2}
                />
              </View>
              <Text style={styles.infoText}>
                Share your invite code with friends
              </Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <ShoppingCart
                  size={scale(24)}
                  color={colors.primary}
                  strokeWidth={2}
                />
              </View>
              <Text style={styles.infoText}>
                They sign up and input your invite code
              </Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Coins
                  size={scale(24)}
                  color={colors.primary}
                  strokeWidth={2}
                />
              </View>
              <Text style={styles.infoText}>
                You receive 30% of their trading fees forever
              </Text>
            </View>
          </View>

          {/* Referral Code Display */}
          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>Your invite code</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>
                {referralCode || 'Loading...'}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
  },
  noticeCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: moderateScale(12),
    padding: scale(16),
    marginTop: verticalScale(16),
    // marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  noticeText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  headerSection: {
    alignItems: 'center',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(32),
  },
  headerTitle: {
    fontSize: moderateScale(28),
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: moderateScale(36),
  },
  statsCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: moderateScale(16),
    padding: scale(24),
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: verticalScale(24),
    borderWidth: 1,
    borderColor: 'rgba(155, 155, 155, 0.1)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: scale(50),
    backgroundColor: colors.textSecondary + '30',
  },
  statValue: {
    fontSize: moderateScale(36),
    fontFamily: 'Inter-Bold',
    color: colors.primary,
    marginBottom: verticalScale(4),
  },
  statLabel: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  actionsContainer: {
    gap: scale(12),
    marginBottom: verticalScale(32),
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },
  primaryButtonText: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-SemiBold',
    color: colors.backgroundDark,
  },
  secondaryButton: {
    backgroundColor: colors.backgroundLight,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
  },
  secondaryButtonText: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  infoSection: {
    marginBottom: verticalScale(32),
  },
  infoTitle: {
    fontSize: moderateScale(20),
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: verticalScale(24),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(20),
  },
  iconContainer: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(12),
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(16),
  },
  infoText: {
    flex: 1,
    fontSize: moderateScale(15),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    lineHeight: moderateScale(22),
    paddingTop: verticalScale(4),
  },
  codeSection: {
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: verticalScale(12),
  },
  codeContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(24),
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  codeText: {
    fontSize: moderateScale(24),
    fontFamily: 'Inter-Bold',
    color: colors.primary,
    letterSpacing: 2,
  },
});
