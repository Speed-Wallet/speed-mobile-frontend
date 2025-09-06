import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRef, useEffect } from 'react';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import SpeedLogo from '@/components/SpeedLogo';
import ActionButtonGroup from '@/components/buttons/ActionButtonGroup';
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
          <SpeedLogo size={scale(140)} />
        </Animated.View>
      </View>

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
        <ActionButtonGroup
          primaryTitle="Create new wallet"
          onPrimaryPress={onCreateWallet}
          primaryDisabled={isLoading}
          primaryLoading={isLoading}
          secondaryTitle="Import wallet"
          onSecondaryPress={() => {
            if (onImportWallet) {
              onImportWallet();
            }
          }}
          secondaryStyle="text"
        />
      </Animated.View>
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
    paddingHorizontal: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: scale(24),
    paddingBottom:
      Platform.OS === 'ios' ? verticalScale(34) : verticalScale(24),
    paddingTop: verticalScale(20),
  },
});
