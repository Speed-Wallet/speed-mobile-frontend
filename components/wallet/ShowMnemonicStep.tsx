import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, SafeAreaView, Platform, Clipboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Copy, Eye, EyeOff, ShieldCheck, AlertTriangle } from 'lucide-react-native';

interface ShowMnemonicStepProps {
  mnemonic: string;
  publicKey: string;
  onNext: () => void;
  isLoading: boolean;
}

const ShowMnemonicStep: React.FC<ShowMnemonicStepProps> = ({ 
  mnemonic, 
  publicKey, 
  onNext, 
  isLoading 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  
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

  const handleCopy = async () => {
    await Clipboard.setString(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            {/* <LinearGradient
              colors={['rgba(124, 92, 255, 0.15)', 'rgba(124, 92, 255, 0.05)']}
              style={styles.headerBadge}>
              <ShieldCheck size={20} color="#7c5cff" />
              <Text style={styles.headerBadgeText}>SECURE BACKUP</Text>
            </LinearGradient> */}
            <Text style={styles.title}>Your Seed Phrase</Text>
            <Text style={styles.subtitle}>
              Write down these 12 words in order and keep them in a safe place. Never share them with anyone. <Text style={{ fontWeight: 'bold', color: '#ffffff' }}>Anyone with these words can access the funds in your wallet.</Text>
            </Text>
          </View>
        </Animated.View>

        {/* Seed Phrase Card */}
        <Animated.View
          style={[
            styles.seedPhraseContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          <LinearGradient
            colors={['#1a1a1a', '#1f1f1f']}
            style={styles.seedPhraseCard}>
            <View style={styles.seedPhraseHeader}>
              <TouchableOpacity
                style={styles.visibilityButton}
                onPress={() => setIsVisible(!isVisible)}>
                {isVisible ? (
                  <EyeOff size={20} color="#9ca3af" />
                ) : (
                  <Eye size={20} color="#9ca3af" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.copyButton, copied && styles.copyButtonActive]}
                onPress={handleCopy}>
                <Copy size={20} color={copied ? '#7c5cff' : '#9ca3af'} />
                <Text style={[styles.copyText, copied && styles.copyTextActive]}>
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.phraseGrid}>
              {mnemonic.split(' ').map((word, index) => (
                <View key={index} style={styles.wordContainer}>
                  <Text style={styles.wordNumber}>{index + 1}</Text>
                  <Text style={styles.word}>
                    {isVisible ? word : '•••'}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Warning Card */}
        {/* <Animated.View
          style={[
            styles.warningContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          <LinearGradient
            colors={['rgba(255, 176, 0, 0.15)', 'rgba(255, 176, 0, 0.05)']}
            style={styles.warningCard}>
            <View style={styles.warningContent}>
              <AlertTriangle size={42} color="#FFB800" style={styles.warningIcon} />
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningTitle}>SECURITY WARNING</Text>
                <Text style={styles.warningText}>
                  Anyone with these words can access the funds in your wallet.
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View> */}

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.8}
            onPress={onNext}
            disabled={isLoading}>
            <LinearGradient
              colors={['#7c5cff', '#6446fe']}
              style={styles.buttonGradient}>
              <Text style={styles.buttonText}>I've Saved My Phrase</Text>
              <ArrowRight size={20} color="#fff" />
            </LinearGradient>
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
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    marginBottom: 24,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  headerBadgeText: {
    color: '#7c5cff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 22,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'left',
    lineHeight: 22,
  },
  seedPhraseContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  seedPhraseCard: {
    borderRadius: 12,
    padding: 12,
  },
  seedPhraseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  visibilityButton: {
    padding: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  copyButtonActive: {
    opacity: 0.8,
  },
  copyText: {
    color: '#9ca3af',
    marginLeft: 6,
    fontSize: 14,
  },
  copyTextActive: {
    color: '#7c5cff',
  },
  phraseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  wordContainer: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  wordNumber: {
    color: '#9ca3af',
    fontSize: 12,
    marginRight: 8,
    opacity: 0.7,
  },
  word: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  warningContainer: {
    marginBottom: 24,
  },
  warningCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    marginRight: 16,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFB800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  warningText: {
    fontSize: 14,
    color: '#FFB800',
    opacity: 0.9,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  continueButton: {
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
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
});

export default ShowMnemonicStep;
