import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { scale } from 'react-native-size-matters';
import colors from '@/constants/colors';

interface BackButtonProps {
  style?: ViewStyle;
  onPress?: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ style, onPress }) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.backButton, style]}>
      <ArrowLeft size={scale(20)} color={colors.textPrimary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: colors.backgroundMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BackButton;
