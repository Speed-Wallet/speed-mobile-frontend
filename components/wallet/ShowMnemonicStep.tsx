import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { verticalScale } from 'react-native-size-matters';
import SeedPhraseDisplay from '../SeedPhraseDisplay';
import PrimaryActionButton from '../buttons/PrimaryActionButton';
import IntroScreen from './IntroScreen';

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
  isLoading,
}) => {
  const [isVisible, setIsVisible] = useState(false);

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

  return (
    <IntroScreen
      title="Your Seed Phrase"
      subtitle="This is the recovery phrase for your wallet. Don't share it with anyone."
      showDevSkip={true}
      onDevSkip={onNext}
      footer={
        <PrimaryActionButton
          title="I've Saved My Phrase"
          onPress={onNext}
          disabled={isLoading}
          loading={isLoading}
        />
      }
    >
      <Animated.View
        style={[
          styles.seedPhraseContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <SeedPhraseDisplay
          seedPhrase={mnemonic}
          isVisible={isVisible}
          onToggleVisibility={() => setIsVisible(!isVisible)}
        />
      </Animated.View>
    </IntroScreen>
  );
};

const styles = StyleSheet.create({
  seedPhraseContainer: {},
});

export default ShowMnemonicStep;
