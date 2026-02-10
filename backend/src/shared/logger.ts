import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || 'info';

export function createLogger(module: string) {
  const baseLogger = pino({
    name: module,
    level: logLevel,
    ...(isDevelopment && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    }),
  });

  // Extend the base logger with custom methods
  return Object.assign(baseLogger, {
    logError(error: Error, context: Record<string, any> = {}) {
      baseLogger.error({
        errorType: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        timestamp: new Date().toISOString(),
        ...context,
      });
    },

    logPerformance(operation: string, duration: number, context: Record<string, any> = {}) {
      baseLogger.info({
        operation,
        duration,
        durationMs: duration,
        memory: process.memoryUsage().heapUsed,
        memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        timestamp: new Date().toISOString(),
        ...context,
      });
    },
  });
}

export type Logger = ReturnType<typeof createLogger>;
