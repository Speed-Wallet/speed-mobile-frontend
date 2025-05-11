import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { ChevronRight, Shield, Bell, Globe, Wallet, Moon, User, CircleHelp as HelpCircle, LogOut, Plus, MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import UserData from '@/data/user';

type SettingItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress: () => void;
};

const SettingItem = ({ icon, title, subtitle, rightElement, onPress }: SettingItemProps) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingIconContainer}>
      {icon}
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    <View style={styles.settingRight}>
      {rightElement || <ChevronRight size={20} color={colors.textSecondary} />}
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(true);
  const [biometrics, setBiometrics] = React.useState(true);

  const handleJoinTelegram = () => {
    Linking.openURL('https://t.me/your_telegram_group');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <TouchableOpacity 
          style={styles.profileSection}
          onPress={() => router.push('/settings/personal-info')}
        >
          <View style={styles.profileEmoji}>
            <Text style={styles.emojiText}>👨‍💼</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{UserData.name}</Text>
            <Text style={styles.profileEmail}>{UserData.email}</Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <SettingItem
            icon={<User size={20} color={colors.textPrimary} />}
            title="Personal Information"
            subtitle="Manage your personal details"
            onPress={() => router.push('/settings/personal-info')}
          />
          
          <SettingItem
            icon={<Shield size={20} color={colors.textPrimary} />}
            title="Security"
            subtitle="2FA, Password, Recovery"
            onPress={() => {}}
          />
          
          <SettingItem
            icon={<Wallet size={20} color={colors.textPrimary} />}
            title="Payment Methods"
            subtitle="Bank accounts, cards"
            onPress={() => router.push('/wallet/cards')}
          />

          <SettingItem
            icon={<Plus size={20} color={colors.textPrimary} />}
            title="Create New Wallet"
            subtitle="Add a new crypto wallet"
            onPress={() => router.push('/wallet/manage')}
          />
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <SettingItem
            icon={<Bell size={20} color={colors.textPrimary} />}
            title="Notifications"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.backgroundLight, true: colors.primaryLight }}
                thumbColor={notifications ? colors.primary : colors.textSecondary}
              />
            }
            onPress={() => setNotifications(!notifications)}
          />
          
          <SettingItem
            icon={<Moon size={20} color={colors.textPrimary} />}
            title="Dark Mode"
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.backgroundLight, true: colors.primaryLight }}
                thumbColor={darkMode ? colors.primary : colors.textSecondary}
              />
            }
            onPress={() => setDarkMode(!darkMode)}
          />
          
          <SettingItem
            icon={<Shield size={20} color={colors.textPrimary} />}
            title="Biometric Authentication"
            rightElement={
              <Switch
                value={biometrics}
                onValueChange={setBiometrics}
                trackColor={{ false: colors.backgroundLight, true: colors.primaryLight }}
                thumbColor={biometrics ? colors.primary : colors.textSecondary}
              />
            }
            onPress={() => setBiometrics(!biometrics)}
          />
          
          <SettingItem
            icon={<Globe size={20} color={colors.textPrimary} />}
            title="Language"
            subtitle="English"
            onPress={() => {}}
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <SettingItem
            icon={<HelpCircle size={20} color={colors.textPrimary} />}
            title="Help Center"
            onPress={() => {}}
          />
          
          <SettingItem
            icon={<MessageCircle size={20} color={colors.textPrimary} />}
            title="Join Our Telegram"
            subtitle="Get help from our community"
            onPress={handleJoinTelegram}
          />
          
          <SettingItem
            icon={<HelpCircle size={20} color={colors.textPrimary} />}
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => {}}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
  },
  profileEmoji: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  emojiText: {
    fontSize: 30,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundMedium,
    marginBottom: 1,
  },
  settingIconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 8,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundMedium,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 16,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.error,
  },
});