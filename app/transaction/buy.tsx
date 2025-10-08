// import { useState, useEffect, useRef, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   ScrollView,
//   Image,
//   Linking,
//   Animated as RNAnimated,
// } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import {
//   X,
//   ChevronDown,
//   Info,
//   CreditCard,
//   ExternalLink,
// } from 'lucide-react-native';
// import Animated, { FadeIn } from 'react-native-reanimated';
// import { WebView } from 'react-native-webview';
// import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

// import { triggerShake } from '@/utils/animations';
// import { createYellowCardAuth } from '@/utils/yellowcard-auth';

// import colors from '@/constants/colors';
// import { formatCurrency } from '@/utils/formatters';
// import { getAllTokenInfo, getTokenByAddress } from '@/data/tokens';
// import { EnrichedTokenEntry } from '@/data/types';
// import { getWalletPublicKey } from '@/services/walletService';
// import ScreenHeader from '@/components/ScreenHeader';
// import ScreenContainer from '@/components/ScreenContainer';
// import BottomActionContainer from '@/components/BottomActionContainer';
// import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';
// import TokenLogo from '@/components/TokenLogo';
// import { generateSignature } from '@/utils/signature';

// const paymentMethods = [
//   {
//     id: 'yellowcard',
//     name: 'YellowCard',
//     icon: <CreditCard size={20} color={colors.textPrimary} />,
//     provider: 'YellowCard',
//     url: 'https://yellowcard.io',
//   },
// ];

// const quickAmounts = [10, 100, 1000];

// // USDT token data for logo
// const USDT_LOGO_URI = 'local://usdt-logo.png';

// export default function BuyScreen() {
//   const { tokenAddress, selectedTokenAddress } = useLocalSearchParams<{
//     tokenAddress?: string;
//     selectedTokenAddress?: string;
//   }>();
//   const router = useRouter();
//   const [selectedToken, setSelectedToken] = useState<EnrichedTokenEntry | null>(
//     null,
//   );
//   const [tokenList, setTokenList] = useState<EnrichedTokenEntry[]>([]);
//   const [amount, setAmount] = useState('');
//   const [selectedMethod, setSelectedMethod] = useState(paymentMethods[0]);
//   const [showWebView, setShowWebView] = useState(false);
//   const [webViewLoading, setWebViewLoading] = useState(false);
//   const shakeAnimationValue = useRef(new RNAnimated.Value(0)).current;
//   const amountInputRef = useRef<TextInput>(null);

//   // Custom keyboard state
//   const [showCustomKeyboard, setShowCustomKeyboard] = useState(true);
//   const [activeInput, setActiveInput] = useState<'amount' | null>(null);

//   // YellowCard widget state
//   const [walletAddress, setWalletAddress] = useState('');
//   const [signature, setSignature] = useState('');
//   const [widgetUrl, setWidgetUrl] = useState(
//     'https://sandbox--payments-widget.netlify.app/landing/d5bfaa148d8534514e478def46d2ffea',
//   );

//   useEffect(() => {
//     loadData();
//   }, [tokenAddress]);

//   // Handle token selection from the token selector page
//   useEffect(() => {
//     if (selectedTokenAddress) {
//       const loadSelectedToken = async () => {
//         const token = await getTokenByAddress(selectedTokenAddress);
//         setSelectedToken(token);
//       };
//       loadSelectedToken();

//       // Clear the param to prevent re-triggering
//       router.setParams({ selectedTokenAddress: undefined });
//     }
//   }, [selectedTokenAddress]);

//   // Effect to generate signature and wallet address for YellowCard widget
//   useEffect(() => {
//     const initializeWidgetParams = async () => {
//       try {
//         // Get wallet address
//         const address = await getWalletPublicKey();
//         if (address) {
//           setWalletAddress(address);
//         }

//         // Generate authentication headers for YellowCard API
//         if (amount && address) {
//           try {
//             const apiKey = process.env.EXPO_PUBLIC_YELLOWCARD_API_KEY;

//             // Build widget URL with API key
//             const params = new URLSearchParams({
//               walletAddress: address,
//               network: 'SOL',
//               signature: await generateSignature(address, 'USDT'),
//             });

//             console.log('params', params);

//             setWidgetUrl(
//               `https://sandbox--payments-widget.netlify.app/landing/${apiKey}?${params.toString()}`,
//             );
//           } catch (error) {
//             console.error('Error generating YellowCard auth headers:', error);
//           }
//         }
//       } catch (error) {
//         console.error('Error initializing widget params:', error);
//       }
//     };

//     initializeWidgetParams();
//   }, [amount]);

//   if (Array.isArray(tokenAddress)) {
//     throw new Error('tokenAddress should not be an array');
//   }

//   const loadData = async () => {
//     const tokens = await getAllTokenInfo();
//     setTokenList(tokens);

//     if (tokenAddress) {
//       const token = await getTokenByAddress(tokenAddress);
//       setSelectedToken(token);
//     } else if (tokens.length > 0) {
//       setSelectedToken(tokens[0]);
//     }
//   };

//   const handleBuy = () => {
//     if (!amount || parseFloat(amount) <= 0) {
//       triggerShake(shakeAnimationValue);
//       amountInputRef.current?.focus();
//       return;
//     }

//     // Check if YellowCard is selected
//     if (selectedMethod.id === 'yellowcard') {
//       setShowWebView(true);
//     } else {
//       // Open the selected provider's website for other methods
//       Linking.openURL(selectedMethod.url);
//     }
//   };

//   const getTokenAmount = () => {
//     if (!amount || !selectedToken) return '0';
//     return (parseFloat(amount) / selectedToken.price).toFixed(8);
//   };

//   const handleQuickAmount = (value: number) => {
//     setAmount(value.toString());
//   };

//   // Custom keyboard handlers
//   const handleKeyPress = useCallback(
//     (key: string) => {
//       if (!activeInput) return;

//       if (key === 'backspace') {
//         setAmount((prev) => prev.slice(0, -1));
//       } else if (key === '.') {
//         if (!amount.includes('.')) {
//           setAmount((prev) => prev + '.');
//         }
//       } else {
//         // Number key
//         setAmount((prev) => {
//           // Prevent multiple leading zeros
//           if (prev === '0' && key !== '.') return key;
//           return prev + key;
//         });
//       }
//     },
//     [activeInput, amount],
//   );

//   const handleInputFocus = useCallback(() => {
//     setActiveInput('amount');
//   }, []);

//   const handleCloseKeyboard = useCallback(() => {
//     setActiveInput(null);
//   }, []);

//   return (
//     <ScreenContainer edges={['top', 'bottom']}>
//       {showWebView ? (
//         // WebView for YellowCard widget
//         <View style={styles.webViewContainer}>
//           <View style={styles.webViewHeader}>
//             <TouchableOpacity
//               style={styles.closeButton}
//               onPress={() => setShowWebView(false)}
//             >
//               <X size={24} color={colors.textPrimary} />
//             </TouchableOpacity>
//             <Text style={styles.webViewTitle}>Buy Crypto with YellowCard</Text>
//             {webViewLoading && (
//               <Text style={styles.loadingText}>Loading...</Text>
//             )}
//           </View>
//           <WebView
//             source={{
//               uri: widgetUrl,
//             }}
//             style={styles.webView}
//             javaScriptEnabled={true}
//             domStorageEnabled={true}
//             startInLoadingState={true}
//             mediaPlaybackRequiresUserAction={false}
//             allowsInlineMediaPlayback={true}
//             onError={(syntheticEvent) => {
//               const { nativeEvent } = syntheticEvent;
//               console.warn('WebView error: ', nativeEvent);
//               alert('Failed to load YellowCard widget. Please try again.');
//             }}
//             onLoadStart={() => {
//               setWebViewLoading(true);
//             }}
//             onLoadEnd={() => {
//               setWebViewLoading(false);
//             }}
//             onNavigationStateChange={(navState) => {
//               // Handle navigation changes if needed
//               // console.log('WebView navigation:', navState.url);
//             }}
//           />
//         </View>
//       ) : (
//         <>
//           <ScreenHeader title="Buy" onBack={() => router.push('/' as any)} />

//           <View style={styles.mainContent}>
//             <ScrollView
//               showsVerticalScrollIndicator={false}
//               contentContainerStyle={styles.content}
//             >
//               {selectedToken && (
//                 <>
//                   {/* Amount Input */}
//                   <Animated.View
//                     entering={FadeIn.delay(100)}
//                     style={styles.amountSection}
//                   >
//                     <Text style={styles.amountLabel}>Amount to Buy (USD)</Text>
//                     <RNAnimated.View
//                       style={[
//                         styles.amountDisplay,
//                         {
//                           transform: [{ translateX: shakeAnimationValue }],
//                         },
//                       ]}
//                     >
//                       <TokenLogo
//                         logoURI={USDT_LOGO_URI}
//                         size={36}
//                         style={styles.currencyLogo}
//                       />
//                       <TextInput
//                         ref={amountInputRef}
//                         style={styles.amountInput}
//                         placeholder="0.00"
//                         placeholderTextColor={colors.textSecondary}
//                         keyboardType="decimal-pad"
//                         showSoftInputOnFocus={false}
//                         value={amount}
//                         onChangeText={setAmount}
//                         onFocus={handleInputFocus}
//                       />
//                     </RNAnimated.View>
//                     <Text style={styles.tokenAmount}>
//                       ≈ {getTokenAmount()} {selectedToken.symbol}
//                     </Text>

//                     <View style={styles.quickAmounts}>
//                       {quickAmounts.map((value) => (
//                         <TouchableOpacity
//                           key={value}
//                           style={[
//                             styles.quickAmountButton,
//                             amount === value.toString() &&
//                               styles.quickAmountButtonActive,
//                           ]}
//                           onPress={() => handleQuickAmount(value)}
//                         >
//                           <Text
//                             style={[
//                               styles.quickAmountText,
//                               amount === value.toString() &&
//                                 styles.quickAmountTextActive,
//                             ]}
//                           >
//                             ${value}
//                           </Text>
//                         </TouchableOpacity>
//                       ))}
//                     </View>
//                   </Animated.View>

//                   {/* Payment Info */}
//                   <Animated.View entering={FadeIn.delay(200)}>
//                     <View style={styles.paymentInfo}>
//                       <Info size={16} color={colors.textSecondary} />
//                       <Text style={styles.paymentInfoText}>
//                         Payment made with USDT via YellowCard
//                       </Text>
//                     </View>
//                   </Animated.View>
//                 </>
//               )}
//             </ScrollView>

//             {/* Bottom Section - Keyboard and Button */}
//             <View style={styles.bottomSection}>
//               {/* Custom Keyboard */}
//               {showCustomKeyboard && (
//                 <View style={styles.inlineKeyboard}>
//                   <View style={styles.keyboardGrid}>
//                     <View style={styles.keyboardRow}>
//                       <TouchableOpacity
//                         style={[
//                           styles.keyboardKey,
//                           !activeInput && styles.keyboardKeyDisabled,
//                         ]}
//                         onPress={() => handleKeyPress('1')}
//                         disabled={!activeInput}
//                       >
//                         <Text
//                           style={[
//                             styles.keyboardKeyText,
//                             !activeInput && styles.keyboardKeyTextDisabled,
//                           ]}
//                         >
//                           1
//                         </Text>
//                       </TouchableOpacity>
//                       <TouchableOpacity
//                         style={[
//                           styles.keyboardKey,
//                           !activeInput && styles.keyboardKeyDisabled,
//                         ]}
//                         onPress={() => handleKeyPress('2')}
//                         disabled={!activeInput}
//                       >
//                         <Text
//                           style={[
//                             styles.keyboardKeyText,
//                             !activeInput && styles.keyboardKeyTextDisabled,
//                           ]}
//                         >
//                           2
//                         </Text>
//                       </TouchableOpacity>
//                       <TouchableOpacity
//                         style={[
//                           styles.keyboardKey,
//                           !activeInput && styles.keyboardKeyDisabled,
//                         ]}
//                         onPress={() => handleKeyPress('3')}
//                         disabled={!activeInput}
//                       >
//                         <Text
//                           style={[
//                             styles.keyboardKeyText,
//                             !activeInput && styles.keyboardKeyTextDisabled,
//                           ]}
//                         >
//                           3
//                         </Text>
//                       </TouchableOpacity>
//                     </View>

//                     <View style={styles.keyboardRow}>
//                       <TouchableOpacity
//                         style={[
//                           styles.keyboardKey,
//                           !activeInput && styles.keyboardKeyDisabled,
//                         ]}
//                         onPress={() => handleKeyPress('4')}
//                         disabled={!activeInput}
//                       >
//                         <Text
//                           style={[
//                             styles.keyboardKeyText,
//                             !activeInput && styles.keyboardKeyTextDisabled,
//                           ]}
//                         >
//                           4
//                         </Text>
//                       </TouchableOpacity>
//                       <TouchableOpacity
//                         style={[
//                           styles.keyboardKey,
//                           !activeInput && styles.keyboardKeyDisabled,
//                         ]}
//                         onPress={() => handleKeyPress('5')}
//                         disabled={!activeInput}
//                       >
//                         <Text
//                           style={[
//                             styles.keyboardKeyText,
//                             !activeInput && styles.keyboardKeyTextDisabled,
//                           ]}
//                         >
//                           5
//                         </Text>
//                       </TouchableOpacity>
//                       <TouchableOpacity
//                         style={[
//                           styles.keyboardKey,
//                           !activeInput && styles.keyboardKeyDisabled,
//                         ]}
//                         onPress={() => handleKeyPress('6')}
//                         disabled={!activeInput}
//                       >
//                         <Text
//                           style={[
//                             styles.keyboardKeyText,
//                             !activeInput && styles.keyboardKeyTextDisabled,
//                           ]}
//                         >
//                           6
//                         </Text>
//                       </TouchableOpacity>
//                     </View>

//                     <View style={styles.keyboardRow}>
//                       <TouchableOpacity
//                         style={[
//                           styles.keyboardKey,
//                           !activeInput && styles.keyboardKeyDisabled,
//                         ]}
//                         onPress={() => handleKeyPress('7')}
//                         disabled={!activeInput}
//                       >
//                         <Text
//                           style={[
//                             styles.keyboardKeyText,
//                             !activeInput && styles.keyboardKeyTextDisabled,
//                           ]}
//                         >
//                           7
//                         </Text>
//                       </TouchableOpacity>
//                       <TouchableOpacity
//                         style={[
//                           styles.keyboardKey,
//                           !activeInput && styles.keyboardKeyDisabled,
//                         ]}
//                         onPress={() => handleKeyPress('8')}
//                         disabled={!activeInput}
//                       >
//                         <Text
//                           style={[
//                             styles.keyboardKeyText,
//                             !activeInput && styles.keyboardKeyTextDisabled,
//                           ]}
//                         >
//                           8
//                         </Text>
//                       </TouchableOpacity>
//                       <TouchableOpacity
//                         style={[
//                           styles.keyboardKey,
//                           !activeInput && styles.keyboardKeyDisabled,
//                         ]}
//                         onPress={() => handleKeyPress('9')}
//                         disabled={!activeInput}
//                       >
//                         <Text
//                           style={[
//                             styles.keyboardKeyText,
//                             !activeInput && styles.keyboardKeyTextDisabled,
//                           ]}
//                         >
//                           9
//                         </Text>
//                       </TouchableOpacity>
//                     </View>

//                     <View style={styles.keyboardRow}>
//                       <TouchableOpacity
//                         style={[
//                           styles.keyboardKey,
//                           !activeInput && styles.keyboardKeyDisabled,
//                         ]}
//                         onPress={() => handleKeyPress('.')}
//                         disabled={!activeInput}
//                       >
//                         <Text
//                           style={[
//                             styles.keyboardKeyText,
//                             !activeInput && styles.keyboardKeyTextDisabled,
//                           ]}
//                         >
//                           .
//                         </Text>
//                       </TouchableOpacity>
//                       <TouchableOpacity
//                         style={[
//                           styles.keyboardKey,
//                           !activeInput && styles.keyboardKeyDisabled,
//                         ]}
//                         onPress={() => handleKeyPress('0')}
//                         disabled={!activeInput}
//                       >
//                         <Text
//                           style={[
//                             styles.keyboardKeyText,
//                             !activeInput && styles.keyboardKeyTextDisabled,
//                           ]}
//                         >
//                           0
//                         </Text>
//                       </TouchableOpacity>
//                       <TouchableOpacity
//                         style={[
//                           styles.keyboardKey,
//                           !activeInput && styles.keyboardKeyDisabled,
//                         ]}
//                         onPress={() => handleKeyPress('backspace')}
//                         disabled={!activeInput}
//                       >
//                         <Text
//                           style={[
//                             styles.keyboardKeyText,
//                             !activeInput && styles.keyboardKeyTextDisabled,
//                           ]}
//                         >
//                           ⌫
//                         </Text>
//                       </TouchableOpacity>
//                     </View>
//                   </View>
//                 </View>
//               )}
//             </View>

//             {/* Buy Button */}
//             <View style={styles.buttonContainer}>
//               <PrimaryActionButton
//                 title="Open YellowCard Widget"
//                 onPress={handleBuy}
//                 variant="primary"
//                 icon={<ExternalLink size={18} color="#000" />}
//                 iconPosition="right"
//               />
//             </View>
//           </View>
//         </>
//       )}
//     </ScreenContainer>
//   );
// }

// const styles = StyleSheet.create({
//   mainContent: {
//     flex: 1,
//   },
//   // Bottom section for keyboard and button
//   bottomSection: {
//     backgroundColor: colors.backgroundDark,
//     paddingBottom: verticalScale(34), // Safe area padding
//   },
//   buttonContainer: {
//     paddingHorizontal: moderateScale(20, 2.0),
//     paddingTop: moderateScale(4, 2.0),
//     paddingBottom: verticalScale(16),
//     marginTop: -8,
//   },
//   content: {
//     padding: 16,
//     paddingBottom: 120,
//   },
//   amountSection: {
//     backgroundColor: colors.backgroundMedium,
//     borderRadius: 16,
//     padding: 24,
//     marginBottom: 24,
//     alignItems: 'center',
//   },
//   amountLabel: {
//     fontSize: 14,
//     fontFamily: 'Inter-Medium',
//     color: colors.textSecondary,
//     marginBottom: 16,
//   },
//   amountDisplay: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 8,
//   },
//   currencySymbol: {
//     fontSize: 40,
//     fontFamily: 'Inter-SemiBold',
//     color: colors.textPrimary,
//     marginRight: 4,
//   },
//   currencyLogo: {
//     marginRight: 8,
//   },
//   amountInput: {
//     fontSize: 40,
//     fontFamily: 'Inter-SemiBold',
//     color: colors.textPrimary,
//     minWidth: 120,
//     textAlign: 'center',
//   },
//   tokenAmount: {
//     fontSize: 16,
//     fontFamily: 'Inter-Regular',
//     color: colors.textSecondary,
//     marginBottom: 24,
//   },
//   quickAmounts: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 12,
//   },
//   quickAmountButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     backgroundColor: 'transparent',
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#00CFFF',
//   },
//   quickAmountButtonActive: {
//     backgroundColor: '#00CFFF' + '20',
//     borderColor: '#00CFFF',
//   },
//   quickAmountText: {
//     fontSize: 14,
//     fontFamily: 'Inter-Medium',
//     color: '#00CFFF',
//   },
//   quickAmountTextActive: {
//     color: '#00CFFF',
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontFamily: 'Inter-SemiBold',
//     color: colors.textPrimary,
//     marginBottom: 12,
//   },
//   methodsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//     marginBottom: 24,
//   },
//   methodCard: {
//     width: '100%',
//     backgroundColor: colors.backgroundMedium,
//     borderRadius: 16,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     marginBottom: 8,
//   },
//   selectedMethodCard: {
//     borderColor: colors.primary,
//     backgroundColor: colors.backgroundLight,
//   },
//   methodContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   methodIconContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: colors.backgroundLight,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   methodName: {
//     flex: 1,
//     fontSize: 14,
//     fontFamily: 'Inter-SemiBold',
//     color: colors.textPrimary,
//   },
//   recommendedBadge: {
//     backgroundColor: colors.primary + '20',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   recommendedText: {
//     fontSize: 12,
//     fontFamily: 'Inter-Medium',
//     color: colors.primary,
//   },
//   providerInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.backgroundLight,
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 24,
//   },
//   providerText: {
//     flex: 1,
//     marginLeft: 8,
//     fontSize: 12,
//     fontFamily: 'Inter-Regular',
//     color: colors.textSecondary,
//   },
//   bottomContainer: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//   },
//   webViewContainer: {
//     flex: 1,
//     backgroundColor: colors.backgroundDark,
//   },
//   webViewHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: colors.backgroundMedium,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   closeButton: {
//     padding: 8,
//     marginRight: 12,
//   },
//   webViewTitle: {
//     flex: 1,
//     fontSize: 16,
//     fontFamily: 'Inter-SemiBold',
//     color: colors.textPrimary,
//   },
//   loadingText: {
//     fontSize: 12,
//     fontFamily: 'Inter-Regular',
//     color: colors.textSecondary,
//     marginLeft: 8,
//   },
//   webView: {
//     flex: 1,
//   },
//   // Custom keyboard styles
//   inlineKeyboard: {
//     paddingHorizontal: scale(14),
//     paddingTop: verticalScale(2),
//     paddingBottom: verticalScale(0),
//   },
//   keyboardGrid: {
//     gap: scale(6),
//     marginBottom: 0,
//   },
//   keyboardRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: scale(6),
//   },
//   keyboardKey: {
//     flex: 1,
//     height: verticalScale(56),
//     backgroundColor: 'transparent',
//     borderRadius: scale(6),
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   keyboardKeyText: {
//     fontSize: moderateScale(18),
//     fontFamily: 'Inter-SemiBold',
//     color: colors.textPrimary,
//   },
//   keyboardKeyDisabled: {
//     backgroundColor: 'transparent',
//     opacity: 0.5,
//   },
//   keyboardKeyTextDisabled: {
//     color: colors.textSecondary,
//     opacity: 0.5,
//   },
//   paymentInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.backgroundMedium,
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 24,
//   },
//   paymentInfoText: {
//     flex: 1,
//     marginLeft: 8,
//     fontSize: 14,
//     fontFamily: 'Inter-Medium',
//     color: colors.textSecondary,
//   },
// });
