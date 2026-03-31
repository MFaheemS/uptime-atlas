import pino from 'pino';

const options: pino.LoggerOptions =
  process.env['NODE_ENV'] !== 'production'
    ? {
        level: 'info',
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }
    : { level: 'info' };

export const logger = pino(options);
