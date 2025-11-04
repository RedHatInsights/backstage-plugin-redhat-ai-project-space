import {
  createPlugin,
  createComponentExtension,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { projectVotesApiRef, ProjectVotesClient } from './api/ProjectVotesApi';

export const redhatAIProjectSpacePlugin = createPlugin({
  id: 'redhat-ai-project-space',
  apis: [
    createApiFactory({
      api: projectVotesApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new ProjectVotesClient(discoveryApi, fetchApi),
    }),
  ],
});

export const AIShowcasePageComponent = redhatAIProjectSpacePlugin.provide(
  createComponentExtension({
    name: 'AIShowcasePageComponent',
    component: {
      lazy: () => import('./components/AIShowcasePage').then(m => m.AIShowcasePage),
    }
  }),
);