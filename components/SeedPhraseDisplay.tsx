import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';
import { scale, moderateScale } from 'react-native-size-matters';
import WordBox from '@/components/wallet/WordBox';
import CopyButton from '@/components/CopyButton';

interface SeedPhraseDisplayProps {
  seedPhrase: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const SeedPhraseDisplay: React.FC<SeedPhraseDisplayProps> = ({
  seedPhrase,
  isVisible,
  onToggleVisibility,
}) => {
  const words = seedPhrase.split(' ');

  return (
    <LinearGradient
      colors={['#1a1a1a', '#1f1f1f']}
      style={styles.seedPhraseCard}
    >
      <View style={styles.seedPhraseHeader}>
        <CopyButton textToCopy={seedPhrase} size={scale(20)} color="#9ca3af" />
        <TouchableOpacity
          style={styles.visibilityButton}
          onPress={onToggleVisibility}
        >
          {isVisible ? (
            <EyeOff size={scale(20)} color="#9ca3af" />
          ) : (
            <Eye size={scale(20)} color="#9ca3af" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.phraseGrid}>
        {words.map((word, index) => (
          <WordBox
            key={index}
            word={word}
            index={index}
            isVisible={isVisible}
            variant="display"
          />
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  seedPhraseCard: {
    borderRadius: moderateScale(16),
    padding: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  seedPhraseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  visibilityButton: {
    padding: scale(8),
  },
  phraseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default SeedPhraseDisplay;
