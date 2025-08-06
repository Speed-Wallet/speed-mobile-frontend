/**
 * Legacy Alert API compatibility layer
 * This provides a drop-in replacement for React Native's Alert.alert API
 * Import this instead of Alert from 'react-native' in your components
 */

import { useAlert } from '@/providers/AlertProvider';
import {
  showAlert,
  showError,
  showSuccess,
  showWarning,
} from '@/utils/globalAlert';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

export class Alert {
  /**
   * Drop-in replacement for Alert.alert()
   * For use in React components with AlertProvider context
   */
  static alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ): void {
    showAlert(title, message, buttons, 'info');
  }

  /**
   * Show success alert
   */
  static success(
    title: string,
    message?: string,
    buttons?: AlertButton[],
  ): void {
    showSuccess(title, message, buttons);
  }

  /**
   * Show error alert
   */
  static error(title: string, message?: string, buttons?: AlertButton[]): void {
    showError(title, message, buttons);
  }

  /**
   * Show warning alert
   */
  static warning(
    title: string,
    message?: string,
    buttons?: AlertButton[],
  ): void {
    showWarning(title, message, buttons);
  }
}

/**
 * Hook version for React components
 * Use this in components that are wrapped with AlertProvider
 */
export const useAlertCompat = () => {
  const { alert, success, error, warning, confirm } = useAlert();

  return {
    alert,
    success,
    error,
    warning,
    confirm,
    // Legacy Alert.alert compatibility
    Alert: {
      alert,
      success,
      error,
      warning,
    },
  };
};
