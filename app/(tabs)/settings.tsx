import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
  Wallet
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { getCurrentVerificationLevel } from '@/utils/verification';
import ScreenContainer from '@/components/ScreenContainer';

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
    }, [])
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            {getAccountOptions().map((option, index, array) => renderSettingItem(option, index, array))}
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionContent}>
            {preferencesOptions.map((option, index, array) => renderSettingItem(option, index, array))}
          </View>
        </View>

        {/* Referrals & Affiliates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referrals & Affiliates</Text>
          <View style={styles.sectionContent}>
            {referralOptions.map((option, index, array) => renderSettingItem(option, index, array))}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionContent}>
            {supportOptions.map((option, index, array) => renderSettingItem(option, index, array))}
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
    paddingTop: 16, // Reduced from 24
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#a1a1aa', // Updated to specific hex color
    marginBottom: 10, // Reduced from 16
  },
  sectionContent: {
    // Remove gap to make items touch
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10, // Reduced from 12
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundMedium,
    borderWidth: 1,
    borderColor: colors.backgroundLight,
    borderTopWidth: 0, // Remove top border for connected look
  },
  firstItem: {
    borderTopWidth: 1, // Only first item gets top border
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  onlyItem: {
    borderTopWidth: 1,
    borderRadius: 12,
  },
  iconContainer: {
    width: 32, // Reduced from 36
    height: 32, // Reduced from 36
    borderRadius: 7, // Adjusted to maintain proportion
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
    fontSize: 16,
    fontFamily: 'Inter-Medium', // Changed from Inter-SemiBold to Inter-Medium
    color: colors.textPrimary,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8, // Added margin to create space from chevron
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