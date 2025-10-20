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
import { Share as ShareIcon } from 'lucide-react-native';
import { scale, verticalScale } from 'react-native-size-matters';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withSequence,
  withDelay,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import colors from '@/constants/colors';
import ScreenHeader from '@/components/ScreenHeader';
import ScreenContainer from '@/components/ScreenContainer';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
import CopyButton, { CopyButtonRef } from '@/components/CopyButton';
import SecondaryActionButton from '@/components/buttons/SecondaryActionButton';
import { setStringAsync } from 'expo-clipboard';
import { useWalletPublicKey } from '@/services/walletService';

const { width } = Dimensions.get('window');
const QR_SIZE = Math.min(width * 0.6, scale(200));

export default function ReceiveScreen() {
  const router = useRouter();
  const walletAddress = useWalletPublicKey();
  const addressInputRef = useRef(null);
  const copyButtonRef = useRef<CopyButtonRef>(null);

  const [isCopied, setIsCopied] = useState(false);

  const handleCopyComplete = () => {
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleAddressClick = async () => {
    // Copy to clipboard
    await setStringAsync(walletAddress || '');
    // Trigger the copy button animation
    copyButtonRef.current?.triggerCopy();
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
        title="Receive"
        onBack={() => router.push('/' as any)}
        showBackButton={false}
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
          <View style={styles.addressLabelContainer}>
            <Text style={styles.addressLabel}>Wallet Address (Solana)</Text>
            {isCopied && (
              <Animated.Text
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={styles.copiedText}
              >
                Copied!
              </Animated.Text>
            )}
          </View>

          <PrimaryActionButton
            title="Share"
            onPress={handleShare}
            variant="secondary"
            icon={<ShareIcon size={scale(18)} color={colors.textSecondary} />}
          />
        </View>

        <PrimaryActionButton
          title={formatAddress(walletAddress || '')}
          onPress={handleAddressClick}
          variant="primary"
          icon={
            <CopyButton
              ref={copyButtonRef}
              textToCopy={walletAddress || ''}
              size={scale(16)}
              color="#000"
              style={styles.copyButtonInSecondary}
              onCopyComplete={handleCopyComplete}
            />
          }
        />
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
  addressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  addressLabel: {
    fontSize: scale(12),
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  copiedText: {
    fontSize: scale(12),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
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
  copyButtonInSecondary: {
    padding: 0, // Remove padding since it's inside the secondary button
  },
  bottomSection: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(24),
  },
});
