import fp from 'fastify-plugin';
import { db, initDb, pool } from '@/db';

/**
 * Database plugin to initialize and attach the database instance to Fastify.
 */
export default fp(async (fastify) => {
  await initDb();

  fastify.decorate('db', db);

  fastify.addHook('onClose', async () => {
    await pool.end();
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof db;
  }
}
