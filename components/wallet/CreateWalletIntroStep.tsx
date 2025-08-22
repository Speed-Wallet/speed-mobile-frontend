import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRef, useEffect } from 'react';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { RefreshCw } from 'lucide-react-native';
import 'react-native-get-random-values';

interface CreateWalletIntroStepProps {
  onCreateWallet: () => void;
  onImportWallet?: () => void;
  isLoading: boolean;
}

export default function CreateWalletIntroStep({
  onCreateWallet,
  onImportWallet,
  isLoading,
}: CreateWalletIntroStepProps) {
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
          ]}
        >
          <View style={styles.logoBackground}>
            <RefreshCw size={48} color="#000" />
          </View>
        </Animated.View>

        {/* Welcome Text */}
        <Animated.View
          style={[
            styles.welcomeTextContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateY }],
            },
          ]}
        >
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
          ]}
        >
          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.8}
            onPress={onCreateWallet}
            disabled={isLoading}
          >
            <View style={styles.buttonBackground}>
              <Text style={styles.buttonText}>Create new wallet</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.importLink}
            onPress={() => {
              if (onImportWallet) {
                onImportWallet();
              }
            }}
          >
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
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#00CFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#00CFFF',
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
  },
  buttonBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#00CFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    fontWeight: '600',
  },
  importLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  importText: {
    fontSize: 18,
    color: '#00CFFF',
    fontWeight: '500',
  },
  disabledLink: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#888888',
  },
});
