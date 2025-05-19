import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Copy } from 'lucide-react-native';
import {setStringAsync} from 'expo-clipboard';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import Avatar from '@/components/Avatar';
import TokenList from '@/components/TokenList';
import UserData from '@/data/user';
import { getAllTokenInfo } from '@/data/tokens';
import { EnrichedTokenEntry } from '@/data/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PUBLIC_KEY_KEY } from '@/services/walletService';
import BalanceCard from '@/components/BalanceCard';

import { Buffer } from 'buffer';
global.Buffer = Buffer;


export default function HomeScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(UserData);
  const [tokenData, setTokenData] = useState<EnrichedTokenEntry[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getAllTokenInfo();
    setTokenData(data);
  };

  const handleCopyAddress = async () => {
    // try {
    //   const addressToCopy = await AsyncStorage.getItem(PUBLIC_KEY_KEY);
    //   if (addressToCopy) {
    //     await setStringAsync(addressToCopy);
    //     alert('Address copied to clipboard!');
    //   } else {
    //     alert('Wallet address not found. Please set up or import a wallet.');
    //   }
    // } catch (error) {
    //   console.error("Failed to get address for copying:", error);
    //   alert('Could not retrieve address.');
    // }
  };

  const handleBalanceCardAction = (actionType: string) => {
    // actionType will be "send", "receive", "buy", "trade"
    router.push(`/transaction/${actionType}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
          balance={userData.totalBalance} 
          onActionPress={handleBalanceCardAction} 
          // currencySymbol="$" // Optional: if you want to override default
        />

        {/* Crypto assets list */}
        <View style={styles.assetsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CURRENCY</Text>
            <Text style={styles.sectionTitle}>YOUR TOTAL ASSETS</Text>
          </View>
          
          <TokenList 
            data={tokenData} 
            onSelectToken={(token: EnrichedTokenEntry) => router.push(`/token/${token.address}`)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    // paddingTop: 10,
  },
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
    // marginBottom: 24, // This might be handled by BalanceCard's marginBottom now
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});