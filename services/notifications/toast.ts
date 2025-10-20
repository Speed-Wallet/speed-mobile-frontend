// Global toast callback - will be set by ToastProvider or components using Toast
let toastCallback:
  | ((message: string, type?: 'success' | 'error' | 'info') => void)
  | null = null;

/**
 * Register a toast display callback
 * This should be called by components that render the Toast component
 */
export function registerToastCallback(
  callback: (message: string, type?: 'success' | 'error' | 'info') => void,
) {
  toastCallback = callback;
}

/**
 * Unregister the toast display callback
 */
export function unregisterToastCallback() {
  toastCallback = null;
}

/**
 * Show a toast notification using the custom Toast component
 * If no toast component is registered, logs to console as fallback
 */
export function showToast(
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
) {
  if (toastCallback) {
    toastCallback(message, type);
  } else {
    // Fallback to console if no toast component is registered
    console.warn('Toast not registered:', message);
  }
}
