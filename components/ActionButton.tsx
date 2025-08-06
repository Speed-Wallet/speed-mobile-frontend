import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import colors from '@/constants/colors';

type ActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  backgroundColor?: string; // Added backgroundColor prop
};

const ActionButton = ({
  icon,
  label,
  onPress,
  backgroundColor,
}: ActionButtonProps) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* The View with styles.card is kept for layout purposes but will be made transparent */}
      <View style={styles.card}>
        <View
          style={[
            styles.iconContainer,
            backgroundColor ? { backgroundColor } : {},
          ]}
        >
          {icon}
        </View>
        <Text numberOfLines={1} style={styles.label}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '23%', // Keeps the button spacing
  },
  card: {
    width: '100%',
    // aspectRatio: 1, // Keep or remove depending on desired layout consistency
    // backgroundColor: 'rgba(255, 255, 255, 0.1)', // Removed background
    borderRadius: 12, // This might be irrelevant now or could be removed
    // padding: 8, // Removed padding or adjust as needed
    alignItems: 'center',
    justifyContent: 'center', // Center the icon and label vertically
    // borderWidth: 1, // Removed border
    // borderColor: 'rgba(255, 255, 255, 0.15)', // Removed border
  },
  iconContainer: {
    width: 40, // Increased size for a more prominent circular icon
    height: 40, // Increased size
    borderRadius: 20, // Half of width/height to make it circular
    // backgroundColor: 'rgba(255, 255, 255, 0.15)', // Default background removed, will be set by prop
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12, // Increased margin for better spacing from label
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
