/*
 * Hi!
 *
 * Note that this is an EXAMPLE Backstage backend. Please check the README.
 *
 * Happy hacking!
 */

import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-proxy-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-techdocs-backend'));

// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
// See https://github.com/backstage/backstage/blob/master/docs/auth/guest/provider.md

// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);

// permission plugin
backend.add(import('@backstage/plugin-permission-backend'));
backend.add(
  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);

// search plugin
backend.add(import('@backstage/plugin-search-backend'));
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));

// redhat-ai-project-space backend plugin
backend.add(import('backstage-plugin-redhat-ai-project-space-backend'));

backend.start();
