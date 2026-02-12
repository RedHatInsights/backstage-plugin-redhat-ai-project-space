import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { SignInPageBlueprint } from '@backstage/plugin-app-react';
import { SignInPage } from '@backstage/core-components';

const signInPage = SignInPageBlueprint.make({
  params: {
    loader: async () => (props) => (
      <SignInPage {...props} auto={true} providers={['guest']} />
    ),
  },
});

export const authModule = createFrontendModule({
  pluginId: 'app',
  extensions: [signInPage],
});
