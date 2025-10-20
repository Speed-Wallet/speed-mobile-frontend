import React, { useState, useEffect } from 'react';
import Toast from '@/components/Toast';
import {
  registerToastCallback,
  unregisterToastCallback,
} from '@/services/notifications';

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    // Register the toast callback when provider mounts
    registerToastCallback(
      (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
      },
    );

    // Cleanup on unmount
    return () => {
      unregisterToastCallback();
    };
  }, []);

  return (
    <>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          visible={!!toast}
          onHide={() => setToast(null)}
          type={toast.type}
        />
      )}
    </>
  );
}
