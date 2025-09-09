import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { moderateScale } from 'react-native-size-matters';
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
      <ChevronLeft size={moderateScale(20)} color="#e5e7eb" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});

export default BackButton;
