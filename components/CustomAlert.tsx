import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  title: string;
  message?: string;
  visible: boolean;
  onDismiss: () => void;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info';
  showCloseButton?: boolean;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  title,
  message,
  visible,
  onDismiss,
  buttons = [{ text: 'OK', onPress: onDismiss }],
  type = 'info',
  showCloseButton = false,
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIcon = () => {
    const iconSize = 24;
    switch (type) {
      case 'success':
        return <CheckCircle size={iconSize} color="#22c55e" />;
      case 'error':
        return <AlertTriangle size={iconSize} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={iconSize} color="#f59e0b" />;
      case 'info':
      default:
        return <Info size={iconSize} color="#3b82f6" />;
    }
  };

  const getButtonStyle = (buttonStyle: string) => {
    switch (buttonStyle) {
      case 'cancel':
        return styles.cancelButton;
      case 'destructive':
        return styles.destructiveButton;
      default:
        return styles.defaultButton;
    }
  };

  const getButtonTextStyle = (buttonStyle: string) => {
    switch (buttonStyle) {
      case 'cancel':
        return styles.cancelButtonText;
      case 'destructive':
        return styles.destructiveButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.alertContainer,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              {/* Close button */}
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onDismiss}
                >
                  <X size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}

              {/* Header with icon and title */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>{getIcon()}</View>
                <Text style={styles.title}>{title}</Text>
              </View>

              {/* Message */}
              {message && (
                <View style={styles.messageContainer}>
                  <Text style={styles.message}>{message}</Text>
                </View>
              )}

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      getButtonStyle(button.style || 'default'),
                      buttons.length > 1 &&
                        index === 0 &&
                        styles.buttonMarginRight,
                    ]}
                    onPress={() => {
                      button.onPress?.();
                      if (!button.onPress) onDismiss();
                    }}
                  >
                    <Text style={getButtonTextStyle(button.style || 'default')}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
  },
  messageContainer: {
    marginBottom: 24,
  },
  message: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonMarginRight: {
    marginRight: 8,
  },
  defaultButton: {
    backgroundColor: '#7c5cff',
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  destructiveButton: {
    backgroundColor: '#ef4444',
  },
  defaultButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomAlert;
