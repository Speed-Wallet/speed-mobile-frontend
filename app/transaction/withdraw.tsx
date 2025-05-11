import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, ArrowRight, ChevronDown, Info, CreditCard } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import { getAllTokenInfo, getTokenByAddress } from '@/data/tokens';
import TokenSelector from '@/components/TokenSelector';
import { EnrichedTokenEntry } from '@/data/types';

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    recommended: true,
    icon: <CreditCard size={20} color={colors.textPrimary} />,
    provider: 'Stripe',
    url: 'https://stripe.com'
  },
  {
    id: 'moonpay',
    name: 'MoonPay',
    recommended: false,
    icon: <Image source={{ uri: 'https://www.moonpay.com/assets/logo-full-white.svg' }} style={{ width: 20, height: 20 }} />,
    provider: 'MoonPay',
    url: 'https://www.moonpay.com'
  },
  {
    id: 'wyre',
    name: 'Wyre',
    recommended: false,
    icon: <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Wyre_Logo.png' }} style={{ width: 20, height: 20 }} />,
    provider: 'Wyre',
    url: 'https://www.sendwyre.com'
  }
];

const quickAmounts = [10, 100, 1000];

export default function BuyScreen() {
  const { tokenAddress } = useLocalSearchParams();
  const router = useRouter();
  const [selectedToken, setSelectedToken] = useState<EnrichedTokenEntry | null>(null);
  const [tokenList, setTokenList] = useState<EnrichedTokenEntry[]>([]);
  const [amount, setAmount] = useState('');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(paymentMethods[0]);

  useEffect(() => {
    loadData();
  }, [tokenAddress]);

  if (Array.isArray(tokenAddress)) {
    throw new Error('tokenAddress should not be an array');
  }

  const loadData = async () => {
    const tokens = await getAllTokenInfo();
    setTokenList(tokens);
    
    if (tokenAddress) {
      const token = await getTokenByAddress(tokenAddress);
      setSelectedToken(token);
    } else if (tokens.length > 0) {
      setSelectedToken(tokens[0]);
    }
  };

  const handleBuy = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    // Open the selected provider's website
    Linking.openURL(selectedMethod.url);
  };

  const getTokenAmount = () => {
    if (!amount || !selectedToken) return '0';
    return (parseFloat(amount) / selectedToken.price).toFixed(8);
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy {selectedToken?.symbol}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {selectedToken && (
          <>
            {/* Amount Input */}
            <Animated.View entering={FadeIn.delay(100)} style={styles.amountSection}>
              <Text style={styles.amountLabel}>Amount to Buy (USD)</Text>
              <View style={styles.amountDisplay}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
              <Text style={styles.tokenAmount}>
                ≈ {getTokenAmount()} {selectedToken.symbol}
              </Text>
              
              <View style={styles.quickAmounts}>
                {quickAmounts.map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.quickAmountButton,
                      amount === value.toString() && styles.quickAmountButtonActive
                    ]}
                    onPress={() => handleQuickAmount(value)}
                  >
                    <Text style={[
                      styles.quickAmountText,
                      amount === value.toString() && styles.quickAmountTextActive
                    ]}>
                      ${value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Payment Methods */}
            <Animated.View entering={FadeIn.delay(200)}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.methodsContainer}>
                {paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.methodCard,
                      selectedMethod.id === method.id && styles.selectedMethodCard
                    ]}
                    onPress={() => setSelectedMethod(method)}
                  >
                    <View style={styles.methodContent}>
                      <View style={styles.methodIconContainer}>
                        {method.icon}
                      </View>
                      <Text style={styles.methodName}>{method.name}</Text>
                      {method.recommended && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedText}>Recommended</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Provider Info */}
            <View style={styles.providerInfo}>
              <Info size={16} color={colors.textSecondary} />
              <Text style={styles.providerText}>
                You will be redirected to {selectedMethod.provider} to complete your purchase
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Buy Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[
            styles.buyButton,
            (!amount || parseFloat(amount) <= 0) && styles.buyButtonDisabled
          ]}
          disabled={!amount || parseFloat(amount) <= 0}
          onPress={handleBuy}
        >
          <Text style={styles.buyButtonText}>Continue to {selectedMethod.provider}</Text>
          <ArrowRight size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Token Selector Modal */}
      {showTokenSelector && (
        <TokenSelector
          tokenList={tokenList}
          selectedToken={selectedToken}
          onSelectToken={(token) => {
            setSelectedToken(token);
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
    padding: 16,
    paddingBottom: 120,
  },
  amountSection: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 40,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 40,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    minWidth: 120,
    textAlign: 'center',
  },
  tokenAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 24,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  quickAmountButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickAmountButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  quickAmountText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  quickAmountTextActive: {
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  methodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  methodCard: {
    width: '100%',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  selectedMethodCard: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundLight,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  recommendedBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  providerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
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
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 56,
  },
  buyButtonDisabled: {
    backgroundColor: colors.backgroundLight,
    opacity: 0.7,
  },
  buyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
    marginRight: 8,
  },
});