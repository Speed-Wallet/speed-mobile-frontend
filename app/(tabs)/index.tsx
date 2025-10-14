import { useState, useEffect, useRef } from 'react';
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
import { FlashList } from '@shopify/flash-list';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import Avatar from '@/components/Avatar';
import { TokenItemHome } from '@/components/token-items';
import BalanceCard from '@/components/BalanceCard';
import { Gift, Settings } from 'lucide-react-native';
import {
  useWalletPublicKey,
  getAllStoredWallets,
  getActiveWalletId,
  getWalletPublicKey,
} from '@/services/walletService';
import ScreenContainer from '@/components/ScreenContainer';
import TabSelector from '@/components/TabSelector';
import { AuthService } from '@/services/authService';
import { useTokenAssets } from '@/hooks/useTokenAsset';
import { generateSignature } from '@/utils/signature';
import Animated, { FadeInRight } from 'react-native-reanimated';
import CustomAlert from '@/components/CustomAlert';
import WalletSwitcherBottomSheet, {
  WalletSwitcherBottomSheetRef,
} from '@/components/bottom-sheets/WalletSwitcherBottomSheet';
import { useAlert } from '@/providers/AlertProvider';
import { removeWalletFromList } from '@/services/walletService';
// import CryptoTest from '@/components/CryptoTest';

const ICON_SIZE = 26;
const ICON_STROKE_WIDTH = 1.5;

export default function HomeScreen() {
  const router = useRouter();
  const { alert, error: showError, success, confirm } = useAlert();
  const [username, setUsername] = useState<string>('');
  const [walletName, setWalletName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tokens' | 'activity'>('tokens');
  const [showRewardsAlert, setShowRewardsAlert] = useState(false);
  const [showEarnAlert, setShowEarnAlert] = useState(false);
  const walletAddress = useWalletPublicKey();

  const walletSwitcherRef = useRef<WalletSwitcherBottomSheetRef>(null);

  // Token balances with automatic polling every 10 seconds when app is active
  const {
    data: tokenAssets,
    isLoading: isLoadingAssets,
    error: tokenAssetError,
    refetch: refetchTokenAssets,
  } = useTokenAssets(walletAddress);

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
    // actionType will be "send", "receive", "buy", "earn"
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

        // Open URL in external browser
        await Linking.openURL(url);
      } catch (error) {
        console.error('Error opening YellowCard widget:', error);
        alert('Failed to open YellowCard widget. Please try again.');
      }
    } else if (actionType === 'earn') {
      // Show earn coming soon alert
      setShowEarnAlert(true);
    } else {
      router.push(`/transaction/${actionType}` as any);
    }
  };

  const handleProfileClick = () => {
    walletSwitcherRef.current?.present();
  };

  const handleWalletSuccess = async () => {
    await loadUserData();
    await refetchTokenAssets();
  };

  const handleDeleteWallet = (walletId: string, isMasterWallet?: boolean) => {
    if (isMasterWallet) {
      alert(
        'Cannot Delete Main Wallet',
        'The main wallet cannot be deleted as it contains the master seed phrase for your account.',
        [{ text: 'OK', style: 'default' }],
        'warning',
      );
      return;
    }

    confirm(
      'Delete Wallet',
      'Are you sure you want to delete this wallet? This action cannot be undone.',
      async () => {
        try {
          await removeWalletFromList(walletId);
          await loadUserData();
          await refetchTokenAssets();
          success('Wallet deleted successfully.');
          walletSwitcherRef.current?.present(); // Reopen the bottom sheet to show updated list
        } catch (error) {
          showError('Failed to delete wallet.');
          console.error('Error deleting wallet:', error);
        }
      },
    );
  };

  const handleWalletSwitch = async () => {
    await loadUserData();
    await refetchTokenAssets();
  };

  return (
    <ScreenContainer edges={['top']}>
      {activeTab === 'tokens' ? (
        <FlashList
          data={tokenAssets?.tokenAssets || []}
          keyExtractor={(item) => item.address}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          ListHeaderComponent={
            <>
              {/* Header section */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.userSection}
                  onPress={handleProfileClick}
                >
                  <Avatar size={scale(32)} user={genericUser} />
                  <View style={styles.userInfo}>
                    <Text style={styles.usernameText}>{walletName}</Text>
                    <Text style={styles.walletNameText}>@{username}</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.headerIcons}>
                  <TouchableOpacity
                    onPress={() => setShowRewardsAlert(true)}
                    style={styles.iconButton}
                  >
                    <Gift
                      size={scale(ICON_SIZE)}
                      color={colors.textPrimary}
                      strokeWidth={ICON_STROKE_WIDTH}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/settings')}
                    style={styles.iconButton}
                  >
                    <Settings
                      size={scale(ICON_SIZE)}
                      color={colors.textPrimary}
                      strokeWidth={ICON_STROKE_WIDTH}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Balance card */}
              <BalanceCard onActionPress={handleBalanceCardAction} />

              {/* Tab selector */}
              <TabSelector activeTab={activeTab} onTabPress={setActiveTab} />
            </>
          }
          renderItem={({ item, index }) => {
            return (
              <Animated.View
                entering={FadeInRight.delay(100 + index * 100).duration(400)}
              >
                <TokenItemHome
                  token={item}
                  isLoading={isLoadingAssets}
                  onPress={() =>
                    router.push(
                      `/token/${item.address}?symbol=${encodeURIComponent(item.symbol)}&name=${encodeURIComponent(item.name)}`,
                    )
                  }
                />
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary }}>
                {isLoadingAssets
                  ? 'Loading tokens...'
                  : tokenAssetError
                    ? `Error: ${tokenAssetError.message}`
                    : 'No tokens found'}
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header section */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.userSection}
              onPress={handleProfileClick}
            >
              <Avatar size={scale(32)} user={genericUser} />
              <View style={styles.userInfo}>
                <Text style={styles.usernameText}>{walletName}</Text>
                <Text style={styles.walletNameText}>@{username}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.headerIcons}>
              <TouchableOpacity
                onPress={() => setShowRewardsAlert(true)}
                style={styles.iconButton}
              >
                <Gift
                  size={scale(22)}
                  color={colors.textPrimary}
                  strokeWidth={ICON_STROKE_WIDTH}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                style={styles.iconButton}
              >
                <Settings
                  size={scale(22)}
                  color={colors.textPrimary}
                  strokeWidth={ICON_STROKE_WIDTH}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Balance card */}
          <BalanceCard onActionPress={handleBalanceCardAction} />

          {/* Tab selector */}
          <TabSelector activeTab={activeTab} onTabPress={setActiveTab} />

          {/* Activity content */}
          <View style={styles.activitySection}>
            <Text style={styles.placeholderText}>
              Activity content coming soon...
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Rewards Alert */}
      <CustomAlert
        visible={showRewardsAlert}
        onDismiss={() => setShowRewardsAlert(false)}
        title="Rewards Coming Soon"
        message="Stay tuned! Rewards feature will be available soon."
        type="info"
        buttons={[
          {
            text: 'OK',
            onPress: () => setShowRewardsAlert(false),
            style: 'default',
          },
        ]}
      />

      {/* Earn Alert */}
      <CustomAlert
        visible={showEarnAlert}
        onDismiss={() => setShowEarnAlert(false)}
        title="Earn Coming Soon"
        message="Stay tuned! Earn feature will be available soon."
        type="info"
        buttons={[
          {
            text: 'OK',
            onPress: () => setShowEarnAlert(false),
            style: 'default',
          },
        ]}
      />

      {/* Wallet Switcher Bottom Sheet */}
      <WalletSwitcherBottomSheet
        ref={walletSwitcherRef}
        onDeleteWallet={handleDeleteWallet}
        onWalletSwitch={handleWalletSwitch}
        onSuccess={handleWalletSuccess}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: scale(12),
  },
  flatListContent: {
    padding: scale(12),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  iconButton: {
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
