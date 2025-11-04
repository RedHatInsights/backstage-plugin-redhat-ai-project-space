import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';
import { DatabaseHandler } from './database/DatabaseHandler';

/**
 * Red Hat AI Project Space backend plugin
 *
 * @public
 */
export const redhatAiProjectSpacePlugin = createBackendPlugin({
  pluginId: 'redhat-ai-project-space-backend',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        database: coreServices.database,
      },
      async init({ httpRouter, logger, database }) {
        logger.info('Initializing Red Hat AI Project Space backend plugin');

        // Get database client
        const client = await database.getClient();

        // Initialize database handler
        const databaseHandler = await DatabaseHandler.create(client);

        // Create router
        const router = await createRouter({
          logger,
          database: databaseHandler,
        });

        // Register the router
        httpRouter.use(router);
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });

        logger.info('Red Hat AI Project Space backend plugin initialized');
      },
    });
  },
});

