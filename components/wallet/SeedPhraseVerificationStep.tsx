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
import ActionButtonGroup from '@/components/buttons/ActionButtonGroup';
import { triggerShake } from '@/utils/animations';

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
  const [buttonState, setButtonState] = useState<
    'disabled' | 'try-again' | 'continue'
  >('disabled');
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

  useEffect(() => {
    if (selectedWords.length === words.length) {
      // Check if the selected words are in the correct order
      const correct = selectedWords.every(
        (selectedWord, index) => selectedWord === words[index],
      );
      if (correct) {
        setButtonState('continue');
      } else {
        setButtonState('try-again');
        // Trigger shake animation when user completes all words but gets them wrong
        triggerShake(shakeAnimationValue);
      }
    } else {
      setButtonState('disabled');
    }
  }, [selectedWords, words]);

  const shuffleWords = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setSelectedWords([]);
    setButtonState('disabled');
  };

  const handleWordClick = (word: string) => {
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

  const handleTryAgain = () => {
    shuffleWords();
  };

  const handleContinue = () => {
    onSuccess();
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

  const getButtonText = () => {
    switch (buttonState) {
      case 'try-again':
        return 'Try Again';
      case 'continue':
        return 'Continue';
      default:
        return 'Complete the phrase';
    }
  };

  const handleButtonPress = () => {
    if (buttonState === 'try-again') {
      handleTryAgain();
    } else if (buttonState === 'continue') {
      handleContinue();
    }
  };

  return (
    <ScreenContainer>
      {/* Development Back Button */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' && (
        <BackButton onPress={onBack} style={styles.devBackButton} />
      )}

      {/* Dev Mode Skip Button */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' && (
        <TouchableOpacity style={styles.skipButton} onPress={handleContinue}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Title and Description */}
          <Animated.View
            style={[
              styles.titleSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY }],
              },
            ]}
          >
            <Text style={styles.title}>Verify Your Seed Phrase</Text>
            <Text style={styles.description}>
              Tap the words in the correct order to verify you've saved your
              seed phrase.
            </Text>
          </Animated.View>

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
              {renderWordGrid()}

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

        {/* Action Buttons */}
        <ActionButtonGroup
          primaryTitle={getButtonText()}
          onPrimaryPress={handleButtonPress}
          primaryDisabled={isLoading || buttonState === 'disabled'}
          primaryLoading={isLoading}
          primaryVariant={
            buttonState === 'disabled'
              ? 'primary'
              : buttonState === 'try-again'
                ? 'error'
                : 'primary'
          }
          secondaryTitle="Back to Seed Phrase"
          onSecondaryPress={onBack}
          secondaryStyle="text"
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  devBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? verticalScale(50) : verticalScale(20),
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
    paddingTop: Platform.OS === 'ios' ? verticalScale(10) : verticalScale(20),
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
    top: Platform.OS === 'ios' ? verticalScale(50) : verticalScale(20),
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
});

export default SeedPhraseVerificationStep;
