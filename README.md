# Red Hat AI Project Space Dynamic Plugin

This is a development mono-repo for the Red Hat AI Project Space RHDH plugin. This mono-repo was created using @backstage/create-app to provide a backend and frontend for the plugin to integrate with.

Included Plugin: 
* Red Hat AI Project Space: `plugins/redhat-ai-project-space` - AI Showcase page component 

## Components

### Page Component
This plugin provides a page component for the AI Showcase:

* `AIShowcasePageComponent`: A page to showcase AI capabilities and features


## RHDH Dynamic Plugin Config
Here's an example of how to configure the plugin in your dynamic plugins config for RHDH.

```yaml
  - package: "backstage-plugin-redhat-ai-project-space-1.6.7.tgz"
    disabled: false
    pluginConfig:
      dynamicPlugins:
        frontend:
          backstage-plugin-redhat-ai-project-space:
            dynamicRoutes:
              - path: /ai-showcase
                importName: AIShowcasePageComponent
                menuItem:
                  icon: extension
                  text: AI Showcase
```
## Development
> [!NOTE]
> `sqlite` dependencies for local dev require python 3.11 or higher. You can use a global python manager like `pyenv`. Python is **not** required for running in RHDH.

To set up your local development environment, copy the `catalog_default` directory to `catalog`. The plugin is configured to load entity files from the `catalog` directory. This structure separates your local development work from the repository, ensuring that experimental or temporary changes are not accidentally committed to version control.
```sh
cp -r catalog_default catalog
```

To start the app, run:

```sh
yarn install
yarn dev
```

Before you do, you'll likely want to have catalog entries to see the plugin working on. Check out AppStage for that. 

## Updating Backstage Deps and Node Version
Over time you'll need to upgrade deps, and those may require node version bumps too. To update backstage deps simply run:

```
yarn backstage-cli versions:bump <Backstage Version>
```

That will update the frontend and backend backstage code, as well as all of the deps for the frontend, backend, and plugins. 

Part of the upgrade process will install deps. If any fail you may need to change node versions. First install the version of node you need. I recommend using [NVM](https://github.com/nvm-sh/nvm) for that. Then edit the `engines.node` value in the monorepo `package.json`.

After updating backstage I recommend you attempt building all plugins with `make build-all` and adjust the build script if anything changed like command output, paths, etc. You should also run all tests with `yarn test` to make sure all tests are still passing. Finally, don't forget to bump your node version in the `.github/workflows/test.yml` file!

### Build the Dynamic Plugin
Run `make build-plugin` - the plugin tarballs will appear under `builds/`. There will be a directory for each plugin, and 2 files for each: the plugin tarball and a text file with the integrity SHA.

