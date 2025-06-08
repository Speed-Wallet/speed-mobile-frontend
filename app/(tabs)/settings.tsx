import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  Link
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';

const accountOptions = [
  {
    id: 1,
    title: 'Personal Information',
    subtitle: 'Level 2 - Enhanced',
    icon: User,
    color: '#3b82f6',
    showKyc: true,
    route: '/settings/kyc',
  },
  {
    id: 2,
    title: 'Security',
    subtitle: 'Password, 2FA, and security settings',
    icon: Shield,
    color: '#10b981',
    route: '/settings/security',
  },
  {
    id: 3,
    title: 'Payment Methods',
    subtitle: 'Manage cards and payment options',
    icon: CreditCard,
    color: '#8b5cf6',
    route: '/wallet/cards',
  },
];

const preferencesOptions = [
  {
    id: 4,
    title: 'Notifications',
    subtitle: 'Manage your notification preferences',
    icon: Bell,
    color: '#f59e0b',
    route: null,
  },
  {
    id: 5,
    title: 'Language',
    subtitle: 'Choose your preferred language',
    icon: Globe,
    color: '#06b6d4',
    route: null,
  },
  {
    id: 6,
    title: 'Theme',
    subtitle: 'Dark mode and appearance settings',
    icon: Moon,
    color: '#6b7280',
    route: null,
  },
];

const referralOptions = [
  {
    id: 7,
    title: 'Referral Program',
    subtitle: 'Invite friends and earn rewards',
    icon: Users,
    color: '#10b981',
    route: null,
  },
  {
    id: 8,
    title: 'Affiliate Applications',
    subtitle: 'Apply for partner programs',
    icon: Link,
    color: '#3b82f6',
    route: null,
  },
  {
    id: 9,
    title: 'Earnings Dashboard',
    subtitle: 'Track your referral earnings',
    icon: TrendingUp,
    color: '#f59e0b',
    route: null,
  },
  {
    id: 10,
    title: 'Rewards & Bonuses',
    subtitle: 'View available rewards and bonuses',
    icon: Gift,
    color: '#8b5cf6',
    route: null,
  },
];

const supportOptions = [
  {
    id: 11,
    title: 'Help Center',
    subtitle: 'FAQs and troubleshooting guides',
    icon: HelpCircle,
    color: '#ef4444',
    route: null,
  },
  {
    id: 12,
    title: 'Contact Support',
    subtitle: 'Get help from our support team',
    icon: MessageCircle,
    color: '#f97316',
    route: null,
  },
  {
    id: 13,
    title: 'Terms & Privacy',
    subtitle: 'Legal documents and policies',
    icon: FileText,
    color: '#84cc16',
    route: null,
  },
];

export default function SettingsScreen() {
  const router = useRouter();

  const handlePress = (option: any) => {
    if (option.route) {
      router.push(option.route);
    }
  };

  const renderSettingItem = (option: any) => (
    <TouchableOpacity key={option.id} style={styles.settingItem} onPress={() => handlePress(option)}>
      <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
        <option.icon size={20} color="#ffffff" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{option.title}</Text>
        <View style={styles.subtitleContainer}>
          <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
          {option.showKyc && (
            <View style={styles.kycBadge}>
              <Check size={12} color="#ffffff" />
              <Text style={styles.kycText}>Verified</Text>
            </View>
          )}
        </View>
      </View>
      <ChevronRight size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            {accountOptions.map(renderSettingItem)}
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionContent}>
            {preferencesOptions.map(renderSettingItem)}
          </View>
        </View>

        {/* Referrals & Affiliates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referrals & Affiliates</Text>
          <View style={styles.sectionContent}>
            {referralOptions.map(renderSettingItem)}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionContent}>
            {supportOptions.map(renderSettingItem)}
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundLight,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  sectionContent: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.backgroundLight,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    flex: 1,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  kycText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginLeft: 4,
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  versionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
});