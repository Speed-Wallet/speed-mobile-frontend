import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff, RotateCcw } from 'lucide-react-native';
import colors from '@/constants/colors';

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
  isLoading = false 
}) => {
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<{ word: string; originalIndex: number }[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [buttonState, setButtonState] = useState<'disabled' | 'try-again' | 'continue'>('disabled');

  useEffect(() => {
    shuffleWords();
  }, [words]);

  useEffect(() => {
    if (selectedWords.length === words.length) {
      setIsComplete(true);
      // Check if the selected words are in the correct order
      const correct = selectedWords.every((selectedWord, index) => 
        selectedWord.word === words[index]
      );
      setIsCorrect(correct);
      setButtonState(correct ? 'continue' : 'try-again');
    } else {
      setIsComplete(false);
      setIsCorrect(false);
      setButtonState('disabled');
    }
  }, [selectedWords, words]);

  const shuffleWords = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setSelectedWords([]);
    setIsComplete(false);
    setIsCorrect(false);
    setButtonState('disabled');
  };

  const handleWordClick = (word: string) => {
    const originalIndex = words.indexOf(word);
    const isAlreadySelected = selectedWords.some(sw => sw.word === word);
    
    if (isAlreadySelected) {
      // Remove word from selection
      setSelectedWords(selectedWords.filter(sw => sw.word !== word));
    } else {
      // Add word to selection
      setSelectedWords([...selectedWords, { word, originalIndex }]);
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
    const selectedIndex = selectedWords.findIndex(sw => sw.word === word);
    return selectedIndex >= 0 ? selectedIndex + 1 : null;
  };

  const isWordSelected = (word: string) => {
    return selectedWords.some(sw => sw.word === word);
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
              <TouchableOpacity
                key={`${word}-${i + index}`}
                style={[
                  styles.wordItem,
                  isSelected && styles.wordItemSelected
                ]}
                onPress={() => handleWordClick(word)}
              >
                <Text style={[
                  styles.wordText,
                  isSelected && styles.wordTextSelected
                ]}>
                  {isVisible ? word : '●●●●●'}
                </Text>
                {isSelected && displayNumber && (
                  <Text style={styles.wordNumber}>{displayNumber}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }
    return rows;
  };

  const getButtonStyle = () => {
    switch (buttonState) {
      case 'try-again':
        return [styles.actionButton, styles.actionButtonError];
      case 'continue':
        return [styles.actionButton, styles.actionButtonSuccess];
      default:
        return [styles.actionButton, styles.actionButtonDisabled];
    }
  };

  const getButtonTextStyle = () => {
    switch (buttonState) {
      case 'try-again':
        return [styles.actionButtonText, styles.actionButtonTextError];
      case 'continue':
        return [styles.actionButtonText, styles.actionButtonTextSuccess];
      default:
        return [styles.actionButtonText, styles.actionButtonTextDisabled];
    }
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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={20} color={colors.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => setIsVisible(!isVisible)}
            >
              {isVisible ? (
                <EyeOff size={20} color={colors.textSecondary} />
              ) : (
                <Eye size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.iconButton} onPress={shuffleWords}>
              <RotateCcw size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Title and Description */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Verify Your Seed Phrase</Text>
          <Text style={styles.description}>
            Tap the words in the correct order to verify you've saved your seed phrase.
          </Text>
        </View>

        {/* Seed Phrase Box */}
        <View style={styles.seedPhraseContainer}>
          <Text style={styles.seedPhraseTitle}>Your Seed Phrase</Text>
          <View style={styles.seedPhraseBox}>
            {renderWordGrid()}
          </View>
          
          {/* Controls Row */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[
                styles.backspaceButton,
                selectedWords.length === 0 && styles.backspaceButtonDisabled
              ]}
              onPress={handleBackspace}
              disabled={selectedWords.length === 0}
            >
              <Text style={[
                styles.backspaceButtonText,
                selectedWords.length === 0 && styles.backspaceButtonTextDisabled
              ]}>
                ← Backspace
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.wordCounter}>
              {selectedWords.length}/{words.length} words
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={getButtonStyle()}
            onPress={handleButtonPress}
            disabled={buttonState === 'disabled' || isLoading}
          >
            <Text style={getButtonTextStyle()}>
              {getButtonText()}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    minHeight: '100%',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 8,
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    lineHeight: 24,
  },
  seedPhraseContainer: {
    marginBottom: 32,
  },
  seedPhraseTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  seedPhraseBox: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.backgroundLight,
  },
  wordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  wordItem: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.backgroundLight,
  },
  wordItemSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  wordText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  wordTextSelected: {
    color: colors.primary,
  },
  wordNumber: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 20,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backspaceButton: {
    padding: 8,
  },
  backspaceButtonDisabled: {
    opacity: 0.5,
  },
  backspaceButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  backspaceButtonTextDisabled: {
    color: colors.textSecondary + '50',
  },
  wordCounter: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  actionButtonContainer: {
    paddingBottom: 32,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonSuccess: {
    backgroundColor: colors.primary,
  },
  actionButtonError: {
    backgroundColor: colors.error,
  },
  actionButtonDisabled: {
    backgroundColor: colors.backgroundMedium,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.white,
  },
  actionButtonTextSuccess: {
    color: colors.white,
  },
  actionButtonTextError: {
    color: colors.white,
  },
  actionButtonTextDisabled: {
    color: colors.textSecondary,
  },
});

export default SeedPhraseVerificationStep;
