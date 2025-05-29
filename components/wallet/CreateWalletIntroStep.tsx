import { StyleSheet, View, Text, TouchableOpacity, Animated, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ArrowRight, ShieldCheck, Key, RefreshCw } from 'lucide-react-native';

interface CreateWalletIntroStepProps {
  onCreateWallet: () => void;
  isLoading: boolean;
}

export default function CreateWalletIntroStep({ onCreateWallet, isLoading }: CreateWalletIntroStepProps) {
  const router = useRouter();
  useFrameworkReady();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header with logo */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateY }],
            },
          ]}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#7c5cff', '#6446fe']}
              style={styles.logoGradient}>
              <RefreshCw size={32} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.headerTitle}>Create New Wallet</Text>
          <Text style={styles.headerSubtitle}>
            Set up your secure Solana wallet in just a few steps
          </Text>
        </Animated.View>

        {/* Features list */}
        <Animated.View
          style={[
            styles.featuresList,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <ShieldCheck size={24} color="#7c5cff" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Military-grade encryption</Text>
              <Text style={styles.featureDescription}>
                Your data is protected with the highest level of security
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Key size={24} color="#7c5cff" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Full ownership</Text>
              <Text style={styles.featureDescription}>
                You alone control your crypto with your seed phrase
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Warning card */}
        <Animated.View
          style={[
            styles.warningCardWrapper,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          <LinearGradient
            colors={['rgba(255, 204, 0, 0.15)', 'rgba(255, 184, 0, 0.05)']}
            style={styles.warningCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.warningHeader}>
              <Text style={styles.warningTitle}>IMPORTANT</Text>
            </View>
            <Text style={styles.warningText}>
              You are responsible for securely storing your seed phrase. Losing it means losing access to your funds.
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Create wallet button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}>
          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.8}
            onPress={onCreateWallet}
            disabled={isLoading}>
            <LinearGradient
              colors={['#7c5cff', '#6446fe']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <Text style={styles.buttonText}>Create Wallet</Text>
              <ArrowRight size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.importLink}
            onPress={() => router.push('/wallet/import')}>
            <Text style={styles.importText}>I already have a wallet</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background
  },
  content: {
    flex: 1,
    justifyContent: 'space-between', // Distribute space
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20, // Adjust top padding for platform
    paddingBottom: 30, // Ensure space for bottom elements
  },
  header: {
    alignItems: 'center',
    marginBottom: 32, // Adjusted spacing
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20, // Adjusted spacing
  },
  logoGradient: {
    width: 72, // Slightly smaller logo
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8, // Android shadow
    shadowColor: '#6446fe', // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerTitle: {
    fontSize: 26, // Adjusted font size
    fontFamily: 'Inter-Bold', // Assuming Inter font family
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15, // Adjusted font size
    fontFamily: 'Inter-Regular', // Assuming Inter font family
    color: '#a0a0a0', // Lighter subtitle color
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320, // Max width for subtitle
  },
  featuresList: {
    marginBottom: 28, // Adjusted spacing
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 20, // Adjusted spacing
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Subtle background for items
    padding: 16,
    borderRadius: 12,
  },
  featureIconContainer: {
    width: 44, // Adjusted size
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16, // Adjusted font size
    fontFamily: 'Inter-SemiBold', // Assuming Inter font family
    color: '#ffffff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13, // Adjusted font size
    fontFamily: 'Inter-Regular', // Assuming Inter font family
    color: '#b0b0b0', // Lighter description color
    lineHeight: 18,
  },
  warningCardWrapper: {
    borderRadius: 16,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible', // Handle overflow for shadow/gradient
    marginBottom: 28, // Adjusted spacing
    elevation: 4, // Android shadow for card
    shadowColor: '#ffb800', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  warningCard: {
    borderRadius: 16,
    padding: 18, // Adjusted padding
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  warningHeader: {
    marginBottom: 6, // Adjusted spacing
  },
  warningTitle: {
    fontSize: 13, // Adjusted font size
    fontFamily: 'Inter-Bold', // Assuming Inter font family
    color: '#ffb800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  warningText: {
    fontSize: 13, // Adjusted font size
    fontFamily: 'Inter-Regular', // Assuming Inter font family
    color: '#ffcc66', // Lighter warning text
    lineHeight: 18,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 'auto', // Push buttons to the bottom if content is short
  },
  createButton: {
    width: '100%',
    height: 52, // Adjusted height
    borderRadius: 26,
    overflow: 'hidden', // For gradient border radius
    marginBottom: 16,
    elevation: 6, // Android shadow
    shadowColor: '#7c5cff', // iOS shadow
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17, // Adjusted font size
    fontFamily: 'Inter-SemiBold', // Assuming Inter font family
    color: '#ffffff',
    marginRight: 10, // Adjusted spacing
  },
  importLink: {
    alignItems: 'center',
    paddingVertical: 12, // Increased touch area
  },
  importText: {
    fontSize: 15, // Adjusted font size
    color: '#7c5cff',
    fontFamily: 'Inter-Medium', // Assuming Inter font family
  },
});
