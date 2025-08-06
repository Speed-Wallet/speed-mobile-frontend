import { useState, useCallback } from 'react';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info';
  showCloseButton?: boolean;
}

interface AlertState extends AlertConfig {
  visible: boolean;
}

export const useCustomAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    title: '',
    message: '',
    visible: false,
    buttons: [],
    type: 'info',
    showCloseButton: false,
  });

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertState({
      ...config,
      visible: true,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  // Convenience methods that match React Native's Alert API
  const alert = useCallback(
    (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      type?: 'success' | 'error' | 'warning' | 'info',
    ) => {
      showAlert({
        title,
        message,
        buttons: buttons || [{ text: 'OK' }],
        type: type || 'info',
      });
    },
    [showAlert],
  );

  const success = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      showAlert({
        title,
        message,
        buttons: buttons || [{ text: 'OK' }],
        type: 'success',
      });
    },
    [showAlert],
  );

  const error = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      showAlert({
        title,
        message,
        buttons: buttons || [{ text: 'OK' }],
        type: 'error',
      });
    },
    [showAlert],
  );

  const warning = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      showAlert({
        title,
        message,
        buttons: buttons || [{ text: 'OK' }],
        type: 'warning',
      });
    },
    [showAlert],
  );

  const confirm = useCallback(
    (
      title: string,
      message?: string,
      onConfirm?: () => void,
      onCancel?: () => void,
    ) => {
      showAlert({
        title,
        message,
        buttons: [
          { text: 'Cancel', style: 'cancel', onPress: onCancel },
          { text: 'OK', style: 'default', onPress: onConfirm },
        ],
        type: 'warning',
      });
    },
    [showAlert],
  );

  return {
    alertState,
    showAlert,
    hideAlert,
    alert,
    success,
    error,
    warning,
    confirm,
  };
};
