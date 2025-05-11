import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import colors from '@/constants/colors';

type ActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
};

const ActionButton = ({ icon, label, onPress }: ActionButtonProps) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text numberOfLines={1} style={styles.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '23%',
  },
  card: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    color: colors.white,
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    opacity: 0.9,
    textAlign: 'center',
  },
});

export default ActionButton;