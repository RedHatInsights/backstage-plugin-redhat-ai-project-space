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
        auth: coreServices.auth,
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        database: coreServices.database,
        httpAuth: coreServices.httpAuth,
        config: coreServices.rootConfig,
      },
      async init({ auth, httpRouter, logger, database, httpAuth, config }) {
        logger.info('Initializing Red Hat AI Project Space backend plugin');

        // Get database client
        const client = await database.getClient();

        // Initialize database handler
        const databaseHandler = await DatabaseHandler.create(client);

        // Create router
        const router = await createRouter({
          auth,
          logger,
          database: databaseHandler,
          httpAuth,
          config: config,
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

