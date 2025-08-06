// WebSocket Connection Monitor Utility
// This can be used to debug WebSocket connection issues

interface WebSocketStats {
  connectionAttempts: number;
  successfulConnections: number;
  connectionFailures: number;
  averageConnectionDuration: number;
  lastDisconnectReason: string | null;
  lastDisconnectCode: number | null;
}

export class WebSocketMonitor {
  private stats: WebSocketStats = {
    connectionAttempts: 0,
    successfulConnections: 0,
    connectionFailures: 0,
    averageConnectionDuration: 0,
    lastDisconnectReason: null,
    lastDisconnectCode: null,
  };

  private connectionStartTimes: Map<WebSocket, number> = new Map();
  private connectionDurations: number[] = [];

  onConnectionAttempt() {
    this.stats.connectionAttempts++;
  }

  onConnectionSuccess(ws: WebSocket) {
    this.stats.successfulConnections++;
    this.connectionStartTimes.set(ws, Date.now());
  }

  onConnectionFailure(error: any) {
    this.stats.connectionFailures++;
    console.warn('WebSocket connection failed:', error);
  }

  onConnectionClose(ws: WebSocket, code: number, reason: string) {
    const startTime = this.connectionStartTimes.get(ws);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.connectionDurations.push(duration);
      this.connectionStartTimes.delete(ws);

      // Keep only last 10 durations for average calculation
      if (this.connectionDurations.length > 10) {
        this.connectionDurations.shift();
      }

      this.stats.averageConnectionDuration =
        this.connectionDurations.reduce((a, b) => a + b, 0) /
        this.connectionDurations.length;
    }

    this.stats.lastDisconnectCode = code;
    this.stats.lastDisconnectReason = reason;

    // Log concerning disconnection patterns
    if (code !== 1000) {
      console.warn(
        `WebSocket closed with non-normal code: ${code}, reason: ${reason}`,
      );
    }

    if (startTime && Date.now() - startTime < 30000) {
      console.warn('WebSocket connection was short-lived (< 30 seconds)');
    }
  }

  getStats(): WebSocketStats {
    return { ...this.stats };
  }

  getSuccessRate(): number {
    if (this.stats.connectionAttempts === 0) return 0;
    return (
      (this.stats.successfulConnections / this.stats.connectionAttempts) * 100
    );
  }

  logReport() {
    console.log('WebSocket Connection Report:', {
      ...this.getStats(),
      successRate: `${this.getSuccessRate().toFixed(1)}%`,
      avgDurationMs: Math.round(this.stats.averageConnectionDuration),
    });
  }

  reset() {
    this.stats = {
      connectionAttempts: 0,
      successfulConnections: 0,
      connectionFailures: 0,
      averageConnectionDuration: 0,
      lastDisconnectReason: null,
      lastDisconnectCode: null,
    };
    this.connectionStartTimes.clear();
    this.connectionDurations = [];
  }
}

// Export a singleton instance
export const wsMonitor = new WebSocketMonitor();

// Common WebSocket close codes and their meanings
export const WS_CLOSE_CODES = {
  1000: 'Normal Closure',
  1001: 'Going Away',
  1002: 'Protocol Error',
  1003: 'Unsupported Data',
  1004: 'Reserved',
  1005: 'No Status Received',
  1006: 'Abnormal Closure',
  1007: 'Invalid frame payload data',
  1008: 'Policy Violation',
  1009: 'Message Too Big',
  1010: 'Mandatory Extension',
  1011: 'Internal Server Error',
  1012: 'Service Restart',
  1013: 'Try Again Later',
  1014: 'Bad Gateway',
  1015: 'TLS Handshake',
} as const;

export const getCloseCodeMeaning = (code: number): string => {
  return WS_CLOSE_CODES[code as keyof typeof WS_CLOSE_CODES] || 'Unknown';
};
