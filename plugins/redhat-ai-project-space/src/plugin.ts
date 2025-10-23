import {
  createPlugin,
  createComponentExtension
} from '@backstage/core-plugin-api';

export const redhatAIProjectSpacePlugin = createPlugin({
  id: 'redhat-ai-project-space',
});

export const AIShowcasePageComponent = redhatAIProjectSpacePlugin.provide(
  createComponentExtension({
    name: 'AIShowcasePageComponent',
    component: {
      lazy: () => import('./components/AIShowcasePage').then(m => m.AIShowcasePage),
    }
  }),
);