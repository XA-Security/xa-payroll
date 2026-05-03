/**
 * Centralized Auth Logger Utility
 * Provides structured logging for all authentication flows
 * Includes timestamps, context, and log levels for easy troubleshooting
 */

export type AuthLogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface AuthLogContext {
  userId?: string;
  email?: string;
  provider?: string;
  sessionId?: string;
  [key: string]: unknown;
}

class AuthLogger {
  private context: AuthLogContext = {};
  private startTimes: Map<string, number> = new Map();
  private enableDebug: boolean;

  constructor() {
    // Check if debug mode is enabled via env var or window flag
    if (typeof window !== 'undefined') {
      const winWithDebug = window as unknown as Record<string, unknown>;
      this.enableDebug = winWithDebug.__AUTH_DEBUG__ === true;
    } else {
      this.enableDebug = process.env.AUTH_DEBUG === 'true';
    }
  }

  /**
   * Set global context that will be included in all subsequent logs
   */
  setContext(context: Partial<AuthLogContext>) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear all context
   */
  clearContext() {
    this.context = {};
  }

  /**
   * Log with timestamp and formatted output
   */
  private formatLog(level: AuthLogLevel, prefix: string, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(this.context).length > 0
      ? ` [${Object.entries(this.context)
          .map(([k, v]) => `${k}:${typeof v === 'string' ? v : JSON.stringify(v)}`)
          .join(' ')}]`
      : '';

    const logMessage = `[${timestamp}] ${level} ${prefix}${contextStr}: ${message}`;
    const logData = data && typeof data === 'object' ? { ...data } : data;

    return { logMessage, logData };
  }

  /**
   * Log at DEBUG level (only in debug mode)
   */
  debug(prefix: string, message: string, data?: unknown) {
    if (!this.enableDebug) return;
    const { logMessage, logData } = this.formatLog('DEBUG', prefix, message, data);
    console.log(`%c${logMessage}`, 'color: #999; font-size: 12px;', logData);
  }

  /**
   * Log at INFO level
   */
  info(prefix: string, message: string, data?: unknown) {
    const { logMessage, logData } = this.formatLog('INFO', prefix, message, data);
    console.log(`%c${logMessage}`, 'color: #0066cc; font-weight: bold;', logData);
  }

  /**
   * Log at WARN level
   */
  warn(prefix: string, message: string, data?: unknown) {
    const { logMessage, logData } = this.formatLog('WARN', prefix, message, data);
    console.warn(`%c${logMessage}`, 'color: #ff8800; font-weight: bold;', logData);
  }

  /**
   * Log at ERROR level
   */
  error(prefix: string, message: string, error?: Error | unknown) {
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;
    const { logMessage, logData } = this.formatLog('ERROR', prefix, message, errorData);
    console.error(`%c${logMessage}`, 'color: #cc0000; font-weight: bold;', logData);
  }

  /**
   * Start a timer for performance tracking
   */
  startTimer(label: string) {
    this.startTimes.set(label, Date.now());
  }

  /**
   * End a timer and log the duration
   * Thresholds: fetch_user_data uses 500ms (initial load can be slow), others use 100ms
   */
  endTimer(prefix: string, label: string, threshold?: number) {
    const startTime = this.startTimes.get(label);
    if (!startTime) {
      this.warn(prefix, `Timer "${label}" not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(label);

    // Use provided threshold or default based on operation
    const finalThreshold = threshold ?? (label === 'fetch_user_data' ? 500 : 100);

    const level = duration > finalThreshold ? 'warn' : 'debug';
    this[level](prefix, `${label} completed in ${duration}ms`, { duration, threshold: finalThreshold });

    return duration;
  }

  /**
   * Enable/disable debug logging
   */
  setDebugMode(enabled: boolean) {
    this.enableDebug = enabled;
    if (enabled) {
      this.info('[Auth:Logger]', 'Debug mode enabled');
    }
  }
}

// Export singleton instance
export const authLogger = new AuthLogger();

// Also export as default for convenience
export default authLogger;
