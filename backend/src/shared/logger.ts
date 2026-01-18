import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || 'info';

export function createLogger(module: string) {
  return pino({
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
}

export type Logger = ReturnType<typeof createLogger>;
