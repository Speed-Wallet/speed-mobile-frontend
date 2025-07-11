import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Copy } from 'lucide-react-native';
import colors from '@/constants/colors';
import Avatar from '@/components/Avatar';
import TokenList from '@/components/TokenList';
import { EnrichedTokenEntry } from '@/data/types';
import BalanceCard from '@/components/BalanceCard';
import { useWalletPublicKey, getAllStoredWallets, getActiveWalletId } from '@/services/walletService';
import { setStringAsync } from 'expo-clipboard';
import ScreenContainer from '@/components/ScreenContainer';
import TabSelector from '@/components/TabSelector';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import CryptoTest from '@/components/CryptoTest';


export default function HomeScreen() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [walletName, setWalletName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tokens' | 'activity'>('tokens');
  const walletAddress = useWalletPublicKey();

  // Generic user object for avatar
  const genericUser = {
    name: username || 'User',
    avatar: undefined,
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername) {
          setUsername(storedUsername);
        }
        
        // Load active wallet name from wallet service
        const storedWallets = await getAllStoredWallets();
        const activeWalletId = await getActiveWalletId();
        
        if (activeWalletId && storedWallets.length > 0) {
          const activeWallet = storedWallets.find(wallet => wallet.id === activeWalletId);
          if (activeWallet) {
            setWalletName(activeWallet.name);
          }
        }
      } catch (error) {
        console.error('Error loading user data from storage:', error);
      }
    };

    loadUserData();
  }, []);

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
            <Avatar size={40} user={genericUser} />
            <View style={styles.userInfo}>
              <Text style={styles.usernameText}>{walletName}</Text>
              <Text style={styles.walletNameText}>@{username}</Text>
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
  usernameText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  walletNameText: {
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