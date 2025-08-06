// Global alert utility for use outside of React components
// This provides a fallback to browser/native alerts when the custom alert system isn't available

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

let customAlertInstance: any = null;

export const setGlobalAlertInstance = (instance: any) => {
  customAlertInstance = instance;
};

export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  type?: 'success' | 'error' | 'warning' | 'info',
) => {
  if (customAlertInstance) {
    customAlertInstance.alert(title, message, buttons, type);
  } else {
    // Fallback to native alert
    if (typeof alert !== 'undefined') {
      alert(message ? `${title}: ${message}` : title);
    } else {
      console.warn('Alert:', title, message);
    }
  }
};

export const showSuccess = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => {
  showAlert(title, message, buttons, 'success');
};

export const showError = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => {
  showAlert(title, message, buttons, 'error');
};

export const showWarning = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => {
  showAlert(title, message, buttons, 'warning');
};

export const showInfo = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => {
  showAlert(title, message, buttons, 'info');
};
