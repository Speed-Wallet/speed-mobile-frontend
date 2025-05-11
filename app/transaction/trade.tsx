import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, ArrowDown, ArrowRightLeft } from 'lucide-react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import { getCryptoData, getCryptoById } from '@/data/crypto';
import CryptoSelector from '@/components/CryptoSelector';

export default function TradeScreen() {
  const { cryptoId } = useLocalSearchParams();
  const router = useRouter();
  const [fromCrypto, setFromCrypto] = useState(null);
  const [toCrypto, setToCrypto] = useState(null);
  const [cryptoList, setCryptoList] = useState([]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(0);

  useEffect(() => {
    loadData();
  }, [cryptoId]);

  useEffect(() => {
    if (fromCrypto && toCrypto) {
      calculateExchangeRate();
    }
  }, [fromCrypto, toCrypto]);

  useEffect(() => {
    if (fromAmount && exchangeRate) {
      calculateToAmount();
    }
  }, [fromAmount, exchangeRate]);

  const loadData = async () => {
    const cryptos = await getCryptoData();
    setCryptoList(cryptos);
    
    if (cryptoId) {
      const crypto = await getCryptoById(cryptoId);
      setFromCrypto(crypto);
      
      const defaultTo = cryptos.find(c => c.id !== crypto.id);
      if (defaultTo) {
        setToCrypto(defaultTo);
      }
    } else if (cryptos.length > 1) {
      setFromCrypto(cryptos[0]);
      setToCrypto(cryptos[1]);
    }
  };

  const calculateExchangeRate = () => {
    if (!fromCrypto || !toCrypto) return;
    const rate = fromCrypto.price / toCrypto.price;
    setExchangeRate(rate);
  };

  const calculateToAmount = () => {
    if (!fromAmount || !exchangeRate) return;
    const amount = parseFloat(fromAmount) * exchangeRate;
    setToAmount(amount.toFixed(6));
  };

  const handlePercentageSelect = (percentage: string) => {
    if (!fromCrypto) return;
    
    if (percentage === 'MAX') {
      setFromAmount(fromCrypto.balance.toString());
    } else {
      const percent = parseInt(percentage) / 100;
      setFromAmount((fromCrypto.balance * percent).toFixed(6));
    }
  };

  const handleSwapCryptos = () => {
    const temp = fromCrypto;
    setFromCrypto(toCrypto);
    setToCrypto(temp);
    
    if (fromAmount) {
      setFromAmount(toAmount);
      setToAmount('');
    }
  };

  const handleTrade = () => {
    // In a real app, this would execute the trade
    alert(`Trading ${fromAmount} ${fromCrypto.symbol} for ${toAmount} ${toCrypto.symbol}`);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trade</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {fromCrypto && toCrypto && (
          <>
            {/* From Crypto */}
            <Animated.View entering={FadeIn.delay(100)}>
              <View style={styles.cryptoCard}>
                <TouchableOpacity 
                  style={styles.cryptoSelector}
                  onPress={() => setShowFromSelector(true)}
                >
                  <Text style={styles.cryptoSymbol}>{fromCrypto.symbol}</Text>
                </TouchableOpacity>
                
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  value={fromAmount}
                  onChangeText={setFromAmount}
                />
                
                <Text style={styles.balanceText}>
                  Balance: {fromCrypto.balance} {fromCrypto.symbol}
                </Text>
                
                <Text style={styles.fiatValue}>
                  {fromAmount ? formatCurrency(parseFloat(fromAmount) * fromCrypto.price) : '$0.00'}
                </Text>
                
                <View style={styles.percentages}>
                  <TouchableOpacity
                    style={styles.percentageButton}
                    onPress={() => handlePercentageSelect('25')}
                  >
                    <Text style={styles.percentageText}>25%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.percentageButton}
                    onPress={() => handlePercentageSelect('50')}
                  >
                    <Text style={styles.percentageText}>50%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.percentageButton}
                    onPress={() => handlePercentageSelect('75')}
                  >
                    <Text style={styles.percentageText}>75%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.percentageButton, styles.maxButton]}
                    onPress={() => handlePercentageSelect('MAX')}
                  >
                    <Text style={[styles.percentageText, styles.maxText]}>MAX</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
            
            {/* Swap Button */}
            <TouchableOpacity 
              style={styles.swapButton}
              onPress={handleSwapCryptos}
            >
              <ArrowDown size={20} color={colors.primary} />
            </TouchableOpacity>
            
            {/* To Crypto */}
            <Animated.View entering={FadeIn.delay(200)}>
              <View style={styles.cryptoCard}>
                <TouchableOpacity 
                  style={styles.cryptoSelector}
                  onPress={() => setShowToSelector(true)}
                >
                  <Text style={styles.cryptoSymbol}>{toCrypto.symbol}</Text>
                </TouchableOpacity>
                
                <Text style={styles.amountText}>
                  {toAmount || '0.00'}
                </Text>
                
                <Text style={styles.balanceText}>
                  Balance: {toCrypto.balance} {toCrypto.symbol}
                </Text>
                
                <Text style={styles.fiatValue}>
                  {toAmount ? formatCurrency(parseFloat(toAmount) * toCrypto.price) : '$0.00'}
                </Text>
              </View>
            </Animated.View>
          </>
        )}
      </View>

      {/* Trade Button */}
      <Animated.View 
        entering={SlideInUp.duration(300)}
        style={styles.bottomContainer}
      >
        <TouchableOpacity 
          style={[
            styles.tradeButton,
            (!fromAmount || parseFloat(fromAmount) <= 0) && styles.tradeButtonDisabled
          ]}
          disabled={!fromAmount || parseFloat(fromAmount) <= 0}
          onPress={handleTrade}
        >
          <ArrowRightLeft size={20} color={colors.white} />
          <Text style={styles.tradeButtonText}>Trade</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Crypto Selectors */}
      {showFromSelector && (
        <CryptoSelector
          cryptoList={cryptoList}
          selectedCrypto={fromCrypto}
          excludeCryptoId={toCrypto?.id}
          onSelectCrypto={(crypto) => {
            setFromCrypto(crypto);
            setShowFromSelector(false);
          }}
          onClose={() => setShowFromSelector(false)}
        />
      )}

      {showToSelector && (
        <CryptoSelector
          cryptoList={cryptoList}
          selectedCrypto={toCrypto}
          excludeCryptoId={fromCrypto?.id}
          onSelectCrypto={(crypto) => {
            setToCrypto(crypto);
            setShowToSelector(false);
          }}
          onClose={() => setShowToSelector(false)}
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
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.backgroundDark,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 16,
  },
  cryptoCard: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 16,
  },
  cryptoSelector: {
    backgroundColor: colors.backgroundLight,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  cryptoSymbol: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  amountInput: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    padding: 0,
    marginBottom: 8,
  },
  amountText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fiatValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  percentages: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  percentageButton: {
    backgroundColor: colors.backgroundLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  maxButton: {
    backgroundColor: colors.primary + '20',
  },
  percentageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  maxText: {
    color: colors.primary,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 16,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundMedium,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  tradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 56,
  },
  tradeButtonDisabled: {
    backgroundColor: colors.backgroundLight,
    opacity: 0.7,
  },
  tradeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    marginLeft: 8,
  },
});