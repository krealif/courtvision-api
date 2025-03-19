import { MySql2Database, drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env } from '@/config';
import { logger } from '@/utils/logger';
import * as schema from './schema';

export let db: MySql2Database<typeof schema> & { $client: mysql.Pool };
export let pool: mysql.Pool;

export const initDb = async () => {
  pool = mysql.createPool({
    uri: env.DB_URL,
    connectionLimit: 5,
  });

  try {
    const connection = await pool.getConnection();
    logger.info('Connected to database');
    connection.release();
  } catch (err) {
    if (err instanceof Error) {
      logger.error(err, 'Failed to connect to database');
    }
  }

  db = drizzle(pool, { schema, mode: 'default' });
};
