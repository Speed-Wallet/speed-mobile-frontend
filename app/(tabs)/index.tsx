import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import Avatar from '@/components/Avatar';
import TokenList from '@/components/TokenList';
import CopyButton from '@/components/CopyButton';
import { EnrichedTokenEntry } from '@/data/types';
import BalanceCard from '@/components/BalanceCard';
import {
  useWalletPublicKey,
  getAllStoredWallets,
  getActiveWalletId,
  getWalletPublicKey,
} from '@/services/walletService';
import ScreenContainer from '@/components/ScreenContainer';
import TabSelector from '@/components/TabSelector';
import { AuthService } from '@/services/authService';
import { useTokenBalances } from '@/hooks/useTokenBalance';
import { generateSignature } from '@/utils/signature';
// import CryptoTest from '@/components/CryptoTest';

export default function HomeScreen() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [walletName, setWalletName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tokens' | 'activity'>('tokens');
  const walletAddress = useWalletPublicKey();

  // Token balances with automatic polling every 10 seconds when app is active
  const {
    data: tokenBalancesData,
    isLoading: isLoadingBalances,
    error: balancesError,
    refetch: refetchBalances,
  } = useTokenBalances(walletAddress);

  // Generic user object for avatar
  const genericUser = {
    name: username || 'User',
    avatar: undefined,
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Reload wallet data when screen comes into focus (e.g., after switching wallets)
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, []),
  );

  const loadUserData = async () => {
    try {
      const storedUsername = AuthService.getStoredUsername();
      if (storedUsername) {
        setUsername(storedUsername);
      }

      // Load active wallet name from wallet service
      const storedWallets = await getAllStoredWallets();
      const activeWalletId = await getActiveWalletId();

      if (activeWalletId && storedWallets.length > 0) {
        const activeWallet = storedWallets.find(
          (wallet) => wallet.id === activeWalletId,
        );
        if (activeWallet) {
          setWalletName(activeWallet.name);
        }
      }
    } catch (error) {
      console.error('Error loading user data from storage:', error);
    }
  };

  const handleBalanceCardAction = async (actionType: string) => {
    // actionType will be "send", "receive", "cards", "trade", "buy"
    if (actionType === 'buy') {
      // Handle buy action with YellowCard - open in external browser
      try {
        const address = await getWalletPublicKey();
        if (!address) {
          throw new Error('No wallet address available');
        }

        const apiKey = process.env.EXPO_PUBLIC_YELLOWCARD_API_KEY;

        // Build widget URL with required parameters
        const params = new URLSearchParams({
          // walletAddress: address,
          network: 'SOL',
          // signature: await generateSignature(address, 'USDT'),
        });

        const url = `https://sandbox--payments-widget.netlify.app/landing/${apiKey}?${params.toString()}`;

        console.log('Opening YellowCard widget in browser:', url);

        // Open URL in external browser
        await Linking.openURL(url);
      } catch (error) {
        console.error('Error opening YellowCard widget:', error);
        alert('Failed to open YellowCard widget. Please try again.');
      }
    } else if (actionType === 'cards') {
      router.push('/transaction/cards');
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
            <Avatar size={scale(32)} user={genericUser} />
            <View style={styles.userInfo}>
              <Text style={styles.usernameText}>{walletName}</Text>
              <Text style={styles.walletNameText}>@{username}</Text>
            </View>
          </View>
          <CopyButton
            textToCopy={walletAddress || ''}
            size={scale(18)}
            color={colors.textPrimary}
            style={styles.copyButton}
          />
        </View>

        {/* Balance card */}
        <BalanceCard
          onActionPress={handleBalanceCardAction}
          // currencySymbol="$" // Optional: if you want to override default
        />

        {/* Tab selector */}
        <TabSelector activeTab={activeTab} onTabPress={setActiveTab} />

        {/* Content based on active tab */}
        {activeTab === 'tokens' && (
          <View style={styles.assetsSection}>
            <TokenList
              onSelectToken={(token: EnrichedTokenEntry) =>
                router.push(`/token/${token.address}`)
              }
            />
          </View>
        )}

        {activeTab === 'activity' && (
          <View style={styles.activitySection}>
            <Text style={styles.placeholderText}>
              Activity content coming soon...
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: scale(12),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(18),
    // marginTop: verticalScale(40),
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: scale(10),
  },
  usernameText: {
    color: colors.textPrimary,
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Medium',
  },
  walletNameText: {
    color: colors.textSecondary,
    fontSize: moderateScale(11),
    fontFamily: 'Inter-Regular',
  },
  copyButton: {
    padding: scale(6),
  },
  assetsSection: {
    // Content section for tokens
  },
  activitySection: {
    padding: scale(12),
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
  },
});
