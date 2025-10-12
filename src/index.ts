import closeWithGrace from 'close-with-grace';
import hyperid from 'hyperid';
import { env } from './config';
import createServer from './server';
import { loggerConfig } from './utils/logger.util';

async function startServer() {
  const app = await createServer({
    ajv: {
      customOptions: {
        allErrors: true,
      },
    },
    routerOptions: {
      maxParamLength: 128,
    },
    logger: loggerConfig,
    genReqId: () => hyperid().uuid,
  });

  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('x-request-id', request.id);
    return payload;
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
