import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { ApiBlueprint } from '@backstage/frontend-plugin-api';
import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import { configApiRef } from '@backstage/core-plugin-api';

const scmIntegrationsApi = ApiBlueprint.make({
  name: 'scm-integrations',
  params: {
    factory: {
      api: scmIntegrationsApiRef,
      deps: { configApi: configApiRef },
      factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
    },
  },
});

const scmAuthApi = ScmAuth.createDefaultApiFactory();

export const apisModule = createFrontendModule({
  pluginId: 'app',
  extensions: [scmIntegrationsApi, scmAuthApi],
});
