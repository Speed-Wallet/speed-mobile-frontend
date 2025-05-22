import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, TextInput, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Copy, Download as DownloadSimple, Share as ShareIcon } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { getTokenByAddress, getAllTokenInfo } from '@/data/tokens';
import UserData from '@/data/user';
import TokenSelector from '@/components/TokenSelector';
import QRCode from '@/components/QRCode';
import { TokenEntry } from '@/data/types';
import BackButton from '@/components/BackButton';
import { setStringAsync } from 'expo-clipboard';

const { width } = Dimensions.get('window');
const QR_SIZE = width * 0.7;

export default function ReceiveScreen() {
  const { tokenAddress } = useLocalSearchParams();
  const router = useRouter();
  const [selectedToken, setSelectedToken] = useState<TokenEntry | null>(null);
  const [tokenList, setTokenList] = useState<TokenEntry[]>([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const addressInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [tokenAddress]);

  if (Array.isArray(tokenAddress)) {
    throw new Error('tokenAddress should not be an array');
  }

  const loadData = async () => {
    const allTokens = await getAllTokenInfo();
    setTokenList(allTokens);
    setWalletAddress(UserData.walletAddress);
  }

  const handleCopyAddress = async () => {
    await setStringAsync(walletAddress || '');
  };

  const handleShare = async () => {
    // try {
    //   const result = await Share.share({
    //     message: `My ${tokenAddress.name} address: ${walletAddress}`,
    //   });
    // } catch (error) {
    //   alert(error.message);
    // }
  };

  const handleDownload = () => {
    alert('QR code saved to photos!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton style={styles.closeButton} onPress={() => router.push('/')} />
        <Text style={styles.headerTitle}>Receive Crypto</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {selectedToken && (
          <>
            <Animated.View entering={FadeIn} style={styles.tokenSelector}>
              <TouchableOpacity
                style={styles.tokenButton}
                onPress={() => setShowTokenSelector(true)}
              >
                <View style={styles.tokenInfo}>
                  <View
                    style={[
                      styles.tokenIconContainer,
                      { backgroundColor: selectedToken.color + '33' }
                    ]}
                  >
                    <Text style={styles.tokenIconText}>{selectedToken.symbol.charAt(0)}</Text>
                  </View>
                  <Text style={styles.tokenName}>{selectedToken.name}</Text>
                </View>
                <Text style={styles.tokenNetwork}>Solana</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.qrSection}>
              <Text style={styles.qrTitle}>
                Scan QR code to receive {selectedToken.name}
              </Text>

              <View style={styles.qrContainer}>
                <QRCode
                  value={walletAddress}
                  size={QR_SIZE}
                  color={colors.textPrimary}
                  backgroundColor={colors.white}
                  logoUrl={selectedToken.logoURI}
                />
              </View>

              <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>
                  {selectedToken.name} Address (Solana)
                </Text>
                <View style={styles.addressInputContainer}>
                  <TextInput
                    ref={addressInputRef}
                    style={styles.addressInput}
                    value={walletAddress}
                    editable={false}
                    multiline={Platform.OS === 'ios'}
                    numberOfLines={1}
                  />
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={handleCopyAddress}
                  >
                    <Copy size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.warning}>
              <Text style={styles.warningTitle}>Important!</Text>
              <Text style={styles.warningText}>
                Only send {selectedToken.name} ({selectedToken.symbol}) to this address.
                Sending any other coins may result in permanent loss.
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}
        >
          <ShareIcon size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDownload}
        >
          <DownloadSimple size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Save QR</Text>
        </TouchableOpacity>
      </View>

      {showTokenSelector && (
        <TokenSelector
          tokenList={tokenList}
          selectedToken={selectedToken}
          onSelectToken={(token) => {
            setSelectedToken(token);
            setWalletAddress(UserData.walletAddress);
            setShowTokenSelector(false);
          }}
          onClose={() => setShowTokenSelector(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tokenSelector: {
    marginBottom: 24,
  },
  tokenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 16,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tokenIconText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
  },
  tokenName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  tokenNetwork: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
  },
  addressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  addressLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  addressInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    paddingVertical: 16,
  },
  copyButton: {
    padding: 8,
  },
  warning: {
    backgroundColor: colors.warningLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.warning,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.warningDark,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    paddingVertical: 16,
    marginHorizontal: 8,
  },
  shareButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});