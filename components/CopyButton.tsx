import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { scale } from 'react-native-size-matters';
import { setStringAsync } from 'expo-clipboard';
import colors from '@/constants/colors';
import CopyCheckIcon from './CopyCheckIcon';

interface CopyButtonProps {
  textToCopy: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
  onCopyComplete?: () => void;
}

export interface CopyButtonRef {
  triggerCopy: () => void;
}

const CopyButton = forwardRef<CopyButtonRef, CopyButtonProps>(
  (
    {
      textToCopy,
      size = scale(18),
      color = colors.textPrimary,
      style,
      onCopyComplete,
    },
    ref,
  ) => {
    const [copied, setCopied] = useState(false);

    const handlePress = async () => {
      if (!textToCopy) return;

      await setStringAsync(textToCopy);
      setCopied(true);

      // Call optional callback
      onCopyComplete?.();

      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    };

    const triggerAnimation = () => {
      setCopied(true);

      // Call optional callback
      onCopyComplete?.();

      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    };

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      triggerCopy: triggerAnimation,
    }));

    return (
      <TouchableOpacity
        style={[styles.copyButton, style]}
        onPress={handlePress}
      >
        <CopyCheckIcon copied={copied} size={size} color={color} />
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  copyButton: {
    padding: scale(6),
  },
});

export default CopyButton;
