import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  User,
  Shield,
  CreditCard,
  Bell,
  Globe,
  Moon,
  CircleHelp as HelpCircle,
  MessageCircle,
  FileText,
  ChevronRight,
  Check,
  Users,
  Gift,
  TrendingUp,
  Link,
  Eye,
  KeyRound,
  Twitter,
  Send,
  MessageSquare,
} from 'lucide-react-native';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import { getCurrentVerificationLevel } from '@/utils/verification';
import ScreenContainer from '@/components/ScreenContainer';
import ScreenHeader from '@/components/ScreenHeader';
import { useAlert } from '@/providers/AlertProvider';

const preferencesOptions = [
  {
    id: 4,
    title: 'Notifications',
    icon: Bell,
    color: '#f59e0b',
    route: null,
  },
  {
    id: 5,
    title: 'Language',
    icon: Globe,
    color: '#06b6d4',
    route: null,
  },
  {
    id: 6,
    title: 'Theme',
    icon: Moon,
    color: '#6b7280',
    route: null,
  },
];

const referralOptions = [
  {
    id: 7,
    title: 'Referral Program',
    icon: Users,
    color: '#10b981',
    route: null,
  },
  {
    id: 8,
    title: 'Affiliate Applications',
    icon: Link,
    color: '#3b82f6',
    route: null,
  },
  {
    id: 9,
    title: 'Earnings Dashboard',
    icon: TrendingUp,
    color: '#f59e0b',
    route: null,
  },
  {
    id: 10,
    title: 'Rewards & Bonuses',
    icon: Gift,
    color: '#8b5cf6',
    route: null,
  },
];

const socialLinks = [
  {
    id: 'twitter',
    icon: Twitter,
    url: 'https://x.com/speed__wallet?t=xybdvDybtg2mZz16g2SHcg&s=09',
    color: '#1DA1F2',
  },
  {
    id: 'telegram',
    icon: Send,
    url: 'https://t.me/speedwalletexchange',
    color: '#0088cc',
  },
  {
    id: 'discord',
    icon: MessageSquare,
    url: 'https://discord.gg/CpF9vSw3z',
    color: '#5865F2',
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { alert, success } = useAlert();
  const [verificationLevel, setVerificationLevel] = useState(0);

  // Recalculate verification level whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        const level = await getCurrentVerificationLevel();
        if (mounted) {
          setVerificationLevel(level);
        }
      })();
      return () => {
        mounted = false;
      };
    }, []),
  );

  // Get color for verification level
  const getVerificationColor = (level: number) => {
    switch (level) {
      case 1:
        return '#10b981'; // Green for Level 1
      case 2:
        return '#f59e0b'; // Orange for Level 2
      case 3:
        return '#8b5cf6'; // Purple for Level 3
      default:
        return '#6b7280'; // Gray for no level
    }
  };

  // Create dynamic account options based on current verification level
  const getAccountOptions = () => {
    return [
      // {
      //   id: 1,
      //   title: 'Personal Info',
      //   icon: User,
      //   color: getVerificationColor(verificationLevel),
      //   showKyc: verificationLevel >= 1,
      //   kycLevel: verificationLevel,
      //   route: '/settings/kyc',
      // },
      {
        id: 2,
        title: 'Change PIN',
        icon: KeyRound,
        color: '#1e40af',
        route: '/settings/change-pin',
        action: 'changePin',
      },
      {
        id: 3,
        title: 'View Seed Phrase',
        icon: Eye,
        color: '#dc2626',
        route: '/settings/view-seed-phrase',
        action: 'viewSeedPhrase',
      },
    ];
  };

  const handleSocialLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        alert('Error', `Unable to open URL: ${url}`);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      alert('Error', 'Failed to open the link');
    }
  };

  const handlePress = (option: any) => {
    if (option.route) {
      router.push(option.route);
    }
  };

  const renderSettingItem = (option: any, index: number, array: any[]) => {
    const isFirst = index === 0;
    const isLast = index === array.length - 1;
    const isOnly = array.length === 1;

    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.settingItem,
          isFirst && styles.firstItem,
          isLast && styles.lastItem,
          isOnly && styles.onlyItem,
        ]}
        onPress={() => handlePress(option)}
      >
        <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
          <option.icon size={18} color="#ffffff" />
        </View>
        <View style={styles.settingContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.settingTitle}>{option.title}</Text>
            {option.showKyc && (
              <View style={styles.kycBadge}>
                <Check size={12} color="#ffffff" />
                <Text style={styles.kycText}>Level {option.kycLevel}</Text>
              </View>
            )}
          </View>
        </View>
        <ChevronRight size={20} color="#9ca3af" />
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer edges={['top']}>
      <ScreenHeader title="Settings" showBackButton={false} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={[styles.section, styles.firstSection]}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            {getAccountOptions().map((option, index, array) =>
              renderSettingItem(option, index, array),
            )}
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionContent}>
            {preferencesOptions.map((option, index, array) =>
              renderSettingItem(option, index, array),
            )}
          </View>
        </View>

        {/* Referrals & Affiliates Section */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referrals & Affiliates</Text>
          <View style={styles.sectionContent}>
            {referralOptions.map((option, index, array) =>
              renderSettingItem(option, index, array),
            )}
          </View>
        </View> */}

        {/* Social Media Links */}
        <View style={styles.versionSection}>
          <View style={styles.socialIconsRow}>
            {socialLinks.map((social) => (
              <TouchableOpacity
                key={social.id}
                style={[
                  styles.socialIconButton,
                  { backgroundColor: social.color },
                ]}
                onPress={() => handleSocialLinkPress(social.url)}
              >
                <social.icon size={20} color="#ffffff" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(12), // Reduced spacing
  },
  section: {
    paddingTop: verticalScale(12), // Reduced spacing
  },
  firstSection: {
    paddingTop: verticalScale(6), // Reduced spacing
  },
  sectionTitle: {
    fontSize: 16, // Keep same size
    fontFamily: 'Inter-Medium',
    color: '#a1a1aa',
    marginBottom: verticalScale(4), // Reduced spacing
  },
  sectionContent: {
    // Container removed - items will be displayed without background containers
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(4), // Reduced spacing
    paddingHorizontal: 0,
    // Removed all background and border styles
  },
  firstItem: {
    // Removed all border radius and border styles
  },
  lastItem: {
    // Removed all border radius styles
  },
  onlyItem: {
    // Removed all border and radius styles
  },
  iconContainer: {
    width: 32, // Keep same size
    height: 32, // Keep same size
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12), // Reduced spacing
  },
  settingContent: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTitle: {
    fontSize: moderateScale(14), // Slightly smaller with slow scaling
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: scale(6), // Reduced spacing
    paddingVertical: verticalScale(3), // Reduced spacing
    borderRadius: 12, // Keep same size
    marginRight: scale(6), // Reduced spacing
  },
  kycText: {
    fontSize: 12, // Keep same size
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginLeft: scale(3), // Reduced spacing
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: verticalScale(24), // Reduced spacing
  },
  versionText: {
    fontSize: 14, // Keep same size
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  // PIN Entry Styles
  pinEntrySection: {
    paddingTop: verticalScale(12),
  },
  pinEntryContainer: {
    padding: 15,
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
  },
  pinPrompt: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    marginBottom: 15,
    textAlign: 'center',
  },
  pinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.backgroundLight,
  },
  pinInput: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  buttonDisabled: {
    backgroundColor: colors.primary + '80',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  errorText: {
    color: colors.error,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  // Seed Phrase Styles
  seedPhraseSection: {
    paddingTop: verticalScale(12),
  },
  seedPhraseContainer: {
    padding: 15,
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    alignItems: 'center',
  },
  seedPhraseWarningTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: colors.warning,
    marginBottom: 10,
  },
  seedPhraseWarning: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 15,
  },
  mnemonicDisplay: {
    backgroundColor: colors.backgroundDark,
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  mnemonicText: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  hideButton: {
    flex: 1,
    backgroundColor: colors.textSecondary,
  },
  // Social Media Styles
  socialContainer: {
    backgroundColor: colors.backgroundDark,
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(12),
  },
  socialIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(12),
  },
  socialIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
