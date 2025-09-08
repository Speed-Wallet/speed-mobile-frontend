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
  Wallet,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import { getCurrentVerificationLevel } from '@/utils/verification';
import ScreenContainer from '@/components/ScreenContainer';
import TabScreenHeader from '@/components/TabScreenHeader';

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

const supportOptions = [
  {
    id: 11,
    title: 'Help Center',
    icon: HelpCircle,
    color: '#ef4444',
    route: null,
  },
  {
    id: 12,
    title: 'Contact Support',
    icon: MessageCircle,
    color: '#f97316',
    route: null,
  },
  {
    id: 13,
    title: 'Terms & Privacy',
    icon: FileText,
    color: '#84cc16',
    route: null,
  },
];

export default function SettingsScreen() {
  const router = useRouter();
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
      {
        id: 1,
        title: 'Personal Info',
        icon: User,
        color: getVerificationColor(verificationLevel),
        showKyc: verificationLevel >= 1,
        kycLevel: verificationLevel,
        route: '/settings/kyc',
      },
      {
        id: 2,
        title: 'Security',
        icon: Shield,
        color: '#1e40af',
        route: '/settings/security',
      },
      {
        id: 3,
        title: 'Wallets',
        icon: Wallet,
        color: '#ea580c',
        route: '/settings/wallets',
      },
    ];
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
    <ScreenContainer edges={['top', 'bottom']}>
      <TabScreenHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referrals & Affiliates</Text>
          <View style={styles.sectionContent}>
            {referralOptions.map((option, index, array) =>
              renderSettingItem(option, index, array),
            )}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionContent}>
            {supportOptions.map((option, index, array) =>
              renderSettingItem(option, index, array),
            )}
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
});
