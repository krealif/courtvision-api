import envSchema from 'env-schema';
import { Static, Type } from '@sinclair/typebox';

export enum NodeEnv {
  development = 'development',
  production = 'production',
  test = 'test',
}

enum LogLevel {
  debug = 'debug',
  info = 'info',
  warn = 'warn',
  error = 'error',
}

const schema = Type.Object({
  // App Config
  NODE_ENV: Type.Enum(NodeEnv, { default: NodeEnv.production }),
  LOG_LEVEL: Type.Enum(LogLevel, { default: LogLevel.info }),
  JWT_SECRET: Type.String(),
  APP_HOST: Type.String({ default: 'localhost' }),
  APP_PORT: Type.Number({ default: 3000 }),
  ALLOWED_ORIGIN: Type.Optional(Type.String()),

  // Database Config
  DB_HOST: Type.String(),
  DB_PORT: Type.Number({ default: 3306 }),
  DB_DATABASE: Type.String(),
  DB_USER: Type.String(),
  DB_PASSWORD: Type.String(),
});

const env = envSchema<Static<typeof schema>>({
  dotenv: true,
  schema,
});

export default {
  ...env,
  DB_URL: `mysql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_DATABASE}`,
};
