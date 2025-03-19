import Pino from 'pino';
import { NodeEnv, env } from '@/config';

export const loggerConfig = {
  level: env.LOG_LEVEL,
  redact: ['headers.authorization'],
  transport:
    env.NODE_ENV === NodeEnv.development
      ? { target: 'pino-pretty' }
      : undefined,
};

export const logger = Pino(loggerConfig);
