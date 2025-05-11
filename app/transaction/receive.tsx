import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, TextInput, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Copy, Download as DownloadSimple, Share as ShareIcon } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { getCryptoById, getCryptoData } from '@/data/crypto';
import UserData from '@/data/user';
import CryptoSelector from '@/components/CryptoSelector';
import QRCode from '@/components/QRCode';

const { width } = Dimensions.get('window');
const QR_SIZE = width * 0.7;

export default function ReceiveScreen() {
  const { cryptoId } = useLocalSearchParams();
  const router = useRouter();
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [cryptoList, setCryptoList] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [showCryptoSelector, setShowCryptoSelector] = useState(false);
  const addressInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [cryptoId]);

  const loadData = async () => {
    const cryptos = await getCryptoData();
    setCryptoList(cryptos);
    
    if (cryptoId) {
      const crypto = await getCryptoById(cryptoId);
      setSelectedCrypto(crypto);
      setWalletAddress(UserData.walletAddresses[crypto.id] || '');
    } else if (cryptos.length > 0) {
      setSelectedCrypto(cryptos[0]);
      setWalletAddress(UserData.walletAddresses[cryptos[0].id] || '');
    }
  };

  const handleCopyAddress = () => {
    // In a real app, this would copy to clipboard
    alert('Address copied to clipboard!');
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `My ${selectedCrypto.name} address: ${walletAddress}`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDownload = () => {
    // In a real app, this would download the QR code as an image
    alert('QR code saved to photos!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receive {selectedCrypto?.symbol}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {selectedCrypto && (
          <>
            <Animated.View entering={FadeIn} style={styles.cryptoSelector}>
              <TouchableOpacity 
                style={styles.cryptoButton}
                onPress={() => setShowCryptoSelector(true)}
              >
                <View style={styles.cryptoInfo}>
                  <View 
                    style={[
                      styles.cryptoIconContainer,
                      { backgroundColor: selectedCrypto.color + '33' } // Add transparency
                    ]}
                  >
                    <Text style={styles.cryptoIconText}>{selectedCrypto.symbol.charAt(0)}</Text>
                  </View>
                  <Text style={styles.cryptoName}>{selectedCrypto.name}</Text>
                </View>
                <Text style={styles.cryptoNetwork}>{selectedCrypto.network}</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.qrSection}>
              <Text style={styles.qrTitle}>
                Scan QR code to receive {selectedCrypto.name}
              </Text>
              
              <View style={styles.qrContainer}>
                <QRCode 
                  value={walletAddress}
                  size={QR_SIZE}
                  color={colors.textPrimary}
                  backgroundColor={colors.white}
                  logoUrl={selectedCrypto.iconUrl}
                />
              </View>
              
              <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>
                  {selectedCrypto.name} Address ({selectedCrypto.network})
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
                Only send {selectedCrypto.name} ({selectedCrypto.symbol}) to this address. 
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

      {/* Crypto Selector Modal */}
      {showCryptoSelector && (
        <CryptoSelector
          cryptoList={cryptoList}
          selectedCrypto={selectedCrypto}
          onSelectCrypto={(crypto) => {
            setSelectedCrypto(crypto);
            setWalletAddress(UserData.walletAddresses[crypto.id] || '');
            setShowCryptoSelector(false);
          }}
          onClose={() => setShowCryptoSelector(false)}
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
    paddingTop: 60,
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
  cryptoSelector: {
    marginBottom: 24,
  },
  cryptoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 16,
  },
  cryptoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cryptoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cryptoIconText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
  },
  cryptoName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  cryptoNetwork: {
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