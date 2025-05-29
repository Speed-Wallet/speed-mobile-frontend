import { StyleSheet, View, Text, TouchableOpacity, Animated, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { RefreshCw } from 'lucide-react-native';

interface CreateWalletIntroStepProps {
  onCreateWallet: () => void;
  isLoading: boolean;
}

export default function CreateWalletIntroStep({ onCreateWallet, isLoading }: CreateWalletIntroStepProps) {
  const router = useRouter();
  useFrameworkReady();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
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
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateY }],
            },
          ]}>
          <LinearGradient
            colors={['#7c5cff', '#6446fe']}
            style={styles.logoGradient}>
            <RefreshCw size={48} color="#fff" />
          </LinearGradient>
        </Animated.View>

        {/* Welcome Text */}
        <Animated.View
          style={[
            styles.welcomeTextContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateY }],
            },
          ]}>
          <Text style={styles.welcomeText}>Welcome to Speed Wallet</Text>
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
              <Text style={styles.buttonText}>Create new wallet</Text>
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
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#6446fe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  welcomeTextContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  createButton: {
    width: '100%',
    maxWidth: 320,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#7c5cff',
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
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  importLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  importText: {
    fontSize: 18,
    color: '#7c5cff',
    fontWeight: '500',
  },
});
