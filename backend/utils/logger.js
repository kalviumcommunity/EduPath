import pino from 'pino';

// Configure the logger
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard'
    }
  },
  base: {
    env: process.env.NODE_ENV
  },
  redact: {
    paths: ['password', 'email', 'token', 'authorization'],
    censor: '[REDACTED]'
  }
});
