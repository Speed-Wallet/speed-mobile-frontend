import { useState, useEffect } from 'react';

export const useOtpTimer = (expiresAt: number | null, onExpire: () => void) => {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = expiresAt - now;
      
      if (diff <= 0) {
        setRemaining(null);
        onExpire();
        return;
      }
      
      setRemaining(diff);
    };

    // Update immediately
    updateTimer();

    // Set up interval
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  return remaining;
};

export const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
