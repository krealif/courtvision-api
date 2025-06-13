import { MySql2Database, drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { Logger } from 'pino';
import { env } from '@/config';
import * as schema from './db.schema';

export type DbClient = MySql2Database<typeof schema> & {
  $client: mysql.Pool;
};

export function createDbClient(logger: Logger) {
  const pool = mysql.createPool({
    uri: env.DB_URL,
    connectionLimit: 5,
  });

  const dbClient = drizzle(pool, {
    schema,
    mode: 'default',
    casing: 'snake_case',
  });

  return Object.assign(dbClient, {
    async init() {
      try {
        const connection = await pool.getConnection();
        logger.info('Connected to database');
        connection.release();
      } catch (err) {
        logger.error('Failed to connect to database');
        throw err;
      }
    },
    async close() {
      await pool.end();
    },
  });
}
