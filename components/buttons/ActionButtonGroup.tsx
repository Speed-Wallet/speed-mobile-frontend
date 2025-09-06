import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { verticalScale, moderateScale, scale } from 'react-native-size-matters';
import PrimaryActionButton from './PrimaryActionButton';

interface ActionButtonGroupProps {
  // Primary button props
  primaryTitle: string;
  onPrimaryPress: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  primaryVariant?: 'primary' | 'success' | 'error';
  primaryShowArrow?: boolean;

  // Secondary button props
  secondaryTitle: string;
  onSecondaryPress: () => void;
  secondaryStyle?: 'text' | 'outline'; // text = TouchableOpacity with text, outline = outlined button
}

const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  primaryTitle,
  onPrimaryPress,
  primaryDisabled = false,
  primaryLoading = false,
  primaryVariant = 'primary',
  primaryShowArrow = false,
  secondaryTitle,
  onSecondaryPress,
  secondaryStyle = 'text',
}) => {
  return (
    <View style={styles.buttonContainer}>
      <View style={styles.primaryButtonWrapper}>
        <PrimaryActionButton
          title={primaryTitle}
          onPress={onPrimaryPress}
          disabled={primaryDisabled}
          loading={primaryLoading}
          variant={primaryVariant}
          showArrow={primaryShowArrow}
        />
      </View>

      {secondaryStyle === 'text' ? (
        <TouchableOpacity
          style={styles.secondaryTextButton}
          onPress={onSecondaryPress}
        >
          <Text style={styles.secondaryTextButtonText}>{secondaryTitle}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.secondaryButtonWrapper}>
          <PrimaryActionButton
            title={secondaryTitle}
            onPress={onSecondaryPress}
            variant="primary"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    paddingTop: verticalScale(12),
    paddingBottom:
      Platform.OS === 'ios' ? verticalScale(20) : verticalScale(12),
  },
  primaryButtonWrapper: {
    width: '100%',
  },
  secondaryButtonWrapper: {
    width: '100%',
    marginTop: verticalScale(12),
  },
  secondaryTextButton: {
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    marginTop: verticalScale(12),
  },
  secondaryTextButtonText: {
    color: '#00CFFF',
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
});

export default ActionButtonGroup;
