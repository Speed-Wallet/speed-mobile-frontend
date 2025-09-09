import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';

interface SettingsHeaderProps {
  title: string;
  onClose: () => void;
  backgroundColor?: string;
  textColor?: string;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  title,
  onClose,
  backgroundColor = colors.backgroundMedium,
  textColor = colors.textPrimary,
}) => {
  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      <TouchableOpacity
        onPress={onClose}
        style={[styles.closeButton, { backgroundColor }]}
      >
        <X size={scale(22)} color={textColor} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(15),
  },
  title: {
    fontSize: moderateScale(18),
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SettingsHeader;
