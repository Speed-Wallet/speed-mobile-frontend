import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, SafeAreaView, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, ShieldCheck, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { triggerShake } from '@/utils/animations';

interface ConfirmPinStepProps {
  confirmPin: string;
  onConfirmPinChange: (pin: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  isLoading: boolean;
  pinError?: string;
}

const ConfirmPinStep: React.FC<ConfirmPinStepProps> = ({ 
  confirmPin, 
  onConfirmPinChange, 
  onConfirm, 
  onBack,
  isLoading,
  pinError
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const pinInputRef = useRef<TextInput>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;

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

  // Trigger shake animation when PIN error occurs
  useEffect(() => {
    if (pinError) {
      triggerShake(shakeAnimationValue);
    }
  }, [pinError]);

  const renderPinDots = () => {
    return (
      <View style={styles.pinDotsContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View key={index} style={styles.pinPosition}>
            {confirmPin.length > index ? (
              isVisible ? (
                <Text style={styles.pinDigitLarge}>{confirmPin[index]}</Text>
              ) : (
                <View style={[styles.pinDot, styles.pinDotFilled]} />
              )
            ) : (
              <View style={styles.pinDot} />
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}>
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['rgba(124, 92, 255, 0.15)', 'rgba(124, 92, 255, 0.05)']}
                style={styles.iconBadge}>
                <ShieldCheck size={24} color="#7c5cff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Confirm Your PIN</Text>
            <Text style={styles.subtitle}>
              Please re-enter your 4-digit PIN to confirm and secure your wallet.
            </Text>
          </View>
        </Animated.View>

        {/* PIN Input Card */}
        <Animated.View
          style={[
            styles.pinContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          <LinearGradient
            colors={['#1a1a1a', '#1f1f1f']}
            style={styles.pinCard}>
            <View style={styles.pinHeader}>
              <CheckCircle size={20} color="#7c5cff" />
              <Text style={styles.pinHeaderText}>Confirm PIN</Text>
              <TouchableOpacity
                style={styles.visibilityButton}
                onPress={() => setIsVisible(!isVisible)}>
                {isVisible ? (
                  <EyeOff size={18} color="#9ca3af" />
                ) : (
                  <Eye size={18} color="#9ca3af" />
                )}
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.pinInputArea, isFocused && styles.pinInputAreaFocused]}
              onPress={() => {
                // Focus the hidden input when tapping the PIN area
                const input = pinInputRef.current;
                if (input) {
                  input.focus();
                }
              }}
              activeOpacity={1}>
              {renderPinDots()}
              <TextInput
                ref={pinInputRef}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry={false}
                value={confirmPin}
                onChangeText={(text) => {
                  // Only allow numeric input
                  const numericText = text.replace(/[^0-9]/g, '');
                  onConfirmPinChange(numericText);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoFocus
              />
            </TouchableOpacity>
            
            <Text style={styles.pinInstruction}>
              {confirmPin.length === 0 ? 'Tap above and re-enter your PIN' : 
               confirmPin.length < 4 ? `${4 - confirmPin.length} more digits` : 'Confirm PIN'}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Security Note - Only show when there's an error */}
        {pinError && (
          <Animated.View
            style={[
              styles.securityNote,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}>
            <LinearGradient
              colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
              style={styles.securityCard}>
              <View style={styles.securityContent}>
                <AlertTriangle size={18} color="#ef4444" />
                <Text style={[styles.securityText, styles.securityTextError]}>
                  {pinError}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.continueButton, confirmPin.length < 4 && styles.continueButtonDisabled]}
            activeOpacity={0.8}
            onPress={onConfirm}
            disabled={isLoading || confirmPin.length < 4}>
            <LinearGradient
              colors={confirmPin.length === 4 ? ['#7c5cff', '#6446fe'] : ['#4a4a4a', '#3a3a3a']}
              style={styles.buttonGradient}>
              <Animated.View style={{ 
                transform: [{ translateX: shakeAnimationValue }], 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Text style={[styles.buttonText, confirmPin.length < 4 && styles.buttonTextDisabled]}>
                  {isLoading ? 'Creating Wallet...' : 'Confirm & Save Wallet'}
                </Text>
                <ArrowRight size={20} color={confirmPin.length === 4 ? "#fff" : "#9ca3af"} />
              </Animated.View>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back to Create PIN</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    marginBottom: 32,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  pinContainer: {
    marginBottom: 24,
  },
  pinCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  pinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    justifyContent: 'space-between',
  },
  pinHeaderText: {
    color: '#7c5cff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.5,
    flex: 1,
  },
  visibilityButton: {
    padding: 8,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinPosition: {
    width: 40,
    height: 40,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInputArea: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pinInputAreaFocused: {
    borderColor: 'rgba(124, 92, 255, 0.3)',
    backgroundColor: 'rgba(124, 92, 255, 0.05)',
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDotFilled: {
    backgroundColor: '#7c5cff',
    borderColor: '#7c5cff',
  },
  pinDigit: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  pinDigitLarge: {
    color: '#7c5cff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    fontSize: 16,
    textAlign: 'center',
  },
  pinInstruction: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  securityNote: {
    marginBottom: 20,
  },
  securityCard: {
    borderRadius: 12,
    padding: 16,
  },
  securityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityText: {
    flex: 1,
    color: '#22c55e',
    fontSize: 14,
    marginLeft: 12,
    opacity: 0.9,
  },
  securityTextError: {
    color: '#ef4444',
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  continueButton: {
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    marginBottom: 16,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  buttonTextDisabled: {
    color: '#9ca3af',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#7c5cff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ConfirmPinStep;
