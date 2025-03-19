import closeWithGrace from 'close-with-grace';
import { env } from './config';
import createServer from './server';
import { loggerConfig } from './utils/logger';

async function startServer() {
  const app = await createServer({
    logger: loggerConfig,
    ignoreTrailingSlash: true,
    ignoreDuplicateSlashes: true,
  });

  const closeListeners = closeWithGrace({ delay: 500 }, async ({ err }) => {
    if (err) {
      app.log.error({ err }, 'server closing due to error');
    } else {
      app.log.info('shutting down gracefully');
    }

    await app.close();
  });

  app.addHook('onClose', (_instance, done) => {
    closeListeners.uninstall();
    done();
  });

  await app.listen({
    host: env.APP_HOST,
    port: env.APP_PORT,
  });
}

void startServer();
