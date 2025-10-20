/**
 * Logging utility with environment-based levels
 * Only logs in development mode, silent in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      level: 'info',
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const requestedLevelIndex = levels.indexOf(level);

    return requestedLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    let formattedMessage = `${timestamp} ${prefix} [${level.toUpperCase()}] ${message}`;

    if (data !== undefined) {
      formattedMessage += ` ${JSON.stringify(data, null, 2)}`;
    }

    return formattedMessage;
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, error?: Error | unknown): void {
    if (this.shouldLog('error')) {
      const errorData = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;
      console.error(this.formatMessage('error', message, errorData));
    }
  }
}

// Default logger instance
export const logger = new Logger();

// Create logger with custom prefix
export const createLogger = (prefix: string): Logger => {
  return new Logger({ prefix });
};

// Export for testing or custom configuration
export { Logger };
export type { LogLevel, LoggerConfig };
