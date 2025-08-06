import React, { createContext, useContext, useEffect } from 'react';
import CustomAlert from '@/components/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { setGlobalAlertInstance } from '@/utils/globalAlert';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertContextType {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: 'success' | 'error' | 'warning' | 'info',
  ) => void;
  success: (title: string, message?: string, buttons?: AlertButton[]) => void;
  error: (title: string, message?: string, buttons?: AlertButton[]) => void;
  warning: (title: string, message?: string, buttons?: AlertButton[]) => void;
  confirm: (
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void,
  ) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: React.ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const { alertState, hideAlert, alert, success, error, warning, confirm } =
    useCustomAlert();

  const contextValue: AlertContextType = {
    alert,
    success,
    error,
    warning,
    confirm,
  };

  // Set up global alert instance for non-React contexts
  useEffect(() => {
    setGlobalAlertInstance(contextValue);
  }, [contextValue]);

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      <CustomAlert
        title={alertState.title}
        message={alertState.message}
        visible={alertState.visible}
        onDismiss={hideAlert}
        buttons={alertState.buttons}
        type={alertState.type}
        showCloseButton={alertState.showCloseButton}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

// Global Alert instance for use outside of React components
class GlobalAlert {
  private static instance: AlertContextType | null = null;

  static setInstance(instance: AlertContextType) {
    GlobalAlert.instance = instance;
  }

  static alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: 'success' | 'error' | 'warning' | 'info',
  ) {
    if (GlobalAlert.instance) {
      GlobalAlert.instance.alert(title, message, buttons, type);
    } else {
      console.warn(
        'GlobalAlert not initialized. Make sure AlertProvider is set up.',
      );
    }
  }

  static success(title: string, message?: string, buttons?: AlertButton[]) {
    if (GlobalAlert.instance) {
      GlobalAlert.instance.success(title, message, buttons);
    }
  }

  static error(title: string, message?: string, buttons?: AlertButton[]) {
    if (GlobalAlert.instance) {
      GlobalAlert.instance.error(title, message, buttons);
    }
  }

  static warning(title: string, message?: string, buttons?: AlertButton[]) {
    if (GlobalAlert.instance) {
      GlobalAlert.instance.warning(title, message, buttons);
    }
  }

  static confirm(
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void,
  ) {
    if (GlobalAlert.instance) {
      GlobalAlert.instance.confirm(title, message, onConfirm, onCancel);
    }
  }
}

export { GlobalAlert };
