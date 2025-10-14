import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { Eye, EyeOff, RotateCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import ScreenContainer from '@/components/ScreenContainer';
import BackButton from '@/components/buttons/BackButton';
import WordBox from '@/components/wallet/WordBox';
import { triggerShake } from '@/utils/animations';
import IntroHeader from './IntroHeader';

interface SeedPhraseVerificationStepProps {
  words: string[];
  onBack: () => void;
  onSuccess: () => void;
  isLoading?: boolean;
}

const SeedPhraseVerificationStep: React.FC<SeedPhraseVerificationStepProps> = ({
  words,
  onBack,
  onSuccess,
  isLoading = false,
}) => {
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const shakeAnimationValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    shuffleWords();
  }, [words]);

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

  // Auto-validate when all words are selected
  useEffect(() => {
    if (selectedWords.length === words.length && !isValidating && !isLoading) {
      setIsValidating(true);

      // Use requestAnimationFrame to ensure UI updates before validation
      requestAnimationFrame(() => {
        const correct = selectedWords.every(
          (selectedWord, index) => selectedWord === words[index],
        );

        if (correct) {
          // Correct order, proceed to next step
          onSuccess();
          setIsValidating(false);
        } else {
          // Incorrect order, shake and reset
          setTimeout(() => {
            triggerShake(shakeAnimationValue);
            setSelectedWords([]);
            setIsValidating(false);
          }, 200); // Brief delay to see the complete selection
        }
      });
    }
  }, [
    selectedWords,
    words,
    isValidating,
    isLoading,
    onSuccess,
    shakeAnimationValue,
  ]);

  const shuffleWords = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setSelectedWords([]);
  };

  const handleWordClick = (word: string) => {
    // Don't allow input while validating or loading
    if (isValidating || isLoading) return;

    const isAlreadySelected = selectedWords.includes(word);

    if (isAlreadySelected) {
      // Remove word from selection
      setSelectedWords(selectedWords.filter((sw) => sw !== word));
    } else {
      // Add word to selection
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleBackspace = () => {
    if (selectedWords.length > 0) {
      setSelectedWords(selectedWords.slice(0, -1));
    }
  };

  const getWordDisplayNumber = (word: string) => {
    const selectedIndex = selectedWords.findIndex((sw) => sw === word);
    return selectedIndex >= 0 ? selectedIndex + 1 : null;
  };

  const isWordSelected = (word: string) => {
    return selectedWords.includes(word);
  };

  const renderWordGrid = () => {
    const rows = [];
    for (let i = 0; i < shuffledWords.length; i += 3) {
      const rowWords = shuffledWords.slice(i, i + 3);
      rows.push(
        <View key={i} style={styles.wordRow}>
          {rowWords.map((word, index) => {
            const isSelected = isWordSelected(word);
            const displayNumber = getWordDisplayNumber(word);

            return (
              <WordBox
                key={`${word}-${i + index}`}
                word={word}
                index={i + index}
                isVisible={isVisible}
                isSelected={isSelected}
                displayNumber={displayNumber}
                onPress={handleWordClick}
                variant="verification"
              />
            );
          })}
        </View>,
      );
    }
    return rows;
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      {/* Development Back Button */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' && (
        <BackButton onPress={onBack} style={styles.devBackButton} />
      )}

      {/* Dev Mode Skip Button */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' && (
        <TouchableOpacity style={styles.skipButton} onPress={onSuccess}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Title and Description */}
          <IntroHeader
            title="Verify Your Seed Phrase"
            subtitle="Tap the words in the correct order to verify you've saved your seed phrase."
          />

          {/* Seed Phrase Box */}
          <Animated.View
            style={[
              styles.seedPhraseContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#1a1a1a', '#1f1f1f']}
              style={styles.seedPhraseBox}
            >
              <View style={styles.seedPhraseHeader}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={shuffleWords}
                >
                  <RotateCcw size={scale(20)} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setIsVisible(!isVisible)}
                >
                  {isVisible ? (
                    <EyeOff size={scale(20)} color="#9ca3af" />
                  ) : (
                    <Eye size={scale(20)} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              </View>
              <Animated.View
                style={{ transform: [{ translateX: shakeAnimationValue }] }}
              >
                {renderWordGrid()}
              </Animated.View>

              {/* Controls Row */}
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={[
                    styles.backspaceButton,
                    selectedWords.length === 0 &&
                      styles.backspaceButtonDisabled,
                  ]}
                  onPress={handleBackspace}
                  disabled={selectedWords.length === 0}
                >
                  <Text
                    style={[
                      styles.backspaceButtonText,
                      selectedWords.length === 0 &&
                        styles.backspaceButtonTextDisabled,
                    ]}
                  >
                    ← Backspace
                  </Text>
                </TouchableOpacity>

                <Text style={styles.wordCounter}>
                  {selectedWords.length}/{words.length} words
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </ScrollView>

        {/* Back Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>Back to Seed Phrase</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  devBackButton: {
    position: 'absolute',
    top: verticalScale(50),
    left: scale(20),
    zIndex: 1000,
    backgroundColor: '#FFB800',
    borderRadius: moderateScale(20),
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    minHeight: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
  scrollView: {
    flexGrow: 1,
  },
  titleSection: {
    marginBottom: verticalScale(24),
  },
  title: {
    fontSize: moderateScale(24),
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: verticalScale(8),
    textAlign: 'left',
  },
  description: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    lineHeight: moderateScale(22),
    textAlign: 'left',
  },
  seedPhraseContainer: {
    marginBottom: verticalScale(16),
  },
  seedPhraseBox: {
    borderRadius: scale(12),
    padding: scale(12),
    marginBottom: verticalScale(16),
  },
  seedPhraseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  iconButton: {
    padding: scale(8),
  },
  wordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
    height: verticalScale(44), // Fixed height to prevent expansion
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(2),
  },
  backspaceButton: {
    padding: scale(8),
    marginRight: 4,
  },
  backspaceButtonDisabled: {
    opacity: 0.5,
  },
  backspaceButtonText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  backspaceButtonTextDisabled: {
    color: colors.textSecondary + '50',
  },
  wordCounter: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginRight: 4,
  },
  skipButton: {
    position: 'absolute',
    top: verticalScale(50),
    right: scale(20),
    zIndex: 1000,
    backgroundColor: colors.warning,
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-SemiBold',
    color: colors.backgroundDark,
  },
  bottomSection: {
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: verticalScale(12),
  },
  backButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default SeedPhraseVerificationStep;
