import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Copy, Share as ShareIcon } from 'lucide-react-native';
import { scale, verticalScale } from 'react-native-size-matters';
import QRCode from 'react-native-qrcode-svg';
import colors from '@/constants/colors';
import ScreenHeader from '@/components/ScreenHeader';
import ScreenContainer from '@/components/ScreenContainer';
import { setStringAsync } from 'expo-clipboard';
import { useWalletPublicKey } from '@/services/walletService';

const { width } = Dimensions.get('window');
const QR_SIZE = Math.min(width * 0.6, scale(200));

export default function ReceiveScreen() {
  const router = useRouter();
  const walletAddress = useWalletPublicKey();
  const addressInputRef = useRef(null);

  const handleCopyAddress = async () => {
    await setStringAsync(walletAddress || '');
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `My Solana wallet address: ${walletAddress}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScreenHeader
        title="Receive Crypto"
        onBack={() => router.push('/' as any)}
      />

      <View style={styles.content}>
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>Scan QR code to receive crypto</Text>

          <View style={styles.qrContainer}>
            <QRCode
              value={walletAddress || ''}
              size={QR_SIZE}
              logo={require('@/assets/images/solana-logo.png')}
              logoSize={scale(40)}
            />
          </View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Wallet Address (Solana)</Text>
          <View style={styles.addressInputContainer}>
            <View style={styles.addressGroup}>
              <TextInput
                ref={addressInputRef}
                style={styles.addressInput}
                value={formatAddress(walletAddress || '')}
                editable={false}
                multiline={Platform.OS === 'ios'}
                numberOfLines={1}
              />
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyAddress}
              >
                <Copy size={scale(16)} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <ShareIcon size={scale(18)} color={colors.white} />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
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
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(16),
  },
  headerTitle: {
    fontSize: scale(18),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  closeButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: colors.backgroundMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: scale(40),
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(16),
    justifyContent: 'center',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  qrTitle: {
    fontSize: scale(14),
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
    marginBottom: verticalScale(12),
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: colors.white,
    borderRadius: scale(20),
    padding: scale(12),
    marginBottom: verticalScale(16),
  },
  addressContainer: {
    width: '100%',
    marginBottom: verticalScale(16),
  },
  addressLabel: {
    fontSize: scale(12),
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginBottom: verticalScale(6),
  },
  addressInputContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
  },
  addressGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressInput: {
    fontSize: scale(14),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginRight: scale(6),
  },
  copyButton: {
    padding: scale(6),
  },
  bottomSection: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(24),
  },
  actionButtons: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(24),
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: scale(14),
    paddingVertical: verticalScale(14),
  },
  actionButtonText: {
    color: colors.white,
    fontSize: scale(15),
    fontFamily: 'Inter-SemiBold',
    marginLeft: scale(8),
  },
});
