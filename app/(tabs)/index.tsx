import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Copy } from 'lucide-react-native';
import colors from '@/constants/colors';
import Avatar from '@/components/Avatar';
import TokenList from '@/components/TokenList';
import UserData from '@/data/user';
import { EnrichedTokenEntry } from '@/data/types';
import BalanceCard from '@/components/BalanceCard';
import { useWalletPublicKey } from '@/services/walletService';
import { setStringAsync } from 'expo-clipboard';
import ScreenContainer from '@/components/ScreenContainer';
import TabSelector from '@/components/TabSelector';
// import CryptoTest from '@/components/CryptoTest';


export default function HomeScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(UserData);
  const [activeTab, setActiveTab] = useState<'tokens' | 'activity'>('tokens');
  const walletAddress = useWalletPublicKey();

  const handleCopyAddress = async () => {
    await setStringAsync(walletAddress || '');
  };

  const handleBalanceCardAction = (actionType: string) => {
    // actionType will be "send", "receive", "cards", "trade"
    if (actionType === "cards") {
      router.push("/wallet/cards");
    } else {
      router.push(`/transaction/${actionType}` as any);
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Crypto Test - Remove this after testing */}
        {/* <CryptoTest /> */}
        
        {/* Header section */}
        <View style={styles.header}>
          <View style={styles.userSection}>
            <Avatar size={40} user={userData} />
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>WELCOME {userData.name.toUpperCase()}</Text>
              <Text style={styles.usernameText}>@{userData.username}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleCopyAddress} style={styles.copyButton}>
            <Copy size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Balance card */}
        <BalanceCard
          onActionPress={handleBalanceCardAction}
        // currencySymbol="$" // Optional: if you want to override default
        />

        {/* Tab selector */}
        <TabSelector
          activeTab={activeTab}
          onTabPress={setActiveTab}
        />

        {/* Content based on active tab */}
        {activeTab === 'tokens' && (
          <View style={styles.assetsSection}>
            <TokenList
              onSelectToken={(token: EnrichedTokenEntry) => router.push(`/token/${token.address}`)}
            />
          </View>
        )}

        {activeTab === 'activity' && (
          <View style={styles.activitySection}>
            <Text style={styles.placeholderText}>Activity content coming soon...</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    // marginTop: 40,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 12,
  },
  welcomeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  usernameText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  copyButton: {
    padding: 8,
  },
  assetsSection: {
    // Content section for tokens
  },
  activitySection: {
    padding: 16,
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});