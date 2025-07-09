import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, TextInput, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Copy, Share as ShareIcon } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import colors from '@/constants/colors';
import ScreenHeader from '@/components/ScreenHeader';
import ScreenContainer from '@/components/ScreenContainer';
import { setStringAsync } from 'expo-clipboard';
import { useWalletPublicKey } from '@/services/walletService';

const { width } = Dimensions.get('window');
const QR_SIZE = width * 0.7;

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
        message: `My wallet address: ${walletAddress}`,
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
    <ScreenContainer>
      <ScreenHeader 
        title="Receive Crypto"
        onBack={() => router.push('/' as any)}
      />

      <View style={styles.content}>
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>
            Scan QR code to receive crypto
          </Text>

          <View style={styles.qrContainer}>
            <QRCode
              value={walletAddress || ''}
              size={QR_SIZE}
              logo={require('@/assets/images/solana-logo.png')}
              logoSize={60}
            />
          </View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>
            Wallet Address (Solana)
          </Text>
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
                <Copy size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <ShareIcon size={20} color={colors.white} />
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
  qrSection: {
    alignItems: 'center',
    marginTop: 80,
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  addressGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressInput: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginRight: 8,
  },
  copyButton: {
    padding: 8,
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});