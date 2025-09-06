import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import PrimaryActionButton from '@/components/buttons/PrimaryActionButton';

interface WalletSetupSuccessStepProps {
  onComplete: () => void;
  username: string;
}

const WalletSetupSuccessStep: React.FC<WalletSetupSuccessStepProps> = ({
  onComplete,
  username,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = useCallback(() => {
    setIsLoading(true);
    requestAnimationFrame(() => {
      onComplete();
    });
  }, [onComplete]);

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
        {/* Success Icon and Message */}
        <Animated.View
          style={[
            styles.messageArea,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <CheckCircle size={scale(64)} color="#22C55E" />
            </View>
          </View>

          <View style={styles.messageContainer}>
            <Text style={styles.title}>Wallet Created Successfully!</Text>
            <Text style={styles.subtitle}>
              Welcome <Text style={styles.username}>{username}</Text>! Your
              wallet has been created and secured with a PIN. Keep your seed
              phrase and PIN safe!
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Continue Button */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <PrimaryActionButton
          title={isLoading ? 'Loading...' : 'Go to Wallet'}
          onPress={handleComplete}
          disabled={isLoading}
          loading={isLoading}
          showArrow={!isLoading}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(24),
    paddingTop: Platform.OS === 'ios' ? verticalScale(60) : verticalScale(80),
  },
  messageArea: {
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(40),
  },
  iconBackground: {
    width: scale(140),
    height: scale(140),
    borderRadius: scale(70),
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  messageContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: verticalScale(24),
    paddingHorizontal: scale(20),
  },
  username: {
    fontWeight: '700',
    color: '#ffffff',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: scale(24),
    paddingBottom:
      Platform.OS === 'ios' ? verticalScale(34) : verticalScale(24),
    paddingTop: verticalScale(20),
  },
});

export default WalletSetupSuccessStep;
