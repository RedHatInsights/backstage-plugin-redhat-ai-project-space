# AGENTS.md

## Project Overview

Red Hat AI Project Space is a Backstage plugin that provides an interactive showcase for AI/ML
projects within an organization. It consists of a frontend plugin (React-based UI with filtering,
search, voting, and a floating chat interface) and a backend plugin (Express REST API with Knex
database persistence for votes). The plugins are distributed as both static Backstage plugin packages
and as dynamic plugins for Red Hat Developer Hub via Janus-IDP.

## Dependencies

- **Runtime:** Node.js (22 or 24), Yarn
- **Frontend:** React, Material UI, Backstage plugin APIs
- **Backend:** Express, Knex, Zod, better-sqlite3 (dev), pg (production)
- **Build:** Backstage CLI, Janus-IDP CLI (dynamic plugin export)
- **Test:** Jest, Testing Library, MSW, Supertest, Playwright (E2E)

## Development Commands

See the [development section][readme-dev] in the README for the full command reference.

Key commands from the project root:

```sh
yarn install              # Install all dependencies
yarn start                # Start frontend and backend in development mode
yarn build:all            # Build all packages
yarn test                 # Run all unit tests
yarn test:all             # Run all tests with coverage
yarn lint:all             # Lint all files
yarn prettier:check       # Check formatting
./build.sh <workspace> <plugin-dir>  # Export a dynamic plugin and produce tarball
```

CI runs `yarn install --immutable` followed by unit tests for both plugin workspaces on every pull
request. Linting and formatting are not run in CI.

## Architecture

This is a Yarn Workspaces monorepo with four packages: two dev harness packages (`packages/app`,
`packages/backend`) and two plugin deliverables (`plugins/redhat-ai-project-space`,
`plugins/redhat-ai-project-space-backend`). The frontend fetches catalog entities from the Backstage
Catalog API, communicates with the backend plugin for voting operations, and proxies chat requests to
an external LLM service via Backstage's proxy plugin. For detailed data flow, database schema, and
design tradeoffs, see the [architecture documentation][architecture].

## Code Style

- **Linter:** ESLint via Backstage CLI's ESLint factory configuration. Per-package `.eslintrc.js`
  files extend `@backstage/cli/config/eslint-factory`.
- **Formatter:** Prettier via Backstage CLI's Prettier configuration (declared in root
  `package.json` as `"prettier": "@backstage/cli/config/prettier"`).
- **lint-staged** is configured in root `package.json` to run ESLint and Prettier on staged files,
  but no git hook manager (husky, lefthook) is installed to trigger it automatically.
- **EditorConfig** enforces UTF-8, LF line endings, and 2-space indentation.
- **TypeScript** is the primary language. Supported Node.js versions are 22 and 24.
- Root `.eslintrc.js` is the authoritative ESLint entry point (`root: true`).

## Common Mistakes

1. **Using `cd` instead of `yarn workspace` commands.** This is a Yarn Workspaces monorepo. Run
   plugin-specific commands with `yarn workspace backstage-plugin-redhat-ai-project-space <cmd>`
   rather than `cd plugins/redhat-ai-project-space && yarn <cmd>`.

2. **Confusing dev harness packages with plugin deliverables.** `packages/app` and
   `packages/backend` are development scaffolding, not production artifacts. The deliverables are
   the two packages under `plugins/`. Do not add production features to `packages/`.

3. **Assuming lint-staged runs on commit.** lint-staged is configured in `package.json` but no
   git hook manager is installed. Pre-commit formatting does not run automatically. Run
   `yarn lint` and `yarn prettier:check` manually before committing.

4. **Mixing MUI v4 and v5 imports in the wrong context.** The main plugin uses Material UI v4
   (`@material-ui/core`). The `FloatingChat` component uses MUI v5 (`@mui/material`) because it
   renders in a portal. Do not import MUI v5 components into non-chat components or vice versa.

5. **Forgetting the `ai` namespace filter.** The frontend only displays `Component` entities in the
   `ai` namespace. Entities without `metadata.namespace: ai` will not appear in the showcase
   regardless of their annotations.

6. **Modifying `project_votes` without updating `user_votes`.** The voting system uses denormalized
   aggregate counters. The `resetVotes` endpoint deletes aggregates but does not cascade to
   `user_votes`, which can leave orphaned records.

## Testing

- **Unit tests:** Jest via Backstage CLI. Run with `yarn test` (all) or
  `yarn workspace <name> test` (per-plugin).
- **Test utilities:** Testing Library for React component tests, MSW for API mocking, Supertest for
  backend HTTP tests.
- **E2E tests:** Playwright, configured in `playwright.config.ts` with test files in
  `packages/app/e2e-tests/`. Not run in CI. Requires the app and backend running locally.
- **Test file convention:** `*.test.ts` / `*.test.tsx` colocated with source files. Setup files
  import `@testing-library/jest-dom`.

## Deployment

Both plugins support two deployment modes:

- **Static bundling:** Standard Backstage plugin installation via `yarn build` and importing into
  a Backstage app.
- **Dynamic plugin (Red Hat Developer Hub):** Run `yarn export-dynamic` per plugin or `./build.sh`
  to produce tarballs with SHA-256 integrity hashes. The backend plugin provides a dedicated dynamic
  entry point at `plugins/redhat-ai-project-space-backend/src/dynamic/index.ts`.

[readme-dev]: ./README.md#development
[architecture]: ./ARCHITECTURE.md
