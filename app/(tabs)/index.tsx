import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowDown, ArrowUp, Copy, ArrowRightLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import Avatar from '@/components/Avatar';
import CryptoList from '@/components/CryptoList';
import ActionButton from '@/components/ActionButton';
import UserData from '@/data/user';
import { getCryptoData } from '@/data/crypto';

export default function HomeScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(UserData);
  const [cryptoData, setCryptoData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // In a real app, this would fetch data from an API
    const data = await getCryptoData();
    setCryptoData(data);
  };

  const handleCopyBalance = () => {
    // In a real app, this would copy the balance to clipboard
    alert('Balance copied to clipboard!');
  };

  const navigateToTransaction = (type: string) => {
    router.push(`/transaction/${type}`);
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
          <TouchableOpacity onPress={handleCopyBalance} style={styles.copyButton}>
            <Copy size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Balance card */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <LinearGradient
            colors={[colors.cardGradientStart, colors.cardGradientEnd]}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceAmount}>{formatCurrency(userData.totalBalance)}</Text>
            </View>
            
            <View style={styles.actionsContainer}>
              <ActionButton 
                icon={<ArrowUp size={20} color={colors.white} />}
                label="SEND"
                onPress={() => navigateToTransaction('send')}
              />
              <ActionButton 
                icon={<ArrowDown size={20} color={colors.white} />}
                label="RECEIVE"
                onPress={() => navigateToTransaction('receive')}
              />
              <ActionButton 
                icon={<ArrowUp size={20} color={colors.white} style={{ transform: [{ rotate: '45deg' }] }} />}
                label="WITHDRAW"
                onPress={() => navigateToTransaction('withdraw')}
              />
              <ActionButton 
                icon={<ArrowRightLeft size={20} color={colors.white} />}
                label="TRADE"
                onPress={() => navigateToTransaction('trade')}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Crypto assets list */}
        <View style={styles.assetsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CURRENCY</Text>
            <Text style={styles.sectionTitle}>YOUR TOTAL ASSETS</Text>
          </View>
          
          <CryptoList 
            data={cryptoData} 
            onSelectCrypto={(crypto) => router.push(`/crypto/${crypto.id}`)}
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
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
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
  balanceCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  balanceLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  balanceAmount: {
    color: colors.white,
    fontSize: 32,
    fontFamily: 'Inter-Bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assetsSection: {
    marginBottom: 24,
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